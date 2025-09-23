const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

// Import routes
const plaidRoutes = require("./routes/plaid");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payments");
const transferRoutes = require("./routes/transfers");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
// const helmet = require("helmet");

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

// API routes
app.use("/api/plaid", plaidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transfers", transferRoutes);

// Add this route
// app.get('/connect', (req, res) => {
//     res.send(`//         <!DOCTYPE html>
//         <html>
//         <head>
//             <title>Connect Bank - Revelation Gold Group</title>
//         </head>
//         <body>
//             <h1>Bank Connection Page</h1>
//             <p>User created successfully! This is where Plaid integration will go.</p>
//             <p>User data has been saved to database.</p>
//         </body>
//         </html>
//     `);
// });

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
  console.log(`�� Health check: http://${HOST}:${PORT}/health`);
  console.log(`�� API endpoints: http://${HOST}:${PORT}/api`);
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

module.exports = app;

//changes made

