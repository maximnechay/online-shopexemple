// components/product/ProductReviews.tsx
'use client';

import { useState, useEffect } from 'react';
import { Star, StarHalf, ThumbsUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import ReviewForm from '@/components/product/ReviewForm';

interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    customer_name: string;
    verified_purchase: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface ProductReviewsProps {
    productId: string;
    productName: string;
    userHasPurchased?: boolean;
    orderId?: string;
}

export default function ProductReviews({
    productId,
    productName,
    userHasPurchased = false,
    orderId
}: ProductReviewsProps) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    useEffect(() => {
        loadReviews();
    }, [productId, user]);

    const loadReviews = async () => {
        try {
            const url = user
                ? `/api/reviews?product_id=${productId}&user_id=${user.id}`
                : `/api/reviews?product_id=${productId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
                calculateStats(data.reviews || []);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reviewsList: Review[]) => {
        const total = reviewsList.length;
        if (total === 0) {
            setStats({ average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
            return;
        }

        const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;

        const distribution = reviewsList.reduce((acc, r) => {
            acc[r.rating as keyof typeof acc]++;
            return acc;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

        setStats({ average, total, distribution });
    };

    const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-5 h-5',
            lg: 'w-6 h-6'
        };

        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizeClasses[size]} ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const handleReviewSubmitted = () => {
        setShowForm(false);
        loadReviews();
    };

    if (loading) {
        return (
            <div className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full mx-auto" />
            </div>
        );
    }

    return (
        <div className="py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-8 sm:mb-12">
                    Bewertungen & Rezensionen
                </h2>

                {/* Rating Summary */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-gray-50 rounded-3xl p-8 text-center border border-gray-100">
                        <div className="text-5xl font-light text-gray-900 mb-3">
                            {stats.average > 0 ? stats.average.toFixed(1) : '0.0'}
                        </div>
                        <div className="flex justify-center mb-3">
                            {renderStars(Math.round(stats.average), 'lg')}
                        </div>
                        <div className="text-sm text-gray-600">
                            Basierend auf {stats.total} Bewertung{stats.total !== 1 ? 'en' : ''}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = stats.distribution[stars as keyof typeof stats.distribution];
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                            return (
                                <div key={stars} className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1 w-20">
                                        <span className="text-sm text-gray-600">{stars}</span>
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-600 w-12 text-right">
                                        {count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Write Review Button */}
                {user && !showForm && (
                    <div className="mb-8">
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                        >
                            Bewertung schreiben
                        </button>
                    </div>
                )}

                {/* Review Form */}
                {showForm && (
                    <div className="mb-8 bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <ReviewForm
                            productId={productId}
                            productName={productName}
                            orderId={orderId}
                            onSuccess={handleReviewSubmitted}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-gray-100">
                        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            Noch keine Bewertungen
                        </h3>
                        <p className="text-gray-600">
                            Seien Sie der Erste, der dieses Produkt bewertet!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white border border-gray-200 rounded-3xl p-6"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <div className="flex items-center">
                                                {renderStars(review.rating, 'sm')}
                                            </div>
                                            {review.verified_purchase && (
                                                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Verifizierter Kauf
                                                </span>
                                            )}
                                            {review.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                                                    ⏳ Wird geprüft
                                                </span>
                                            )}
                                        </div>
                                        {review.title && (
                                            <h4 className="font-medium text-gray-900 mb-2 break-words">
                                                {review.title}
                                            </h4>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(review.created_at).toLocaleDateString('de-DE', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>

                                {review.comment && (
                                    <p className="text-gray-700 mb-4 break-words whitespace-pre-wrap">
                                        {review.comment}
                                    </p>
                                )}

                                <div className="text-sm text-gray-600">
                                    von <span className="font-medium break-words">{review.customer_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
