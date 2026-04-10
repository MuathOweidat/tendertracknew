import React from 'react'
import { useAppStore } from '../../store/appStore'

/**
 * Renders children only if user has at least the required role.
 *
 * Usage:
 *   <RoleGuard role="manager">
 *     <button>Edit</button>
 *   </RoleGuard>
 *
 *   <RoleGuard role="admin" fallback={<span>Read only</span>}>
 *     <AdminPanel />
 *   </RoleGuard>
 */
export default function RoleGuard({ role = 'manager', fallback = null, children }) {
  const profile = useAppStore(s => s.profile)
  const order   = { viewer: 0, manager: 1, admin: 2 }
  const userLvl = order[profile?.role || 'viewer'] ?? 0
  const minLvl  = order[role] ?? 99
  if (userLvl < minLvl) return fallback
  return children
}
