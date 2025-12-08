// app/api/admin/attributes/values/[id]/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkAdmin } from '@/lib/auth/admin-check';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size: 2MB' },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
                { status: 400 }
            );
        }

        // Get attribute value to check it exists
        const { data: attrValue, error: valueError } = await supabaseAdmin
            .from('attribute_values')
            .select('id, slug')
            .eq('id', id)
            .single();

        if (valueError || !attrValue) {
            return NextResponse.json(
                { error: 'Attribute value not found' },
                { status: 404 }
            );
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${attrValue.slug}-${Date.now()}.${fileExt}`;
        const filePath = `attribute-values/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('products')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload image' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('products')
            .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        // Update attribute_value with image URL
        const { error: updateError } = await supabaseAdmin
            .from('attribute_values')
            .update({ image_url: imageUrl })
            .eq('id', id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update attribute value' },
                { status: 500 }
            );
        }

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error('Error uploading attribute value image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Remove image from attribute value
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }

    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }

    try {
        const { id } = await params;

        // Get current image URL
        const { data: attrValue } = await supabaseAdmin
            .from('attribute_values')
            .select('image_url')
            .eq('id', id)
            .single();

        // Remove from database
        const { error: updateError } = await supabaseAdmin
            .from('attribute_values')
            .update({ image_url: null })
            .eq('id', id);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to remove image' },
                { status: 500 }
            );
        }

        // Try to delete from storage if image exists
        if (attrValue?.image_url) {
            const path = attrValue.image_url.split('/products/')[1];
            if (path) {
                await supabaseAdmin.storage.from('products').remove([path]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting attribute value image:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}