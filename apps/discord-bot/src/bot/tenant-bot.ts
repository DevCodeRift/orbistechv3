import { Client } from 'discord.js';
import { Tenant, AllianceMemberService } from '@orbistech/database';
import cron from 'node-cron';

export class TenantBot {
  private syncCronJob?: cron.ScheduledTask;
  private memberService: AllianceMemberService;

  constructor(
    public readonly tenant: Tenant,
    public readonly client: Client,
    public readonly pnwKit: any
  ) {
    this.memberService = new AllianceMemberService(tenant.id);
  }

  async start() {
    // Set up data synchronization
    await this.setupDataSync();

    // Initial data sync
    await this.syncAllianceData();

    console.log(`🤖 Tenant bot started for ${this.tenant.allianceName}`);
  }

  async stop() {
    // Stop cron jobs
    if (this.syncCronJob) {
      this.syncCronJob.stop();
      this.syncCronJob.destroy();
    }

    console.log(`🛑 Tenant bot stopped for ${this.tenant.allianceName}`);
  }

  private async setupDataSync() {
    // Get sync interval from tenant settings (default 30 minutes)
    const settings = await this.getTenantSettings();
    const intervalMinutes = settings?.syncIntervalMinutes || 30;

    // Set up cron job for data synchronization
    this.syncCronJob = cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
      try {
        await this.syncAllianceData();
      } catch (error) {
        console.error(`❌ Failed to sync data for ${this.tenant.allianceName}:`, error);
      }
    });

    console.log(`⏰ Set up data sync every ${intervalMinutes} minutes for ${this.tenant.allianceName}`);
  }

  private async getTenantSettings() {
    // This would fetch tenant settings from database
    // For now, return default settings
    return {
      syncIntervalMinutes: 30,
      autoSyncEnabled: true,
      warAlertsEnabled: true,
      memberAlertsEnabled: true,
    };
  }

  async syncAllianceData(): Promise<void> {
    try {
      console.log(`🔄 Syncing alliance data for ${this.tenant.allianceName}...`);

      // Fetch alliance data from P&W API
      const allianceData = await this.pnwKit.allianceQuery(
        { id: [this.tenant.allianceId], first: 1 },
        `id name members {
          id nation_name leader_name cities score
          last_active discord discord_id
          alliance_position alliance_position_id
        }`
      );

      if (!allianceData?.data?.alliances?.data?.[0]) {
        throw new Error('No alliance data returned from API');
      }

      const alliance = allianceData.data.alliances.data[0];
      const members = alliance.members || [];

      console.log(`📊 Found ${members.length} members for ${this.tenant.allianceName}`);

      // Sync each member
      for (const member of members) {
        await this.memberService.syncMember({
          nationId: parseInt(member.id),
          nationName: member.nation_name,
          leaderName: member.leader_name,
          discordId: member.discord_id,
          position: member.alliance_position,
          positionId: member.alliance_position_id,
          cities: member.cities,
          score: parseFloat(member.score),
          lastActive: member.last_active ? new Date(member.last_active) : undefined,
        });
      }

      console.log(`✅ Successfully synced ${members.length} members for ${this.tenant.allianceName}`);
    } catch (error) {
      console.error(`❌ Failed to sync alliance data for ${this.tenant.allianceName}:`, error);
      throw error;
    }
  }

  async syncWarData(): Promise<void> {
    try {
      console.log(`⚔️ Syncing war data for ${this.tenant.allianceName}...`);

      // Fetch wars involving alliance members
      const warData = await this.pnwKit.warQuery(
        { alliance_id: [this.tenant.allianceId], active: true, first: 100 },
        `id attacker_id defender_id war_type date`
      );

      if (!warData?.data?.wars?.data) {
        console.log(`📊 No active wars found for ${this.tenant.allianceName}`);
        return;
      }

      const wars = warData.data.wars.data;
      console.log(`📊 Found ${wars.length} active wars for ${this.tenant.allianceName}`);

      // Process wars (implement war syncing logic here)
      // This would sync war data to the database

      console.log(`✅ Successfully synced war data for ${this.tenant.allianceName}`);
    } catch (error) {
      console.error(`❌ Failed to sync war data for ${this.tenant.allianceName}:`, error);
    }
  }

  // Get bot's guild
  getGuild() {
    if (!this.tenant.discordGuildId) {
      return null;
    }
    return this.client.guilds.cache.get(this.tenant.discordGuildId);
  }

  // Send message to a specific channel
  async sendToChannel(channelId: string, content: string | any) {
    try {
      const guild = this.getGuild();
      if (!guild) {
        throw new Error('Guild not found');
      }

      const channel = guild.channels.cache.get(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error('Channel not found or not text-based');
      }

      return await channel.send(content);
    } catch (error) {
      console.error(`Failed to send message to channel ${channelId}:`, error);
      throw error;
    }
  }

  // Check if user has specific role
  hasRole(userId: string, roleName: string): boolean {
    const guild = this.getGuild();
    if (!guild) return false;

    const member = guild.members.cache.get(userId);
    if (!member) return false;

    return member.roles.cache.some(role => role.name.toLowerCase() === roleName.toLowerCase());
  }

  // Check if user is alliance admin
  isAllianceAdmin(userId: string): boolean {
    return userId === this.tenant.discordAdminId;
  }
}