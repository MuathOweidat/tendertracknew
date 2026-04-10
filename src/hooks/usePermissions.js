import { useAppStore } from '../store/appStore'

/**
 * Role hierarchy: admin > manager > viewer
 * - admin:   full access — create, edit, delete anything
 * - manager: create + edit own records, delete own records
 * - viewer:  read-only
 */
export function usePermissions() {
  const { profile, user } = useAppStore()
  const role = profile?.role || 'viewer'

  const is      = r    => role === r
  const atLeast = r    => {
    const order = { viewer: 0, manager: 1, admin: 2 }
    return (order[role] ?? 0) >= (order[r] ?? 99)
  }
  const ownedBy = createdBy => createdBy === user?.id

  return {
    role,
    isAdmin:   is('admin'),
    isManager: atLeast('manager'),
    isViewer:  is('viewer'),

    // Tender permissions
    canCreateTender: atLeast('manager'),
    canEditTender:   (t) => atLeast('admin') || (atLeast('manager') && ownedBy(t?.created_by)),
    canDeleteTender: (t) => atLeast('admin') || (atLeast('manager') && ownedBy(t?.created_by)),
    canBulkEdit:     atLeast('manager'),
    canImport:       atLeast('manager'),

    // Deal permissions
    canCreateDeal: atLeast('manager'),
    canEditDeal:   (d) => atLeast('admin') || (atLeast('manager') && ownedBy(d?.created_by)),
    canDeleteDeal: (d) => atLeast('admin') || (atLeast('manager') && ownedBy(d?.created_by)),

    // Settings
    canManageSettings: atLeast('admin'),
    canViewAnalytics:  atLeast('manager'),

    // Helper: returns disabled style object if not permitted
    gateStyle: (permitted) => permitted ? {} : { opacity: 0.4, pointerEvents: 'none', cursor: 'not-allowed' },
    gateProps: (permitted) => permitted ? {} : { disabled: true, title: 'You don\'t have permission for this action' },
  }
}
