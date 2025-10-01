const acceptSuiteService = require('../services/acceptSuiteService');
const databaseService = require('../services/databaseService');
const AuthorizeNetHelpers = require('../utils/authorizeNetHelpers');

class PaymentFormController {
  // Generate secure payment form (iframe)
  async generatePaymentForm(req, res) {
    try {
      console.log('=== GENERATE PAYMENT FORM (IFRAME) ===');
      console.log('req.body:', req.body);

      const {
        user_id,
        amount,
        description,
        returnUrl,
        cancelUrl
      } = req.body;

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
