import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { createAuthOptions, validateTenantAccess } from '@orbistech/auth';
import { TenantService } from '@orbistech/database';
import { SetupForm } from './setup-form';

async function getTenantAndValidateAccess() {
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
    return { error: 'Tenant not found' };
  }

  // Check if user is the alliance admin
  if (session.user.discordId !== tenant.discordAdminId) {
    return { error: 'Only the alliance administrator can access this page' };
  }

  return { tenant, session };
}

export default async function SetupPage() {
  const result = await getTenantAndValidateAccess();

  if ('error' in result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {result.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { tenant } = result;

  // If API key is already set, redirect to dashboard
  if (tenant.apiKeyEncrypted) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">
                {tenant.allianceName.charAt(0)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Alliance Setup
            </h1>
            <p className="mt-2 text-gray-600">
              {tenant.allianceName} - Alliance ID: {tenant.allianceId}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  API Key Required
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    To access Politics and War data for your alliance, you need to provide your API key.
                    You can find your API key at{' '}
                    <a
                      href="https://politicsandwar.com/account/#7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      https://politicsandwar.com/account/#7
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SetupForm tenant={tenant} />
        </div>
      </div>
    </div>
  );
}