// src/services/plaidRecurringService.js
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

function makeClient() {
  const envName = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
  const configuration = new Configuration({
    basePath: PlaidEnvironments[envName] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(configuration);
}

const client = makeClient();

async function createRecurringTransfer({
  access_token,
  account_id,
  amount,              // string, e.g. "500.00"
  description,
  schedule,            // { interval_unit:'month'|'week', interval_count, interval_execution_day, start_date, end_date? }
  ach_class = 'web',
  network = 'ach',
  user_present = false,
  idempotency_key,
}) {
  const body = {
    access_token,
    account_id,
    type: 'debit',
    network,
    ach_class,
    amount,
    user_present,
    description,
    idempotency_key,
    schedule,
  };
  const resp = await client.transferRecurringCreate(body);
  return {
    success: true,
    recurring_transfer_id: resp.data.recurring_transfer_id,
    schedule: resp.data.schedule,
    status: resp.data.status,
  };
}

async function cancelRecurringTransfer(recurring_transfer_id) {
  const resp = await client.transferRecurringCancel({ recurring_transfer_id });
  return { success: true, status: resp.data.status };
}

async function getRecurringTransfer(recurring_transfer_id) {
  const resp = await client.transferRecurringGet({ recurring_transfer_id });
  return { success: true, data: resp.data };
}

module.exports = {
  createRecurringTransfer,
  cancelRecurringTransfer,
  getRecurringTransfer,
};