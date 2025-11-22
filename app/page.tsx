// app/page.tsx
'use client';

import Link from 'next/link';
import {
    ArrowRight,
    Check,
    Package,
    Truck,
    Shield,
    Award,
    Star,
    Sparkles,
    Mail
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section - Professional Minimalist */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            {/* Small badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1 text-xs uppercase tracking-[0.16em] text-gray-600">
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Neu im Shop - ausgewählte Profi Marken
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 leading-[1.1] tracking-tight">
                                    Premium Beauty
                                    <span className="block font-normal mt-2">für jeden Tag</span>
                                </h1>

                                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                                    Hochwertige Kosmetik von führenden Marken.
                                    Professionell ausgewählt, sicher und schnell geliefert.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/catalog"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                                >
                                    Zum Shop
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 text-gray-900 font-medium hover:border-gray-900 transition-colors"
                                >
                                    Mehr erfahren
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-10 pt-8 border-t border-gray-200">
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">500+</div>
                                    <div className="text-sm text-gray-600">Produkte</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">50+</div>
                                    <div className="text-sm text-gray-600">Marken</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-light text-gray-900 mb-1">5k+</div>
                                    <div className="text-sm text-gray-600">Kunden</div>
                                </div>
                            </div>

                            {/* Trust line */}
                            <div className="flex items-center gap-3 text-sm text-gray-500 pt-2">
                                <Shield className="w-4 h-4" />
                                <span>Nur geprüfte Original Ware direkt von autorisierten Distributoren</span>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative lg:h-[600px]">
                            <div className="relative h-full rounded-3xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage:
                                            "url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=1600&fit=crop')"
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                <div className="absolute bottom-8 left-8 right-8">
                                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                        <div className="text-white space-y-1">
                                            <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                                                Ihre Routine
                                            </p>
                                            <p className="text-2xl font-light">Salonqualität für zuhause</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs text-gray-900 backdrop-blur">
                                            <Truck className="w-4 h-4" />
                                            <span>Versand ab 49 € kostenlos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-8 -left-8 bg-white shadow-lg p-6 border border-gray-100 rounded-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black flex items-center justify-center rounded-2xl">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <div className="text-2xl font-light text-gray-900">4.9/5</div>
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            basierend auf über 1 200 Bewertungen
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: 'Haarpflege',
                                desc: 'Shampoos & Conditioner',
                                image:
                                    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Gesichtspflege',
                                desc: 'Cremes & Seren',
                                image:
                                    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Körperpflege',
                                desc: 'Body Lotions & Öle',
                                image:
                                    'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Make-up',
                                desc: 'Foundations & Lippenstifte',
                                image:
                                    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=800&fit=crop'
                            }
                        ].map((category, index) => (
                            <Link
                                key={index}
                                href="/catalog"
                                className="group relative overflow-hidden aspect-[3/4] bg-gray-100 rounded-3xl"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                    style={{ backgroundImage: `url(${category.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-light mb-1">{category.name}</h3>
                                    <p className="text-sm text-white/80 mb-3">{category.desc}</p>
                                    <div className="inline-flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ansehen <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
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

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: 'Repair Shampoo',
                                brand: 'Kerastase',
                                price: '24,90 €',
                                size: '250 ml',
                                tag: 'Top Seller'
                            },
                            {
                                name: 'Hydra Face Serum',
                                brand: 'Babor',
                                price: '39,00 €',
                                size: '30 ml',
                                tag: 'Neu'
                            },
                            {
                                name: 'Volume Spray',
                                brand: 'Moroccanoil',
                                price: '22,50 €',
                                size: '150 ml',
                                tag: 'Salon Liebling'
                            },
                            {
                                name: 'Glow Day Cream',
                                brand: 'L&apos;Oréal Professionnel',
                                price: '29,90 €',
                                size: '50 ml',
                                tag: 'Limited'
                            }
                        ].map((product, index) => (
                            <Link
                                key={index}
                                href="/catalog"
                                className="group rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="aspect-[4/5] rounded-2xl bg-gray-50 mb-4 overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="w-10 h-10 text-gray-300 group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                                        <Sparkles className="w-3 h-3" />
                                        <span>{product.tag}</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                                        {product.brand}
                                    </p>
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">{product.size}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-base font-medium text-gray-900">
                                            {product.price}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 flex items-center gap-1">
                                            Details
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
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
                <div className="max-w-4xl mx-auto rounded-3xl border border-gray-100 bg-gray-50/60 p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex items-start gap-4">
                        <div className="mt-1">
                            <Mail className="w-6 h-6 text-gray-900" />
                        </div>
                        <div>
                            <h3 className="text-xl font-medium text-gray-900 mb-1">
                                Exklusive Angebote per E Mail
                            </h3>
                            <p className="text-sm text-gray-600 max-w-md">
                                Erfahren Sie als erste von neuen Marken, Aktionen und limitierten Editionen.
                                Kein Spam, nur Beauty Inspiration.
                            </p>
                        </div>
                    </div>
                    <form className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Ihre E Mail Adresse"
                            className="w-full sm:w-64 px-4 py-3 text-sm border border-gray-200 rounded-full outline-none focus:border-gray-900"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Anmelden
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </section>

            <Footer />
        </div>
    );
}
