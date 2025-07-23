/*
  # Setup Admin User and Complete Database Schema

  1. Tables
    - Ensure students table exists with proper structure
    - Ensure transactions table exists with proper structure
    - Add sample data for testing

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Set up proper permissions

  3. Sample Data
    - Add test students across 4 classes
    - Add sample transactions for demonstration
*/

-- Create students table if not exists
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class text NOT NULL,
  balance decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  type text CHECK (type IN ('credit', 'debit')) NOT NULL,
  reason text NOT NULL,
  admin_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
DROP POLICY IF EXISTS "Students are viewable by everyone" ON students;
CREATE POLICY "Students are viewable by everyone"
  ON students
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Students can be managed by authenticated users" ON students;
CREATE POLICY "Students can be managed by authenticated users"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for transactions table
DROP POLICY IF EXISTS "Transactions are viewable by everyone" ON transactions;
CREATE POLICY "Transactions are viewable by everyone"
  ON transactions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Transactions can be managed by authenticated users" ON transactions;
CREATE POLICY "Transactions can be managed by authenticated users"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample students if they don't exist
INSERT INTO students (admission_number, name, class, balance) VALUES
  ('ADM001', 'John Smith', 'Class 1', 1500.00),
  ('ADM002', 'Sarah Johnson', 'Class 1', 2300.50),
  ('ADM003', 'Michael Brown', 'Class 2', 800.75),
  ('ADM004', 'Emily Davis', 'Class 2', 1200.00),
  ('ADM005', 'David Wilson', 'Class 3', 950.25),
  ('ADM006', 'Lisa Anderson', 'Class 3', 1800.00),
  ('ADM007', 'James Taylor', 'Class 4', 650.50),
  ('ADM008', 'Maria Garcia', 'Class 4', 1100.75)
ON CONFLICT (admission_number) DO NOTHING;

-- Insert sample transactions
DO $$
DECLARE
  student_record RECORD;
BEGIN
  FOR student_record IN SELECT id, admission_number FROM students LOOP
    -- Add initial credit transaction
    INSERT INTO transactions (student_id, amount, type, reason) VALUES
      (student_record.id, 1000.00, 'credit', 'Initial wallet top-up')
    ON CONFLICT DO NOTHING;
    
    -- Add some purchase transactions
    INSERT INTO transactions (student_id, amount, type, reason) VALUES
      (student_record.id, -50.00, 'debit', 'Cafeteria purchase'),
      (student_record.id, -25.50, 'debit', 'Stationery purchase')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);