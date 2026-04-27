-- RBAC and Data Isolation Setup Migration

-- 1. Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'User';
ALTER TABLE users ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_admin_id INTEGER REFERENCES users(id);

-- 2. Update host_information table
ALTER TABLE host_information ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 3. Update properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 4. Update reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 5. Update invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 6. Optional: Update existing records to be owned by the first admin if exists, or a default user
DO $$
DECLARE
    first_admin_id INTEGER;
BEGIN
    SELECT id INTO first_admin_id FROM users WHERE role = 'Super Admin' LIMIT 1;
    
    IF first_admin_id IS NOT NULL THEN
        UPDATE host_information SET created_by = first_admin_id WHERE created_by IS NULL;
        UPDATE properties SET created_by = first_admin_id WHERE created_by IS NULL;
        UPDATE reservations SET created_by = first_admin_id WHERE created_by IS NULL;
        UPDATE invoices SET created_by = first_admin_id WHERE created_by IS NULL;
    END IF;
END $$;
