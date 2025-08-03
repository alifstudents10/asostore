import React, { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [studentCount, setStudentCount] = useState<number>(0)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        setStatus('error')
      } else {
        setStatus('connected')
        setStudentCount(count || 0)
      }
    } catch (error) {
      setStatus('error')
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

  const getMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return `Connected (${studentCount} students)`
      case 'error':
        return 'Connection failed'
    }
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border text-sm ${getStatusColor()}`}>
      <Database className="h-4 w-4" />
      {getStatusIcon()}
      <span>{getMessage()}</span>
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