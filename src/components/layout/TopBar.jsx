import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'

const TITLES = {
  '/':           { title:'Dashboard',             sub:'Overview & KPIs' },
  '/tenders':    { title:'Tenders',               sub:'Bid management' },
  '/bidbonds':   { title:'Bid Bonds',             sub:'Bond tracking' },
  '/analytics':  { title:'Analytics',             sub:'Performance insights' },
  '/calendar':   { title:'Calendar',              sub:'Deadlines & events' },
  '/clients':    { title:'Clients',               sub:'Customer relationships' },
  '/intel':      { title:'Intelligence',          sub:'Competitor analysis' },
  '/timeline':   { title:'Timeline',              sub:'Gantt & activity' },
  '/board':      { title:'Board',                 sub:'Kanban view' },
  '/reports':    { title:'Reports',               sub:'Export & analytics' },
  '/deals':      { title:'Sales & Payment Tracker', sub:'Deals, invoices & payments' },
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setShowNew, setSpotlight, setShowNotifs, darkMode, toggleDark, tenders } = useAppStore()
  const info = TITLES[location.pathname] || TITLES['/']

  const overdueCount = tenders.filter(t => {
    const d = t.closingDate ? Math.ceil((new Date(t.closingDate+'T00:00:00')-new Date())/86400000) : null
    return d!==null && d<0 && !['Won','Lost','Canceled','Canceled by Client','Purchased - No Bid'].includes(t.status)
  }).length

  return (
    <div className="top-bar">
      <div style={{ flex:1, minWidth:0 }}>
        <div className="top-bar-title">{info.title}</div>
        <div className="top-bar-sub">{info.sub}</div>
      </div>

      {/* Search pill */}
      <button onClick={() => setSpotlight(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', border:'1.5px solid var(--border)', borderRadius:'var(--r-lg)', background:'var(--surface-2)', color:'var(--text-3)', fontSize:12.5, cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>
        Search… <kbd style={{ fontSize:9, background:'var(--surface-3)', border:'1px solid var(--border)', borderRadius:4, padding:'1px 5px', marginLeft:4 }}>⌘K</kbd>
      </button>

      {/* Notification bell */}
      <button onClick={() => setShowNotifs(true)} style={{ position:'relative', width:36, height:36, borderRadius:'var(--r)', border:'1.5px solid var(--border)', background:'var(--surface-2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-l)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-2)'}}>
        🔔
        {overdueCount > 0 && (
          <span style={{ position:'absolute', top:-4, right:-4, background:'var(--danger)', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 4px', borderRadius:20, minWidth:16, textAlign:'center' }}>{overdueCount}</span>
        )}
      </button>

      {/* Dark mode toggle */}
      <button onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'} style={{ width:36, height:36, borderRadius:'var(--r)', border:'1.5px solid var(--border)', background:'var(--surface-2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all .15s', flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-l)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-2)'}}>
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* New tender */}
      <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
        New Tender
      </button>
    </div>
  )
}
