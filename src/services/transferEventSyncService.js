const plaidService = require('./plaidService');
const databaseService = require('./databaseService');
const { decryptToken } = require('../utils/encryption');

class TransferEventSyncService {
  constructor() {
    this.cursorTable = 'transfer_event_cursors';
    this.retryQueue = [];
    this.maxRetries = 3;
  }

  // Initialize cursor table if it doesn't exist
  async initializeCursorTable() {
    try {
      // Check if cursor table exists by trying to select from it
      const result = await databaseService.query(this.cursorTable, "select", {
        where: { id: 1 },
        limit: 1
      });

      if (!result.success) {
        console.log('Creating transfer_event_cursors table...');
        // In a real implementation, you'd create the table here
        // For now, we'll just log and continue
        console.log('Note: transfer_event_cursors table should be created in database');
      }
    } catch (error) {
      console.log('Cursor table initialization:', error.message);
    }
  }

  // Get the last processed event ID
  async getLastEventId() {
    try {
      const result = await databaseService.query(this.cursorTable, "select", {
        where: { id: 1 },
        limit: 1
      });

      if (result.success && result.data.length > 0) {
        return result.data[0].last_event_id;
      }
      return null;
    } catch (error) {
      console.error('Error getting last event ID:', error);
      return null;
    }
  }

  // Update the last processed event ID using proper upsert
  async updateLastEventId(eventId) {
    try {
      const result = await databaseService.upsert(this.cursorTable, [{
        id: 1,
        last_event_id: eventId,
        updated_at: new Date().toISOString()
      }]);

      if (!result.success) {
        console.error('Failed to update last event ID:', result.error);
      } else {
        console.log(`📊 Updated cursor to event ID: ${eventId}`);
      }
    } catch (error) {
      console.error('Error updating last event ID:', error);
    }
  }

  // Main sync method - called by webhook
  async syncTransferEvents() {
    try {
      console.log('🔄 Starting transfer event sync...');
      
      const lastEventId = await this.getLastEventId();
      console.log(`📊 Last processed event ID: ${lastEventId || 'none'}`);

      // Get all active access tokens
      const accessTokens = await this.getActiveAccessTokens();
      
      if (accessTokens.length === 0) {
        console.log('⚠️ No active access tokens found');
        return { success: true, eventsProcessed: 0 };
      }

      let totalEventsProcessed = 0;

      // Sync events for each access token
      for (const accessToken of accessTokens) {
        const eventsProcessed = await this.syncEventsForToken(accessToken, lastEventId);
        totalEventsProcessed += eventsProcessed;
      }

      console.log(`✅ Transfer event sync completed. Processed ${totalEventsProcessed} events`);
      return { success: true, eventsProcessed: totalEventsProcessed };

    } catch (error) {
      console.error('❌ Error during transfer event sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all active access tokens
  async getActiveAccessTokens() {
    try {
      const result = await databaseService.query("items", "select", {
        where: { is_active: true }
      });

      if (!result.success) {
        console.error('Failed to get active items:', result.error);
        return [];
      }

      const accessTokens = [];
      for (const item of result.data) {
        try {
          const encryptedToken = JSON.parse(item.access_token_encrypted);
          const decryptedToken = decryptToken(encryptedToken);
          accessTokens.push(decryptedToken);
        } catch (error) {
          console.error(`Error decrypting token for item ${item.id}:`, error);
        }
      }

      return accessTokens;
    } catch (error) {
      console.error('Error getting active access tokens:', error);
      return [];
    }
  }

  // Sync events for a specific access token
  async syncEventsForToken(accessToken, afterEventId) {
    try {
      let eventsProcessed = 0;
      let cursor = afterEventId;
      let hasMore = true;

      while (hasMore) {
        const syncResult = await plaidService.syncTransferEvents(accessToken, cursor);
        
        if (!syncResult.success) {
          console.error('Failed to sync events:', syncResult.error);
          break;
        }

        const events = syncResult.events || [];
        console.log(`📦 Processing ${events.length} events for token`);

        // Process each event
        for (const event of events) {
          await this.processTransferEvent(event);
          eventsProcessed++;
          
          // Update cursor to the highest event ID processed
          if (!cursor || event.event_id > cursor) {
            cursor = event.event_id;
          }
        }

        hasMore = syncResult.has_more || false;
      }

      // Update the last processed event ID
      if (cursor) {
        await this.updateLastEventId(cursor);
      }

      return eventsProcessed;
    } catch (error) {
      console.error('Error syncing events for token:', error);
      return 0;
    }
  }

  // Process individual transfer event
  async processTransferEvent(event) {
    try {
      const { event_id, transfer_id, event_type, timestamp } = event;
      
      console.log(`🔄 Processing event ${event_id}: ${event_type} for transfer ${transfer_id}`);

      // Find the transaction record
      const transactionResult = await databaseService.query("transactions", "select", {
        where: { plaid_transfer_id: transfer_id }
      });

      if (!transactionResult.success || transactionResult.data.length === 0) {
        console.log(`⚠️ No transaction found for transfer_id: ${transfer_id}`);
        return;
      }

      const transaction = transactionResult.data[0];
      const currentStatus = transaction.status;

      // Map event type to database status
      const newStatus = this.mapEventTypeToStatus(event_type);
      
      if (!newStatus) {
        console.log(`⚠️ Unknown event type: ${event_type}`);
        return;
      }

      // Check if status should be updated (no downgrades)
      if (!this.shouldUpdateStatus(currentStatus, newStatus)) {
        console.log(`⏭️ Skipping status update: ${currentStatus} → ${newStatus} (no downgrade)`);
        return;
      }

      // Prepare update data
      const updateData = this.prepareStatusUpdate(newStatus, event);

      // Update the transaction
      const updateResult = await databaseService.query("transactions", "update", {
        where: { plaid_transfer_id: transfer_id },
        values: updateData
      });

      if (updateResult.success) {
        console.log(`✅ Updated transfer ${transfer_id}: ${currentStatus} → ${newStatus} (event: ${event_id})`);
      } else {
        console.error(`❌ Failed to update transfer ${transfer_id}:`, updateResult.error);
      }

    } catch (error) {
      console.error(`❌ Error processing transfer event ${event.event_id}:`, error);
    }
  }

  // Map Plaid event type to database status (update this method)
  mapEventTypeToStatus(eventType) {
    const statusMap = {
      'pending': 'pending',
      'posted': 'posted', 
      'settled': 'settled',
      'funds_available': 'funds_available',
      'returned': 'returned',
      'failed': 'failed',
      'cancelled': 'cancelled'
    };

    return statusMap[eventType] || null;
  }

  // Check if status should be updated (prevent downgrades) - FIXED
  shouldUpdateStatus(currentStatus, newStatus) {
    const statusHierarchy = {
      'pending': 1,
      'posted': 2,
      'settled': 3,        // ✅ FIXED: settled comes before funds_available
      'funds_available': 4, // ✅ FIXED: funds_available is final
      'returned': 5,
      'failed': 5,
      'cancelled': 5
    };

    const currentLevel = statusHierarchy[currentStatus] || 0;
    const newLevel = statusHierarchy[newStatus] || 0;

    // Allow updates if new status is higher in hierarchy or same level
    return newLevel >= currentLevel;
  }

  // Prepare status update data (update this method)
  prepareStatusUpdate(status, event) {
    const updateData = { status };
    const timestamp = new Date().toISOString();

    switch (status) {
      case 'posted':
        updateData.processed_at = timestamp;
        updateData.ach_reference_id = event.ach_transfer_id || null;
        break;

      case 'settled':
        updateData.completed_at = timestamp;
        break;

      case 'funds_available':
        // Note: Your schema doesn't have funds_available_at column
        // We'll just update the status
        break;

      case 'returned':
      case 'failed':
      case 'cancelled':
        updateData.failed_at = timestamp;
        updateData.failure_reason = event.return_reason || 
                                   event.failure_reason || 
                                   `${status} by Plaid`;
        break;
    }

    return updateData;
  }

  // Backfill command - sync from specific event ID
  async backfillFromEventId(afterEventId = null) {
    try {
      console.log(`🔄 Starting backfill from event ID: ${afterEventId || 'beginning'}`);
      
      const accessTokens = await this.getActiveAccessTokens();
      let totalEventsProcessed = 0;

      for (const accessToken of accessTokens) {
        const eventsProcessed = await this.syncEventsForToken(accessToken, afterEventId);
        totalEventsProcessed += eventsProcessed;
      }

      console.log(`✅ Backfill completed. Processed ${totalEventsProcessed} events`);
      return { success: true, eventsProcessed: totalEventsProcessed };

    } catch (error) {
      console.error('❌ Error during backfill:', error);
      return { success: false, error: error.message };
    }
  }

  // Fire test webhook (for sandbox testing)
  async fireTestWebhook() {
    try {
      const result = await plaidService.fireTestWebhook();
      
      if (result.success) {
        console.log('✅ Test webhook fired successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to fire test webhook:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error firing test webhook:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TransferEventSyncService();
