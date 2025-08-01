import React from 'react'
import { CreditCard, History, Shield, Users, ArrowRight, CheckCircle, Search } from 'lucide-react'

interface HomePageProps {
  onCheckBalance: () => void
  onAdminLogin: () => void
  onStudentLogin: () => void
}

export default function HomePage({ onCheckBalance, onAdminLogin, onStudentLogin }: HomePageProps) {
  const features = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Check Student Balances",
      description: "Quick balance lookup by admission number or class code (S1, S2, D1, D3)"
    },
    {
      icon: <History className="h-6 w-6" />,
      title: "Transaction Management",
      description: "Complete transaction history with deposits and expenses tracking"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Admin Panel",
      description: "Protected admin access for managing students and transactions"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Stock Management",
      description: "Inventory tracking with purchase recording and profit calculation"
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Welcome to <span className="text-blue-600">ASOSTORE</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          College Prepaid Fund Management System – Check student balances instantly or access the admin panel for complete management.
        </p>
        <div className="flex justify-center">
          <button
            onClick={onCheckBalance}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 justify-center"
          >
            <Search className="h-5 w-5" />
            <span>Check Balance</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Features & Benefits
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:transform hover:scale-105"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          About ASOSTORE
        </h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              ASOSTORE is a comprehensive prepaid fund management system designed for colleges. 
              Students can quickly check their balances using admission numbers or class codes, 
              while administrators have complete control over transactions, stock management, and reporting.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Balance checking by admission number or class code</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Complete transaction management system</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Stock management with profit tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Secure admin panel with role-based access</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Prepaid Fund System
              </h3>
              <p className="text-gray-600">
                Modern fund management for college campuses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Student Login Section */}
        <div className="bg-blue-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Student Portal
          </h2>
          <p className="text-blue-100 mb-6">
            Login to view your balance, transaction history, and purchase records
          </p>
          <button
            onClick={onStudentLogin}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <Users className="h-5 w-5" />
            <span>Student Login</span>
          </button>
        </div>

        {/* Admin Login Section */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-6">
            Admin Portal
        </h2>
          <p className="text-gray-300 mb-6">
            Admin access for managing students, transactions, and inventory
        </p>
        <button
          onClick={onAdminLogin}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
        >
          <Shield className="h-5 w-5" />
          <span>Admin Login</span>
        </button>
        </div>
      </div>
    </div>
  )
}