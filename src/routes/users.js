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
            res.json({
                success: true,
                customer_id: result.data.customer_id,
                user_id: result.data.id,
                message: 'User created successfully'
            });
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
