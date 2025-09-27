// src/models/managerModel.js
// #models - manager queries for validation

const Database = require('better-sqlite3');
const dbFile = process.env.DB_FILE || './data/user_management.db';

function getDb() {
  return new Database(dbFile);
}

module.exports = {
  getManagerById: (manager_id) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM managers WHERE manager_id = ?').get(manager_id);
    db.close();
    return row;
  },

  // a helper in case you want to list managers
  getAllManagers: () => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM managers').all();
    db.close();
    return rows;
  }
};
