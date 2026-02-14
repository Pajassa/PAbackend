-- Migration to add check_in_date and check_out_date columns to invoice_items table
-- This replaces the hsn_sac_code field which was previously used for G.I.D

-- Add new columns for check-in and check-out dates
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE;

-- Optional: If you want to remove the old hsn_sac_code column (uncomment if needed)
-- ALTER TABLE invoice_items DROP COLUMN IF EXISTS hsn_sac_code;

-- Add comment to document the change
COMMENT ON COLUMN invoice_items.check_in_date IS 'Check-in date for the reservation (formerly G.I.D)';
COMMENT ON COLUMN invoice_items.check_out_date IS 'Check-out date for the reservation (formerly C.G.I.D)';
