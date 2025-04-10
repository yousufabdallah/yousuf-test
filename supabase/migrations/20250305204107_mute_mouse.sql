/*
  # Add subscription notification fields

  1. Changes
    - Add `contract_start_date` and `contract_end_date` columns to `invoice_items` table
    - These fields will help track subscription periods accurately

  2. Security
    - Maintain existing RLS policies
*/

-- Add subscription tracking columns to invoice_items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoice_items' AND column_name = 'contract_start_date'
  ) THEN
    ALTER TABLE invoice_items 
    ADD COLUMN contract_start_date timestamptz,
    ADD COLUMN contract_end_date timestamptz;
  END IF;
END $$;

-- Update function to calculate contract dates based on product duration
CREATE OR REPLACE FUNCTION calculate_contract_dates()
RETURNS TRIGGER AS $$
DECLARE
  product_duration text;
BEGIN
  -- Get the contract duration from the product
  SELECT contract_duration INTO product_duration
  FROM products
  WHERE id = NEW.product_id;

  -- Only set dates for subscription products
  IF product_duration IS NOT NULL THEN
    NEW.contract_start_date = CURRENT_TIMESTAMP;
    
    -- Calculate end date based on duration
    NEW.contract_end_date = CASE product_duration
      WHEN '1-month' THEN NEW.contract_start_date + INTERVAL '1 month'
      WHEN '3-months' THEN NEW.contract_start_date + INTERVAL '3 months'
      WHEN '6-months' THEN NEW.contract_start_date + INTERVAL '6 months'
      WHEN '1-year' THEN NEW.contract_start_date + INTERVAL '1 year'
      WHEN 'lifetime' THEN NEW.contract_start_date + INTERVAL '100 years'
      ELSE NULL
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set contract dates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_contract_dates'
  ) THEN
    CREATE TRIGGER set_contract_dates
    BEFORE INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_contract_dates();
  END IF;
END $$;