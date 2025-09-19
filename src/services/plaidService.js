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
    products = ["auth"],
    webhook = `${
      process.env.API_BASE_URL || "http://localhost:3001"
    }/api/plaid/webhook`,
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
        webhook,
      };

      // if (redirectUri) req.redirect_uri = redirectUri;

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
}

module.exports = new PlaidService();
