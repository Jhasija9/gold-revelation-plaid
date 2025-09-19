// src/models/LinkSession.js
const db = require("../services/databaseService");
const TABLE = "link_sessions";

module.exports = {
  async create({ id, user_id, expires_at, ip, user_agent }) {
    const row = { user_id, ip, user_agent };
    if (id) row.id = id;
    if (expires_at) row.expires_at = expires_at;

    const result = await db.query(TABLE, "insert", { values: [row] }); // <- uses your service
    if (!result.success)
      throw new Error(`link_sessions.insert failed: ${result.error}`);
    return Array.isArray(result.data) ? result.data[0] : result.data;
  },

  async getById(id) {
    const result = await db.query(TABLE, "select", {
      columns: "id, user_id, used, expires_at",
      where: { id },
    });
    if (!result.success)
      throw new Error(`link_sessions.select failed: ${result.error}`);
    const rows = result.data || [];
    return rows[0] || null; // return null if not found
  },

  async markUsed(id) {
    const result = await db.query(TABLE, "update", {
      values: { used: true, used_at: new Date().toISOString() },
      where: { id },
    });
    if (!result.success)
      throw new Error(`link_sessions.update failed: ${result.error}`);
    const rows = result.data || [];
    return rows[0] || null;
  },
};
