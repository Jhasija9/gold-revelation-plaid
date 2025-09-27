const { createClient } = require("@supabase/supabase-js");

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) throw error;
      return { success: true, message: "Database connected successfully" };
    } catch (error) {
      console.error("Database connection error:", error);
      return { success: false, error: error.message };
    }
  }

  // Generic query method
  async query(table, operation, data = {}) {
    try {
      let result;

      switch (operation) {
        case "select":
          result = await this.supabase
            .from(table)
            .select(data.columns || "*")
            .match(data.where || {});
          break;

        case "insert":
          result = await this.supabase.from(table).insert(data.values).select();
          break;

        case "update":
          result = await this.supabase
            .from(table)
            .update(data.values)
            .match(data.where)
            .select();
          break;

        case "delete":
          result = await this.supabase.from(table).delete().match(data.where);
          break;

        case "upsert":
          result = await this.supabase
            .from(table)
            .upsert(data.data, { onConflict: 'id' })
            .select();
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.error) throw result.error;
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Database query error:", error);
      return { success: false, error: error.message };
    }
  }
  // src/services/databaseService.js  (add below your existing class methods)
  async selectOne(table, where = {}, columns = "*") {
    const q = this.supabase.from(table).select(columns).match(where).limit(1);
    const { data, error } = await q;
    if (error) throw error;
    return data?.[0] || null;
  }

  async insertOne(table, values, returning = "*") {
    const { data, error } = await this.supabase
      .from(table)
      .insert(values) // values can be an object or array of 1
      .select(returning)
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async updateOne(table, where, patch, returning = "*") {
    const { data, error } = await this.supabase
      .from(table)
      .update(patch)
      .match(where)
      .select(returning)
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
}

module.exports = new DatabaseService();
