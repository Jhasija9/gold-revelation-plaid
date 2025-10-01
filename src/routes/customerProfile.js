const express = require('express');
const router = express.Router();
const customerProfileController = require('../controllers/customerProfileController');
const auth = require('../middleware/auth');

// Create customer profile
router.post('/create', auth, customerProfileController.createCustomerProfile);

// Save customer card
router.post('/save-card', auth, customerProfileController.saveCustomerCard);

// Get customer profile
router.get('/profile/:user_id', auth, customerProfileController.getCustomerProfile);

// Get saved cards
router.get('/cards/:user_id', auth, customerProfileController.getSavedCards);

// Delete saved card
router.delete('/cards/:user_id/:payment_profile_id', auth, customerProfileController.deleteSavedCard);

module.exports = router;
