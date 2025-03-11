import request from 'supertest';
import { Database } from 'sqlite3';
import { initializeDb } from '../src/db';
import express from 'express';
import taskRoutes from '../src/routes/tasks';

async function populateExampleData() {
  // Initialize database and start server
  const db = new Database('tasks.db');
  initializeDb(db);
  
  const app = express();
  app.use(express.json());
  app.use('/tasks', taskRoutes);
  

  try {
    // Create some example tasks
    const task1 = await request(app)
      .post('/tasks')
      .send({
        title: 'Setup Development Environment',
        description: 'Install necessary tools and dependencies'
      });

    const task2 = await request(app)
      .post('/tasks')
      .send({
        title: 'Design Database Schema',
        description: 'Create ERD and define table structures'
      });


    const task3 = await request(app)
      .post('/tasks')
      .send({
        title: 'Implement Authentication',
        description: 'Add user login and registration',
        dependencies: [task1.body.id]
      });


    const task4 = await request(app)
      .post('/tasks')
      .send({
        title: 'Create API Documentation',
        description: 'Document all endpoints using OpenAPI/Swagger',
        dependencies: [task2.body.id, task3.body.id]
      });

    console.log('Example data populated successfully!');
    console.log('Created tasks:');
    console.log('1.', task1.body.title);
    console.log('2.', task2.body.title);
    console.log('3.', task3.body.title);
    console.log('4.', task4.body.title);

  } catch (error) {
    console.error('Error populating example data:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  }
}

populateExampleData(); 