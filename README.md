# Kanban Board

A small personal Kanban board that runs entirely in the browser. It uses plain HTML, CSS, and JavaScript—there is no backend, build step, package manager, or external dependency.

## Run the app

Open [`index.html`](index.html) in a modern desktop browser.

No installation is required. If you prefer to serve the files locally, any static file server will work, but the application does not require one.

## Features

- Create a fresh board and rename it from the page header.
- Add, rename, delete, and drag columns into a new order.
- Add tasks with a title, optional description, and optional color.
- Click a task, or focus it and press Enter or Space, to edit it.
- Delete tasks from the task editor.
- Drag tasks within a column or between columns to reorder them.
- Save a complete board as a human-readable JSON file.
- Load a previously saved board from JSON.
- Keep the current board automatically in the browser's local storage.

## Using the board

### Columns

Select a column name to edit it directly. Use **Add column** to create another column, and drag a column by its header to change its position. The three-dot menu contains the delete action. Deleting a column also deletes its tasks, so the app asks for confirmation first.

### Tasks

Use **Add task** at the bottom of a column. A title is required; the description and color are optional. Select an existing task to edit or delete it.

Drag a task onto another task to place it before or after that task. Drop it into the open area of a column to place it at the end.

### Starting, saving, and loading boards

- **New board** resets the workspace to the default three columns.
- **Save JSON** starts a standard browser download containing the current board.
- **Load** imports a board file and replaces the current workspace after validating its structure and format version.

The active board is also written to `localStorage` after changes. This convenience copy is specific to the browser and page origin; use **Save JSON** for a portable backup or to move a board between browsers.

#### Choosing a download location

The app cannot override the browser's download preferences. To choose a folder whenever you save a board, enable the browser setting that prompts for a location. Otherwise, the JSON file is saved in the configured Downloads folder.

This option is available in the major modern desktop browsers:

- **Chrome:** **Settings → Downloads → Ask where to save each file before downloading** ([Chrome Help](https://support.google.com/chrome/answer/95759)).
- **Edge:** open `edge://settings/downloads`, then enable **Ask me what to do with each download** ([Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/development/download-failures)).
- **Firefox:** **Settings → General → Files and Applications → Downloads → Always ask you where to save files** ([Firefox Help](https://support.mozilla.org/en-US/kb/manage-downloads-preferences-using-downloads-menu)).
- **Safari on Mac:** **Safari → Settings → General → File download location → Ask for each download** ([Safari User Guide](https://support.apple.com/guide/safari/general-ibrw1072/mac)).

Browser-managed or organization-managed settings can override these choices.

## Board file format

Board files use format version `1`. IDs are unique and independent of names, so renaming a task or column does not change its identity.

```json
{
  "version": 1,
  "name": "My Board",
  "columns": [
    {
      "id": "column-unique-id",
      "name": "To do",
      "tasks": [
        {
          "id": "task-unique-id",
          "title": "Example task",
          "description": "Optional details",
          "color": "#4f78c4"
        }
      ]
    }
  ]
}
```

An empty string represents no description or no color. Loading rejects unsupported versions and structurally invalid files. Duplicate or missing IDs are replaced with new unique IDs during import.

## Project structure

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | Page structure, controls, templates, and task editor |
| [`styles.css`](styles.css) | Board layout, visual design, drag states, and responsive styles |
| [`app.js`](app.js) | State management, editing, drag and drop, persistence, and JSON validation |
| [`favicon.svg`](favicon.svg) | Browser tab icon |
| [`task.md`](task.md) | Original product specification |

## Browser support

The app relies on browser-native APIs including HTML drag and drop, `<dialog>`, `localStorage`, `crypto.randomUUID`, `Blob`, and file input APIs. Current versions of Chrome, Edge, Firefox, and Safari are recommended. The layout is designed primarily for normal desktop screen sizes.
