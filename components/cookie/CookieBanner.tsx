'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleClose = () => {
    // If user closes without making a choice, treat as essential only
    acceptEssential();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-3xl w-full mx-4 mb-0 sm:mb-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              🍪 Cookie-Einstellungen
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            Wir verwenden Cookies, um Ihnen ein optimales Website-Erlebnis zu bieten. Dazu zählen
            Cookies, die für den Betrieb der Seite notwendig sind, sowie solche, die zu Statistik-
            und Marketingzwecken genutzt werden.
          </p>

          {showDetails && (
            <div className="mb-6 space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Erforderliche Cookies</h3>
                  <span className="text-sm text-green-600 font-medium">Immer aktiv</span>
                </div>
                <p className="text-sm text-gray-600">
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können
                  nicht deaktiviert werden. Sie werden in der Regel nur als Reaktion auf von Ihnen
                  vorgenommene Aktionen gesetzt, wie z.B. das Festlegen Ihrer Datenschutzeinstellungen,
                  das Anmelden oder das Ausfüllen von Formularen.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Analyse-Cookies</h3>
                  <span className="text-sm text-gray-500 font-medium">Optional</span>
                </div>
                <p className="text-sm text-gray-600">
                  Diese Cookies ermöglichen es uns, Besuche und Verkehrsquellen zu zählen, damit wir
                  die Leistung unserer Website messen und verbessern können. Sie helfen uns zu
                  verstehen, welche Seiten am beliebtesten sind und wie sich Besucher auf der Website
                  bewegen.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Marketing-Cookies</h3>
                  <span className="text-sm text-gray-500 font-medium">Optional</span>
                </div>
                <p className="text-sm text-gray-600">
                  Diese Cookies können über unsere Website von unseren Werbepartnern gesetzt werden.
                  Sie können verwendet werden, um ein Profil Ihrer Interessen zu erstellen und Ihnen
                  relevante Werbung auf anderen Websites zu zeigen.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 underline"
          >
            {showDetails ? 'Weniger anzeigen' : 'Mehr erfahren'}
          </button>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={acceptAll}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Alle akzeptieren
            </button>
            <button
              onClick={acceptEssential}
              className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Nur erforderliche
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Weitere Informationen finden Sie in unserer{' '}
            <Link
              href="/datenschutz"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Datenschutzerklärung
            </Link>
            {' '}und{' '}
            <Link
              href="/impressum"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Impressum
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
