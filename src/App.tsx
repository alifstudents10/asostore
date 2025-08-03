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

  // Don't show loading screen - let the app render immediately
  // The individual components will handle their own loading states

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