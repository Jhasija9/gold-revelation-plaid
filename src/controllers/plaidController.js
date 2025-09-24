const plaidService = require("../services/plaidService");
const databaseService = require("../services/databaseService");
const { encryptToken } = require("../utils/encryption");
const validation = require("../middleware/validation");

class PlaidController {
  // Create Link Token
  async createLinkToken(req, res) {
    try {
      const { user_id } = req.body;

      // Validate input
      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: "user_id is required",
        });
      }

      const result = await plaidService.createLinkToken(user_id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Exchange Public Token
  async exchangeToken(req, res) {
    try {
      console.log("=== EXCHANGE TOKEN CALLED ===");
      console.log("req.body:", req.body);

      const { public_token, user_id } = req.body;

      // Validate input
      if (!public_token || !user_id) {
        return res.status(400).json({
          success: false,
          error: "public_token and user_id are required",
        });
      }

      // Exchange token with Plaid
      const exchangeResult = await plaidService.exchangePublicToken(public_token);
      console.log("Exchange Result:", exchangeResult);

      if (!exchangeResult.success) {
        return res.status(500).json(exchangeResult);
      }

      // Get basic account info
      const accountsResult = await plaidService.getAccounts(exchangeResult.access_token);
      console.log("Accounts Result:", accountsResult);

      if (!accountsResult.success) {
        return res.status(500).json(accountsResult);
      }

      // Get auth data (account/routing numbers)
      const authResult = await plaidService.getAuthData(exchangeResult.access_token);
      console.log("Auth Result:", authResult);

      if (!authResult.success) {
        return res.status(500).json(authResult);
      }

      // Check if item already exists
      const existingItem = await databaseService.query("items", "select", {
        where: { plaid_item_id: exchangeResult.item_id }
      });

      let itemId;
      
      if (existingItem.success && existingItem.data.length > 0) {
        // Item exists, use existing item_id
        itemId = existingItem.data[0].id;
        console.log("Using existing item:", itemId);
      } else {
        // Create new item
        const itemData = {
          user_id: user_id,
          plaid_item_id: exchangeResult.item_id,
          access_token_encrypted: JSON.stringify(encryptToken(exchangeResult.access_token)),
          institution_id: accountsResult.item.institution_id,
          institution_name: accountsResult.item.institution_name,
        };
        
        const itemResult = await databaseService.query("items", "insert", {
          values: [itemData]
        });
        
        if (!itemResult.success) {
          return res.status(500).json({
            success: false,
            error: "Failed to create item",
          });
        }
        
        itemId = itemResult.data[0].id;
        console.log("Created new item:", itemId);
      }

      // Store all accounts for this item
      const accounts = [];
      for (const account of accountsResult.accounts) {
        // Find matching auth data for this account
        const authAccount = authResult.numbers?.ach?.find(
          ach => ach.account_id === account.account_id
        );

        console.log(`Account: ${account.name} (${account.account_id})`);
  console.log("  - Auth Account Found:", !!authAccount);
  if (authAccount) {
    console.log("  - Routing Number:", authAccount.routing);
    console.log("  - Account Number:", authAccount.account);
  } else {
    console.log("  - No ACH data found for this account");
  }


        const accountData = {
          item_id: itemId,
          plaid_account_id: account.account_id,
          account_name: account.name,
          account_type: account.type,
          account_subtype: account.subtype,
          account_mask: account.mask,
          routing_number: authAccount?.routing || null,
          account_number_encrypted: authAccount?.account 
            ? encryptToken(authAccount.account).encrypted 
            : null,
        };
        accounts.push(accountData);
      }

      // Insert all accounts
      const accountsInsertResult = await databaseService.query("accounts", "insert", {
        values: accounts
      });

      if (!accountsInsertResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to store accounts",
        });
      }

      console.log("Database Insert Result:", accountsInsertResult);

      res.json({
        success: true,
        item_id: itemId,
        accounts_created: accounts.length,
        institution_name: accountsResult.item.institution_name,
        accounts: accountsInsertResult.data.map(acc => ({
          id: acc.id, // This is the actual UUID from the database
          name: acc.account_name,
          type: acc.account_type,
          mask: acc.account_mask
        })),
        message: `Successfully connected ${accounts.length} account(s)`
      });

    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get Accounts
  async getAccounts(req, res) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          success: false,
          error: "access_token is required",
        });
      }

      const result = await plaidService.getAccounts(access_token);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
  // Add these methods at the end of the class, before the closing bracket and module.exports

async handleWebhook(webhookData) {
  const { webhook_type, webhook_code } = webhookData;
  
  console.log(`Received ${webhook_type}.${webhook_code} webhook`);
  
  // Handle different webhook types
  switch(webhook_type) {
    case 'TRANSFER':
      await this.handleTransferWebhook(webhookData);
      break;
    // Add other webhook types as needed
    default:
      console.log(`Unhandled webhook type: ${webhook_type}`);
  }
}

async handleTransferWebhook(webhookData) {
  const { webhook_code, transfer_id } = webhookData;
  
  // Ensure we have a transfer_id
  if (!transfer_id) {
    console.error('Missing transfer_id in webhook data');
    return;
  }
  
  // Update database based on webhook code
  // Reference: https://plaid.com/docs/api/products/transfer/#transfer-events
  switch(webhook_code) {
    case 'transfer_created':
      // Usually already handled during creation, but can update if needed
      break;
      
    case 'transfer_pending':
      await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: { status: 'pending' }
      });
      break;
      
    case 'transfer_posted':
      await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: { 
          status: 'posted',
          processed_at: new Date().toISOString(),
          // Per Plaid docs: https://plaid.com/docs/api/products/transfer/#transfer_posted
          ach_reference_id: webhookData.ach_transfer_id || null
        }
      });
      break;
      
    case 'transfer_settled':
      await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: { 
          status: 'settled',
          completed_at: new Date().toISOString() 
        }
      });
      break;
      
    case 'transfer_failed':
      await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: { 
          status: 'failed',
          failed_at: new Date().toISOString(),
          // Per Plaid docs: https://plaid.com/docs/api/products/transfer/#transfer_failed
          failure_reason: webhookData.failure_reason || null
        }
      });
      break;
      
    case 'transfer_returned':
      await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: { 
          status: 'returned',
          failed_at: new Date().toISOString(),
          // Per Plaid docs: https://plaid.com/docs/api/products/transfer/#transfer_returned
          failure_reason: webhookData.return_reason || null
        }
      });
      break;
      
    default:
      console.log(`Unhandled transfer webhook code: ${webhook_code}`);
  }
}

  // Get Balance
  async getBalance(req, res) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          success: false,
          error: "access_token is required",
        });
      }

      const result = await plaidService.getBalance(access_token);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Controller error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = new PlaidController();
