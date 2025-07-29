/*
  # Rebuild ASOSTORE - Complete System Migration

  1. New Tables
    - `students` - Student information with financial tracking
    - `transactions` - All financial transactions (deposits/expenses)
    - `stock_items` - Inventory management
    - `purchases` - Purchase history linking students and stock
    - `users` - Authentication (Supabase Auth integration)
    - `user_roles` - Role-based access control

  2. Security
    - Enable RLS on all tables
    - Public access for balance checking
    - Admin-only access for management functions
    - Proper foreign key relationships with cascade deletes

  3. Features
    - Student balance checking (no login required)
    - Admin authentication and dashboard
    - Transaction management with automatic balance updates
    - Stock management with purchase tracking
    - Profit calculation and reporting
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admission_no text UNIQUE NOT NULL,
  class_code text NOT NULL CHECK (class_code IN ('S1', 'S2', 'D1', 'D3')),
  balance numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_payment timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'expense')),
  method text NOT NULL CHECK (method IN ('online', 'bycash', 'credit')),
  item_name text,
  note text,
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create stock_items table
CREATE TABLE stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  cost_price numeric NOT NULL CHECK (cost_price >= 0),
  selling_price numeric NOT NULL CHECK (selling_price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchases table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_roles table for admin access
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_students_admission_no ON students(admission_no);
CREATE INDEX idx_students_class_code ON students(class_code);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_purchases_student_id ON purchases(student_id);
CREATE INDEX idx_purchases_item_id ON purchases(item_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students (public read access for balance checking)
CREATE POLICY "Public can view students for balance checking"
  ON students FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for transactions (admin only)
CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for stock_items (admin only)
CREATE POLICY "Admins can manage stock items"
  ON stock_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for purchases (admin only)
CREATE POLICY "Admins can manage purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to update student balances after transaction
CREATE OR REPLACE FUNCTION update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update student balance based on transaction type
    IF NEW.type = 'deposit' THEN
      UPDATE students 
      SET 
        balance = balance + NEW.amount,
        total_paid = total_paid + NEW.amount,
        last_payment = NEW.created_at,
        updated_at = now()
      WHERE id = NEW.student_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE students 
      SET 
        balance = balance - NEW.amount,
        total_spent = total_spent + NEW.amount,
        updated_at = now()
      WHERE id = NEW.student_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update student balance
CREATE TRIGGER trigger_update_student_balance
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_balance();

-- Function to handle purchase and update stock
CREATE OR REPLACE FUNCTION process_purchase()
RETURNS TRIGGER AS $$
DECLARE
  item_cost_price numeric;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get cost price for profit calculation
    SELECT cost_price INTO item_cost_price
    FROM stock_items
    WHERE id = NEW.item_id;
    
    -- Calculate profit
    NEW.profit = (NEW.unit_price - item_cost_price) * NEW.quantity;
    
    -- Update stock quantity
    UPDATE stock_items
    SET 
      quantity = quantity - NEW.quantity,
      updated_at = now()
    WHERE id = NEW.item_id;
    
    -- Update student balance and total_spent
    UPDATE students
    SET 
      balance = balance - NEW.total_price,
      total_spent = total_spent + NEW.total_price,
      updated_at = now()
    WHERE id = NEW.student_id;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchase processing
CREATE TRIGGER trigger_process_purchase
  BEFORE INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION process_purchase();

-- Insert sample data for testing
INSERT INTO students (name, admission_no, class_code, balance, total_paid, total_spent) VALUES
  ('John Doe', 'S1001', 'S1', 1500.00, 2000.00, 500.00),
  ('Jane Smith', 'S1002', 'S1', 800.00, 1000.00, 200.00),
  ('Mike Johnson', 'S2001', 'S2', 1200.00, 1500.00, 300.00),
  ('Sarah Wilson', 'S2002', 'S2', 600.00, 800.00, 200.00),
  ('David Brown', 'D1001', 'D1', 2000.00, 2500.00, 500.00),
  ('Lisa Davis', 'D1002', 'D1', 900.00, 1200.00, 300.00),
  ('Tom Anderson', 'D3001', 'D3', 1100.00, 1400.00, 300.00),
  ('Emma Taylor', 'D3002', 'D3', 750.00, 1000.00, 250.00);

-- Insert sample stock items
INSERT INTO stock_items (item_name, quantity, cost_price, selling_price) VALUES
  ('Notebook', 100, 25.00, 35.00),
  ('Pen', 200, 5.00, 10.00),
  ('Pencil', 150, 3.00, 7.00),
  ('Eraser', 80, 2.00, 5.00),
  ('Ruler', 60, 8.00, 15.00),
  ('Calculator', 30, 150.00, 200.00),
  ('Lunch Box', 40, 80.00, 120.00),
  ('Water Bottle', 50, 45.00, 70.00);

-- Insert sample transactions
INSERT INTO transactions (student_id, amount, type, method, item_name, admin_id) 
SELECT 
  s.id,
  500.00,
  'deposit',
  'online',
  'Initial deposit',
  NULL
FROM students s
WHERE s.admission_no IN ('S1001', 'S2001', 'D1001');

INSERT INTO transactions (student_id, amount, type, method, item_name, admin_id)
SELECT 
  s.id,
  35.00,
  'expense',
  'credit',
  'Notebook purchase',
  NULL
FROM students s
WHERE s.admission_no = 'S1001';