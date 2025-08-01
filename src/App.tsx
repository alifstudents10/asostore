import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import BalanceCheck from './components/BalanceCheck'
import AuthLogin from './components/AuthLogin'
import AdminDashboard from './components/AdminDashboard'
import AuthWrapper from './components/AuthWrapper'
import { useAuth } from './hooks/useAuth'

type ViewType = 'home' | 'balance-check' | 'admin-auth' | 'admin-dashboard'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [activeAdminTab, setActiveAdminTab] = useState('overview')
  const { user, isAdmin, signOut } = useAuth()

  // Auto-redirect authenticated admin users to dashboard
  React.useEffect(() => {
    if (user && isAdmin && currentView === 'home') {
      console.log('🔄 Auto-redirecting admin to dashboard')
      setCurrentView('admin-dashboard')
    }
  }, [user, isAdmin, currentView])

  const handleSignOut = async () => {
    console.log('🔄 Signing out and returning to home')
    await signOut()
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'balance-check':
        return <BalanceCheck onBack={() => setCurrentView('home')} />
      
      case 'admin-auth':
        return <AuthLogin onBack={() => setCurrentView('home')} />
      
      case 'admin-dashboard':
        return (
          <AuthWrapper requireAuth requireAdmin>
            <AdminDashboard 
              activeTab={activeAdminTab} 
              setActiveTab={setActiveAdminTab} 
            />
          </AuthWrapper>
        )
      
      default:
        return (
          <HomePage 
            onCheckBalance={() => setCurrentView('balance-check')}
            onAdminLogin={() => setCurrentView('admin-auth')}
          />
        )
    }
  }

  return (
    <Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="min-h-screen">
        {/* Header with auth controls */}
        {user && isAdmin && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('admin-dashboard')}
                    className={`font-medium transition-colors ${
                      currentView === 'admin-dashboard' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('home')}
                    className={`font-medium transition-colors ${
                      currentView === 'home' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    Home
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user.email} (Admin)
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderCurrentView()}
        
        {/* Admin Login Button for non-authenticated users */}
        {currentView === 'home' && !user && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => setCurrentView('admin-auth')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Admin Panel</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App