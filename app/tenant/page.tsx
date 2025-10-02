import { redirect } from 'next/navigation';

export default function TenantRootPage() {
  // Redirect tenant root to login page
  redirect('/tenant/login');
}