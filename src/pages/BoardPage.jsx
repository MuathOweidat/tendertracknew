import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag } from '../components/ui'
import { ACTIVE_S, CLOSED_S, STATUS_COLORS, DEPT_COLORS } from '../lib/constants'
import { dLeft, fmtShort } from '../lib/utils'

const BOARD_COLS = [
  { key:'Pending',                label:'Pending',             statuses:['Pending'] },
  { key:'Purchased',              label:'Purchased',           statuses:['Purchased'] },
  { key:'Submitted',              label:'Submitted',           statuses:['Submitted','Reschedule'] },
  { key:'Under Review',           label:'Under Review',        statuses:['Under Review','Lowest Price','Covering Participation'] },
  { key:'Won',                    label:'Won ✓',               statuses:['Won'] },
  { key:'Closed',                 label:'Closed',              statuses:['Lost','Canceled','Canceled by Client','Purchased - No Bid'] },
]

export default function BoardPage() {
  const { tenders, updateTender } = useAppStore()
  const [fDept, setFDept] = useState('All')
  const [q, setQ] = useState('')
  const DEPTS_LOCAL = ['AIMS-Projects','AIMS-Consultations','AIMS-Sales','Plexus']

  const filtered = useMemo(() => {
    let l = [...tenders]
    if (fDept !== 'All') l = l.filter(t => t.dept === fDept)
    if (q) { const lq=q.toLowerCase(); l=l.filter(t=>[t.tenderName,t.client].some(f=>f?.toLowerCase().includes(lq))) }
    return l
  }, [tenders, fDept, q])

  const stats = { total:filtered.length, won:filtered.filter(t=>t.status==='Won').length, active:filtered.filter(t=>ACTIVE_S.includes(t.status)).length }

  return (
    <div>
      {/* Toolbar */}
      <div className="card" style={{padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div className="search-wrap" style={{flex:'1 1 180px',minWidth:0}}>
          <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
          <input placeholder="Search tenders…" value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button className="search-clear" onClick={()=>setQ('')}>×</button>}
        </div>
        <select className={`filter-select${fDept!=='All'?' has-value':''}`} value={fDept} onChange={e=>setFDept(e.target.value)}>
          <option value="All">All Depts</option>
          {DEPTS_LOCAL.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{fontSize:12,color:'var(--text-3)'}}>{stats.total} tenders · {stats.active} active · {stats.won} won</span>
      </div>

      {/* Kanban */}
      <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:12,alignItems:'flex-start'}}>
        {BOARD_COLS.map(col => {
          const items = filtered.filter(t => col.statuses.includes(t.status))
          const sc = STATUS_COLORS[col.statuses[0]] || {}
          const colVal = items.filter(t=>t.ourBid).reduce((s,t)=>s+(Number(t.ourBid)||0),0)
          return (
            <div key={col.key} style={{flex:'0 0 240px',minWidth:240}}>
              {/* Column header */}
              <div style={{background:sc.light||'var(--surface-2)',border:`1px solid ${sc.border||'var(--border)'}`,borderRadius:10,padding:'9px 13px',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0}}>
                <div>
                  <span style={{fontSize:11.5,fontWeight:750,color:sc.color||'var(--text-2)',textTransform:'uppercase',letterSpacing:'.05em'}}>{col.label}</span>
                  {colVal>0&&<div style={{fontSize:10,color:sc.color||'var(--text-3)',marginTop:1,fontVariantNumeric:'tabular-nums'}}>{fmtShort(colVal)}</div>}
                </div>
                <span style={{fontSize:12,fontWeight:800,color:sc.color||'var(--text-2)',background:'rgba(0,0,0,.08)',padding:'1px 8px',borderRadius:20}}>{items.length}</span>
              </div>

              {/* Cards */}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {items.length === 0 ? (
                  <div style={{padding:'28px 12px',textAlign:'center',color:'var(--text-4)',fontSize:12,border:'1.5px dashed var(--border)',borderRadius:10}}>No tenders</div>
                ) : items.map(t => {
                  const d = dLeft(t.closingDate)
                  const closed = CLOSED_S.includes(t.status)
                  const urg = !closed&&d!==null&&d<=3
                  const warn = !closed&&d!==null&&d>3&&d<=7
                  const uc = urg?'var(--danger)':warn?'var(--warning)':'var(--text-3)'
                  return (
                    <div key={t.id} style={{background:'var(--surface)',borderRadius:10,border:`1px solid ${urg?'var(--danger-b)':warn?'var(--warning-b)':'var(--border)'}`,padding:'11px 13px',boxShadow:'var(--sh-sm)',borderLeft:`4px solid ${urg?'var(--danger)':warn?'var(--warning)':(sc.dot||'var(--border)')}`}}>
                      <div style={{fontSize:13,fontWeight:700,color:'var(--text)',lineHeight:1.35,marginBottom:5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{t.tenderName}</div>
                      <div style={{display:'flex',gap:5,alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
                        <DTag dept={t.dept}/>
                        {t.client&&<span style={{fontSize:11,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.client}</span>}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        {t.ourBid?<span style={{fontSize:12,fontWeight:800,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{fmtShort(t.ourBid)}</span>:<span/>}
                        {t.closingDate&&!closed&&d!==null&&<span style={{fontSize:11,fontWeight:700,color:uc}}>{d<0?`${Math.abs(d)}d over`:d===0?'Today':`${d}d`}</span>}
                      </div>
                      {(t.tags||[]).length>0&&<div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:6}}>{(t.tags||[]).slice(0,3).map(tag=><span key={tag} style={{fontSize:9,fontWeight:700,color:'var(--blue)',background:'var(--blue-l)',border:'1px solid var(--blue-ll)',borderRadius:8,padding:'0 4px'}}>{tag}</span>)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
