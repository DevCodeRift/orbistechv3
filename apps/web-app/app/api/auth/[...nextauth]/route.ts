import NextAuth from 'next-auth';
import { createAuthOptions } from '@orbistech/auth';
import { headers } from 'next/headers';

// Get tenant subdomain from headers
function getTenantSubdomain(): string | undefined {
  const headersList = headers();
  return headersList.get('x-tenant-subdomain') || undefined;
}

// Create auth options based on current request context
export function getAuthOptions() {
  const tenantSubdomain = getTenantSubdomain();
  return createAuthOptions({
    tenantSubdomain,
  });
}

// Export a default auth options for when tenant context is not available
export const authOptions = createAuthOptions({});

const handler = async (req: Request, context: any) => {
  const dynamicAuthOptions = getAuthOptions();
  return NextAuth(req, context, dynamicAuthOptions);
};

export { handler as GET, handler as POST };