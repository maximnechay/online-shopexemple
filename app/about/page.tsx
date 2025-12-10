// app/about/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Award, Heart, Users, ArrowRight, Shield, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-8 md:pt-16 pb-16">
                {/* Hero Section */}
                <section className="px-4 sm:px-6 lg:px-8 mb-24">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-1 text-xs uppercase tracking-[0.16em] text-gray-600">
                                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gray-900" />
                                    Über uns
                                </div>

                                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 leading-[0.95] tracking-tight">
                                    Ihre Schönheit ist
                                    <span className="block mt-4 pb-2 bg-gradient-to-r from-gray-900 via-amber-900 to-gray-900 bg-clip-text text-transparent">
                                        unsere Passion
                                    </span>
                                </h1>

                                <p className="text-lg sm:text-xl text-gray-600 leading-[1.8] max-w-xl font-light">
                                    Seit über 15 Jahren bieten wir unseren Kunden exklusive Premium-Kosmetik
                                    und professionelle Beratung. Bei uns steht Ihre Zufriedenheit und natürliche
                                    Schönheit im Mittelpunkt.
                                </p>

                                <div className="flex items-center gap-3 text-sm text-gray-500 pt-2">
                                    <Shield className="w-4 h-4" />
                                    <span>Nur geprüfte Original Ware von autorisierten Distributoren</span>
                                </div>
                            </div>

                            <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
                                <div className="relative h-full rounded-3xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm">
                                    <Image
                                        src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop"
                                        alt="Luxuriöser Beauty Salon"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-10 px-4 sm:px-6 lg:px-8 mb-24 border-y border-gray-100 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-10">
                            <div>
                                <div className="text-4xl font-light text-gray-900 mb-1">15+</div>
                                <div className="text-sm text-gray-600">Jahre Erfahrung</div>
                            </div>
                            <div>
                                <div className="text-4xl font-light text-gray-900 mb-1">5000+</div>
                                <div className="text-sm text-gray-600">Zufriedene Kunden</div>
                            </div>
                            <div>
                                <div className="text-4xl font-light text-gray-900 mb-1">50+</div>
                                <div className="text-sm text-gray-600">Premium Marken</div>
                            </div>
                            <div>
                                <div className="text-4xl font-light text-gray-900 mb-1">500+</div>
                                <div className="text-sm text-gray-600">Produkte</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 mb-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16">
                            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                                Unsere Werte
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl">
                                Was uns auszeichnet und antreibt
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-left">
                                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                                    <Award className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Höchste Qualität
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Wir führen ausschließlich geprüfte Premium-Produkte von renommierten
                                    internationalen Marken. Qualität hat bei uns oberste Priorität.
                                </p>
                            </div>

                            <div className="text-left">
                                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                                    <Heart className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Persönliche Beratung
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Unser erfahrenes Team steht Ihnen mit professioneller Beratung zur Seite
                                    und findet die perfekten Produkte für Ihre Bedürfnisse.
                                </p>
                            </div>

                            <div className="text-left">
                                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-900" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Kundenzufriedenheit
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Ihre Zufriedenheit ist unser Erfolg. Wir setzen alles daran,
                                    dass Sie mit unseren Produkten und Service rundum glücklich sind.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="px-4 sm:px-6 lg:px-8 mb-24">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8">
                            Unsere Geschichte
                        </h2>
                        <div className="prose prose-lg max-w-none text-gray-600 space-y-6 leading-relaxed">
                            <p className="text-lg">
                                Was 2009 als kleiner Beauty-Salon in Berlin begann, hat sich zu einem der
                                führenden Anbieter für Premium-Kosmetik in Deutschland entwickelt. Unsere
                                Gründerin, inspiriert von ihrer Leidenschaft für natürliche Schönheit und
                                hochwertige Pflege, hatte eine Vision: Jedem die Möglichkeit zu geben,
                                sich mit erstklassigen Produkten zu verwöhnen.
                            </p>
                            <p className="text-lg">
                                In den letzten 15 Jahren haben wir unser Sortiment stetig erweitert und
                                arbeiten heute mit über 50 renommierten internationalen Marken zusammen.
                                Dabei haben wir nie unsere Wurzeln vergessen: Persönliche Beratung,
                                Qualität und Kundenzufriedenheit stehen nach wie vor im Mittelpunkt
                                unseres Handelns.
                            </p>
                            <p className="text-lg">
                                Heute bedienen wir über 5000 zufriedene Kunden und sind stolz darauf,
                                ein Teil ihrer Beauty-Routine zu sein. Ob in unserem Online-Shop oder
                                in unserem Salon – bei uns finden Sie die perfekten Produkte für Ihre
                                individuellen Bedürfnisse.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 mb-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-16">
                            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                                Unser Team
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl">
                                Professionelle Beauty-Experten mit Leidenschaft
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'Anna Schmidt',
                                    role: 'Gründerin & CEO',
                                    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop&q=80'
                                },
                                {
                                    name: 'Lisa Müller',
                                    role: 'Beauty Beraterin',
                                    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop&q=80'
                                },
                                {
                                    name: 'Sarah Wagner',
                                    role: 'Produktmanagerin',
                                    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop&q=80'
                                }
                            ].map((member, index) => (
                                <div key={index} className="group">
                                    <div className="relative aspect-[3/4] rounded-3xl bg-gray-100 overflow-hidden mb-4 border border-gray-100">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-gray-900 rounded-3xl p-12 text-center text-white">
                            <h2 className="text-4xl font-light mb-4 tracking-tight">
                                Bereit für Ihre Beauty-Reise?
                            </h2>
                            <p className="text-lg mb-8 text-gray-300">
                                Entdecken Sie unsere exklusive Produktauswahl
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all"
                            >
                                Zum Katalog
                                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}