/*
  # Add updated_at column to invoices table

  1. Changes
    - Add `updated_at` column to `invoices` table
    - Add trigger to automatically update `updated_at` timestamp
*/

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_updated_at' 
    AND tgrelid = 'invoices'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;