const plaidService = require('../services/plaidService');
const databaseService = require('../services/databaseService');
const { decryptToken } = require('../utils/encryption'); // Added this import

class TransferController {
  // Create Transfer
  async createTransfer(req, res) {
    try {
      console.log("=== CREATE TRANSFER CALLED ===");
      console.log("req.body:", req.body);

      const { user_id, account_id, amount, description } = req.body;

      // Validate input
      if (!user_id || !account_id || !amount) {
        return res.status(400).json({
          success: false,
          error: "user_id, account_id, and amount are required"
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Amount must be greater than 0"
        });
      }

      // Get account details
      const accountResult = await databaseService.query("accounts", "select", {
        where: { id: account_id }
      });

      if (!accountResult.success || accountResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Account not found"
        });
      }

      const account = accountResult.data[0];

      // Get item details to get access token
      const itemResult = await databaseService.query("items", "select", {
        where: { id: account.item_id }
      });

      if (!itemResult.success || itemResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Bank connection not found"
        });
      }

      const item = itemResult.data[0];
      const accessToken = JSON.parse(item.access_token_encrypted);

      // Change this line to decrypt the token:
      const decryptedAccessToken = decryptToken(accessToken);

      // Then use the decrypted token:
      // Get user details
      const userResult = await databaseService.query("users", "select", {
        where: { id: user_id }
      });
      if (!userResult.success || userResult.data.length === 0) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      const user = userResult.data[0];

      const transferResult = await plaidService.createTransferUI({
        access_token: decryptedAccessToken,
        account_id: account.plaid_account_id,
        amount: parseFloat(amount),
        description: description || 'Payment',
        user_id: user_id,
        user_legal_name: `${user.first_name} ${user.last_name}`,
        user_email: user.email
      });

      // Verify user ownership
      if (item.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: "Account does not belong to user"
        });
      }

      // Get the first account for this user (since we don't have account selection yet)
      const userAccountsResult = await databaseService.query("accounts", "select", {
        where: { item_id: account.item_id }
      });

      if (!userAccountsResult.success || userAccountsResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No accounts found for this user"
        });
      }

      const firstAccount = userAccountsResult.data[0];

      // Store transaction record in database
      const transactionRecord = {
        user_id: user_id,
        account_id: account_id,
        transaction_type: 'payment',
        amount: parseFloat(amount),
        status: 'pending',
        description: description || 'Payment',
        plaid_transfer_id: transferResult.transfer_id,
        created_at: new Date().toISOString()
      };

      const dbResult = await databaseService.query("transactions", "insert", {
        values: [transactionRecord]
      });

      if (!dbResult.success) {
        console.error("Failed to store transaction record:", dbResult.error);
        // Don't fail the request, just log the error
      }

      res.json({
        success: true,
        transfer_id: transferResult.transfer_id,
        transfer_url: transferResult.transfer_url,
        status: transferResult.status,
        message: "Transfer created successfully"
      });

    } catch (error) {
      console.error("Transfer controller error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  // Get Transfer Status
  async getTransferStatus(req, res) {
    try {
      const { transfer_id } = req.params;

      if (!transfer_id) {
        return res.status(400).json({
          success: false,
          error: "transfer_id is required"
        });
      }

      const result = await plaidService.getTransferStatus(transfer_id);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }

    } catch (error) {
      console.error("Get transfer status error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  // Get User Transactions
  async getUserTransactions(req, res) {
    try {
      const { user_id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: "user_id is required"
        });
      }

      const result = await databaseService.query("transactions", "select", {
        where: { user_id: user_id },
        orderBy: { created_at: 'desc' },
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (result.success) {
        res.json({
          success: true,
          transactions: result.data || []
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to retrieve transactions"
        });
      }

    } catch (error) {
      console.error("Get user transactions error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}

module.exports = new TransferController();
