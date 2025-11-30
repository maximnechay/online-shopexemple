// app/api/admin/coupons/route.ts
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// GET /api/admin/coupons - Получить все купоны
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseAdminClient();

    // Параметры пагинации
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Получаем купоны
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }

    // Получаем общее количество
    const { count, error: countError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting coupons:', countError);
    }

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Coupons API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Создать купон
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseAdminClient();
    const body = await request.json();

    const {
      code,
      description,
      type,
      amount,
      minOrderAmount,
      maxDiscountAmount,
      maxUses,
      perUserLimit,
      validFrom,
      validUntil,
      isActive,
    } = body;

    // Валидация
    if (!code || !type || amount === undefined) {
      return NextResponse.json(
        { error: 'Code, type, and amount are required' },
        { status: 400 }
      );
    }

    if (!['fixed', 'percentage', 'free_shipping'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid coupon type' },
        { status: 400 }
      );
    }

    // Создаем купон
    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description,
        type,
        amount: parseFloat(amount),
        min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        max_uses: maxUses || null,
        per_user_limit: perUserLimit || null,
        valid_from: validFrom || new Date().toISOString(),
        valid_until: validUntil || null,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Coupon code already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
