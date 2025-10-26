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
      // console.log("Authorization response:", authResponse.data);

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
      // console.log("Transfer response:", transferResponse.data);

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

  // CORRECTED: Transfer Event Sync using individual transfer checks
  async syncTransferEvents(accessToken, afterEventId = null) {
    try {
      const databaseService = require('./databaseService');
      console.log(`🔍 Searching for transfers with non-final status...`);
      
      // ✅ FIXED: Get all non-final status transfers (not just pending)
      const result = await databaseService.query("transactions", "select", {
        where: { 
          status: { not_in: ['funds_available', 'failed', 'cancelled', 'returned'] }
        },
        limit: 25
      });
      console.log(`📊 Database query result:`, {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error
      });


      if (!result.success) {
        console.error('Failed to get transfers:', result.error);
        return { success: false, error: result.error, events: [] };
      }

      const transfers = result.data;
      const plaidTransfers = transfers.filter(t => t.plaid_transfer_id !== null);

      console.log(`📋 Found ${transfers.length} transfers to check:`, transfers.map(t => ({
        id: t.id,
        plaid_transfer_id: t.plaid_transfer_id,
        status: t.status,
        amount: t.amount
      })));
      const events = [];

      // Check each transfer's current status
      for (const transfer of plaidTransfers) {
        try {
          console.log(`🔍 Checking transfer ${transfer.plaid_transfer_id} (current status: ${transfer.status})`);

          const transferResult = await this.getTransferById(accessToken, transfer.plaid_transfer_id);
          console.log(`📊 Plaid API result for ${transfer.plaid_transfer_id}:`, {
            success: transferResult.success,
            status: transferResult.transfer?.status,
            error: transferResult.error
          });
          if (transferResult.success) {
            const plaidTransfer = transferResult.transfer;
            console.log(`🔄 Status comparison: DB(${transfer.status}) vs Plaid(${plaidTransfer.status})`);


            
            // Create event if status has changed
            if (plaidTransfer.status !== transfer.status) {
              console.log(`✅ Status changed! Creating event: ${transfer.status} → ${plaidTransfer.status}`);

              events.push({
                event_id: `${transfer.plaid_transfer_id}_${Date.now()}`,
                transfer_id: transfer.plaid_transfer_id,
                event_type: plaidTransfer.status,
                timestamp: plaidTransfer.created || new Date().toISOString(),
                ach_transfer_id: plaidTransfer.ach_transfer_id,
                failure_reason: plaidTransfer.failure_reason,
                return_reason: plaidTransfer.return_reason
              });
            } else {
              console.log(`🔄 No status change detected for ${transfer.plaid_transfer_id}`);
            }}
            else {
              console.error(`❌ Failed to get transfer ${transfer.plaid_transfer_id}:`, transferResult.error);
            }
          }
        catch (error) {
          console.error(`Error checking transfer ${transfer.plaid_transfer_id}:`, error);
        }
      }
      console.log(`📦 Created ${events.length} events:`, events);

      return {
        success: true,
        events: events,
        has_more: false
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error syncing transfer events:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      return {
        success: false,
        error: error.response?.data?.error_message || error.message,
        request_id
      };
    }
  }

  // CORRECTED: Fire test webhook (for sandbox testing)
  async fireTestWebhook(webhookType = 'TRANSFER', webhookCode = 'TRANSFER_EVENTS_UPDATE') {
    try {
      // Only webhook URL is required - no webhook_type or webhook_code
      const response = await this.client.sandboxTransferFireWebhook({
        webhook: process.env.PLAID_WEBHOOK_URL || 'https://gold-revelation-plaid.vercel.app/webhooks/plaid/transfer'
      });

      return {
        success: true,
        webhook_fired: response.data.webhook_fired
      };
    } catch (error) {
      const request_id = error?.response?.data?.request_id;
      console.error(
        "Error firing test webhook:",
        request_id || error?.message,
        error?.response?.data || ""
      );
      return {
        success: false,
        error: error.response?.data?.error_message || error.message,
        request_id
      };
    }
  }
}

module.exports = new PlaidService();
