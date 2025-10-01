const express = require("express");
const paymentFormController = require("../controllers/paymentFormController");

const router = express.Router();

// Generate secure payment form (iframe) - NO AUTH like Plaid
router.post(
  "/generate",
  paymentFormController.generatePaymentForm.bind(paymentFormController)
);

// Handle payment form response (from iframe) - NO AUTH like Plaid
router.post(
  "/response",
  paymentFormController.handlePaymentFormResponse.bind(paymentFormController)
);

module.exports = router;
