import React, { useState, useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  User,
  Loader2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Student, Transaction, StockItem, Purchase, DashboardStats } from '../types/database'
import toast from 'react-hot-toast'

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
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [editingStock, setEditingStock] = useState<StockItem | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading dashboard data...')
      
      await Promise.all([
        loadStats(),
        loadStudents(),
        loadTransactions(),
        loadStockItems(),
        loadPurchases()
      ])
      
      console.log('✅ Dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const { data: studentsData } = await supabase.from('students').select('*')
    const { data: transactionsData } = await supabase.from('transactions').select('*')
    const { data: stockData } = await supabase.from('stock_items').select('*')
    const { data: purchasesData } = await supabase.from('purchases').select('*')
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select(`
        *,
        student:students(name, admission_no)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const totalStudents = studentsData?.length || 0
    const totalDeposits = transactionsData?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0
    const totalExpenses = transactionsData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
    const netProfit = purchasesData?.reduce((sum, p) => sum + p.profit, 0) || 0
    const totalStockValue = stockData?.reduce((sum, s) => sum + (s.quantity * s.cost_price), 0) || 0

    setStats({
      totalStudents,
      totalDeposits,
      totalExpenses,
      netProfit,
      totalStockValue,
      recentTransactions: recentTransactions || []
    })
  }

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name')

    if (error) {
      console.error('❌ Error loading students:', error)
      toast.error('Failed to load students')
      return
    }

    setStudents(data || [])
  }

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        student:students(name, admission_no)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error loading transactions:', error)
      toast.error('Failed to load transactions')
      return
    }

    setTransactions(data || [])
  }

  const loadStockItems = async () => {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('item_name')

    if (error) {
      console.error('❌ Error loading stock items:', error)
      toast.error('Failed to load stock items')
      return
    }

    setStockItems(data || [])
  }

  const loadPurchases = async () => {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        student:students(name, admission_no),
        item:stock_items(item_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error loading purchases:', error)
      toast.error('Failed to load purchases')
      return
    }

    setPurchases(data || [])
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

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.error('No data to export')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`${filename} exported successfully`)
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'students', name: 'Students', icon: <Users className="h-5 w-5" /> },
    { id: 'transactions', name: 'Transactions', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'stock', name: 'Stock', icon: <Package className="h-5 w-5" /> },
    { id: 'purchases', name: 'Purchases', icon: <ShoppingCart className="h-5 w-5" /> }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Deposits</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDeposits)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.netProfit)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Value</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalStockValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className={`h-4 w-4 ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.student?.name || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.student?.admission_no} • {transaction.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
            <button
              onClick={() => exportToCSV(students, 'students')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {students
                    .filter(student => 
                      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      student.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.admission_no}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.class_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          student.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(student.balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(student.total_paid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(student.total_spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowTransactionModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Add Transaction
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
            <button
              onClick={() => exportToCSV(transactions, 'transactions')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.student?.admission_no}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'deposit' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {transaction.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.note || transaction.item_name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditingStock(null)
                  setShowStockModal(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
              <button
                onClick={() => exportToCSV(stockItems, 'stock')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.item_name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingStock(item)
                        setShowStockModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className={`font-medium ${
                      item.quantity > 10 ? 'text-green-600' : 
                      item.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Price:</span>
                    <span className="font-medium">{formatCurrency(item.cost_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selling Price:</span>
                    <span className="font-medium">{formatCurrency(item.selling_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit per unit:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(item.selling_price - item.cost_price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Purchase History</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Record Purchase</span>
              </button>
              <button
                onClick={() => exportToCSV(purchases, 'purchases')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(purchase.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchase.student?.admission_no}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.item?.item_name || 'Unknown Item'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.total_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(purchase.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedStudent && (
        <TransactionModal
          student={selectedStudent}
          onClose={() => {
            setShowTransactionModal(false)
            setSelectedStudent(null)
          }}
          onSuccess={() => {
            loadDashboardData()
            setShowTransactionModal(false)
            setSelectedStudent(null)
          }}
        />
      )}

      {/* Stock Modal */}
      {showStockModal && (
        <StockModal
          item={editingStock}
          onClose={() => {
            setShowStockModal(false)
            setEditingStock(null)
          }}
          onSuccess={() => {
            loadDashboardData()
            setShowStockModal(false)
            setEditingStock(null)
          }}
        />
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          students={students}
          stockItems={stockItems}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            loadDashboardData()
            setShowPurchaseModal(false)
          }}
        />
      )}
    </div>
  )
}

// Transaction Modal Component
function TransactionModal({ 
  student, 
  onClose, 
  onSuccess 
}: { 
  student: Student
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'deposit' as 'deposit' | 'expense',
    method: 'online' as 'online' | 'bycash' | 'credit',
    note: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          student_id: student.id,
          amount: parseFloat(formData.amount),
          type: formData.type,
          method: formData.method,
          note: formData.note || null
        })

      if (error) throw error

      toast.success('Transaction added successfully')
      onSuccess()
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Add Transaction for {student.name}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'deposit' | 'expense'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="deposit">Deposit</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({...formData, method: e.target.value as 'online' | 'bycash' | 'credit'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="online">Online</option>
              <option value="bycash">By Cash</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Stock Modal Component
function StockModal({ 
  item, 
  onClose, 
  onSuccess 
}: { 
  item: StockItem | null
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    item_name: item?.item_name || '',
    quantity: item?.quantity?.toString() || '',
    cost_price: item?.cost_price?.toString() || '',
    selling_price: item?.selling_price?.toString() || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        item_name: formData.item_name,
        quantity: parseInt(formData.quantity),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price)
      }

      if (item) {
        const { error } = await supabase
          .from('stock_items')
          .update(data)
          .eq('id', item.id)
        
        if (error) throw error
        toast.success('Stock item updated successfully')
      } else {
        const { error } = await supabase
          .from('stock_items')
          .insert(data)
        
        if (error) throw error
        toast.success('Stock item added successfully')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving stock item:', error)
      toast.error('Failed to save stock item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {item ? 'Edit Stock Item' : 'Add Stock Item'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cost_price}
              onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.selling_price}
              onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
            >
              {loading ? 'Saving...' : (item ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Purchase Modal Component
function PurchaseModal({ 
  students, 
  stockItems, 
  onClose, 
  onSuccess 
}: { 
  students: Student[]
  stockItems: StockItem[]
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    student_id: '',
    item_id: '',
    quantity: ''
  })
  const [loading, setLoading] = useState(false)

  const selectedItem = stockItems.find(item => item.id === formData.item_id)
  const totalPrice = selectedItem && formData.quantity 
    ? selectedItem.selling_price * parseInt(formData.quantity) 
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('purchases')
        .insert({
          student_id: formData.student_id,
          item_id: formData.item_id,
          quantity: parseInt(formData.quantity),
          unit_price: selectedItem!.selling_price,
          total_price: totalPrice
        })

      if (error) throw error

      toast.success('Purchase recorded successfully')
      onSuccess()
    } catch (error) {
      console.error('Error recording purchase:', error)
      toast.error('Failed to record purchase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Record Purchase
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({...formData, student_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item
            </label>
            <select
              value={formData.item_id}
              onChange={(e) => setFormData({...formData, item_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={selectedItem?.quantity || 1}
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {totalPrice > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Unit Price:</span>
                <span>₹{selectedItem!.selling_price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span>{formData.quantity}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.student_id || !formData.item_id || !formData.quantity}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg"
            >
              {loading ? 'Recording...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}