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
    shippingCost: number | null;
    taxRate: number | null;
    homepageHeroText: string;



    // Контактная информация
    address: string;
    phone: string;
    email: string;
    openHours: string;
    mapEmbedUrl: string;
}

export function useShopSettings() {
    const [settings, setSettings] = useState<ShopSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/settings', {
                cache: 'no-store',
            });

            if (!response.ok) {
                // Если настройки не найдены, возвращаем дефолты
                if (response.status === 404) {
                    setSettings(getDefaultSettings());
                    return;
                }
                throw new Error('Failed to load settings');
            }

            const data = await response.json();
            setSettings(data);
        } catch (err) {
            console.error('Error loading shop settings:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            // В случае ошибки тоже показываем дефолты
            setSettings(getDefaultSettings());
        } finally {
            setLoading(false);
        }
    }

    function getDefaultSettings(): ShopSettings {
        return {
            shopName: 'Beauty Salon Shop',
            shopSubtitle: '',
            supportEmail: '',
            supportPhone: '',
            addressLine: '',
            postalCode: '',
            city: '',
            country: 'Deutschland',
            defaultCurrency: 'EUR',
            freeShippingFrom: null,
            shippingCost: 4.99,
            taxRate: null,
            homepageHeroText: '',
            address: '',
            phone: '',
            email: '',
            openHours: '',
            mapEmbedUrl: '',
        };
    }

    return {
        settings,
        loading,
        error,
        reload: loadSettings,
    };
}