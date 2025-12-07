# 🚨 Security Incident Response - Service Role Key Leak

## Incident Details
- **Date Detected**: December 7, 2025
- **Severity**: CRITICAL
- **Type**: Supabase Service Role JWT exposed in public GitHub repository
- **Affected File**: `test-create-cart.ts`
- **Status**: ⚠️ REQUIRES IMMEDIATE ACTION

---

## 🔴 IMMEDIATE ACTIONS REQUIRED

### 1. Rotate Supabase Service Role Key (DO THIS FIRST!)

1. **Login to Supabase Dashboard**:
   ```
   https://app.supabase.com/project/ftnesgtxepluwpicbydh/settings/api
   ```

2. **Navigate to**: Project Settings → API

3. **Rotate the Service Role Key**:
   - Click "Reset Service Key" or "Rotate Keys"
   - Save the new key securely

4. **Update Environment Variables**:
   
   **Locally** (`.env.local`):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
   ```

   **On Vercel/Hosting**:
   - Go to your project settings
   - Update `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - Redeploy the application

---

## ✅ Code Changes Applied

### 1. Fixed `test-create-cart.ts`
- ✅ Removed hardcoded Service Role Key
- ✅ Now uses environment variables
- ✅ Added validation checks

### 2. Updated `.gitignore`
- ✅ Added `test-*.ts` to ignore list
- ✅ Added `test-*.js` to ignore list
- ✅ Added `apply-admin-security.js` to ignore list

---

## 🔍 What Was Exposed?

The exposed Service Role Key provides:
- **Full database access** (bypassing Row Level Security)
- **Admin privileges** on all tables
- **Ability to read/write/delete** any data
- **Access to user credentials and orders**

---

## 📋 Post-Incident Checklist

- [ ] **Service Role Key rotated in Supabase**
- [ ] **New key added to `.env.local`**
- [ ] **New key deployed to production (Vercel/hosting)**
- [ ] **Test that application works with new key**
- [ ] **Commit and push security fixes**
- [ ] **Remove test files from Git history** (optional but recommended)
- [ ] **Monitor Supabase logs** for suspicious activity
- [ ] **Review database for unauthorized changes**
- [ ] **Enable Supabase audit logging**

---

## 🛡️ Prevention Measures

### 1. Never Hardcode Secrets
```typescript
// ❌ NEVER DO THIS
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ✅ ALWAYS DO THIS
const apiKey = process.env.API_KEY;
```

### 2. Use `.gitignore`
Ensure sensitive files are ignored:
```gitignore
# Environment files
.env
.env*.local

# Test files with credentials
test-*.ts
test-*.js
```

### 3. Use Environment Variables
Create `.env.local.example` for documentation:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Setup Pre-commit Hooks
Install `git-secrets` or similar tools to scan for credentials:
```bash
npm install -D @commitlint/cli husky
npx husky install
```

### 5. Enable GitHub Secret Scanning
- Go to Repository Settings → Security
- Enable "Secret scanning"
- Enable "Push protection"

---

## 🔐 Service Role Key Usage Guidelines

### When to Use Service Role Key:
- ✅ Server-side API routes only
- ✅ Cron jobs / Edge functions
- ✅ Admin operations that need to bypass RLS
- ✅ System-level operations

### When NOT to Use:
- ❌ NEVER in client-side code
- ❌ NEVER hardcoded in files
- ❌ NEVER in test files committed to Git
- ❌ NEVER shared via email/chat

### Safe Usage Pattern:
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

---

## 📞 Support Resources

- **Supabase Security Docs**: https://supabase.com/docs/guides/platform/going-into-prod#security
- **GitHub Secret Scanning**: https://docs.github.com/en/code-security/secret-scanning
- **Git History Cleanup**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

## 📝 Incident Timeline

1. **2025-12-07**: GitGuardian detected exposed Service Role JWT
2. **2025-12-07**: Security fix applied to `test-create-cart.ts`
3. **2025-12-07**: Updated `.gitignore` to prevent future leaks
4. **2025-12-07**: ⏳ **AWAITING**: Service Role Key rotation

---

## ⚠️ NEXT STEPS

**YOU MUST**:
1. Go to Supabase Dashboard NOW
2. Rotate the Service Role Key
3. Update all environment variables
4. Test the application
5. Mark incident as resolved

**DO NOT**:
- Ignore this warning
- Delay key rotation
- Commit the old key anywhere else
- Share keys in chat/email

---

*Generated: 2025-12-07*
*Status: REQUIRES ACTION*
