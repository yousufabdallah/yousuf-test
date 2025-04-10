/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text) - either 'physical' or 'subscription'
      - `stock` (integer) - for physical products
      - `purchase_price` (numeric) - for physical products
      - `selling_price` (numeric)
      - `subscription_details` (text) - for subscription products
      - `contract_duration` (text) - for subscription products
      - `created_at` (timestamp)
      - `status` (text) - 'active' or 'inactive'
      - `user_id` (uuid) - reference to auth.users

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('physical', 'subscription')),
  stock integer,
  purchase_price numeric(10,2),
  selling_price numeric(10,2) NOT NULL,
  subscription_details text,
  contract_duration text,
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);