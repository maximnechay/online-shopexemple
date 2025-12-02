// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { addSecurityHeaders } from '@/lib/security/headers';
import { verifyCSRFToken } from '@/lib/security/csrf';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Add security headers to all responses
    response = addSecurityHeaders(response);

    // ✅ CSRF Protection
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
    const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks/');
    const isCsrfEndpoint = request.nextUrl.pathname === '/api/csrf-token';

    if (isStateChanging && isApiRoute && !isWebhook && !isCsrfEndpoint) {
        const token = request.headers.get('x-csrf-token');
        const isValid = await verifyCSRFToken(token || '');

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid or missing CSRF token' },
                { status: 403 }
            );
        }
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: any) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protected admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/register')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Protected user routes
    if (request.nextUrl.pathname.startsWith('/profile')) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (let them handle their own auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};