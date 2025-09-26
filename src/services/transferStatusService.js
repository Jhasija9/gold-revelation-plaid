const plaidService = require('./plaidService');
const databaseService = require('./databaseService');
const { decryptToken } = require('../utils/encryption');

class TransferStatusService {
  // Poll for pending transfers that are over 1 hour old
  async pollPendingTransfers() {
    try {
      // Fix: Use proper date comparison syntax
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const pendingTransfers = await databaseService.query("transactions", "select", {
        where: { 
          status: 'pending',
          created_at: oneHourAgo  // Remove the $lt object wrapper
        }
      });
      
      if (!pendingTransfers.success) {
        console.error('Failed to fetch pending transfers');
        return;
      }
      
      console.log(`Polling ${pendingTransfers.data.length} pending transfers`);
      
      for (const transfer of pendingTransfers.data) {
        await this.updateTransferStatus(transfer);
      }
    } catch (error) {
      console.error('Error polling transfers:', error);
    }
  }
  
  async updateTransferStatus(transfer) {
    try {
      // Get account first, then get item - this is the correct approach
      const accountResult = await databaseService.query("accounts", "select", {
        where: { id: transfer.account_id }
      });
      
      if (!accountResult.success || accountResult.data.length === 0) {
        console.error(`No account found for transfer ${transfer.id}`);
        return;
      }
      
      const account = accountResult.data[0];
      
      // Get item using the account's item_id
      const itemResult = await databaseService.query("items", "select", {
        where: { id: account.item_id }
      });
      
      if (!itemResult.success || itemResult.data.length === 0) {
        console.error(`No item found for transfer ${transfer.id}`);
        return;
      }
      
      const item = itemResult.data[0];
      const accessToken = JSON.parse(item.access_token_encrypted);
      const decryptedAccessToken = decryptToken(accessToken);
      
      // Get transfer status from Plaid
      const transferInfo = await plaidService.getTransferById(
        decryptedAccessToken, 
        transfer.plaid_transfer_id
      );
      
      if (!transferInfo.success) {
        console.error(`Failed to get transfer info: ${transfer.plaid_transfer_id}`);
        return;
      }
      
      // Update status based on Plaid's response
      const status = transferInfo.transfer.status.toLowerCase();
      const updateData = { status };
      
      if (status === 'posted') {
        updateData.processed_at = new Date().toISOString();
        updateData.ach_reference_id = transferInfo.transfer.ach_transfer_id;
      } else if (status === 'settled') {
        updateData.completed_at = new Date().toISOString();
      } else if (['failed', 'returned', 'canceled'].includes(status)) {
        updateData.failed_at = new Date().toISOString();
        updateData.failure_reason = transferInfo.transfer.failure_reason || 
                                   transferInfo.transfer.return_reason;
      }
      
      console.log(`Updating transfer ${transfer.id} to status: ${status}`);
      
      // Update database
      await databaseService.query("transactions", "update", {
        where: { id: transfer.id },
        values: updateData
      });
    } catch (error) {
      console.error(`Error updating transfer ${transfer.id}:`, error);
    }
  }
}

module.exports = new TransferStatusService();