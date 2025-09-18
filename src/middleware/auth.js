const auth = {
  // Simple API key authentication (for now)
  authenticate: (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // In production, validate against database
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  },

  // Validate user ID
  validateUserId: (req, res, next) => {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    next();
  }
};

module.exports = auth;
