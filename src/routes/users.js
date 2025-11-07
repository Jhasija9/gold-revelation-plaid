
// // src/routes/users.js
// const express = require("express");
// const router = express.Router();
// const { randomUUID } = require("crypto");
// const cookie = require("cookie");

// const User = require("../models/User");
// const LinkSession = require("../models/LinkSession");
// // const { requireFields } = require('../middleware/validation'); // optional

// router.post(
//   "/",
//   // requireFields(['first_name','last_name','email','phone','selected_plan']),
//   async (req, res, next) => {
//     try {
//       const { first_name, last_name, email, phone, selected_plan } =
//         req.body || {};

//       // 1) Create user (existing behavior)
//       const created = await User.create({
//         first_name,
//         last_name,
//         email,
//         phone,
//         selected_plan,
//       });
//       const user_id = created?.id;

//       // 2) Create short-lived link session
//       const link_session_id = randomUUID();
//       await LinkSession.create({
//         id: link_session_id,
//         user_id,
//         ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
//         user_agent: req.headers["user-agent"] || null,
//         // expires_at: omit to use DB default (now()+15m)
//       });

//       // 3) Set secure, opaque cookie (no PII)
//       const cookieStr = cookie.serialize("rg_link_session", link_session_id, {
//         httpOnly: true,
//         secure: true, // required with SameSite=None
//         sameSite: "none",
//         path: "/",
//         maxAge: 15 * 60, // 15 minutes
//       });
//       res.setHeader("Set-Cookie", cookieStr);

//       // 4) 303 redirect to /connect so the browser follows and the cookie sticks
//       const redirectUrl = `/connect?selected_plan=${encodeURIComponent(selected_plan)}`;
//       res.status(303).setHeader("Location", redirectUrl).end();
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// module.exports = router;


// src/routes/users.js
const express = require("express");
const router = express.Router();
const { randomUUID } = require("crypto");
const cookie = require("cookie");

const User = require("../models/User");
const LinkSession = require("../models/LinkSession");

router.post("/", async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, selected_plan } = req.body || {};

    // 1) Check if user already exists
    let user_id;
    const existingUser = await User.findByEmail(email);
    
    if (existingUser.success) {
      // User exists, use existing user
      user_id = existingUser.data.id;
      console.log('✅ Using existing user:', email);
    } else {
      // User doesn't exist, create new user
      const created = await User.create({
        first_name,
        last_name,
        email,
        phone,
        selected_plan,
      });
      
      if (created.id) {
        user_id = created.id;
        console.log('✅ Created new user:', email);
      } else {
        // User creation failed
        console.error('❌ User creation failed:', created);
        return res.status(500).json({
          success: false,
          error: 'Failed to create user account'
        });
      }
    }

    // 2) Create short-lived link session (only if we have valid user_id)
    if (!user_id) {
      return res.status(500).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const link_session_id = randomUUID();
    await LinkSession.create({
      id: link_session_id,
      user_id,
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
      user_agent: req.headers["user-agent"] || null,
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
    const baseUrl = process.env.API_BASE_URL || 'https://gold-revelation-plaid-srhm.vercel.app';
    const redirectUrl = `${baseUrl}/connect?selected_plan=${encodeURIComponent(selected_plan)}`;
    res.status(303).setHeader("Location", redirectUrl).end();
    
  } catch (err) {
    next(err);
  }
});

module.exports = router;