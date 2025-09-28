const express = require('express');
const router = express.Router();
const transferEventSyncService = require('../services/transferEventSyncService');

// POST /webhooks/plaid/transfer
router.post('/plaid/transfer', async (req, res) => {
  try {
    const { webhook_type, webhook_code } = req.body;

    // Log webhook received
    console.log(`🔔 Webhook received: ${webhook_type}.${webhook_code}`);

    // Only process TRANSFER_EVENTS_UPDATE webhooks
    if (webhook_type !== 'TRANSFER' || webhook_code !== 'TRANSFER_EVENTS_UPDATE') {
      console.log(`⏭️ Ignoring webhook: ${webhook_type}.${webhook_code}`);
      return res.status(200).json({ received: true, ignored: true });
    }

    // Process webhook asynchronously
    setImmediate(async () => {
      try {
        console.log('🔄 Processing TRANSFER_EVENTS_UPDATE webhook...');
        const result = await transferEventSyncService.syncTransferEvents();
        
        if (result.success) {
          console.log(`✅ Webhook processing completed. Processed ${result.eventsProcessed} events`);
        } else {
          console.error('❌ Webhook processing failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
      }
    });

    // Respond quickly to Plaid
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook endpoint error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

// Admin endpoint: Force sync
router.post('/plaid/sync', async (req, res) => {
  try {
    console.log('🔄 Manual sync triggered');
    const result = await transferEventSyncService.syncTransferEvents();
    
    res.json({
      success: result.success,
      eventsProcessed: result.eventsProcessed,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint: Backfill
router.post('/plaid/backfill', async (req, res) => {
  try {
    const { after_event_id } = req.body;
    console.log(`🔄 Backfill triggered from event ID: ${after_event_id || 'beginning'}`);
    
    const result = await transferEventSyncService.backfillFromEventId(after_event_id);
    
    res.json({
      success: result.success,
      eventsProcessed: result.eventsProcessed,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Backfill error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint: Fire test webhook
router.post('/plaid/test-webhook', async (req, res) => {
  try {
    console.log('🧪 Firing test webhook...');
    const result = await transferEventSyncService.fireTestWebhook();
    
    res.json({
      success: result.success,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
