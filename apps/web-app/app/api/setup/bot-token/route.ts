import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '../../auth-utils';
import { prisma, TenantService } from '@orbistech/database';
import { encryptBotToken } from '@orbistech/encryption';

// Validate Discord bot token
async function validateDiscordBotToken(botToken: string): Promise<{ valid: boolean; error?: string; botInfo?: any }> {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { valid: false, error: 'Invalid bot token' };
      }
      return { valid: false, error: 'Failed to validate bot token' };
    }

    const botInfo = await response.json();

    if (!botInfo.bot) {
      return { valid: false, error: 'Token does not belong to a bot account' };
    }

    return {
      valid: true,
      botInfo: {
        id: botInfo.id,
        username: botInfo.username,
        discriminator: botInfo.discriminator,
      }
    };
  } catch (error) {
    return { valid: false, error: 'Failed to validate bot token' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get tenant subdomain from headers
    const subdomain = request.headers.get('x-tenant-subdomain');
    if (!subdomain) {
      return NextResponse.json({ error: 'No tenant subdomain found' }, { status: 400 });
    }

    // Get session
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant and validate access
    const tenant = await TenantService.findBySubdomain(subdomain);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user is the alliance admin
    if (session.user.discordId !== tenant.discordAdminId) {
      return NextResponse.json({ error: 'Only the alliance administrator can set the bot token' }, { status: 403 });
    }

    // Get bot token from request body
    const { botToken } = await request.json();
    if (!botToken || typeof botToken !== 'string') {
      return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
    }

    // Validate the bot token with Discord API
    const validation = await validateDiscordBotToken(botToken);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Encrypt and save the bot token
    const encryptedBotToken = await encryptBotToken(botToken);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        discordBotTokenEncrypted: encryptedBotToken,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.discordId,
        action: 'BOT_TOKEN_SET',
        resource: 'tenant',
        details: {
          botId: validation.botInfo?.id,
          botUsername: validation.botInfo?.username,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bot token saved successfully',
      botInfo: validation.botInfo
    });
  } catch (error) {
    console.error('Error saving bot token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}