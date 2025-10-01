const LinkSession = require('../models/LinkSession');
const cookie = require('cookie');

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return cookie.parse(header);
}

const sessionAuth = {
  // Validate user session (like Plaid does)
  validateSession: async (req, res, next) => {
    try {
      const cookies = parseCookies(req);
      const sessionId = cookies["rg_link_session"];
      
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          error: 'Session required'
        });
      }

      const session = await LinkSession.getById(sessionId);
      const now = new Date();

      if (!session || session.used || new Date(session.expires_at) < now) {
        return res.status(401).json({
          success: false,
          error: 'Session expired'
        });
      }

      // Add user_id to request for use in controllers
      req.user_id = session.user_id;
      req.session_id = sessionId;
      
      next();
    } catch (error) {
      console.error('Session auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Session validation failed'
      });
    }
  },

  // Validate user ID in request body (fallback)
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

module.exports = sessionAuth;
