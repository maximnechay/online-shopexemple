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

    // Проверяем авторизацию
    const { data: { user } } = await supabase.auth.getUser();

    // Если пользователь не авторизован и пытается получить доступ к защищенным роутам
    if (!user && request.nextUrl.pathname.startsWith('/profile')) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Если пользователь авторизован и пытается получить доступ к страницам авторизации
    if (user && (
        request.nextUrl.pathname.startsWith('/auth/login') ||
        request.nextUrl.pathname.startsWith('/auth/register')
    )) {
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        '/profile/:path*',
        '/auth/login',
        '/auth/register',
    ],
};
