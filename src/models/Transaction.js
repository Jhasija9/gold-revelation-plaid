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

  // NEW METHODS FOR CREDIT CARD TRANSACTIONS

  // Find by Authorize.Net transaction ID
  async findByAuthorizeNetTransactionId(transactionId) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('authorize_net_transaction_id', transactionId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Transaction find by Authorize.Net ID error:', error);
      return { success: false, error: error.message };
    }
  }

  // Find credit card transactions by user
  async findCreditCardTransactionsByUserId(userId, limit = 10, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_method', 'credit_card')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Credit card transactions find error:', error);
      return { success: false, error: error.message };
    }
  }

  // Find bank transfer transactions by user
  async findBankTransferTransactionsByUserId(userId, limit = 10, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_method', 'bank_transfer')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Bank transfer transactions find error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction statistics by payment method
  async getTransactionStatsByPaymentMethod(userId) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('payment_method, amount, status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        credit_card: { count: 0, total_amount: 0, completed: 0 },
        bank_transfer: { count: 0, total_amount: 0, completed: 0 }
      };

      data.forEach(transaction => {
        const method = transaction.payment_method || 'bank_transfer';
        stats[method].count++;
        stats[method].total_amount += parseFloat(transaction.amount);
        if (transaction.status === 'completed') {
          stats[method].completed++;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Transaction stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update credit card transaction
  async updateCreditCardTransaction(id, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('payment_method', 'credit_card')
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Credit card transaction update error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new Transaction();
