import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '../../../../lib/auth';
import { validateTenantAccess } from '@orbistech/auth';
import { prisma, TenantService } from '@orbistech/database';
import { encryptApiKey } from '@orbistech/encryption';

// Validate P&W API key by making a test request
async function validatePnwApiKey(apiKey: string): Promise<{ valid: boolean; error?: string; allianceId?: number }> {
  try {
    const response = await fetch(`https://api.politicsandwar.com/graphql?api_key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              alliance_id
              alliance {
                id
                name
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      return { valid: false, error: 'API request failed' };
    }

    const data = await response.json();

    if (data.errors) {
      return { valid: false, error: data.errors[0]?.message || 'API key validation failed' };
    }

    if (!data.data?.me) {
      return { valid: false, error: 'Invalid API key or no user data returned' };
    }

    return {
      valid: true,
      allianceId: data.data.me.alliance_id
    };
  } catch (error) {
    return { valid: false, error: 'Failed to validate API key' };
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
      return NextResponse.json({ error: 'Only the alliance administrator can set the API key' }, { status: 403 });
    }

    // Get API key from request body
    const { apiKey } = await request.json();
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Validate the API key with P&W API
    const validation = await validatePnwApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if API key belongs to the correct alliance
    if (validation.allianceId && validation.allianceId !== tenant.allianceId) {
      return NextResponse.json({
        error: `API key belongs to alliance ID ${validation.allianceId}, but this tenant is for alliance ID ${tenant.allianceId}`
      }, { status: 400 });
    }

    // Encrypt and save the API key
    const encryptedApiKey = await encryptApiKey(apiKey);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        apiKeyEncrypted: encryptedApiKey,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.discordId,
        action: 'API_KEY_SET',
        resource: 'tenant',
        details: {
          allianceId: tenant.allianceId,
          validatedAllianceId: validation.allianceId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'API key saved successfully' });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}