// src/routes/subscriptionsAch.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionAchController');

// Create a Plaid (ACH) subscription series
router.post('/subscriptions/ach', ctrl.create.bind(ctrl));

// Plaid recurring webhooks (TRANSFER)
// Point Plaid to this URL in dashboard: POST /api/webhooks/plaid/recurring
router.post('/webhooks/plaid/recurring', async (req, res) => {
  try {
    // Expect a TRANSFER webhook with specific webhook_code
    const code = req.body?.webhook_code;
    switch (code) {
      case 'RECURRING_NEW_TRANSFER':
        return ctrl.recurringNewTransfer(req, res);
      case 'RECURRING_TRANSFER_SKIPPED':
        return ctrl.recurringSkipped(req, res);
      case 'RECURRING_CANCELLED':
        return ctrl.recurringCancelled(req, res);
      default:
        return res.status(200).json({ received: true });
    }
  } catch (e) {
    console.error('ACH recurring webhook router error:', e);
    return res.status(200).json({ received: true });
  }
});

module.exports = router;