// lib/hooks/useCSRF.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Hook для получения CSRF токена
 * Автоматически обновляется при монтировании компонента
 */
export function useCSRFToken() {
    const [token, setToken] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchToken() {
            try {
                setLoading(true);
                const response = await fetch('/api/csrf-token');

                if (!response.ok) {
                    throw new Error('Failed to fetch CSRF token');
                }

                const data = await response.json();

                if (mounted) {
                    setToken(data.token);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching CSRF token:', err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchToken();

        // Обновляем токен каждые 30 минут (до истечения)
        const interval = setInterval(fetchToken, 1800000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    return { token, loading, error };
}
