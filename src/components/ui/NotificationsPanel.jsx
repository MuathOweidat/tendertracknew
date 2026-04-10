import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { DTag, Badge } from './index'

const TYPE_CONFIG = {
  overdue: { icon:'🚨', color:'var(--danger)',  bg:'var(--danger-l)',  border:'var(--danger-b)',  label:'Overdue'    },
  urgent:  { icon:'⏰', color:'var(--danger)',  bg:'var(--danger-l)',  border:'var(--danger-b)',  label:'Due Soon'   },
  warning: { icon:'⚠️', color:'var(--warning)', bg:'var(--warning-l)', border:'var(--warning-b)', label:'This Week'  },
  bond:    { icon:'🏦', color:'var(--info)',    bg:'var(--info-l)',    border:'var(--info-b)',    label:'Bond Expiry' },
  followup:{ icon:'📌', color:'var(--purple)',  bg:'var(--purple-l)',  border:'var(--purple-b)',  label:'Follow-up'  },
}

export default function NotificationsPanel({ notifications, onClose }) {
  const { log } = useAppStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState('alerts')

  const grouped = notifications.reduce((acc, n) => {
    const key = n.type
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  const goToTender = t => {
    navigate('/tenders')
    onClose()
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" style={{ width:'min(480px,96vw)' }}>

        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-.03em' }}>
              🔔 Notifications
              {notifications.length > 0 && (
                <span style={{ fontSize:11, fontWeight:800, background:'var(--danger)', color:'#fff', padding:'1px 7px', borderRadius:20, marginLeft:8, verticalAlign:'middle' }}>
                  {notifications.length}
                </span>
              )}
            </div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Alerts and activity</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border-l)', flexShrink:0 }}>
          {[
            { id:'alerts',   label:'Alerts',   badge: notifications.length },
            { id:'activity', label:'Activity',  badge: log.length },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`dp-tab-btn${activeTab===t.id?' active':''}`} style={{ flex:1 }}>
              {t.label}
              {t.badge > 0 && <span style={{ fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:20, background: activeTab===t.id?'var(--blue)':'var(--border)', color: activeTab===t.id?'#fff':'var(--text-3)', marginLeft:6 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto' }}>

          {/* ALERTS */}
          {activeTab === 'alerts' && (
            <div>
              {notifications.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'var(--text-2)', marginBottom:6 }}>All clear</div>
                  <div style={{ fontSize:13, color:'var(--text-3)' }}>No overdue tenders or upcoming deadlines</div>
                </div>
              ) : (
                Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                  const items = grouped[type] || []
                  if (!items.length) return null
                  return (
                    <div key={type}>
                      {/* Group header */}
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px 6px', background:'var(--surface-2)', borderBottom:'1px solid var(--border-l)', position:'sticky', top:0, zIndex:1 }}>
                        <span>{cfg.icon}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:cfg.color, textTransform:'uppercase', letterSpacing:'.06em' }}>{cfg.label}</span>
                        <span style={{ fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{items.length}</span>
                      </div>
                      {/* Items */}
                      {items.map(n => (
                        <div
                          key={n.id}
                          onClick={() => goToTender(n.tender)}
                          style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid var(--border-l)', cursor:'pointer', transition:'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
                          onMouseLeave={e => e.currentTarget.style.background=''}
                        >
                          <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {n.tender.tenderName}
                            </div>
                            <div style={{ display:'flex', gap:6, marginTop:3, alignItems:'center' }}>
                              <DTag dept={n.tender.dept} />
                              {n.tender.client && <span style={{ fontSize:11, color:'var(--text-3)' }}>{n.tender.client}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{n.label}</div>
                            {n.tender.closingDate && <div style={{ fontSize:10, color:'var(--text-3)', marginTop:1 }}>{n.tender.closingDate}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === 'activity' && (
            <div>
              {log.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-3)', fontSize:13 }}>No activity yet</div>
              ) : log.map((entry, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 16px', borderBottom:'1px solid var(--border-l)' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                    {entry.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.5 }}>{entry.msg}</div>
                    <div style={{ fontSize:10.5, color:'var(--text-4)', marginTop:2 }}>{entry.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border-l)', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--surface-2)' }}>
          <span style={{ fontSize:12, color:'var(--text-3)' }}>
            {notifications.length > 0 ? `${notifications.length} alert${notifications.length!==1?'s':''} need attention` : 'All clear ✓'}
          </span>
          <button onClick={() => { navigate('/tenders'); onClose() }} style={{ fontSize:12, color:'var(--blue)', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
            View all tenders →
          </button>
        </div>
      </div>
    </>
  )
}
