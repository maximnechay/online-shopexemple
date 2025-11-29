// app/api/admin/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/reviews/[id]
 * Обновить статус отзыва (approve/reject)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { status } = body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const { data: review, error } = await supabaseAdmin
            .from('reviews')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating review:', error);
            return NextResponse.json(
                { error: 'Failed to update review' },
                { status: 500 }
            );
        }

        console.log('✅ Review updated:', { id, status, review });

        return NextResponse.json({ review });
    } catch (error: any) {
        console.error('❌ Update review error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Удалить отзыв
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { error } = await supabaseAdmin
            .from('reviews')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Error deleting review:', error);
            return NextResponse.json(
                { error: 'Failed to delete review' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('❌ Delete review error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
