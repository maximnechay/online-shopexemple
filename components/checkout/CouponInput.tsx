// components/checkout/CouponInput.tsx
'use client';

import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';

interface CouponInputProps {
  orderAmount: number;
  onCouponApplied: (discount: number, code: string, type: string) => void;
  onCouponRemoved: () => void;
}

export default function CouponInput({
  orderAmount,
  onCouponApplied,
  onCouponRemoved,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: string;
  } | null>(null);
  const [error, setError] = useState('');

  // Перевод ошибок с русского на немецкий
  const translateError = (errorMessage: string): string => {
    const translations: Record<string, string> = {
      'Купон не найден': 'Gutschein nicht gefunden',
      'Купон неактивен': 'Gutschein ist inaktiv',
      'Купон еще не активирован': 'Gutschein ist noch nicht aktiv',
      'Срок действия купона истек': 'Gutschein ist abgelaufen',
      'Купон исчерпан': 'Gutschein ist ausgeschöpft',
      'Вы уже использовали этот купон максимальное количество раз': 'Sie haben diesen Gutschein bereits die maximale Anzahl verwendet',
    };

    // Проверяем на минимальную сумму заказа (динамическое сообщение)
    if (errorMessage.includes('Минимальная сумма заказа')) {
      const match = errorMessage.match(/€(\d+(\.\d+)?)/);
      if (match) {
        return `Mindestbestellwert für diesen Gutschein: €${match[1]}`;
      }
    }

    return translations[errorMessage] || errorMessage;
  };

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Bitte Gutscheincode eingeben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          orderAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(translateError(data.error) || 'Ungültiger Gutschein');
        setLoading(false);
        return;
      }

      // Купон валиден
      setAppliedCoupon({
        code: code.trim().toUpperCase(),
        discount: data.discountAmount,
        type: data.couponType,
      });

      onCouponApplied(data.discountAmount, code.trim().toUpperCase(), data.couponType);
      setCode('');
      setError('');
    } catch (err) {
      console.error('Coupon validation error:', err);
      setError('Fehler bei der Überprüfung');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode('');
    setError('');
    onCouponRemoved();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Gutschein angewendet: <span className="font-mono font-bold">{appliedCoupon.code}</span>
              </div>
              <div className="text-sm text-green-600">
                {appliedCoupon.type === 'free_shipping'
                  ? 'Kostenlose Lieferung'
                  : `Rabatt: ${formatAmount(appliedCoupon.discount)}`}
              </div>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Gutschein entfernen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
        <Tag className="w-4 h-4" />
        <span>Gutscheincode</span>
      </label>
      
      <div className="flex flex-col space-y-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="CODE EINGEBEN"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent uppercase font-mono text-sm ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Prüfen...</span>
            </>
          ) : (
            <span>Anwenden</span>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Code eingeben für Rabatt
      </p>
    </div>
  );
}
