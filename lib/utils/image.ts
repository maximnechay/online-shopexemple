// lib/utils/image.ts

/**
 * Получить оптимизированный URL изображения из Supabase Storage
 * Supabase поддерживает image transformations через URL параметры
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}
): string {
    if (!url) return '';

    // Если это не Supabase URL, возвращаем как есть
    if (!url.includes('supabase')) {
        return url;
    }

    const { width, height, quality = 80, format } = options;

    // Supabase Storage image transformations
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    const params = new URLSearchParams();

    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (quality) params.append('quality', quality.toString());
    if (format) params.append('format', format);

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
}

/**
 * Получить thumbnail URL (маленькое превью)
 */
export function getThumbnailUrl(url: string): string {
    return getOptimizedImageUrl(url, {
        width: 200,
        height: 200,
        quality: 70,
        format: 'webp',
    });
}

/**
 * Получить medium size URL (карточки продуктов)
 */
export function getMediumImageUrl(url: string): string {
    return getOptimizedImageUrl(url, {
        width: 400,
        height: 400,
        quality: 80,
        format: 'webp',
    });
}

/**
 * Получить large size URL (страница продукта)
 */
export function getLargeImageUrl(url: string): string {
    return getOptimizedImageUrl(url, {
        width: 800,
        height: 800,
        quality: 85,
        format: 'webp',
    });
}

/**
 * Валидация изображения на клиенте
 */
export function validateImage(file: File): {
    valid: boolean;
    error?: string;
} {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Ungültiger Dateityp. Nur JPG, PNG und WebP sind erlaubt.',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Datei zu groß. Maximum: ${maxSize / 1024 / 1024}MB`,
        };
    }

    return { valid: true };
}

/**
 * Конвертация File в Base64 (для preview)
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Сжатие изображения на клиенте перед загрузкой
 * Требует browser-image-compression library
 */
export async function compressImage(
    file: File,
    options: {
        maxSizeMB?: number;
        maxWidthOrHeight?: number;
        useWebWorker?: boolean;
    } = {}
): Promise<File> {
    // Динамический импорт для уменьшения bundle size
    const imageCompression = (await import('browser-image-compression')).default;

    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...options,
    };

    try {
        const compressedFile = await imageCompression(file, defaultOptions);
        console.log('Compressed:', {
            original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        });
        return compressedFile;
    } catch (error) {
        console.error('Compression failed:', error);
        return file; // Возвращаем оригинал если не удалось сжать
    }
}

/**
 * Извлечь путь к файлу из Supabase URL
 */
export function extractPathFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Сортировка изображений (первое - главное)
 */
export function sortImages(images: string[], mainImageUrl: string): string[] {
    const sorted = [...images];
    const mainIndex = sorted.indexOf(mainImageUrl);

    if (mainIndex > 0) {
        sorted.splice(mainIndex, 1);
        sorted.unshift(mainImageUrl);
    }

    return sorted;
}

/**
 * Placeholder для загрузки изображений (blur data URL)
 */
export const IMAGE_PLACEHOLDER =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhOWE5YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxhZGVuLi4uPC90ZXh0Pgo8L3N2Zz4=';

/**
 * Fallback изображение если загрузка не удалась
 */
export const FALLBACK_IMAGE = '/images/placeholder-product.png';