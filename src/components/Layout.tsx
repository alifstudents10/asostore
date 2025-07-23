import React from 'react'
import { Wallet, GraduationCap } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ASOSTORE</h1>
                <p className="text-sm text-gray-600">College Prepaid Wallet</p>
              </div>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}