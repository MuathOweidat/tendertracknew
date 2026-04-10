import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { DTag, EmptyState } from '../components/ui'
import { fmtShort } from '../lib/utils'

export default function IntelPage() {
  const { tenders } = useAppStore()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  const competitors = useMemo(() => {
    const map = {}
    tenders.forEach(t => {
      (t.competitorBids||[]).forEach(cb => {
        const name = (cb.name||cb.company||'').trim()
        if (!name) return
        if (!map[name]) map[name] = { name, appearances:0, totalBid:0, wonAgainst:0, lostTo:0, tenders:[] }
        map[name].appearances++
        if (cb.amount) map[name].totalBid += Number(cb.amount)||0
        if (t.status==='Won') map[name].wonAgainst++
        if (t.status==='Lost') map[name].lostTo++
        map[name].tenders.push(t)
      })
      if (t.competitorName) {
        const name = t.competitorName.trim()
        if (!map[name]) map[name] = { name, appearances:0, totalBid:0, wonAgainst:0, lostTo:0, tenders:[] }
        if (!map[name].tenders.find(x=>x.id===t.id)) { map[name].appearances++; map[name].tenders.push(t) }
      }
    })
    return Object.values(map).map(c=>({...c, winRateAgainst: (c.wonAgainst+c.lostTo)?Math.round((c.wonAgainst/(c.wonAgainst+c.lostTo))*100):null})).sort((a,b)=>b.appearances-a.appearances)
  }, [tenders])

  const filtered = useMemo(()=>q?competitors.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())):competitors,[competitors,q])
  const sel = selected?competitors.find(c=>c.name===selected):null

  if (tenders.every(t=>!(t.competitorBids||[]).length&&!t.competitorName)) {
    return <EmptyState icon="🔍" title="No competitor data yet" message="Add competitor bids in the tender form to track intelligence here" />
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:sel?'360px 1fr':'1fr',gap:20}}>
      <div>
        <div className="card" style={{padding:'10px 14px',marginBottom:14,display:'flex',gap:8,alignItems:'center'}}>
          <div className="search-wrap" style={{flex:1}}>
            <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
            <input placeholder="Search competitors…" value={q} onChange={e=>setQ(e.target.value)}/>
            {q&&<button className="search-clear" onClick={()=>setQ('')}>×</button>}
          </div>
          <span style={{fontSize:12,color:'var(--text-3)'}}>{filtered.length} competitors</span>
        </div>
        <div className="card" style={{overflow:'hidden'}}>
          {filtered.map((c,i)=>(
            <div key={c.name} onClick={()=>setSelected(selected===c.name?null:c.name)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border-l)':'none',cursor:'pointer',background:selected===c.name?'var(--blue-l)':'var(--surface)',transition:'background .1s'}} onMouseEnter={e=>{if(selected!==c.name)e.currentTarget.style.background='var(--surface-2)'}} onMouseLeave={e=>{e.currentTarget.style.background=selected===c.name?'var(--blue-l)':'var(--surface)'}}>
              <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',flexShrink:0}}>{c.name[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:1}}>{c.appearances} appearance{c.appearances!==1?'s':''} · Won against: {c.wonAgainst} · Lost to: {c.lostTo}</div>
              </div>
              {c.winRateAgainst!==null&&<div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:14,fontWeight:800,color:c.winRateAgainst>=60?'var(--success)':c.winRateAgainst>=40?'var(--warning)':'var(--danger)'}}>{c.winRateAgainst}%</div><div style={{fontSize:10,color:'var(--text-3)'}}>our win rate</div></div>}
            </div>
          ))}
        </div>
      </div>

      {sel&&(
        <div className="card" style={{padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:18}}>
            <div><div style={{fontSize:19,fontWeight:800,color:'var(--text)',letterSpacing:'-.03em'}}>{sel.name}</div><div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>Competitor analysis</div></div>
            <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:20}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {[{l:'Appearances',v:sel.appearances},{l:'Won Against',v:sel.wonAgainst,c:'var(--success)'},{l:'Lost To',v:sel.lostTo,c:'var(--danger)'},{l:'Our Win Rate',v:sel.winRateAgainst!==null?sel.winRateAgainst+'%':'N/A',c:sel.winRateAgainst>=60?'var(--success)':sel.winRateAgainst>=40?'var(--warning)':'var(--danger)'}].map(k=>(
              <div key={k.l} style={{background:'var(--surface-2)',borderRadius:10,padding:'12px',border:'1px solid var(--border-l)',textAlign:'center'}}>
                <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:850,color:k.c||'var(--text)',letterSpacing:'-.04em'}}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Appeared in these tenders</div>
          {sel.tenders.slice(0,10).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--border-l)'}}>
              <DTag dept={t.dept}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
                <div style={{fontSize:11,color:'var(--text-3)'}}>{t.closingDate||'No date'}</div>
              </div>
              <span style={{fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:20,background:t.status==='Won'?'var(--success-l)':t.status==='Lost'?'var(--danger-l)':'var(--surface-2)',color:t.status==='Won'?'var(--success)':t.status==='Lost'?'var(--danger)':'var(--text-3)'}}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
