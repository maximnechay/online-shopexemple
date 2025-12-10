// lib/auth/admin-check.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function checkAdmin(request: NextRequest) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json(
            { error: 'Unauthorized. Please log in.' },
            { status: 401 }
        );
    }

    // Проверяем роль админа в профиле
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error('❌ Error fetching profile:', profileError);
        return NextResponse.json(
            { error: 'Profile not found' },
            { status: 404 }
        );
    }

    if (profile.role !== 'admin') {
        return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
        );
    }

    // Возвращаем данные пользователя и профиля
    return { user, profile };
}
