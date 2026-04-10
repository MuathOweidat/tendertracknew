import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { Badge, DTag, KpiCard } from '../components/ui'
import { dLeft, isNewRecord, fmtShort, fmtCurrency, today } from '../lib/utils'
import { CLOSED_S, ACTIVE_S } from '../lib/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
  const { tenders, deals, kpiTargets, setShowNew } = useAppStore()
  const navigate = useNavigate()

  const allInvs = (deals||[]).flatMap(d => d.invoices||[])

  const stats = useMemo(() => {
    const active   = tenders.filter(t => ACTIVE_S.includes(t.status))
    const won      = tenders.filter(t => t.status==='Won')
    const lost     = tenders.filter(t => t.status==='Lost')
    const overdue  = tenders.filter(t => { const d=dLeft(t.closingDate); return d!==null&&d<0&&!CLOSED_S.includes(t.status) })
    const dueSoon  = tenders.filter(t => { const d=dLeft(t.closingDate); return d!==null&&d>=0&&d<=7&&!CLOSED_S.includes(t.status) })
    const followUp = tenders.filter(t => t.followUpDate&&t.followUpDate<=today()&&!CLOSED_S.includes(t.status))
    const newOnes  = tenders.filter(t => isNewRecord(t.createdAt))
    const pipelineV= active.reduce((s,t)=>s+(Number(t.ourBid)||0),0)
    const wonV     = won.reduce((s,t)=>s+(Number(t.ourBid)||0),0)
    const closedCount = tenders.filter(t=>CLOSED_S.includes(t.status)).length
    const winRate  = closedCount ? Math.round(won.length/closedCount*100) : 0
    const invTotal = allInvs.reduce((s,i)=>s+(Number(i.amount)||0),0)
    const invPaid  = allInvs.reduce((s,i)=>s+(i.status==='Paid'?Number(i.amount)||0:0),0)
    return { active, won, lost, overdue, dueSoon, followUp, newOnes, pipelineV, wonV, winRate, invTotal, invPaid, closedCount }
  }, [tenders, allInvs])

  // Mini pipeline chart (last 8 weeks activity)
  const weeks = Array.from({length:8},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-49+i*7)
    return { label:`W${i+1}`, added:0, closed:0 }
  })
  tenders.forEach(t => {
    if (!t.createdAt) return
    const daysAgo = Math.floor((Date.now()-new Date(t.createdAt).getTime())/864e5)
    const wi = Math.floor((49-daysAgo)/7)
    if (wi>=0&&wi<8) weeks[wi].added++
    if (t.closingDate) {
      const cdAgo = Math.floor((Date.now()-new Date(t.closingDate+'T00:00:00').getTime())/864e5)
      const cwi   = Math.floor((49-cdAgo)/7)
      if (cwi>=0&&cwi<8&&CLOSED_S.includes(t.status)) weeks[cwi].closed++
    }
  })

  const upcoming = tenders
    .filter(t => { const d=dLeft(t.closingDate); return d!==null&&d>=0&&d<=30&&!CLOSED_S.includes(t.status) })
    .sort((a,b) => (a.closingDate||'9')>(b.closingDate||'9')?1:-1)
    .slice(0,6)

  const recentWon = [...tenders].filter(t=>t.status==='Won').sort((a,b)=>(b.updatedAt||'')>(a.updatedAt||'')?1:-1).slice(0,4)
  const followUps  = stats.followUp.slice(0,5)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 11px', boxShadow:'var(--sh-md)', fontSize:12 }}>
        <div style={{ fontWeight:700, color:'var(--text)', marginBottom:3 }}>{label}</div>
        {payload.map(p=><div key={p.name} style={{ color:p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
      </div>
    )
  }

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="Total Tenders"  value={tenders.length}       sub={`${stats.active.length} active`}      accent="#0ea5e9" onClick={()=>navigate('/tenders')} />
        <KpiCard label="Win Rate"       value={stats.winRate+'%'}    sub={`target ${kpiTargets.winRate}%`}      accent={stats.winRate>=kpiTargets.winRate?'#10b981':'#f59e0b'} onClick={()=>navigate('/analytics')} />
        <KpiCard label="Won Value"      value={fmtShort(stats.wonV)} sub={`${stats.won.length} tenders`}        accent="#10b981" onClick={()=>navigate('/analytics')} />
        <KpiCard label="Pipeline"       value={fmtShort(stats.pipelineV)} sub="active bids"                    accent="#3b82f6" />
        <KpiCard label="⚠ Overdue"     value={stats.overdue.length} sub="past closing"                         accent={stats.overdue.length?'#ef4444':'#10b981'} onClick={()=>navigate('/tenders')} />
        <KpiCard label="Due This Week"  value={stats.dueSoon.length} sub="needs attention"                      accent={stats.dueSoon.length?'#f97316':'#10b981'} />
        <KpiCard label="Follow-ups Due" value={stats.followUp.length} sub="action required"                    accent={stats.followUp.length?'#8b5cf6':'#10b981'} />
        <KpiCard label="Total Invoiced" value={fmtShort(stats.invTotal)} sub={`${Math.round(stats.invPaid/Math.max(stats.invTotal,1)*100)}% collected`} accent="#10b981" onClick={()=>navigate('/deals')} />
      </div>

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Upcoming deadlines */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>⏰ Upcoming Deadlines</div>
            <button onClick={()=>navigate('/calendar')} style={{ fontSize:11.5, color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Calendar →</button>
          </div>
          {upcoming.length===0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-3)', fontSize:13 }}>No upcoming deadlines in 30 days 🎉</div>
          ) : upcoming.map(t => {
            const d=dLeft(t.closingDate)
            const uc=d<=3?'var(--danger)':d<=7?'var(--warning)':'var(--text-2)'
            return (
              <div key={t.id} onClick={()=>navigate('/tenders')} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-l)', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.opacity='.75'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                <DTag dept={t.dept} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{t.client}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:uc }}>{d===0?'Today':`${d}d`}</div>
                  <div style={{ fontSize:10, color:'var(--text-3)' }}>{t.closingDate}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Activity chart */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>📈 8-Week Activity</div>
            <button onClick={()=>navigate('/analytics')} style={{ fontSize:11.5, color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Full report →</button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeks} barGap={2} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="added"  name="Added"  fill="#1e66d4" opacity={0.8} radius={[3,3,0,0]} />
              <Bar dataKey="closed" name="Closed" fill="#10b981"              radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Follow-ups due */}
        {followUps.length > 0 && (
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>📌 Follow-ups Due</div>
              <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'var(--purple-l)', color:'var(--purple)', border:'1px solid var(--purple-b)' }}>{stats.followUp.length}</span>
            </div>
            {followUps.map(t=>(
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-l)' }}>
                <DTag dept={t.dept}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
                  <div style={{ fontSize:11, color:'var(--purple)' }}>Follow-up: {t.followUpDate}</div>
                </div>
                <Badge status={t.status}/>
              </div>
            ))}
          </div>
        )}

        {/* Recent wins */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>🏆 Recent Wins</div>
            <button onClick={()=>navigate('/analytics')} style={{ fontSize:11.5, color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>Analytics →</button>
          </div>
          {recentWon.length===0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-3)', fontSize:13 }}>No wins yet — keep bidding! 💪</div>
          ) : recentWon.map(t=>(
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-l)' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🏆</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{t.client}</div>
              </div>
              {t.ourBid&&<span style={{ fontSize:12, fontWeight:800, color:'var(--success)', flexShrink:0, fontVariantNumeric:'tabular-nums' }}>{fmtShort(t.ourBid)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Overdue banner */}
      {stats.overdue.length > 0 && (
        <div style={{ padding:'16px 20px', background:'var(--danger-l)', border:'1px solid var(--danger-b)', borderRadius:14, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:26 }}>🚨</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--danger)' }}>{stats.overdue.length} Overdue Tender{stats.overdue.length!==1?'s':''}</div>
            <div style={{ fontSize:12, color:'var(--danger)', opacity:.85, marginTop:2 }}>
              {stats.overdue.slice(0,3).map(t=>t.tenderName.slice(0,30)).join(' · ')}
              {stats.overdue.length>3?` +${stats.overdue.length-3} more`:''}
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={()=>navigate('/tenders')}>View All</button>
        </div>
      )}
    </div>
  )
}
