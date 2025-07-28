/*
  # Complete ASOSTORE System Migration

  1. New Tables
    - `students` - Student accounts with balances and totals
    - `transactions` - All financial transactions (deposits/expenses)
    - `stock_items` - Inventory management
    - `purchases` - Purchase history linking students and stock
    - `user_roles` - Admin role management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admin roles
    - Secure admin-only operations

  3. Features
    - Complete transaction tracking
    - Stock management with profit calculations
    - Purchase history with inventory updates
    - Role-based access control
*/

-- Create user roles table for admin management
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Update students table structure
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_number text UNIQUE NOT NULL,
  name text NOT NULL,
  class text NOT NULL,
  balance numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'expense')),
  method text NOT NULL CHECK (method IN ('online', 'bycash', 'credit')),
  amount numeric NOT NULL,
  description text,
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create stock_items table
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL,
  selling_price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for students
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all students"
  ON students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view students for lookup"
  ON students FOR SELECT
  TO public
  USING (true);

-- RLS Policies for transactions
CREATE POLICY "Students can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for stock_items
CREATE POLICY "Everyone can view stock items"
  ON stock_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage stock items"
  ON stock_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for purchases
CREATE POLICY "Students can view own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_id ON purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO students (admission_number, name, class, balance, total_paid, total_spent) VALUES
('S1001', 'John Doe', 'S1', 1500, 2000, 500),
('S1002', 'Jane Smith', 'S1', 2000, 2500, 500),
('S2001', 'Mike Johnson', 'S2', 1200, 1800, 600),
('S2002', 'Sarah Wilson', 'S2', 800, 1500, 700),
('D1001', 'Alex Brown', 'D1', 1800, 2200, 400),
('D1002', 'Emily Davis', 'D1', 1000, 1600, 600),
('D3001', 'Chris Miller', 'D3', 2200, 2800, 600),
('D3002', 'Lisa Garcia', 'D3', 1600, 2100, 500)
ON CONFLICT (admission_number) DO NOTHING;

-- Insert sample stock items
INSERT INTO stock_items (name, quantity, cost_price, selling_price) VALUES
('Notebook', 50, 25, 35),
('Pen', 100, 5, 10),
('Pencil', 75, 3, 7),
('Eraser', 60, 2, 5),
('Ruler', 40, 8, 15),
('Calculator', 20, 150, 200),
('Water Bottle', 30, 50, 80),
('Snacks Pack', 80, 20, 30)
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (student_id, type, method, amount, description) 
SELECT 
  s.id,
  'deposit',
  'online',
  500,
  'Initial deposit'
FROM students s
WHERE s.admission_number IN ('S1001', 'S2001', 'D1001', 'D3001')
ON CONFLICT DO NOTHING;