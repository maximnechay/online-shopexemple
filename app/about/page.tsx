// app/about/page.tsx
import Link from 'next/link';
import { Award, Heart, Sparkles, Users, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full">
                                    <Sparkles className="w-4 h-4 text-rose-600" />
                                    <span className="text-sm text-rose-900 font-medium">Über uns</span>
                                </div>

                                <h1 className="text-5xl lg:text-6xl font-serif font-light text-gray-900 leading-tight">
                                    Ihre Schönheit ist<br />
                                    <span className="italic text-rose-600">unsere Passion</span>
                                </h1>

                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Seit über 15 Jahren bieten wir unseren Kunden exklusive Premium-Kosmetik
                                    und professionelle Beratung. Bei uns steht Ihre Zufriedenheit und natürliche
                                    Schönheit im Mittelpunkt.
                                </p>
                            </div>

                            <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-rose-200 via-pink-200 to-rose-300 shadow-2xl">
                                <div className="absolute inset-0 flex items-center justify-center text-white/90">
                                    <div className="text-center p-12">
                                        <Sparkles className="w-32 h-32 mx-auto mb-6 opacity-80" />
                                        <p className="text-2xl font-serif">Salon Bild</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-5xl font-serif text-rose-600 mb-2">15+</div>
                                <p className="text-gray-600">Jahre Erfahrung</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-rose-600 mb-2">5000+</div>
                                <p className="text-gray-600">Zufriedene Kunden</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-rose-600 mb-2">50+</div>
                                <p className="text-gray-600">Premium Marken</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-serif text-rose-600 mb-2">500+</div>
                                <p className="text-gray-600">Produkte</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="bg-gray-50 py-20 px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                                Unsere Werte
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Was uns auszeichnet und antreibt
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Award className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Höchste Qualität
                                </h3>
                                <p className="text-gray-600">
                                    Wir führen ausschließlich geprüfte Premium-Produkte von renommierten
                                    internationalen Marken. Qualität hat bei uns oberste Priorität.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Heart className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Persönliche Beratung
                                </h3>
                                <p className="text-gray-600">
                                    Unser erfahrenes Team steht Ihnen mit professioneller Beratung zur Seite
                                    und findet die perfekten Produkte für Ihre Bedürfnisse.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-serif text-gray-900 mb-3">
                                    Kundenzufriedenheit
                                </h3>
                                <p className="text-gray-600">
                                    Ihre Zufriedenheit ist unser Erfolg. Wir setzen alles daran,
                                    dass Sie mit unseren Produkten und Service rundum glücklich sind.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="px-6 lg:px-8 mb-20">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-8 text-center">
                            Unsere Geschichte
                        </h2>
                        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                            <p>
                                Was 2009 als kleiner Beauty-Salon in Berlin begann, hat sich zu einem der
                                führenden Anbieter für Premium-Kosmetik in Deutschland entwickelt. Unsere
                                Gründerin, inspiriert von ihrer Leidenschaft für natürliche Schönheit und
                                hochwertige Pflege, hatte eine Vision: Jedem die Möglichkeit zu geben,
                                sich mit erstklassigen Produkten zu verwöhnen.
                            </p>
                            <p>
                                In den letzten 15 Jahren haben wir unser Sortiment stetig erweitert und
                                arbeiten heute mit über 50 renommierten internationalen Marken zusammen.
                                Dabei haben wir nie unsere Wurzeln vergessen: Persönliche Beratung,
                                Qualität und Kundenzufriedenheit stehen nach wie vor im Mittelpunkt
                                unseres Handelns.
                            </p>
                            <p>
                                Heute bedienen wir über 5000 zufriedene Kunden und sind stolz darauf,
                                ein Teil ihrer Beauty-Routine zu sein. Ob in unserem Online-Shop oder
                                in unserem Salon – bei uns finden Sie die perfekten Produkte für Ihre
                                individuellen Bedürfnisse.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="bg-gradient-to-b from-rose-50 to-white py-20 px-6 lg:px-8 mb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl lg:text-5xl font-serif text-gray-900 mb-4">
                                Unser Team
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Professionelle Beauty-Experten mit Leidenschaft
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'Anna Schmidt',
                                    role: 'Gründerin & CEO',
                                    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
                                },
                                {
                                    name: 'Lisa Müller',
                                    role: 'Beauty Beraterin',
                                    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
                                },
                                {
                                    name: 'Sarah Wagner',
                                    role: 'Produktmanagerin',
                                    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop'
                                }
                            ].map((member, index) => (
                                <div key={index} className="text-center group">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-200">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                            style={{ backgroundImage: `url(${member.image})` }}
                                        />
                                    </div>
                                    <h3 className="text-xl font-serif text-gray-900 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-gray-600">{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-3xl p-12 text-center text-white">
                            <h2 className="text-4xl font-serif mb-4">
                                Bereit für Ihre Beauty-Reise?
                            </h2>
                            <p className="text-lg mb-8 text-white/90">
                                Entdecken Sie unsere exklusive Produktauswahl
                            </p>
                            <Link
                                href="/catalog"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-600 rounded-full font-medium hover:shadow-lg transition-all"
                            >
                                Zum Katalog
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}