import React from 'react'
import { STATUS_COLORS, DEPT_COLORS, PRIORITY_COLORS, INV_STATUS_COLORS, DEAL_STATUS_COLORS } from '../../lib/constants'
import { clsx } from '../../lib/utils'

// ── Status Badge ──────────────────────────────────────────────────────────────
export function Badge({ status }) {
  const c = STATUS_COLORS[status] || { color:'var(--text-3)', light:'var(--surface-2)', dot:'var(--border)', border:'var(--border)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, color:c.color, background:c.light, border:`1px solid ${c.border}`, whiteSpace:'nowrap', letterSpacing:'.02em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0, display:'inline-block' }} />
      {status}
    </span>
  )
}

// ── Dept Tag ──────────────────────────────────────────────────────────────────
export function DTag({ dept }) {
  const c = DEPT_COLORS[dept] || { color:'var(--text-3)', bg:'var(--surface-2)' }
  const label = (dept || '').replace('AIMS-', '').replace('Plexus', 'PLX')
  return (
    <span style={{ fontSize:10, fontWeight:700, color:c.color, background:c.bg, padding:'2px 7px', borderRadius:20, letterSpacing:'.04em', whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

// ── Priority Badge ────────────────────────────────────────────────────────────
export function PBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium
  return (
    <span style={{ fontSize:10, fontWeight:700, color:c.color, background:c.bg, border:`1px solid ${c.border}`, padding:'2px 7px', borderRadius:20 }}>
      {priority}
    </span>
  )
}

// ── Invoice Status Badge ──────────────────────────────────────────────────────
export function InvBadge({ status }) {
  const c = INV_STATUS_COLORS[status] || { bg:'var(--surface-2)', color:'var(--text-3)', border:'var(--border)', dot:'var(--text-4)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:10.5, fontWeight:700, color:c.color, background:c.bg, border:`1px solid ${c.border}`, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0, display:'inline-block' }} />
      {status}
    </span>
  )
}

// ── Deal Status Badge ─────────────────────────────────────────────────────────
export function DealBadge({ status }) {
  const c = DEAL_STATUS_COLORS[status] || { bg:'var(--surface-2)', color:'var(--text-3)', border:'var(--border)', dot:'var(--text-4)' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, fontSize:10.5, fontWeight:700, color:c.color, background:c.bg, border:`1px solid ${c.border}`, whiteSpace:'nowrap', letterSpacing:'.02em' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot, flexShrink:0, display:'inline-block' }} />
      {status}
    </span>
  )
}

// ── NEW record dot ────────────────────────────────────────────────────────────
export function NewDot() {
  return <span className="new-dot">NEW</span>
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spin({ size = 16, color = 'var(--blue)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation:'spin 1s linear infinite', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity=".25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Toasts ────────────────────────────────────────────────────────────────────
export function Toasts({ list }) {
  const icons = {
    '':     { cls:'toast-success', icon:'✓', bg:'var(--success)' },
    err:    { cls:'toast-err',     icon:'✕', bg:'var(--danger)'  },
    warn:   { cls:'toast-warn',    icon:'⚠', bg:'var(--warning)' },
    info:   { cls:'toast-success', icon:'ℹ', bg:'var(--info)'    },
  }
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {list.map(t => {
        const m = icons[t.type || ''] || icons['']
        return (
          <div key={t.id} className={`toast-item ${m.cls}`}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:m.bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
              {m.icon}
            </div>
            <span style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Form label / input helpers ────────────────────────────────────────────────
export function Lbl({ children }) {
  return <label style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:5 }}>{children}</label>
}

export function Inp({ value, onChange, placeholder, type = 'text', ...props }) {
  return (
    <input
      className="inp-base" type={type}
      value={value ?? ''} onChange={onChange}
      placeholder={placeholder} {...props}
    />
  )
}

export function Sel({ value, onChange, children, ...props }) {
  return (
    <select className="inp-base" value={value ?? ''} onChange={onChange} {...props}>
      {children}
    </select>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ title, message, onConfirm, onClose, danger = false }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(440px,94vw)', padding:28 }}>
        <h3 style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:10 }}>{title}</h3>
        <p style={{ fontSize:13.5, color:'var(--text-2)', lineHeight:1.6, marginBottom:24 }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Error Boundary ────────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[TenderTrack]', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
          <div className="card" style={{ maxWidth:480, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Something went wrong</h2>
            <pre style={{ fontSize:11, color:'var(--danger)', background:'var(--danger-l)', padding:12, borderRadius:8, overflow:'auto', maxHeight:200, textAlign:'left', marginBottom:20 }}>
              {String(this.state.error)}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div style={{ textAlign:'center', padding:'64px 20px', background:'var(--surface)', borderRadius:18, border:'1.5px dashed var(--border)' }}>
      <div style={{ fontSize:44, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:750, color:'var(--text-2)', marginBottom:8, letterSpacing:'-.02em' }}>{title}</div>
      {message && <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:20 }}>{message}</div>}
      {action}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, accent = 'var(--blue)', onClick }) {
  return (
    <div onClick={onClick} className="card" style={{ padding:'14px 16px', cursor: onClick ? 'pointer' : 'default', borderLeft:`3px solid ${accent}`, transition:'transform .1s, box-shadow .1s' }} onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='var(--sh-md)' }}} onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
      <div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color:accent, letterSpacing:'-.03em', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:5 }}>{sub}</div>}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, actions }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', letterSpacing:'-.03em' }}>{title}</h2>
        {sub && <p style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:8 }}>{actions}</div>}
    </div>
  )
}
