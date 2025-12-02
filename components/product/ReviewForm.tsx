// components/product/ReviewForm.tsx
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { apiPost } from '@/lib/api/client';

interface ReviewFormProps {
    productId: string;
    productName: string;
    orderId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ReviewForm({
    productId,
    productName,
    orderId,
    onSuccess,
    onCancel
}: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Bitte wählen Sie eine Bewertung');
            return;
        }

        setSubmitting(true);

        try {
            await apiPost('/api/reviews', {
                product_id: productId,
                order_id: orderId,
                rating,
                title: title.trim() || null,
                comment: comment.trim() || null,
            });

            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">
                    Bewertung für {productName}
                </h3>
            </div>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bewertung *
                </label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                    }`}
                            />
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                            {rating} von 5 Sternen
                        </span>
                    )}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Überschrift (optional)
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Zusammenfassung Ihrer Bewertung"
                    maxLength={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ihre Bewertung (optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Was hat Ihnen gefallen oder nicht gefallen?"
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
                <div className="text-sm text-gray-500 mt-1">
                    {comment.length}/1000 Zeichen
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Wird gesendet...' : 'Bewertung absenden'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Abbrechen
                </button>
            </div>

            <p className="text-sm text-gray-600">
                * Ihre Bewertung wird vor der Veröffentlichung überprüft
            </p>
        </form>
    );
}
