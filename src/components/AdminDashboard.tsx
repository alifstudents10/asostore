import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DashboardStats, Student, Transaction, StockItem, Purchase } from '../types/database'
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface AdminDashboardProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AdminDashboard({ activeTab, setActiveTab }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalDeposits: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalStockValue: 0,
    recentTransactions: []
  })
  const [students, setStudents] = useState<Student[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  // Transaction Modal State
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit' as 'deposit' | 'expense',
    method: 'online' as 'online' | 'bycash' | 'credit',
    amount: '',
    item_name: '',
    note: ''
  })

  // Stock Modal State
  const [showStockModal, setShowStockModal] = useState(false)
  const [editingStock, setEditingStock] = useState<StockItem | null>(null)
  const [stockForm, setStockForm] = useState({
    item_name: '',
    quantity: '',
    cost_price: '',
    selling_price: ''
  })

  // Purchase Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({
    student_id: '',
    item_id: '',
    quantity: ''
  })

  // Student Modal State
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentForm, setStudentForm] = useState({
    name: '',
    admission_no: '',
    class_code: 'S1' as 'S1' | 'S2' | 'D1' | 'D3'
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch transactions with student data
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          student:students(name, admission_no, class_code)
        `)
        .order('created_at', { ascending: false })

      // Fetch stock items
      const { data: stockData } = await supabase
        .from('stock_items')
        .select('*')
        .order('item_name')

      // Fetch purchases with related data
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          *,
          student:students(name, admission_no, class_code),
          item:stock_items(item_name, cost_price, selling_price)
        `)
        .order('created_at', { ascending: false })

      setStudents(studentsData || [])
      setTransactions(transactionsData || [])
      setStockItems(stockData || [])
      setPurchases(purchasesData || [])

      // Calculate stats
      const totalDeposits = transactionsData?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0
      const totalExpenses = transactionsData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
      const totalStockValue = stockData?.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0) || 0
      const netProfit = purchasesData?.reduce((sum, p) => sum + p.profit, 0) || 0

      setStats({
        totalStudents: studentsData?.length || 0,
        totalDeposits,
        totalExpenses,
        netProfit,
        totalStockValue,
        recentTransactions: transactionsData?.slice(0, 5) || []
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      toast.error('Error loading dashboard data')
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

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    try {
      const amount = parseFloat(transactionForm.amount)
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          student_id: selectedStudent.id,
          type: transactionForm.type,
          method: transactionForm.method,
          amount,
          item_name: transactionForm.item_name || null,
          note: transactionForm.note || null
        })

      if (error) throw error

      toast.success('Transaction added successfully')
      setShowTransactionModal(false)
      setTransactionForm({ type: 'deposit', method: 'online', amount: '', item_name: '', note: '' })
      fetchDashboardData()
    } catch (err) {
      console.error('Error adding transaction:', err)
      toast.error('Error adding transaction')
    }
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const stockData = {
        item_name: stockForm.item_name,
        quantity: parseInt(stockForm.quantity),
        cost_price: parseFloat(stockForm.cost_price),
        selling_price: parseFloat(stockForm.selling_price)
      }

      if (editingStock) {
        const { error } = await supabase
          .from('stock_items')
          .update(stockData)
          .eq('id', editingStock.id)
        
        if (error) throw error
        toast.success('Stock item updated successfully')
      } else {
        const { error } = await supabase
          .from('stock_items')
          .insert(stockData)
        
        if (error) throw error
        toast.success('Stock item added successfully')
      }

      setShowStockModal(false)
      setEditingStock(null)
      setStockForm({ item_name: '', quantity: '', cost_price: '', selling_price: '' })
      fetchDashboardData()
    } catch (err) {
      console.error('Error saving stock item:', err)
      toast.error('Error saving stock item')
    }
  }

  const handleDeleteStock = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return

    try {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Stock item deleted successfully')
      fetchDashboardData()
    } catch (err) {
      console.error('Error deleting stock item:', err)
      toast.error('Error deleting stock item')
    }
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const studentData = {
        name: studentForm.name,
        admission_no: studentForm.admission_no,
        class_code: studentForm.class_code
      }

      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id)
        
        if (error) throw error
        toast.success('Student updated successfully')
      } else {
        const { error } = await supabase
          .from('students')
          .insert(studentData)
        
        if (error) throw error
        toast.success('Student added successfully')
      }

      setShowStudentModal(false)
      setEditingStudent(null)
      setStudentForm({ name: '', admission_no: '', class_code: 'S1' })
      fetchDashboardData()
    } catch (err) {
      console.error('Error saving student:', err)
      toast.error('Error saving student')
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? This will also delete all their transactions and purchases.')) return

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Student deleted successfully')
      fetchDashboardData()
    } catch (err) {
      console.error('Error deleting student:', err)
      toast.error('Error deleting student')
    }
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const quantity = parseInt(purchaseForm.quantity)
      const selectedItem = stockItems.find(item => item.id === purchaseForm.item_id)
      
      if (!selectedItem) {
        toast.error('Selected item not found')
        return
      }

      if (selectedItem.quantity < quantity) {
        toast.error('Insufficient stock quantity')
        return
      }

      const total_price = quantity * selectedItem.selling_price

      const { error } = await supabase
        .from('purchases')
        .insert({
          student_id: purchaseForm.student_id,
          item_id: purchaseForm.item_id,
          quantity,
          unit_price: selectedItem.selling_price,
          total_price
        })

      if (error) throw error

      toast.success('Purchase recorded successfully')
      setShowPurchaseModal(false)
      setPurchaseForm({ student_id: '', item_id: '', quantity: '' })
      fetchDashboardData()
    } catch (err) {
      console.error('Error recording purchase:', err)
      toast.error('Error recording purchase')
    }
  }

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage students, transactions, and inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDeposits)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalStockValue)}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netProfit)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: Calendar },
              { id: 'students', name: 'Students', icon: Users },
              { id: 'transactions', name: 'Transactions', icon: TrendingUp },
              { id: 'stock', name: 'Stock Management', icon: Package },
              { id: 'purchases', name: 'Purchases', icon: ShoppingCart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
                <button
                  onClick={() => exportToExcel(transactions, 'all_transactions')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export All</span>
                </button>
              </div>
              
              {stats.recentTransactions.length === 0 ? (
                <p className="text-gray-600">No recent transactions</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {transaction.student?.name} ({transaction.student?.admission_no})
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.item_name || transaction.note || `${transaction.type} via ${transaction.method}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.method === 'online' ? 'bg-blue-100 text-blue-800' :
                            transaction.method === 'bycash' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.method}
                          </span>
                          <span className={`font-semibold ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setEditingStudent(null)
                      setStudentForm({ name: '', admission_no: '', class_code: 'S1' })
                      setShowStudentModal(true)
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>
                  <button
                    onClick={() => exportToExcel(students, 'students')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Students</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.admission_no}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${student.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(student.balance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(student.total_paid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(student.total_spent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(student)
                                setShowTransactionModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Add Transaction"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(student)
                                setStudentForm({
                                  name: student.name,
                                  admission_no: student.admission_no,
                                  class_code: student.class_code
                                })
                                setShowStudentModal(true)
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Student"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Transactions</h2>
                <button
                  onClick={() => exportToExcel(transactions, 'transactions')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Transactions</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.student?.name}</div>
                            <div className="text-sm text-gray-500">{transaction.student?.admission_no}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.method === 'online' ? 'bg-blue-100 text-blue-800' :
                            transaction.method === 'bycash' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.item_name || transaction.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setEditingStock(null)
                      setStockForm({ item_name: '', quantity: '', cost_price: '', selling_price: '' })
                      setShowStockModal(true)
                    }}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Record Purchase</span>
                  </button>
                  <button
                    onClick={() => exportToExcel(stockItems, 'stock_items')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Stock</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stockItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cost_price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.selling_price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.quantity * item.cost_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(item.selling_price - item.cost_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingStock(item)
                                setStockForm({
                                  item_name: item.item_name,
                                  quantity: item.quantity.toString(),
                                  cost_price: item.cost_price.toString(),
                                  selling_price: item.selling_price.toString()
                                })
                                setShowStockModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Item"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStock(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
                <button
                  onClick={() => exportToExcel(purchases, 'purchases')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Purchases</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{purchase.student?.name}</div>
                            <div className="text-sm text-gray-500">{purchase.student?.admission_no}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.item?.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(purchase.unit_price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(purchase.total_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(purchase.profit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(purchase.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Transaction for {selectedStudent.name}</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({...transactionForm, type: e.target.value as 'deposit' | 'expense'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deposit">Deposit</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                <select
                  value={transactionForm.method}
                  onChange={(e) => setTransactionForm({...transactionForm, method: e.target.value as 'online' | 'bycash' | 'credit'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="bycash">By Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name (Optional)</label>
                <input
                  type="text"
                  value={transactionForm.item_name}
                  onChange={(e) => setTransactionForm({...transactionForm, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                <input
                  type="text"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({...transactionForm, note: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingStock ? 'Edit Stock Item' : 'Add Stock Item'}
            </h3>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={stockForm.item_name}
                  onChange={(e) => setStockForm({...stockForm, item_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockForm.cost_price}
                  onChange={(e) => setStockForm({...stockForm, cost_price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockForm.selling_price}
                  onChange={(e) => setStockForm({...stockForm, selling_price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingStock ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Record Purchase</h3>
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select
                  value={purchaseForm.student_id}
                  onChange={(e) => setPurchaseForm({...purchaseForm, student_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.admission_no})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                <select
                  value={purchaseForm.item_id}
                  onChange={(e) => setPurchaseForm({...purchaseForm, item_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Item</option>
                  {stockItems.filter(item => item.quantity > 0).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} (₹{item.selling_price}) - {item.quantity} available
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Record Purchase
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </h3>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admission Number</label>
                <input
                  type="text"
                  value={studentForm.admission_no}
                  onChange={(e) => setStudentForm({...studentForm, admission_no: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={studentForm.class_code}
                  onChange={(e) => setStudentForm({...studentForm, class_code: e.target.value as 'S1' | 'S2' | 'D1' | 'D3'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="D1">D1</option>
                  <option value="D3">D3</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}