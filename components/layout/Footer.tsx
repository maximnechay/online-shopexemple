import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-1">
                        <h2 className="text-2xl font-light mb-4 tracking-tight">Élégance</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Professionelle Kosmetik für Ihre natürliche Schönheit
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-4 tracking-wide">Katalog</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>
                                <Link href="/catalog" className="hover:text-white transition-colors">
                                    Alle Produkte
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="hover:text-white transition-colors">
                                    Neuheiten
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="hover:text-white transition-colors">
                                    Angebote
                                </Link>
                            </li>
                            <li>
                                <Link href="/catalog" className="hover:text-white transition-colors">
                                    Bestseller
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-4 tracking-wide">Information</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    Über uns
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    Lieferung & Zahlung
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    Rückgabe
                                </Link>
                            </li>
                            <li>
                                <Link href="/contacts" className="hover:text-white transition-colors">
                                    Kontakt
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium mb-4 tracking-wide">Kontakt</h4>
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
                        © 2024 Élégance. Alle Rechte vorbehalten.
                    </p>
                </div>
            </div>
        </footer>
    );
}