// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews?product_id=xxx&user_id=xxx
 * Получить отзывы для продукта
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');
        const userId = searchParams.get('user_id');

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            );
        }

        // Получаем одобренные отзывы для всех
        let query = supabaseAdmin
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        const { data: approvedReviews, error: approvedError } = await query;

        if (approvedError) {
            console.error('❌ Error fetching reviews:', approvedError);
            return NextResponse.json(
                { error: 'Failed to fetch reviews' },
                { status: 500 }
            );
        }

        let reviews = approvedReviews || [];

        // Если передан user_id, добавляем его pending отзывы
        if (userId) {
            const { data: userPendingReviews } = await supabaseAdmin
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (userPendingReviews && userPendingReviews.length > 0) {
                reviews = [...userPendingReviews, ...reviews];
            }
        }

        return NextResponse.json({ reviews });
    } catch (error: any) {
        console.error('❌ Reviews API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/reviews
 * Создать новый отзыв
 */
export async function POST(request: NextRequest) {
    try {
        // Создаем Supabase клиент с cookies для аутентификации
        const cookieStore = cookies();
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

        // Проверяем аутентификацию
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { product_id, rating, title, comment, order_id } = body;

        // Валидация
        if (!product_id || !rating) {
            return NextResponse.json(
                { error: 'Product ID and rating are required' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // Проверяем, купил ли пользователь этот продукт
        let verifiedPurchase = false;
        if (order_id) {
            const { data: orderItem } = await supabaseAdmin
                .from('order_items')
                .select('id, order:orders!inner(user_id, payment_status)')
                .eq('product_id', product_id)
                .eq('order_id', order_id)
                .single();

            if (orderItem && orderItem.order) {
                const order = orderItem.order as any;
                if (order.user_id === user.id && order.payment_status === 'completed') {
                    verifiedPurchase = true;
                }
            }
        }

        // Получаем данные пользователя
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        console.log('👤 Profile data:', { profile, profileError, userId: user.id });

        // GDPR: показываем только имя и первую букву фамилии (Max M.)
        let customerName = 'Anonym';
        if (profile?.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            if (nameParts.length > 1) {
                const firstName = nameParts[0];
                const lastInitial = nameParts[nameParts.length - 1].charAt(0);
                customerName = `${firstName} ${lastInitial}.`;
            } else if (nameParts.length === 1) {
                customerName = nameParts[0]; // Только имя
            }
        }

        console.log('📝 Customer name:', customerName);

        // Создаём отзыв
        const { data: review, error: insertError } = await supabaseAdmin
            .from('reviews')
            .insert({
                product_id,
                user_id: user.id,
                order_id: order_id || null,
                rating,
                title: title || null,
                comment: comment || null,
                customer_name: customerName,
                customer_email: user.email,
                verified_purchase: verifiedPurchase,
                status: 'pending', // Модерация
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ Error creating review:', insertError);
            return NextResponse.json(
                { error: 'Failed to create review' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            review,
            message: 'Bewertung wurde zur Prüfung eingereicht'
        }, { status: 201 });
    } catch (error: any) {
        console.error('❌ Create review error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
