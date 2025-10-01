const express = require('express');
const router = express.Router();
const paymentFormController = require('../controllers/paymentFormController');
const auth = require('../middleware/auth');

// Generate secure payment form (iframe)
router.post('/generate', auth.authenticate, paymentFormController.generatePaymentForm);

// Handle payment form response (from iframe)
router.post('/response', auth.authenticate, paymentFormController.handlePaymentFormResponse);

module.exports = router;
