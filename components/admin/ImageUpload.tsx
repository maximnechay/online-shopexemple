// components/admin/ImageUpload.tsx
'use client';

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';
import { Upload, X, Loader2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { fetchCSRFToken } from '@/lib/api/client';

interface ImageUploadProps {
    onImageUploaded: (url: string) => void;
    onImageRemoved?: (url: string) => void;
    onImagesReordered?: (urls: string[]) => void;
    existingImages?: string[];
    maxImages?: number;
    className?: string;
    // Новые props для обновления БД при удалении
    productId?: string;
    variantId?: string;
}

interface UploadedImage {
    url: string;
    path: string;
    fileName: string;
}

export default function ImageUpload({
    onImageUploaded,
    onImageRemoved,
    onImagesReordered,
    existingImages = [],
    maxImages = 5,
    className = '',
    productId,
    variantId
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>(existingImages);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Синхронизация с existingImages
    useEffect(() => {
        setImages(existingImages);
    }, [existingImages]);

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
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Ungültiger Dateityp. Nur JPG, PNG und WebP erlaubt.');
            }

            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('Datei zu groß. Maximum 5MB.');
            }

            const formData = new FormData();
            formData.append('file', file);

            const csrfToken = await fetchCSRFToken();

            const response = await fetch('/api/admin/products/upload-image', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken,
                },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload fehlgeschlagen');
            }

            const data: UploadedImage = await response.json();

            setImages(prev => [...prev, data.url]);
            onImageUploaded(data.url);

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
            const urlObj = new URL(url);
            const path = urlObj.pathname.split('/storage/v1/object/public/product-images/')[1];

            if (path) {
                const csrfToken = await fetchCSRFToken();

                // Формируем URL с параметрами для обновления БД
                const params = new URLSearchParams({
                    path: path,
                    imageUrl: url
                });

                // Добавляем productId или variantId если есть
                if (variantId) {
                    params.append('variantId', variantId);
                } else if (productId) {
                    params.append('productId', productId);
                }

                const response = await fetch(
                    `/api/admin/products/upload-image?${params.toString()}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'x-csrf-token': csrfToken,
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Löschen fehlgeschlagen');
                }
            }

            const newImages = images.filter(img => img !== url);
            setImages(newImages);
            onImageRemoved?.(url);

        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message);
        }
    };

    // Перемещение изображения вверх
    const moveImageUp = (index: number) => {
        if (index <= 0) return;
        const newImages = [...images];
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        setImages(newImages);
        onImagesReordered?.(newImages);
    };

    // Перемещение изображения вниз
    const moveImageDown = (index: number) => {
        if (index >= images.length - 1) return;
        const newImages = [...images];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        setImages(newImages);
        onImagesReordered?.(newImages);
    };

    // Drag & Drop для переупорядочивания
    const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        setImages(newImages);
        setDraggedIndex(index);
    };

    const handleImageDragEnd = () => {
        if (draggedIndex !== null) {
            onImagesReordered?.(images);
        }
        setDraggedIndex(null);
    };

    return (
        <div className={className}>
            {/* Uploaded Images Grid */}
            {images.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                            {images.length} von {maxImages} Bildern
                        </p>
                        {images.length > 1 && (
                            <p className="text-xs text-gray-400">
                                Drag & Drop oder Pfeile zum Sortieren
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {images.map((url, index) => (
                            <div
                                key={url}
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, index)}
                                onDragOver={(e) => handleImageDragOver(e, index)}
                                onDragEnd={handleImageDragEnd}
                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move ${index === 0
                                    ? 'border-amber-400 ring-2 ring-amber-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                            >
                                <Image
                                    src={url}
                                    alt={`Product image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />

                                {/* Hauptbild Badge */}
                                {index === 0 && (
                                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                                        Haupt
                                    </div>
                                )}

                                {/* Overlay mit Aktionen */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    {/* Drag Handle */}
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 p-1 bg-white/90 rounded text-gray-600">
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex flex-col gap-1">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveImageUp(index);
                                                }}
                                                className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100 transition"
                                                title="Nach vorne"
                                            >
                                                <ChevronUp className="w-4 h-4 text-gray-700" />
                                            </button>
                                        )}
                                        {index < images.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    moveImageDown(index);
                                                }}
                                                className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100 transition"
                                                title="Nach hinten"
                                            >
                                                <ChevronDown className="w-4 h-4 text-gray-700" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(url);
                                        }}
                                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                        title="Löschen"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Позиция */}
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Area */}
            {canUploadMore && (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${dragActive
                        ? 'border-amber-500 bg-amber-50'
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
                            <Loader2 className="w-10 h-10 mx-auto mb-3 text-amber-500 animate-spin" />
                        ) : (
                            <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                        )}

                        <p className="text-sm font-medium text-gray-900 mb-1">
                            {uploading ? 'Wird hochgeladen...' : 'Bilder hochladen'}
                        </p>

                        <p className="text-xs text-gray-500 mb-3">
                            Drag & Drop oder klicken
                        </p>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Datei auswählen
                        </button>

                        <p className="text-xs text-gray-400 mt-3">
                            JPG, PNG oder WebP • Max. 5MB
                        </p>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
}