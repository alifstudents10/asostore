import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit, Trash2, Users, CreditCard, TrendingUp, Download, Upload, Eye, X, Camera, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Student, Transaction } from '../types/database'

interface StudentsPageProps {
  onBack: () => void
}

export default function StudentsPage({ onBack }: StudentsPageProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: '',
    admission_number: '',
    class: '',
    balance: 0,
    profile_image: ''
  })

  // Import/Export states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [students, searchTerm])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
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

  const resetForm = () => {
    setNewStudent({
      name: '',
      admission_number: '',
      class: '',
      balance: 0,
      profile_image: ''
    })
    setShowAddForm(false)
    setShowEditForm(false)
    setShowImageUpload(false)
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('students')
        .insert([{
          name: newStudent.name,
          admission_number: newStudent.admission_number,
          class: newStudent.class,
          balance: newStudent.balance,
          profile_image: newStudent.profile_image || null
        }])

      if (error) throw error

      await fetchStudents()
      resetForm()
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Failed to add student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: newStudent.name,
          admission_number: newStudent.admission_number,
          class: newStudent.class,
          balance: newStudent.balance,
          profile_image: newStudent.profile_image || null
        })
        .eq('id', selectedStudent.id)

      if (error) throw error

      await fetchStudents()
      resetForm()
      setSelectedStudent(null)
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (student: Student) => {
    setSelectedStudent(student)
    setNewStudent({
      name: student.name,
      admission_number: student.admission_number,
      class: student.class,
      balance: student.balance,
      profile_image: student.profile_image || ''
    })
    setShowEditForm(true)
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', selectedStudent.id)

      if (error) throw error

      await fetchStudents()
      setShowDeleteConfirm(false)
      setSelectedStudent(null)
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, studentId?: string) => {
    if (!file) return
    
    setUploadingImage(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('student-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-images')
        .getPublicUrl(fileName)

      if (studentId) {
        // Update existing student
        const { error: updateError } = await supabase
          .from('students')
          .update({ profile_image: publicUrl })
          .eq('id', studentId)
        
        if (updateError) throw updateError
        fetchStudents()
      } else {
        // For new student form
        setNewStudent(prev => ({ ...prev, profile_image: publicUrl }))
      }
      
      setShowImageUpload(false)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      ['name', 'admission_number', 'class', 'balance', 'profile_image'],
      ['John Doe', 'ADM001', 'S1', '1000', ''],
      ['Jane Smith', 'ADM002', 'S2', '1500', ''],
      ['Mike Johnson', 'ADM003', 'D1', '2000', ''],
      ['Sarah Wilson', 'ADM004', 'D3', '500', '']
    ]

    const csvContent = template.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })
        row.lineNumber = index + 2 // +2 because we start from line 2 (after header)
        return row
      })

      // Validate data
      const errors: string[] = []
      data.forEach((row, index) => {
        if (!row.name) errors.push(`Line ${row.lineNumber}: Name is required`)
        if (!row.admission_number) errors.push(`Line ${row.lineNumber}: Admission number is required`)
        if (!row.class) errors.push(`Line ${row.lineNumber}: Class is required`)
        if (row.balance && isNaN(parseFloat(row.balance))) {
          errors.push(`Line ${row.lineNumber}: Balance must be a valid number`)
        }
      })

      setImportData(data)
      setImportErrors(errors)
      setShowImportPreview(true)
    }
    reader.readAsText(file)
  }

  const handleImportConfirm = async () => {
    if (importErrors.length > 0) {
      alert('Please fix the errors before importing')
      return
    }

    setLoading(true)
    try {
      const studentsToInsert = importData.map(row => ({
        name: row.name,
        admission_number: row.admission_number,
        class: row.class,
        balance: parseFloat(row.balance) || 0,
        profile_image: row.profile_image || null
      }))

      const { error } = await supabase
        .from('students')
        .insert(studentsToInsert)

      if (error) throw error

      await fetchStudents()
      setShowImportModal(false)
      setShowImportPreview(false)
      setImportData([])
      setImportErrors([])
      alert(`Successfully imported ${studentsToInsert.length} students`)
    } catch (error) {
      console.error('Error importing students:', error)
      alert('Failed to import students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportStudents = () => {
    const headers = ['name', 'admission_number', 'class', 'balance', 'profile_image']
    const csvContent = [
      headers.join(','),
      ...students.map(student => [
        student.name,
        student.admission_number,
        student.class,
        student.balance,
        student.profile_image || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalBalance = students.reduce((sum, student) => sum + student.balance, 0)

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            onClick={exportStudents}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(students.length > 0 ? totalBalance / students.length : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search students by name, admission number, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.profile_image ? (
                        <img
                          src={student.profile_image}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.admission_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.class}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${student.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(student.balance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowImageUpload(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Upload Image"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditForm(student)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Edit Student"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student)
                          setShowDeleteConfirm(true)
                        }}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
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

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new student.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Student</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number *
                </label>
                <input
                  type="text"
                  value={newStudent.admission_number}
                  onChange={(e) => setNewStudent({...newStudent, admission_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  value={newStudent.class}
                  onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStudent.balance}
                  onChange={(e) => setNewStudent({...newStudent, balance: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center space-x-4">
                  {newStudent.profile_image ? (
                    <img
                      src={newStudent.profile_image}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number *
                </label>
                <input
                  type="text"
                  value={newStudent.admission_number}
                  onChange={(e) => setNewStudent({...newStudent, admission_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  value={newStudent.class}
                  onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStudent.balance}
                  onChange={(e) => setNewStudent({...newStudent, balance: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center space-x-4">
                  {newStudent.profile_image ? (
                    <img
                      src={newStudent.profile_image}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowImageUpload(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Profile Image</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, selectedStudent?.id)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingImage}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
              
              {uploadingImage && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Uploading image...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Student</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{selectedStudent.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action cannot be undone. All transaction history for this student will also be deleted.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Import Students</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setShowImportPreview(false)
                  setImportData([])
                  setImportErrors([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {!showImportPreview ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a CSV file with student data. The file should have the following columns:
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm font-mono">
                    name, admission_number, class, balance, profile_image
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Import Preview</h4>
                  <p className="text-sm text-gray-600">
                    Found {importData.length} students to import
                  </p>
                </div>
                
                {importErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h5 className="font-medium text-red-800 mb-2">Errors found:</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {importErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Admission #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.admission_number}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.class}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importData.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                      ... and {importData.length - 10} more rows
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowImportPreview(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={importErrors.length > 0 || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Importing...' : 'Import Students'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}