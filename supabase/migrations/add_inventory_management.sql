-- Migration: Add Inventory Management System
-- Description: Adds payment_id, stock constraints, and stock_logs table for audit trail

-- 1. Add payment_id to orders table (unique to prevent duplicate processing)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT UNIQUE;

COMMENT ON COLUMN orders.payment_id IS 'Unique payment ID from Stripe/PayPal to prevent duplicate processing';

-- 2. Add check constraint to products.stock_quantity (cannot be negative)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_stock_quantity_non_negative'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_stock_quantity_non_negative 
        CHECK (stock_quantity >= 0);
    END IF;
END $$;

-- 3. Add check constraint to order_items.quantity (must be positive)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'order_items_quantity_positive'
    ) THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_quantity_positive 
        CHECK (quantity > 0);
    END IF;
END $$;

-- 4. Create stock_logs table for audit trail
CREATE TABLE IF NOT EXISTS stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('purchase', 'refund', 'manual_adjust', 'cancelled')),
    quantity_change INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    payment_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE stock_logs IS 'Audit trail for all stock changes';
COMMENT ON COLUMN stock_logs.event_type IS 'Type of stock change: purchase (decrease), refund (increase), manual_adjust, cancelled';
COMMENT ON COLUMN stock_logs.quantity_change IS 'Change in quantity (negative for purchases, positive for refunds)';
COMMENT ON COLUMN stock_logs.stock_before IS 'Stock level before the change';
COMMENT ON COLUMN stock_logs.stock_after IS 'Stock level after the change';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_logs_product_id ON stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_order_id ON stock_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_event_type ON stock_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON stock_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 5. Add index on orders.status for better filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 6. Enable Row Level Security on stock_logs
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all stock logs
CREATE POLICY "Admin can view all stock logs"
    ON stock_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only system (service_role) can insert stock logs
CREATE POLICY "System can insert stock logs"
    ON stock_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Update RLS policies for orders to include payment_id checks
-- This is optional but recommended for additional security

COMMENT ON TABLE stock_logs IS 'Complete audit trail of inventory changes for compliance and debugging';
