// app/page.tsx
import Link from 'next/link';
import { Star, ArrowRight, Sparkles, ShoppingBag, Heart, Award, TrendingUp } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/20 to-white">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary-200/40 to-secondary-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-accent-200/30 to-primary-200/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-100 to-primary-50 rounded-full border border-primary-200/50 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105">
                                <Star className="w-4 h-4 text-primary-600 fill-primary-600 animate-pulse-soft" />
                                <span className="text-sm text-primary-900 font-semibold tracking-wide">Premium Kosmetik</span>
                            </div>

                            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-serif font-light text-neutral-900 leading-[1.05]">
                                Schönheit<br />
                                <span className="relative">
                                    beginnt
                                    <div className="absolute -bottom-3 left-0 right-0 h-3 bg-gradient-to-r from-primary-400/30 to-secondary-400/30 -z-10 transform -rotate-1" />
                                </span><br />
                                <span className="text-gradient bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 italic">hier</span>
                            </h1>

                            <p className="text-xl text-neutral-600 leading-relaxed max-w-xl font-light">
                                Entdecken Sie die Welt der professionellen Kosmetik. Exklusive Marken,
                                natürliche Inhaltsstoffe und individuelle Beratung für jeden Kunden.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    href="/catalog"
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl font-semibold hover:from-primary-700 hover:to-primary-600 transition-all duration-300 shadow-medium hover:shadow-glow-lg transform hover:scale-105 active:scale-95"
                                >
                                    Zum Katalog
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/about"
                                    className="inline-flex items-center gap-3 px-8 py-4 border-2 border-neutral-900 text-neutral-900 rounded-2xl font-semibold hover:bg-neutral-900 hover:text-white transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105"
                                >
                                    Mehr erfahren
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 lg:gap-12 pt-8 border-t border-neutral-200">
                                {[
                                    { value: '500+', label: 'Produkte' },
                                    { value: '50+', label: 'Marken' },
                                    { value: '5000+', label: 'Kunden' }
                                ].map((stat, i) => (
                                    <div key={i} className="group cursor-default">
                                        <div className="text-4xl lg:text-5xl font-serif font-semibold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform">
                                            {stat.value}
                                        </div>
                                        <div className="text-sm text-neutral-600 font-medium">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative lg:h-[700px] animate-fade-in-up animation-delay-200">
                            <div className="relative h-full rounded-3xl overflow-hidden bg-gradient-to-br from-primary-300 via-secondary-300 to-accent-300 shadow-hard hover:shadow-glow-lg transition-all duration-500 transform hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-shine opacity-30" />
                                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                                    <div className="text-center text-white/95 p-12">
                                        <Sparkles className="w-32 h-32 mx-auto mb-6 opacity-90 animate-float" />
                                        <p className="text-3xl font-serif font-semibold tracking-wide">Platz für Bild</p>
                                        <p className="text-base mt-2 opacity-90 font-light">Kosmetikprodukte oder Model</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badges */}
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-hard p-6 max-w-xs hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border border-neutral-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow">
                                        <Star className="w-7 h-7 text-white fill-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-serif font-bold text-neutral-900">4.9</div>
                                        <div className="text-sm text-neutral-600 font-medium">Durchschnitt</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -top-6 -right-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-hard p-4 hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1 border border-white/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                                        <Award className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-sm font-semibold text-neutral-900">Premium<br/>Qualität</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-24 px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full mb-6">
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-neutral-700 font-medium">Entdecken Sie</span>
                        </div>
                        <h2 className="text-5xl lg:text-6xl font-serif text-neutral-900 mb-6 text-balance">
                            Unsere Kategorien
                        </h2>
                        <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light">
                            Sorgfältig ausgewählte Produkte für Ihre natürliche Schönheit
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
                                className="group relative overflow-hidden rounded-3xl aspect-[3/4] shadow-medium hover:shadow-hard transition-all duration-500 transform hover:-translate-y-2"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                                    style={{ backgroundImage: `url(${category.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-secondary-600/20 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />

                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-2xl font-serif font-semibold mb-2">{category.name}</h3>
                                    <p className="text-sm text-white/90 mb-4 font-light">{category.desc}</p>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                                        Ansehen <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="relative py-24 px-6 lg:px-8 bg-gradient-to-b from-neutral-50 to-white overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200/20 to-transparent rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                        {[
                            {
                                icon: ShoppingBag,
                                title: 'Schnelle Lieferung',
                                desc: 'Lieferung innerhalb Deutschlands in 2-3 Werktagen',
                                gradient: 'from-primary-500 to-primary-600'
                            },
                            {
                                icon: Star,
                                title: 'Nur Originale',
                                desc: 'Wir arbeiten direkt mit Marken und offiziellen Händlern',
                                gradient: 'from-secondary-500 to-secondary-600'
                            },
                            {
                                icon: Heart,
                                title: 'Treueprogramm',
                                desc: 'Sammeln Sie Rabatte bis zu 15% und exklusive Angebote',
                                gradient: 'from-accent-500 to-accent-600'
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group text-center p-8 rounded-3xl bg-white border border-neutral-100 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-neutral-600 leading-relaxed font-light">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}