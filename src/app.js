const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

// Import routes
const plaidRoutes = require("./routes/plaid");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payments");
const transferRoutes = require("./routes/transfers");
const webhookRoutes = require("./routes/webhooks"); // NEW
const bodyParser = require("body-parser");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://cdn.plaid.com", "'unsafe-inline'"],
        "connect-src": ["'self'", "https://*.plaid.com"],
        "frame-src": ["'self'", "https://*.plaid.com"],
        "img-src": ["'self'", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
        "object-src": ["'none'"],
      },
    },
  })
);

// CORS middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);

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

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

const connectRoute = require("./routes/connect");
app.use("/connect", connectRoute);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Revelation Gold Group API",
    version: "1.0.0",
    status: "running",
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

// REMOVED: Old polling system - now using webhooks
// const transferStatusService = require("./services/transferStatusService");
// const transferPollInterval = setInterval(() => {
//   transferStatusService.pollPendingTransfers();
// }, 1 * 60 * 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

module.exports = app;
