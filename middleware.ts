// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll().map((cookie) => ({
                        name: cookie.name,
                        value: cookie.value,
                    }));
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const pathname = request.nextUrl.pathname;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage =
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/register');

    const isProfileRoute = pathname.startsWith('/profile');

    const isAdminRoute =
        pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

    // 1) Админ-зона
    if (isAdminRoute) {
        // нет юзера — на логин
        if (!user) {
            const redirectUrl = new URL('/auth/login', request.url);
            redirectUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // есть юзер — проверяем роль
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error loading profile in middleware:', error);
            return new NextResponse('Access denied', { status: 403 });
        }

        if (!profile || profile.role !== 'admin') {
            return new NextResponse('Access denied', { status: 403 });
        }

        // admin пропускаем дальше
        return response;
    }

    // 2) Защита /profile
    if (!user && isProfileRoute) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 3) Если пользователь уже залогинен и идёт на /auth/*
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/profile/:path*',
        '/auth/login',
        '/auth/register',
        '/admin/:path*',
        '/api/admin/:path*',
    ],
};
