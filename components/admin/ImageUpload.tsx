// components/admin/ImageUpload.tsx
'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    onImageUploaded: (url: string) => void;
    onImageRemoved?: (url: string) => void;
    existingImages?: string[];
    maxImages?: number;
    className?: string;
}

interface UploadedImage {
    url: string;
    path: string;
    fileName: string;
}

export default function ImageUpload({
    onImageUploaded,
    onImageRemoved,
    existingImages = [],
    maxImages = 5,
    className = ''
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>(existingImages);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUploadMore = images.length < maxImages;

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (!canUploadMore) {
            setError(`Maximum ${maxImages} Bilder erlaubt`);
            return;
        }

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            await uploadFile(files[0]);
        }
    };

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        if (!canUploadMore) {
            setError(`Maximum ${maxImages} Bilder erlaubt`);
            return;
        }

        const files = e.target.files;
        if (files && files[0]) {
            await uploadFile(files[0]);
        }
    };

    const uploadFile = async (file: File) => {
        setError(null);
        setUploading(true);

        try {
            // Валидация на клиенте
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Ungültiger Dateityp. Nur JPG, PNG und WebP erlaubt.');
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('Datei zu groß. Maximum 5MB.');
            }

            // Создание FormData
            const formData = new FormData();
            formData.append('file', file);

            // Загрузка
            const response = await fetch('/api/admin/products/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload fehlgeschlagen');
            }

            const data: UploadedImage = await response.json();

            // Добавление в список
            setImages(prev => [...prev, data.url]);
            onImageUploaded(data.url);

            // Сброс input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = async (url: string) => {
        try {
            // Извлекаем path из URL
            const urlObj = new URL(url);
            const path = urlObj.pathname.split('/storage/v1/object/public/product-images/')[1];

            if (path) {
                // Удаляем из Storage
                const response = await fetch(
                    `/api/admin/products/upload-image?path=${encodeURIComponent(path)}`,
                    { method: 'DELETE' }
                );

                if (!response.ok) {
                    throw new Error('Löschen fehlgeschlagen');
                }
            }

            // Удаляем из UI
            setImages(prev => prev.filter(img => img !== url));
            onImageRemoved?.(url);

        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message);
        }
    };

    return (
        <div className={className}>
            {/* Upload Area */}
            {canUploadMore && (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleChange}
                        className="hidden"
                        disabled={uploading}
                    />

                    <div className="text-center">
                        {uploading ? (
                            <Loader2 className="w-12 h-12 mx-auto mb-4 text-rose-500 animate-spin" />
                        ) : (
                            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        )}

                        <p className="text-sm font-medium text-gray-900 mb-2">
                            {uploading ? 'Wird hochgeladen...' : 'Bilder hochladen'}
                        </p>

                        <p className="text-xs text-gray-500 mb-4">
                            Drag & Drop oder klicken zum Auswählen
                        </p>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Datei auswählen
                        </button>

                        <p className="text-xs text-gray-400 mt-4">
                            JPG, PNG oder WebP • Max. 5MB • {images.length}/{maxImages} Bilder
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Hochgeladene Bilder ({images.length})
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((url, index) => (
                            <div
                                key={url}
                                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                            >
                                <Image
                                    src={url}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(url)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Bild löschen"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Primary Badge */}
                                {index === 0 && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                                        Hauptbild
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {images.length >= maxImages && (
                        <p className="mt-4 text-sm text-amber-600">
                            ⚠️ Maximum {maxImages} Bilder erreicht
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}