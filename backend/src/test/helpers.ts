import { Database } from 'sqlite3';
import fs from 'fs';
import path from 'path';

export function createTestDb(): Database {
  const db = new Database(':memory:');
  const schema = fs.readFileSync(path.join(__dirname, '../../src/db/schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

export function clearDb(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        db.exec(`
          BEGIN TRANSACTION;
          DELETE FROM task_dependencies;
          DELETE FROM tasks;
          COMMIT;
        `, (err) => {
          if (err) {
            db.exec('ROLLBACK;', () => reject(err));
          } else {
            resolve();
          }
        });
      } catch (err) {
        db.exec('ROLLBACK;', () => reject(err));
      }
    });
  });
}

export function getQuery<T>(db: Database, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
} 