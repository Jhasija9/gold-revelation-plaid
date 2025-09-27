const express = require("express");
const plaidController = require("../controllers/plaidController");
const verifyPlaidWebhook = require("../middleware/web_hook_verification");

const router = express.Router();

// GET route for listing available endpoints
router.get("/", (req, res) => {
  res.json({
    message: "Plaid endpoints available",
    endpoints: [
      "POST /create-link-token",
      "POST /exchange-token",
      "POST /get-accounts",
      "POST /get-balance",
    ],
  });
});

// Create Link Token
router.post(
  "/create-link-token",
  plaidController.createLinkToken.bind(plaidController)
);

// Exchange Public Token
router.post(
  "/exchange-token",
  plaidController.exchangeToken.bind(plaidController)
);

// Get Accounts
router.post("/get-accounts", plaidController.getAccounts.bind(plaidController));

// Get Balance
router.post("/get-balance", plaidController.getBalance.bind(plaidController));

// Add this route
// Add this import at the top of the file

// Replace your existing webhook route with this updated version
router.post("/webhook", verifyPlaidWebhook, (req, res) => {
  res.status(200).json({ received: true });

  // Log full webhook data for debugging
  console.log("Webhook received:", JSON.stringify(req.body));
  // Process webhook asynchronously
  setImmediate(async () => {
    try {
      const { webhook_type, webhook_code } = req.body;
      console.log(`Processing ${webhook_type}.${webhook_code} webhook`);

      // Handle different webhook types
      if (webhook_type === "TRANSFER") {
        await plaidController.handleTransferWebhook(req.body);
      }
      
      // Handle TRANSFER_EVENTS_UPDATE
      if (webhook_type === 'TRANSFER' && webhook_code === 'TRANSFER_EVENTS_UPDATE') {
        await plaidController.handleTransferEventsUpdate();
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
    }
  }, 0);
});

// In routes/plaid.js, add this route temporarily
router.post("/webhook-test", (req, res) => {
  console.log("🧪 WEBHOOK TEST RECEIVED:", req.body);
  res.status(200).json({ message: "Test received" });
});

module.exports = router;
