-- Migration: Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Update existing users to 'active'
UPDATE users SET status = 'active' WHERE status = 'pending';

-- Ensure Super Admin is always active (just in case)
UPDATE users SET status = 'active' WHERE role = 'Super Admin';
