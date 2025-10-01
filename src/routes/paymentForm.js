const express = require('express');
const router = express.Router();
const paymentFormController = require('../controllers/paymentFormController');
const sessionAuth = require('../middleware/sessionAuth'); // Use session auth instead

// Generate secure payment form (iframe) - Use session auth
router.post('/generate', sessionAuth.validateSession, paymentFormController.generatePaymentForm);

// Handle payment form response (from iframe) - Use session auth
router.post('/response', sessionAuth.validateSession, paymentFormController.handlePaymentFormResponse);

module.exports = router;
