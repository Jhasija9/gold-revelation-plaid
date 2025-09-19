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

      if (!exchangeResult.success) {
        return res.status(500).json(exchangeResult);
      }

      // Get account details
      const accountsResult = await plaidService.getAccounts(
        exchangeResult.access_token
      );
      console.log("Accounts Result:", accountsResult);

      if (!accountsResult.success) {
        return res.status(500).json(accountsResult);
      }

      // Encrypt access token
      const encryptedToken = encryptToken(exchangeResult.access_token);

      // Store in database
      const bankAccountData = {
        user_id: user_id,
        plaid_item_id: exchangeResult.item_id,
        plaid_access_token: JSON.stringify(encryptedToken),
        institution_id: accountsResult.item.institution_id,
        institution_name: accountsResult.item.institution_name,
        account_id: accountsResult.accounts[0].account_id,
        account_name: accountsResult.accounts[0].name,
        account_type: accountsResult.accounts[0].type,
        account_subtype: accountsResult.accounts[0].subtype,
        account_mask: accountsResult.accounts[0].mask,
        routing_number: accountsResult.accounts[0].ach_routing,
        account_number_encrypted: encryptToken(
          accountsResult.accounts[0].ach_account
        ).encrypted,
      };

      const dbResult = await databaseService.query("bank_accounts", "insert", {
        values: bankAccountData,
      });

      if (!dbResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to store bank account",
        });
      }

      res.json({
        success: true,
        bank_account_id: dbResult.data[0].id,
        institution_name: bankAccountData.institution_name,
        account_mask: bankAccountData.account_mask,
        message: "Bank account connected successfully",
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
