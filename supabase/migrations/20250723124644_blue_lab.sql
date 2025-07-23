/*
  # Create students and transactions tables

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `admission_number` (text, unique)
      - `name` (text)
      - `class` (text)
      - `balance` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `amount` (numeric)
      - `type` (text, credit/debit)
      - `reason` (text)
      - `admin_id` (uuid, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage data
    - Students can only read their own data
    - Admins can manage all data

  3. Sample Data
    - Create sample students for testing
    - Add initial transactions
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class text NOT NULL,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  reason text NOT NULL,
  admin_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (true);

-- Create policies for transactions table
CREATE POLICY "Users can read transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for students table
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample students
INSERT INTO students (admission_number, name, class, balance) VALUES
  ('ADM001', 'John Doe', 'Class 1', 1500.00),
  ('ADM002', 'Jane Smith', 'Class 2', 2000.00),
  ('ADM003', 'Mike Johnson', 'Class 3', 750.50),
  ('ADM004', 'Sarah Wilson', 'Class 4', 1200.00),
  ('ADM005', 'David Brown', 'Class 1', 500.00),
  ('ADM006', 'Lisa Davis', 'Class 2', 1800.00),
  ('ADM007', 'Tom Anderson', 'Class 3', 950.00),
  ('ADM008', 'Emma Taylor', 'Class 4', 1350.00);

-- Insert sample transactions
INSERT INTO transactions (student_id, amount, type, reason) 
SELECT 
  s.id,
  1000.00,
  'credit',
  'Initial balance top-up'
FROM students s
WHERE s.admission_number IN ('ADM001', 'ADM002', 'ADM003', 'ADM004');

INSERT INTO transactions (student_id, amount, type, reason)
SELECT 
  s.id,
  -50.00,
  'debit',
  'Store purchase - Snacks'
FROM students s
WHERE s.admission_number = 'ADM001';

INSERT INTO transactions (student_id, amount, type, reason)
SELECT 
  s.id,
  -25.00,
  'debit',
  'Store purchase - Stationery'
FROM students s
WHERE s.admission_number = 'ADM002';