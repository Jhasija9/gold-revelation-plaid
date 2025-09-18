const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

class PlaidService {
  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId) {
    try {
      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: 'Revelation Gold Group',
        products: ['auth'],
        country_codes: ['US'],
        language: 'en',
        webhook: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/plaid/webhook`,
      };

      const response = await this.client.linkTokenCreate(request);
      return {
        success: true,
        link_token: response.data.link_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Error creating link token:', error);
      return {
        success: false,
        error: error.message,
        request_id: error.response?.data?.request_id
      };
    }
  }

  async exchangePublicToken(publicToken) {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      return {
        success: true,
        access_token: response.data.access_token,
        item_id: response.data.item_id
      };
    } catch (error) {
      console.error('Error exchanging token:', error);
      return {
        success: false,
        error: error.message,
        request_id: error.response?.data?.request_id
      };
    }
  }

  async getAccounts(accessToken) {
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken,
      });

      return {
        success: true,
        accounts: response.data.accounts,
        item: response.data.item
      };
    } catch (error) {
      console.error('Error getting accounts:', error);
      return {
        success: false,
        error: error.message,
        request_id: error.response?.data?.request_id
      };
    }
  }

  async getBalance(accessToken) {
    try {
      const response = await this.client.accountsBalanceGet({
        access_token: accessToken,
      });

      return {
        success: true,
        accounts: response.data.accounts
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return {
        success: false,
        error: error.message,
        request_id: error.response?.data?.request_id
      };
    }
  }
}

module.exports = new PlaidService();
