const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;
const MerchantAuthenticationType = ApiContracts.MerchantAuthenticationType;

class AcceptSuiteService {
  constructor() {
    this.apiLoginId = process.env.AUTHORIZE_NET_API_LOGIN_ID;
    this.signatureKey = process.env.AUTHORIZE_NET_SIGNATURE_KEY;
    this.environment = process.env.AUTHORIZE_NET_ENVIRONMENT === 'production' 
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;
  }

  // Create merchant authentication
  getMerchantAuthentication() {
    const merchantAuth = new MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.signatureKey);
    return merchantAuth;
  }

  // Generate secure payment form (iframe) - Simplified approach
  async generatePaymentForm(formData) {
    try {
      const {
        amount,
        description,
        customerData,
        returnUrl,
        cancelUrl
      } = formData;

      // For now, return a simple form URL
      // In production, you'd generate the actual Accept Suite form
      const formUrl = `https://accept.authorize.net/payment/payment?amount=${amount}&description=${encodeURIComponent(description)}`;
      
      return {
        success: true,
        formUrl: formUrl,
        message: 'Payment form generated successfully'
      };

    } catch (error) {
      console.error('Generate payment form error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate payment form'
      };
    }
  }
}

module.exports = new AcceptSuiteService();
