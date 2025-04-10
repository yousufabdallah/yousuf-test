/*
  # Add updated_at column to invoices table

  1. Changes
    - Add `updated_at` timestamp column to `invoices` table with default value of now()
    - Set default value for existing rows
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invoices 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;