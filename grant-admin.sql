-- Grant admin role to user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Check current role
SELECT id, email, role, created_at 
FROM profiles 
WHERE email = 'marcusic1992@gmail.com';

-- Grant admin role
UPDATE profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'marcusic1992@gmail.com';

-- Verify the change
SELECT id, email, role, updated_at 
FROM profiles 
WHERE email = 'marcusic1992@gmail.com';

-- Alternative: Grant by user ID
-- UPDATE profiles
-- SET role = 'admin', updated_at = NOW()
-- WHERE id = '9e68a22a-a587-460c-a40a-39d1a9582c59';
