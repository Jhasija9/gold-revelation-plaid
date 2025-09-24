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
  // Process webhook asynchronously
  setImmediate(() => {
    try {
      const { webhook_type, webhook_code } = req.body;
      console.log(`Processing ${webhook_type}.${webhook_code} webhook`);

      // Handle different webhook types
      if (webhook_type === "TRANSFER") {
        plaidController.handleTransferWebhook(req.body);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
    }
  });
});

module.exports = router;
