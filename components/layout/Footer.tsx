// components/layout/Footer.tsx
import Link from 'next/link';
import { Sparkles, Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-600/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-secondary-600/10 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-3xl font-serif font-semibold">
                                Beauty<span className="text-gradient bg-gradient-to-r from-primary-400 to-secondary-400">Shop</span>
                            </span>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-light">
                            Professionelle Kosmetik für Ihre natürliche Schönheit. Exklusive Marken und persönliche Beratung.
                        </p>

                        {/* Social Media */}
                        <div className="flex items-center gap-3">
                            {[
                                { icon: Facebook, href: '#' },
                                { icon: Instagram, href: '#' },
                                { icon: Twitter, href: '#' },
                                { icon: Youtube, href: '#' }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-primary-500 hover:to-secondary-500 border border-white/10 hover:border-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-glow group"
                                >
                                    <social.icon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Katalog Column */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-6 text-white">Katalog</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Alle Produkte', href: '/catalog' },
                                { label: 'Neuheiten', href: '/catalog' },
                                { label: 'Angebote', href: '/catalog' },
                                { label: 'Bestseller', href: '/catalog' }
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-neutral-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 font-light group"
                                    >
                                        <span className="relative">
                                            {item.label}
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Information Column */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-6 text-white">Information</h4>
                        <ul className="space-y-3">
                            {[
                                { label: 'Über uns', href: '/about' },
                                { label: 'Lieferung & Zahlung', href: '/delivery' },
                                { label: 'Rückgabe', href: '/return' },
                                { label: 'Kontakt', href: '/contacts' }
                            ].map((item, i) => (
                                <li key={i}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-neutral-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 font-light group"
                                    >
                                        <span className="relative">
                                            {item.label}
                                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="font-serif text-lg font-semibold mb-6 text-white">Kontakt</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 group">
                                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-neutral-400 font-light">+49 (123) 456-7890</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-neutral-400 font-light">info@elegance-beauty.de</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-neutral-400 font-light">Berlin, Musterstraße 10</span>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm text-neutral-400 font-light">Mo-So: 9:00 — 21:00</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-neutral-500 font-light">
                            © 2024 BeautyShop. Alle Rechte vorbehalten.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy" className="text-sm text-neutral-500 hover:text-white transition-colors font-light">
                                Datenschutz
                            </Link>
                            <Link href="/terms" className="text-sm text-neutral-500 hover:text-white transition-colors font-light">
                                AGB
                            </Link>
                            <Link href="/imprint" className="text-sm text-neutral-500 hover:text-white transition-colors font-light">
                                Impressum
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}