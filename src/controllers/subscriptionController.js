const ARBService = require('../services/arbService');
const databaseService = require('../services/databaseService');
const LinkSession = require('../models/LinkSession');
class SubscriptionController {
  async createSubscription(req, res) {
    try {
      console.log('=== CREATE SUBSCRIPTION ===');
      console.log('req.body:', req.body);

      const { opaqueData, amount, description } = req.body;
      const userId = req.body.user_id; // From session auth
      
      // Validate required fields
      if (!opaqueData || !userId) {
        return res.status(400).json({
          success: false,
          error: 'opaqueData and user session are required'
        });
      }
      
      // Get user details
      const userResult = await databaseService.query('users', 'select', {
        where: { id: userId }
      });
      
      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const user = userResult.data[0];
      console.log('🔧 SubscriptionController: User found:', user.email);
      console.log('🔧 SubscriptionController: User selected_plan:', user.selected_plan);
console.log('🔧 SubscriptionController: Request plan_name:', req.body.plan_name);
      
      // Check if user selected subscription plan
      if (req.body.plan_name !== 'Gold Subscription') {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan for subscription'
        });
      }
      
      console.log('🔧 SubscriptionController: Plan confirmed:', user.selected_plan);
      
      // Calculate start date (tomorrow for immediate billing)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log('🔧 SubscriptionController: Start date:', startDateStr);
      const firstName =
    user.first_name || user.firstName || req.body.first_name || req.body.firstName || 'Customer';
  const lastName  =
   user.last_name  || user.lastName  || req.body.last_name  || req.body.lastName  || 'Name';

      
      // Prepare subscription data for ARB
      const planName = req.body.plan_name || 'Gold Subscription';
      const subscriptionData = {
        name: 'Gold Subscription',
        amount: 500.00, // Fixed amount for subscription
        interval: 'months',
        startDate: startDateStr,
        intervalLength: 1,  
        opaqueData: opaqueData,
        customerEmail: user.email,
        firstName: firstName,
        lastName: lastName
      };
      
      console.log('🔧 SubscriptionController: Creating ARB subscription...');
      
      // Create ARB subscription
      const arbResult = await ARBService.createSubscription(subscriptionData);
      
      if (!arbResult.success) {
        console.error('❌ SubscriptionController: ARB creation failed:', arbResult.error);
        return res.status(400).json({
          success: false,
          error: arbResult.error,
          errorCode: arbResult.errorCode
        });
      }
      
      console.log('✅ SubscriptionController: ARB subscription created:', arbResult.subscriptionId);
      // const intervalUnit = req.body.interval_unit === 'month' ? 'month' : 'week';

      // Store subscription in database
      const subscriptionRecord = {
        user_id: userId,
        plan_name: planName,
        amount: 500.00,
        interval: 'monthly',
        status: 'active',
        authorize_net_subscription_id: arbResult.subscriptionId,
        next_billing_date: startDateStr,
        payment_method: 'credit_card',
        created_at: new Date().toISOString()
      };
      
      console.log('🔧 SubscriptionController: Storing subscription in database...');
      
      const dbResult = await databaseService.query('subscriptions', 'insert', {
        values: [subscriptionRecord]
      });
      
      if (!dbResult.success) {
        console.error('❌ SubscriptionController: Database insert failed:', dbResult.error);
        
        // Rollback ARB subscription
        console.log('🔧 SubscriptionController: Rolling back ARB subscription...');
        await ARBService.cancelSubscription(arbResult.subscriptionId);
        
        return res.status(500).json({
          success: false,
          error: 'Failed to store subscription'
        });
      }
      
      console.log('✅ SubscriptionController: Subscription stored in database:', dbResult.data[0].id);
      
      // Store initial payment in transactions table
      // const transactionRecord = {
      //   user_id: userId,
      //   subscription_id: dbResult.data[0].id,
      //   transaction_type: 'subscription_payment',
      //   amount: 500.00,
      //   status: 'completed',
      //   description: 'Gold Monthly Subscription - Initial Payment',
      //   payment_method: 'credit_card',
      //   authorize_net_transaction_id: arbResult.subscriptionId,
      //   created_at: new Date().toISOString(),
      //   completed_at: new Date().toISOString()
      // };
      
      // console.log('🔧 SubscriptionController: Storing initial payment in transactions...');
      
      // const transactionResult = await databaseService.query('transactions', 'insert', {
      //   values: [transactionRecord]
      // });
      
      // if (!transactionResult.success) {
      //   console.error('❌ SubscriptionController: Transaction insert failed:', transactionResult.error);
      //   // Don't fail the request, just log the error
      // }
      
      res.json({
        success: true,
        subscriptionId: dbResult.data[0].id,
        authorizeNetSubscriptionId: arbResult.subscriptionId,
        status: 'active',
        nextBillingDate: startDateStr,
        planName: 'Gold Subscription',
        amount: 500.00,
        interval: 'monthly',
        message: 'Subscription created successfully'
      });
      
    } catch (error) {
      console.error('❌ SubscriptionController: Create subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async cancelSubscription(req, res) {
    try {
      console.log('=== CANCEL SUBSCRIPTION ===');
      
      const { subscriptionId } = req.params;
      const userId = req.user_id;
      
      // Get subscription from database
      const subscriptionResult = await databaseService.query('subscriptions', 'select', {
        where: { id: subscriptionId, user_id: userId }
      });
      
      if (!subscriptionResult.success || subscriptionResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }
      
      const subscription = subscriptionResult.data[0];
      console.log('🔧 SubscriptionController: Cancelling subscription:', subscription.plan_name);
      
      // Cancel ARB subscription
      const arbResult = await ARBService.cancelSubscription(subscription.authorize_net_subscription_id);
      
      if (!arbResult.success) {
        console.error('❌ SubscriptionController: ARB cancellation failed:', arbResult.error);
        return res.status(400).json({
          success: false,
          error: arbResult.error
        });
      }
      
      console.log('✅ SubscriptionController: ARB subscription cancelled');
      
      // Update local subscription status
      await databaseService.query('subscriptions', 'update', {
        where: { id: subscriptionId },
        values: { 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }
      });
      
      console.log('✅ SubscriptionController: Local subscription status updated');
      
      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
      
    } catch (error) {
      console.error('❌ SubscriptionController: Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new SubscriptionController();