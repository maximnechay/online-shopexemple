// lib/hooks/useShopSettings.ts
'use client';

import { useEffect, useState } from 'react';

export interface ShopSettings {
    shopName: string;
    shopSubtitle: string;
    supportEmail: string;
    supportPhone: string;
    addressLine: string;
    postalCode: string;
    city: string;
    country: string;
    defaultCurrency: string;
    freeShippingFrom: number | null;
    taxRate: number | null;
    homepageHeroText: string;
}

export function useShopSettings() {
    const [settings, setSettings] = useState<ShopSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch('/api/admin/settings');

                // если настроек ещё нет, просто оставляем null
                if (res.status === 404) {
                    setSettings(null);
                    return;
                }

                if (!res.ok) {
                    throw new Error('Fehler beim Laden der Einstellungen');
                }

                const data = await res.json();
                setSettings({
                    shopName: data.shopName ?? '',
                    shopSubtitle: data.shopSubtitle ?? '',
                    supportEmail: data.supportEmail ?? '',
                    supportPhone: data.supportPhone ?? '',
                    addressLine: data.addressLine ?? '',
                    postalCode: data.postalCode ?? '',
                    city: data.city ?? '',
                    country: data.country ?? '',
                    defaultCurrency: data.defaultCurrency ?? 'EUR',
                    freeShippingFrom:
                        typeof data.freeShippingFrom === 'number'
                            ? data.freeShippingFrom
                            : null,
                    taxRate:
                        typeof data.taxRate === 'number'
                            ? data.taxRate
                            : null,
                    homepageHeroText: data.homepageHeroText ?? '',
                });
            } catch (e: any) {
                console.error(e);
                setError(e.message || 'Unbekannter Fehler');
                setSettings(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return { settings, loading, error };
}
