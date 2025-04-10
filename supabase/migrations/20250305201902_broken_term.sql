/*
  # Create events table

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `events` table
    - Add policies for authenticated users to manage their own events
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own events"
  ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);