import React, { useState } from 'react';
import { Search, User, Users, ArrowLeft, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';
import toast from 'react-hot-toast';

export function BalanceCheck() {
  const [searchType, setSearchType] = useState<'admission' | 'class'>('admission');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setLoading(true);
    setStudent(null);
    setStudents([]);

    try {
      if (searchType === 'admission') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('admission_no', searchValue.trim())
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('Student not found');
          } else {
            throw error;
          }
        } else {
          setStudent(data);
        }
      } else {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('class_code', searchValue.trim())
          .order('name');

        if (error) throw error;

        if (data.length === 0) {
          toast.error('No students found in this class');
        } else {
          setStudents(data);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const reset = () => {
    setSearchValue('');
    setStudent(null);
    setStudents([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ASOSTORE</h1>
          <p className="text-gray-600 mt-2">Check Student Balance</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="admission"
                  checked={searchType === 'admission'}
                  onChange={(e) => setSearchType(e.target.value as 'admission' | 'class')}
                  className="mr-2"
                />
                <User className="h-4 w-4 mr-1" />
                Admission Number
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="class"
                  checked={searchType === 'class'}
                  onChange={(e) => setSearchType(e.target.value as 'admission' | 'class')}
                  className="mr-2"
                />
                <Users className="h-4 w-4 mr-1" />
                Class Code
              </label>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={
                searchType === 'admission' 
                  ? 'Enter admission number (e.g., ASO/2024/001)' 
                  : 'Enter class code (e.g., ND1A, HND2B)'
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {(student || students.length > 0) && (
            <button
              onClick={reset}
              className="mt-4 text-blue-600 hover:text-blue-700 flex items-center text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              New Search
            </button>
          )}
        </div>

        {/* Single Student Result */}
        {student && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <p className="text-gray-600">{student.admission_no} • {student.class_code}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-green-800 mb-2">Current Balance</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(student.balance)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Total Paid</h3>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(student.total_paid)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-red-800 mb-2">Total Spent</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(student.total_spent)}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Last Payment: {formatDate(student.last_payment)}
              </p>
            </div>
          </div>
        )}

        {/* Multiple Students Result */}
        {students.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Students in Class {searchValue} ({students.length})
            </h2>
            <div className="grid gap-4">
              {students.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.admission_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(student.balance)}
                      </p>
                      <p className="text-xs text-gray-500">Current Balance</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm text-gray-600">
                    <span>Paid: {formatCurrency(student.total_paid)}</span>
                    <span>Spent: {formatCurrency(student.total_spent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Link */}
        <div className="text-center mt-8">
          <a
            href="/admin"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Administrator? Sign in here
          </a>
        </div>
      </div>
    </div>
  );
}