export interface Student {
  id: string
  name: string
  admission_no: string
  class_code: 'S1' | 'S2' | 'D1' | 'D3'
  balance: number
  total_paid: number
  total_spent: number
  last_payment?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  student_id: string
  amount: number
  type: 'deposit' | 'expense'
  method: 'online' | 'bycash' | 'credit'
  item_name?: string
  note?: string
  admin_id?: string
  created_at: string
  student?: Student
}

export interface StockItem {
  id: string
  item_name: string
  quantity: number
  cost_price: number
  selling_price: number
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  student_id: string
  item_id: string
  quantity: number
  unit_price: number
  total_price: number
  profit: number
  created_at: string
  student?: Student
  item?: StockItem
}

export interface UserRole {
  id: string
  user_id: string
  role: 'admin'
  created_at: string
}

export interface DashboardStats {
  totalStudents: number
  totalDeposits: number
  totalExpenses: number
  netProfit: number
  totalStockValue: number
  recentTransactions: Transaction[]
}