const express = require('express');
const plaidController = require('../controllers/plaidController');

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
router.post('/webhook', (req, res) => {
  console.log('Plaid webhook received:', req.body);
  
  // Handle different webhook events
  const { webhook_type, webhook_code } = req.body;
  
  switch (webhook_type) {
    case 'ITEM':
      console.log('Item webhook:', webhook_code);
      break;
    case 'ACCOUNTS':
      console.log('Accounts webhook:', webhook_code);
      break;
    case 'AUTH':
      console.log('Auth webhook:', webhook_code);
      break;
    default:
      console.log('Unknown webhook type:', webhook_type);
  }
  
  res.status(200).json({ received: true });
});

module.exports = router;
