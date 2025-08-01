/*
  # Fresh ASOSTORE Database Installation

  1. Clean Installation
    - Drop all existing tables and functions
    - Create fresh optimized structure
    - Add sample data for testing

  2. Tables Created
    - students: Student information and balances
    - transactions: All financial transactions
    - stock_items: Inventory management
    - purchases: Purchase tracking
    - user_roles: Admin access control

  3. Security
    - Row Level Security enabled
    - Public access for balance checking
    - Admin-only management functions
*/

-- Drop all existing tables and functions
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP FUNCTION IF EXISTS update_student_balance() CASCADE;
DROP FUNCTION IF EXISTS process_purchase() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Students table
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

-- Transactions table
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

-- Stock items table
CREATE TABLE stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  cost_price numeric NOT NULL CHECK (cost_price >= 0),
  selling_price numeric NOT NULL CHECK (selling_price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchases table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid REFERENCES stock_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  profit numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_students_admission_no ON students(admission_no);
CREATE INDEX idx_students_class_code ON students(class_code);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_purchases_student_id ON purchases(student_id);
CREATE INDEX idx_purchases_item_id ON purchases(item_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Add updated_at triggers
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update student balance
CREATE OR REPLACE FUNCTION update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to process purchases
CREATE OR REPLACE FUNCTION process_purchase()
RETURNS TRIGGER AS $$
DECLARE
  item_cost_price numeric;
BEGIN
  -- Get cost price for profit calculation
  SELECT cost_price INTO item_cost_price
  FROM stock_items
  WHERE id = NEW.item_id;
  
  -- Calculate profit
  NEW.profit = (NEW.unit_price - item_cost_price) * NEW.quantity;
  
  -- Update stock quantity
  UPDATE stock_items
  SET quantity = quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.item_id;
  
  -- Update student balance and total_spent
  UPDATE students
  SET balance = balance - NEW.total_price,
      total_spent = total_spent + NEW.total_price,
      updated_at = now()
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_student_balance
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_student_balance();

CREATE TRIGGER trigger_process_purchase
  BEFORE INSERT ON purchases
  FOR EACH ROW EXECUTE FUNCTION process_purchase();

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students: Public can view for balance checking
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
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Transactions: Admin only
CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Stock items: Admin only
CREATE POLICY "Admins can manage stock items"
  ON stock_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Purchases: Admin only
CREATE POLICY "Admins can manage purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User roles: Admin can view own role, admin can manage all
CREATE POLICY "Admins can view roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Insert sample data
INSERT INTO students (name, admission_no, class_code, balance, total_paid, total_spent) VALUES
('John Doe', 'S1001', 'S1', 1500, 2000, 500),
('Jane Smith', 'S1002', 'S1', 2300, 2500, 200),
('Mike Johnson', 'S2001', 'S2', 800, 1200, 400),
('Sarah Wilson', 'S2002', 'S2', 1900, 2100, 200),
('David Brown', 'D1001', 'D1', 1200, 1500, 300),
('Lisa Davis', 'D1002', 'D1', 2100, 2300, 200),
('Tom Miller', 'D3001', 'D3', 950, 1400, 450),
('Amy Garcia', 'D3002', 'D3', 1750, 2000, 250);

INSERT INTO stock_items (item_name, quantity, cost_price, selling_price) VALUES
('Notebook', 50, 25, 35),
('Pen', 100, 5, 10),
('Pencil', 75, 3, 7),
('Eraser', 60, 2, 5),
('Ruler', 40, 8, 15),
('Calculator', 20, 150, 200),
('Lunch Box', 30, 80, 120),
('Water Bottle', 45, 40, 65);