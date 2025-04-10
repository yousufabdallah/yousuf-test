/*
  # Create invoices and related tables

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `number` (text, unique) - Invoice number with RESTA prefix
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `customer_address` (text)
      - `total` (numeric)
      - `status` (text) - Completed, Pending, Failed
      - `payment_method` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid) - References auth.users
    
    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid) - References invoices
      - `product_id` (uuid) - References products
      - `quantity` (integer)
      - `price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own invoices and items
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_address text,
  total numeric(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('Completed', 'Pending', 'Failed')),
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for invoice_items
CREATE POLICY "Users can view their own invoice items"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own invoice items"
  ON invoice_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );