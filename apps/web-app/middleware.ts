import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Extract tenant info from hostname
function getTenantFromHost(hostname: string): { subdomain: string; isValidTenant: boolean; isAdmin: boolean } {
  const parts = hostname.split('.');

  // For development (localhost:3000)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // Check if it's admin.localhost for testing
    if (hostname.startsWith('admin.')) {
      return { subdomain: 'admin', isValidTenant: false, isAdmin: true };
    }
    return {
      subdomain: 'dev-alliance', // Default for local development
      isValidTenant: true,
      isAdmin: false
    };
  }

  // For production orbistech.dev domain
  if (hostname.includes('orbistech.dev') || hostname.includes('.dev')) {
    // Admin subdomain
    if (hostname.startsWith('admin.')) {
      return { subdomain: 'admin', isValidTenant: false, isAdmin: true };
    }

    // Main domain (orbistech.dev) - show landing page
    if (hostname === 'orbistech.dev' || parts.length < 3) {
      return { subdomain: 'main', isValidTenant: false, isAdmin: false };
    }

    // Subdomain (alliance.orbistech.dev)
    if (parts.length >= 3) {
      const subdomain = parts[0];

      // Skip www subdomain
      if (subdomain === 'www') {
        return { subdomain: 'main', isValidTenant: false, isAdmin: false };
      }

      return {
        subdomain,
        isValidTenant: true,
        isAdmin: false
      };
    }
  }

  // For any other domain pattern (subdomain.domain.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Admin subdomain
    if (subdomain === 'admin') {
      return { subdomain: 'admin', isValidTenant: false, isAdmin: true };
    }

    // Skip www subdomain
    if (subdomain === 'www') {
      return { subdomain: 'main', isValidTenant: false, isAdmin: false };
    }

    return {
      subdomain,
      isValidTenant: true,
      isAdmin: false
    };
  }

  return { subdomain: 'main', isValidTenant: false, isAdmin: false };
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { subdomain, isValidTenant, isAdmin } = getTenantFromHost(hostname);
  const { pathname } = request.nextUrl;

  // Handle admin subdomain - rewrite to admin route group
  if (isAdmin) {
    // Skip if already in admin route group
    if (!pathname.startsWith('/admin')) {
      const newUrl = request.nextUrl.clone();
      newUrl.pathname = `/admin${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(newUrl);
    }
    return NextResponse.next();
  }

  // Handle main domain - rewrite to main route group
  if (!isValidTenant && !isAdmin) {
    // Skip if already in main route group
    if (!pathname.startsWith('/main')) {
      const newUrl = request.nextUrl.clone();
      newUrl.pathname = `/main${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(newUrl);
    }
    return NextResponse.next();
  }

  // Handle tenant subdomains - rewrite to tenant route group
  if (isValidTenant) {
    // Clone the request headers and add tenant info
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-subdomain', subdomain);
    requestHeaders.set('x-hostname', hostname);

    // Skip if already in tenant route group
    if (!pathname.startsWith('/tenant')) {
      const newUrl = request.nextUrl.clone();
      newUrl.pathname = `/tenant${pathname === '/' ? '' : pathname}`;

      return NextResponse.rewrite(newUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Get the token to check authentication for tenant routes
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Public routes that don't require authentication (already in /tenant group)
    const publicRoutes = ['/tenant/login', '/api/auth', '/tenant/setup', '/tenant/invite'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // If user is not authenticated and trying to access protected route
    if (!token && !isPublicRoute && !pathname.startsWith('/api/')) {
      const loginUrl = new URL('/tenant/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If user is authenticated but accessing login page, redirect to dashboard
    if (token && pathname === '/tenant/login') {
      return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Default fallback
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$).*)',
  ],
};