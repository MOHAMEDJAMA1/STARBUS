import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const role = request.cookies.get('user_role')?.value;
    const path = request.nextUrl.pathname;

    // 1. Redirect if root path
    if (path === '/') {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // 2. Public paths
    if (path.startsWith('/sign-in') || path.startsWith('/_next') || path.startsWith('/static')) {
        return NextResponse.next();
    }

    // 3. Protected Routes Check
    if (!role) {
        // No role found, redirect to sign-in
        return NextResponse.redirect(new URL(`/sign-in?redirect=${path}`, request.url));
    }

    // Check for mandatory password change
    const mustChangePassword = request.cookies.get('must_change_password')?.value;
    if (mustChangePassword === 'true' && !path.startsWith('/change-password')) {
        return NextResponse.redirect(new URL('/change-password', request.url));
    }

    // Owner Routes
    if (path.startsWith('/owner')) {
        if (role !== 'owner') {
            // If not owner, redirect to their dashboard
            if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
            if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
            if (role === 'student') return NextResponse.redirect(new URL('/student', request.url));
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }
        return NextResponse.next();
    }

    // 4. Role-based Access Control
    if (path.startsWith('/admin') && role !== 'admin') {
        // If trying to access admin but not admin, redirect to their dashboard
        if (role === 'owner') return NextResponse.redirect(new URL('/owner', request.url));
        if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
        if (role === 'student') return NextResponse.redirect(new URL('/student', request.url));
    }

    if (path.startsWith('/teacher') && role !== 'teacher') {
        if (role === 'owner' || role === 'admin') return NextResponse.next(); // Owner/Admin can view teacher pages
        if (role === 'student') return NextResponse.redirect(new URL('/student', request.url));
    }

    if (path.startsWith('/student') && role !== 'student') {
        if (role === 'owner' || role === 'admin') return NextResponse.next(); // Owner/Admin can view student pages
        if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
    }

    const response = NextResponse.next();

    // Security Headers: Prevent caching of protected pages
    if (role) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
