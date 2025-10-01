const express = require('express');
const router = express.Router();
const customerProfileController = require('../controllers/customerProfileController');
const sessionAuth = require('../middleware/sessionAuth'); // Use session auth instead

// Customer profile routes - Use session auth
router.post('/create', sessionAuth.validateSession, customerProfileController.createCustomerProfile);
router.get('/:customerId', sessionAuth.validateSession, customerProfileController.getCustomerProfile);
router.post('/:customerId/payment-profile', sessionAuth.validateSession, customerProfileController.createPaymentProfile);
router.get('/:customerId/payment-profiles', sessionAuth.validateSession, customerProfileController.getPaymentProfiles);
router.delete('/:customerId/payment-profile/:paymentProfileId', sessionAuth.validateSession, customerProfileController.deletePaymentProfile);

module.exports = router;
