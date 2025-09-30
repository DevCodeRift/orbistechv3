import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { createAuthOptions } from '@orbistech/auth';
import { TenantService } from '@orbistech/database';
import { DashboardContent } from './dashboard-content';

async function getTenantAndSession() {
  const headersList = headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  if (!subdomain) {
    return { error: 'No subdomain found' };
  }

  const authOptions = createAuthOptions({ tenantSubdomain: subdomain });
  const session = await getServerSession(authOptions);

  if (!session?.user?.discordId) {
    redirect('/tenant/login');
  }

  const tenant = await TenantService.findBySubdomain(subdomain);
  if (!tenant) {
    return { error: 'Alliance not found' };
  }

  // If API key is not set and user is admin, redirect to setup
  if (!tenant.apiKeyEncrypted && session.user.discordId === tenant.discordAdminId) {
    redirect('/setup');
  }

  // Check if user has access to this tenant
  const hasAccess =
    session.user.discordId === tenant.discordAdminId ||
    session.user.tenantId === tenant.id;

  if (!hasAccess) {
    return { error: 'You do not have access to this alliance' };
  }

  return { tenant, session };
}

export default async function DashboardPage() {
  const result = await getTenantAndSession();

  if ('error' in result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {result.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { tenant, session } = result;

  return <DashboardContent tenant={tenant} session={session} />;
}