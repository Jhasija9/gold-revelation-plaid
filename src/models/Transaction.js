const { createClient } = require('@supabase/supabase-js');

class Transaction {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  async create(transactionData) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Transaction creation error:', error);
      return { success: false, error: error.message };
    }
  }

  async findByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Transaction find error:', error);
      return { success: false, error: error.message };
    }
  }

  async findById(id) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Transaction find error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateStatus(id, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Transaction update error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new Transaction();
