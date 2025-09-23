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
      const exchangeResult = await plaidService.exchangePublicToken(
        public_token
      );
      console.log("jjjjjjjjjjExchange Result:", exchangeResult);

      if (!exchangeResult.success) {
        return res.status(500).json(exchangeResult);
      }

      // Get account details
      const accountsResult = await plaidService.getAccounts(
        exchangeResult.access_token
      );
      console.log("pppppppppppppppppAccounts Result:", accountsResult);

      if (!accountsResult.success) {
        return res.status(500).json(accountsResult);
      }

      // Encrypt access token
      const encryptedToken = encryptToken(exchangeResult.access_token);

      // Store ALL accounts in database (not just the first one)
      const bankAccounts = []; // Array to store all accounts

      // Loop through ALL accounts returned by Plaid
      for (let i = 0; i < accountsResult.accounts.length; i++) {
        const account = accountsResult.accounts[i];
        
        const bankAccountData = {
          user_id: user_id,
          plaid_item_id: exchangeResult.item_id,
          plaid_access_token: JSON.stringify(encryptedToken),
          institution_id: accountsResult.item.institution_id,
          institution_name: accountsResult.item.institution_name,
          selected_account_id: account.account_id,  // ← Use current account, not [0]
          account_name: account.name,               // ← Use current account, not [0]
          account_type: account.type,               // ← Use current account, not [0]
          account_subtype: account.subtype,         // ← Use current account, not [0]
          account_mask: account.mask,               // ← Use current account, not [0]
          routing_number: account.ach_routing,
          account_number_encrypted: account.ach_account 
            ? encryptToken(account.ach_account).encrypted 
            : null,
        };
        
        bankAccounts.push(bankAccountData); // Add to array
      }

      // Insert ALL accounts into database
      const dbResult = await databaseService.query("bank_accounts", "insert", {
        values: bankAccounts, // ← Insert array of accounts, not single account
      });

      console.log("ooooooDatabase Insert Result:", dbResult);

      if (!dbResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to store bank accounts",
        });
      }

      // Return success with ALL accounts
      res.json({
        success: true,
        bank_accounts: dbResult.data, // ← Return all accounts
        institution_name: accountsResult.item.institution_name,
        total_accounts: accountsResult.accounts.length, // ← Show how many accounts
        message: `Successfully connected ${accountsResult.accounts.length} bank account(s)`,
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
