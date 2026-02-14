-- Add food_items_json column to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS food_items_json JSONB;

-- Update existing records to have a default food item structure
UPDATE invoice_items 
SET food_items_json = '[{
  "foodChargeType": "Veg Lunch",
  "foodTariff": "",
  "foodQuantity": "1",
  "foodAmount": "",
  "foodTax": "",
  "foodSGST": "",
  "foodCGST": ""
}]'::jsonb
WHERE food_items_json IS NULL;
