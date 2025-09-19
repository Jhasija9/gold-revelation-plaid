// const express = require('express');
// const User = require('../models/User');
// const router = express.Router();

// // Create new user
// router.post('/', async (req, res) => {
//     try {
//         const userData = {
//             first_name: req.body.first_name,
//             last_name: req.body.last_name,
//             email: req.body.email,
//             phone: req.body.phone,
//             selected_plan: req.body.selected_plan,
//             status: 'pending'
//         };

//         const result = await User.create(userData);

//         if (result.success) {
//             // Redirect to connect page
//             return res.redirect(303, '/connect');
//         } else {
//             res.status(500).json(result);
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: 'Failed to create user'
//         });
//     }
// });

// module.exports = router;
// src/routes/users.js
const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const cookie = require("cookie");

const User = require("../models/User");
const LinkSession = require("../models/LinkSession");
// const { requireFields } = require('../middleware/validation'); // optional

router.post(
  "/",
  // requireFields(['first_name','last_name','email','phone','selected_plan']),
  async (req, res, next) => {
    try {
      const { first_name, last_name, email, phone, selected_plan } =
        req.body || {};

      // 1) Create user (existing behavior)
      const created = await User.create({
        first_name,
        last_name,
        email,
        phone,
        selected_plan,
      });
      const user_id = created?.id;

      // 2) Create short-lived link session
      const link_session_id = randomUUID();
      await LinkSession.create({
        id: link_session_id,
        user_id,
        ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
        user_agent: req.headers["user-agent"] || null,
        // expires_at: omit to use DB default (now()+15m)
      });

      // 3) Set secure, opaque cookie (no PII)
      const cookieStr = cookie.serialize("rg_link_session", link_session_id, {
        httpOnly: true,
        secure: true, // required with SameSite=None
        sameSite: "none",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
      });
      res.setHeader("Set-Cookie", cookieStr);

      // 4) 303 redirect to /connect so the browser follows and the cookie sticks
      res.status(303).setHeader("Location", "/connect").end();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
