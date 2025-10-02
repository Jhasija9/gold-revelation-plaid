const express = require('express');
const router = express.Router();
const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const Transaction = require('../models/Transaction');

// Get Authorize.Net public configuration
router.get('/config', (req, res) => {
  try {
    const result = acceptSuiteService.getPublicConfig();
    
    if (result.success) {
      res.json({
        success: true,
        config: result.config
      });
    } else {
      // Service not configured
      res.status(503).json({
        success: false,
        code: result.code,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment configuration'
    });
  }
});

// Charge with opaqueData from AcceptUI
router.post('/charge', async (req, res) => {
  try {
    const {
      amount,
      description,
      opaqueData,
      user_id,
      plan_name
    } = req.body;

    // Validate required fields
    if (!amount || !opaqueData || !user_id) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'Amount, payment data, and user ID are required'
      });
    }

    // Get user details for customer data
    const userResult = await databaseService.query('users', 'select', {
      where: { id: user_id }
    });

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];

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

    // Process the payment
    const chargeResult = await acceptSuiteService.chargeWithOpaqueData(paymentData);

    if (chargeResult.success) {
      // Store transaction record
      const transactionRecord = {
        user_id: user_id,
        transaction_type: 'payment',
        amount: parseFloat(amount),
        status: 'completed', // Credit card payments are immediate
        description: paymentData.description,
        payment_method: 'credit_card',
        authorize_net_transaction_id: chargeResult.transactionId,
        authorize_net_auth_code: chargeResult.authCode,
        plan_name: plan_name || null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const dbResult = await databaseService.query('transactions', 'insert', {
        values: [transactionRecord]
      });

      if (!dbResult.success) {
        console.error('Failed to store transaction record:', dbResult.error);
        // Don't fail the response since payment was successful
      }

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
      
      res.status(statusCode).json({
        success: false,
        code: chargeResult.code,
        message: chargeResult.message
      });
    }

  } catch (error) {
    console.error('Charge endpoint error:', error);
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
