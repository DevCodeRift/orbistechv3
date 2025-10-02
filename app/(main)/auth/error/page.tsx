'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider user in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email provider user in the database.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'Another account with the same email address already exists.';
      case 'EmailSignin':
        return 'Sending the email with the verification token failed.';
      case 'CredentialsSignin':
        return 'Sign in was not successful. Check that the details you provided are correct.';
      case 'SessionRequired':
        return 'You must be signed in to view this page.';
      case 'discord':
        return 'Discord OAuth configuration error. Please check that the Discord application is properly configured with the correct redirect URI.';
      case 'Default':
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-center">
            <div className="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">!</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
          {error && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Error code: {error}
            </p>
          )}
          {error === 'discord' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Possible causes:</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
                <li>Discord application redirect URI not set to: https://www.orbistech.dev/api/auth/callback/discord</li>
                <li>Discord application client ID or secret incorrect</li>
                <li>Discord application not configured for public OAuth</li>
              </ul>
            </div>
          )}
        </div>
        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="block font-medium text-blue-600 hover:text-blue-500"
          >
            Try signing in again
          </Link>
          <Link
            href="/"
            className="block text-sm text-gray-600 hover:text-gray-500"
          >
            Return to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Loading...</h2>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}