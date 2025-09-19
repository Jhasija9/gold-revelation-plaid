// src/models/LinkSession.js
const db = require('../services/databaseService');

const TABLE = 'link_sessions';

module.exports = {
  async create({ id, user_id, expires_at, ip, user_agent }) {
    const payload = { user_id, ip, user_agent };
    if (id) payload.id = id;
    if (expires_at) payload.expires_at = expires_at; // DB default is now()+15m
    return db.insert(TABLE, payload);
  },

  async getById(id) {
    // We read used/expires_at here; freshness checks happen in the route
    return db.selectOne(TABLE, { id },
      'id, user_id, used, expires_at'
    );
  },

  async markUsed(id) {
    return db.update(TABLE, { id }, {
      used: true,
      used_at: new Date().toISOString()
    });
  }
};
