const express = require('express');
const plaidController = require('../controllers/plaidController');
const verifyPlaidWebhook = require('../middleware/web_hook_verification');



const router = express.Router();

// GET route for listing available endpoints
router.get('/', (req, res) => {
  res.json({
    message: "Plaid endpoints available",
    endpoints: [
      "POST /create-link-token",
      "POST /exchange-token", 
      "POST /get-accounts",
      "POST /get-balance"
    ]
  });
});

// Create Link Token
router.post('/create-link-token', plaidController.createLinkToken.bind(plaidController));

// Exchange Public Token
router.post('/exchange-token', plaidController.exchangeToken.bind(plaidController));

// Get Accounts
router.post('/get-accounts', plaidController.getAccounts.bind(plaidController));

// Get Balance
router.post('/get-balance', plaidController.getBalance.bind(plaidController));

// Add this route
// Add this import at the top of the file

// Replace your existing webhook route with this updated version
router.post('/webhook', verifyPlaidWebhook, (req, res) => {
  // Already responded with 200 OK in middleware if verification passed
  // Process webhook asynchronously to avoid timeouts
  setImmediate(() => {
    try {
      const { webhook_type, webhook_code } = req.body;
      console.log(`Processing ${webhook_type}.${webhook_code} webhook`);
      
      // Handle different webhook types
      switch (webhook_type) {
        case 'TRANSFER':
          plaidController.handleTransferWebhook(req.body);
          break;
        case 'ITEM':
          // Handle item webhooks
          break;
        case 'AUTH':
          // Handle auth webhooks
          break;
        default:
          console.log(`Unhandled webhook type: ${webhook_type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  });
});
