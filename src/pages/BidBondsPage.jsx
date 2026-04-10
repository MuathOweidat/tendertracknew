import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag, EmptyState } from '../components/ui'
import { BB_ALERTS, BB_STATUS, CLOSED_S } from '../lib/constants'
import { dLeft, fmtCurrency } from '../lib/utils'

const BB_STATUS_COLORS = {
  Active:   { bg:'#dbeafe', color:'#1e40af', border:'#93c5fd' },
  Extended: { bg:'#fef3c7', color:'#92400e', border:'#fcd34d' },
  'Cancel Required':          { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
  'Performance Bond Required':{ bg:'#d1fae5', color:'#065f46', border:'#6ee7b7' },
  Released: { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' },
  Forfeited:{ bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
  'N/A':    { bg:'#f1f5f9', color:'#94a3b8', border:'#e2e8f0' },
}

export default function BidBondsPage() {
  const { tenders } = useAppStore()
  const [q, setQ]             = useState('')
  const [fStatus, setFStatus] = useState('All')

  const withBonds = useMemo(() => {
    return tenders.filter(t => {
      const bb = t.bidBond
      return bb && typeof bb === 'object' && bb.amount && bb.bbStatus && bb.bbStatus !== 'N/A'
    })
  }, [tenders])

  const filtered = useMemo(() => {
    let l = [...withBonds]
    if (q) { const lq=q.toLowerCase(); l=l.filter(t=>[t.tenderName,t.client,t.bidBond?.bank].some(f=>f?.toLowerCase().includes(lq))) }
    if (fStatus !== 'All') l = l.filter(t => t.bidBond?.bbStatus === fStatus)
    return l
  }, [withBonds, q, fStatus])

  const actionPending = withBonds.filter(t => {
    const bb=t.bidBond||{}; const bbA=BB_ALERTS[t.status]
    return bbA&&bb.amount&&bb.bbStatus!=='N/A'&&bb.bbStatus!=='Released'&&!(bbA.action==='cancel'&&bb.bbStatus==='Cancel Required')&&!(bbA.action==='perform'&&bb.bbStatus==='Performance Bond Required')
  })
  const expiringSoon = withBonds.filter(t => {
    const d=t.bidBond?.expiryDate?dLeft(t.bidBond.expiryDate):null
    return d!==null&&d>=0&&d<=14&&t.bidBond?.bbStatus==='Active'
  })

  return (
    <div>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          {l:'Total Bonds',v:withBonds.length,sub:'across all tenders',c:'#0ea5e9'},
          {l:'Active',v:withBonds.filter(t=>t.bidBond?.bbStatus==='Active').length,sub:'currently active',c:'#3b82f6'},
          {l:'Action Needed',v:actionPending.length,sub:'require attention',c:actionPending.length?'#ef4444':'#10b981'},
          {l:'Expiring ≤14d',v:expiringSoon.length,sub:'check expiry',c:expiringSoon.length?'#f97316':'#10b981'},
        ].map(k=>(
          <div key={k.l} className="card" style={{padding:'13px 16px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:k.c,borderRadius:'var(--r-xl) var(--r-xl) 0 0'}}/>
            <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.09em',marginBottom:5}}>{k.l}</div>
            <div style={{fontSize:24,fontWeight:850,color:'var(--text)',letterSpacing:'-.04em'}}>{k.v}</div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Action alerts */}
      {actionPending.length > 0 && (
        <div style={{padding:'14px 18px',marginBottom:16,background:'#fff5f5',border:'1px solid var(--danger-b)',borderRadius:12}}>
          <div style={{fontSize:13,fontWeight:800,color:'var(--danger)',marginBottom:8}}>⚠️ {actionPending.length} Bond{actionPending.length>1?'s':''} Require Action</div>
          {actionPending.slice(0,3).map(t=>{
            const bbA=BB_ALERTS[t.status]
            return <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid var(--danger-b)'}}>
              <DTag dept={t.dept}/>
              <div style={{flex:1,fontSize:12,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
              <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:bbA.bg,color:bbA.color,border:`1px solid ${bbA.border}`,whiteSpace:'nowrap'}}>{bbA.msg.split('—')[0].trim()}</span>
            </div>
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="card" style={{padding:'10px 14px',marginBottom:14,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <div className="search-wrap" style={{flex:'1 1 200px',minWidth:0}}>
          <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
          <input placeholder="Search tenders, banks…" value={q} onChange={e=>setQ(e.target.value)}/>
          {q&&<button className="search-clear" onClick={()=>setQ('')}>×</button>}
        </div>
        <select className={`filter-select${fStatus!=='All'?' has-value':''}`} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {BB_STATUS.filter(s=>s!=='N/A').map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{fontSize:12,color:'var(--text-3)'}}>{filtered.length} bonds</span>
      </div>

      {/* Bond list */}
      {filtered.length === 0 ? (
        <EmptyState icon="🏦" title={withBonds.length?'No bonds match':'No bid bonds recorded'} message={withBonds.length?'Try clearing filters':'Bid bond details are added per tender in the tender form'} />
      ) : (
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 100px 100px 110px 100px',gap:0,background:'var(--surface-2)',borderBottom:'2px solid var(--border)'}}>
            {['Tender','Dept','Bond Status','Amount','Bank','Expiry','Tender Status'].map((h,i)=>(
              <div key={h} style={{fontSize:9.5,fontWeight:750,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.08em',padding:'9px 12px',borderRight:i<6?'1px solid var(--border-l)':'none'}}>{h}</div>
            ))}
          </div>
          {filtered.map((t,idx)=>{
            const bb=t.bidBond||{}
            const bbA=BB_ALERTS[t.status]
            const bbsc=BB_STATUS_COLORS[bb.bbStatus]||{}
            const expDays=bb.expiryDate?dLeft(bb.expiryDate):null
            const isExpSoon=expDays!==null&&expDays>=0&&expDays<=14
            const isExpired=expDays!==null&&expDays<0
            const action=bbA&&bb.amount&&bb.bbStatus!=='N/A'&&bb.bbStatus!=='Released'
            return (
              <div key={t.id} style={{display:'grid',gridTemplateColumns:'1fr 100px 110px 100px 100px 110px 100px',gap:0,background:action?'rgba(239,68,68,.04)':'var(--surface)',borderBottom:idx<filtered.length-1?'1px solid var(--border-l)':'none',transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--blue-l)'} onMouseLeave={e=>e.currentTarget.style.background=action?'rgba(239,68,68,.04)':'var(--surface)'}>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)'}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
                  {action&&<div style={{fontSize:10.5,fontWeight:700,color:'var(--danger)',marginTop:2}}>⚠️ {bbA.msg.split('—')[0].trim()}</div>}
                </div>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)',display:'flex',alignItems:'center'}}><DTag dept={t.dept}/></div>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)',display:'flex',alignItems:'center'}}>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:20,background:bbsc.bg||'var(--surface-2)',color:bbsc.color||'var(--text-3)',border:`1px solid ${bbsc.border||'var(--border)'}`}}>{bb.bbStatus||'—'}</span>
                </div>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)',fontSize:12,fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{bb.amount?fmtCurrency(bb.amount,bb.currency||'KWD'):'—'}</div>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)',fontSize:12,color:'var(--text-2)'}}>{bb.bank||'—'}</div>
                <div style={{padding:'11px 12px',borderRight:'1px solid var(--border-l)',fontSize:12,fontWeight:isExpSoon||isExpired?700:400,color:isExpired?'var(--danger)':isExpSoon?'var(--warning)':'var(--text-2)'}}>
                  {bb.expiryDate?(isExpired?`⚠ ${Math.abs(expDays)}d expired`:isExpSoon?`⏰ ${expDays}d left`:bb.expiryDate):'—'}
                </div>
                <div style={{padding:'11px 12px',display:'flex',alignItems:'center'}}><Badge status={t.status}/></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
