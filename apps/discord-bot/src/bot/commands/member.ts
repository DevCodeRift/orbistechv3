import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tenant, AllianceMemberService } from '@orbistech/database';
import { Command } from './command-handler';

export class MemberCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('member')
    .setDescription('Alliance member management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('find')
        .setDescription('Find a member by name or Discord ID')
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Nation name, leader name, or Discord mention')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Show member statistics')
        .addIntegerOption(option =>
          option
            .setName('nation_id')
            .setDescription('Nation ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('top')
        .setDescription('Show top members by score')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of top members to show (1-20)')
            .setMinValue(1)
            .setMaxValue(20)
        )
    );

  async execute(interaction: any, tenant: Tenant) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'find':
        await this.handleFind(interaction, tenant);
        break;
      case 'stats':
        await this.handleStats(interaction, tenant);
        break;
      case 'top':
        await this.handleTop(interaction, tenant);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }

  private async handleFind(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const query = interaction.options.getString('query');
      const memberService = new AllianceMemberService(tenant.id);

      // Try to extract Discord ID from mention
      const discordIdMatch = query.match(/<@!?(\d+)>/);
      const discordId = discordIdMatch ? discordIdMatch[1] : query;

      // Search for members
      const allMembers = await memberService.getActiveMembers();
      const matches = allMembers.filter(member =>
        member.nationName.toLowerCase().includes(query.toLowerCase()) ||
        member.leaderName.toLowerCase().includes(query.toLowerCase()) ||
        member.discordId === discordId
      );

      if (matches.length === 0) {
        await interaction.editReply({ content: 'No members found matching that query.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Member Search Results for "${query}"`)
        .setColor(0x0099FF);

      if (matches.length === 1) {
        const member = matches[0];
        embed.setDescription(
          `**${member.nationName}** (ID: ${member.nationId})\n` +
          `**Leader:** ${member.leaderName}\n` +
          `**Position:** ${member.position || 'N/A'}\n` +
          `**Cities:** ${member.cities || 'N/A'}\n` +
          `**Score:** ${member.score?.toNumber()?.toLocaleString() || 'N/A'}\n` +
          `**Discord:** ${member.discordId ? `<@${member.discordId}>` : 'Not linked'}\n` +
          `**Last Active:** ${member.lastActive ? this.formatDate(member.lastActive) : 'Unknown'}`
        );
      } else {
        embed.setDescription(
          matches.slice(0, 10).map(member => {
            return `**${member.nationName}** (${member.leaderName})\n` +
                   `└ ID: ${member.nationId} | Score: ${member.score?.toNumber()?.toLocaleString() || 'N/A'}`;
          }).join('\n\n')
        );

        if (matches.length > 10) {
          embed.setFooter({ text: `Showing 10 of ${matches.length} results` });
        }
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in member find command:', error);
      await interaction.editReply({ content: 'Failed to search for members.' });
    }
  }

  private async handleStats(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const nationId = interaction.options.getInteger('nation_id');
      const memberService = new AllianceMemberService(tenant.id);

      const allMembers = await memberService.getActiveMembers();
      const member = allMembers.find(m => m.nationId === nationId);

      if (!member) {
        await interaction.editReply({ content: 'Member not found in alliance.' });
        return;
      }

      // Calculate member ranking
      const sortedMembers = allMembers.sort((a, b) =>
        (b.score?.toNumber() || 0) - (a.score?.toNumber() || 0)
      );
      const rank = sortedMembers.findIndex(m => m.nationId === nationId) + 1;

      // Calculate activity status
      const daysSinceActive = member.lastActive
        ? Math.floor((Date.now() - member.lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const activityStatus = daysSinceActive === null
        ? 'Unknown'
        : daysSinceActive === 0
        ? '✅ Active today'
        : daysSinceActive <= 1
        ? '🟡 Active recently'
        : daysSinceActive <= 7
        ? '🟠 Active this week'
        : '🔴 Inactive';

      const embed = new EmbedBuilder()
        .setTitle(`${member.nationName} - Member Statistics`)
        .setColor(0x0099FF)
        .addFields(
          { name: 'Leader', value: member.leaderName, inline: true },
          { name: 'Nation ID', value: member.nationId.toString(), inline: true },
          { name: 'Alliance Rank', value: `#${rank} of ${allMembers.length}`, inline: true },
          { name: 'Position', value: member.position || 'N/A', inline: true },
          { name: 'Cities', value: member.cities?.toString() || 'N/A', inline: true },
          { name: 'Score', value: member.score?.toNumber()?.toLocaleString() || 'N/A', inline: true },
          { name: 'Activity Status', value: activityStatus, inline: false }
        );

      if (member.discordId) {
        embed.addFields({ name: 'Discord', value: `<@${member.discordId}>`, inline: true });
      }

      if (member.joinedAlliance) {
        const daysSinceJoined = Math.floor((Date.now() - member.joinedAlliance.getTime()) / (1000 * 60 * 60 * 24));
        embed.addFields({
          name: 'Alliance Tenure',
          value: `${daysSinceJoined} days`,
          inline: true
        });
      }

      embed.setTimestamp();
      embed.setFooter({ text: 'Alliance Management Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in member stats command:', error);
      await interaction.editReply({ content: 'Failed to fetch member statistics.' });
    }
  }

  private async handleTop(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const limit = interaction.options.getInteger('limit') || 10;
      const memberService = new AllianceMemberService(tenant.id);

      const allMembers = await memberService.getActiveMembers();
      const topMembers = allMembers
        .sort((a, b) => (b.score?.toNumber() || 0) - (a.score?.toNumber() || 0))
        .slice(0, limit);

      if (topMembers.length === 0) {
        await interaction.editReply({ content: 'No members found.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${tenant.allianceName} - Top ${limit} Members`)
        .setColor(0x0099FF)
        .setDescription(
          topMembers.map((member, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`;
            return `${medal} **${member.nationName}** (${member.leaderName})\n` +
                   `└ Score: ${member.score?.toNumber()?.toLocaleString() || 'N/A'} | Cities: ${member.cities || 'N/A'}`;
          }).join('\n\n')
        )
        .setTimestamp()
        .setFooter({ text: 'Alliance Management Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in member top command:', error);
      await interaction.editReply({ content: 'Failed to fetch top members.' });
    }
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}