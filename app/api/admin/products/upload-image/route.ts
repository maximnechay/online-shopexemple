// app/api/admin/products/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { nanoid } from 'nanoid';

// Конфигурация
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'product-images';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen' },
            {
                status: 429,
                headers: { 'Retry-After': rateLimitResult.retryAfter.toString() }
            }
        );
    }

    try {
        // Получаем authenticated user через cookies
        const authSupabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await authSupabase.auth.getUser();

        if (authError || !user) {
            console.error('❌ Authentication error:', authError);
            return NextResponse.json(
                { error: 'Nicht authentifiziert' },
                { status: 401 }
            );
        }

        console.log('✅ Authenticated user:', user.id, user.email);

        // Используем admin client для проверки роли и Storage операций
        const supabase = createServerSupabaseAdminClient();

        // Проверка роли admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile fetch error:', profileError);
            return NextResponse.json(
                { error: 'Fehler beim Laden des Profils' },
                { status: 500 }
            );
        }

        if (profile?.role !== 'admin') {
            console.error('❌ User is not admin. Role:', profile?.role);
            return NextResponse.json(
                { error: 'Keine Berechtigung' },
                { status: 403 }
            );
        }

        console.log('✅ User is admin');

        // Получение файла из FormData
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'Keine Datei hochgeladen' },
                { status: 400 }
            );
        }

        console.log('📁 File received:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)} KB`
        });

        // Валидация типа файла
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Ungültiger Dateityp. Erlaubt: ${ALLOWED_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Валидация размера файла
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Генерация уникального имени файла
        const fileExt = file.name.split('.').pop();
        const fileName = `${nanoid()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        console.log('📤 Uploading to:', filePath);

        // Конвертация File в ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Загрузка в Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Fehler beim Hochladen des Bildes', details: uploadError.message },
                { status: 500 }
            );
        }

        // Получение публичного URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log('✅ Image uploaded successfully:', publicUrl);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: filePath,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('❌ Unexpected error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler', details: error.message },
            { status: 500 }
        );
    }
}

// Удаление изображения
export async function DELETE(request: NextRequest) {
    const rateLimitResult = rateLimit(request, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Zu viele Anfragen' },
            { status: 429 }
        );
    }

    try {
        // Получаем authenticated user
        const authSupabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await authSupabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Nicht authentifiziert' },
                { status: 401 }
            );
        }

        const supabase = createServerSupabaseAdminClient();

        // Проверка роли
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Keine Berechtigung' },
                { status: 403 }
            );
        }

        // Получение пути к файлу
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');

        if (!filePath) {
            return NextResponse.json(
                { error: 'Dateipfad erforderlich' },
                { status: 400 }
            );
        }

        console.log('🗑️ Deleting:', filePath);

        // Удаление из Storage
        const { error: deleteError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (deleteError) {
            console.error('❌ Delete error:', deleteError);
            return NextResponse.json(
                { error: 'Fehler beim Löschen des Bildes', details: deleteError.message },
                { status: 500 }
            );
        }

        console.log('✅ Image deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Bild erfolgreich gelöscht'
        });

    } catch (error: any) {
        console.error('❌ Unexpected error:', error);
        return NextResponse.json(
            { error: 'Interner Serverfehler', details: error.message },
            { status: 500 }
        );
    }
}