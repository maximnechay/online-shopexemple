// lib/security/audit-log.ts
import { createServerSupabaseAdminClient } from '@/lib/supabase/server';

export type AuditAction =
    | 'product.create'
    | 'product.update'
    | 'product.delete'
    | 'category.create'
    | 'category.update'
    | 'category.delete'
    | 'order.create'
    | 'order.update'
    | 'order.cancel'
    | 'settings.update'
    | 'payment_settings.update'
    | 'newsletter.send'
    | 'sms.send'
    | 'user.login'
    | 'user.logout'
    | 'admin.access';

export interface AuditLogEntry {
    action: AuditAction;
    userId?: string;
    userEmail?: string;
    resourceType?: string;
    resourceId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

/**
 * Создаёт запись в audit log
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
        const supabase = createServerSupabaseAdminClient();

        const logEntry = {
            action: entry.action,
            user_id: entry.userId || null,
            user_email: entry.userEmail || null,
            resource_type: entry.resourceType || null,
            resource_id: entry.resourceId || null,
            changes: entry.changes || null,
            ip_address: entry.ipAddress || null,
            user_agent: entry.userAgent || null,
            metadata: entry.metadata || null,
            created_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert([logEntry]);

        if (error) {
            console.error('Failed to create audit log:', error);
        }
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
}

/**
 * Получить audit logs с фильтрацией
 */
export async function getAuditLogs(filters?: {
    action?: AuditAction;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}) {
    try {
        const supabase = createServerSupabaseAdminClient();

        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.action) {
            query = query.eq('action', filters.action);
        }

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }

        if (filters?.resourceType) {
            query = query.eq('resource_type', filters.resourceType);
        }

        if (filters?.resourceId) {
            query = query.eq('resource_id', filters.resourceId);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate.toISOString());
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate.toISOString());
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        } else {
            query = query.limit(100);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Failed to fetch audit logs:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}
