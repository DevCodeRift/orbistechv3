import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { decryptBotToken, decryptApiKey } from '@orbistech/encryption';
import { TenantBot } from './tenant-bot';
import { CommandHandler } from './commands/command-handler';
import { EventHandler } from './events/event-handler';
import pnwkit from 'pnwkit';

export interface BotInstance {
  tenantId: string;
  tenant: Tenant;
  client: Client;
  pnwKit: any;
  commandHandler: CommandHandler;
  eventHandler: EventHandler;
  tenantBot: TenantBot;
}

export class BotManager {
  private instances: Map<string, BotInstance> = new Map();

  async startTenantBot(tenant: Tenant): Promise<BotInstance> {
    try {
      // Check if bot is already running
      if (this.instances.has(tenant.id)) {
        throw new Error(`Bot for tenant ${tenant.id} is already running`);
      }

      // Decrypt tokens
      const botToken = await decryptBotToken(tenant.discordBotTokenEncrypted!);
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);

      // Create Discord client with necessary intents
      const client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.MessageContent,
        ],
      });

      // Initialize P&W Kit
      const pnwKit = pnwkit;
      pnwKit.setKey(apiKey);

      // Create command and event handlers
      const commandHandler = new CommandHandler(tenant);
      const eventHandler = new EventHandler(tenant);

      // Create tenant bot instance
      const tenantBot = new TenantBot(tenant, client, pnwKit);

      // Set up the bot instance
      const instance: BotInstance = {
        tenantId: tenant.id,
        tenant,
        client,
        pnwKit,
        commandHandler,
        eventHandler,
        tenantBot,
      };

      // Register commands and events
      await commandHandler.register(client);
      eventHandler.register(client, instance);

      // Login the bot
      await client.login(botToken);

      // Store the instance
      this.instances.set(tenant.id, instance);

      return instance;
    } catch (error) {
      throw new Error(`Failed to start bot for tenant ${tenant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async stopTenantBot(tenantId: string): Promise<void> {
    const instance = this.instances.get(tenantId);
    if (!instance) {
      throw new Error(`No bot instance found for tenant ${tenantId}`);
    }

    try {
      // Stop any running intervals/timers
      await instance.tenantBot.stop();

      // Destroy the Discord client
      instance.client.destroy();

      // Remove from instances
      this.instances.delete(tenantId);

      console.log(`🛑 Stopped bot for tenant ${tenantId}`);
    } catch (error) {
      console.error(`Error stopping bot for tenant ${tenantId}:`, error);
    }
  }

  async restartTenantBot(tenant: Tenant): Promise<BotInstance> {
    if (this.instances.has(tenant.id)) {
      await this.stopTenantBot(tenant.id);
    }
    return this.startTenantBot(tenant);
  }

  getInstance(tenantId: string): BotInstance | undefined {
    return this.instances.get(tenantId);
  }

  getAllInstances(): BotInstance[] {
    return Array.from(this.instances.values());
  }

  async shutdown(): Promise<void> {
    console.log(`🛑 Shutting down ${this.instances.size} bot instances...`);

    const shutdownPromises = Array.from(this.instances.keys()).map(tenantId =>
      this.stopTenantBot(tenantId)
    );

    await Promise.allSettled(shutdownPromises);
    console.log('✅ All bot instances shut down');
  }

  // Get instance by guild ID
  getInstanceByGuildId(guildId: string): BotInstance | undefined {
    return Array.from(this.instances.values()).find(
      instance => instance.tenant.discordGuildId === guildId
    );
  }

  // Check if a guild is managed by any bot
  isGuildManaged(guildId: string): boolean {
    return this.getInstanceByGuildId(guildId) !== undefined;
  }

  // Get bot statistics
  getStats() {
    const instances = this.getAllInstances();
    return {
      totalBots: instances.length,
      guilds: instances.map(i => ({
        tenantId: i.tenantId,
        allianceName: i.tenant.allianceName,
        guildId: i.tenant.discordGuildId,
        status: i.client.readyAt ? 'online' : 'offline',
      })),
    };
  }
}