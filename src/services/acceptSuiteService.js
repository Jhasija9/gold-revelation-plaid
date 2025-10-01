const authorizenet = require('authorizenet');

class AcceptSuiteService {
  constructor() {
    this.apiLoginId = process.env.AUTHORIZE_NET_API_LOGIN_ID;
    this.signatureKey = process.env.AUTHORIZE_NET_SIGNATURE_KEY;
    this.environment = process.env.AUTHORIZE_NET_ENVIRONMENT === 'production' 
      ? 'https://api2.authorize.net/xml/v1/request.api'
      : 'https://apitest.authorize.net/xml/v1/request.api';
  }

  async generatePaymentForm(formData) {
    try {
      const { amount, description } = formData;
      const formUrl = `https://accept.authorize.net/payment/payment?amount=${amount}&description=${encodeURIComponent(description)}`;
      
      return {
        success: true,
        formUrl: formUrl,
        message: 'Payment form generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to generate payment form'
      };
    }
  }
}

module.exports = new AcceptSuiteService();
