import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with tenant context
export function createPrismaClient(tenantId?: string) {
  const prisma = globalThis.__prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = prisma;
  }

  // Set tenant context for Row Level Security
  if (tenantId) {
    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, model, args, query }) {
            // Set tenant context for RLS
            await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
            return query(args);
          },
        },
      },
    });
  }

  return prisma;
}

// Default client for non-tenant operations
export const prisma = createPrismaClient();

// Tenant-aware client factory
export function getTenantClient(tenantId: string) {
  return createPrismaClient(tenantId);
}

// Export types
export type {
  Tenant,
  User,
  AllianceMember,
  War,
  WarAttack,
  TenantSettings,
  TenantInvitation,
  AuditLog,
  TenantStatus,
  UserRole,
  InvitationStatus
} from '@prisma/client';

// Helper functions
export class TenantService {
  static async findBySubdomain(subdomain: string) {
    return prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        settings: true,
      },
    });
  }

  static async findByAllianceId(allianceId: number) {
    return prisma.tenant.findUnique({
      where: { allianceId },
    });
  }

  static async findByDiscordGuildId(guildId: string) {
    return prisma.tenant.findFirst({
      where: { discordGuildId: guildId },
    });
  }

  static async getActiveTenants() {
    return prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        settings: true,
      },
    });
  }

  static async createTenant(data: {
    allianceId: number;
    allianceName: string;
    subdomain: string;
    discordAdminId: string;
    authorizedBy: string;
  }) {
    return prisma.tenant.create({
      data: {
        ...data,
        status: 'ACTIVE',
        authorizedAt: new Date(),
        settings: {
          create: {}, // Use default settings
        },
      },
      include: {
        settings: true,
      },
    });
  }
}

export class UserService {
  static async findByDiscordId(discordId: string) {
    return prisma.user.findUnique({
      where: { discordId },
      include: {
        tenant: true,
      },
    });
  }

  static async createOrUpdateUser(data: {
    discordId: string;
    username: string;
    avatar?: string;
    email?: string;
    tenantId?: string;
    role?: UserRole;
  }) {
    return prisma.user.upsert({
      where: { discordId: data.discordId },
      update: {
        username: data.username,
        avatar: data.avatar,
        email: data.email,
        tenantId: data.tenantId,
        role: data.role,
      },
      create: data,
      include: {
        tenant: true,
      },
    });
  }
}

export class AllianceMemberService {
  constructor(private tenantId: string) {}

  private get client() {
    return getTenantClient(this.tenantId);
  }

  async syncMember(memberData: {
    nationId: number;
    nationName: string;
    leaderName: string;
    discordId?: string;
    position?: string;
    positionId?: number;
    cities?: number;
    score?: number;
    lastActive?: Date;
    joinedAlliance?: Date;
  }) {
    return this.client.allianceMember.upsert({
      where: {
        tenantId_nationId: {
          tenantId: this.tenantId,
          nationId: memberData.nationId,
        },
      },
      update: {
        ...memberData,
        dataLastUpdated: new Date(),
      },
      create: {
        tenantId: this.tenantId,
        ...memberData,
        dataLastUpdated: new Date(),
      },
    });
  }

  async getActiveMembers() {
    return this.client.allianceMember.findMany({
      where: {
        tenantId: this.tenantId,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  async getInactiveMembers(thresholdDays: number = 7) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - thresholdDays);

    return this.client.allianceMember.findMany({
      where: {
        tenantId: this.tenantId,
        lastActive: {
          lt: threshold,
        },
      },
      orderBy: {
        lastActive: 'asc',
      },
    });
  }
}