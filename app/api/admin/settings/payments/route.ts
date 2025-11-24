// app/api/admin/settings/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching payment settings:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            settings: data,
        });
    } catch (error) {
        console.error('Error in GET /api/admin/settings/payments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { mode, currency, vat_rate, stripe_enabled, paypal_enabled } = body;

        // Validation
        if (mode && !['test', 'live'].includes(mode)) {
            return NextResponse.json(
                { error: 'Invalid mode. Must be "test" or "live"' },
                { status: 400 }
            );
        }

        if (vat_rate !== undefined && (isNaN(vat_rate) || vat_rate < 0 || vat_rate > 100)) {
            return NextResponse.json(
                { error: 'Invalid VAT rate. Must be between 0 and 100' },
                { status: 400 }
            );
        }

        // Update settings
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (mode !== undefined) updateData.mode = mode;
        if (currency !== undefined) updateData.currency = currency;
        if (vat_rate !== undefined) updateData.vat_rate = vat_rate;
        if (stripe_enabled !== undefined) updateData.stripe_enabled = stripe_enabled;
        if (paypal_enabled !== undefined) updateData.paypal_enabled = paypal_enabled;

        const { data, error } = await supabaseAdmin
            .from('payment_settings')
            .update(updateData)
            .eq('id', 1)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment settings:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            settings: data,
        });
    } catch (error) {
        console.error('Error in PUT /api/admin/settings/payments:', error);
        return NextResponse.json(
            { error: 'Failed to update payment settings' },
            { status: 500 }
        );
    }
}
