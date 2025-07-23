import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './components/HomePage'
import StudentLogin from './components/StudentLogin'
import AdminPanel from './components/AdminPanel'

type ViewType = 'home' | 'student' | 'admin'

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'student':
        return <StudentLogin onBack={() => setCurrentView('home')} />
      case 'admin':
        return <AdminPanel onBack={() => setCurrentView('home')} />
      default:
        return (
          <HomePage 
            onCheckBalance={() => setCurrentView('student')}
          />
        )
    }
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {renderCurrentView()}
        
        {currentView === 'home' && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 text-sm"
            >
              Admin Panel
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App