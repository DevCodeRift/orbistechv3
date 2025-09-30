import NextAuth from 'next-auth';
import { createAuthOptions } from '@orbistech/auth';
import { headers } from 'next/headers';

// Get tenant subdomain from headers
function getTenantSubdomain(): string | undefined {
  const headersList = headers();
  return headersList.get('x-tenant-subdomain') || undefined;
}

const handler = async (req: Request, context: any) => {
  const tenantSubdomain = getTenantSubdomain();

  const authOptions = createAuthOptions({
    tenantSubdomain,
  });

  return NextAuth(req, context, authOptions);
};

export { handler as GET, handler as POST };