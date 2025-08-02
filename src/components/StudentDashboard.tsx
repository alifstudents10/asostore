import React, { useState, useEffect } from 'react'
import { User, CreditCard, TrendingUp, TrendingDown, History, Calendar, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Student, Transaction, Purchase } from '../types/database'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'deposits' | 'expenses'>('all')

  useEffect(() => {
    if (user) {
      loadStudentData()
    }
  }, [user])

  const loadStudentData = async () => {
    if (!user) return

    try {
      console.log('🔄 Loading student data for:', user.email)
      
      // Find student by email (assuming email matches admission number or we have a mapping)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('admission_no', user.email?.split('@')[0]) // Assuming email format like admission@domain.com
        .single()

      if (studentError) {
        console.error('❌ Error loading student:', studentError)
        toast.error('Student profile not found')
        return
      }

      setStudent(studentData)

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.error('❌ Error loading transactions:', transactionsError)
      } else {
        setTransactions(transactionsData || [])
      }

      // Load purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          item:stock_items(item_name)
        `)
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })

      if (purchasesError) {
        console.error('❌ Error loading purchases:', purchasesError)
      } else {
        setPurchases(purchasesData || [])
      }

      console.log('✅ Student data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading student data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    if (filter === 'deposits') return transaction.type === 'deposit'
    if (filter === 'expenses') return transaction.type === 'expense'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Profile Not Found</h2>
          <p className="text-gray-600">Your student profile could not be found. Please contact the administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {student.name}!</h1>
        <p className="text-gray-600">Admission No: {student.admission_no} • Class: {student.class_code}</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8" />
            <div>
              <p className="text-blue-100">Current Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(student.balance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8" />
            <div>
              <p className="text-green-100">Total Deposited</p>
              <p className="text-2xl font-bold">{formatCurrency(student.total_paid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <TrendingDown className="h-8 w-8" />
            <div>
              <p className="text-purple-100">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(student.total_spent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <History className="h-8 w-8" />
            <div>
              <p className="text-orange-100">Total Purchases</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'deposits' | 'expenses')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              <option value="deposits">Deposits Only</option>
              <option value="expenses">Expenses Only</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    transaction.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.type === 'deposit' ? 'Money Added' : 'Purchase/Expense'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(transaction.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{transaction.method}</span>
                    </div>
                    {transaction.note && (
                      <p className="text-sm text-gray-500 mt-1">{transaction.note}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Purchase History</h2>
        
        <div className="space-y-4">
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No purchases yet</p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <History className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {purchase.item?.item_name || 'Unknown Item'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(purchase.created_at)}</span>
                      <span>•</span>
                      <span>Quantity: {purchase.quantity}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(purchase.total_price)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(purchase.unit_price)} each
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}