import React, { useState } from 'react'
import { ArrowLeft, User, BookOpen, CreditCard, Clock, Plus, Minus, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { StudentWithTransactions, Transaction } from '../types/database'

interface StudentLoginProps {
  onBack: () => void
}

export default function StudentLogin({ onBack }: StudentLoginProps) {
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [classCode, setClassCode] = useState('')
  const [student, setStudent] = useState<StudentWithTransactions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validClassCodes = {
    'S1': 'S1001',
    'S2': 'S2002', 
    'D1': 'D1003',
    'D3': 'D3004'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admissionNumber.trim() || !classCode.trim()) return

    // Validate class code
    const studentClass = Object.keys(validClassCodes).find(
      key => validClassCodes[key as keyof typeof validClassCodes] === classCode.trim()
    )

    if (!studentClass) {
      setError('Invalid class code. Please check with your class teacher.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('admission_number', admissionNumber.trim())
        .eq('class', studentClass)
        .single()

      if (studentError) {
        setError('Student not found. Please check your admission number and class code.')
        return
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false })

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
      }

      setStudent({
        ...studentData,
        transactions: transactionsData || []
      })
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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

  if (student) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setStudent(null)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Login</span>
        </button>

        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {student.profile_image ? (
                <img
                  src={student.profile_image}
                  alt={student.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-blue-100">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="text-xl font-semibold text-gray-900">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="text-xl font-semibold text-gray-900">{student.class}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className={`text-2xl font-bold ${student.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(student.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <Clock className="h-6 w-6" />
            <span>Transaction History</span>
          </h2>

          {student.transactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {student.transactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <Plus className={`h-4 w-4 ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <Minus className={`h-4 w-4 ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.reason}</p>
                        <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Home</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Login</h2>
          <p className="text-gray-600">Enter your class code and admission number to check your balance</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="classCode" className="block text-sm font-medium text-gray-700 mb-2">
              Class Code
            </label>
            <input
              id="classCode"
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
              placeholder="Enter your class code (e.g., S1001)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Class codes: S1001 (S1), S2002 (S2), D1003 (D1), D3004 (D3)
            </p>
          </div>

          <div>
            <label htmlFor="admission" className="block text-sm font-medium text-gray-700 mb-2">
              Admission Number
            </label>
            <input
              id="admission"
              type="text"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
              placeholder="Enter your admission number"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors text-lg"
          >
            {loading ? 'Verifying...' : 'Check Balance'}
          </button>
        </form>
      </div>
    </div>
  )
}