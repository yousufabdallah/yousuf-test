/*
  # Add updated_at column and trigger to invoices table

  1. Changes
    - Add `updated_at` column to invoices table
    - Add trigger to automatically update `updated_at` on row updates
*/

-- Add updated_at column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
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