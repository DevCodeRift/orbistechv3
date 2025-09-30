import { redirect } from 'next/navigation';

// This is a fallback root page that should rarely be hit
// The middleware should rewrite requests to appropriate route groups
export default function RootPage() {
  // If we reach here, redirect to main
  redirect('/main');
}