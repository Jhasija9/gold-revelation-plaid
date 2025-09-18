const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Create new user
router.post('/', async (req, res) => {
    try {
        const userData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            phone: req.body.phone,
            selected_plan: req.body.selected_plan,
            status: 'pending'
        };

        const result = await User.create(userData);

        if (result.success) {
            // Redirect to connect page
            return res.redirect(303, '/connect');
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

module.exports = router;
