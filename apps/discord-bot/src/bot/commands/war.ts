import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tenant } from '@orbistech/database';
import { Command } from './command-handler';
import { decryptApiKey } from '@orbistech/encryption';
import pnwkit from 'pnwkit';

export class WarCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('war')
    .setDescription('War and conflict tracking commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('active')
        .setDescription('Show active wars involving alliance members')
        .addIntegerOption(option =>
          option
            .setName('limit')
            .setDescription('Number of wars to show (1-20)')
            .setMinValue(1)
            .setMaxValue(20)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get detailed information about a specific war')
        .addIntegerOption(option =>
          option
            .setName('war_id')
            .setDescription('War ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('member')
        .setDescription('Show wars for a specific alliance member')
        .addIntegerOption(option =>
          option
            .setName('nation_id')
            .setDescription('Nation ID')
            .setRequired(true)
        )
    );

  async execute(interaction: any, tenant: Tenant) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'active':
        await this.handleActive(interaction, tenant);
        break;
      case 'info':
        await this.handleInfo(interaction, tenant);
        break;
      case 'member':
        await this.handleMember(interaction, tenant);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }

  private async handleActive(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const limit = interaction.options.getInteger('limit') || 10;

      // Get API key and initialize pnwkit
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);
      pnwkit.setKey(apiKey);

      // Fetch active wars involving alliance members
      const warData = await pnwkit.warQuery(
        { alliance_id: [tenant.allianceId], active: true, first: limit },
        `id attacker_id defender_id attacker { nation_name } defender { nation_name }
         war_type date turns_left`
      );

      const wars = warData?.data?.wars?.data || [];

      if (wars.length === 0) {
        await interaction.editReply({
          content: `No active wars found for ${tenant.allianceName} members.`
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${tenant.allianceName} - Active Wars`)
        .setColor(0xFF6B6B)
        .setDescription(
          wars.map(war => {
            const warType = this.formatWarType(war.war_type);
            const daysAgo = this.calculateDaysAgo(war.date);
            return `**War ID:** ${war.id} | ${warType}\n` +
                   `**Attacker:** ${war.attacker?.nation_name || 'Unknown'}\n` +
                   `**Defender:** ${war.defender?.nation_name || 'Unknown'}\n` +
                   `**Started:** ${daysAgo} | **Turns Left:** ${war.turns_left || 'N/A'}`;
          }).join('\n\n')
        )
        .setFooter({ text: `Showing ${wars.length} active wars` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in war active command:', error);
      await interaction.editReply({ content: 'Failed to fetch active wars.' });
    }
  }

  private async handleInfo(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const warId = interaction.options.getInteger('war_id');

      // Get API key and initialize pnwkit
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);
      pnwkit.setKey(apiKey);

      // Fetch detailed war information
      const warData = await pnwkit.warQuery(
        { id: [warId], first: 1 },
        `id attacker_id defender_id attacker { nation_name leader_name alliance { name } }
         defender { nation_name leader_name alliance { name } }
         war_type date winner turns_left att_points def_points
         att_peace def_peace`
      );

      const war = warData?.data?.wars?.data?.[0];

      if (!war) {
        await interaction.editReply({ content: 'War not found.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`War Information - ID: ${war.id}`)
        .setColor(war.winner ? 0x00FF00 : 0xFF6B6B)
        .addFields(
          {
            name: 'Attacker',
            value: `**${war.attacker?.nation_name || 'Unknown'}** (${war.attacker?.leader_name || 'Unknown'})\n` +
                   `Alliance: ${war.attacker?.alliance?.name || 'None'}`,
            inline: true
          },
          {
            name: 'Defender',
            value: `**${war.defender?.nation_name || 'Unknown'}** (${war.defender?.leader_name || 'Unknown'})\n` +
                   `Alliance: ${war.defender?.alliance?.name || 'None'}`,
            inline: true
          },
          {
            name: 'War Details',
            value: `**Type:** ${this.formatWarType(war.war_type)}\n` +
                   `**Started:** ${this.formatDate(war.date)}\n` +
                   `**Status:** ${war.winner ? `Won by ${war.winner}` : 'Ongoing'}`,
            inline: false
          },
          {
            name: 'War Points',
            value: `**Attacker:** ${war.att_points || 0}\n**Defender:** ${war.def_points || 0}`,
            inline: true
          }
        );

      if (!war.winner) {
        embed.addFields({
          name: 'Turns Left',
          value: war.turns_left?.toString() || 'Unknown',
          inline: true
        });
      }

      // Peace status
      const peaceStatus = [];
      if (war.att_peace) peaceStatus.push('Attacker offered peace');
      if (war.def_peace) peaceStatus.push('Defender offered peace');
      if (peaceStatus.length > 0) {
        embed.addFields({
          name: 'Peace Status',
          value: peaceStatus.join('\n'),
          inline: false
        });
      }

      embed.setTimestamp();
      embed.setFooter({ text: 'Alliance Management Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in war info command:', error);
      await interaction.editReply({ content: 'Failed to fetch war information.' });
    }
  }

  private async handleMember(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const nationId = interaction.options.getInteger('nation_id');

      // Get API key and initialize pnwkit
      const apiKey = await decryptApiKey(tenant.apiKeyEncrypted!);
      pnwkit.setKey(apiKey);

      // Fetch wars for the specific nation
      const [attackerWars, defenderWars] = await Promise.all([
        pnwkit.warQuery(
          { attid: [nationId], first: 10 },
          `id defender { nation_name } war_type date winner turns_left`
        ),
        pnwkit.warQuery(
          { defid: [nationId], first: 10 },
          `id attacker { nation_name } war_type date winner turns_left`
        )
      ]);

      const wars = [
        ...(attackerWars?.data?.wars?.data || []).map((war: any) => ({ ...war, role: 'Attacker' })),
        ...(defenderWars?.data?.wars?.data || []).map((war: any) => ({ ...war, role: 'Defender' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (wars.length === 0) {
        await interaction.editReply({
          content: `No wars found for nation ID ${nationId}.`
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Wars for Nation ID: ${nationId}`)
        .setColor(0xFF6B6B)
        .setDescription(
          wars.slice(0, 10).map(war => {
            const opponent = war.role === 'Attacker'
              ? war.defender?.nation_name || 'Unknown'
              : war.attacker?.nation_name || 'Unknown';
            const status = war.winner
              ? (war.winner === 'Attacker' && war.role === 'Attacker') ||
                (war.winner === 'Defender' && war.role === 'Defender')
                ? '✅ Won'
                : '❌ Lost'
              : '⚔️ Active';

            return `**War ID:** ${war.id} | ${this.formatWarType(war.war_type)}\n` +
                   `**Role:** ${war.role} vs **${opponent}**\n` +
                   `**Status:** ${status} | **Started:** ${this.calculateDaysAgo(war.date)}`;
          }).join('\n\n')
        )
        .setFooter({ text: `Showing ${Math.min(wars.length, 10)} of ${wars.length} wars` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in war member command:', error);
      await interaction.editReply({ content: 'Failed to fetch member wars.' });
    }
  }

  private formatWarType(warType: string): string {
    const types: { [key: string]: string } = {
      'ORDINARY': '⚔️ Ordinary War',
      'ATTRITION': '🔥 Attrition War',
      'RAID': '💥 Raid',
      'NUCLEAR': '☢️ Nuclear War'
    };
    return types[warType] || warType;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  private calculateDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  }
}