'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Shield, BarChart3, Target } from 'lucide-react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('harmonie_cookie_consent');
    if (!savedConsent) {
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
      } catch (e) {
        setTimeout(() => setShowBanner(true), 1000);
      }
    }
  }, []);

  const saveConsent = (consentData: typeof consent) => {
    const consentWithTimestamp = {
      ...consentData,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem('harmonie_cookie_consent', JSON.stringify(consentWithTimestamp));
    setConsent(consentData);
    setShowBanner(false);
    setShowModal(false);

    // ⭐ ДОБАВЬТЕ ЭТИ 2 СТРОКИ:
    window.dispatchEvent(new Event('cookie-consent-changed'));
    if (consentData.analytics) {
      window.location.reload();
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const acceptEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  const saveSettings = () => {
    saveConsent(consent);
  };

  const toggleConsent = (category: keyof typeof consent) => {
    if (category === 'necessary') return;
    setConsent((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {/* Bottom Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-r from-zinc-900 to-black backdrop-blur-xl border-t border-amber-500/20 shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1 text-zinc-100">
                <p className="text-sm font-light leading-relaxed">
                  <strong className="font-semibold text-amber-500">Wir verwenden Cookies</strong>
                  <br className="md:hidden" />
                  <span className="hidden md:inline"> – </span>
                  Wir nutzen Cookies auf unserer Website. Einige von ihnen sind essenziell, während andere uns helfen,
                  diese Website und Ihre Erfahrung zu verbessern.{' '}
                  <Link
                    href="/datenschutz"
                    className="text-amber-500 hover:text-amber-400 underline decoration-amber-500/30 underline-offset-2 transition-colors"
                  >
                    Datenschutzerklärung
                  </Link>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={acceptAll}
                  className="px-8 py-3 text-xs font-semibold uppercase tracking-wider bg-amber-600 text-black hover:bg-amber-500 transition-all duration-300 whitespace-nowrap shadow-lg shadow-amber-600/25"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowBanner(false);
                  }}
                  className="px-8 py-3 text-xs font-semibold uppercase tracking-wider bg-transparent text-amber-500 border border-amber-600 hover:bg-amber-600 hover:text-black transition-all duration-300 whitespace-nowrap"
                >
                  Einstellungen
                </button>
                <button
                  onClick={acceptEssential}
                  className="px-8 py-3 text-xs font-semibold uppercase tracking-wider bg-transparent text-zinc-300 border border-zinc-700 hover:border-zinc-500 transition-all duration-300 whitespace-nowrap"
                >
                  Nur Notwendige
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-zinc-50 to-amber-50/30 px-8 py-8 border-b border-amber-100">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-700 transition-all duration-200 hover:rotate-90"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>

              <h3
                className="text-3xl font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Cookie-Einstellungen
              </h3>
              <p className="text-sm text-gray-600 font-light">
                Wählen Sie, welche Cookies Sie zulassen möchten
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-8 space-y-6">
              {/* Necessary Cookies */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-green-50 p-3 rounded-xl shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Notwendige Cookies</h4>
                      <div className="relative w-12 h-6 bg-green-600 rounded-full opacity-50 cursor-not-allowed">
                        <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich und können nicht
                      deaktiviert werden. Sie speichern keine persönlichen Informationen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl shrink-0">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Analyse-Cookies</h4>
                      <button
                        onClick={() => toggleConsent('analytics')}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${consent.analytics ? 'bg-amber-600' : 'bg-gray-300'
                          }`}
                        aria-label="Analyse-Cookies umschalten"
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${consent.analytics ? 'right-0.5' : 'left-0.5'
                            }`}
                        ></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem
                      Informationen anonym gesammelt und weitergegeben werden.
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-50 p-3 rounded-xl shrink-0">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Marketing-Cookies</h4>
                      <button
                        onClick={() => toggleConsent('marketing')}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${consent.marketing ? 'bg-amber-600' : 'bg-gray-300'
                          }`}
                        aria-label="Marketing-Cookies umschalten"
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${consent.marketing ? 'right-0.5' : 'left-0.5'
                            }`}
                        ></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      Marketing-Cookies werden verwendet, um Besuchern relevante Anzeigen und Marketingkampagnen
                      bereitzustellen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferences Cookies */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="bg-orange-50 p-3 rounded-xl shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Präferenz-Cookies</h4>
                      <button
                        onClick={() => toggleConsent('preferences')}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${consent.preferences ? 'bg-amber-600' : 'bg-gray-300'
                          }`}
                        aria-label="Präferenz-Cookies umschalten"
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${consent.preferences ? 'right-0.5' : 'left-0.5'
                            }`}
                        ></div>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 font-light leading-relaxed">
                      Präferenz-Cookies ermöglichen es einer Website, sich Informationen zu merken, die das Verhalten
                      oder Aussehen der Website ändern.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-zinc-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptEssential}
                className="flex-1 px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-transparent text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                Nur Notwendige
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-6 py-3 text-xs font-semibold uppercase tracking-wider bg-amber-600 text-black hover:bg-amber-500 transition-all duration-300 shadow-lg shadow-amber-600/25"
              >
                Auswahl speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
