import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAccess } from './lib/rateLimit';
import { COGNITO_ID_TOKEN_COOKIE } from './lib/cognitoHostedUi';
import {
  ADMIN_BASIC_PASS,
  ADMIN_BASIC_USER,
  MANUAL_BASIC_PASS,
  MANUAL_BASIC_USER,
  isBasicAuthValid,
} from './lib/basicAuth';

const FORCE_HOME_MAINTENANCE = false;

const decodeLocaleFromToken = (token: string | undefined): string | null => {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      [key: string]: unknown;
    };
    const locale = payload['custom:locale'];
    if (typeof locale !== 'string') return null;

    const normalized = locale.trim().toLowerCase();
    return normalized || null;
  } catch (error) {
    console.error('Failed to decode ID token payload', error);
    return null;
  }
};

const requireBasicAuth = (
  authHeader: string | null,
  expectedUser: string,
  expectedPass: string
): NextResponse | null => {
  if (!authHeader) {
    return new NextResponse('Auth Required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
    });
  }

  const isValid = isBasicAuthValid(authHeader, expectedUser, expectedPass);
  if (!isValid) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
    });
  }

  return null;
};

export async function middleware(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || '0.0.0.0';
  if (checkAccess(Array.isArray(ip) ? ip[0] : ip)) {
    return NextResponse.redirect(new URL('/wait', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    const authResult = requireBasicAuth(
      req.headers.get('authorization'),
      ADMIN_BASIC_USER,
      ADMIN_BASIC_PASS
    );
    if (authResult) {
      return authResult;
    }
  }

  if (req.nextUrl.pathname.startsWith('/manual_for_system')) {
    const authResult = requireBasicAuth(
      req.headers.get('authorization'),
      MANUAL_BASIC_USER,
      MANUAL_BASIC_PASS
    );
    if (authResult) {
      return authResult;
    }
  }

  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/_next') || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  const isAdminDashboardPath =
    pathname === '/admin/dashboard' || pathname.startsWith('/admin/dashboard/');

  let isMaintenanceMode = false;
  try {
    const response = await fetch(new URL('/api/maintenance', req.url), {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = (await response.json()) as { enabled?: boolean };
      isMaintenanceMode = Boolean(data.enabled);
    }
  } catch (error) {
    console.error('Failed to check maintenance status', error);
  }

  if (
    isMaintenanceMode &&
    pathname !== '/maintenance' &&
    pathname !== '/en/maintenance' &&
    !isAdminDashboardPath
  ) {
    const maintenancePath = pathname.startsWith('/en')
      ? '/en/maintenance'
      : '/maintenance';
    return NextResponse.redirect(new URL(maintenancePath, req.url));
  }

  const isHomePath = pathname === '/' || pathname === '/en';
  if (
    FORCE_HOME_MAINTENANCE &&
    isHomePath
  ) {
    const maintenancePath = pathname.startsWith('/en')
      ? '/en/maintenance'
      : '/maintenance';
    return NextResponse.redirect(new URL(maintenancePath, req.url));
  }

  const idToken = req.cookies.get(COGNITO_ID_TOKEN_COOKIE)?.value;
  const userLocale = decodeLocaleFromToken(idToken);

  if (userLocale === 'en' && !pathname.startsWith('/en')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|wait).*)'],
};
