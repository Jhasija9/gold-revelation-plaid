const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const webhookKeyService = require("../services/webhookKeyService.js");

async function verifyPlaidWebhook(req, res, next) {
  console.log("🔍 Webhook verification called");
  console.log(
    "🔍 SKIP_WEBHOOK_VERIFICATION:",
    process.env.SKIP_WEBHOOK_VERIFICATION
  );

  try {
    // Skip verification in development if needed (optional)
    if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") {
      console.warn(
        "⚠️ Skipping webhook verification - NOT SECURE FOR PRODUCTION"
      );
      return next();
    }

    const jwtToken = req.headers["plaid-verification"];

    if (!jwtToken) {
      return res
        .status(401)
        .json({ error: "No Plaid verification header found" });
    }

    // Decode JWT header to get key_id
    const decodedHeader = jwt.decode(jwtToken, { complete: true });
    const keyId = decodedHeader?.header?.kid;
    
    console.log("🔑 Key ID from JWT:", keyId);

    if (!keyId) {
      return res.status(401).json({ error: "No key ID found in JWT header" });
    }

    // Get the request body as a string - important to use the raw body
    const requestBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    // Calculate SHA256 hash of request body
    const calculatedBodyHash = crypto
      .createHash("sha256")
      .update(requestBody)
      .digest("hex");

    try {
      // Get public key for verification using the key_id
      const publicKey = await webhookKeyService.getPlaidPublicKeys(keyId);
      console.log("🔑 Retrieved public key for key_id:", keyId);

      // Verify the JWT
      const decodedJwt = jwt.verify(jwtToken, publicKey, {
        algorithms: ["ES256"],
      });

      // Verify the request body hash matches
      if (decodedJwt.request_body_sha256 !== calculatedBodyHash) {
        return res.status(401).json({ error: "Request body hash mismatch" });
      }

      // Store webhook data in request for later use if needed
      req.webhookData = decodedJwt;
      next();
    } catch (verifyError) {
      console.error("JWT verification failed:", verifyError);
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
  } catch (error) {
    console.error("Webhook verification error:", error);
    if (process.env.SKIP_WEBHOOK_VERIFICATION === "true") {
      console.warn("⚠️ Error in verification but skipping due to dev mode");
      return next();
    }
    res.status(500).json({ error: "Webhook verification failed" });
  }
}

module.exports = verifyPlaidWebhook;
