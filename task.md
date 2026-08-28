# Kanban Board

## Product Overview

The goal of this mini project is to create a simple, lightweight Kanban board for personal use.

The application should prioritize simplicity, ease of use, and portability. It should not require a backend, database server, build system, or external framework.

## Product Specification

* The application should run entirely in the browser using only HTML, CSS, and JavaScript.
* The application should not require installation or a backend server.
* The user should be able to create a new board.
* The user should be able to create columns and give them custom names.
* The user should be able to rename columns.
* The user should be able to delete columns.
* The user should be able to reorder columns.
* The user should be able to create tasks inside columns.
* Each task should have at least:

  * a title
  * an optional description
  * an optional color
* The user should be able to edit existing tasks.
* The user should be able to delete tasks.
* The user should be able to freely move tasks between columns using drag and drop.
* The user should be able to reorder tasks within the same column.
* The user should be able to choose a color for each task.
* The user should be able to save a board to a local file.
* The user should be able to load a previously saved board from a local file.
* Boards should use JSON as their save format.
* The JSON format should contain a format/version field so the structure can be changed in the future.
* Saving and loading should preserve:

  * board name
  * column names
  * column order
  * tasks
  * task order
  * task descriptions
  * task colors

## User Interface

* Keep the interface minimal and easy to understand.
* The board should occupy most of the available browser window.
* Columns should be displayed horizontally.
* The page should support horizontal scrolling when there are more columns than fit on the screen.
* Actions such as creating a task or column should require as few clicks as possible.
* Avoid unnecessary dialogs and configuration screens.
* Use a clean, simple visual style.
* The application should work well on normal desktop screen sizes.

## Technical Constraints

* Use plain HTML, CSS, and JavaScript.
* Do not use React, Vue, Angular, or other frontend frameworks.
* Do not require Node.js, npm, or a build step.
* Do not use a backend or external database.
* Keep the implementation small and easy to understand.
* Avoid unnecessary abstractions and dependencies.
* Prefer browser-native APIs where possible.

## Board File Format

Each board should be stored as a single human-readable JSON file.

Example structure:

```json
{
  "version": 1,
  "name": "My Board",
  "columns": [
    {
      "id": "todo",
      "name": "To Do",
      "tasks": [
        {
          "id": "task-1",
          "title": "Example task",
          "description": "",
          "color": "#4f46e5"
        }
      ]
    }
  ]
}
```

Identifiers should be unique and should not depend on column or task names.

## Scope

This is intentionally a small personal project.

Do not add features such as:

* user accounts
* authentication
* collaboration
* cloud synchronization
* comments
* notifications
* permissions
* complex project management functionality

unless explicitly requested later.
