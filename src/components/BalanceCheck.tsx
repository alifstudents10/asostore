import React, { useState } from 'react'
import { Search, User, Users, CreditCard, TrendingUp, TrendingDown, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Student } from '../types/database'
import toast from 'react-hot-toast'

interface BalanceCheckProps {
  onBack: () => void
}

interface BalanceCheckResult {
  type: 'student' | 'class'
  student?: Student
  students?: Student[]
  classCode?: string
}

export default function BalanceCheck({ onBack }: BalanceCheckProps) {
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BalanceCheckResult | null>(null)

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const trimmedValue = searchValue.trim().toUpperCase()
      console.log('🔍 Searching for:', trimmedValue)
      
      // Check if it's a class code
      if (['S1', 'S2', 'D1', 'D3'].includes(trimmedValue)) {
        console.log('🔍 Searching by class code:', trimmedValue)
        
        const { data: students, error } = await supabase
          .from('students')
          .select('*')
          .eq('class_code', trimmedValue)
          .order('name')

        if (error) {
          console.error('❌ Class search error:', error.message)
          toast.error('Error searching for class. Please try again.')
          return
        }

        if (!students || students.length === 0) {
          toast.error(`No students found in class ${trimmedValue}`)
          return
        }

        console.log('✅ Found', students.length, 'students in class', trimmedValue)
        setResult({
          type: 'class',
          students,
          classCode: trimmedValue
        })
      } else {
        // Search by admission number
        console.log('🔍 Searching by admission number:', trimmedValue)
        
        const { data: students, error } = await supabase
          .from('students')
          .select('*')
          .eq('admission_no', trimmedValue)

        if (error) {
          console.error('❌ Student search error:', error.message)
          toast.error('Error searching for student. Please try again.')
          return
        }

        if (!students || students.length === 0) {
          toast.error('Student not found. Please check the admission number.')
          return
        }

        console.log('✅ Found student:', students[0].name)
        setResult({
          type: 'student',
          student: students[0]
        })
      }
    } catch (err) {
      console.error('❌ Search error:', err)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStudentCard = (student: Student, showClass = false) => (
    <div key={student.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{student.name}</h3>
            <p className="text-gray-600">
              {student.admission_no}
              {showClass && ` • Class ${student.class_code}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Current Balance</span>
          </div>
          <p className={`text-2xl font-bold ${student.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(student.balance)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(student.total_paid)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(student.total_spent)}
          </p>
        </div>
      </div>

      {student.last_payment && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last payment: {formatDate(student.last_payment)}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Home</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Balance</h2>
          <p className="text-gray-600 text-lg">
            Enter admission number for individual student or class code (S1, S2, D1, D3) for entire class
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Enter admission number or class code"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            <strong>Examples:</strong> S1001 (admission number) or S1 (class code)
          </p>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {result.type === 'student' && result.student && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Student Details</h3>
              {renderStudentCard(result.student)}
            </div>
          )}

          {result.type === 'class' && result.students && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Class {result.classCode} Students ({result.students.length})
                </h3>
              </div>

              {/* Class Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6 mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Class Summary</span>
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.students.reduce((sum, s) => sum + s.balance, 0))}
                    </p>
                    <p className="text-sm text-gray-600">Total Class Balance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(result.students.reduce((sum, s) => sum + s.total_paid, 0))}
                    </p>
                    <p className="text-sm text-gray-600">Total Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(result.students.reduce((sum, s) => sum + s.total_spent, 0))}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="grid gap-6">
                {result.students.map(student => renderStudentCard(student, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}