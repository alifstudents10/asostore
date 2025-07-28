export interface Student {
  id: string
  user_id?: string
  admission_number: string
  name: string
  class: string
  balance: number
  total_paid: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  student_id: string
  type: 'deposit' | 'expense'
  method: 'online' | 'bycash' | 'credit'
  amount: number
  description?: string
  admin_id?: string
  created_at: string
}

export interface StockItem {
  id: string
  name: string
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
  created_at: string
  item?: StockItem
  student?: Student
}

export interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'student'
  created_at: string
}

export interface DashboardStats {
  totalDeposits: number
  totalExpenses: number
  totalStockValue: number
  totalProfit: number
  totalStudents: number
  recentTransactions: Transaction[]
}