import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { UserService, TenantService, prisma } from '@orbistech/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await UserService.findByDiscordId(session.user.discordId);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        settings: true,
      },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await UserService.findByDiscordId(session.user.discordId);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { allianceId, allianceName, subdomain, discordAdminId } = await request.json();

    // Validate input
    if (!allianceId || !allianceName || !subdomain || !discordAdminId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return NextResponse.json({
        error: 'Subdomain must contain only lowercase letters, numbers, and hyphens'
      }, { status: 400 });
    }

    // Check if alliance ID already exists
    const existingTenant = await TenantService.findByAllianceId(parseInt(allianceId));
    if (existingTenant) {
      return NextResponse.json({
        error: `Alliance ID ${allianceId} is already registered`
      }, { status: 400 });
    }

    // Check if subdomain already exists
    const existingSubdomain = await TenantService.findBySubdomain(subdomain);
    if (existingSubdomain) {
      return NextResponse.json({
        error: `Subdomain '${subdomain}' is already taken`
      }, { status: 400 });
    }

    // Create tenant
    const tenant = await TenantService.createTenant({
      allianceId: parseInt(allianceId),
      allianceName,
      subdomain,
      discordAdminId,
      authorizedBy: session.user.discordId,
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.discordId,
        action: 'TENANT_CREATED',
        resource: 'tenant',
        details: {
          allianceId: parseInt(allianceId),
          allianceName,
          subdomain,
          discordAdminId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}