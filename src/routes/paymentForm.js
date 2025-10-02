const express = require("express");
const router = express.Router();

// DEPRECATED: These routes are replaced by AcceptUI integration
// Keeping for backward compatibility but returning deprecation notices

router.post("/generate", (req, res) => {
  res.status(410).json({
    success: false,
    error: "This payment method has been deprecated. Please use the AcceptUI integration.",
    code: "DEPRECATED_ENDPOINT"
  });
});

router.post("/response", (req, res) => {
  res.status(410).json({
    success: false,
    error: "This payment method has been deprecated. Please use the AcceptUI integration.",
    code: "DEPRECATED_ENDPOINT"
  });
});

module.exports = router;
