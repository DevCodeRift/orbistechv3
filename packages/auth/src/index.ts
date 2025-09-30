import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { TenantService, UserService, prisma } from '@orbistech/database';

export interface AuthConfig {
  tenantSubdomain?: string;
}

export function createAuthOptions(config: AuthConfig = {}): NextAuthOptions {
  return {
    providers: [
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: 'identify email guilds',
          },
        },
      }),
    ],
    callbacks: {
      async signIn({ user, account, profile }) {
        if (account?.provider === 'discord' && profile) {
          try {
            // Find tenant if subdomain is provided
            let tenant = null;
            if (config.tenantSubdomain) {
              tenant = await TenantService.findBySubdomain(config.tenantSubdomain);
            }

            // Create or update user
            await UserService.createOrUpdateUser({
              discordId: profile.id as string,
              username: profile.username as string,
              avatar: profile.avatar as string,
              email: profile.email as string,
              tenantId: tenant?.id,
            });

            return true;
          } catch (error) {
            console.error('Error during sign in:', error);
            return false;
          }
        }
        return false;
      },
      async jwt({ token, account, profile }) {
        if (account?.provider === 'discord' && profile) {
          const user = await UserService.findByDiscordId(profile.id as string);
          if (user) {
            token.discordId = user.discordId;
            token.role = user.role;
            token.tenantId = user.tenantId;
            token.tenant = user.tenant;
          }
        }
        return token;
      },
      async session({ session, token }) {
        return {
          ...session,
          user: {
            ...session.user,
            discordId: token.discordId as string,
            role: token.role as string,
            tenantId: token.tenantId as string,
            tenant: token.tenant as any,
          },
        };
      },
      async redirect({ url, baseUrl }) {
        // Handle subdomain redirects
        if (config.tenantSubdomain) {
          const tenantUrl = url.includes('localhost')
            ? 'http://localhost:3001'
            : `https://${config.tenantSubdomain}.domain.com`;

          if (url.startsWith('/')) {
            return `${tenantUrl}${url}`;
          }
          if (url.startsWith(tenantUrl)) {
            return url;
          }
          return `${tenantUrl}/dashboard`;
        }

        return url.startsWith('/') ? `${baseUrl}${url}` : baseUrl;
      },
    },
    pages: {
      signIn: '/login',
      error: '/auth/error',
    },
    session: {
      strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

// Middleware helper to check tenant access
export async function validateTenantAccess(
  discordId: string,
  tenantSubdomain: string
): Promise<{ hasAccess: boolean; user?: any; tenant?: any; reason?: string }> {
  try {
    // Find user and tenant
    const [user, tenant] = await Promise.all([
      UserService.findByDiscordId(discordId),
      TenantService.findBySubdomain(tenantSubdomain),
    ]);

    if (!tenant) {
      return { hasAccess: false, reason: 'Tenant not found' };
    }

    if (!user) {
      return { hasAccess: false, reason: 'User not found' };
    }

    // Check if user is the alliance admin
    if (user.discordId === tenant.discordAdminId) {
      return { hasAccess: true, user, tenant };
    }

    // Check if user belongs to this tenant
    if (user.tenantId === tenant.id) {
      return { hasAccess: true, user, tenant };
    }

    // Check if user has a pending invitation
    const invitation = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId: tenant.id,
        discordId: user.discordId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (invitation) {
      return { hasAccess: true, user, tenant };
    }

    return { hasAccess: false, reason: 'No access to this alliance' };
  } catch (error) {
    console.error('Error validating tenant access:', error);
    return { hasAccess: false, reason: 'Internal error' };
  }
}

// Role checking utilities
export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    SUPER_ADMIN: 4,
    ALLIANCE_ADMIN: 3,
    OFFICER: 2,
    MEMBER: 1,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

export function canManageAlliance(userRole: string): boolean {
  return hasRole(userRole, 'ALLIANCE_ADMIN');
}

export function canManageMembers(userRole: string): boolean {
  return hasRole(userRole, 'OFFICER');
}

// Export types
export type { NextAuthOptions } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId: string;
      role: string;
      tenantId?: string | null;
      tenant?: any;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discordId?: string;
    role?: string;
    tenantId?: string | null;
    tenant?: any;
  }
}