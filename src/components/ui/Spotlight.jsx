import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { Badge, DTag } from './index'
import { dLeft } from '../../lib/utils'
import { CLOSED_S } from '../../lib/constants'

export default function Spotlight() {
  const { tenders, setSpotlight } = useAppStore()
  const [q, setQ] = useState('')
  const ref = useRef()
  const navigate = useNavigate()

  useEffect(() => { ref.current?.focus() }, [])

  const results = useMemo(() => {
    if (!q.trim()) return []
    const lq = q.toLowerCase()
    return tenders.filter(t =>
      [t.tenderName, t.client, t.tenderNumber, t.dept, t.vendor]
        .some(f => f?.toLowerCase().includes(lq))
    ).slice(0, 8)
  }, [tenders, q])

  const go = t => {
    navigate('/tenders')
    setSpotlight(false)
  }

  return (
    <div className="modal-overlay" onClick={() => setSpotlight(false)}>
      <div style={{ width:'min(620px,96vw)', background:'var(--surface)', borderRadius:'var(--r-2xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-lg)', overflow:'hidden', animation:'popIn .18s cubic-bezier(.4,0,.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid var(--border-l)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Search tenders, clients, numbers…" style={{ flex:1, border:'none', outline:'none', fontSize:15, background:'transparent', color:'var(--text)' }} />
          <kbd style={{ fontSize:10, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 6px', color:'var(--text-3)' }}>ESC</kbd>
        </div>
        {results.length > 0 ? (
          <div style={{ maxHeight:400, overflowY:'auto' }}>
            {results.map(t => {
              const d = dLeft(t.closingDate)
              const closed = CLOSED_S.includes(t.status)
              return (
                <div key={t.id} onClick={() => go(t)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', cursor:'pointer', borderBottom:'1px solid var(--border-l)', transition:'background .1s' }} onMouseEnter={e => e.currentTarget.style.background='var(--blue-l)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                  <DTag dept={t.dept} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{t.client || t.tenderNumber}</div>
                  </div>
                  <Badge status={t.status} />
                  {!closed && d !== null && <span style={{ fontSize:11, color: d<=3?'var(--danger)':d<=7?'var(--warning)':'var(--text-3)', fontWeight:600 }}>{d<0?`${Math.abs(d)}d over`:d===0?'Today':`${d}d`}</span>}
                </div>
              )
            })}
          </div>
        ) : q ? (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>No results for "{q}"</div>
        ) : (
          <div style={{ padding:'28px 20px', textAlign:'center', color:'var(--text-3)', fontSize:13 }}>
            Start typing to search {tenders.length} tenders…
          </div>
        )}
      </div>
    </div>
  )
}
