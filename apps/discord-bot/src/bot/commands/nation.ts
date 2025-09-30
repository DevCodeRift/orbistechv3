import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { Command } from './command-handler';
import { decryptApiKey } from '@orbistech/encryption';
import pnwkit from 'pnwkit';

export class NationCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('nation')
    .setDescription('Get nation information')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Show detailed nation information')
        .addIntegerOption(option =>
          option
            .setName('id')
            .setDescription('Nation ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search for a nation by name')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Nation or leader name')
            .setRequired(true)
        )
    );

  async execute(interaction: any, tenant: Tenant) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'info':
        await this.handleInfo(interaction, tenant);
        break;
      case 'search':
        await this.handleSearch(interaction, tenant);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }

  private async handleInfo(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const nationId = interaction.options.getInteger('id');

      // Get API key and initialize pnwkit
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);
      pnwkit.setKey(apiKey);

      // Fetch nation data
      const nationData = await pnwkit.nationQuery(
        { id: [nationId], first: 1 },
        `id nation_name leader_name alliance {
          id name
        } cities score color continent
        last_active date soldiers tanks aircraft ships
        discord discord_id vacation_mode_turns beige_turns`
      );

      if (!nationData?.data?.nations?.data?.[0]) {
        await interaction.editReply({ content: 'Nation not found.' });
        return;
      }

      const nation = nationData.data.nations.data[0];

      const embed = new EmbedBuilder()
        .setTitle(`${nation.nation_name}`)
        .setColor(this.getColorCode(nation.color))
        .addFields(
          { name: 'Leader', value: nation.leader_name, inline: true },
          { name: 'Nation ID', value: nation.id.toString(), inline: true },
          { name: 'Score', value: nation.score?.toLocaleString() || 'N/A', inline: true },
          { name: 'Cities', value: nation.cities?.toString() || 'N/A', inline: true },
          { name: 'Color', value: nation.color || 'N/A', inline: true },
          { name: 'Continent', value: nation.continent || 'N/A', inline: true }
        );

      if (nation.alliance) {
        embed.addFields({
          name: 'Alliance',
          value: `${nation.alliance.name} (ID: ${nation.alliance.id})`,
          inline: false
        });
      }

      // Military info
      const military = [
        `Soldiers: ${nation.soldiers?.toLocaleString() || 'N/A'}`,
        `Tanks: ${nation.tanks?.toLocaleString() || 'N/A'}`,
        `Aircraft: ${nation.aircraft?.toLocaleString() || 'N/A'}`,
        `Ships: ${nation.ships?.toLocaleString() || 'N/A'}`
      ].join('\n');

      embed.addFields({ name: 'Military', value: military, inline: true });

      // Status info
      const status = [];
      if (nation.vacation_mode_turns > 0) {
        status.push(`🏖️ Vacation Mode: ${nation.vacation_mode_turns} turns`);
      }
      if (nation.beige_turns > 0) {
        status.push(`🤍 Beige: ${nation.beige_turns} turns`);
      }
      if (status.length === 0) {
        status.push('✅ Active');
      }

      embed.addFields({ name: 'Status', value: status.join('\n'), inline: true });

      // Last active
      if (nation.last_active) {
        const lastActive = new Date(nation.last_active);
        const daysAgo = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
        embed.addFields({
          name: 'Last Active',
          value: daysAgo === 0 ? 'Today' : `${daysAgo} days ago`,
          inline: true
        });
      }

      embed.setTimestamp();
      embed.setFooter({ text: 'Alliance Management Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in nation info command:', error);
      await interaction.editReply({ content: 'Failed to fetch nation information.' });
    }
  }

  private async handleSearch(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const searchTerm = interaction.options.getString('name');

      // Get API key and initialize pnwkit
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);
      pnwkit.setKey(apiKey);

      // Search by nation name and leader name
      const [nationResults, leaderResults] = await Promise.all([
        pnwkit.nationQuery(
          { nation_name: [searchTerm], first: 5 },
          `id nation_name leader_name alliance { name } score`
        ),
        pnwkit.nationQuery(
          { leader_name: [searchTerm], first: 5 },
          `id nation_name leader_name alliance { name } score`
        )
      ]);

      const nations = [
        ...(nationResults?.data?.nations?.data || []),
        ...(leaderResults?.data?.nations?.data || [])
      ];

      // Remove duplicates
      const uniqueNations = nations.filter((nation, index, self) =>
        index === self.findIndex(n => n.id === nation.id)
      );

      if (uniqueNations.length === 0) {
        await interaction.editReply({ content: 'No nations found matching that search term.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Search Results for "${searchTerm}"`)
        .setColor(0x0099FF)
        .setDescription(
          uniqueNations.slice(0, 10).map(nation => {
            const alliance = nation.alliance?.name || 'None';
            return `**${nation.nation_name}** (ID: ${nation.id})\n` +
                   `└ Leader: ${nation.leader_name} | Alliance: ${alliance} | Score: ${nation.score?.toLocaleString() || 'N/A'}`;
          }).join('\n\n')
        )
        .setFooter({
          text: `Showing ${Math.min(uniqueNations.length, 10)} of ${uniqueNations.length} results`
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in nation search command:', error);
      await interaction.editReply({ content: 'Failed to search for nations.' });
    }
  }

  private getColorCode(color: string): number {
    const colors: { [key: string]: number } = {
      'beige': 0xF5F5DC,
      'gray': 0x808080,
      'lime': 0x00FF00,
      'green': 0x008000,
      'white': 0xFFFFFF,
      'brown': 0xA52A2A,
      'maroon': 0x800000,
      'purple': 0x800080,
      'blue': 0x0000FF,
      'red': 0xFF0000,
      'orange': 0xFFA500,
      'yellow': 0xFFFF00,
      'pink': 0xFFC0CB,
      'black': 0x000000
    };

    return colors[color?.toLowerCase()] || 0x0099FF;
  }
}