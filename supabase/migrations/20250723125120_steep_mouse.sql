/*
  # Complete ASOSTORE Database Setup

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
    - Add policies for authenticated users
    - Add policies for public read access to students (for login)

  3. Sample Data
    - 8 sample students across 4 classes
    - Initial transactions for testing
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
CREATE POLICY "Students are viewable by everyone" 
  ON students FOR SELECT 
  USING (true);

CREATE POLICY "Students can be managed by authenticated users"
  ON students FOR ALL
  TO authenticated
  USING (true);

-- Create policies for transactions table
CREATE POLICY "Transactions are viewable by everyone"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Transactions can be managed by authenticated users"
  ON transactions FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample students
INSERT INTO students (admission_number, name, class, balance) VALUES
  ('ADM001', 'John Doe', 'Class 1', 1500.00),
  ('ADM002', 'Jane Smith', 'Class 1', 2300.50),
  ('ADM003', 'Mike Johnson', 'Class 2', 800.75),
  ('ADM004', 'Sarah Wilson', 'Class 2', 1200.00),
  ('ADM005', 'David Brown', 'Class 3', 950.25),
  ('ADM006', 'Lisa Davis', 'Class 3', 1750.00),
  ('ADM007', 'Tom Anderson', 'Class 4', 500.00),
  ('ADM008', 'Emma Taylor', 'Class 4', 2100.80)
ON CONFLICT (admission_number) DO NOTHING;

-- Insert sample transactions
DO $$
DECLARE
    student_record RECORD;
BEGIN
    -- Add initial credit transactions for each student
    FOR student_record IN SELECT id, balance FROM students LOOP
        INSERT INTO transactions (student_id, amount, type, reason) VALUES
        (student_record.id, student_record.balance, 'credit', 'Initial balance setup');
    END LOOP;
    
    -- Add some sample purchase transactions
    INSERT INTO transactions (student_id, amount, type, reason) VALUES
    ((SELECT id FROM students WHERE admission_number = 'ADM001'), -50.00, 'debit', 'Cafeteria purchase'),
    ((SELECT id FROM students WHERE admission_number = 'ADM001'), -25.50, 'debit', 'Stationery purchase'),
    ((SELECT id FROM students WHERE admission_number = 'ADM002'), -75.00, 'debit', 'Book purchase'),
    ((SELECT id FROM students WHERE admission_number = 'ADM003'), 200.00, 'credit', 'Balance top-up'),
    ((SELECT id FROM students WHERE admission_number = 'ADM004'), -30.00, 'debit', 'Snacks purchase'),
    ((SELECT id FROM students WHERE admission_number = 'ADM005'), -15.75, 'debit', 'Photocopy charges')
    ON CONFLICT DO NOTHING;
END $$;