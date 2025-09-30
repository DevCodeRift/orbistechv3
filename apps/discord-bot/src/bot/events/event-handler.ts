import { Client, Events } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { BotInstance } from '../bot-manager';

export class EventHandler {
  constructor(private tenant: Tenant) {}

  register(client: Client, instance: BotInstance) {
    // Bot ready event
    client.once(Events.ClientReady, () => {
      console.log(`✅ Bot logged in as ${client.user?.tag} for ${this.tenant.allianceName}`);

      // Set bot status
      client.user?.setActivity(`${this.tenant.allianceName} | /help`, { type: 'WATCHING' as any });
    });

    // Handle interactions (slash commands)
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      // Check if the interaction is from the correct guild (if configured)
      if (this.tenant.discordGuildId && interaction.guildId !== this.tenant.discordGuildId) {
        await interaction.reply({
          content: 'This bot is only configured for a specific server.',
          ephemeral: true
        });
        return;
      }

      try {
        await instance.commandHandler.handleInteraction(interaction);
      } catch (error) {
        console.error(`❌ Error handling interaction for ${this.tenant.allianceName}:`, error);
      }
    });

    // Guild join event
    client.on(Events.GuildCreate, async (guild) => {
      console.log(`🎉 Bot joined guild: ${guild.name} (${guild.id}) for ${this.tenant.allianceName}`);

      // If this is the first guild and no guild is configured, update the tenant
      if (!this.tenant.discordGuildId) {
        try {
          // Update tenant with guild ID (this would need to be implemented)
          console.log(`📝 Could update tenant ${this.tenant.id} with guild ID ${guild.id}`);
        } catch (error) {
          console.error('Failed to update tenant with guild ID:', error);
        }
      }

      // Send welcome message
      const systemChannel = guild.systemChannel || guild.channels.cache.find(channel =>
        channel.isTextBased() && channel.permissionsFor(guild.members.me!)?.has('SendMessages')
      );

      if (systemChannel && systemChannel.isTextBased()) {
        try {
          await systemChannel.send({
            embeds: [{
              title: `🤖 ${this.tenant.allianceName} Management Bot`,
              description:
                `Hello! I'm the alliance management bot for **${this.tenant.allianceName}**.\n\n` +
                `Use \`/help\` to see all available commands.\n\n` +
                `**Key Features:**\n` +
                `• Alliance member tracking\n` +
                `• War monitoring\n` +
                `• Nation information lookup\n` +
                `• Member statistics and rankings\n\n` +
                `**Getting Started:**\n` +
                `Try \`/alliance info\` to see your alliance overview!`,
              color: 0x0099FF,
              footer: { text: 'Alliance Management System' },
              timestamp: new Date().toISOString()
            }]
          });
        } catch (error) {
          console.error('Failed to send welcome message:', error);
        }
      }
    });

    // Guild leave event
    client.on(Events.GuildDelete, (guild) => {
      console.log(`👋 Bot left guild: ${guild.name} (${guild.id}) for ${this.tenant.allianceName}`);
    });

    // Error handling
    client.on(Events.Error, (error) => {
      console.error(`❌ Discord client error for ${this.tenant.allianceName}:`, error);
    });

    client.on(Events.Warn, (warning) => {
      console.warn(`⚠️ Discord client warning for ${this.tenant.allianceName}:`, warning);
    });

    // Member join event (optional: for alliance member verification)
    client.on(Events.GuildMemberAdd, async (member) => {
      console.log(`👤 Member joined ${member.guild.name}: ${member.user.tag}`);

      // Could implement automatic role assignment based on P&W data
      // or send welcome messages with instructions
    });

    // Member leave event
    client.on(Events.GuildMemberRemove, async (member) => {
      console.log(`👤 Member left ${member.guild.name}: ${member.user.tag}`);
    });

    // Message event (for potential non-slash command features)
    client.on(Events.MessageCreate, async (message) => {
      // Ignore bot messages
      if (message.author.bot) return;

      // Could implement prefix commands or other message-based features
      // For now, we'll focus on slash commands only
    });

    // Rate limit warning
    client.rest.on('rateLimited', (info) => {
      console.warn(`⚠️ Rate limited for ${this.tenant.allianceName}:`, info);
    });

    // Debug events (only in development)
    if (process.env.NODE_ENV === 'development') {
      client.on(Events.Debug, (info) => {
        console.debug(`🐛 Debug for ${this.tenant.allianceName}:`, info);
      });
    }
  }
}