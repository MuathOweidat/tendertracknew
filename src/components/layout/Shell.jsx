import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { useAuth } from '../../hooks/useAuth'
import { Toasts, ErrorBoundary } from '../ui'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import Spotlight from '../ui/Spotlight'
import AppSkeleton from '../ui/AppSkeleton'
import NotificationsPanel from '../ui/NotificationsPanel'
import ImportModal from '../tenders/ImportModal'

// Page imports
import DashboardPage  from '../../pages/DashboardPage'
import TendersPage    from '../../pages/TendersPage'
import BidBondsPage   from '../../pages/BidBondsPage'
import AnalyticsPage  from '../../pages/AnalyticsPage'
import CalendarPage   from '../../pages/CalendarPage'
import DealsPage      from '../../pages/DealsPage'
import ClientsPage    from '../../pages/ClientsPage'
import IntelPage      from '../../pages/IntelPage'
import ReportsPage    from '../../pages/ReportsPage'
import BoardPage      from '../../pages/BoardPage'
import TimelinePage   from '../../pages/TimelinePage'
import SettingsModal  from '../settings/SettingsModal'
import NewTenderModal from '../tenders/NewTenderModal'

export default function Shell() {
  const {
    toasts, spotlight, setSpotlight,
    showNew, setShowNew,
    showSettings, setShowSettings,
    showNotifs, setShowNotifs,
    sidebarCollapsed, darkMode,
    fetchTenders, fetchDeals,
    subscribeRealtime, unsubscribeRealtime,
    hydrateUserSettings,
    tenders, tendersLoading,
    notifications,
  } = useAppStore()

  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Apply dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [])

  // Initial data fetch + realtime
  useEffect(() => {
    fetchTenders()
    fetchDeals()
    const channel = subscribeRealtime()
    return () => unsubscribeRealtime()
  }, [])

  // Hydrate user settings from Supabase
  useEffect(() => {
    if (user?.id) hydrateUserSettings(user.id)
  }, [user?.id])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      const inInput = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSpotlight(v => !v); return }
      if (inInput) return
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const map = { '1':'/','2':'/tenders','3':'/bidbonds','4':'/analytics','5':'/calendar','6':'/clients','7':'/intel','8':'/timeline','9':'/board','0':'/deals' }
        if (map[e.key]) { navigate(map[e.key]); return }
        if ((e.key === 'n' || e.key === 'N') && !showNew) { setShowNew(true); return }
        if (e.key === 'r' || e.key === 'R') { navigate('/reports'); return }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showNew])

  if (tendersLoading && tenders.length === 0) return <AppSkeleton />

  const sidebarCls = sidebarCollapsed ? 'sidebar collapsed' : 'sidebar'
  const mainCls    = `main-area${sidebarCollapsed ? ' sidebar-collapsed' : ''}`

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <aside className={sidebarCls}>
          <Sidebar />
        </aside>

        <div className={mainCls}>
          <TopBar />
          <main className="page-wrap">
            <Routes>
              <Route path="/"          element={<PageWrap><DashboardPage /></PageWrap>} />
              <Route path="/tenders"   element={<PageWrap><TendersPage /></PageWrap>} />
              <Route path="/bidbonds"  element={<PageWrap><BidBondsPage /></PageWrap>} />
              <Route path="/analytics" element={<PageWrap><AnalyticsPage /></PageWrap>} />
              <Route path="/calendar"  element={<PageWrap><CalendarPage /></PageWrap>} />
              <Route path="/deals"     element={<PageWrap><DealsPage /></PageWrap>} />
              <Route path="/clients"   element={<PageWrap><ClientsPage /></PageWrap>} />
              <Route path="/intel"     element={<PageWrap><IntelPage /></PageWrap>} />
              <Route path="/reports"   element={<PageWrap><ReportsPage /></PageWrap>} />
              <Route path="/board"     element={<PageWrap><BoardPage /></PageWrap>} />
              <Route path="/timeline"  element={<PageWrap><TimelinePage /></PageWrap>} />
            </Routes>
          </main>
        </div>

        <MobileNav />

        {/* Global overlays */}
        {spotlight   && <Spotlight />}
        {showNew     && <NewTenderModal onClose={() => setShowNew(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showNotifs  && <NotificationsPanel notifications={notifications} onClose={() => setShowNotifs(false)} />}

        {/* Live sync indicator */}
        <RealtimeIndicator />

        <Toasts list={toasts} />
      </div>
    </ErrorBoundary>
  )
}

// ── Realtime live dot ─────────────────────────────────────────────────────────
function RealtimeIndicator() {
  return (
    <div title="Live sync active" style={{ position:'fixed', bottom:12, left:12, display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,.5)', zIndex:50, pointerEvents:'none' }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 0 0 rgba(16,185,129,.4)', animation:'livePulse 2s ease-in-out infinite' }} />
      <span style={{ fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', fontSize:9 }}>Live</span>
    </div>
  )
}

// ── Mobile nav ────────────────────────────────────────────────────────────────
function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setShowNew, notifications } = useAppStore()
  const current  = location.pathname
  const urgCount = notifications.filter(n => n.type==='overdue'||n.type==='urgent').length

  const tabs = [
    { path:'/',        icon:'📊', label:'Home'   },
    { path:'/tenders', icon:'📋', label:'Tenders', badge: urgCount },
    { path:null,       icon:'➕', label:'New', action: true },
    { path:'/deals',   icon:'🤝', label:'Sales'  },
    { path:'/analytics',icon:'📈',label:'Stats'  },
  ]

  return (
    <nav className="mobile-nav">
      {tabs.map((t, i) => (
        <button
          key={i}
          className={`mobile-nav-btn ${!t.action && current === t.path ? 'active' : ''}`}
          onClick={() => t.action ? setShowNew(true) : navigate(t.path)}
          style={{ position:'relative' }}
        >
          <span className="mn-icon">{t.icon}</span>
          <span className="mn-lbl">{t.label}</span>
          {t.badge > 0 && (
            <span style={{ position:'absolute', top:2, right:'50%', marginRight:-14, background:'var(--danger)', color:'#fff', fontSize:8, fontWeight:800, padding:'1px 4px', borderRadius:20, minWidth:14, textAlign:'center' }}>{t.badge}</span>
          )}
        </button>
      ))}
    </nav>
  )
}


// ── Per-page error boundary ───────────────────────────────────────────────────
class PageWrap extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('[TenderTrack] Page error:', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--danger)', marginBottom:8 }}>Page Error</div>
          <pre style={{ fontSize:11, background:'var(--surface-2)', padding:12, borderRadius:8, maxWidth:500, margin:'0 auto 20px', overflow:'auto', textAlign:'left' }}>
            {String(this.state.error)}
          </pre>
          <button className="btn btn-primary btn-sm" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
