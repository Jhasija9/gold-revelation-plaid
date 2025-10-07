const express = require('express');
const router = express.Router();
const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const Transaction = require('../models/Transaction');

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

// Webhook handler stub for Authorize.Net events
router.post('/webhook', (req, res) => {
  try {
    console.log('🔔 Authorize.Net webhook received:', req.body);
    
    // TODO: Verify SHA-512 signature
    // TODO: Parse event type and update transaction status
    
    const { eventType, payload } = req.body;
    
    if (eventType) {
      console.log(`📦 Processing webhook event: ${eventType}`);
      // Future: Update transaction status based on settlement/void/refund events
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

module.exports = router;
