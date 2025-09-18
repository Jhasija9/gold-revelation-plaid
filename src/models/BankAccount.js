const { createClient } = require('@supabase/supabase-js');
const { encryptToken, decryptToken } = require('../utils/encryption');

class BankAccount {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  async create(bankAccountData) {
    try {
      // Encrypt sensitive data
      const encryptedToken = encryptToken(bankAccountData.plaid_access_token);
      const encryptedAccountNumber = encryptToken(bankAccountData.account_number);

      const accountData = {
        ...bankAccountData,
        plaid_access_token: JSON.stringify(encryptedToken),
        account_number_encrypted: encryptedAccountNumber.encrypted
      };

      const { data, error } = await this.supabase
        .from('bank_accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Bank account creation error:', error);
      return { success: false, error: error.message };
    }
  }

  async findByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Bank account find error:', error);
      return { success: false, error: error.message };
    }
  }

  async findById(id) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Bank account find error:', error);
      return { success: false, error: error.message };
    }
  }

  async getDecryptedToken(bankAccountId) {
    try {
      const { data, error } = await this.supabase
        .from('bank_accounts')
        .select('plaid_access_token')
        .eq('id', bankAccountId)
        .single();

      if (error) throw error;
      
      const decryptedToken = decryptToken(JSON.parse(data.plaid_access_token));
      return { success: true, data: decryptedToken };
    } catch (error) {
      console.error('Token decryption error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BankAccount();
