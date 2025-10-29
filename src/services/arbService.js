
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

//       const interval = new ApiContracts.PaymentScheduleType.Interval();
//       interval.setLength(Math.max(subscriptionData.intervalLength || 7, 7));
// interval.setUnit(
//   subscriptionData.interval === 'days'
//     ? ApiContracts.ARBSubscriptionUnitEnum.DAYS
//     : ApiContracts.ARBSubscriptionUnitEnum.MONTHS
// );
// schedule.setInterval(interval);
const interval = new ApiContracts.PaymentScheduleType.Interval();
const isDays = subscriptionData.interval === 'days';     // days = weekly-style; months = monthly
const minLen = isDays ? 7 : 1;                           // 7 days min; 1 month min
const len = Math.max(Number(subscriptionData.intervalLength || minLen), minLen);
interval.setLength(len);
interval.setUnit(isDays
  ? ApiContracts.ARBSubscriptionUnitEnum.DAYS
  : ApiContracts.ARBSubscriptionUnitEnum.MONTHS
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
      console.log('\n🔐 [ARB SERVICE] ========== OPAQUE DATA IN ARB SERVICE ==========');
      console.log('🔐 [ARB SERVICE] Timestamp:', new Date().toISOString());
      console.log('🔐 [ARB SERVICE] Subscription Data:', JSON.stringify(subscriptionData, null, 2));
      console.log('🔐 [ARB SERVICE] Opaque Data Object:', JSON.stringify(subscriptionData.opaqueData, null, 2));
      console.log('🔐 [ARB SERVICE] dataDescriptor:', subscriptionData.opaqueData?.dataDescriptor);
      console.log('🔐 [ARB SERVICE] dataDescriptor Type:', typeof subscriptionData.opaqueData?.dataDescriptor);
      console.log('🔐 [ARB SERVICE] dataDescriptor Length:', subscriptionData.opaqueData?.dataDescriptor?.length || 0);
      console.log('🔐 [ARB SERVICE] dataValue:', subscriptionData.opaqueData?.dataValue);
      console.log('🔐 [ARB SERVICE] dataValue Type:', typeof subscriptionData.opaqueData?.dataValue);
      console.log('🔐 [ARB SERVICE] dataValue Length:', subscriptionData.opaqueData?.dataValue?.length || 0);
      
      // E00114 Specific Validation
      if (subscriptionData.opaqueData?.dataValue) {
        const dv = subscriptionData.opaqueData.dataValue;
        console.log('🔐 [ARB SERVICE] dataValue Character Codes (first 50):', Array.from(dv.slice(0, 50)).map(c => c.charCodeAt(0)));
        console.log('🔐 [ARB SERVICE] Has Whitespace?', /\s/.test(dv));
        console.log('🔐 [ARB SERVICE] Has Newlines?', /\n|\r/.test(dv));
        console.log('🔐 [ARB SERVICE] First 100 chars:', dv.substring(0, 100));
        console.log('🔐 [ARB SERVICE] Last 100 chars:', dv.substring(Math.max(0, dv.length - 100)));
      }
      console.log('🔐 [ARB SERVICE] ========== END ARB LOGGING ==========\n');
      // ========== END OPAQUE DATA LOGGING ==========
      
      const opaque = new ApiContracts.OpaqueDataType();
      opaque.setDataDescriptor(subscriptionData.opaqueData.dataDescriptor);
      opaque.setDataValue(subscriptionData.opaqueData.dataValue);
      
      // ========== LOG AFTER SETTING VALUES ==========
      console.log('🔐 [ARB SERVICE] After setting on OpaqueDataType:');
      console.log('🔐 [ARB SERVICE] Opaque Object Type:', opaque.constructor.name);
      console.log('🔐 [ARB SERVICE] ========== END SET LOGGING ==========\n');
      // ========== END SET LOGGING ==========
      // opaque.setDataDescriptor(subscriptionData.opaqueData.dataDescriptor);
      // opaque.setDataValue(subscriptionData.opaqueData.dataValue);
      payment.setOpaqueData(opaque);
      sub.setPayment(payment);

      // Customer (id/email OK; billTo optional)
      const cust = new ApiContracts.CustomerType();
      // if (subscriptionData.customerId) cust.setId(subscriptionData.customerId);
      if (subscriptionData.customerEmail) cust.setEmail(subscriptionData.customerEmail);
      sub.setCustomer(cust);

      const billTo = new ApiContracts.NameAndAddressType();
billTo.setFirstName(subscriptionData.firstName || 'Customer');
billTo.setLastName(subscriptionData.lastName || 'Name');
sub.setBillTo(billTo);

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
      console.log('🔍 [ARB SERVICE] ANET_ENV env var:', process.env.ANET_ENV || 'NOT SET');

      console.log('🔧 ARBService: Environment:', this.environment);
      console.log('🔧 ARBService: API Login ID:', this.apiLoginId ? 'Set' : 'Missing');
      console.log('🔧 ARBService: Transaction Key:', this.transactionKey ? 'Set' : 'Missing');
      console.log('🔧 ARBService: Request JSON:', req.getJSON());
      console.log('🔧 ARBService: About to call controller.execute()...');
      console.log('\n📤 [ARB SERVICE] ========== ACTUAL REQUEST TO AUTHORIZE.NET ==========');
      const requestJson = req.getJSON();
      console.log('📤 [ARB SERVICE] Full Request JSON:', JSON.stringify(requestJson, null, 2));
      console.log('📤 [ARB SERVICE] Opaque Data in Request:', JSON.stringify(requestJson.ARBCreateSubscriptionRequest?.subscription?.payment?.opaqueData || 'NOT FOUND', null, 2));
      console.log('📤 [ARB SERVICE] ========== END REQUEST LOGGING ==========\n');

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
                if (errCode === 'E00114' || errText?.includes('OTS Token')) {
                  console.error('\n❌ [ARB SERVICE] ========== E00114 INVALID OTS TOKEN DETECTED ==========');
                  console.error('❌ [ARB SERVICE] Error Code:', errCode);
                  console.error('❌ [ARB SERVICE] Error Text:', errText);
                  console.error('❌ [ARB SERVICE] ARB API Environment:', this.environment);
                  console.error('❌ [ARB SERVICE] Expected AcceptUI Environment:', process.env.ANET_ENV || 'sandbox');
                  console.error('❌ [ARB SERVICE] ENVIRONMENT MATCH?', (this.environment === Constants.endpoint.production && (process.env.ANET_ENV === 'production')) || (this.environment === Constants.endpoint.sandbox && (process.env.ANET_ENV !== 'production')));
                  console.error('❌ [ARB SERVICE] Opaque Data That Failed:');
                  console.error('❌ [ARB SERVICE]   dataDescriptor:', subscriptionData.opaqueData?.dataDescriptor);
                  console.error('❌ [ARB SERVICE]   dataValue:', subscriptionData.opaqueData?.dataValue);
                  console.error('❌ [ARB SERVICE]   dataValue Length:', subscriptionData.opaqueData?.dataValue?.length);
                  console.error('❌ [ARB SERVICE] Full API Response:', JSON.stringify(apiResponse, null, 2));
                  console.error('❌ [ARB SERVICE] ========== END E00114 LOGGING ==========\n');
                }
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
