// src/db/initDb.js
// #db - initialize the sqlite DB and create tables + seed managers

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.DB_FILE || './data/user_management.db';

function initDb() {
  // ensure data directory exists
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_FILE);

  // create managers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS managers (
      manager_id TEXT PRIMARY KEY,
      name TEXT,
      is_active INTEGER DEFAULT 1
    )
  `).run();

  // create users table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      mob_num TEXT,
      pan_num TEXT,
      manager_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (manager_id) REFERENCES managers(manager_id)
    )
  `).run();

  // seed managers if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM managers').get().cnt;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO managers (manager_id, name, is_active) VALUES (?, ?, ?)');
    // sample manager ids - beginner friendly UUID strings (you can replace with real UUIDs)
    insert.run('11111111-1111-1111-1111-111111111111', 'Alice Manager', 1);
    insert.run('22222222-2222-2222-2222-222222222222', 'Bob Manager', 1);
    insert.run('33333333-3333-3333-3333-333333333333', 'Carol Inactive', 0); // inactive manager sample
    console.log('Seeded managers table with sample data.');
  }

  db.close();
}

module.exports = initDb;
