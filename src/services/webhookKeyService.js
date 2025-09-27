const axios = require('axios');
const NodeCache = require('node-cache');

// Cache keys for 24 hours
const keyCache = new NodeCache({ stdTTL: 86400 });

class WebhookKeyService {
  constructor() {
    this.keyCache = keyCache;
  }

  async getPlaidPublicKeys(keyId) {
    // Try to get keys from cache first
    const cacheKey = `plaid_webhook_key_${keyId}`;
    const cachedKey = this.keyCache.get(cacheKey);
    if (cachedKey) {
      return cachedKey;
    }

    try {
      // If not in cache, fetch from Plaid using the key_id
      const response = await axios.post(
        `https://${process.env.PLAID_ENV || 'sandbox'}.plaid.com/webhook_verification_key/get`,
        {
          client_id: process.env.PLAID_CLIENT_ID,
          secret: process.env.PLAID_SECRET,
          key_id: keyId  // Use the key_id from the JWT header
        }
      );

      if (response.data && response.data.key) {
        // Store in cache
        this.keyCache.set(cacheKey, response.data.key);
        return response.data.key;
      }
      
      throw new Error('Invalid response from Plaid key service');
    } catch (error) {
      console.error('Failed to fetch Plaid webhook verification keys:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new WebhookKeyService();