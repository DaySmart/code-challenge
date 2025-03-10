# Task Management API Specification

This document describes the REST API endpoints for the task management system.

## Base URL

```
https://localhost:3000/
```

## Endpoints

### Tasks

#### GET /tasks
Retrieve all tasks.

Response:
```json
{
  "tasks": [
    {
      "id": "task-123",
      "title": "Complete project proposal",
      "description": "Write and review project proposal document",
      "dependencies": ["task-456", "task-789"],
      "created_at": "2024-03-20T10:00:00Z",
      "updated_at": "2024-03-20T10:00:00Z"
    }
  ]
}
```

#### GET /tasks/{taskId}
Retrieve a specific task by ID.

Response:
```json
{
  "id": "task-123",
  "title": "Complete project proposal",
  "description": "Write and review project proposal document",
  "dependencies": ["task-456", "task-789"],
  "created_at": "2024-03-20T10:00:00Z",
  "updated_at": "2024-03-20T10:00:00Z"
}
```

#### GET /tasks/ordering
Get a valid ordering of tasks that respects all dependencies.

Response:
```json
["task-789", "task-456", "task-123"]
```
