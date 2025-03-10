import express from 'express';
import db from '../db';

const router = express.Router();

interface Task {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  dependencies?: string;
}

interface TaskWithDependencies extends Omit<Task, 'dependencies'> {
  dependencies: string[];
}

// Get all tasks
router.get('/', (req, res) => {
  db.all<Task>(
    `SELECT t.*, GROUP_CONCAT(td.depends_on_task_id) as dependencies
     FROM tasks t
     LEFT JOIN task_dependencies td ON t.id = td.task_id
     GROUP BY t.id`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const tasks = rows.map(row => ({
        ...row,
        dependencies: row.dependencies ? row.dependencies.split(',') : []
      }));
      
      res.json({ tasks });
    }
  );
});

// Get specific task
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  db.get<Task>(
    `SELECT t.*, GROUP_CONCAT(td.depends_on_task_id) as dependencies
     FROM tasks t
     LEFT JOIN task_dependencies td ON t.id = td.task_id
     WHERE t.id = ?
     GROUP BY t.id`,
    [taskId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const task = {
        ...row,
        dependencies: row.dependencies ? row.dependencies.split(',') : []
      };
      
      res.json(task);
    }
  );
});

// Get valid task ordering
router.get('/ordering', (req, res) => {
  interface DependencyRow {
    id: string;
    depends_on_task_id: string | null;
  }

  // First, get all tasks and their dependencies
  db.all<DependencyRow>(
    `SELECT t.id, td.depends_on_task_id
     FROM tasks t
     LEFT JOIN task_dependencies td ON t.id = td.task_id`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Build dependency graph
      const graph: Map<string, Set<string>> = new Map();
      const inDegree: Map<string, number> = new Map();
      
      rows.forEach(row => {
        if (!graph.has(row.id)) {
          graph.set(row.id, new Set());
          inDegree.set(row.id, 0);
        }
        
        if (row.depends_on_task_id) {
          graph.get(row.id)?.add(row.depends_on_task_id);
          inDegree.set(row.id, (inDegree.get(row.id) || 0) + 1);
        }
      });

      // Topological sort using Kahn's algorithm
      const queue: string[] = [];
      const result: string[] = [];

      // Add all nodes with no dependencies to queue
      for (const [node, degree] of inDegree) {
        if (degree === 0) queue.push(node);
      }

      while (queue.length > 0) {
        const node = queue.shift()!;
        result.push(node);

        for (const [dependent] of graph) {
          if (graph.get(dependent)?.has(node)) {
            inDegree.set(dependent, (inDegree.get(dependent) || 0) - 1);
            if (inDegree.get(dependent) === 0) {
              queue.push(dependent);
            }
          }
        }
      }

      // Check for cycles
      if (result.length !== graph.size) {
        return res.status(400).json({ error: 'Circular dependency detected' });
      }

      res.json(result);
    }
  );
});

export default router; 