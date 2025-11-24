// components/analytics/GoogleAnalytics.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

interface GoogleAnalyticsProps {
    measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    const pathname = usePathname();
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        // ⭐ Проверяем cookie consent
        const checkConsent = () => {
            try {
                const savedConsent = localStorage.getItem('harmonie_cookie_consent');
                if (savedConsent) {
                    const consent = JSON.parse(savedConsent);
                    setHasConsent(consent.analytics === true);
                }
            } catch (e) {
                setHasConsent(false);
            }
        };

        // Проверяем сразу
        checkConsent();

        // Слушаем изменения consent
        const handleStorageChange = () => {
            checkConsent();
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event когда пользователь меняет настройки
        window.addEventListener('cookie-consent-changed', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cookie-consent-changed', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (hasConsent && typeof window.gtag !== 'undefined') {
            window.gtag('config', measurementId, {
                page_path: pathname,
            });
        }
    }, [pathname, measurementId, hasConsent]);

    // ⭐ НЕ загружаем GA если нет согласия
    if (!hasConsent) {
        return null;
    }

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
                        gtag('config', '${measurementId}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    );
}