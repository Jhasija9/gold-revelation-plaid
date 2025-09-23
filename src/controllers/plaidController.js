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

      // Get account details
      const accountsResult = await plaidService.getAccounts(exchangeResult.access_token);
      console.log("Accounts Result:", accountsResult);

      if (!accountsResult.success) {
        return res.status(500).json(accountsResult);
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
        const accountData = {
          item_id: itemId,
          plaid_account_id: account.account_id,
          account_name: account.name,
          account_type: account.type,
          account_subtype: account.subtype,
          account_mask: account.mask,
          routing_number: account.ach_routing,
          account_number_encrypted: account.ach_account 
            ? encryptToken(account.ach_account).encrypted 
            : null,
        };
        accounts.push(accountData);
      }

      // Insert all accounts
      const accountsResult = await databaseService.query("accounts", "insert", {
        values: accounts
      });

      if (!accountsResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to store accounts",
        });
      }

      console.log("Database Insert Result:", accountsResult);

      res.json({
        success: true,
        item_id: itemId,
        accounts_created: accounts.length,
        institution_name: accountsResult.item.institution_name,
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
