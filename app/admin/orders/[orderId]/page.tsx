// app/admin/orders/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Package,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    RefreshCw,
    Save,
    Send,
    Printer,
} from 'lucide-react';

interface OrderItem {
    id: string;
    product_name: string;
    product_price: string;
    quantity: number;
}

interface Order {
    id: string;
    order_number: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    city: string;
    postal_code: string;
    delivery_method: 'delivery' | 'pickup';
    payment_method: 'card' | 'paypal' | 'cash';
    payment_status: 'pending' | 'completed' | 'paid' | 'failed' | 'refunded';
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: string;
    shipping: string;
    total: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
    paypal_transaction_id?: string | null;
    stripe_payment_intent_id?: string | null;
    order_items: OrderItem[];
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const [editableStatus, setEditableStatus] = useState('');
    const [editablePaymentStatus, setEditablePaymentStatus] = useState('');
    const [editableNotes, setEditableNotes] = useState('');

    const loadOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setEditableStatus(data.status);
                setEditablePaymentStatus(data.payment_status);
                setEditableNotes(data.notes || '');
            } else {
                console.error('Failed to load order');
            }
        } catch (error) {
            console.error('Error loading order:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editableStatus,
                    payment_status: editablePaymentStatus,
                    notes: editableNotes || null,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setOrder(updated);

                // Перезагрузить данные заказа, чтобы убедиться, что все синхронизировано
                await loadOrder();

                alert('Bestellung erfolgreich aktualisiert!');

                // Если статус изменился на processing и оплата completed - отправляем email
                if (editableStatus === 'processing' && editablePaymentStatus === 'completed') {
                    await handleSendEmail();
                }
            } else {
                alert('Fehler beim Aktualisieren der Bestellung');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Fehler beim Aktualisieren');
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async () => {
        setSendingEmail(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/send-email`, {
                method: 'POST',
            });
            const result = await res.json();

            if (result.success) {
                alert('📧 E-Mails erfolgreich gesendet!');
            } else {
                alert('⚠️ E-Mails konnten nicht gesendet werden: ' + result.message);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Fehler beim Senden der E-Mails');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Lade Bestellung...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Bestellung nicht gefunden
                        </h3>
                        <Link href="/admin/orders" className="text-rose-600 hover:text-rose-700">
                            Zurück zur Übersicht
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = order.order_items.reduce(
        (sum, item) => sum + Number(item.product_price) * item.quantity,
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Übersicht
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-light text-gray-900 mb-2">
                                Bestellung #{order.order_number || order.id.substring(0, 8).toUpperCase()}
                            </h1>
                            <p className="text-gray-600">
                                Erstellt am {new Date(order.created_at).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                <Send className="w-4 h-4" />
                                {sendingEmail ? 'Sende...' : 'E-Mail senden'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:bg-gray-400"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Speichert...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Status Section */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Status
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bestellstatus
                                    </label>
                                    <select
                                        value={editableStatus}
                                        onChange={(e) => setEditableStatus(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    >
                                        <option value="pending">Ausstehend</option>
                                        <option value="processing">In Bearbeitung</option>
                                        <option value="shipped">Versandt</option>
                                        <option value="delivered">Zugestellt</option>
                                        <option value="cancelled">Storniert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zahlungsstatus
                                    </label>
                                    <select
                                        value={editablePaymentStatus}
                                        onChange={(e) => setEditablePaymentStatus(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                    >
                                        <option value="pending">Ausstehend</option>
                                        <option value="completed">Bezahlt</option>
                                        <option value="failed">Fehlgeschlagen</option>
                                        <option value="refunded">Erstattet</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Bestellte Artikel
                            </h2>

                            <div className="divide-y divide-gray-200">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="py-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                            <p className="text-sm text-gray-600">Menge: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-gray-900">
                                                {(Number(item.product_price) * item.quantity).toFixed(2)} €
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {Number(item.product_price).toFixed(2)} € / Stück
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Zwischensumme</span>
                                    <span className="text-gray-900">{subtotal.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Versand</span>
                                    <span className="text-gray-900">
                                        {order.delivery_method === 'delivery' ? '4.99 €' : 'Kostenlos'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">MwSt. (19%)</span>
                                    <span className="text-gray-900">
                                        {(subtotal * 0.19).toFixed(2)} €
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">Gesamt</span>
                                    <span className="text-rose-600">{Number(order.total).toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Notizen
                            </h2>
                            <textarea
                                value={editableNotes}
                                onChange={(e) => setEditableNotes(e.target.value)}
                                rows={4}
                                placeholder="Interne Notizen zur Bestellung..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Right Column - Customer Info */}
                    <div className="space-y-6">

                        {/* Customer Details */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Kunde
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-600">Name</div>
                                        <div className="font-medium text-gray-900">{order.first_name} {order.last_name}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-600">E-Mail</div>
                                        <a
                                            href={`mailto:${order.email}`}
                                            className="font-medium text-rose-600 hover:text-rose-700"
                                        >
                                            {order.email}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-600">Telefon</div>
                                        <a
                                            href={`tel:${order.phone}`}
                                            className="font-medium text-gray-900"
                                        >
                                            {order.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Lieferung
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-600">Methode</div>
                                        <div className="font-medium text-gray-900">
                                            {order.delivery_method === 'delivery' ? 'Lieferung' : 'Abholung im Salon'}
                                        </div>
                                    </div>
                                </div>

                                {order.delivery_method === 'delivery' && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <div className="text-sm text-gray-600">Adresse</div>
                                            <div className="font-medium text-gray-900">
                                                {order.street} {order.house_number}<br />
                                                {order.postal_code} {order.city}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Zahlung
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm text-gray-600">Methode</div>
                                        <div className="font-medium text-gray-900">
                                            {order.payment_method === 'card' ? 'Kreditkarte' :
                                                order.payment_method === 'paypal' ? 'PayPal' :
                                                    'Barzahlung'}
                                        </div>
                                    </div>
                                </div>

                                {order.stripe_payment_intent_id && (
                                    <div className="text-xs text-gray-600 font-mono break-all">
                                        Stripe: {order.stripe_payment_intent_id}
                                    </div>
                                )}

                                {order.paypal_transaction_id && (
                                    <div className="text-xs text-gray-600 font-mono break-all">
                                        PayPal: {order.paypal_transaction_id}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
