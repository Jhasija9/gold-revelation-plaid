const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const AuthorizeNetHelpers = require('../utils/authorizeNetHelpers');
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

class PaymentFormController {
  // Generate secure payment form (iframe)
  async generatePaymentForm(req, res) {
    try {
      console.log('=== GENERATE PAYMENT FORM (IFRAME) ===');
      console.log('req.body:', req.body);

      const {
        amount,
        description,
        returnUrl,
        cancelUrl
      } = req.body;

      const { user_id } = req.body; // Get from session auth

      // Validate required fields
      if (!user_id || !amount || !returnUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          error: 'user_id, amount, returnUrl, and cancelUrl are required'
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      // Prepare form data
      const formData = {
        amount: AuthorizeNetHelpers.formatAmount(amount),
        description: description || `Gold Purchase - $${amount}`,
        customerData: {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        returnUrl: returnUrl,
        cancelUrl: cancelUrl
      };

      // Generate payment form
      const formResult = await acceptSuiteService.generatePaymentForm(formData);

      if (!formResult.success) {
        return res.status(400).json({
          success: false,
          error: formResult.error,
          responseCode: formResult.responseCode
        });
      }

      res.json({
        success: true,
        formToken: formResult.formToken,
        formUrl: formResult.formUrl,
        message: 'Payment form generated successfully',
        amount: amount,
        description: formData.description
      });

    } catch (error) {
      console.error('Generate payment form error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Handle payment form response (from iframe)
  async handlePaymentFormResponse(req, res) {
    try {
      console.log('=== HANDLE PAYMENT FORM RESPONSE ===');
      console.log('req.body:', req.body);

      const {
        token,
        user_id,
        amount,
        description
      } = req.body;

      // Validate required fields
      if (!token || !user_id || !amount) {
        return res.status(400).json({
          success: false,
          error: 'token, user_id, and amount are required'
        });
      }

      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: user_id }
      });

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      // Store transaction record
      const transactionRecord = {
        user_id: user_id,
        transaction_type: 'payment',
        amount: parseFloat(amount),
        status: 'completed', // Accept Suite payments are immediate
        description: description || `Gold Purchase - $${amount}`,
        payment_method: 'credit_card',
        authorize_net_transaction_id: token, // Use token as transaction ID
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const dbResult = await databaseService.query('transactions', 'insert', {
        values: [transactionRecord]
      });

      if (!dbResult.success) {
        console.error('Failed to store transaction record:', dbResult.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to store transaction record'
        });
      }

      res.json({
        success: true,
        transactionId: token,
        status: 'completed',
        message: 'Payment processed successfully',
        amount: amount,
        description: transactionRecord.description
      });

    } catch (error) {
      console.error('Handle payment form response error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new PaymentFormController();
