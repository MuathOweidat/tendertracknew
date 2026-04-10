import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag, EmptyState } from '../components/ui'
import { CLOSED_S } from '../lib/constants'
import { dLeft } from '../lib/utils'

export default function TimelinePage() {
  const { tenders } = useAppStore()
  const [months, setMonths] = useState(3)
  const [fDept, setFDept] = useState('All')
  const DEPTS_LOCAL = ['AIMS-Projects','AIMS-Consultations','AIMS-Sales','Plexus']

  const { cols, rows } = useMemo(() => {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date(now.getFullYear(), now.getMonth()+months, 0)
    const totalDays = Math.ceil((end-start)/864e5)+1

    const cols = []
    const cur  = new Date(start)
    while (cur <= end) {
      cols.push({ date: new Date(cur), label: cur.getDate()===1||cur.getDay()===0 ? cur.toLocaleDateString('en',{month:'short',day:'numeric'}) : '' })
      cur.setDate(cur.getDate()+1)
    }

    const applicable = tenders.filter(t => {
      if (fDept!=='All'&&t.dept!==fDept) return false
      return t.issueDate||t.closingDate
    })

    const rows = applicable.map(t => {
      const iDate = t.issueDate   ? new Date(t.issueDate+'T00:00:00')   : start
      const cDate = t.closingDate ? new Date(t.closingDate+'T00:00:00') : end
      const left  = Math.max(0, Math.ceil((iDate-start)/864e5))
      const width = Math.max(1, Math.ceil((cDate-iDate)/864e5)+1)
      const d     = dLeft(t.closingDate)
      const urg   = !CLOSED_S.includes(t.status)&&d!==null&&d<=7
      return { tender:t, left, width, urg }
    })

    return { cols, rows, totalDays }
  }, [tenders, months, fDept])

  const COL_W = 28

  if (!tenders.length) return <EmptyState icon="⏱" title="No tenders" message="Add tenders with issue and closing dates to see the timeline" />

  return (
    <div>
      <div className="card" style={{padding:'10px 14px',marginBottom:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <select className="filter-select" value={months} onChange={e=>setMonths(Number(e.target.value))}>
          <option value={1}>1 Month</option><option value={3}>3 Months</option><option value={6}>6 Months</option>
        </select>
        <select className={`filter-select${fDept!=='All'?' has-value':''}`} value={fDept} onChange={e=>setFDept(e.target.value)}>
          <option value="All">All Depts</option>
          {DEPTS_LOCAL.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{fontSize:12,color:'var(--text-3)'}}>{rows.length} tenders shown</span>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          {/* Header: dates */}
          <div style={{display:'flex',borderBottom:'2px solid var(--border)',background:'var(--surface-2)',minWidth:cols.length*COL_W+200}}>
            <div style={{width:200,flexShrink:0,padding:'8px 12px',fontSize:10.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em'}}>Tender</div>
            <div style={{display:'flex',flex:1}}>
              {cols.map((c,i)=>(
                <div key={i} style={{width:COL_W,flexShrink:0,padding:'6px 2px',fontSize:9,color:c.label?'var(--text-2)':'transparent',textAlign:'center',fontWeight:600,borderLeft:'1px solid var(--border-l)',background:c.date.toISOString().split('T')[0]===new Date().toISOString().split('T')[0]?'rgba(30,102,212,.06)':'transparent'}}>
                  {c.label||'.'}
                </div>
              ))}
            </div>
          </div>
          {/* Rows */}
          {rows.map(({tender:t,left,width,urg},i)=>(
            <div key={t.id} style={{display:'flex',borderBottom:'1px solid var(--border-l)',minWidth:cols.length*COL_W+200,background:i%2===0?'var(--surface)':'var(--surface-2)'}}>
              <div style={{width:200,flexShrink:0,padding:'10px 12px',display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                <DTag dept={t.dept}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:11.5,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
                  <div style={{fontSize:10,color:'var(--text-3)'}}>{t.status}</div>
                </div>
              </div>
              <div style={{flex:1,position:'relative',height:44,paddingTop:10}}>
                {/* Today marker */}
                <div style={{position:'absolute',top:0,bottom:0,left:Math.ceil((new Date()-new Date(new Date().getFullYear(),new Date().getMonth(),1))/864e5)*COL_W,width:2,background:'var(--blue)',opacity:.4,zIndex:2}}/>
                {/* Bar */}
                <div style={{position:'absolute',top:10,left:left*COL_W+1,width:Math.min(width*COL_W-2,cols.length*COL_W-left*COL_W-4),height:24,borderRadius:6,background:t.status==='Won'?'var(--success)':t.status==='Lost'?'var(--danger)':urg?'var(--warning)':'var(--blue)',opacity:.85,display:'flex',alignItems:'center',padding:'0 6px',overflow:'hidden',cursor:'default'}} title={`${t.tenderName} (${t.issueDate||'?'} → ${t.closingDate||'?'})`}>
                  <span style={{fontSize:9,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.client||t.tenderNumber||''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
