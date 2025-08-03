import React, { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { testDatabaseConnection } from '../lib/supabase'

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [message, setMessage] = useState('Connecting to database...')
  const [studentCount, setStudentCount] = useState<number>(0)

  useEffect(() => {
    checkConnection()
    // Set up periodic connection check
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    setStatus('connecting')
    setMessage('Testing database connection...')
    
    const result = await testDatabaseConnection()
    
    if (result.success) {
      setStatus('connected')
      setMessage('Database connected')
      setStudentCount(result.count || 0)
    } else {
      setStatus('error')
      setMessage(result.error || 'Database connection failed')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${getStatusColor()}`}>
      <Database className="h-4 w-4" />
      {getStatusIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {status === 'connected' && (
          <p className="text-xs opacity-75">{studentCount} students loaded</p>
        )}
      </div>
      {status === 'error' && (
        <button
          onClick={checkConnection}
          className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}