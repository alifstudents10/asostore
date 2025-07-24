import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Check if environment variables exist
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setStatus('error')
        setError('Supabase environment variables not found. Please set up your Supabase connection.')
        return
      }

      // Check if using placeholder values
      if (import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        setStatus('error')
        setError('Supabase is not properly configured. Please set up your Supabase connection.')
        return
      }

      // Test the connection by trying to fetch from a table
      const { error: connectionError } = await supabase
        .from('students')
        .select('count', { count: 'exact', head: true })

      if (connectionError) {
        setStatus('error')
        setError(`Database connection failed: ${connectionError.message}`)
      } else {
        setStatus('connected')
      }
    } catch (err) {
      setStatus('error')
      setError('Failed to connect to Supabase')
    }
  }

  if (status === 'checking') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800">Checking Supabase connection...</span>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800 font-medium">Supabase Connection Error</span>
        </div>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        <div className="bg-red-100 border border-red-300 rounded p-3">
          <p className="text-red-800 text-sm font-medium mb-2">To fix this:</p>
          <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
            <li>Set up your Supabase project and get your URL and API key</li>
            <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables</li>
            <li>Redeploy your application with the correct environment variables</li>
          </ol>
        </div>
        <button
          onClick={checkConnection}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">Supabase Connected Successfully</span>
      </div>
      <p className="text-green-700 text-sm mt-1">
        Database is ready. You can now use the admin panel and student login features.
      </p>
    </div>
  )
}