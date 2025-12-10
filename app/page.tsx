// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    Check,
    Package,
    Truck,
    Shield,
    Award,
    Sparkles,
    Mail
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';
import { transformProductsFromDB } from '@/lib/supabase/helpers';
import type { HomeBanner } from '@/lib/types/banner';
import { fetchActiveHomeBanner } from '@/lib/supabase/homeBanner';
import type { HomeMiniBanner } from '@/lib/types/miniBanner';
import type { Category } from '@/lib/types/category';
import { fetchActiveHomeMiniBanners } from '@/lib/supabase/homeMiniBanners';
import { fetchCategories } from '@/lib/supabase/categories';
import { fetchHomepageCategories } from '@/lib/supabase/categories';

export default function HomePage() {
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [heroBanner, setHeroBanner] = useState<HomeBanner | null>(null);
    const [heroLoading, setHeroLoading] = useState(true);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterSuccess, setNewsletterSuccess] = useState(false);
    const [newsletterError, setNewsletterError] = useState('');
    const fallbackHeroImage = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=1600&fit=crop";
    const [miniBanners, setMiniBanners] = useState<HomeMiniBanner[]>([]);
    const [miniLoading, setMiniLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        loadBestsellers();
        loadHeroBanner();
        loadMiniBanners();
        loadCategories();
    }, []);

    async function loadHeroBanner() {
        try {
            setHeroLoading(true);
            const banner = await fetchActiveHomeBanner();
            setHeroBanner(banner);
        } catch (error) {
            console.error('❌ Error loading hero banner:', error);
            setHeroBanner(null);
        } finally {
            setHeroLoading(false);
        }
    }

    async function loadCategories() {
        try {
            setCategoriesLoading(true);
            const data = await fetchHomepageCategories();
            setCategories(data);
        } catch (error) {
            console.error('❌ Error loading categories:', error);
            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    }

    async function loadMiniBanners() {
        try {
            setMiniLoading(true);
            const banners = await fetchActiveHomeMiniBanners(3);
            setMiniBanners(banners);
        } catch (e) {
            console.error('❌ Error loading mini banners:', e);
            setMiniBanners([]);
        } finally {
            setMiniLoading(false);
        }
    }

    async function handleNewsletterSubmit(e: React.FormEvent) {
        e.preventDefault();
        setNewsletterError('');
        setNewsletterSuccess(false);
        setNewsletterLoading(true);

        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newsletterEmail })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to subscribe');
            }

            setNewsletterSuccess(true);
            setNewsletterEmail('');
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setNewsletterError(
                error instanceof Error
                    ? error.message
                    : 'Fehler beim Abonnieren. Bitte versuchen Sie es später erneut.'
            );
        } finally {
            setNewsletterLoading(false);
        }
    }

    async function loadBestsellers() {
        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('in_stock', true)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error) {
                console.error('❌ Error loading products:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                setBestsellers([]);
                return;
            }

            const products = transformProductsFromDB(data);
            const shuffled = [...products].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 4);

            setBestsellers(selected);
        } catch (error) {
            console.error('❌ Error loading bestsellers:', error);
            setBestsellers([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section - Overlay Layout */}
            {heroLoading ? (
                <section className="relative h-[85vh] min-h-[600px] bg-gray-200 animate-pulse" />
            ) : (
                <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
                    {/* Background Image - Mobile */}
                    <div
                        className="absolute inset-0 bg-cover bg-center md:hidden"
                        style={{
                            backgroundImage: `url('${heroBanner?.mobileImageUrl || heroBanner?.desktopImageUrl || fallbackHeroImage}')`
                        }}
                    />
                    {/* Background Image - Desktop */}
                    <div
                        className="absolute inset-0 bg-cover bg-center hidden md:block"
                        style={{
                            backgroundImage: `url('${heroBanner?.desktopImageUrl || fallbackHeroImage}')`
                        }}
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                    {/* Content */}
                    <div className="relative h-full flex items-center pt-24 md:pt-0">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className="max-w-2xl text-white">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs uppercase tracking-[0.16em] text-white/90 mb-6">
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Neu im Shop - ausgewählte Profi Marken
                                </div>

                                {/* Title */}
                                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] tracking-tight mb-6">
                                    {heroBanner?.title || 'Premium Beauty'}
                                    <span className="block mt-3 text-amber-200/90">
                                        {heroBanner?.subtitle || 'für jeden Tag'}
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mb-8">
                                    {heroBanner?.description || 'Hochwertige Kosmetik von führenden Marken. Professionell kuratiert, authentisch und mit Liebe zum Detail ausgewählt.'}
                                </p>

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        href={heroBanner?.buttonUrl || '/catalog'}
                                        className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        {heroBanner?.buttonText || 'Zum Shop'}
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/40 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm"
                                    >
                                        Mehr erfahren
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Mini banners under hero */}
            <section className="px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-7xl mx-auto">
                    {miniLoading ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="rounded-3xl bg-gray-100 border border-gray-100 h-40 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : miniBanners.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {miniBanners.map((banner) => (
                                <Link
                                    key={banner.id}
                                    href={banner.linkUrl || '/catalog'}
                                    className="group relative overflow-hidden rounded-3xl bg-gray-100 border border-gray-100 h-40"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url('${banner.imageUrl}')` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/5" />

                                    <div className="relative h-full px-5 py-4 flex flex-col justify-between text-white">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/70 mb-1">
                                                Empfehlung
                                            </p>
                                            <h3 className="text-lg font-medium leading-snug">
                                                {banner.title || 'Kategorie'}
                                            </h3>
                                            {banner.description && (
                                                <p className="mt-1 text-xs text-white/80 line-clamp-2">
                                                    {banner.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                                            Jetzt entdecken
                                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Brand strip */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 border-y border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        Beliebte Marken
                    </p>
                    <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm sm:text-base text-gray-500">
                        <span className="tracking-wide">Kerastase</span>
                        <span className="tracking-wide">L&apos;Oréal Professionnel</span>
                        <span className="tracking-wide">Olaplex</span>
                        <span className="tracking-wide">Moroccanoil</span>
                        <span className="tracking-wide">Babor</span>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                            Kategorien
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Entdecken Sie unsere sorgfältig kuratierten Produktkategorien
                        </p>
                    </div>

                    {categoriesLoading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="rounded-3xl bg-gray-200 h-[340px] animate-pulse" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-gray-500">Keine Kategorien verfügbar.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {categories.map((category: Category) => (
                                <Link
                                    key={category.id}
                                    href={`/catalog?category=${category.slug}`}
                                    className="group relative overflow-hidden aspect-[3/4] bg-gray-100 rounded-3xl"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${category.image})` }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <h3 className="text-xl font-light mb-1">{category.name}</h3>
                                        <p className="text-sm text-white/80 mb-3">{category.description}</p>
                                        <div className="inline-flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ansehen <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Bestseller Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3">
                                Bestseller
                            </h2>
                            <p className="text-lg text-gray-600 max-w-xl">
                                Unsere meistverkauften Produkte, ausgewählt von Kundinnen und Profis.
                            </p>
                        </div>
                        <Link
                            href="/catalog"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 border-b border-gray-900/30 hover:border-gray-900"
                        >
                            Alle Produkte ansehen
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col shadow-sm">
                                    <div className="aspect-[4/5] rounded-2xl bg-gray-100 mb-4 animate-pulse" />
                                    <div className="h-3 bg-gray-100 rounded mb-2 animate-pulse" />
                                    <div className="h-4 bg-gray-100 rounded mb-2 animate-pulse" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : bestsellers.length === 0 ? (
                        <div className="text-center py-16">
                            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Noch keine Produkte verfügbar
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Unsere Kollektion wird bald verfügbar sein.
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                            >
                                Zum Katalog
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {bestsellers.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-[4/5] rounded-2xl bg-gray-50 mb-4 overflow-hidden relative">
                                        {product.images && product.images.length > 0 ? (
                                            <Image
                                                src={product.images[0]}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Package className="w-10 h-10 text-gray-300" />
                                            </div>
                                        )}
                                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                                            <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                                                <Sparkles className="w-3 h-3" />
                                                <span>Sale</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                                            {product.brand || 'Premium Brand'}
                                        </p>
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-3">
                                            {product.attributes?.find((attr: { name: string; value: string }) => attr.name === 'Größe')?.value || ''}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-medium text-gray-900">
                                                    {product.price.toFixed(2)} €
                                                </span>
                                                {product.compareAtPrice && product.compareAtPrice > product.price && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {product.compareAtPrice.toFixed(2)} €
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 flex items-center gap-1">
                                                Details
                                                <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12">
                        {[
                            {
                                icon: Truck,
                                title: 'Schnelle Lieferung',
                                desc: '2-3 Werktage deutschlandweit'
                            },
                            {
                                icon: Shield,
                                title: '100% Original',
                                desc: 'Autorisierte Händler'
                            },
                            {
                                icon: Check,
                                title: 'Sichere Zahlung',
                                desc: 'SSL verschlüsselt'
                            },
                            {
                                icon: Award,
                                title: 'Treueprogramm',
                                desc: 'Bis zu 15% Rabatt'
                            }
                        ].map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="text-center">
                                    <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center">
                                        <Icon className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl lg:text-5xl font-light text-white mb-6">
                        Bereit zu starten?
                    </h2>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Entdecken Sie unsere Kollektion und finden Sie die perfekten Produkte für Ihre Beauty-Routine
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/catalog"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Zum Katalog
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/about"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 text-white font-medium hover:border-gray-500 transition-colors"
                        >
                            Über uns
                        </Link>
                    </div>
                </div>
            </section>

            {/* Newsletter / Info Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-4xl mx-auto rounded-3xl border border-gray-100 bg-gray-50/60 p-8 sm:p-10">
                    {newsletterSuccess ? (
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-medium text-gray-900 mb-2">
                                Vielen Dank!
                            </h3>
                            <p className="text-gray-600 max-w-md mb-6">
                                Sie erhalten in Kürze eine Bestätigungs-E-Mail. Wir freuen uns, Sie in unserer Community begrüßen zu dürfen!
                            </p>
                            <button
                                onClick={() => setNewsletterSuccess(false)}
                                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Weitere E-Mail hinzufügen →
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        <Mail className="w-6 h-6 text-gray-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-gray-900 mb-1">
                                            Exklusive Angebote per E-Mail
                                        </h3>
                                        <p className="text-sm text-gray-600 max-w-md">
                                            Erfahren Sie als erste von neuen Marken, Aktionen und limitierten Editionen.
                                            Kein Spam, nur Beauty-Inspiration.
                                        </p>
                                    </div>
                                </div>
                                <form onSubmit={handleNewsletterSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        placeholder="Ihre E-Mail-Adresse"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        required
                                        disabled={newsletterLoading}
                                        className="w-full sm:w-64 px-4 py-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterLoading}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {newsletterLoading ? 'Wird gesendet...' : 'Anmelden'}
                                        {!newsletterLoading && <ArrowRight className="w-4 h-4" />}
                                    </button>
                                </form>
                            </div>
                            {newsletterError && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-red-600 text-xs font-bold">!</span>
                                    </div>
                                    <p className="text-sm text-red-800">
                                        {newsletterError}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}