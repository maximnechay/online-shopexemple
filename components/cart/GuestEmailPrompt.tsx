// components/cart/GuestEmailPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCartStore } from '@/lib/store/useCartStore';

export default function GuestEmailPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { items } = useCartStore();

    useEffect(() => {
        // Показать prompt если:
        // 1. Пользователь не авторизован
        // 2. Есть товары в корзине
        // 3. Email еще не сохранен
        // 4. Промпт не был закрыт в этой сессии
        if (!user && items.length > 0 && !localStorage.getItem('guest_email') && !sessionStorage.getItem('email_prompt_dismissed')) {
            // Показать через 10 секунд после добавления товара
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [user, items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Сохранить email в localStorage
            localStorage.setItem('guest_email', email);

            // Скрыть промпт
            setIsVisible(false);

            // Показать успешное сообщение (опционально)
            console.log('✅ Guest email saved:', email);
        } catch (error) {
            console.error('Failed to save email:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Не показывать в этой сессии
        sessionStorage.setItem('email_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    aria-label="Schließen"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-rose-600" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Warenkorb speichern
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Geben Sie Ihre E-Mail ein, um Ihren Warenkorb zu speichern und Erinnerungen zu erhalten.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ihre@email.de"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            />

                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 disabled:bg-gray-400 transition-colors"
                                >
                                    {isSubmitting ? 'Speichern...' : 'Speichern'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Später
                                </button>
                            </div>
                        </form>

                        <p className="text-xs text-gray-500 mt-3">
                            Wir respektieren Ihre Privatsphäre. Keine Spam-Emails.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
