

const Database = require('better-sqlite3');
const dbFile = process.env.DB_FILE || './data/user_management.db';

function getDb() {
  return new Database(dbFile);
}

module.exports = {
  createUser: (user) => {
    const db = getDb();
    const stmt = db.prepare(`INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
                             VALUES (@user_id, @full_name, @mob_num, @pan_num, @manager_id, @created_at, @updated_at, @is_active)`);
    stmt.run(user);
    db.close();
  },

  getUserById: (user_id) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);
    db.close();
    return row;
  },

  getUserByMobile: (mob_num) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE mob_num = ?').get(mob_num);
    db.close();
    return row;
  },

  getUsersByManager: (manager_id) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM users WHERE manager_id = ?').all(manager_id);
    db.close();
    return rows;
  },

  getAllUsers: () => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM users').all();
    db.close();
    return rows;
  },

  deleteUserById: (user_id) => {
    const db = getDb();
    const res = db.prepare('DELETE FROM users WHERE user_id = ?').run(user_id);
    db.close();
    return res.changes > 0;
  },

  deleteUserByMobile: (mob_num) => {
    const db = getDb();
    const res = db.prepare('DELETE FROM users WHERE mob_num = ?').run(mob_num);
    db.close();
    return res.changes > 0;
  },

  markUserInactive: (user_id) => {
    const db = getDb();
    const res = db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE user_id = ?').run(new Date().toISOString(), user_id);
    db.close();
    return res.changes > 0;
  },

  updateUser: (user_id, updates) => {
    const db = getDb();
    // build a simple dynamic update query
    const keys = Object.keys(updates);
    const setClauses = keys.map(k => `${k} = @${k}`).join(', ');
    const stmt = db.prepare(`UPDATE users SET ${setClauses} WHERE user_id = @user_id`);
    updates.user_id = user_id; // param
    const res = stmt.run(updates);
    db.close();
    return res.changes > 0;
  }
};
