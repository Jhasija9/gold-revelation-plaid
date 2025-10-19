// src/controllers/subscriptionAchController.js
const crypto = require('crypto');
const databaseService = require('../services/databaseService');
const { decryptToken } = require('../utils/encryption');
const plaidRecurring = require('../services/plaidRecurringService');

// Add weeks/months to an ISO string (UTC-safe)
function addIntervalISO(isoDate, unit, count) {
  const d = new Date(isoDate);
  if (unit === 'month') {
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    const next = new Date(Date.UTC(y, m + count, 1, 0, 0, 0));
    next.setUTCDate(Math.min(day, 28));
    return next.toISOString();
  }
  if (unit === 'week') {
    return new Date(d.getTime() + count * 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return d.toISOString();
}

class SubscriptionAchController {
  // Create Plaid recurring subscription (ACH)
  async create(req, res) {
    try {
      const {
        user_id, plan_name, amount, account_id,
        interval_unit = 'month', interval_count = 1, interval_execution_day = 1, start_date,
      } = req.body;

      if (!user_id || !plan_name || !amount || !account_id) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Resolve account → item → access_token
      const acctRes = await databaseService.query('accounts', 'select', {
        where: { id: account_id, is_active: true },
      });
      if (!acctRes.success || acctRes.data.length === 0) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
      const account = acctRes.data[0];

      const itemRes = await databaseService.query('items', 'select', {
        where: { id: account.item_id, is_active: true },
      });
      if (!itemRes.success || itemRes.data.length === 0) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      const access_token = decryptToken(JSON.parse(itemRes.data[0].access_token_encrypted));

      // Build schedule per Plaid docs
      const startISO = (start_date ? new Date(start_date) : new Date()).toISOString().slice(0, 10); // YYYY-MM-DD
      const schedule = { interval_unit, interval_count, interval_execution_day, start_date: startISO };

      const plaidAmount = Number(amount).toFixed(2);
      const idempotency_key = crypto.randomUUID();

      const r = await plaidRecurring.createRecurringTransfer({
        access_token,
        account_id: account.plaid_account_id,
        amount: plaidAmount,
        description: plan_name,
        schedule,
        ach_class: 'web',
        network: 'ach',
        user_present: false,
        idempotency_key,
      });

      if (!r.success) {
        return res.status(502).json({ success: false, error: 'Plaid recurring create failed' });
      }

      // First next billing date = schedule start
      const firstNextISO = new Date(startISO + 'T00:00:00Z').toISOString();

      // Insert subscription (ACH). payment_method set explicitly; nullable columns are OK.
      const subInsert = await databaseService.query('subscriptions', 'insert', {
        values: [{
          user_id,
          plan_name,
          amount: Number(amount),
          interval: interval_unit === 'week' ? 'weekly' : 'monthly',
          status: 'pending', // flip to 'active' after first successful debit if you want
          payment_method: 'bank_transfer',
          plaid_recurring_transfer_id: r.recurring_transfer_id,
          next_billing_date: firstNextISO,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      if (!subInsert.success) {
        return res.status(500).json({ success: false, error: 'Failed to store subscription' });
      }

      return res.json({
        success: true,
        subscriptionId: subInsert.data[0].id,
        plaidRecurringTransferId: r.recurring_transfer_id,
        nextBillingDate: firstNextISO,
      });
    } catch (e) {
      console.error('ACH subscription create error:', e);
      return res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  // Webhook: occurrence originated
  async recurringNewTransfer(req, res) {
    try {
      const { recurring_transfer_id, transfer_id } = req.body; // adjust if your webhook wraps payload
      if (!recurring_transfer_id || !transfer_id) return res.status(200).json({ received: true });

      const subRes = await databaseService.query('subscriptions', 'select', {
        where: { plaid_recurring_transfer_id: recurring_transfer_id },
      });
      if (!subRes.success || subRes.data.length === 0) return res.status(200).json({ received: true });
      const sub = subRes.data[0];

      // Insert transactions (pending)
      const txInsert = await databaseService.query('transactions', 'insert', {
        values: [{
          user_id: sub.user_id,
          subscription_id: sub.id,
          transaction_type: 'subscription_payment',
          amount: sub.amount,
          status: 'pending', // Plaid sync will advance to posted/settled/returned
          description: sub.plan_name,
          payment_method: 'bank_transfer',
          plaid_transfer_id: transfer_id,
          created_at: new Date().toISOString(),
        }],
      });
      const txId = txInsert.success ? txInsert.data[0].id : null;

      // occurrence_number = count+1
      const countRes = await databaseService.query('subscription_payments', 'select', {
        where: { subscription_id: sub.id },
      });
      const occurrence = (countRes.success ? countRes.data.length : 0) + 1;

      // Insert subscription_payments (pending)
      await databaseService.query('subscription_payments', 'insert', {
        values: [{
          subscription_id: sub.id,
          transaction_id: txId,
          occurrence_number: occurrence,
          amount: sub.amount,
          status: 'pending',
          payment_method: 'bank_transfer',
          billing_date: new Date().toISOString(),
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      // Update last/next billing dates (advance only on originations)
      const nextISO = addIntervalISO(new Date().toISOString(), sub.interval === 'weekly' ? 'week' : 'month', 1);
      await databaseService.query('subscriptions', 'update', {
        where: { id: sub.id },
        values: {
          last_billing_date: new Date().toISOString(),
          next_billing_date: nextISO,
          updated_at: new Date().toISOString(),
        },
      });

      return res.status(200).json({ received: true });
    } catch (e) {
      console.error('ACH webhook NEW_TRANSFER error:', e);
      return res.status(200).json({ received: true });
    }
  }

  // Webhook: occurrence skipped (no transfer created)
  async recurringSkipped(req, res) {
    try {
      const { recurring_transfer_id, authorization_decision_rationale_code } = req.body;
      if (!recurring_transfer_id) return res.status(200).json({ received: true });

      const subRes = await databaseService.query('subscriptions', 'select', {
        where: { plaid_recurring_transfer_id: recurring_transfer_id },
      });
      if (!subRes.success || subRes.data.length === 0) return res.status(200).json({ received: true });
      const sub = subRes.data[0];

      const countRes = await databaseService.query('subscription_payments', 'select', {
        where: { subscription_id: sub.id },
      });
      const occurrence = (countRes.success ? countRes.data.length : 0) + 1;

      await databaseService.query('subscription_payments', 'insert', {
        values: [{
          subscription_id: sub.id,
          transaction_id: null,
          occurrence_number: occurrence,
          amount: sub.amount,
          status: 'failed',
          payment_method: 'bank_transfer',
          billing_date: new Date().toISOString(),
          retry_count: 1,
          failure_reason: authorization_decision_rationale_code || 'SKIPPED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      // Do not advance billing dates on skipped
      return res.status(200).json({ received: true });
    } catch (e) {
      console.error('ACH webhook SKIPPED error:', e);
      return res.status(200).json({ received: true });
    }
  }

  // Webhook: series cancelled
  async recurringCancelled(req, res) {
    try {
      const { recurring_transfer_id } = req.body;
      if (!recurring_transfer_id) return res.status(200).json({ received: true });

      await databaseService.query('subscriptions', 'update', {
        where: { plaid_recurring_transfer_id: recurring_transfer_id },
        values: { status: 'cancelled', updated_at: new Date().toISOString() },
      });

      return res.status(200).json({ received: true });
    } catch (e) {
      console.error('ACH webhook CANCELLED error:', e);
      return res.status(200).json({ received: true });
    }
  }
}

module.exports = new SubscriptionAchController();