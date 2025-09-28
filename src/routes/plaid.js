const express = require("express");
const plaidController = require("../controllers/plaidController");

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

// REMOVED: All old webhook code - now using /webhooks/plaid/transfer

module.exports = router;
