import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { useAuth } from './hooks/useAuth'
import Shell from './components/layout/Shell'
import AuthPage from './pages/AuthPage'
import AppSkeleton from './components/ui/AppSkeleton'

export default function App() {
  const { user, authLoading } = useAuth()
  const { darkMode } = useAppStore()

  // Apply dark mode on mount and changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Restore sidebar state
  useEffect(() => {
    try {
      if (localStorage.getItem('tt-sidebar') === '1')
        useAppStore.setState({ sidebarCollapsed: true })
    } catch {}
  }, [])

  // Show skeleton while auth session is being resolved — prevents flash
  if (authLoading || user === undefined) return <AppSkeleton />

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*"    element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/*"    element={<Shell />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
