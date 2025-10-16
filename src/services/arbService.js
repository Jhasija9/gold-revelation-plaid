const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;

class ARBService {
  constructor() {
    console.log('🔧 ARBService: Constructor called');
    
    // Validate required environment variables
    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.transactionKey = process.env.ANET_TRANSACTION_KEY;
    this.environment = process.env.ANET_ENV === 'production' 
      ? Constants.endpoint.production 
      : Constants.endpoint.sandbox;

    console.log('🔧 ARBService: Environment variables check:');
    console.log('  - ANET_API_LOGIN_ID:', this.apiLoginId ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_TRANSACTION_KEY:', this.transactionKey ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_ENV:', process.env.ANET_ENV || 'sandbox (default)');

    // Set service availability
    this.isConfigured = !!(this.apiLoginId && this.transactionKey);
    
    console.log('🔧 ARBService: Service configured:', this.isConfigured ? '✅ YES' : '❌ NO');
    
    if (!this.isConfigured) {
      console.warn('⚠️ Authorize.Net ARB not configured - missing credentials');
    } else {
      console.log('✅ ARBService: Ready for subscription processing');
    }
  }

  createMerchantAuthentication() {
    const merchantAuth = new ApiContracts.MerchantAuthenticationType();
    merchantAuth.setName(this.apiLoginId);
    merchantAuth.setTransactionKey(this.transactionKey);
    return merchantAuth;
  }

  async createSubscription(subscriptionData) {
    try {
      console.log('🔧 ARBService: Creating subscription:', subscriptionData.name);
      
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'ARB service not configured - missing credentials'
        };
      }

      const arbRequest = new ApiContracts.ARBCreateSubscriptionRequest();
      
      // Merchant Authentication
      arbRequest.merchantAuthentication = this.createMerchantAuthentication();
      
      // Subscription Details
      arbRequest.subscription = new ApiContracts.ARBSubscriptionType();
      arbRequest.subscription.setName(subscriptionData.name);
      arbRequest.subscription.setAmount(subscriptionData.amount);
      
      // Payment Schedule
      arbRequest.subscription.setPaymentSchedule(new ApiContracts.PaymentScheduleType());
      arbRequest.subscription.paymentSchedule.setStartDate(subscriptionData.startDate);
      
      // Interval
      arbRequest.subscription.paymentSchedule.setInterval(new ApiContracts.PaymentScheduleType.Interval());
      arbRequest.subscription.paymentSchedule.interval.setLength(1);
      arbRequest.subscription.paymentSchedule.interval.setUnit(
        subscriptionData.interval === 'monthly' 
          ? ApiContracts.ARBSubscriptionUnitEnum.MONTHS
          : ApiContracts.ARBSubscriptionUnitEnum.YEARS
      );
      
      // Payment Method (Opaque Data from AcceptUI)
      arbRequest.subscription.setPayment(new ApiContracts.PaymentType());
      arbRequest.subscription.payment.setOpaqueData(new ApiContracts.OpaqueDataType());
      arbRequest.subscription.payment.opaqueData.setDataDescriptor(subscriptionData.opaqueData.dataDescriptor);
      arbRequest.subscription.payment.opaqueData.setDataValue(subscriptionData.opaqueData.dataValue);
      
      // Customer Information
      arbRequest.subscription.setCustomer(new ApiContracts.CustomerType());
      arbRequest.subscription.customer.setId(subscriptionData.customerId);
      arbRequest.subscription.customer.setEmail(subscriptionData.customerEmail);
      
      // Execute Request
      const controller = new ApiControllers.ARBCreateSubscriptionController(arbRequest.getJSON());
      controller.setEnvironment(this.environment);
      
      return new Promise((resolve) => {
        console.log('🔧 ARBService: About to execute ARB request...');
console.log('🔧 ARBService: Environment:', this.environment);
console.log('🔧 ARBService: API Login ID:', this.apiLoginId ? 'Set' : 'Missing');
console.log('🔧 ARBService: Transaction Key:', this.transactionKey ? 'Set' : 'Missing');
console.log('🔧 ARBService: Request JSON:', arbRequest.getJSON());
console.log('🔧 ARBService: About to call controller.execute()...');
        controller.execute(() => {
          console.log('🔧 ARBService: Callback executed - got response');

          const apiResponse = controller.getResponse();
          console.log('🔧 ARBService: API Response received');
          console.log('🔧 ARBService: Response type:', typeof apiResponse);

          console.log('🔧 ARBService: Response methods:', Object.getOwnPropertyNames(apiResponse));
          console.log('🔧 ARBService: Response keys:', Object.keys(apiResponse));
          try {
            const response = apiResponse.getSubscriptionResponse();
            console.log('🔧 ARBService: Got subscription response');
          } catch (error) {
            console.error('❌ ARBService: Error getting subscription response:', error);
            console.log('🔧 ARBService: Raw response:', apiResponse);
            
            // Handle error response
            const messages = apiResponse.messages;
            console.log('🔧 ARBService: Result Code:', messages.resultCode);
            console.log('🔧 ARBService: Error Messages:', messages.message);
            
            if (messages.resultCode === 'Ok') {
              // This shouldn't happen if we're in the catch block
              resolve({
                success: true,
                message: 'Subscription created successfully'
              });
            } else {
              const errorMessage = messages.message[0].text;
              const errorCode = messages.message[0].code;
              
              console.error('❌ ARBService: Subscription failed:', errorMessage);
              console.error('❌ ARBService: Error code:', errorCode);
              
              resolve({
                success: false,
                error: errorMessage,
                errorCode: errorCode
              });
            }
            return; // Exit early
          }
          
          // Handle success case (if we get here)
          const response = apiResponse.getSubscriptionResponse();
          if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
            console.log('✅ ARBService: Subscription created successfully:', response.getSubscriptionId());
            resolve({
              success: true,
              subscriptionId: response.getSubscriptionId(),
              message: 'Subscription created successfully'
            });
          } else {
            const messages = response.getMessages().getMessage();
            const errorMessage = messages[0].getText();
            const errorCode = messages[0].getCode();
            
            console.error('❌ ARBService: Subscription creation failed:', errorMessage);
            console.error('❌ ARBService: Error code:', errorCode);
            
            resolve({
              success: false,
              error: errorMessage,
              errorCode: errorCode
            });
          }




          // const response = apiResponse.getSubscriptionResponse();
//           console.log('🔧 ARBService: Subscription Response:', response);
//           console.log('🔧 ARBService: Messages:', response.getMessages());
// console.log('🔧 ARBService: Result Code:', response.getMessages().getResultCode());
        // try {
        //   const response = apiResponse.getSubscriptionResponse();
        //   console.log('🔧 ARBService: Got subscription response');
        // } catch (error) {
        //   console.error('❌ ARBService: Error getting subscription response:', error);
        //   console.log('🔧 ARBService: Raw response:', apiResponse);
        // }

          

          
        //   if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
        //     console.log('✅ ARBService: Subscription created successfully:', response.getSubscriptionId());
        //     resolve({
        //       success: true,
        //       subscriptionId: response.getSubscriptionId(),
        //       message: 'Subscription created successfully'
        //     });
        //   } else {
        //     const messages = response.getMessages().getMessage();
        //     const errorMessage = messages[0].getText();
        //     const errorCode = messages[0].getCode();
            
        //     console.error('❌ ARBService: Subscription creation failed:', errorMessage);
        //     console.error('❌ ARBService: Error code:', errorCode);
            
        //     resolve({
        //       success: false,
        //       error: errorMessage,
        //       errorCode: errorCode
        //     });
        //   }
        });
      });
      
    } catch (error) {
      console.error('❌ ARBService: Create subscription error:', error);
      return {
        success: false,
        error: 'Internal error creating subscription'
      };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      console.log('🔧 ARBService: Cancelling subscription:', subscriptionId);
      
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'ARB service not configured - missing credentials'
        };
      }

      const arbRequest = new ApiContracts.ARBCancelSubscriptionRequest();
      arbRequest.merchantAuthentication = this.createMerchantAuthentication();
      arbRequest.setSubscriptionId(subscriptionId);
      
      const controller = new ApiControllers.ARBCancelSubscriptionController(arbRequest.getJSON());
      controller.setEnvironment(this.environment);
      
      return new Promise((resolve) => {
        controller.execute(() => {
          const apiResponse = controller.getResponse();
          const response = apiResponse.getSubscriptionResponse();
          
          if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
            console.log('✅ ARBService: Subscription cancelled successfully');
            resolve({
              success: true,
              message: 'Subscription cancelled successfully'
            });
          } else {
            const messages = response.getMessages().getMessage();
            const errorMessage = messages[0].getText();
            
            console.error('❌ ARBService: Subscription cancellation failed:', errorMessage);
            resolve({
              success: false,
              error: errorMessage
            });
          }
        });
      });
      
    } catch (error) {
      console.error('❌ ARBService: Cancel subscription error:', error);
      return {
        success: false,
        error: 'Internal error cancelling subscription'
      };
    }
  }

  async getSubscription(subscriptionId) {
    try {
      console.log('🔧 ARBService: Getting subscription:', subscriptionId);
      
      if (!this.isConfigured) {
        return {
          success: false,
          error: 'ARB service not configured - missing credentials'
        };
      }

      const arbRequest = new ApiContracts.ARBGetSubscriptionRequest();
      arbRequest.merchantAuthentication = this.createMerchantAuthentication();
      arbRequest.setSubscriptionId(subscriptionId);
      
      const controller = new ApiControllers.ARBGetSubscriptionController(arbRequest.getJSON());
      controller.setEnvironment(this.environment);
      
      return new Promise((resolve) => {
        controller.execute(() => {
          const apiResponse = controller.getResponse();
          const response = apiResponse.getSubscriptionResponse();
          
          if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
            console.log('✅ ARBService: Subscription retrieved successfully');
            resolve({
              success: true,
              subscription: response.getSubscription()
            });
          } else {
            const messages = response.getMessages().getMessage();
            const errorMessage = messages[0].getText();
            
            console.error('❌ ARBService: Get subscription failed:', errorMessage);
            resolve({
              success: false,
              error: errorMessage
            });
          }
        });
      });
      
    } catch (error) {
      console.error('❌ ARBService: Get subscription error:', error);
      return {
        success: false,
        error: 'Internal error getting subscription'
      };
    }
  }
}

module.exports = new ARBService();