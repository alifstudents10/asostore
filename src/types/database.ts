export interface Student {
  id: string
  admission_number: string
  name: string
  class: string
  balance: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  student_id: string
  amount: number
  type: 'credit' | 'debit'
  reason: string
  created_at: string
  admin_id?: string
}

export interface StudentWithTransactions extends Student {
  transactions: Transaction[]
}