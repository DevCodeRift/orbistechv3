import { Suspense } from 'react';
import { headers } from 'next/headers';
import { TenantService } from '@orbistech/database';
import { LoginForm } from './login-form';

async function getTenant() {
  const headersList = headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  if (!subdomain) {
    return null;
  }

  try {
    return await TenantService.findBySubdomain(subdomain);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

export default async function LoginPage() {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Alliance Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This alliance subdomain is not configured or does not exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tenant.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Alliance Not Active
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This alliance is currently {tenant.status.toLowerCase()}. Please contact your alliance administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-center">
            {/* Alliance logo placeholder */}
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {tenant.allianceName.charAt(0)}
              </span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {tenant.allianceName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Alliance Management Portal
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}