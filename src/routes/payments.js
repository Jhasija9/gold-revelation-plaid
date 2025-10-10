const express = require('express');
const router = express.Router();
const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const Transaction = require('../models/Transaction');
const settlementService = require('../services/settlementService');
const crypto = require('crypto');

function verifyWebhookSignature(rawBody, signature) {
  const signatureKey = process.env.ANET_SIGNATURE_KEY;
  
  const expectedSignature = crypto
    .createHmac('sha512', signatureKey)
    .update(rawBody)
    .digest('hex');
  
  // Extract just the hash part (remove 'sha512=' prefix)
  const receivedHash = signature.replace('sha512=', '');
  const expectedHash = expectedSignature;
  
  // Case-insensitive comparison of just the hash
  return receivedHash.toLowerCase() === expectedHash.toLowerCase();
}
async function updateTransactionStatus(transactionId, status) {
  try {
    // Update transaction status in database using databaseService
    const result = await databaseService.query('transactions', 'update', {
      where: { authorize_net_transaction_id: transactionId },
      values: { status: status }
    });
    
    console.log(`✅ Updated transaction ${transactionId} to status: ${status}`);
    return result;
  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }
}

// Get Authorize.Net public configuration
router.get('/config', (req, res) => {
  console.log('🌐 Payments Route: /config endpoint called');
  
  try {
    console.log('🌐 Payments Route: Calling acceptSuiteService.getPublicConfig()');
    const result = acceptSuiteService.getPublicConfig();
    
    console.log('🌐 Payments Route: getPublicConfig result:', result);
    
    if (result.success) {
      console.log('✅ Payments Route: Returning successful config');
      res.json({
        success: true,
        config: result.config
      });
    } else {
      // Service not configured
      console.log('❌ Payments Route: Service not configured, returning 503');
      res.status(503).json({
        success: false,
        code: result.code,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Payments Route: Exception in /config:', error);
    console.error('🌐 Payments Route: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment configuration'
    });
  }
});

// Charge with opaqueData from AcceptUI
router.post('/charge', async (req, res) => {
  console.log('🌐 Payments Route: /charge endpoint called');
  console.log('🌐 Payments Route: Request body:', {
    amount: req.body.amount,
    user_id: req.body.user_id,
    hasOpaqueData: !!req.body.opaqueData,
    description: req.body.description
  });
  
  try {
    const {
      amount,
      description,
      opaqueData,
      user_id
    } = req.body;

    // Validate required fields
    if (!amount || !opaqueData || !user_id) {
      console.log('❌ Payments Route: Missing required fields');
      console.log('🌐 Payments Route: Validation failed:', {
        hasAmount: !!amount,
        hasOpaqueData: !!opaqueData,
        hasUserId: !!user_id
      });
      
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Amount, payment data, and user ID are required'
      });
    }

    console.log('✅ Payments Route: Validation passed');

    // Get user details for customer data
    console.log('🌐 Payments Route: Fetching user details for ID:', user_id);
    const userResult = await databaseService.query('users', 'select', {
      where: { id: user_id }
    });

    if (!userResult.success || userResult.data.length === 0) {
      console.log('❌ Payments Route: User not found:', user_id);
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];
    console.log('✅ Payments Route: User found:', user.email);

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      description: description || `Gold Purchase - $${amount}`,
      opaqueData,
      customerData: {
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      customerIP: req.ip || req.connection.remoteAddress
    };

    console.log('🌐 Payments Route: Prepared payment data:', {
      amount: paymentData.amount,
      description: paymentData.description,
      customerEmail: paymentData.customerData.email,
      customerIP: paymentData.customerIP
    });

    // Process the payment
    console.log('🌐 Payments Route: Calling acceptSuiteService.chargeWithOpaqueData()');
    const chargeResult = await acceptSuiteService.chargeWithOpaqueData(paymentData);
    
    console.log('🌐 Payments Route: Charge result:', chargeResult);

    if (chargeResult.success) {
      console.log('✅ Payments Route: Payment successful, storing transaction');
      
      // Store transaction record
      const transactionRecord = {
        user_id: user_id,
        transaction_type: 'payment',
        amount: parseFloat(amount),
        status: 'pending', // Credit card payments are immediate
        description: paymentData.description,
        payment_method: 'credit_card',
        authorize_net_transaction_id: chargeResult.transactionId,
        authorize_net_auth_code: chargeResult.authCode,
        authorize_net_response_code: chargeResult.responseCode,
        card_last_four: chargeResult.cardLastFour,        
        card_type: chargeResult.cardType,         
        created_at: new Date().toISOString(),
      };

      console.log('🌐 Payments Route: Storing transaction record:', {
        transactionId: chargeResult.transactionId,
        authCode: chargeResult.authCode,
        amount: transactionRecord.amount
      });

      const dbResult = await databaseService.query('transactions', 'insert', {
        values: [transactionRecord]
      });

      if (!dbResult.success) {
        console.error('❌ Payments Route: Failed to store transaction record:', dbResult.error);
        // Don't fail the response since payment was successful
      } else {
        console.log('✅ Payments Route: Transaction record stored successfully');
      }

      console.log('✅ Payments Route: Returning successful response');
      res.json({
        success: true,
        transactionId: chargeResult.transactionId,
        authCode: chargeResult.authCode,
        message: chargeResult.message,
        amount: amount,
        description: paymentData.description
      });

    } else {
      // Payment failed - return appropriate HTTP status
      const statusCode = chargeResult.code === 'INVALID_AMOUNT' || 
                        chargeResult.code === 'INVALID_OPAQUE_DATA' ? 400 : 402;
      
      console.log('❌ Payments Route: Payment failed, returning status:', statusCode);
      console.log('🌐 Payments Route: Failure details:', {
        code: chargeResult.code,
        message: chargeResult.message
      });
      
      res.status(statusCode).json({
        success: false,
        code: chargeResult.code,
        message: chargeResult.message
      });
    }

  } catch (error) {
    console.error('❌ Payments Route: Exception in /charge:', error);
    console.error('🌐 Payments Route: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An error occurred processing your payment. Please try again.'
    });
  }
});
// Add this to your routes/payments.js for testing
// Test credentials endpoint - FIXED VERSION
router.get('/test-credentials', async (req, res) => {
  try {
    const authorizenet = require('authorizenet');
    const ApiControllers = authorizenet.APIControllers;
    const ApiContracts = authorizenet.APIContracts;
    const Constants = authorizenet.Constants;
    
    console.log('🧪 Testing credentials with both sandbox and production endpoints...');
    
    // Create authenticate test request
    const authReq = new ApiContracts.AuthenticateTestRequest();
    const merchantAuth = new ApiContracts.MerchantAuthenticationType();
    merchantAuth.setName(process.env.ANET_API_LOGIN_ID);
    merchantAuth.setTransactionKey(process.env.ANET_TRANSACTION_KEY);
    authReq.setMerchantAuthentication(merchantAuth);
    
    // Test with SANDBOX endpoint first
    console.log('🧪 Testing credentials with SANDBOX endpoint...');
    const sandboxCtrl = new ApiControllers.AuthenticateTestController(authReq.getJSON(), {
      logger: { enabled: false, location: './', level: 'error' },
      proxy: { setProxy: false, proxyUrl: '' },
      timeout: 120000,
      environment: Constants.endpoint.sandbox
    });
    
    const sandboxResult = await new Promise((resolve, reject) => {
      sandboxCtrl.execute(() => {
        try { resolve(sandboxCtrl.getResponse()); } 
        catch (e) { reject(e); }
      });
    });
    
    console.log('🧪 Sandbox test result:', sandboxResult);
    
    // Test with PRODUCTION endpoint
    console.log('🧪 Testing credentials with PRODUCTION endpoint...');
    const prodCtrl = new ApiControllers.AuthenticateTestController(authReq.getJSON(), {
      logger: { enabled: false, location: './', level: 'error' },
      proxy: { setProxy: false, proxyUrl: '' },
      timeout: 120000,
      environment: Constants.endpoint.production
    });
    
    const prodResult = await new Promise((resolve, reject) => {
      prodCtrl.execute(() => {
        try { resolve(prodCtrl.getResponse()); } 
        catch (e) { reject(e); }
      });
    });
    
    console.log('🧪 Production test result:', prodResult);
    
    res.json({
      success: true,
      credentials: {
        apiLoginId: process.env.ANET_API_LOGIN_ID,
        transactionKeyLength: process.env.ANET_TRANSACTION_KEY?.length,
        environment: process.env.ANET_ENV
      },
      sandboxTest: {
        success: sandboxResult.messages.resultCode === 'Ok',
        resultCode: sandboxResult.messages.resultCode,
        message: sandboxResult.messages.message?.[0]?.text || 'No message',
        code: sandboxResult.messages.message?.[0]?.code || 'No code'
      },
      productionTest: {
        success: prodResult.messages.resultCode === 'Ok',
        resultCode: prodResult.messages.resultCode,
        message: prodResult.messages.message?.[0]?.text || 'No message',
        code: prodResult.messages.message?.[0]?.code || 'No code'
      }
    });
    
  } catch (error) {
    console.error('🧪 Credential test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Add this endpoint
router.get('/auth-test', async (req, res) => {
  try {
    console.log('🔧 Auth Test Endpoint: Testing Authorize.Net authentication');
    
    const authResult = await acceptSuiteService.testAuth();
    
    if (authResult.success) {
      res.json({
        success: true,
        message: 'Authentication successful',
        environment: process.env.ANET_ENV || 'sandbox',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Authentication failed',
        error: authResult.message,
        environment: process.env.ANET_ENV || 'sandbox',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Auth test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Auth test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook handler stub for Authorize.Net events
// In /src/routes/payments.js
// Add this middleware to capture raw body
router.post('/webhook', async (req, res) => {
  try {
    // Get raw body from the request
    const rawBody = req.rawBody; 
    const signature = req.headers['x-anet-signature'];
    
    console.log('🔍 Webhook received:', {
      rawBody: rawBody,
      signature: signature
    });
    
    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.log('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook
    const { eventType, payload } = req.body;
    const transactionId = payload.id;
    
    switch (eventType) {
      case 'net.authorize.payment.authcapture.created':
        await updateTransactionStatus(transactionId, 'captured');
        break;
        case 'net.authorize.payment.void.created':  // ← Make sure this exists
    await updateTransactionStatus(transactionId, 'cancelled');
    break;
  case 'net.authorize.payment.refund.created':
    await updateTransactionStatus(transactionId, 'refunded');
    break;
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});
// Settlement check endpoint
router.post('/settlement/check', async (req, res) => {
  try {
    console.log('🔄 Manual settlement check triggered');
    const result = await settlementService.checkSettledTransactions();
    
    res.json({
      success: result.success,
      transactionsUpdated: result.transactionsUpdated || 0,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Manual settlement check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


module.exports = router;
