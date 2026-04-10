import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, EmptyState } from '../components/ui'
import { CLOSED_S } from '../lib/constants'
import { fmtShort } from '../lib/utils'

export default function ClientsPage() {
  const { tenders } = useAppStore()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  const clients = useMemo(() => {
    const map = {}
    tenders.forEach(t => {
      if (!t.client) return
      if (!map[t.client]) map[t.client] = { name:t.client, tenders:[], won:0, active:0, total:0, value:0 }
      map[t.client].tenders.push(t)
      map[t.client].total++
      if (t.status==='Won') { map[t.client].won++; map[t.client].value+=Number(t.ourBid)||0 }
      if (!CLOSED_S.includes(t.status)) map[t.client].active++
    })
    return Object.values(map).sort((a,b)=>b.total-a.total)
  }, [tenders])

  const filtered = useMemo(() => {
    if (!q) return clients
    const lq = q.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(lq))
  }, [clients, q])

  const selectedClient = selected ? clients.find(c=>c.name===selected) : null

  return (
    <div style={{display:'grid',gridTemplateColumns:selected?'380px 1fr':'1fr',gap:20}}>
      <div>
        <div className="card" style={{padding:'10px 14px',marginBottom:14,display:'flex',gap:8,alignItems:'center'}}>
          <div className="search-wrap" style={{flex:1}}>
            <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
            <input placeholder="Search clients…" value={q} onChange={e=>setQ(e.target.value)}/>
            {q&&<button className="search-clear" onClick={()=>setQ('')}>×</button>}
          </div>
          <span style={{fontSize:12,color:'var(--text-3)',flexShrink:0}}>{filtered.length} clients</span>
        </div>

        {filtered.length === 0 ? <EmptyState icon="🏢" title="No clients" message="Clients appear here once you add tenders with client names" /> : (
          <div className="card" style={{overflow:'hidden'}}>
            {filtered.map((c,i)=>(
              <div key={c.name} onClick={()=>setSelected(selected===c.name?null:c.name)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border-l)':'none',cursor:'pointer',background:selected===c.name?'var(--blue-l)':'var(--surface)',transition:'background .1s'}} onMouseEnter={e=>{if(selected!==c.name)e.currentTarget.style.background='var(--surface-2)'}} onMouseLeave={e=>{e.currentTarget.style.background=selected===c.name?'var(--blue-l)':'var(--surface)'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--blue),var(--blue-d))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#fff',flexShrink:0}}>{c.name[0]?.toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13.5,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                  <div style={{fontSize:11.5,color:'var(--text-3)',marginTop:1}}>{c.total} tender{c.total!==1?'s':''} · {c.won} won · {c.active} active</div>
                </div>
                {c.value>0&&<div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:13,fontWeight:800,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{fmtShort(c.value)}</div><div style={{fontSize:10,color:'var(--text-3)'}}>won value</div></div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedClient && (
        <div>
          <div className="card" style={{padding:'18px 20px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,var(--blue),var(--blue-d))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff'}}>{selectedClient.name[0]?.toUpperCase()}</div>
              <div><div style={{fontSize:20,fontWeight:800,color:'var(--text)',letterSpacing:'-.03em'}}>{selectedClient.name}</div><div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{selectedClient.total} tenders total</div></div>
              <button onClick={()=>setSelected(null)} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:18}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {[{l:'Total',v:selectedClient.total},{l:'Won',v:selectedClient.won,c:'var(--success)'},{l:'Active',v:selectedClient.active,c:'var(--blue)'},{l:'Won Value',v:fmtShort(selectedClient.value),c:'var(--success)'}].map(k=>(
                <div key={k.l} style={{background:'var(--surface-2)',borderRadius:10,padding:'10px 12px',border:'1px solid var(--border-l)',textAlign:'center'}}>
                  <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{k.l}</div>
                  <div style={{fontSize:18,fontWeight:850,color:k.c||'var(--text)',letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums'}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em'}}>Tenders</div>
            {selectedClient.tenders.map((t,i)=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',borderBottom:i<selectedClient.tenders.length-1?'1px solid var(--border-l)':'none'}}>
                <Badge status={t.status}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{t.dept} · {t.closingDate||'No date'}</div>
                </div>
                {t.ourBid&&<span style={{fontSize:12,fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{fmtShort(t.ourBid)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
