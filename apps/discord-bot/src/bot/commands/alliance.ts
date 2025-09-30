import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Tenant, AllianceMemberService } from '@orbistech/database';
import { Command } from './command-handler';

export class AllianceCommand implements Command {
  data = new SlashCommandBuilder()
    .setName('alliance')
    .setDescription('Get alliance information and statistics')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Show alliance overview')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('members')
        .setDescription('List alliance members')
        .addIntegerOption(option =>
          option
            .setName('page')
            .setDescription('Page number (10 members per page)')
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('inactive')
        .setDescription('Show inactive members')
        .addIntegerOption(option =>
          option
            .setName('days')
            .setDescription('Days of inactivity threshold')
            .setMinValue(1)
            .setMaxValue(30)
        )
    );

  async execute(interaction: any, tenant: Tenant) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'info':
        await this.handleInfo(interaction, tenant);
        break;
      case 'members':
        await this.handleMembers(interaction, tenant);
        break;
      case 'inactive':
        await this.handleInactive(interaction, tenant);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
    }
  }

  private async handleInfo(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const memberService = new AllianceMemberService(tenant.id);
      const members = await memberService.getActiveMembers();

      const totalMembers = members.length;
      const totalCities = members.reduce((sum, member) => sum + (member.cities || 0), 0);
      const totalScore = members.reduce((sum, member) => sum + (member.score?.toNumber() || 0), 0);
      const avgScore = totalMembers > 0 ? totalScore / totalMembers : 0;

      const embed = new EmbedBuilder()
        .setTitle(`${tenant.allianceName} - Alliance Information`)
        .setColor(0x0099FF)
        .addFields(
          { name: 'Alliance ID', value: tenant.allianceId.toString(), inline: true },
          { name: 'Members', value: totalMembers.toString(), inline: true },
          { name: 'Total Cities', value: totalCities.toString(), inline: true },
          { name: 'Total Score', value: totalScore.toLocaleString(), inline: true },
          { name: 'Average Score', value: avgScore.toFixed(2), inline: true },
          { name: 'Status', value: tenant.status, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Alliance Management Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in alliance info command:', error);
      await interaction.editReply({ content: 'Failed to fetch alliance information.' });
    }
  }

  private async handleMembers(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const page = interaction.options.getInteger('page') || 1;
      const pageSize = 10;
      const offset = (page - 1) * pageSize;

      const memberService = new AllianceMemberService(tenant.id);
      const allMembers = await memberService.getActiveMembers();
      const members = allMembers.slice(offset, offset + pageSize);

      if (members.length === 0) {
        await interaction.editReply({ content: 'No members found for this page.' });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${tenant.allianceName} - Members (Page ${page})`)
        .setColor(0x0099FF)
        .setDescription(
          members.map((member, index) => {
            const rank = offset + index + 1;
            return `**${rank}.** ${member.nationName} (${member.leaderName})\n` +
                   `└ Cities: ${member.cities || 'N/A'} | Score: ${member.score?.toNumber()?.toLocaleString() || 'N/A'}`;
          }).join('\n\n')
        )
        .setFooter({
          text: `Page ${page} of ${Math.ceil(allMembers.length / pageSize)} | Total: ${allMembers.length} members`
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in alliance members command:', error);
      await interaction.editReply({ content: 'Failed to fetch alliance members.' });
    }
  }

  private async handleInactive(interaction: any, tenant: Tenant) {
    await interaction.deferReply();

    try {
      const days = interaction.options.getInteger('days') || 7;
      const memberService = new AllianceMemberService(tenant.id);
      const inactiveMembers = await memberService.getInactiveMembers(days);

      if (inactiveMembers.length === 0) {
        await interaction.editReply({
          content: `No members have been inactive for more than ${days} days.`
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${tenant.allianceName} - Inactive Members`)
        .setColor(0xFF6B6B)
        .setDescription(
          `Members inactive for more than ${days} days:\n\n` +
          inactiveMembers.slice(0, 15).map(member => {
            const daysSince = member.lastActive
              ? Math.floor((Date.now() - member.lastActive.getTime()) / (1000 * 60 * 60 * 24))
              : 'Unknown';
            return `**${member.nationName}** (${member.leaderName})\n` +
                   `└ Last active: ${daysSince} days ago`;
          }).join('\n\n')
        )
        .setFooter({
          text: `Showing ${Math.min(inactiveMembers.length, 15)} of ${inactiveMembers.length} inactive members`
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in alliance inactive command:', error);
      await interaction.editReply({ content: 'Failed to fetch inactive members.' });
    }
  }
}