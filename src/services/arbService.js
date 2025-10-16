// const authorizenet = require('authorizenet');
// const ApiControllers = authorizenet.APIControllers;
// const ApiContracts = authorizenet.APIContracts;
// const Constants = authorizenet.Constants;

// class ARBService {
//   constructor() {
//     console.log('🔧 ARBService: Constructor called');
    
//     // Validate required environment variables
//     this.apiLoginId = process.env.ANET_API_LOGIN_ID;
//     this.transactionKey = process.env.ANET_TRANSACTION_KEY;
//     this.environment = process.env.ANET_ENV === 'production' 
//       ? Constants.endpoint.production 
//       : Constants.endpoint.sandbox;

//     console.log('🔧 ARBService: Environment variables check:');
//     console.log('  - ANET_API_LOGIN_ID:', this.apiLoginId ? '✅ Set' : '❌ Missing');
//     console.log('  - ANET_TRANSACTION_KEY:', this.transactionKey ? '✅ Set' : '❌ Missing');
//     console.log('  - ANET_ENV:', process.env.ANET_ENV || 'sandbox (default)');

//     // Set service availability
//     this.isConfigured = !!(this.apiLoginId && this.transactionKey);
    
//     console.log('🔧 ARBService: Service configured:', this.isConfigured ? '✅ YES' : '❌ NO');
    
//     if (!this.isConfigured) {
//       console.warn('⚠️ Authorize.Net ARB not configured - missing credentials');
//     } else {
//       console.log('✅ ARBService: Ready for subscription processing');
//     }
//   }

//   createMerchantAuthentication() {
//     const merchantAuth = new ApiContracts.MerchantAuthenticationType();
//     merchantAuth.setName(this.apiLoginId);
//     merchantAuth.setTransactionKey(this.transactionKey);
//     return merchantAuth;
//   }

//   async createSubscription(subscriptionData) {
//     try {
//       console.log('🔧 ARBService: Creating subscription:', subscriptionData.name);
      
//       if (!this.isConfigured) {
//         return {
//           success: false,
//           error: 'ARB service not configured - missing credentials'
//         };
//       }

//       const arbRequest = new ApiContracts.ARBCreateSubscriptionRequest();
      
//       // Merchant Authentication
//       arbRequest.merchantAuthentication = this.createMerchantAuthentication();
      
//       // Subscription Details
//       arbRequest.subscription = new ApiContracts.ARBSubscriptionType();
//       arbRequest.subscription.setName(subscriptionData.name);
//       arbRequest.subscription.setAmount(subscriptionData.amount);
      
//       // Payment Schedule
//       arbRequest.subscription.setPaymentSchedule(new ApiContracts.PaymentScheduleType());
//       arbRequest.subscription.paymentSchedule.setStartDate(subscriptionData.startDate);
      
//       // Interval
//       arbRequest.subscription.paymentSchedule.setInterval(new ApiContracts.PaymentScheduleType.Interval());
//       arbRequest.subscription.paymentSchedule.interval.setLength(1);
//       arbRequest.subscription.paymentSchedule.interval.setUnit(
//         subscriptionData.interval === 'monthly' 
//           ? ApiContracts.ARBSubscriptionUnitEnum.MONTHS
//           : ApiContracts.ARBSubscriptionUnitEnum.YEARS
//       );
      
//       // Payment Method (Opaque Data from AcceptUI)
//       arbRequest.subscription.setPayment(new ApiContracts.PaymentType());
//       arbRequest.subscription.payment.setOpaqueData(new ApiContracts.OpaqueDataType());
//       arbRequest.subscription.payment.opaqueData.setDataDescriptor(subscriptionData.opaqueData.dataDescriptor);
//       arbRequest.subscription.payment.opaqueData.setDataValue(subscriptionData.opaqueData.dataValue);
      
//       // Customer Information
//       arbRequest.subscription.setCustomer(new ApiContracts.CustomerType());
//       arbRequest.subscription.customer.setId(subscriptionData.customerId);
//       arbRequest.subscription.customer.setEmail(subscriptionData.customerEmail);
      
//       // Execute Request
//       const controller = new ApiControllers.ARBCreateSubscriptionController(arbRequest.getJSON());
//       controller.setEnvironment(this.environment);
      
//       return new Promise((resolve) => {
//         console.log('🔧 ARBService: About to execute ARB request...');
// console.log('🔧 ARBService: Environment:', this.environment);
// console.log('🔧 ARBService: API Login ID:', this.apiLoginId ? 'Set' : 'Missing');
// console.log('🔧 ARBService: Transaction Key:', this.transactionKey ? 'Set' : 'Missing');
// console.log('🔧 ARBService: Request JSON:', arbRequest.getJSON());
// console.log('🔧 ARBService: About to call controller.execute()...');
//         controller.execute(() => {
//           console.log('🔧 ARBService: Callback executed - got response');

//           const apiResponse = controller.getResponse();
//           console.log('🔧 ARBService: API Response received');
//           console.log('🔧 ARBService: Response type:', typeof apiResponse);

//           console.log('🔧 ARBService: Response methods:', Object.getOwnPropertyNames(apiResponse));
//           console.log('🔧 ARBService: Response keys:', Object.keys(apiResponse));
//           const response = apiResponse.getSubscriptionResponse();
//           console.log('🔧 ARBService: Subscription Response:', response);
//           console.log('🔧 ARBService: Messages:', response.getMessages());
// console.log('🔧 ARBService: Result Code:', response.getMessages().getResultCode());
//         try {
//           const response = apiResponse.getSubscriptionResponse();
//           console.log('🔧 ARBService: Got subscription response');
//         } catch (error) {
//           console.error('❌ ARBService: Error getting subscription response:', error);
//           console.log('🔧 ARBService: Raw response:', apiResponse);
//         }
          
//           if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
//             console.log('✅ ARBService: Subscription created successfully:', response.getSubscriptionId());
//             resolve({
//               success: true,
//               subscriptionId: response.getSubscriptionId(),
//               message: 'Subscription created successfully'
//             });
//           } else {
//             const messages = response.getMessages().getMessage();
//             const errorMessage = messages[0].getText();
//             const errorCode = messages[0].getCode();
            
//             console.error('❌ ARBService: Subscription creation failed:', errorMessage);
//             console.error('❌ ARBService: Error code:', errorCode);
            
//             resolve({
//               success: false,
//               error: errorMessage,
//               errorCode: errorCode
//             });
//           }
//         });
//       });
      
//     } catch (error) {
//       console.error('❌ ARBService: Create subscription error:', error);
//       return {
//         success: false,
//         error: 'Internal error creating subscription'
//       };
//     }
//   }

//   async cancelSubscription(subscriptionId) {
//     try {
//       console.log('🔧 ARBService: Cancelling subscription:', subscriptionId);
      
//       if (!this.isConfigured) {
//         return {
//           success: false,
//           error: 'ARB service not configured - missing credentials'
//         };
//       }

//       const arbRequest = new ApiContracts.ARBCancelSubscriptionRequest();
//       arbRequest.merchantAuthentication = this.createMerchantAuthentication();
//       arbRequest.setSubscriptionId(subscriptionId);
      
//       const controller = new ApiControllers.ARBCancelSubscriptionController(arbRequest.getJSON());
//       controller.setEnvironment(this.environment);
      
//       return new Promise((resolve) => {
//         controller.execute(() => {
//           const apiResponse = controller.getResponse();
//           const response = apiResponse.getSubscriptionResponse();
          
//           if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
//             console.log('✅ ARBService: Subscription cancelled successfully');
//             resolve({
//               success: true,
//               message: 'Subscription cancelled successfully'
//             });
//           } else {
//             const messages = response.getMessages().getMessage();
//             const errorMessage = messages[0].getText();
            
//             console.error('❌ ARBService: Subscription cancellation failed:', errorMessage);
//             resolve({
//               success: false,
//               error: errorMessage
//             });
//           }
//         });
//       });
      
//     } catch (error) {
//       console.error('❌ ARBService: Cancel subscription error:', error);
//       return {
//         success: false,
//         error: 'Internal error cancelling subscription'
//       };
//     }
//   }

//   async getSubscription(subscriptionId) {
//     try {
//       console.log('🔧 ARBService: Getting subscription:', subscriptionId);
      
//       if (!this.isConfigured) {
//         return {
//           success: false,
//           error: 'ARB service not configured - missing credentials'
//         };
//       }

//       const arbRequest = new ApiContracts.ARBGetSubscriptionRequest();
//       arbRequest.merchantAuthentication = this.createMerchantAuthentication();
//       arbRequest.setSubscriptionId(subscriptionId);
      
//       const controller = new ApiControllers.ARBGetSubscriptionController(arbRequest.getJSON());
//       controller.setEnvironment(this.environment);
      
//       return new Promise((resolve) => {
//         controller.execute(() => {
//           const apiResponse = controller.getResponse();
//           const response = apiResponse.getSubscriptionResponse();
          
//           if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
//             console.log('✅ ARBService: Subscription retrieved successfully');
//             resolve({
//               success: true,
//               subscription: response.getSubscription()
//             });
//           } else {
//             const messages = response.getMessages().getMessage();
//             const errorMessage = messages[0].getText();
            
//             console.error('❌ ARBService: Get subscription failed:', errorMessage);
//             resolve({
//               success: false,
//               error: errorMessage
//             });
//           }
//         });
//       });
      
//     } catch (error) {
//       console.error('❌ ARBService: Get subscription error:', error);
//       return {
//         success: false,
//         error: 'Internal error getting subscription'
//       };
//     }
//   }
// }

// module.exports = new ARBService();
// src/services/arbService.js
const authorizenet = require('authorizenet');
const ApiControllers = authorizenet.APIControllers;
const ApiContracts = authorizenet.APIContracts;
const Constants = authorizenet.Constants;

class ARBService {
  constructor() {
    console.log('🔧 ARBService: Constructor called');

    this.apiLoginId = process.env.ANET_API_LOGIN_ID;
    this.transactionKey = process.env.ANET_TRANSACTION_KEY;
    this.environment = process.env.ANET_ENV === 'production'
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox;

    console.log('🔧 ARBService: Environment variables check:');
    console.log('  - ANET_API_LOGIN_ID:', this.apiLoginId ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_TRANSACTION_KEY:', this.transactionKey ? '✅ Set' : '❌ Missing');
    console.log('  - ANET_ENV:', process.env.ANET_ENV || 'sandbox (default)');

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
        return { success: false, error: 'ARB service not configured - missing credentials' };
      }

      // ----- Build request -----
      const req = new ApiContracts.ARBCreateSubscriptionRequest();
      req.merchantAuthentication = this.createMerchantAuthentication();

      const sub = new ApiContracts.ARBSubscriptionType();
      sub.setName(subscriptionData.name);
      sub.setAmount(subscriptionData.amount);

      // Payment schedule (startDate + interval + totalOccurrences REQUIRED)
      const schedule = new ApiContracts.PaymentScheduleType();

      // Start date as YYYY-MM-DD
      schedule.setStartDate(subscriptionData.startDate);

      const interval = new ApiContracts.PaymentScheduleType.Interval();
      interval.setLength(1);
      interval.setUnit(
        subscriptionData.interval === 'monthly'
          ? ApiContracts.ARBSubscriptionUnitEnum.MONTHS
          : ApiContracts.ARBSubscriptionUnitEnum.YEARS
      );
      schedule.setInterval(interval);

      // Keep charging until cancel (Authorize.Net requires totalOccurrences)
      schedule.setTotalOccurrences(9999);

      // Optional trials:
      // schedule.setTrialOccurrences(0);
      // schedule.setTrialAmount(0);

      sub.setPaymentSchedule(schedule);

      // Payment via opaqueData from AcceptUI
      const payment = new ApiContracts.PaymentType();
      const opaque = new ApiContracts.OpaqueDataType();
      opaque.setDataDescriptor(subscriptionData.opaqueData.dataDescriptor);
      opaque.setDataValue(subscriptionData.opaqueData.dataValue);
      payment.setOpaqueData(opaque);
      sub.setPayment(payment);

      // Customer (id/email OK; billTo optional)
      const cust = new ApiContracts.CustomerType();
      // if (subscriptionData.customerId) cust.setId(subscriptionData.customerId);
      if (subscriptionData.customerEmail) cust.setEmail(subscriptionData.customerEmail);
      sub.setCustomer(cust);

      // Optional billTo block (uncomment if you want names on file)
      // const billTo = new ApiContracts.NameAndAddressType();
      // billTo.setFirstName(subscriptionData.firstName || 'Customer');
      // billTo.setLastName(subscriptionData.lastName || 'Name');
      // sub.setBillTo(billTo);

      req.setSubscription(sub);

      // ----- Execute -----
      const controller = new ApiControllers.ARBCreateSubscriptionController(req.getJSON());
      controller.setEnvironment(this.environment);

      console.log('🔧 ARBService: About to execute ARB request...');
      console.log('🔧 ARBService: Environment:', this.environment);
      console.log('🔧 ARBService: API Login ID:', this.apiLoginId ? 'Set' : 'Missing');
      console.log('🔧 ARBService: Transaction Key:', this.transactionKey ? 'Set' : 'Missing');
      console.log('🔧 ARBService: Request JSON:', req.getJSON());
      console.log('🔧 ARBService: About to call controller.execute()...');

      return await new Promise((resolve) => {
        controller.execute(() => {
          console.log('🔧 ARBService: Callback executed - got response');
          try {
            const apiResponse = controller.getResponse();
            console.log('🔧 ARBService: API Response received');

            // Preferred: wrap raw JSON in the proper response class
            let response;
            try {
              response = new ApiContracts.ARBCreateSubscriptionResponse(apiResponse);
            } catch (wrapErr) {
              console.warn('⚠️ ARBService: Could not wrap response, falling back to JSON parse:', wrapErr);
            }

            if (response && response.getMessages) {
              const result = response.getMessages().getResultCode();
              if (result === ApiContracts.MessageTypeEnum.OK) {
                const subId = response.getSubscriptionId && response.getSubscriptionId();
                console.log('✅ ARBService: Subscription created successfully:', subId);
                return resolve({ success: true, subscriptionId: subId, raw: apiResponse });
              } else {
                const msgs = response.getMessages().getMessage();
                const errText = msgs && msgs[0] && msgs[0].getText();
                const errCode = msgs && msgs[0] && msgs[0].getCode();
                console.error('❌ ARBService: Subscription creation failed:', errCode, errText);
                return resolve({ success: false, error: errText || 'ARB create failed', errorCode: errCode, raw: apiResponse });
              }
            }

            // Fallback: handle plain JSON { messages: { resultCode, message: [{ code, text }] }, subscriptionId? }
            const resultCode = apiResponse?.messages?.resultCode;
            const msg0 = Array.isArray(apiResponse?.messages?.message) ? apiResponse.messages.message[0] : null;

            if (resultCode === 'Ok') {
              const subId =
                apiResponse?.subscriptionId ||
                apiResponse?.arbCreateSubscriptionResponse?.subscriptionId ||
                null;
              console.log('✅ ARBService: Subscription created (JSON fallback):', subId);
              return resolve({ success: true, subscriptionId: subId, raw: apiResponse });
            }

            console.error('❌ ARBService: ARB create error (JSON fallback):', msg0?.code, msg0?.text);
            return resolve({
              success: false,
              error: msg0?.text || 'ARB create failed',
              errorCode: msg0?.code,
              raw: apiResponse
            });
          } catch (e) {
            console.error('❌ ARBService: Exception in execute callback:', e);
            return resolve({ success: false, error: e.message || 'Unhandled ARB exception' });
          }
        });
      });
    } catch (error) {
      console.error('❌ ARBService: Create subscription error:', error);
      return { success: false, error: 'Internal error creating subscription' };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      console.log('🔧 ARBService: Cancelling subscription:', subscriptionId);

      if (!this.isConfigured) {
        return { success: false, error: 'ARB service not configured - missing credentials' };
      }

      const req = new ApiContracts.ARBCancelSubscriptionRequest();
      req.merchantAuthentication = this.createMerchantAuthentication();
      req.setSubscriptionId(subscriptionId);

      const controller = new ApiControllers.ARBCancelSubscriptionController(req.getJSON());
      controller.setEnvironment(this.environment);

      return await new Promise((resolve) => {
        controller.execute(() => {
          try {
            const apiResponse = controller.getResponse();
            let response;
            try {
              response = new ApiContracts.ARBCancelSubscriptionResponse(apiResponse);
            } catch (wrapErr) {
              console.warn('⚠️ ARBService: Cancel wrap failed, JSON fallback');
            }

            if (response && response.getMessages) {
              const result = response.getMessages().getResultCode();
              if (result === ApiContracts.MessageTypeEnum.OK) {
                console.log('✅ ARBService: Subscription cancelled successfully');
                return resolve({ success: true, message: 'Subscription cancelled successfully' });
              } else {
                const msgs = response.getMessages().getMessage();
                const errText = msgs && msgs[0] && msgs[0].getText();
                const errCode = msgs && msgs[0] && msgs[0].getCode();
                console.error('❌ ARBService: Cancel failed:', errCode, errText);
                return resolve({ success: false, error: errText || 'Cancel failed', errorCode: errCode, raw: apiResponse });
              }
            }

            // JSON fallback
            const resultCode = apiResponse?.messages?.resultCode;
            const msg0 = Array.isArray(apiResponse?.messages?.message) ? apiResponse.messages.message[0] : null;

            if (resultCode === 'Ok') {
              console.log('✅ ARBService: Cancelled (JSON fallback)');
              return resolve({ success: true, message: 'Subscription cancelled successfully', raw: apiResponse });
            }

            console.error('❌ ARBService: Cancel failed (JSON fallback):', msg0?.code, msg0?.text);
            return resolve({ success: false, error: msg0?.text || 'Cancel failed', errorCode: msg0?.code, raw: apiResponse });
          } catch (e) {
            console.error('❌ ARBService: Exception in cancel execute:', e);
            return resolve({ success: false, error: e.message || 'Unhandled ARB exception' });
          }
        });
      });
    } catch (error) {
      console.error('❌ ARBService: Cancel subscription error:', error);
      return { success: false, error: 'Internal error cancelling subscription' };
    }
  }

  async getSubscription(subscriptionId) {
    try {
      console.log('🔧 ARBService: Getting subscription:', subscriptionId);

      if (!this.isConfigured) {
        return { success: false, error: 'ARB service not configured - missing credentials' };
      }

      const req = new ApiContracts.ARBGetSubscriptionRequest();
      req.merchantAuthentication = this.createMerchantAuthentication();
      req.setSubscriptionId(subscriptionId);

      const controller = new ApiControllers.ARBGetSubscriptionController(req.getJSON());
      controller.setEnvironment(this.environment);

      return await new Promise((resolve) => {
        controller.execute(() => {
          try {
            const apiResponse = controller.getResponse();
            let response;
            try {
              response = new ApiContracts.ARBGetSubscriptionResponse(apiResponse);
            } catch (wrapErr) {
              console.warn('⚠️ ARBService: Get wrap failed, JSON fallback');
            }

            if (response && response.getMessages) {
              const result = response.getMessages().getResultCode();
              if (result === ApiContracts.MessageTypeEnum.OK) {
                console.log('✅ ARBService: Subscription retrieved successfully');
                return resolve({ success: true, subscription: response.getSubscription(), raw: apiResponse });
              } else {
                const msgs = response.getMessages().getMessage();
                const errText = msgs && msgs[0] && msgs[0].getText();
                const errCode = msgs && msgs[0] && msgs[0].getCode();
                console.error('❌ ARBService: Get failed:', errCode, errText);
                return resolve({ success: false, error: errText || 'Get failed', errorCode: errCode, raw: apiResponse });
              }
            }

            // JSON fallback
            const resultCode = apiResponse?.messages?.resultCode;
            const msg0 = Array.isArray(apiResponse?.messages?.message) ? apiResponse.messages.message[0] : null;

            if (resultCode === 'Ok') {
              console.log('✅ ARBService: Retrieved (JSON fallback)');
              return resolve({ success: true, subscription: apiResponse?.subscription, raw: apiResponse });
            }

            console.error('❌ ARBService: Get failed (JSON fallback):', msg0?.code, msg0?.text);
            return resolve({ success: false, error: msg0?.text || 'Get failed', errorCode: msg0?.code, raw: apiResponse });
          } catch (e) {
            console.error('❌ ARBService: Exception in get execute:', e);
            return resolve({ success: false, error: e.message || 'Unhandled ARB exception' });
          }
        });
      });
    } catch (error) {
      console.error('❌ ARBService: Get subscription error:', error);
      return { success: false, error: 'Internal error getting subscription' };
    }
  }
}

module.exports = new ARBService();
