// components/analytics/GoogleAnalytics.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface GoogleAnalyticsProps {
    measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    const pathname = usePathname();

    useEffect(() => {
        // Проверяем consent и обновляем GA consent mode
        const checkConsent = () => {
            if (typeof window.gtag === 'undefined') return;

            try {
                const savedConsent = localStorage.getItem('harmonie_cookie_consent');
                if (savedConsent) {
                    const consent = JSON.parse(savedConsent);

                    // Обновляем GA4 consent mode
                    window.gtag('consent', 'update', {
                        analytics_storage: consent.analytics ? 'granted' : 'denied',
                        ad_storage: consent.marketing ? 'granted' : 'denied',
                        ad_user_data: consent.marketing ? 'granted' : 'denied',
                        ad_personalization: consent.marketing ? 'granted' : 'denied',
                    });
                } else {
                    // По умолчанию все denied до согласия
                    window.gtag('consent', 'default', {
                        analytics_storage: 'denied',
                        ad_storage: 'denied',
                        ad_user_data: 'denied',
                        ad_personalization: 'denied',
                    });
                }
            } catch (e) {
                console.error('Consent check error:', e);
            }
        };

        // Проверяем consent при изменениях
        const handleConsentChange = () => {
            checkConsent();
        };

        window.addEventListener('cookie-consent-changed', handleConsentChange);

        // Проверяем сразу после загрузки GA
        const timer = setTimeout(checkConsent, 100);

        return () => {
            window.removeEventListener('cookie-consent-changed', handleConsentChange);
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (typeof window.gtag !== 'undefined') {
            window.gtag('config', measurementId, {
                page_path: pathname,
            });
        }
    }, [pathname, measurementId]);

    // Не загружать GA в development (если не указано явно)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableInDev = process.env.NEXT_PUBLIC_GA_DEBUG === 'true';

    if (isDevelopment && !enableInDev) {
        return null;
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        
                        // По умолчанию все denied
                        gtag('consent', 'default', {
                            analytics_storage: 'denied',
                            ad_storage: 'denied',
                            ad_user_data: 'denied',
                            ad_personalization: 'denied',
                        });
                        
                        gtag('config', '${measurementId}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    );
}