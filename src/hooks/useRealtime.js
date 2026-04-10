import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

/**
 * Manages Supabase realtime subscription for the authenticated session.
 * Call once at the Shell level.
 */
export function useRealtime() {
  const { user, subscribeRealtime, unsubscribeRealtime } = useAppStore()
  const subscribedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (subscribedRef.current) return
    subscribedRef.current = true
    subscribeRealtime()

    return () => {
      unsubscribeRealtime()
      subscribedRef.current = false
    }
  }, [user?.id])
}
