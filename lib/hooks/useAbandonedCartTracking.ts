// lib/hooks/useAbandonedCartTracking.ts
'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuth } from '@/lib/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 минут
const SAVE_DEBOUNCE = 30 * 1000; // 30 секунд

export function useAbandonedCartTracking() {
    const { items, getTotal } = useCartStore();
    const { user } = useAuth();
    const inactivityTimerRef = useRef<NodeJS.Timeout>();
    const saveTimerRef = useRef<NodeJS.Timeout>();
    const lastSavedRef = useRef<string>('');

    const saveAbandonedCart = async () => {
        // Проверка: есть ли товары в корзине
        if (items.length === 0) return;

        // Получить email (из пользователя или localStorage для гостей)
        const email = user?.email || localStorage.getItem('guest_email');
        if (!email) return;

        const total = getTotal();

        // Проверка: не сохраняли ли мы уже эту корзину
        const cartHash = JSON.stringify({ items: items.map(i => i.product.id), total });
        if (cartHash === lastSavedRef.current) return;

        try {
            // Подготовить данные корзины
            const cartItems = items.map(item => ({
                product_id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.images?.[0] || '',
            }));

            // Получить UTM параметры
            const urlParams = new URLSearchParams(window.location.search);
            const utmParams = {
                source: urlParams.get('utm_source') || undefined,
                medium: urlParams.get('utm_medium') || undefined,
                campaign: urlParams.get('utm_campaign') || undefined,
            };

            // Отправить на сервер
            const response = await fetch('/api/abandoned-cart/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    cartItems,
                    cartTotal: total,
                    utmParams,
                }),
            });

            if (response.ok) {
                lastSavedRef.current = cartHash;
                console.log('✅ Abandoned cart saved');
            }
        } catch (error) {
            console.error('Failed to save abandoned cart:', error);
        }
    };

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            saveAbandonedCart();
        }, INACTIVITY_TIMEOUT);
    };

    const scheduleSave = () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            saveAbandonedCart();
        }, SAVE_DEBOUNCE);
    };

    useEffect(() => {
        // Сохранять при изменении корзины (с дебаунсом)
        if (items.length > 0) {
            scheduleSave();
        }

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [items]);

    useEffect(() => {
        // Отслеживание активности пользователя
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        // Запустить таймер при монтировании
        resetInactivityTimer();

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Сохранять при закрытии страницы
        const handleBeforeUnload = () => {
            if (items.length > 0) {
                // Используем sendBeacon для надежной отправки
                const email = user?.email || localStorage.getItem('guest_email');
                if (!email) return;

                const cartItems = items.map(item => ({
                    product_id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.images?.[0] || '',
                }));

                const data = JSON.stringify({
                    email,
                    cartItems,
                    cartTotal: getTotal(),
                });

                navigator.sendBeacon('/api/abandoned-cart/save', data);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [items, user]);
}
