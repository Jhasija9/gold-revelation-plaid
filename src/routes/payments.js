const express = require('express');
const router = express.Router();
const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const Transaction = require('../models/Transaction');
const settlementService = require('../services/settlementService');
const crypto = require('crypto');
const subscriptionController = require('../controllers/subscriptionController');
const sessionAuth = require('../middleware/sessionAuth');

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
function addMonthsUTC(isoDate, monthsToAdd) {
  const d = new Date(isoDate);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const next = new Date(Date.UTC(y, m + monthsToAdd, 1, 0, 0, 0));
  next.setUTCDate(Math.min(day, 28));
  return next.toISOString();
}

async function updateSubscriptionPaymentStatusByGatewayTxId(gatewayTxId, status, failureReason) {
  const txRes = await databaseService.query('transactions', 'select', {
    where: { authorize_net_transaction_id: gatewayTxId }
  });
  if (!txRes.success || txRes.data.length === 0) return;

  const values = { status, updated_at: new Date().toISOString() };
  if (failureReason) values.failure_reason = failureReason;

  await databaseService.query('subscription_payments', 'update', {
    where: { transaction_id: txRes.data[0].id },
    values
  });
}
async function updateTransactionStatus(transactionId, status) {
  try {
    const values = { status };
    const now = new Date().toISOString();

    if (status === 'captured') values.processed_at = now;
    if (status === 'settled')  values.completed_at = now;
    if (status === 'cancelled' || status === 'failed' || status === 'refunded') {
      values.failed_at = now;
      if (failureReason) values.failure_reason = failureReason;
    }

    const result = await databaseService.query('transactions', 'update', {
      where: { authorize_net_transaction_id: transactionId },
      values
    });
    console.log(`✅ Updated transaction ${transactionId} to status: ${status}`);
    return result;
  } catch (error) {
    console.error('❌ Database update error:', error);
    throw error;
  }
}
async function upsertTransactionFromWebhook(payload) {
  const txId = payload?.id;
  if (!txId) return;

  // If we already recorded this transaction, skip
  const existing = await databaseService.query('transactions', 'select', {
    where: { authorize_net_transaction_id: txId }
  });
  if (existing.success && existing.data.length > 0) return;

  // Link to local subscription (if this webhook is from ARB)
  const arbSubId = payload?.subscription?.id;
  let subscriptionRow = null;
  if (arbSubId) {
    const subRes = await databaseService.query('subscriptions', 'select', {
      where: { authorize_net_subscription_id: arbSubId }
    });
    if (subRes.success && subRes.data.length > 0) {
      subscriptionRow = subRes.data[0];
    }
  }

  const amount = Number(payload?.authAmount ?? payload?.settlementAmount ?? 0) || 0;
  const cardType = payload?.payment?.accountType || null;                   // e.g., 'Visa'
  const masked = payload?.payment?.cardNumber || '';                        // e.g., 'XXXX1111'
  const last4 = masked.slice(-4) || null;
  const authCode = payload?.authCode || null;                               // <= 20 chars
  const responseCode = payload?.responseCode ? String(payload.responseCode) : null; // <= 10
  const submittedISO = payload?.submitTimeUTC
    ? new Date(payload.submitTimeUTC).toISOString()
    : new Date().toISOString();


  const txRecord = {
    user_id: subscriptionRow?.user_id || null,
    account_id: null,
    subscription_id: subscriptionRow?.id || null,
    transaction_type: subscriptionRow ? 'subscription_payment' : 'payment',
    amount,
    status: 'pending',                          // will be advanced by status updates below
    description: subscriptionRow ? 'Subscription payment' : 'Card payment',
    plaid_transaction_id: null,
    ach_reference_id: null,
    failure_reason: null,
    created_at: new Date().toISOString(),
    processed_at: null,
    completed_at: null,
    failed_at: null,
    plaid_transfer_id: null,
    payment_method: 'credit_card',
    authorize_net_transaction_id: txId,         // <= 50 chars
    card_last_four: last4,                      // <= 4 chars
    card_type: cardType,                        // <= 20 chars
    customer_profile_id: null,
    authorize_net_auth_code: authCode,          // <= 20 chars
    authorize_net_response_code: responseCode   // <= 10 chars
  };

  await databaseService.query('transactions', 'insert', { values: [txRecord] });

  if (subscriptionRow && txInsert.success && txInsert.data?.[0]?.id) {
    const countRes = await databaseService.query('subscription_payments', 'select', {
      where: { subscription_id: subscriptionRow.id }
    });
    const occurrenceNumber = (countRes.success ? countRes.data.length : 0) + 1;

    await databaseService.query('subscription_payments', 'insert', {
      values: [{
        subscription_id: subscriptionRow.id,
        transaction_id: txInsert.data[0].id,
        occurrence_number: occurrenceNumber,
        amount,
        status: 'pending',
        billing_date: submittedISO,
        retry_count: 0,
        failure_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    });

    // Optional: keep dates/counter if you already have these columns
    const nextBillingISO = addMonthsUTC(submittedISO, 1);
    await databaseService.query('subscriptions', 'update', {
      where: { id: subscriptionRow.id },
      values: {
        last_billing_date: submittedISO,
        next_billing_date: nextBillingISO,
        payments_count: (subscriptionRow.payments_count || 0) + 1,
        updated_at: new Date().toISOString()
      }
    });
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
  // console.log('🌐 Payments Route: Request body:', {
  //   amount: req.body.amount,
  //   user_id: req.body.user_id,
  //   hasOpaqueData: !!req.body.opaqueData,
  //   description: req.body.description
  // });
  
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

    // console.log('🌐 Payments Route: Prepared payment data:', {
    //   amount: paymentData.amount,
    //   description: paymentData.description,
    //   customerEmail: paymentData.customerData.email,
    //   customerIP: paymentData.customerIP
    // });

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

      // console.log('🌐 Payments Route: Storing transaction record:', {
      //   transactionId: chargeResult.transactionId,
      //   authCode: chargeResult.authCode,
      //   amount: transactionRecord.amount
      // });

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
        await upsertTransactionFromWebhook(payload);   
        await updateTransactionStatus(transactionId, 'captured');
        await updateSubscriptionPaymentStatusByGatewayTxId(payload.id, 'captured');
        break;
        case 'net.authorize.payment.void.created':  // ← Make sure this exists
    await updateTransactionStatus(transactionId, 'cancelled');
    break;
   
    case 'net.authorize.customer.subscription.created':
      await databaseService.query('subscriptions', 'update', {
        where: { authorize_net_subscription_id: payload?.id || payload?.subscription?.id },
        values: { status: 'active', updated_at: new Date().toISOString() }
      });
      break;
   
      case 'net.authorize.customer.subscription.suspended':
      await databaseService.query('subscriptions', 'update', {
        where: { authorize_net_subscription_id: payload?.id || payload?.subscription?.id },
        values: { status: 'suspended', updated_at: new Date().toISOString() }
      });
      break;
    
      case 'net.authorize.customer.subscription.cancelled':
      await databaseService.query('subscriptions', 'update', {
        where: { authorize_net_subscription_id: payload?.id || payload?.subscription?.id },
        values: { status: 'cancelled', updated_at: new Date().toISOString() }
      });
      break;
    
      case 'net.authorize.customer.subscription.terminated':
      await databaseService.query('subscriptions', 'update', {
        where: { authorize_net_subscription_id: payload?.id || payload?.subscription?.id },
        values: { status: 'terminated', updated_at: new Date().toISOString() }
      });
      break;
      case 'net.authorize.payment.funded':
  await updateTransactionStatus(payload.id, 'settled');        // keep
  await updateSubscriptionPaymentStatusByGatewayTxId(payload.id, 'settled');  // add
  break;

case 'net.authorize.payment.void.created':
  await updateTransactionStatus(payload.id, 'cancelled');      // keep
  await updateSubscriptionPaymentStatusByGatewayTxId(payload.id, 'cancelled'); // add
  break;

case 'net.authorize.payment.refund.created':
  await updateTransactionStatus(payload.id, 'refunded');       // keep
  await updateSubscriptionPaymentStatusByGatewayTxId(payload.id, 'refunded');  // add
  break;
    
      case 'net.authorize.customer.subscription.expiring':
      await databaseService.query('subscriptions', 'update', {
        where: { authorize_net_subscription_id: payload?.id || payload?.subscription?.id },
        values: { status: 'expiring', updated_at: new Date().toISOString() }
      });
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
// Subscription Routes (NEW - don't modify existing routes)
router.post('/subscribe', subscriptionController.createSubscription);
router.delete('/subscriptions/:subscriptionId', subscriptionController.cancelSubscription);




module.exports = router;
