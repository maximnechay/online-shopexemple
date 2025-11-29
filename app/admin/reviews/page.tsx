// app/admin/reviews/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Check, X, Eye, Filter, RefreshCw } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    customer_name: string;
    customer_email: string | null;
    verified_purchase: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    product: {
        id: string;
        name: string;
        images: string[];
    } | {
        id: string;
        name: string;
        images: string[];
    }[];
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadReviews();
        loadStats();
    }, [filter]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const url = `/api/admin/reviews?status=${filter}&t=${Date.now()}`;
            console.log('📡 Loading reviews:', url);

            const res = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
            if (res.ok) {
                const data = await res.json();
                console.log('✅ Loaded reviews:', data.reviews?.length, 'Status filter:', filter);
                console.log('📊 Reviews data:', data.reviews);
                setReviews(data.reviews || []);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await fetch(`/api/admin/reviews?status=all&t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            });
            if (res.ok) {
                const data = await res.json();
                const allReviews = data.reviews || [];
                setStats({
                    total: allReviews.length,
                    pending: allReviews.filter((r: Review) => r.status === 'pending').length,
                    approved: allReviews.filter((r: Review) => r.status === 'approved').length,
                    rejected: allReviews.filter((r: Review) => r.status === 'rejected').length,
                });
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
        try {
            console.log('🔄 Updating review:', reviewId, 'to status:', status);

            const res = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log('✅ Review updated:', data.review);

                // Обновляем локальное состояние мгновенно
                setReviews(prevReviews =>
                    prevReviews.map(r =>
                        r.id === reviewId ? { ...r, status } : r
                    ).filter(r => {
                        // Если выбран конкретный фильтр, убираем отзыв из списка
                        if (filter === 'all') return true;
                        return r.status === filter;
                    })
                );

                // Обновляем статистику
                loadStats();
            } else {
                console.error('❌ Failed to update review:', await res.text());
            }
        } catch (error) {
            console.error('Error updating review:', error);
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!confirm('Möchten Sie diese Bewertung wirklich löschen?')) return;

        try {
            const res = await fetch(`/api/admin/reviews/${reviewId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Мгновенно удаляем из списка
                setReviews(prevReviews => prevReviews.filter(r => r.id !== reviewId));

                // Обновляем статистику
                loadStats();
            }
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const toggleExpand = (reviewId: string) => {
        setExpandedReviews(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId);
            } else {
                newSet.add(reviewId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Bewertungen...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
                                Bewertungen
                            </h1>
                            <p className="text-gray-600">
                                Verwalten und moderieren Sie Kundenbewertungen
                            </p>
                        </div>
                        <Link
                            href="/admin"
                            className="px-6 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Zurück zum Dashboard
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                            <div className="text-sm text-gray-600">Gesamt</div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                            <div className="text-sm text-yellow-700">Ausstehend</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
                            <div className="text-sm text-green-700">Genehmigt</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                            <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
                            <div className="text-sm text-red-700">Abgelehnt</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        >
                            <option value="all">Alle Bewertungen</option>
                            <option value="pending">Ausstehend</option>
                            <option value="approved">Genehmigt</option>
                            <option value="rejected">Abgelehnt</option>
                        </select>
                        <button
                            onClick={loadReviews}
                            className="ml-auto p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Aktualisieren"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Keine Bewertungen gefunden
                        </h3>
                        <p className="text-gray-600">
                            {filter !== 'all'
                                ? 'Versuchen Sie einen anderen Filter'
                                : 'Es gibt noch keine Bewertungen'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => {
                            const product = Array.isArray(review.product) ? review.product[0] : review.product;

                            return (
                                <div
                                    key={review.id}
                                    className="bg-white border border-gray-200 rounded-xl p-6"
                                >
                                    <div className="flex gap-6">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={product?.images?.[0] || '/placeholder-product.jpg'}
                                                alt={product?.name || 'Product'}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        </div>

                                        {/* Review Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 mb-1 break-words">
                                                        {product?.name || 'Unknown Product'}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {renderStars(review.rating)}
                                                        {review.verified_purchase && (
                                                            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                                                Verifiziert
                                                            </span>
                                                        )}
                                                        <span className={`text-xs px-2 py-1 rounded-full ${review.status === 'pending'
                                                            ? 'bg-yellow-50 text-yellow-700'
                                                            : review.status === 'approved'
                                                                ? 'bg-green-50 text-green-700'
                                                                : 'bg-red-50 text-red-700'
                                                            }`}>
                                                            {review.status === 'pending' ? 'Ausstehend' :
                                                                review.status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(review.created_at).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>

                                            {review.title && (
                                                <h4 className="font-medium text-gray-900 mb-2 break-all">
                                                    {review.title}
                                                </h4>
                                            )}

                                            {review.comment && (
                                                <>
                                                    <p className="text-gray-700 mb-3 whitespace-pre-wrap break-all">
                                                        {expandedReviews.has(review.id)
                                                            ? review.comment
                                                            : review.comment.length > 300
                                                                ? review.comment.slice(0, 300) + '...'
                                                                : review.comment
                                                        }
                                                    </p>
                                                    {review.comment.length > 300 && (
                                                        <button
                                                            onClick={() => toggleExpand(review.id)}
                                                            className="text-sm text-gray-600 hover:text-gray-900 underline mb-3"
                                                        >
                                                            {expandedReviews.has(review.id) ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            <div className="text-sm text-gray-600 mb-4">
                                                von <span className="font-medium break-words">{review.customer_name}</span>
                                                {review.customer_email && (
                                                    <span className="text-gray-500 break-words"> ({review.customer_email})</span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {review.status !== 'approved' && (
                                                    <button
                                                        onClick={() => updateReviewStatus(review.id, 'approved')}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Genehmigen
                                                    </button>
                                                )}
                                                {review.status !== 'rejected' && (
                                                    <button
                                                        onClick={() => updateReviewStatus(review.id, 'rejected')}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Ablehnen
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Löschen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
