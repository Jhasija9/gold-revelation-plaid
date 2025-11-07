const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookie = require("cookie");
require("dotenv").config();
console.log("...kdkdm");

// Import routes
const plaidRoutes = require("./routes/plaid");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payments");
const transferRoutes = require("./routes/transfers");
const webhookRoutes = require("./routes/webhooks"); // NEW
const bodyParser = require("body-parser");
const paymentFormRoutes = require('./routes/paymentForm');
const settlementService = require('./services/settlementService');
const cron = require('node-cron');
// Import middleware
const errorHandler = require("./middleware/errorHandler");
const subscriptionsAchRoutes = require('./routes/subscriptionsAch');


const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'", 
          "https://cdn.plaid.com", 
          "https://js.authorize.net",      // AcceptUI production
          "https://jstest.authorize.net",  // AcceptUI sandbox
          "'unsafe-inline'"
        ],
        "connect-src": [
          "'self'", 
          "https://*.plaid.com",
          "https://api.authorize.net",     // Authorize.Net API production
          "https://apitest.authorize.net"  // Authorize.Net API sandbox
        ],
        "frame-src": [
          "'self'",                    // Your own domain
          "https://*.plaid.com",       // For bank transfers (Plaid Link)
          "https://*.authorize.net"    // For credit cards (Authorize.Net)
        ],
        "img-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
        "object-src": ["'none'"],
      },
    },
  })
);

// CORS middleware
// app.use(
//   cors({
//     origin: process.env.ALLOWED_ORIGINS
//       ? process.env.ALLOWED_ORIGINS.split(",")
//       : "*",
//     credentials: true,
//   })
// );
const normalize = s => (s || '').trim().replace(/\/$/, '');
const ALLOW = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(normalize)
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);              // non-browser / same-origin
    const ok = ALLOW.includes(normalize(origin));
    return cb(ok ? null : new Error('CORS: origin not allowed'), ok);
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-api-key'],
  credentials: true,
  maxAge: 86400,
}));
app.options('*', cors()); // handle preflight everywhere

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Webhook middleware - raw body for webhook verification
app.use(
  "/webhooks",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    if (req.body && req.body.length) {
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (e) {
        console.error("Error parsing webhook body", e);
      }
    }
    next();
  }
);
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
app.use('/api', subscriptionsAchRoutes);
app.use(
  "/api/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    // Keep raw body for signature verification
    req.rawBody = req.body.toString();
    // Also parse JSON for easy access
    if (req.body && req.body.length) {
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (e) {
        console.error("Error parsing Authorize.Net webhook body", e);
      }
    }
    next();
  }
);

// Body parsing middleware


// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Serve static files from public directory
app.use(express.static('public'));

// API routes
app.use("/api/plaid", plaidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/webhooks", webhookRoutes); // NEW
app.use('/api/payment-form', paymentFormRoutes);

const connectRoute = require("./routes/connect");
app.use("/connect", connectRoute);

// Root endpoint - Clear all cookies when visiting homepage
app.get("/", (req, res) => {
  // Clear all cookies by setting them with expired dates
  const cookiesToClear = ['rg_link_session']; // Add other cookie names if needed
  const clearedCookieHeaders = [];
  
  // Clear known cookies with proper attributes
  cookiesToClear.forEach(cookieName => {
    const clearedCookie = cookie.serialize(cookieName, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to epoch time to ensure expiration
    });
    clearedCookieHeaders.push(clearedCookie);
  });
  
  // Also try to clear any other cookies from the request
  if (req.headers.cookie) {
    const parsedCookies = cookie.parse(req.headers.cookie);
    Object.keys(parsedCookies).forEach(cookieName => {
      if (!cookiesToClear.includes(cookieName)) {
        const clearedCookie = cookie.serialize(cookieName, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0)
        });
        clearedCookieHeaders.push(clearedCookie);
      }
    });
  }
  
  // Set all cookie clearing headers
  if (clearedCookieHeaders.length > 0) {
    res.setHeader('Set-Cookie', clearedCookieHeaders);
    console.log('🧹 Homepage visited - Cleared', clearedCookieHeaders.length, 'cookie(s)');
  }
  
  res.json({
    message: "Revelation Gold Group API",
    version: "1.0.0",
    status: "running",
    cookiesCleared: clearedCookieHeaders.length > 0,
    endpoints: {
      health: "/health",
      plaid: "/api/plaid",
      users: "/api/users",
      payments: "/api/payments",
      transfers: "/api/transfers",
      webhooks: "/webhooks", // NEW
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 API endpoints: http://${HOST}:${PORT}/api`);
  console.log(`🔔 Webhook endpoints: http://${HOST}:${PORT}/webhooks`); // NEW
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Schedule daily settlement check at 7:00 AM PT (2:00 PM UTC)
cron.schedule('0 14 * * *', () => {
  console.log('🔄 Running daily settlement check...');
  settlementService.checkSettledTransactions();
}, {
  timezone: "America/Los_Angeles"
});

console.log('⏰ Daily settlement check scheduled for 7:00 AM PT');

module.exports = app;
