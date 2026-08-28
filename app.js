(() => {
  "use strict";

  const FORMAT_VERSION = 1;
  const STORAGE_KEY = "kanban-board-v1";
  const COLORS = ["", "#4f78c4", "#7a5ab5", "#c45b62", "#d18b35", "#4a9270"];

  const elements = {
    board: document.querySelector("#board"),
    boardName: document.querySelector("#board-name"),
    addColumn: document.querySelector("#add-column"),
    newBoard: document.querySelector("#new-board"),
    loadBoard: document.querySelector("#load-board"),
    saveBoard: document.querySelector("#save-board"),
    fileInput: document.querySelector("#file-input"),
    columnTemplate: document.querySelector("#column-template"),
    taskTemplate: document.querySelector("#task-template"),
    taskDialog: document.querySelector("#task-dialog"),
    taskForm: document.querySelector("#task-form"),
    dialogTitle: document.querySelector("#task-dialog-title"),
    taskTitle: document.querySelector("#task-title"),
    taskDescription: document.querySelector("#task-description"),
    colorOptions: document.querySelector("#color-options"),
    deleteTask: document.querySelector("#delete-task"),
    cancelTask: document.querySelector("#cancel-task"),
    closeDialog: document.querySelector("#close-dialog"),
    toast: document.querySelector("#toast")
  };

  let state = loadLocalBoard() || createStarterBoard();
  let taskEditor = null;
  let draggedColumnId = null;
  let draggedTask = null;
  let toastTimer = null;

  function uniqueId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function createStarterBoard() {
    return {
      version: FORMAT_VERSION,
      name: "My Board",
      columns: [
        { id: uniqueId("column"), name: "To do", tasks: [] },
        { id: uniqueId("column"), name: "In progress", tasks: [] },
        { id: uniqueId("column"), name: "Done", tasks: [] }
      ]
    };
  }

  function loadLocalBoard() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? validateBoard(JSON.parse(saved)) : null;
    } catch (_error) {
      return null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      // The board still works if storage is unavailable (for example in private mode).
    }
  }

  function commit(message) {
    persist();
    render();
    if (message) showToast(message);
  }

  function render() {
    elements.boardName.value = state.name;
    elements.board.replaceChildren(...state.columns.map(renderColumn));
  }

  function renderColumn(column) {
    const node = elements.columnTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.columnId = column.id;

    const nameInput = node.querySelector(".column-name");
    nameInput.value = column.name;
    nameInput.addEventListener("input", () => {
      column.name = nameInput.value;
      persist();
    });
    nameInput.addEventListener("blur", () => {
      if (!column.name.trim()) {
        column.name = "Untitled column";
        nameInput.value = column.name;
        persist();
      }
    });
    nameInput.addEventListener("pointerdown", (event) => event.stopPropagation());

    const count = node.querySelector(".task-count");
    count.textContent = String(column.tasks.length);
    count.setAttribute("aria-label", `${column.tasks.length} ${column.tasks.length === 1 ? "task" : "tasks"}`);

    const taskList = node.querySelector(".task-list");
    taskList.dataset.columnId = column.id;
    taskList.replaceChildren(...column.tasks.map((task) => renderTask(column, task)));
    wireTaskDropZone(taskList);

    node.querySelector(".add-task").addEventListener("click", () => openTaskEditor(column.id));

    const menu = node.querySelector(".column-menu");
    node.querySelector(".column-menu-button").addEventListener("click", (event) => {
      event.stopPropagation();
      closeColumnMenus(menu);
      menu.hidden = !menu.hidden;
    });
    node.querySelector(".delete-column").addEventListener("click", () => deleteColumn(column.id));

    node.addEventListener("dragstart", (event) => {
      if (event.target.closest(".task")) return;
      draggedColumnId = column.id;
      node.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", column.id);
    });
    node.addEventListener("dragend", () => {
      draggedColumnId = null;
      clearDragClasses();
    });
    node.addEventListener("dragover", (event) => {
      if (!draggedColumnId || draggedColumnId === column.id) return;
      event.preventDefault();
      const side = event.clientX < node.getBoundingClientRect().left + node.offsetWidth / 2 ? "before" : "after";
      clearColumnDropClasses();
      node.classList.add(`drop-${side}`);
    });
    node.addEventListener("drop", (event) => {
      if (!draggedColumnId || draggedColumnId === column.id) return;
      event.preventDefault();
      event.stopPropagation();
      const side = event.clientX < node.getBoundingClientRect().left + node.offsetWidth / 2 ? "before" : "after";
      moveColumn(draggedColumnId, column.id, side);
    });

    return node;
  }

  function renderTask(column, task) {
    const node = elements.taskTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.taskId = task.id;
    node.dataset.columnId = column.id;
    node.querySelector(".task-title").textContent = task.title;
    node.querySelector(".task-description").textContent = task.description;
    node.querySelector(".task-color").style.backgroundColor = task.color || "transparent";
    node.setAttribute("aria-label", `${task.title}. Press Enter to edit.`);

    node.addEventListener("click", () => openTaskEditor(column.id, task.id));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openTaskEditor(column.id, task.id);
      }
    });
    node.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      draggedTask = { taskId: task.id, columnId: column.id };
      node.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", task.id);
    });
    node.addEventListener("dragend", () => {
      draggedTask = null;
      clearDragClasses();
    });
    node.addEventListener("dragover", (event) => {
      if (!draggedTask || draggedTask.taskId === task.id) return;
      event.preventDefault();
      event.stopPropagation();
      const side = event.clientY < node.getBoundingClientRect().top + node.offsetHeight / 2 ? "before" : "after";
      clearTaskDropClasses();
      node.classList.add(`drop-${side}`);
    });
    node.addEventListener("drop", (event) => {
      if (!draggedTask || draggedTask.taskId === task.id) return;
      event.preventDefault();
      event.stopPropagation();
      const side = event.clientY < node.getBoundingClientRect().top + node.offsetHeight / 2 ? "before" : "after";
      moveTask(draggedTask, column.id, task.id, side);
    });
    return node;
  }

  function wireTaskDropZone(taskList) {
    taskList.addEventListener("dragover", (event) => {
      if (!draggedTask || event.target.closest(".task")) return;
      event.preventDefault();
      taskList.classList.add("drag-over");
    });
    taskList.addEventListener("dragleave", (event) => {
      if (!taskList.contains(event.relatedTarget)) taskList.classList.remove("drag-over");
    });
    taskList.addEventListener("drop", (event) => {
      if (!draggedTask || event.target.closest(".task")) return;
      event.preventDefault();
      event.stopPropagation();
      moveTask(draggedTask, taskList.dataset.columnId, null, "after");
    });
  }

  function moveColumn(sourceId, targetId, side) {
    const sourceIndex = state.columns.findIndex((column) => column.id === sourceId);
    const source = state.columns.splice(sourceIndex, 1)[0];
    let targetIndex = state.columns.findIndex((column) => column.id === targetId);
    if (side === "after") targetIndex += 1;
    state.columns.splice(targetIndex, 0, source);
    draggedColumnId = null;
    commit();
  }

  function moveTask(source, targetColumnId, targetTaskId, side) {
    const sourceColumn = state.columns.find((column) => column.id === source.columnId);
    const targetColumn = state.columns.find((column) => column.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return;
    const sourceIndex = sourceColumn.tasks.findIndex((task) => task.id === source.taskId);
    if (sourceIndex < 0) return;
    const task = sourceColumn.tasks.splice(sourceIndex, 1)[0];
    let targetIndex = targetTaskId
      ? targetColumn.tasks.findIndex((candidate) => candidate.id === targetTaskId)
      : targetColumn.tasks.length;
    if (targetIndex < 0) targetIndex = targetColumn.tasks.length;
    if (side === "after" && targetTaskId) targetIndex += 1;
    targetColumn.tasks.splice(targetIndex, 0, task);
    draggedTask = null;
    commit();
  }

  function addColumn() {
    const column = { id: uniqueId("column"), name: "New column", tasks: [] };
    state.columns.push(column);
    commit();
    const input = elements.board.querySelector(`[data-column-id="${CSS.escape(column.id)}"] .column-name`);
    input?.focus();
    input?.select();
  }

  function deleteColumn(columnId) {
    const column = state.columns.find((candidate) => candidate.id === columnId);
    if (!column) return;
    const detail = column.tasks.length ? ` and its ${column.tasks.length} task${column.tasks.length === 1 ? "" : "s"}` : "";
    if (!window.confirm(`Delete “${column.name}”${detail}?`)) return;
    state.columns = state.columns.filter((candidate) => candidate.id !== columnId);
    commit("Column deleted");
  }

  function openTaskEditor(columnId, taskId = null) {
    const column = state.columns.find((candidate) => candidate.id === columnId);
    const task = taskId ? column?.tasks.find((candidate) => candidate.id === taskId) : null;
    if (!column) return;
    taskEditor = { columnId, taskId };
    elements.dialogTitle.textContent = task ? "Edit task" : "Add task";
    elements.taskTitle.value = task?.title || "";
    elements.taskDescription.value = task?.description || "";
    elements.deleteTask.hidden = !task;
    renderColorOptions(task?.color || "");
    elements.taskDialog.showModal();
    elements.taskTitle.focus();
  }

  function renderColorOptions(selectedColor) {
    const availableColors = selectedColor && !COLORS.includes(selectedColor)
      ? [...COLORS, selectedColor]
      : COLORS;
    elements.colorOptions.replaceChildren(...availableColors.map((color, index) => {
      const label = document.createElement("label");
      label.className = `color-choice${color ? "" : " color-none"}`;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "color";
      input.value = color;
      input.checked = color === selectedColor;
      const swatch = document.createElement("span");
      swatch.className = "color-swatch";
      swatch.style.setProperty("--swatch", color || "transparent");
      swatch.title = color ? `Color ${index}` : "No color";
      label.append(input, swatch);
      return label;
    }));
  }

  function saveTask() {
    if (!taskEditor) return;
    const wasEditing = Boolean(taskEditor.taskId);
    const title = elements.taskTitle.value.trim();
    if (!title) return;
    const column = state.columns.find((candidate) => candidate.id === taskEditor.columnId);
    if (!column) return;
    const values = {
      title,
      description: elements.taskDescription.value.trim(),
      color: elements.taskForm.elements.color.value
    };
    if (taskEditor.taskId) {
      const task = column.tasks.find((candidate) => candidate.id === taskEditor.taskId);
      if (task) Object.assign(task, values);
    } else {
      column.tasks.push({ id: uniqueId("task"), ...values });
    }
    closeTaskEditor();
    commit(wasEditing ? "Task updated" : "Task added");
  }

  function deleteEditedTask() {
    if (!taskEditor?.taskId) return;
    const column = state.columns.find((candidate) => candidate.id === taskEditor.columnId);
    const task = column?.tasks.find((candidate) => candidate.id === taskEditor.taskId);
    if (!task || !window.confirm(`Delete “${task.title}”?`)) return;
    column.tasks = column.tasks.filter((candidate) => candidate.id !== task.id);
    closeTaskEditor();
    commit("Task deleted");
  }

  function closeTaskEditor() {
    elements.taskDialog.close();
    taskEditor = null;
  }

  function newBoard() {
    const hasContent = state.columns.some((column) => column.tasks.length) || state.name !== "My Board";
    if (hasContent && !window.confirm("Start a new board? Unsaved changes can still be saved first.")) return;
    state = createStarterBoard();
    commit("New board created");
  }

  function saveBoard() {
    const json = `${JSON.stringify(state, null, 2)}\n`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = state.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "board";
    link.href = url;
    link.download = `${safeName}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Board saved");
  }

  async function loadBoardFile(file) {
    try {
      const parsed = JSON.parse(await file.text());
      state = validateBoard(parsed);
      commit("Board loaded");
    } catch (error) {
      window.alert(`Could not load this board. ${error.message}`);
    } finally {
      elements.fileInput.value = "";
    }
  }

  function validateBoard(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The file does not contain a board.");
    if (value.version !== FORMAT_VERSION) throw new Error(`Unsupported board version: ${String(value.version)}.`);
    if (typeof value.name !== "string" || !Array.isArray(value.columns)) throw new Error("The board structure is invalid.");

    const ids = new Set();
    const clean = { version: FORMAT_VERSION, name: value.name.slice(0, 100) || "Untitled Board", columns: [] };
    for (const rawColumn of value.columns) {
      if (!rawColumn || typeof rawColumn !== "object" || typeof rawColumn.name !== "string" || !Array.isArray(rawColumn.tasks)) {
        throw new Error("A column is invalid.");
      }
      const columnId = validUniqueId(rawColumn.id, "column", ids);
      const column = { id: columnId, name: rawColumn.name.slice(0, 80) || "Untitled column", tasks: [] };
      for (const rawTask of rawColumn.tasks) {
        if (!rawTask || typeof rawTask !== "object" || typeof rawTask.title !== "string") throw new Error("A task is invalid.");
        const color = typeof rawTask.color === "string" && (/^#[0-9a-f]{6}$/i.test(rawTask.color) || rawTask.color === "") ? rawTask.color : "";
        column.tasks.push({
          id: validUniqueId(rawTask.id, "task", ids),
          title: rawTask.title.slice(0, 160) || "Untitled task",
          description: typeof rawTask.description === "string" ? rawTask.description.slice(0, 2000) : "",
          color
        });
      }
      clean.columns.push(column);
    }
    return clean;
  }

  function validUniqueId(value, prefix, ids) {
    const id = typeof value === "string" && value && !ids.has(value) ? value : uniqueId(prefix);
    ids.add(id);
    return id;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 1800);
  }

  function closeColumnMenus(except = null) {
    document.querySelectorAll(".column-menu").forEach((menu) => {
      if (menu !== except) menu.hidden = true;
    });
  }

  function clearTaskDropClasses() {
    document.querySelectorAll(".task.drop-before, .task.drop-after").forEach((node) => node.classList.remove("drop-before", "drop-after"));
  }

  function clearColumnDropClasses() {
    document.querySelectorAll(".column.drop-before, .column.drop-after").forEach((node) => node.classList.remove("drop-before", "drop-after"));
  }

  function clearDragClasses() {
    document.querySelectorAll(".dragging, .drop-before, .drop-after, .drag-over").forEach((node) => {
      node.classList.remove("dragging", "drop-before", "drop-after", "drag-over");
    });
  }

  elements.boardName.addEventListener("input", () => {
    state.name = elements.boardName.value;
    persist();
  });
  elements.boardName.addEventListener("blur", () => {
    if (!state.name.trim()) {
      state.name = "Untitled Board";
      elements.boardName.value = state.name;
      persist();
    }
  });
  elements.addColumn.addEventListener("click", addColumn);
  elements.newBoard.addEventListener("click", newBoard);
  elements.saveBoard.addEventListener("click", saveBoard);
  elements.loadBoard.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", () => {
    const [file] = elements.fileInput.files;
    if (file) loadBoardFile(file);
  });
  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTask();
  });
  elements.deleteTask.addEventListener("click", deleteEditedTask);
  elements.cancelTask.addEventListener("click", closeTaskEditor);
  elements.closeDialog.addEventListener("click", closeTaskEditor);
  elements.taskDialog.addEventListener("click", (event) => {
    if (event.target === elements.taskDialog) closeTaskEditor();
  });
  elements.taskDialog.addEventListener("close", () => {
    taskEditor = null;
  });
  document.addEventListener("click", () => closeColumnMenus());

  render();
})();
