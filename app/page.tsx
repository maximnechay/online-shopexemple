// app/page.tsx
import Link from 'next/link';
import { Star, ArrowRight, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 lg:px-8 bg-gradient-to-b from-rose-50/30 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full">
                                <Star className="w-4 h-4 text-rose-600 fill-rose-600" />
                                <span className="text-sm text-rose-900 font-medium">Premium Kosmetik</span>
                            </div>

                            <h1 className="text-6xl lg:text-7xl font-serif font-light text-gray-900 leading-[1.1]">
                                Schönheit<br />beginnt<br />
                                <span className="italic text-rose-600">hier</span>
                            </h1>

                            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                                Entdecken Sie die Welt der professionellen Kosmetik. Exklusive Marken,
                                natürliche Inhaltsstoffe und individuelle Beratung für jeden Kunden.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-full font-medium hover:bg-rose-700 transition-all hover:gap-3"
                                >
                                    Zum Katalog
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-900 hover:text-white transition-all"
                                >
                                    Mehr erfahren
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-12 pt-8 border-t border-gray-200">
                                <div>
                                    <div className="text-4xl font-serif text-gray-900 mb-1">500+</div>
                                    <div className="text-sm text-gray-600">Produkte</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-serif text-gray-900 mb-1">50+</div>
                                    <div className="text-sm text-gray-600">Marken</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-serif text-gray-900 mb-1">5000+</div>
                                    <div className="text-sm text-gray-600">Kunden</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative lg:h-[700px]">
                            <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-rose-200 via-pink-200 to-rose-300 shadow-2xl">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center text-white/90 p-12">
                                        <Sparkles className="w-32 h-32 mx-auto mb-6 opacity-80" />
                                        <p className="text-2xl font-serif">Platz für Bild</p>
                                        <p className="text-sm mt-2 opacity-80">Kosmetikprodukte oder Model</p>
                                    </div>
                                </div>
                            </div>
                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                                        <Star className="w-6 h-6 text-rose-600 fill-rose-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-serif text-gray-900">4.9</div>
                                        <div className="text-sm text-gray-600">Durchschnitt</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                            Unsere Kategorien
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Sorgfältig ausgewählte Produkte für Ihre Schönheit
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                name: 'Haarpflege',
                                desc: 'Shampoos, Masken, Seren',
                                image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Gesichtspflege',
                                desc: 'Cremes, Tonics, Peelings',
                                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Körperpflege',
                                desc: 'Peelings, Öle, Lotionen',
                                image: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=600&h=800&fit=crop'
                            },
                            {
                                name: 'Make-up',
                                desc: 'Foundations, Lippenstifte, Lidschatten',
                                image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&h=800&fit=crop'
                            },
                        ].map((category, index) => (
                            <Link
                                key={index}
                                href="/catalog"
                                className="group relative overflow-hidden rounded-2xl aspect-[3/4]"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                    style={{ backgroundImage: `url(${category.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    <h3 className="text-xl font-serif mb-1">{category.name}</h3>
                                    <p className="text-sm text-white/80">{category.desc}</p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ansehen <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-serif text-gray-900 mb-3">
                                Schnelle Lieferung
                            </h3>
                            <p className="text-gray-600">
                                Lieferung innerhalb Deutschlands in 2-3 Werktagen
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Star className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-serif text-gray-900 mb-3">
                                Nur Originale
                            </h3>
                            <p className="text-gray-600">
                                Wir arbeiten direkt mit Marken und offiziellen Händlern
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-8 h-8 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-serif text-gray-900 mb-3">
                                Treueprogramm
                            </h3>
                            <p className="text-gray-600">
                                Sammeln Sie Rabatte bis zu 15% und exklusive Angebote
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}