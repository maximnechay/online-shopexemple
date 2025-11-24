-- Migration: Security Tables
-- Таблицы для audit logs, processed payments, и idempotency keys

-- Таблица audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    user_id UUID,
    user_email TEXT,
    resource_type TEXT,
    resource_id TEXT,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Таблица обработанных платежей (для предотвращения дублирования)
CREATE TABLE IF NOT EXISTS processed_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    order_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для processed_payments
CREATE INDEX IF NOT EXISTS idx_processed_payments_payment_id ON processed_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_processed_payments_order_id ON processed_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_processed_payments_provider ON processed_payments(provider);

-- Таблица idempotency keys (для предотвращения дублирования запросов)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    response JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для idempotency_keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Функция для автоматического удаления истёкших idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
    DELETE FROM idempotency_keys WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS политики
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Только service_role может работать с этими таблицами
CREATE POLICY "Service role full access to audit_logs"
    ON audit_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to processed_payments"
    ON processed_payments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access to idempotency_keys"
    ON idempotency_keys FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Комментарии
COMMENT ON TABLE audit_logs IS 'Audit log для всех административных действий';
COMMENT ON TABLE processed_payments IS 'Таблица для отслеживания обработанных платежей и предотвращения дублирования';
COMMENT ON TABLE idempotency_keys IS 'Таблица для хранения idempotency keys и предотвращения дублирования запросов';
