const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const managerModel = require('../models/managerModel');
const { validatePan, normalizeMobile, checkMissingKeys } = require('../utils/validators');

// helper to get current ISO timestamp
function nowISO() {
  return new Date().toISOString();
}

module.exports = {
  // create a new user
  createUser: (req, res) => {
    try {
      const required = ['full_name', 'mob_num', 'pan_num', 'manager_id'];
      const missing = checkMissingKeys(req.body, required);
      if (missing.length) {
        return res.status(400).json({ success: false, message: 'Missing keys: ' + missing.join(', ') });
      }

      let { full_name, mob_num, pan_num, manager_id } = req.body;

      // validations
      if (!full_name || String(full_name).trim() === '') {
        return res.status(400).json({ success:false, message: 'full_name must not be empty' });
      }

      mob_num = normalizeMobile(String(mob_num));
      if (!mob_num) {
        return res.status(400).json({ success:false, message: 'Invalid mobile number' });
      }

      pan_num = String(pan_num).toUpperCase();
      if (!validatePan(pan_num)) {
        return res.status(400).json({ success:false, message: 'Invalid PAN number' });
      }

      // check manager active
      const manager = managerModel.getManagerById(manager_id);
      if (!manager || manager.is_active !== 1) {
        return res.status(400).json({ success:false, message: 'manager_id is not valid or not active' });
      }

      const user_id = uuidv4();
      const created_at = nowISO();

      const user = {
        user_id,
        full_name,
        mob_num,
        pan_num,
        manager_id,
        created_at,
        updated_at: created_at,
        is_active: 1
      };

      userModel.createUser(user);

      return res.json({ success: true, message: 'User created', data: { user_id } });
    } catch (err) {
      console.error('createUser error', err);
      return res.status(500).json({ success:false, message: 'Internal server error' });
    }
  },

  // get users (filters: user_id, mob_num, manager_id) - if no filters -> all users
  getUsers: (req, res) => {
    try {
      const { user_id, mob_num, manager_id } = req.body || {};
      let users = [];

      if (user_id) {
        const u = userModel.getUserById(user_id);
        if (u) users.push(u);
      } else if (mob_num) {
        const normalized = normalizeMobile(String(mob_num));
        const u = userModel.getUserByMobile(normalized);
        if (u) users.push(u);
      } else if (manager_id) {
        users = userModel.getUsersByManager(manager_id);
      } else {
        users = userModel.getAllUsers();
      }

      return res.json({ success:true, users: users || [] });
    } catch (err) {
      console.error('getUsers error', err);
      return res.status(500).json({ success:false, message: 'Internal server error' });
    }
  },

  // delete user by user_id or mob_num
  deleteUser: (req, res) => {
    try {
      const required = ['user_id', 'mob_num'];
      // we accept either user_id or mob_num - check if both missing
      if (!req.body.user_id && !req.body.mob_num) {
        return res.status(400).json({ success:false, message: 'Provide user_id or mob_num' });
      }

      let deleted = false;
      if (req.body.user_id) {
        deleted = userModel.deleteUserById(req.body.user_id);
      } else {
        const normalized = normalizeMobile(String(req.body.mob_num));
        deleted = userModel.deleteUserByMobile(normalized);
      }

      if (deleted) {
        return res.json({ success:true, message: 'User deleted' });
      } else {
        return res.status(404).json({ success:false, message: 'User not found' });
      }
    } catch (err) {
      console.error('deleteUser error', err);
      return res.status(500).json({ success:false, message: 'Internal server error' });
    }
  },

  // update user(s)
  updateUser: (req, res) => {
    try {
      const required = ['user_ids', 'update_data'];
      const missing = checkMissingKeys(req.body, required);
      if (missing.length) {
        return res.status(400).json({ success:false, message: 'Missing keys: ' + missing.join(', ') });
      }

      const { user_ids, update_data } = req.body;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ success:false, message: 'user_ids must be a non-empty array' });
      }

      // If bulk update only contains manager_id -> allow bulk
      const upKeys = Object.keys(update_data);
      if (upKeys.length === 0) {
        return res.status(400).json({ success:false, message: 'update_data must have keys to update' });
      }

      // If manager_id change only (bulk)
      if (upKeys.length === 1 && upKeys[0] === 'manager_id') {
        const newManagerId = update_data.manager_id;
        const manager = managerModel.getManagerById(newManagerId);
        if (!manager || manager.is_active !== 1) {
          return res.status(400).json({ success:false, message: 'New manager_id invalid or inactive' });
        }
        // update each user: if has manager already -> mark existing as inactive and create new entry with same data but new manager
        user_ids.forEach(uid => {
          const existing = userModel.getUserById(uid);
          if (existing) {
            // mark existing inactive
            userModel.markUserInactive(uid);
            // create new user record with same details but new user_id and updated manager_id
            const newUser = {
              user_id: uuidv4(),
              full_name: existing.full_name,
              mob_num: existing.mob_num,
              pan_num: existing.pan_num,
              manager_id: newManagerId,
              created_at: nowISO(),
              updated_at: nowISO(),
              is_active: 1
            };
            userModel.createUser(newUser);
          }
        });
        return res.json({ success:true, message: 'Manager updated for provided users' });
      }

      // For other updates (single/maybe multiple), we apply validations per user and update in place
      // Only allow updates for fields: full_name, mob_num, pan_num, manager_id
      const allowed = ['full_name', 'mob_num', 'pan_num', 'manager_id'];

      for (const uid of user_ids) {
        const existing = userModel.getUserById(uid);
        if (!existing) continue; // skip if not found

        const updates = {};
        for (const k of allowed) {
          if (update_data[k] !== undefined) {
            updates[k] = update_data[k];
          }
        }

        // run validations similar to create
        if (updates.full_name !== undefined) {
          if (!updates.full_name || String(updates.full_name).trim() === '') {
            return res.status(400).json({ success:false, message: 'full_name must not be empty' });
          }
        }

        if (updates.mob_num !== undefined) {
          const normalized = normalizeMobile(String(updates.mob_num));
          if (!normalized) {
            return res.status(400).json({ success:false, message: 'Invalid mobile number in update' });
          }
          updates.mob_num = normalized;
        }

        if (updates.pan_num !== undefined) {
          const p = String(updates.pan_num).toUpperCase();
          if (!validatePan(p)) {
            return res.status(400).json({ success:false, message: 'Invalid PAN in update' });
          }
          updates.pan_num = p;
        }

        if (updates.manager_id !== undefined) {
          const manager = managerModel.getManagerById(updates.manager_id);
          if (!manager || manager.is_active !== 1) {
            return res.status(400).json({ success:false, message: 'manager_id in update is invalid or inactive' });
          }
          // If changing manager but user already had a manager -> mark current inactive and create new entry
          if (existing.manager_id && existing.manager_id !== updates.manager_id) {
            userModel.markUserInactive(uid);
            const newUser = {
              user_id: uuidv4(),
              full_name: updates.full_name || existing.full_name,
              mob_num: updates.mob_num || existing.mob_num,
              pan_num: updates.pan_num || existing.pan_num,
              manager_id: updates.manager_id,
              created_at: nowISO(),
              updated_at: nowISO(),
              is_active: 1
            };
            userModel.createUser(newUser);
            continue;
          }
        }

        // otherwise perform in-place update
        updates.updated_at = nowISO();
        userModel.updateUser(uid, updates);
      }

      return res.json({ success:true, message: 'Update operation completed' });
    } catch (err) {
      console.error('updateUser error', err);
      return res.status(500).json({ success:false, message: 'Internal server error' });
    }
  }
};
