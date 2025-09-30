import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { UserService } from '@orbistech/database';
import { authOptions } from '../../lib/auth';
import { AdminDashboard } from './components/admin-dashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.discordId) {
    redirect('/admin/login');
  }

  // Check if user is super admin
  const user = await UserService.findByDiscordId(session.user.discordId);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You do not have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard user={user} session={session} />;
}