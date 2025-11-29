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
      {/* Professional Cookie Banner */}
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6 animate-in slide-in-from-bottom duration-500">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
              {/* Subtle top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 flex items-center justify-center ring-1 ring-amber-200/50">
                          <Shield className="w-5 h-5 text-amber-600" strokeWidth={2} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                          Diese Website verwendet Cookies
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Wir verwenden Cookies, um Inhalte zu personalisieren und die Zugriffe auf unsere Website zu analysieren. Sie können wählen, ob Sie nur essenzielle Cookies akzeptieren oder allen zustimmen möchten.{' '}
                          <Link
                            href="/datenschutz"
                            className="inline-flex items-center font-medium text-amber-600 hover:text-amber-700 transition-colors underline decoration-1 underline-offset-2 decoration-amber-600/30 hover:decoration-amber-700"
                          >
                            Weitere Informationen
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                    <button
                      onClick={() => {
                        setShowModal(true);
                        setShowBanner(false);
                      }}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                    >
                      Einstellungen
                    </button>
                    <button
                      onClick={acceptEssential}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200"
                    >
                      Nur Notwendige
                    </button>
                    <button
                      onClick={acceptAll}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 shadow-sm shadow-amber-600/20"
                    >
                      Alle akzeptieren
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Settings Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
              onClick={() => setShowModal(false)}
            />

            {/* Modal panel */}
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute right-4 top-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>

                <div className="flex items-center gap-3 pr-10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 flex items-center justify-center ring-1 ring-amber-200/50">
                    <Shield className="w-5 h-5 text-amber-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cookie-Einstellungen
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Verwalten Sie Ihre Cookie-Präferenzen
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Necessary */}
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">Notwendige Cookies</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              Immer aktiv
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                          </p>
                        </div>
                      </div>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full bg-green-500 opacity-50 transition-colors">
                        <span className="translate-x-5 inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow ring-0 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="relative rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Analyse-Cookies</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Helfen uns zu verstehen, wie Besucher mit der Website interagieren. Die Informationen werden anonym erfasst.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleConsent('analytics')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${consent.analytics ? 'bg-amber-600' : 'bg-gray-200'
                          }`}
                        role="switch"
                        aria-checked={consent.analytics}
                      >
                        <span
                          className={`${consent.analytics ? 'translate-x-5' : 'translate-x-0'
                            } inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow ring-0 transition`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="relative rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Target className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Marketing-Cookies</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Werden verwendet, um Besuchern relevante Anzeigen und Marketingkampagnen anzubieten.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleConsent('marketing')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${consent.marketing ? 'bg-amber-600' : 'bg-gray-200'
                          }`}
                        role="switch"
                        aria-checked={consent.marketing}
                      >
                        <span
                          className={`${consent.marketing ? 'translate-x-5' : 'translate-x-0'
                            } inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow ring-0 transition`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="relative rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Präferenz-Cookies</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Ermöglichen es der Website, sich Ihre Einstellungen zu merken, wie z.B. Sprache oder Region.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleConsent('preferences')}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${consent.preferences ? 'bg-amber-600' : 'bg-gray-200'
                          }`}
                        role="switch"
                        aria-checked={consent.preferences}
                      >
                        <span
                          className={`${consent.preferences ? 'translate-x-5' : 'translate-x-0'
                            } inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow ring-0 transition`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={acceptEssential}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all"
                  >
                    Nur Notwendige
                  </button>
                  <button
                    onClick={saveSettings}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all shadow-sm"
                  >
                    Auswahl speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
