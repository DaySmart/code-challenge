import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

let db: sqlite3.Database;

export function initializeDb(testDb?: sqlite3.Database): sqlite3.Database {
  if (testDb) {
    db = testDb;
  } else {
    db = new sqlite3.Database('tasks.db');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
  }
  return db;
}

export function getDb(): sqlite3.Database {
  if (!db) {
    initializeDb();
  }
  return db;
}

export default getDb; 