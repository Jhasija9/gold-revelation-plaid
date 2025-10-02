const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;

// Import the correct classes for AcceptUI (opaqueData) transactions
const CreateTransactionRequest = ApiContracts.CreateTransactionRequest;
const CreateTransactionController = ApiControllers.CreateTransactionController;
const MerchantAuthenticationType = ApiContracts.MerchantAuthenticationType;
const TransactionRequestType = ApiContracts.TransactionRequestType;
const PaymentType = ApiContracts.PaymentType;
const OpaqueDataType = ApiContracts.OpaqueDataType;
const CustomerDataType = ApiContracts.CustomerDataType;

class AcceptSuiteService {
  constructor() {
    // Validate required environment variables
    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.transactionKey = process.env.ANET_TRANSACTION_KEY;
    this.clientKey = process.env.ANET_CLIENT_KEY;
    this.environment = process.env.ANET_ENV === 'production' 
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;

    if (!this.apiLoginId || !this.transactionKey) {
      throw new Error('Missing required Authorize.Net environment variables: ANET_API_LOGIN_ID, ANET_TRANSACTION_KEY');
    }
  }

  // Create merchant authentication
  getMerchantAuthentication() {
    const merchantAuth = new MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);
    return merchantAuth;
  }

  // Get public configuration for frontend AcceptUI
  getPublicConfig() {
    return {
      apiLoginId: this.apiLoginId,
      clientKey: this.clientKey,
      environment: process.env.ANET_ENV || 'sandbox'
    };
  }

  // Process payment with opaqueData from AcceptUI
  async chargeWithOpaqueData(paymentData) {
    try {
      const {
        amount,
        description,
        opaqueData,
        customerData,
        customerIP
      } = paymentData;

      // Validate required fields
      if (!amount || amount <= 0) {
        return {
          success: false,
          code: 'INVALID_AMOUNT',
          message: 'Amount must be greater than 0'
        };
      }

      if (!opaqueData || !opaqueData.dataDescriptor || !opaqueData.dataValue) {
        return {
          success: false,
          code: 'INVALID_OPAQUE_DATA',
          message: 'Invalid payment data received'
        };
      }

      // Create the transaction request
      const createRequest = new CreateTransactionRequest();
      createRequest.setMerchantAuthentication(this.getMerchantAuthentication());

      // Create transaction request type
      const transactionRequestType = new TransactionRequestType();
      transactionRequestType.setTransactionType('authCaptureTransaction');
      transactionRequestType.setAmount(parseFloat(amount).toFixed(2));
      
      if (description) {
        transactionRequestType.setDescription(description);
      }

      // Create payment type with opaqueData
      const paymentType = new PaymentType();
      const opaqueDataObj = new OpaqueDataType();
      opaqueDataObj.setDataDescriptor(opaqueData.dataDescriptor);
      opaqueDataObj.setDataValue(opaqueData.dataValue);
      paymentType.setOpaqueData(opaqueDataObj);
      transactionRequestType.setPayment(paymentType);

      // Add customer data if provided
      if (customerData) {
        const customerDataObj = new CustomerDataType();
        if (customerData.email) customerDataObj.setEmail(customerData.email);
        if (customerData.firstName) customerDataObj.setFirstName(customerData.firstName);
        if (customerData.lastName) customerDataObj.setLastName(customerData.lastName);
        transactionRequestType.setCustomer(customerDataObj);
      }

      // Add customer IP if provided
      if (customerIP) {
        transactionRequestType.setCustomerIP(customerIP);
      }

      createRequest.setTransactionRequest(transactionRequestType);

      // Execute the transaction
      console.log('🔄 Processing Authorize.Net transaction...');
      const controller = new CreateTransactionController(createRequest);
      
      const response = await new Promise((resolve, reject) => {
        controller.execute((response) => {
          resolve(response);
        });
      });

      // Parse response
      const isSuccess = response.messages.resultCode === 'Ok';
      const transactionResponse = response.transactionResponse;

      if (isSuccess && transactionResponse) {
        console.log('✅ Transaction successful:', transactionResponse.transId);
        return {
          success: true,
          transactionId: transactionResponse.transId,
          authCode: transactionResponse.authCode,
          responseCode: transactionResponse.responseCode,
          message: 'Payment processed successfully'
        };
      } else {
        // Handle errors
        let errorMessage = 'Payment processing failed';
        let errorCode = 'PROCESSING_ERROR';

        if (transactionResponse && transactionResponse.errors) {
          const error = transactionResponse.errors[0];
          errorMessage = error.errorText;
          errorCode = error.errorCode;
        } else if (response.messages && response.messages.message) {
          errorMessage = response.messages.message[0].text;
          errorCode = response.messages.message[0].code;
        }

        console.error('❌ Transaction failed:', errorCode, errorMessage);
        return {
          success: false,
          code: errorCode,
          message: errorMessage,
          responseCode: transactionResponse?.responseCode
        };
      }

    } catch (error) {
      console.error('❌ Charge with opaqueData error:', error);
      
      // Don't expose internal errors to client
      return {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your payment. Please try again.'
      };
    }
  }

  // Legacy method - kept for backward compatibility but deprecated
  async generatePaymentForm(formData) {
    console.warn('⚠️ generatePaymentForm is deprecated. Use AcceptUI modal instead.');
    return {
      success: false,
      error: 'This payment method is no longer supported. Please use the credit card option.'
    };
  }

  // Legacy method - kept for backward compatibility but deprecated  
  async processPayment(paymentData) {
    console.warn('⚠️ processPayment is deprecated. Use chargeWithOpaqueData instead.');
    return {
      success: false,
      error: 'This payment method is no longer supported. Please use the credit card option.'
    };
  }
}

module.exports = new AcceptSuiteService();
