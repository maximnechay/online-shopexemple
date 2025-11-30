#!/usr/bin/env node
/**
 * Скрипт для быстрого применения security fixes ко всем admin endpoints
 * Использование: node apply-admin-security.js
 */

const fs = require('fs');
const path = require('path');

const ADMIN_ENDPOINTS = [
    'app/api/admin/categories/route.ts',
    'app/api/admin/coupons/route.ts',
    'app/api/admin/orders/route.ts',
    'app/api/admin/orders/[orderId]/route.ts',
    'app/api/admin/reviews/[id]/approve/route.ts',
    'app/api/admin/newsletter/send/route.ts',
];

const IMPORTS_TO_ADD = `import { checkAdmin } from '@/lib/auth/admin-check';
import { safeLog } from '@/lib/utils/logger';`;

const AUTH_CHECK = `    // ✅ Admin authentication
    const adminCheck = await checkAdmin(request);
    if (adminCheck instanceof NextResponse) {
        return adminCheck;
    }
    `;

console.log('🔒 Applying security fixes to admin endpoints...\n');

let fixed = 0;
let skipped = 0;

ADMIN_ENDPOINTS.forEach(endpoint => {
    const filePath = path.join(__dirname, endpoint);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipped (not found): ${endpoint}`);
        skipped++;
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Проверяем, не применена ли уже защита
    if (content.includes('checkAdmin')) {
        console.log(`✅ Already protected: ${endpoint}`);
        skipped++;
        return;
    }

    // Добавляем imports
    if (!content.includes('checkAdmin')) {
        const firstImportIndex = content.indexOf('import');
        if (firstImportIndex !== -1) {
            const endOfImports = content.indexOf('\n\n', firstImportIndex);
            content = content.slice(0, endOfImports) + '\n' + IMPORTS_TO_ADD + content.slice(endOfImports);
        }
    }

    // Добавляем auth check в каждый handler (GET, POST, PUT, DELETE)
    const handlers = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    handlers.forEach(method => {
        const regex = new RegExp(`export async function ${method}\\(request: NextRequest\\) \\{`, 'g');
        content = content.replace(regex, (match) => {
            return match + '\n' + AUTH_CHECK;
        });
    });

    // Сохраняем файл
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`🔐 Fixed: ${endpoint}`);
    fixed++;
});

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixed}`);
console.log(`   Skipped: ${skipped}`);
console.log(`\n✅ Done! Run "npm run type-check" to verify.`);
