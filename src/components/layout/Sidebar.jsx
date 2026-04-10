import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { useAuth } from '../../hooks/useAuth'
import { dLeft } from '../../lib/utils'
import { CLOSED_S, ACTIVE_S, BB_ALERTS } from '../../lib/constants'

const NAV = [
  { path:'/',          label:'Dashboard',           icon:'📊', key:'dashboard' },
  { path:'/tenders',   label:'Tenders',             icon:'📋', key:'tenders'  },
  { path:'/bidbonds',  label:'Bid Bonds',           icon:'🏦', key:'bidbonds' },
  { path:'/analytics', label:'Analytics',           icon:'📈', key:'analytics'},
  { path:'/calendar',  label:'Calendar',            icon:'📅', key:'calendar' },
  { path:'/clients',   label:'Clients',             icon:'🏢', key:'clients'  },
  { path:'/intel',     label:'Intelligence',        icon:'🔍', key:'intel'    },
  { divider: true, label:'Views' },
  { path:'/timeline',  label:'Timeline',            icon:'⏱', key:'timeline' },
  { path:'/board',     label:'Board',               icon:'🗂', key:'board'   },
  { path:'/reports',   label:'Reports',             icon:'📊', key:'reports' },
  { divider: true, label:'Sales' },
  { path:'/deals',     label:'Sales & Payments',    icon:'🤝', key:'deals'   },
]

export default function Sidebar() {
  const { tenders, sidebarCollapsed, toggleSidebar, setShowNew, setShowSettings, setSpotlight, setShowNotifs } = useAppStore()
  const { signOut, user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const overdueCount = tenders.filter(t => { const d=dLeft(t.closingDate); return d!==null&&d<0&&!CLOSED_S.includes(t.status) }).length
  const activeCount  = tenders.filter(t => ACTIVE_S.includes(t.status)).length
  const bbAlerts = tenders.filter(t => {
    const bb = t.bidBond||{}; const bbA = BB_ALERTS[t.status]
    return bbA && bb.amount && bb.bbStatus!=='N/A' && bb.bbStatus!=='Released'
  }).length
  const newCount = tenders.filter(t => t.createdAt && (Date.now()-new Date(t.createdAt).getTime())<7*24*60*60*1000).length

  const badges = {
    tenders:  overdueCount,
    bidbonds: bbAlerts,
    tenders_new: newCount,
  }

  return (
    <>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span style={{ fontSize:16 }}>📋</span>
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-title-wrap">
            <div className="sidebar-title">TenderTrack</div>
            <div className="sidebar-sub">AIMS Bid Management</div>
          </div>
        )}
        <button onClick={toggleSidebar} style={{ background:'none', border:'none', color:'rgba(255,255,255,.5)', cursor:'pointer', padding:4, borderRadius:6, marginLeft:'auto', flexShrink:0 }} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d={sidebarCollapsed ? 'M5 2l5 5-5 5' : 'M9 2L4 7l5 5'} />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.divider) return (
            <div key={i}>
              <div className="sidebar-divider" />
              {!sidebarCollapsed && <div className="sidebar-section-label">{item.label}</div>}
            </div>
          )
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          const badge  = badges[item.key] || 0
          return (
            <button
              key={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              data-tooltip={item.label}
            >
              <span className="nav-item-icon" style={{ fontSize:15 }}>{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {badge > 0 && (
                <span className="nav-badge" style={{ background:'var(--danger)', color:'#fff' }}>{badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={() => setSpotlight(true)} data-tooltip="Search (⌘K)">
          <span className="nav-item-icon">🔎</span>
          <span className="nav-item-label">Search <kbd style={{ fontSize:9, opacity:.6, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:4, padding:'1px 4px' }}>⌘K</kbd></span>
        </button>
        <button className="nav-item" onClick={() => setShowNotifs(true)} data-tooltip="Notifications">
          <span className="nav-item-icon">🔔</span>
          <span className="nav-item-label">Notifications</span>
          {overdueCount > 0 && <span className="nav-badge" style={{ background:'var(--danger)', color:'#fff' }}>{overdueCount}</span>}
        </button>
        <button className="nav-item" onClick={() => setShowSettings(true)} data-tooltip="Settings">
          <span className="nav-item-icon">⚙️</span>
          <span className="nav-item-label">Settings</span>
        </button>
        <button className="nav-item" onClick={signOut} data-tooltip="Sign out">
          <span className="nav-item-icon">🚪</span>
          <span className="nav-item-label">Sign out</span>
        </button>
        {!sidebarCollapsed && user && (
          <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(255,255,255,.06)', borderRadius:8, fontSize:11, color:'rgba(255,255,255,.5)' }}>
            {user.email}
          </div>
        )}
      </div>
    </>
  )
}
