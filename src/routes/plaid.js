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
  console.log("🎯 WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2));
  console.log("🎯 WEBHOOK HEADERS:", JSON.stringify(req.headers, null, 2));
  console.log("🎯 WEBHOOK TIMESTAMP:", new Date().toISOString());
  
  res.status(200).json({ received: true });

  // Process webhook asynchronously
  setImmediate(async () => {
    try {
      const { webhook_type, webhook_code } = req.body;
      console.log(`🎯 Processing ${webhook_type}.${webhook_code} webhook`);

      // Handle different webhook types
      if (webhook_type === "TRANSFER") {
        console.log("🎯 TRANSFER WEBHOOK DETECTED");
        console.log("🎯 Transfer webhook data:", JSON.stringify(req.body, null, 2));
        
        // Handle transfer status updates
        if (webhook_code === "TRANSFER_POSTED") {
          console.log("🎯 TRANSFER_POSTED - Transfer has been posted");
        } else if (webhook_code === "TRANSFER_SETTLED") {
          console.log("🎯 TRANSFER_SETTLED - Transfer has been settled");
        } else if (webhook_code === "TRANSFER_FAILED") {
          console.log("🎯 TRANSFER_FAILED - Transfer has failed");
        } else if (webhook_code === "TRANSFER_CANCELLED") {
          console.log("🎯 TRANSFER_CANCELLED - Transfer has been cancelled");
        }
      } else {
        console.log(`🎯 OTHER WEBHOOK TYPE: ${webhook_type}.${webhook_code}`);
      }
    } catch (error) {
      console.error("🎯 Error processing webhook:", error);
    }
  }, 0);
});

// In routes/plaid.js, add this route temporarily
router.post("/webhook-test", (req, res) => {
  console.log("🧪 WEBHOOK TEST RECEIVED:", req.body);
  res.status(200).json({ message: "Test received" });
});

module.exports = router;
