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
const OrderType = ApiContracts.OrderType;
const CustomerAddressType = ApiContracts.CustomerAddressType;
const AuthenticateTestRequest = ApiContracts.AuthenticateTestRequest;
const AuthenticateTestController = ApiControllers.AuthenticateTestController;

class AcceptSuiteService {
  constructor() {
    console.log('🔧 AcceptSuiteService: Constructor called');
    
    // Validate required environment variables
    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.transactionKey = process.env.ANET_TRANSACTION_KEY;
    this.clientKey = process.env.ANET_CLIENT_KEY;
    this.environment = process.env.ANET_ENV === 'production' 
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;

    console.log('🔧 AcceptSuiteService: Environment variables check:');
    console.log('  - ANET_API_LOGIN_ID:', this.apiLoginId ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_TRANSACTION_KEY:', this.transactionKey ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_CLIENT_KEY:', this.clientKey ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_ENV:', process.env.ANET_ENV || 'sandbox (default)');

    // Set service availability based on environment variables
    this.isConfigured = !!(this.apiLoginId && this.transactionKey && this.clientKey);
    
    console.log('🔧 AcceptSuiteService: Service configured:', this.isConfigured ? '✅ YES' : '❌ NO');
    
    if (!this.isConfigured) {
      console.warn('⚠️ Authorize.Net not configured - missing ANET_API_LOGIN_ID or ANET_TRANSACTION_KEY');
      console.warn('💳 Credit card payments will be disabled');
    } else {
      console.log('✅ AcceptSuiteService: Ready for credit card processing');
    }
  }

  // Create merchant authentication
  getMerchantAuthentication() {
    const merchantAuth = new MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);    return merchantAuth;
  }

  // Check if service is properly configured
  checkConfiguration() {
    console.log('🔧 AcceptSuiteService: checkConfiguration() called');
    console.log('🔧 AcceptSuiteService: isConfigured =', this.isConfigured);
    
    if (!this.isConfigured) {
      console.log('❌ AcceptSuiteService: Service not configured');
      return {
        success: false,
        code: 'SERVICE_NOT_CONFIGURED',
        message: 'Credit card processing is not configured. Please contact support.'
      };
    }
    
    console.log('✅ AcceptSuiteService: Configuration check passed');
    return { success: true };
  }

  // Get public configuration for frontend AcceptUI
  getPublicConfig() {
    console.log('🔧 AcceptSuiteService: getPublicConfig() called');
    
    const configCheck = this.checkConfiguration();
    console.log('🔧 AcceptSuiteService: Configuration check result:', configCheck);
    
    if (!configCheck.success) {
      console.log('❌ AcceptSuiteService: Returning error config');
      return configCheck;
    }

    const config = {
      success: true,
      config: {
        apiLoginId: this.apiLoginId,
        clientKey: this.clientKey,
        environment: process.env.ANET_ENV || 'sandbox'
      }
    };
    
    console.log('✅ AcceptSuiteService: Returning valid config:', config);
    return config;
  }

  mask(v) { return v ? String(v).slice(0,2) + '***' + String(v).slice(-2) : 'null'; }

  async testAuth() {
    try {
      
      const req = new AuthenticateTestRequest();
      req.setMerchantAuthentication(this.getMerchantAuthentication());
      console.log('req', req);
      const ctrl = new AuthenticateTestController(req.getJSON(), {
        logger: { enabled: false, location: './', level: 'error' },
        proxy:  { setProxy: false, proxyUrl: '' },
        timeout: 120000,
        environment: this.environment
      });
      ctrl.setEnvironment(this.environment);
      console.log('ctrl', ctrl);
      const raw = await new Promise((resolve, reject) => {
        ctrl.execute(() => { 
          try { 
            
            resolve(ctrl.getResponse()); 
          } 
          catch (e) { 
            
            reject(e); 
          } 
        });
      });
     
      const resultCode = raw?.messages?.resultCode;
    
      const msg = raw?.messages?.message?.[0]?.text;
      
      return resultCode === 'Ok';
    } catch (e) {
      console.error('🔑 Auth test exception:', e);
      return false;
    }
  }

  // Process payment with opaqueData from AcceptUI
  async chargeWithOpaqueData(paymentData) {
    console.log('🔧 AcceptSuiteService: chargeWithOpaqueData() called');
    console.log('🔧 AcceptSuiteService: Payment data received:', {
      amount: paymentData.amount,
      hasOpaqueData: !!paymentData.opaqueData,
      description: paymentData.description
    });
    
    try {
      const configCheck = this.checkConfiguration();
      if (!configCheck.success) {
        console.log('❌ AcceptSuiteService: Configuration check failed in chargeWithOpaqueData');
        return configCheck;
      }

      const {
        amount,
        description,
        opaqueData,
        customerData,
        customerIP
      } = paymentData;

      // Validate required fields
      if (!amount || amount <= 0) {
        console.log('❌ AcceptSuiteService: Invalid amount:', amount);
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

      
      
      const authOk = await this.testAuth();
      if (!authOk) {
        return {
          success: false,
          code: 'E00007',
          message: 'User authentication failed (auth test). Check ANET_API_LOGIN_ID / ANET_TRANSACTION_KEY and environment.'
        };
      }

      console.log('✅ AcceptSuiteService: Validation passed, processing payment...');
      console.log('🔧 AcceptSuiteService: Creating transaction request');

      // Create the transaction request
      const createRequest = new CreateTransactionRequest();
      createRequest.setMerchantAuthentication(this.getMerchantAuthentication());

      // Create transaction request type
      const transactionRequestType = new TransactionRequestType();
      transactionRequestType.setTransactionType('authCaptureTransaction');
      transactionRequestType.setAmount(parseFloat(amount).toFixed(2));
      
      if (description) {
        const order = new OrderType();
        order.setDescription(description);
        transactionRequestType.setOrder(order);
      }

      // Create payment type with opaqueData
      const paymentType = new PaymentType();
      const opaqueDataObj = new OpaqueDataType();
      opaqueDataObj.setDataDescriptor(opaqueData.dataDescriptor);
      opaqueDataObj.setDataValue(opaqueData.dataValue);
      paymentType.setOpaqueData(opaqueDataObj);
      transactionRequestType.setPayment(paymentType);

      // Safe customer + bill-to (no nulls)
      if (customerData) {
        const customerDataObj = new CustomerDataType();
        customerDataObj.setEmail((customerData.email && String(customerData.email)) || '');
        transactionRequestType.setCustomer(customerDataObj);

        if (customerData.firstName || customerData.lastName) {
      //     const billTo = new CustomerAddressType();
      //     if (customerData.firstName) billTo.setFirstName(String(customerData.firstName));
      //     if (customerData.lastName)  billTo.setLastName(String(customerData.lastName));
      //     // do NOT set phone/fax unless you have values (leaving them unset avoids null keys)
      //     transactionRequestType.setBillTo(billTo);
        }
      }

      // Add customer IP if provided
      if (customerIP) {
        transactionRequestType.setCustomerIP(customerIP);
      }

      createRequest.setTransactionRequest(transactionRequestType);

      // Execute the transaction
      console.log('🔄 AcceptSuiteService: Executing Authorize.Net transaction...');
      const reqJson = createRequest.getJSON();
      console.log('📦 Request root keys:', Object.keys(reqJson)); // expect ['createTransactionRequest']

      const controller = new CreateTransactionController(reqJson, {
        logger: { enabled: false, location: './', level: 'error' },
        proxy:  { setProxy: false, proxyUrl: '' },
        timeout: 120000,
        environment: this.environment
      });
      controller.setEnvironment(this.environment);
      
      // defensive: make sure request has only the proper root
      if ('clientId' in createRequest) delete createRequest.clientId;

      if ('refId' in createRequest) delete createRequest.refId;

      const raw = await new Promise((resolve, reject) => {
        controller.execute(() => {
          try { resolve(controller.getResponse()); }
          catch (e) { reject(e); }
        });
      });

      // Parse typed response
      const apiResp = new ApiContracts.CreateTransactionResponse(raw);
      const ok = apiResp?.getMessages()?.getResultCode() === ApiContracts.MessageTypeEnum.OK;
      const tr  = apiResp?.getTransactionResponse();

      console.log('�� AcceptSuiteService: Authorize.Net response received');
      console.log('🔧 AcceptSuiteService: Response messages result code:', apiResp?.messages?.resultCode);
      const resultCode = apiResp?.getMessages?.()?.getResultCode?.();
console.log('🔧 AcceptSuiteService: Result code:', resultCode);

      // Parse response
      if (ok && tr) {
        console.log('✅ AcceptSuiteService: Transaction successful');
        console.log('🔧 AcceptSuiteService: Transaction ID:', tr.transId);
        console.log('🔧 AcceptSuiteService: Auth Code:', tr.authCode);
        
        return {
          success: true,
          transactionId: tr.transId,
          authCode: tr.authCode,
          responseCode: tr.responseCode,
          cardLastFour: tr.accountNumber ? tr.accountNumber.slice(-4) : null,
  cardType: tr.accountType || null,
          message: 'Payment processed successfully'
        };
      } else {
        // Handle errors
        let errorMessage = 'Payment processing failed';
        let errorCode = 'PROCESSING_ERROR';

       // Priority 1: Transaction Response Errors (most specific)
if (tr && tr.errors && Array.isArray(tr.errors) && tr.errors.length > 0) {
  const error = tr.errors[0];
  if (error && error.errorText) {
    errorMessage = error.errorText;
    errorCode = error.errorCode || 'TRANSACTION_ERROR';
  }
} 
// Priority 2: API Messages (API-level errors)
else if (apiResp && apiResp.messages && apiResp.messages.message) {
  const messages = Array.isArray(apiResp.messages.message) 
    ? apiResp.messages.message 
    : [apiResp.messages.message];
  
  if (messages.length > 0 && messages[0]) {
    errorMessage = messages[0].text || 'Unknown API error';
    errorCode = messages[0].code || 'API_ERROR';
  }
}
// Priority 3: Transaction Response Code
else if (tr && tr.responseCode) {
  errorMessage = `Transaction declined (Response Code: ${tr.responseCode})`;
  errorCode = `RESPONSE_${tr.responseCode}`;
}

        console.error('❌ AcceptSuiteService: Transaction failed');
        console.error('🔧 AcceptSuiteService: Error code:', errorCode);
        console.error('🔧 AcceptSuiteService: Error message:', errorMessage);
        
        return {
          success: false,
          code: errorCode,
          message: errorMessage,
          responseCode: tr?.responseCode
        };
      }

    } catch (error) {
      console.error('❌ AcceptSuiteService: Exception in chargeWithOpaqueData:', error);
      console.error('🔧 AcceptSuiteService: Error stack:', error.stack);
      
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
