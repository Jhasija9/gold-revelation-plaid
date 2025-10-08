const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;
const databaseService = require('./databaseService');

class SettlementService {
  constructor() {
    console.log('🔧 SettlementService: Constructor called');
    
    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.transactionKey = process.env.ANET_TRANSACTION_KEY;
    this.environment = process.env.ANET_ENV === 'production' 
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;

    this.isConfigured = !!(this.apiLoginId && this.transactionKey);
    
    if (!this.isConfigured) {
      console.warn('⚠️ SettlementService: Authorize.Net not configured');
    } else {
      console.log('✅ SettlementService: Ready for settlement tracking');
    }
  }

  getMerchantAuthentication() {
    const merchantAuth = new ApiContracts.MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);
    return merchantAuth;
  }

  async getSettledBatchList(date) {
    try {
      console.log(`🔍 SettlementService: Getting settled batches for ${date}`);
      
      const request = new ApiContracts.GetSettledBatchListRequest();
      request.setMerchantAuthentication(this.getMerchantAuthentication());
      request.setIncludeStatistics(true);
      request.setFirstSettlementDate(date);
      request.setLastSettlementDate(date);

      const controller = new ApiControllers.GetSettledBatchListController(request.getJSON(), {
        logger: { enabled: false, location: './', level: 'error' },
        proxy: { setProxy: false, proxyUrl: '' },
        timeout: 120000,
        environment: this.environment
      });

      const raw = await new Promise((resolve, reject) => {
        controller.execute(() => {
          try { resolve(controller.getResponse()); }
          catch (e) { reject(e); }
        });
      });

      const response = new ApiContracts.GetSettledBatchListResponse(raw);
      const batches = response.getBatchList()?.getBatch() || [];
      
      console.log(`📦 SettlementService: Found ${batches.length} settled batches`);
      return batches;
      
    } catch (error) {
      console.error('❌ SettlementService: Error getting settled batch list:', error);
      throw error;
    }
  }

  async getTransactionList(batchId) {
    try {
      console.log(`🔍 SettlementService: Getting transactions for batch ${batchId}`);
      
      const request = new ApiContracts.GetTransactionListRequest();
      request.setMerchantAuthentication(this.getMerchantAuthentication());
      request.setBatchId(batchId);

      const controller = new ApiControllers.GetTransactionListController(request.getJSON(), {
        logger: { enabled: false, location: './', level: 'error' },
        proxy: { setProxy: false, proxyUrl: '' },
        timeout: 120000,
        environment: this.environment
      });

      const raw = await new Promise((resolve, reject) => {
        controller.execute(() => {
          try { resolve(controller.getResponse()); }
          catch (e) { reject(e); }
        });
      });

      const response = new ApiContracts.GetTransactionListResponse(raw);
      const transactions = response.getTransactions()?.getTransaction() || [];
      
      console.log(`📋 SettlementService: Found ${transactions.length} transactions in batch`);
      return transactions;
      
    } catch (error) {
      console.error('❌ SettlementService: Error getting transaction list:', error);
      throw error;
    }
  }

  async updateTransactionStatus(transactionId, status) {
    try {
      const result = await databaseService.query('transactions', 'update', {
        where: { authorize_net_transaction_id: transactionId },
        values: { status: status }
      });
      
      console.log(`✅ SettlementService: Updated transaction ${transactionId} to status: ${status}`);
      return result;
    } catch (error) {
      console.error('❌ SettlementService: Database update error:', error);
      throw error;
    }
  }

  async checkSettledTransactions() {
    try {
      console.log('🔄 SettlementService: Starting daily settlement check...');
      
      if (!this.isConfigured) {
        console.log('⚠️ SettlementService: Not configured, skipping settlement check');
        return { success: false, error: 'Service not configured' };
      }
      
      // Get yesterday's date (settlements happen next day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`📅 SettlementService: Checking settlements for date: ${dateString}`);
      
      // Get settled batch list for yesterday
      const settledBatches = await this.getSettledBatchList(dateString);
      
      if (!settledBatches || settledBatches.length === 0) {
        console.log('ℹ️ SettlementService: No settled batches found for yesterday');
        return { success: true, transactionsUpdated: 0 };
      }
      
      let totalUpdated = 0;
      
      // Process each settled batch
      for (const batch of settledBatches) {
        console.log(`📦 SettlementService: Processing batch: ${batch.getBatchId()}`);
        
        // Get transactions in this batch
        const transactions = await this.getTransactionList(batch.getBatchId());
        
        // Update each transaction to settled
        for (const transaction of transactions) {
          try {
            await this.updateTransactionStatus(transaction.getTransId(), 'settled');
            totalUpdated++;
            console.log(`✅ SettlementService: Updated transaction ${transaction.getTransId()} to settled`);
          } catch (error) {
            console.error(`❌ SettlementService: Failed to update transaction ${transaction.getTransId()}:`, error);
          }
        }
      }
      
      console.log(`🎉 SettlementService: Settlement check completed. Updated ${totalUpdated} transactions to settled`);
      return { success: true, transactionsUpdated: totalUpdated };
      
    } catch (error) {
      console.error('❌ SettlementService: Settlement check failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SettlementService();