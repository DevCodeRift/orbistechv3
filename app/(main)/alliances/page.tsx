import Link from 'next/link';
import { TenantService } from '@orbistech/database';

export default async function AlliancesPage() {
  const alliances = await TenantService.findAll();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Alliance Management Portals
          </h1>
          <p className="text-lg text-gray-600">
            Access your alliance dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alliances
            .filter(alliance => alliance.status === 'ACTIVE')
            .map((alliance) => (
              <div
                key={alliance.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {alliance.allianceName}
                </h2>
                <p className="text-gray-600 mb-4">
                  Alliance ID: {alliance.allianceId}
                </p>

                <div className="space-y-3">
                  <Link
                    href={`/alliance/${alliance.subdomain}`}
                    className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Access Dashboard
                  </Link>

                  <Link
                    href={`/alliance/${alliance.subdomain}/login`}
                    className="block w-full text-center bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                  >
                    Login
                  </Link>

                  <Link
                    href={`/alliance/${alliance.subdomain}/setup`}
                    className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                  >
                    Setup
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Subdomain Access:
                  </p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {alliance.subdomain}.orbistech.dev
                  </code>
                </div>
              </div>
            ))}
        </div>

        {alliances.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No active alliances found.</p>
            <Link
              href="/admin"
              className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Admin Panel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}