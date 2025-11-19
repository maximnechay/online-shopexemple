// components/layout/Footer.tsx
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-16 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-600 rounded-full flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-serif font-light">Élégance</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Professionelle Kosmetik für Ihre natürliche Schönheit
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">Katalog</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/catalog" className="hover:text-white transition-colors">Alle Produkte</Link></li>
                            <li><Link href="/catalog" className="hover:text-white transition-colors">Neuheiten</Link></li>
                            <li><Link href="/catalog" className="hover:text-white transition-colors">Angebote</Link></li>
                            <li><Link href="/catalog" className="hover:text-white transition-colors">Bestseller</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">Information</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">Über uns</Link></li>
                            <li><Link href="/delivery" className="hover:text-white transition-colors">Lieferung & Zahlung</Link></li>
                            <li><Link href="/return" className="hover:text-white transition-colors">Rückgabe</Link></li>
                            <li><Link href="/contacts" className="hover:text-white transition-colors">Kontakt</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-4">Kontakt</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>+49 (123) 456-7890</li>
                            <li>info@elegance-beauty.de</li>
                            <li>Berlin, Musterstraße 10</li>
                            <li>Mo-So: 9:00 — 21:00</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8">
                    <p className="text-center text-sm text-gray-500">
                        © 2024 Élégance Beauty Salon. Alle Rechte vorbehalten.
                    </p>
                </div>
            </div>
        </footer>
    );
}