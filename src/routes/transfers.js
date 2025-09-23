const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');

// Create transfer
router.post('/create', transferController.createTransfer.bind(transferController));

// Get transfer status
router.get('/status/:transfer_id', transferController.getTransferStatus.bind(transferController));

// Get user transactions
router.get('/user/:user_id', transferController.getUserTransactions.bind(transferController));

module.exports = router;
