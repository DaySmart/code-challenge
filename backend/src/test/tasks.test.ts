import request from 'supertest';
import express from 'express';
import { Database } from 'sqlite3';
import { createTestDb, clearDb, getQuery } from './helpers';
import { initializeDb } from '../db';
import taskRoutes from '../routes/tasks';

describe('Task API Integration Tests', () => {
  let app: express.Application;
  let testDb: Database;

  beforeAll(() => {
    testDb = createTestDb();
    initializeDb(testDb);
    
    app = express();
    app.use(express.json());
    app.use('/tasks', taskRoutes);
  });

  beforeEach(async () => {
    await clearDb(testDb);
    
    // Verify database is empty
    const tasksAfter = await getQuery(testDb, 'SELECT * FROM tasks');
    const depsAfter = await getQuery(testDb, 'SELECT * FROM task_dependencies');
    expect(tasksAfter).toHaveLength(0);
    expect(depsAfter).toHaveLength(0);
  });

  afterAll((done) => {
    testDb.close(done);
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Test Task',
        description: 'Test Description',
        dependencies: []
      });
      expect(response.body.id).toBeDefined();
    });
  });

  describe('GET /tasks/ordering', () => {
    it('should return tasks in correct topological order', async () => {
      // Create tasks with dependencies
      const task1Response = await request(app)
        .post('/tasks')
        .send({ title: 'Task 1' });
      expect(task1Response.status).toBe(201);
      const task1Id = task1Response.body.id;

      const task2Response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Task 2',
          dependencies: [task1Id]
        });
      expect(task2Response.status).toBe(201);
      const task2Id = task2Response.body.id;

      const task3Response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Task 3',
          dependencies: [task2Id]
        });
      expect(task3Response.status).toBe(201);
      const task3Id = task3Response.body.id;

      const orderingResponse = await request(app).get('/tasks/ordering');
      expect(orderingResponse.status).toBe(200);
      expect(orderingResponse.body).toEqual([task1Id, task2Id, task3Id]);
    });

    it('should detect circular dependencies', async () => {
      // Create tasks first
      const task1Response = await request(app)
        .post('/tasks')
        .send({ title: 'Task 1' });
      const task1Id = task1Response.body.id;

      const task2Response = await request(app)
        .post('/tasks')
        .send({ title: 'Task 2' });
      const task2Id = task2Response.body.id;

      // Now create the circular dependency
      await request(app)
        .put(`/tasks/${task1Id}/dependencies`)
        .send({ dependencies: [task2Id] });

      await request(app)
        .put(`/tasks/${task2Id}/dependencies`)
        .send({ dependencies: [task1Id] });

      const response = await request(app).get('/tasks/ordering');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Circular dependency detected'
      });
    });

    it('should handle complex dependency graphs', async () => {
      const taskA = await request(app)
        .post('/tasks')
        .send({ title: 'Task A' });

      const taskB = await request(app)
        .post('/tasks')
        .send({ title: 'Task B' });

      const taskC = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Task C',
          dependencies: [taskA.body.id, taskB.body.id]
        });

      const taskD = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Task D',
          dependencies: [taskB.body.id]
        });

      const response = await request(app).get('/tasks/ordering');
      expect(response.status).toBe(200);
      
      const order = response.body;
      const indexA = order.indexOf(taskA.body.id);
      const indexB = order.indexOf(taskB.body.id);
      const indexC = order.indexOf(taskC.body.id);
      const indexD = order.indexOf(taskD.body.id);

      expect(indexC).toBeGreaterThan(indexA);
      expect(indexC).toBeGreaterThan(indexB);
      expect(indexD).toBeGreaterThan(indexB);
    });
  });
}); 