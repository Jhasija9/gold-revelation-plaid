// const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// class PlaidService {
//   constructor() {
//     const configuration = new Configuration({
//       basePath: PlaidEnvironments.sandbox,
//       baseOptions: {
//         headers: {
//           'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
//           'PLAID-SECRET': process.env.PLAID_SECRET,
//         },
//       },
//     });

//     this.client = new PlaidApi(configuration);
//   }

//   async createLinkToken(userId) {
//     try {
//       const request = {
//         user: {
//           client_user_id: userId,
//         },
//         client_name: 'Revelation Gold Group',
//         products: ['auth'],
//         country_codes: ['US'],
//         language: 'en',
//         webhook: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/plaid/webhook`,
//       };

//       const response = await this.client.linkTokenCreate(request);
//       return {
//         success: true,
//         link_token: response.data.link_token,
//         expires_in: response.data.expires_in
//       };
//     } catch (error) {
//       console.error('Error creating link token:', error);
//       return {
//         success: false,
//         error: error.message,
//         request_id: error.response?.data?.request_id
//       };
//     }
//   }

//   async exchangePublicToken(publicToken) {
//     try {
//       const response = await this.client.itemPublicTokenExchange({
//         public_token: publicToken,
//       });

//       return {
//         success: true,
//         access_token: response.data.access_token,
//         item_id: response.data.item_id
//       };
//     } catch (error) {
//       console.error('Error exchanging token:', error);
//       return {
//         success: false,
//         error: error.message,
//         request_id: error.response?.data?.request_id
//       };
//     }
//   }

//   async getAccounts(accessToken) {
//     try {
//       const response = await this.client.accountsGet({
//         access_token: accessToken,
//       });

//       return {
//         success: true,
//         accounts: response.data.accounts,
//         item: response.data.item
//       };
//     } catch (error) {
//       console.error('Error getting accounts:', error);
//       return {
//         success: false,
//         error: error.message,
//         request_id: error.response?.data?.request_id
//       };
//     }
//   }

//   async getBalance(accessToken) {
//     try {
//       const response = await this.client.accountsBalanceGet({
//         access_token: accessToken,
//       });

//       return {
//         success: true,
//         accounts: response.data.accounts
//       };
//     } catch (error) {
//       console.error('Error getting balance:', error);
//       return {
//         success: false,
//         error: error.message,
//         request_id: error.response?.data?.request_id
//       };
//     }
//   }
// }

// module.exports = new PlaidService();

// src/services/plaidService.js
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

class PlaidService {
  constructor() {
    const env = (process.env.PLAID_ENV || "sandbox").toLowerCase(); // 'sandbox' | 'development' | 'production'
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
          // Optional but recommended to pin API version explicitly:
          // 'Plaid-Version': '2020-09-14'
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  /**
   * Create a Link Token server-side for a specific user.
   * NOTE: session handling (cookies/link_sessions) is done in routes, not here.
   */
  async createLinkToken({
    userId,
    products = ["auth", "transfer"],
    webhook = process.env.PLAID_WEBHOOK_URL,
    clientName = "Revelation Gold Group",
    countryCodes = ["US"],
    language = "en",
  } = {}) {
    try {
      const req = {
        user: { client_user_id: String(userId) },
        client_name: clientName,
        products,
        country_codes: countryCodes,
        language,
        webhook: webhook
      };

      // Only add webhook if it's provided and not undefined
      
      console.log('🔗 Setting webhook URL:', webhook);
      

      const resp = await this.client.linkTokenCreate(req);
      // return the raw token for convenience in /connect
      return resp.data.link_token;
    } catch (error) {
      // Let callers decide how to render/log; include Plaid request_id for audit
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error creating link token:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_LINK_TOKEN_CREATE_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  async exchangePublicToken(publicToken) {
    try {
      const resp = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      return {
        success: true,
        access_token: resp.data.access_token,
        item_id: resp.data.item_id,
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error exchanging token:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_PUBLIC_TOKEN_EXCHANGE_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  async getAccounts(accessToken) {
    try {
      const resp = await this.client.accountsGet({ access_token: accessToken });
      return {
        success: true,
        accounts: resp.data.accounts,
        item: resp.data.item,
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error getting accounts:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_ACCOUNTS_GET_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  async getBalance(accessToken) {
    try {
      const resp = await this.client.accountsBalanceGet({
        access_token: accessToken,
      });
      return { success: true, accounts: resp.data.accounts };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error getting balance:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_BALANCE_GET_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  async getAuthData(accessToken) {
    try {
      const resp = await this.client.authGet({ access_token: accessToken });
      return {
        success: true,
        accounts: resp.data.accounts,
        numbers: resp.data.numbers, // This contains account/routing numbers
        item: resp.data.item,
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error getting auth data:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_AUTH_GET_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  // Create Transfer UI
  async createTransferUI({
    access_token,
    account_id,
    amount,
    description,
    user_id,
    user_legal_name,
    user_email,
  }) {
    try {
      console.log("Creating transfer with Plaid");
      // Step 1: Create transfer authorization
      const authRequest = {
        access_token: access_token,
        account_id: account_id,
        type: "debit",
        amount: parseFloat(amount).toFixed(2),
        network: "ach", // ACH is the standard for US bank transfers
        ach_class: "ppd",
        user: {
          legal_name: user_legal_name || "John Doe",
          // client_user_id: String(user_id)
        },
      };

      console.log("Creating transfer authorization:", authRequest);
      const authResponse = await this.client.transferAuthorizationCreate(
        authRequest
      );
      console.log("Authorization response:", authResponse.data);

      if (
        !authResponse.data.authorization ||
        !authResponse.data.authorization.id
      ) {
        throw new Error("Failed to create transfer authorization");
      }

      // Step 2: Create transfer using authorization
      const transferRequest = {
        access_token: access_token,
        account_id: account_id,
        authorization_id: authResponse.data.authorization.id,
        amount: parseFloat(amount).toFixed(2),
        description: this.getShortDescription(description), // Use abbreviated description
      };

      console.log("Creating transfer:", transferRequest);
      const transferResponse = await this.client.transferCreate(
        transferRequest
      );
      console.log("Transfer response:", transferResponse.data);

      return {
        success: true,
        transfer_id: transferResponse.data.transfer.id,
        // transfer_url: transferResponse.data.transfer_url,
        status: transferResponse.data.status,
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error creating transfer:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_TRANSFER_CREATE_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }
  // Add this method to plaidService.js

  async getAccountBalances(accessToken) {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await this.client.accountsBalanceGet(request);

      return {
        success: true,
        accounts: response.data.accounts,
      };
    } catch (error) {
      console.error("Error getting account balances:", error);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message,
      };
    }
  }
  // Add this method to the PlaidService class, before the closing bracket

  async getTransferById(accessToken, transferId) {
    try {
      // https://plaid.com/docs/api/products/transfer/#transferget
      const request = {
        transfer_id: transferId,
      };

      const response = await this.client.transferGet(request);

      return {
        success: true,
        transfer: response.data.transfer,
      };
    } catch (error) {
      console.error("Error getting transfer:", error);
      return {
        success: false,
        error: error.response?.data?.error_message || error.message,
      };
    }
  }

  // Get Transfer Status
  async getTransferStatus(transfer_id) {
    try {
      const response = await this.client.transferGet({
        transfer_id: transfer_id,
      });

      return {
        success: true,
        transfer: response.data.transfer,
        status: response.data.transfer.status,
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error getting transfer status:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      throw Object.assign(new Error("PLAID_TRANSFER_GET_FAILED"), {
        cause: error,
        request_id,
      });
    }
  }

  // Add this method to PlaidService class
  getShortDescription(description) {
    // Map longer descriptions to shorter ones (max 15 characters)
    const shortDescriptions = {
      'Gold Subscription': 'Gold Sub',
      'Silver Plan': 'Silver',
      'Platinum Package': 'Platinum',
      'GoldIRA': 'GoldIRA',
      'Silver IRA': 'Silver IRA',
      'Platinum IRA': 'Platinum IRA',
      'Gold Investment': 'Gold Invest',
      'Silver Investment': 'Silver Inv',
      'Platinum Investment': 'Platinum Inv',
      'Gold Purchase': 'Gold Purchase',
      'Silver Purchase': 'Silver Purch',
      'Platinum Purchase': 'Platinum Pur',
      'Gold Plan': 'Gold Plan',
      'Silver Plan': 'Silver Plan',
      'Platinum Plan': 'Platinum Plan'
    };
    
    // Return mapped description or truncate if not found
    return shortDescriptions[description] || description.substring(0, 15);
  }

  // Add Transfer Event Sync Methods
  async syncTransferEvents() {
    try {
      console.log('🔄 Starting transfer event sync...');
      
      // Get current cursor
      const cursor = await this.getTransferEventCursor();
      console.log(`📊 Current cursor: ${cursor}`);
      
      let hasMore = true;
      let afterId = cursor;
      
      while (hasMore) {
        const response = await this.client.transferEventSync({
          after_id: afterId
        });
        
        console.log(`📥 Fetched ${response.data.transfer_events.length} events`);
        
        // Process each event
        for (const event of response.data.transfer_events) {
          await this.processTransferEvent(event);
        }
        
        // Update cursor
        afterId = response.data.after_id;
        hasMore = response.data.has_more;
        
        console.log(`📊 New cursor: ${afterId}, has_more: ${hasMore}`);
      }
      
      // Persist final cursor
      if (afterId === undefined) {
        afterId = 0; // Default to 0 if undefined
      }
      await this.updateTransferEventCursor(afterId);
      console.log('✅ Transfer event sync completed');
      
    } catch (error) {
      console.error('❌ Transfer event sync failed:', error);
      throw error;
    }
  }

  async getTransferEventCursor() {
    try {
      const databaseService = require('./databaseService');
      const result = await databaseService.selectOne(
        'plaid_transfer_event_cursor',
        { id: 'transfer' }
      );
      
      return result?.after_id ?? 0;
    } catch (error) {
      console.error('Error getting cursor:', error);
      return 0;
    }
  }

  async updateTransferEventCursor(afterId) {
    try {
      const databaseService = require('./databaseService');
      
      // Try to update first
      const existing = await databaseService.selectOne(
        'plaid_transfer_event_cursor',
        { id: 'transfer' }
      );
      
      if (existing) {
        await databaseService.updateOne(
          'plaid_transfer_event_cursor',
          { id: 'transfer' },
          { after_id: afterId, updated_at: new Date().toISOString() }
        );
      } else {
        await databaseService.insertOne(
          'plaid_transfer_event_cursor',
          {
            id: 'transfer',
            after_id: afterId,
            updated_at: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  }

  async processTransferEvent(event) {
    try {
      const { event_type, transfer_id } = event;
      
      console.log(`🔄 Processing event: ${event_type} for transfer: ${transfer_id}`);
      
      // Map event types to internal status
      const statusMap = {
        'pending': 'pending',
        'posted': 'posted', 
        'settled': 'settled',
        'failed': 'failed',
        'returned': 'returned',
        'funds_available': 'funds_available' // Add this line
      };
      
      const newStatus = statusMap[event_type];
      
      if (newStatus) {
        // Update transaction status
        const databaseService = require('./databaseService');
        await databaseService.updateOne(
          'transactions',
          { plaid_transfer_id: transfer_id },
          { status: newStatus }
        );
        
        console.log(`✅ Updated transfer ${transfer_id} to status: ${newStatus}`);
      } else {
        // Log unhandled event types
        console.log(`⚠️ Unhandled event type: ${event_type} for transfer: ${transfer_id}`);
      }
      
    } catch (error) {
      console.error(`Error processing event for transfer ${event.transfer_id}:`, error);
    }
  }
}

module.exports = new PlaidService();
