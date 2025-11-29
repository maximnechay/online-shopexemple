import Link from 'next/link';
import { Mail, Instagram, Facebook, Youtube, Twitter, MapPin, Phone, Clock } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
            {/* Newsletter Section */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-3xl font-light mb-3 tracking-tight">
                                Bleiben Sie informiert
                            </h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Exklusive Angebote, Beauty-Tipps und neue Produkte direkt in Ihr Postfach
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Ihre E-Mail-Adresse"
                                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                                />
                            </div>
                            <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-medium hover:bg-gray-100 transition-all whitespace-nowrap shadow-lg hover:shadow-xl">
                                Abonnieren
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-6">
                            <h2 className="text-3xl font-light tracking-tight hover:text-gray-300 transition-colors">
                                Élégance
                            </h2>
                        </Link>
                        <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                            Professionelle Kosmetik für Ihre natürliche Schönheit. Entdecken Sie hochwertige Beauty-Produkte, die Ihre Haut verwöhnen und pflegen.
                        </p>

                        {/* Social Media */}
                        <div className="mb-6">
                            <p className="text-sm font-medium mb-4 tracking-wide text-gray-300">
                                Folgen Sie uns
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white hover:text-gray-900 flex items-center justify-center transition-all duration-300 group"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="w-5 h-5" strokeWidth={1.5} />
                                </a>
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white hover:text-gray-900 flex items-center justify-center transition-all duration-300 group"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="w-5 h-5" strokeWidth={1.5} />
                                </a>
                                <a
                                    href="https://youtube.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white hover:text-gray-900 flex items-center justify-center transition-all duration-300 group"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="w-5 h-5" strokeWidth={1.5} />
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-white hover:text-gray-900 flex items-center justify-center transition-all duration-300 group"
                                    aria-label="Twitter"
                                >
                                    <Twitter className="w-5 h-5" strokeWidth={1.5} />
                                </a>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-7-5z" />
                                    </svg>
                                </div>
                                <span>Sichere Zahlung</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                                    </svg>
                                </div>
                                <span>Kostenloser Versand</span>
                            </div>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-sm font-semibold mb-5 tracking-wide uppercase text-gray-300">
                            Shop
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/catalog" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Alle Produkte
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Neuheiten
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Angebote
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Bestseller
                                </Link>
                            </li>
                            <li>
                                <Link href="/wishlist" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Wunschliste
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Information */}
                    <div>
                        <h4 className="text-sm font-semibold mb-5 tracking-wide uppercase text-gray-300">
                            Kundenservice
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Über uns
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Lieferung & Zahlung
                                </Link>
                            </li>
                            <li>
                                <Link href="/widerruf" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Rückgabe & Umtausch
                                </Link>
                            </li>
                            <li>
                                <Link href="/contacts" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Kontakt & FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Geschenkgutscheine
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Contact */}
                    <div>
                        <h4 className="text-sm font-semibold mb-5 tracking-wide uppercase text-gray-300">
                            Rechtliches
                        </h4>
                        <ul className="space-y-3 mb-6">
                            <li>
                                <Link href="/impressum" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Impressum
                                </Link>
                            </li>
                            <li>
                                <Link href="/datenschutz" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    Datenschutz
                                </Link>
                            </li>
                            <li>
                                <Link href="/agb" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></span>
                                    AGB
                                </Link>
                            </li>
                        </ul>

                        {/* Contact Info */}
                        <div className="space-y-3 pt-4 border-t border-gray-800">
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                <span>+49 (123) 456-7890</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                <span>info@elegance-beauty.de</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                <span>Berlin, Musterstraße 10</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                <span>Mo-So: 9:00 — 21:00</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="border-t border-gray-800 pt-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                                Sichere Zahlungsmethoden
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">VISA</span>
                                </div>
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">Mastercard</span>
                                </div>
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">PayPal</span>
                                </div>
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">Klarna</span>
                                </div>
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">Apple Pay</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-right">
                                Versandpartner
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">DHL</span>
                                </div>
                                <div className="h-8 px-3 bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-semibold text-gray-300">DPD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            © 2025 Élégance. Alle Rechte vorbehalten.
                        </p>
                        <p className="text-xs text-gray-600">
                            Made with ♥ in Berlin
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}