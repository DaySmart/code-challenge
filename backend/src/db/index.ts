import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const db = new sqlite3.Database('tasks.db');

// Initialize database with schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db; 