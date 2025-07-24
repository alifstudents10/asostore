import React from 'react'
import { CreditCard, History, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react'
import ConnectionStatus from './ConnectionStatus'

interface HomePageProps {
  onCheckBalance: () => void
}

export default function HomePage({ onCheckBalance }: HomePageProps) {
  const features = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Manage Wallet Balances",
      description: "Easy balance management for all students across S1, S2, D1, D3"
    },
    {
      icon: <History className="h-6 w-6" />,
      title: "Track Purchase History",
      description: "Complete transaction history and records"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Class Code Access",
      description: "Secure access with class-specific codes and admission numbers"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Admin Panel Control",
      description: "Full control with CSV import and bulk management"
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
          Your Prepaid College Wallet – Easily check your balance, view purchases, and manage transactions securely.
        </p>
        <button
          onClick={onCheckBalance}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
        >
          <span>Check Your Balance</span>
          <ArrowRight className="h-5 w-5" />
        </button>
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
              ASOSTORE is built specifically for college campuses to manage student store spending digitally. 
              Our system provides a seamless way for students to make purchases without cash while giving 
              administrators complete control over account management across all classes (S1, S2, D1, D3).
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Works across all classes: S1, S2, D1, D3</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Class-specific code and admission number system</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Real-time balance tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">CSV import and bulk student management</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Digital Wallet System
              </h3>
              <p className="text-gray-600">
                Modern, cashless solution for campus stores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Need Help?
        </h2>
        <p className="text-xl text-gray-300 mb-4">
          For login issues, balance top-ups, or account support
        </p>
        <p className="text-lg text-gray-400">
          Contact your class teacher or system administrator
        </p>
      </div>
    </div>
  )
}