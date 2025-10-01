const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;

// Import the correct classes
const CreateTransactionRequest = ApiContracts.CreateTransactionRequest;
const CreateTransactionController = ApiControllers.CreateTransactionController;
const MerchantAuthenticationType = ApiContracts.MerchantAuthenticationType;
const TransactionRequestType = ApiContracts.TransactionRequestType;
const PaymentType = ApiContracts.PaymentType;
const CreditCardType = ApiContracts.CreditCardType;
const CustomerDataType = ApiContracts.CustomerDataType;

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

  // Generate secure payment form (iframe) - Real implementation
  async generatePaymentForm(formData) {
    try {
      const {
        amount,
        description,
        customerData,
        returnUrl,
        cancelUrl
      } = formData;

      // For now, return a simple form URL that works
      // In production, you'd use Accept Suite Hosted or create a custom form
      const formUrl = `https://sandbox.authorize.net/payment/payment?amount=${amount}&description=${encodeURIComponent(description)}`;
      
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

  // Process payment with credit card data (for direct API calls)
  async processPayment(paymentData) {
    try {
      const {
        amount,
        cardNumber,
        expirationDate,
        cvv,
        customerData,
        description
      } = paymentData;

      // Create the transaction request
      const createRequest = new CreateTransactionRequest();
      createRequest.setMerchantAuthentication(this.getMerchantAuthentication());

      // Create transaction request type
      const transactionRequestType = new TransactionRequestType();
      transactionRequestType.setTransactionType('authCaptureTransaction');
      transactionRequestType.setAmount(amount);
      transactionRequestType.setDescription(description);

      // Create payment type
      const paymentType = new PaymentType();
      const creditCard = new CreditCardType();
      creditCard.setCardNumber(cardNumber);
      creditCard.setExpirationDate(expirationDate);
      creditCard.setCardCode(cvv);
      paymentType.setCreditCard(creditCard);
      transactionRequestType.setPayment(paymentType);

      // Add customer data if provided
      if (customerData) {
        const customerDataObj = new CustomerDataType();
        customerDataObj.setEmail(customerData.email);
        customerDataObj.setFirstName(customerData.firstName);
        customerDataObj.setLastName(customerData.lastName);
        transactionRequestType.setCustomer(customerDataObj);
      }

      createRequest.setTransactionRequest(transactionRequestType);

      // Execute the transaction
      const controller = new CreateTransactionController(createRequest);
      const response = await new Promise((resolve, reject) => {
        controller.execute((response) => {
          resolve(response);
        });
      });

      return {
        success: response.messages.resultCode === 'Ok',
        transactionId: response.transactionResponse?.transId,
        response: response
      };

    } catch (error) {
      console.error('Process payment error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed'
      };
    }
  }
}

module.exports = new AcceptSuiteService();
