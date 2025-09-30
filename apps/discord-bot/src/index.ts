import 'dotenv/config';
import { BotManager } from './bot/bot-manager';
import { TenantService } from '@orbistech/database';

async function main() {
  console.log('🚀 Starting Discord Bot Manager...');

  try {
    // Initialize bot manager
    const botManager = new BotManager();

    // Load active tenants and start their bots
    const tenants = await TenantService.getActiveTenants();

    console.log(`📊 Found ${tenants.length} active tenants`);

    for (const tenant of tenants) {
      if (tenant.discordBotTokenEncrypted && tenant.apiKeyEncrypted) {
        try {
          await botManager.startTenantBot(tenant);
          console.log(`✅ Started bot for ${tenant.allianceName} (${tenant.subdomain})`);
        } catch (error) {
          console.error(`❌ Failed to start bot for ${tenant.allianceName}:`, error);
        }
      } else {
        console.log(`⚠️  Skipping ${tenant.allianceName}: Missing bot token or API key`);
      }
    }

    console.log('🎉 Bot Manager initialized successfully');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Bot Manager...');
      await botManager.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down Bot Manager...');
      await botManager.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Failed to start Bot Manager:', error);
    process.exit(1);
  }
}

// Start the bot manager
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});