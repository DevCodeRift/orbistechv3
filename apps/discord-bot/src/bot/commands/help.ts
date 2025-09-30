import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { Command } from './command-handler';

export class HelpCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show available commands and their usage')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Get detailed help for a specific command')
        .setChoices(
          { name: 'alliance', value: 'alliance' },
          { name: 'nation', value: 'nation' },
          { name: 'member', value: 'member' },
          { name: 'war', value: 'war' }
        )
    );

  async execute(interaction: any, tenant: Tenant) {
    const specificCommand = interaction.options.getString('command');

    if (specificCommand) {
      await this.showSpecificHelp(interaction, specificCommand, tenant);
    } else {
      await this.showGeneralHelp(interaction, tenant);
    }
  }

  private async showGeneralHelp(interaction: any, tenant: Tenant) {
    const embed = new EmbedBuilder()
      .setTitle(`${tenant.allianceName} - Bot Commands`)
      .setColor(0x0099FF)
      .setDescription(
        'This bot provides alliance management tools for Politics and War. ' +
        'Use `/help <command>` for detailed information about specific commands.'
      )
      .addFields(
        {
          name: '🏛️ Alliance Commands',
          value: '`/alliance info` - Alliance overview\n' +
                 '`/alliance members` - List members\n' +
                 '`/alliance inactive` - Show inactive members',
          inline: false
        },
        {
          name: '🌍 Nation Commands',
          value: '`/nation info <id>` - Nation details\n' +
                 '`/nation search <name>` - Search nations',
          inline: false
        },
        {
          name: '👥 Member Commands',
          value: '`/member find <query>` - Find members\n' +
                 '`/member stats <id>` - Member statistics\n' +
                 '`/member top` - Top members by score',
          inline: false
        },
        {
          name: '⚔️ War Commands',
          value: '`/war active` - Active wars\n' +
                 '`/war info <id>` - War details\n' +
                 '`/war member <id>` - Member\'s wars',
          inline: false
        },
        {
          name: '❓ Help',
          value: '`/help` - Show this help\n' +
                 '`/help <command>` - Detailed command help',
          inline: false
        }
      )
      .setFooter({
        text: `Alliance ID: ${tenant.allianceId} | Use /help <command> for more details`
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  private async showSpecificHelp(interaction: any, command: string, tenant: Tenant) {
    const helpData: { [key: string]: any } = {
      alliance: {
        title: '🏛️ Alliance Commands',
        description: 'Commands for alliance information and member management.',
        commands: [
          {
            name: '/alliance info',
            description: 'Display alliance overview with statistics',
            usage: '/alliance info',
            example: '/alliance info'
          },
          {
            name: '/alliance members',
            description: 'List alliance members with pagination',
            usage: '/alliance members [page]',
            example: '/alliance members page:2'
          },
          {
            name: '/alliance inactive',
            description: 'Show members inactive for specified days',
            usage: '/alliance inactive [days]',
            example: '/alliance inactive days:7'
          }
        ]
      },
      nation: {
        title: '🌍 Nation Commands',
        description: 'Commands for retrieving nation information.',
        commands: [
          {
            name: '/nation info',
            description: 'Show detailed nation information',
            usage: '/nation info <id>',
            example: '/nation info id:123456'
          },
          {
            name: '/nation search',
            description: 'Search for nations by name',
            usage: '/nation search <name>',
            example: '/nation search name:"Nation Name"'
          }
        ]
      },
      member: {
        title: '👥 Member Commands',
        description: 'Commands for alliance member management and statistics.',
        commands: [
          {
            name: '/member find',
            description: 'Find alliance members by name or Discord mention',
            usage: '/member find <query>',
            example: '/member find query:"Leader Name" or query:@username'
          },
          {
            name: '/member stats',
            description: 'Show detailed statistics for a specific member',
            usage: '/member stats <nation_id>',
            example: '/member stats nation_id:123456'
          },
          {
            name: '/member top',
            description: 'Show top alliance members by score',
            usage: '/member top [limit]',
            example: '/member top limit:15'
          }
        ]
      },
      war: {
        title: '⚔️ War Commands',
        description: 'Commands for war tracking and conflict information.',
        commands: [
          {
            name: '/war active',
            description: 'Show active wars involving alliance members',
            usage: '/war active [limit]',
            example: '/war active limit:15'
          },
          {
            name: '/war info',
            description: 'Get detailed information about a specific war',
            usage: '/war info <war_id>',
            example: '/war info war_id:123456'
          },
          {
            name: '/war member',
            description: 'Show all wars for a specific alliance member',
            usage: '/war member <nation_id>',
            example: '/war member nation_id:123456'
          }
        ]
      }
    };

    const data = helpData[command];
    if (!data) {
      await interaction.reply({ content: 'Command not found!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(data.title)
      .setColor(0x0099FF)
      .setDescription(data.description);

    for (const cmd of data.commands) {
      embed.addFields({
        name: cmd.name,
        value: `**Description:** ${cmd.description}\n` +
               `**Usage:** \`${cmd.usage}\`\n` +
               `**Example:** \`${cmd.example}\``,
        inline: false
      });
    }

    embed.setFooter({
      text: `${tenant.allianceName} Alliance Management Bot`
    })
    .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}