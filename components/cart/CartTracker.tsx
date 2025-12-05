// components/cart/CartTracker.tsx
'use client';

import { useAbandonedCartTracking } from '@/lib/hooks/useAbandonedCartTracking';

export default function CartTracker() {
    useAbandonedCartTracking();
    return null;
}
