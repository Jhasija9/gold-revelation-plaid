const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;
const MerchantAuthenticationType = ApiContracts.MerchantAuthenticationType;
const GetAcceptSuitePageRequest = ApiContracts.GetAcceptSuitePageRequest;

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
    const merchantAuthenticationType = new MerchantAuthenticationType();
    merchantAuthenticationType.setName(this.apiLoginId);
    merchantAuthenticationType.setTransactionKey(this.signatureKey);
    return merchantAuthenticationType;
  }

  // Generate secure payment form (iframe)
  async generatePaymentForm(formData) {
    try {
      const {
        amount,
        description,
        customerData,
        returnUrl,
        cancelUrl
      } = formData;

      // Create the request
      const getRequest = new GetAcceptSuitePageRequest();
      getRequest.setMerchantAuthentication(this.getMerchantAuthentication());
      
      // Set form configuration
      getRequest.setRefId(`ref_${Date.now()}`);
      getRequest.setReturnUrl(returnUrl);
      getRequest.setCancelUrl(cancelUrl);
      
      // Set payment details
      if (amount) {
        getRequest.setAmount(amount);
      }
      
      if (description) {
        getRequest.setDescription(description);
      }

      // Set customer data if provided
      if (customerData) {
        getRequest.setCustomerEmail(customerData.email);
        getRequest.setCustomerFirstName(customerData.firstName);
        getRequest.setCustomerLastName(customerData.lastName);
      }

      // Execute the request
      const ctrl = new ApiControllers.GetAcceptSuitePageController(getRequest.getJSON());
      
      return new Promise((resolve, reject) => {
        ctrl.execute((response) => {
          if (response.messages.resultCode === 'Ok') {
            resolve({
              success: true,
              formToken: response.token,
              formUrl: response.formUrl,
              message: 'Payment form generated successfully'
            });
          } else {
            reject({
              success: false,
              error: response.messages.message[0]?.text || 'Failed to generate payment form',
              responseCode: response.messages.message[0]?.code
            });
          }
        });
      });

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
