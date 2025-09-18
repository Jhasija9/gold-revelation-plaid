const { createClient } = require('@supabase/supabase-js');

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
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;
      return { success: true, message: 'Database connected successfully' };
    } catch (error) {
      console.error('Database connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generic query method
  async query(table, operation, data = {}) {
    try {
      let result;
      
      switch (operation) {
        case 'select':
          result = await this.supabase
            .from(table)
            .select(data.columns || '*')
            .match(data.where || {});
          break;
          
        case 'insert':
          result = await this.supabase
            .from(table)
            .insert(data.values)
            .select();
          break;
          
        case 'update':
          result = await this.supabase
            .from(table)
            .update(data.values)
            .match(data.where)
            .select();
          break;
          
        case 'delete':
          result = await this.supabase
            .from(table)
            .delete()
            .match(data.where);
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.error) throw result.error;
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DatabaseService();
