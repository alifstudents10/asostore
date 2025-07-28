import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import StudentLogin from './components/StudentLogin'
import AuthLogin from './components/AuthLogin'
import StudentDashboard from './components/StudentDashboard'
import AdminDashboard from './components/AdminDashboard'
import AuthWrapper from './components/AuthWrapper'
import { useAuth } from './hooks/useAuth'

type ViewType = 'home' | 'student-lookup' | 'student-auth' | 'admin-auth' | 'student-dashboard' | 'admin-dashboard'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home')
  const [activeAdminTab, setActiveAdminTab] = useState('overview')
  const { user, isAdmin, isStudent, signOut } = useAuth()

  // Auto-redirect authenticated users to their dashboards
  React.useEffect(() => {
    if (user && currentView === 'home') {
      if (isAdmin) {
        setCurrentView('admin-dashboard')
      } else if (isStudent) {
        setCurrentView('student-dashboard')
      }
    }
  }, [user, isAdmin, isStudent, currentView])

  const handleSignOut = async () => {
    await signOut()
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'student-lookup':
        return <StudentLogin onBack={() => setCurrentView('home')} />
      
      case 'student-auth':
        return <AuthLogin onBack={() => setCurrentView('home')} userType="student" />
      
      case 'admin-auth':
        return <AuthLogin onBack={() => setCurrentView('home')} userType="admin" />
      
      case 'student-dashboard':
        return (
          <AuthWrapper requireAuth requireAdmin={false}>
            <StudentDashboard />
          </AuthWrapper>
        )
      
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
            onCheckBalance={() => setCurrentView('student-lookup')}
            onStudentLogin={() => setCurrentView('student-auth')}
          />
        )
    }
  }

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="min-h-screen">
        {/* Header with auth controls */}
        {user && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('admin-dashboard')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  {isStudent && (
                    <button
                      onClick={() => setCurrentView('student-dashboard')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      My Dashboard
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user.email} ({isAdmin ? 'Admin' : 'Student'})
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderCurrentView()}
        
        {/* Admin Panel Button for non-authenticated users */}
        {currentView === 'home' && !user && (
          <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
            <button
              onClick={() => setCurrentView('student-auth')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              Student Login
            </button>
            <button
              onClick={() => setCurrentView('admin-auth')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              Admin Login
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App