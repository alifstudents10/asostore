import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import BalanceCheck from './components/BalanceCheck'
import AuthLogin from './components/AuthLogin'
import AuthWrapper from './components/AuthWrapper'
import AdminDashboard from './components/AdminDashboard'
import StudentDashboard from './components/StudentDashboard'

type View = 'home' | 'balance' | 'admin-login' | 'student-login' | 'admin-dashboard' | 'student-dashboard'

export default function App() {
  const { user, isAdmin, loading } = useAuth()
  const [currentView, setCurrentView] = useState<View>('home')
  const [activeTab, setActiveTab] = useState('overview')

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ASOSTORE...</p>
          </div>
        </div>
        <Toaster position="top-right" />
      </Layout>
    )
  }

  // Auto-redirect authenticated users
  React.useEffect(() => {
    if (user && currentView === 'home') {
      if (isAdmin) {
        setCurrentView('admin-dashboard')
      } else {
        setCurrentView('student-dashboard')
      }
    }
  }, [user, isAdmin, currentView])

  const renderContent = () => {
    switch (currentView) {
      case 'balance':
        return <BalanceCheck onBack={() => setCurrentView('home')} />
      
      case 'admin-login':
        return <AuthLogin onBack={() => setCurrentView('home')} />
      
      case 'student-login':
        return <AuthLogin onBack={() => setCurrentView('home')} />
      
      case 'admin-dashboard':
        return (
          <AuthWrapper requireAuth requireAdmin>
            <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />
          </AuthWrapper>
        )
      
      case 'student-dashboard':
        return (
          <AuthWrapper requireAuth>
            <StudentDashboard />
          </AuthWrapper>
        )
      
      default:
        return (
          <HomePage
            onCheckBalance={() => setCurrentView('balance')}
            onAdminLogin={() => setCurrentView('admin-login')}
            onStudentLogin={() => setCurrentView('student-login')}
          />
        )
    }
  }

  return (
    <Layout>
      {renderContent()}
      <Toaster position="top-right" />
    </Layout>
  )
}