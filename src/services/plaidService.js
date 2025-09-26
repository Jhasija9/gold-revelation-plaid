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
    clientName = "Revelation Gold Group"
  }) {
    try {
      console.log("🎯 PLAID SERVICE: createLinkToken called");
      console.log("�� PLAID SERVICE: Webhook URL:", webhook);
      console.log("🎯 PLAID SERVICE: Products:", products);
      
      const request = {
        user: { client_user_id: userId },
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        products: products,
        country_codes: ["US"],
        language: "en",
        webhook: webhook,
        environment: process.env.PLAID_ENV,
      };
      
      console.log("🎯 PLAID SERVICE: Full request object:", JSON.stringify(request, null, 2));
      
      const response = await this.client.linkTokenCreate(request);
      console.log("🎯 PLAID SERVICE: Link token response:", JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error("🎯 PLAID SERVICE: Error creating link token:", error);
      throw error;
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
      console.log("🎯 PLAID SERVICE: createTransferUI called");
      console.log("🎯 PLAID SERVICE: Parameters:", {
        access_token: access_token ? "***ENCRYPTED***" : "MISSING",
        account_id: account_id,
        amount: amount,
        description: description,
        user_legal_name: user_legal_name,
        user_email: user_email
      });

      // Step 1: Create transfer authorization
      console.log("🎯 PLAID SERVICE: Creating transfer authorization...");
      const authRequest = {
        access_token: access_token,
        account_id: account_id,
        type: 'debit',
        amount: parseFloat(amount).toFixed(2),
        network: 'ach',
        ach_class: 'ppd',
        user: {
          legal_name: user_legal_name || 'John Doe'
        }
      };
      
      console.log("🎯 PLAID SERVICE: Auth request:", JSON.stringify(authRequest, null, 2));
      
      const authResponse = await this.client.transferAuthorizationCreate(authRequest);
      console.log("🎯 PLAID SERVICE: Auth response:", JSON.stringify(authResponse.data, null, 2));
      
      if (!authResponse.data.authorization || !authResponse.data.authorization.id) {
        throw new Error('Failed to create transfer authorization');
      }

      // Step 2: Create transfer
      console.log("🎯 PLAID SERVICE: Creating transfer...");
      const transferRequest = {
        access_token: access_token,
        account_id: account_id,
        authorization_id: authResponse.data.authorization.id,
        amount: parseFloat(amount).toFixed(2),
        description: description.substring(0, 15)
      };
      
      console.log("🎯 PLAID SERVICE: Transfer request:", JSON.stringify(transferRequest, null, 2));
      
      const transferResponse = await this.client.transferCreate(transferRequest);
      console.log("🎯 PLAID SERVICE: Transfer response:", JSON.stringify(transferResponse.data, null, 2));
      
      return {
        success: true,
        transfer_id: transferResponse.data.transfer.id,
        status: transferResponse.data.status
      };
    } catch (error) {
      console.error("🎯 PLAID SERVICE: Error creating transfer:", error);
      return {
        success: false,
        error: error.message
      };
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
}

module.exports = new PlaidService();
