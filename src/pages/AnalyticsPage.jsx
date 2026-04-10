import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { DTag, KpiCard } from '../components/ui'
import { CLOSED_S, ACTIVE_S, DEPTS, STATUS_COLORS, DEPT_COLORS } from '../lib/constants'
import { fmtShort, fiscalYear, fmtCurrency } from '../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'

const COLORS = ['#1e66d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6']

export default function AnalyticsPage() {
  const { tenders, kpiTargets } = useAppStore()
  const [fyFilter,   setFyFilter]   = useState('All')
  const [deptFilter, setDeptFilter] = useState('All')

  const allFYs = useMemo(() => {
    const s = new Set(tenders.map(t => fiscalYear(t.closingDate)).filter(Boolean))
    return ['All', ...Array.from(s).sort().reverse()]
  }, [tenders])

  const filtered = useMemo(() => {
    let l = [...tenders]
    if (fyFilter   !== 'All') l = l.filter(t => fiscalYear(t.closingDate) === fyFilter)
    if (deptFilter !== 'All') l = l.filter(t => t.dept === deptFilter)
    return l
  }, [tenders, fyFilter, deptFilter])

  const closed  = filtered.filter(t => CLOSED_S.includes(t.status))
  const won     = filtered.filter(t => t.status === 'Won')
  const lost    = filtered.filter(t => t.status === 'Lost')
  const active  = filtered.filter(t => ACTIVE_S.includes(t.status))
  const winRate = closed.length ? Math.round(won.length / closed.length * 100) : 0
  const pipeV   = active.reduce((s,t) => s+(Number(t.ourBid)||0), 0)
  const wonV    = won.reduce((s,t) => s+(Number(t.ourBid)||0), 0)
  const lostV   = lost.reduce((s,t) => s+(Number(t.ourBid)||0), 0)
  const avgBid  = filtered.filter(t=>t.ourBid).length
    ? filtered.filter(t=>t.ourBid).reduce((s,t)=>s+(Number(t.ourBid)||0),0) / filtered.filter(t=>t.ourBid).length : 0

  // Status breakdown for pie chart
  const statusData = Object.entries(
    filtered.reduce((acc,t) => { acc[t.status]=(acc[t.status]||0)+1; return acc }, {})
  ).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value],i) => ({ name, value, fill: COLORS[i%COLORS.length] }))

  // Dept performance bar chart
  const deptData = DEPTS.map(dept => {
    const items   = filtered.filter(t => t.dept===dept)
    const dWon    = items.filter(t => t.status==='Won')
    const dClosed = items.filter(t => CLOSED_S.includes(t.status))
    return {
      dept: dept.replace('AIMS-',''),
      total:    items.length,
      won:      dWon.length,
      lost:     items.filter(t=>t.status==='Lost').length,
      active:   items.filter(t=>ACTIVE_S.includes(t.status)).length,
      winRate:  dClosed.length ? Math.round(dWon.length/dClosed.length*100) : 0,
      value:    dWon.reduce((s,t)=>s+(Number(t.ourBid)||0),0),
    }
  }).filter(d => d.total > 0)

  // Monthly closing trend (last 12 months)
  const months = Array.from({length:12}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-11+i)
    return { key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label:d.toLocaleString('en',{month:'short'}) }
  })
  const monthlyData = months.map(m => {
    const mT = tenders.filter(t => (t.closingDate||'').startsWith(m.key))
    return {
      month: m.label,
      total: mT.length,
      won:   mT.filter(t=>t.status==='Won').length,
      lost:  mT.filter(t=>t.status==='Lost').length,
    }
  })

  // Loss reasons
  const lossReasons = Object.entries(
    lost.reduce((acc,t) => { const k=t.lossReason||'Not specified'; acc[k]=(acc[k]||0)+1; return acc }, {})
  ).map(([reason,count],i) => ({ reason, count, fill: COLORS[i%COLORS.length] })).sort((a,b)=>b.count-a.count)

  // Owner scorecard
  const byOwner = Object.entries(
    filtered.filter(t=>t.oppOwner||t.accountManager).reduce((acc,t) => {
      const k=t.oppOwner||t.accountManager
      if (!acc[k]) acc[k]={total:0,won:0,wonVal:0,closed:0}
      acc[k].total++
      if (t.status==='Won') { acc[k].won++; acc[k].wonVal+=Number(t.ourBid)||0 }
      if (CLOSED_S.includes(t.status)) acc[k].closed++
      return acc
    }, {})
  ).map(([name,d]) => ({ name, ...d, winRate:d.closed?Math.round(d.won/d.closed*100):0 }))
    .sort((a,b)=>b.total-a.total)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', boxShadow:'var(--sh-md)', fontSize:12 }}>
        <div style={{ fontWeight:700, color:'var(--text)', marginBottom:4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color:p.color, display:'flex', gap:8, justifyContent:'space-between' }}>
            <span>{p.name}:</span><span style={{ fontWeight:700 }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  const Card = ({ title, sub, children, span }) => (
    <div className="card" style={{ padding:20, gridColumn:span?`span ${span}`:undefined }}>
      <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', letterSpacing:'-.02em', marginBottom:sub?2:14 }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:14 }}>{sub}</div>}
      {children}
    </div>
  )

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ padding:'10px 14px', marginBottom:20, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>Filter:</span>
        <select className="filter-select" value={fyFilter} onChange={e=>setFyFilter(e.target.value)}>
          {allFYs.map(fy=><option key={fy} value={fy}>{fy==='All'?'All FY':fy}</option>)}
        </select>
        <select className="filter-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
          <option value="All">All Depts</option>
          {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize:12, color:'var(--text-3)', marginLeft:'auto' }}>
          <strong style={{color:'var(--text)'}}>{filtered.length}</strong> of {tenders.length} tenders
        </span>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        <KpiCard label="Total"      value={filtered.length}   sub="in selection"          accent="#0ea5e9" />
        <KpiCard label="Win Rate"   value={winRate+'%'}       sub={`target ${kpiTargets.winRate}%`} accent={winRate>=kpiTargets.winRate?'#10b981':'#f59e0b'} />
        <KpiCard label="Won Value"  value={fmtShort(wonV)}    sub={`${won.length} tenders`}  accent="#10b981" />
        <KpiCard label="Pipeline"   value={fmtShort(pipeV)}   sub={`${active.length} active`} accent="#3b82f6" />
        <KpiCard label="Lost Value" value={fmtShort(lostV)}   sub={`${lost.length} tenders`} accent="#ef4444" />
        <KpiCard label="Avg Bid"    value={fmtShort(avgBid)}  sub="per tender"               accent="#8b5cf6" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Win rate radial */}
        <Card title="Win Rate vs Target" sub={`Target: ${kpiTargets.winRate}%`}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width={140} height={140}>
              <RadialBarChart cx={70} cy={70} innerRadius={40} outerRadius={65} data={[{ value:winRate, fill: winRate>=kpiTargets.winRate?'#10b981':'#f59e0b' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" maxValue={100} cornerRadius={6} />
                <text x={70} y={65} textAnchor="middle" fill={winRate>=kpiTargets.winRate?'#10b981':'#f59e0b'} fontSize={22} fontWeight={900}>{winRate}%</text>
                <text x={70} y={82} textAnchor="middle" fill="var(--text-3)" fontSize={10}>WIN RATE</text>
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {[
                {l:'Won',    v:won.length,     c:'var(--success)'},
                {l:'Lost',   v:lost.length,    c:'var(--danger)'},
                {l:'Active', v:active.length,  c:'var(--blue)'},
                {l:'Closed', v:closed.length,  c:'var(--text-3)'},
                {l:'Target', v:kpiTargets.winRate+'%', c:'var(--text-4)'},
              ].map(r=>(
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border-l)', fontSize:12 }}>
                  <span style={{ color:'var(--text-3)' }}>{r.l}</span>
                  <span style={{ fontWeight:700, color:r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Status pie */}
        <Card title="Status Breakdown">
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={statusData} cx={65} cy={65} innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                  {statusData.map((e,i)=><Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
              {statusData.slice(0,6).map((d,i)=>(
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:d.fill, flexShrink:0 }}/>
                  <span style={{ fontSize:11.5, color:'var(--text-2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize:11.5, fontWeight:700, color:'var(--text)', flexShrink:0 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly trend */}
      <div style={{ marginBottom:18 }}>
        <Card title="Monthly Trend — Last 12 Months" sub="By closing date">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-3)' }} />
              <Bar dataKey="total"  name="Total"  fill="#1e66d4" opacity={0.7} radius={[3,3,0,0]} />
              <Bar dataKey="won"    name="Won"    fill="#10b981"              radius={[3,3,0,0]} />
              <Bar dataKey="lost"   name="Lost"   fill="#ef4444" opacity={0.7} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
        {/* Dept performance */}
        <Card title="Performance by Department">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize:11, fill:'var(--text-2)' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total"  name="Total"  fill="#1e66d4" opacity={0.6} radius={[0,3,3,0]} />
              <Bar dataKey="won"    name="Won"    fill="#10b981"              radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Owner scorecard */}
        <Card title="Scorecard by Owner">
          {byOwner.length===0 ? (
            <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-3)', fontSize:13 }}>No owner data yet</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>{['Owner','Total','Won','Win%','Value'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'4px 7px 8px', fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'2px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {byOwner.slice(0,8).map(o=>(
                  <tr key={o.name} style={{ borderBottom:'1px solid var(--border-l)' }}>
                    <td style={{ padding:'7px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--blue-d))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{o.name[0]?.toUpperCase()}</div>
                        <span style={{ fontWeight:600, color:'var(--text)' }}>{o.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'7px', fontVariantNumeric:'tabular-nums', fontWeight:600 }}>{o.total}</td>
                    <td style={{ padding:'7px', color:'var(--success)', fontWeight:700 }}>{o.won}</td>
                    <td style={{ padding:'7px', fontWeight:800, color:o.winRate>=50?'var(--success)':o.winRate>=30?'var(--warning)':'var(--danger)' }}>{o.winRate}%</td>
                    <td style={{ padding:'7px', color:'var(--text-2)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(o.wonVal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Loss analysis */}
      {lost.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <Card title="Loss Reasons" sub={`${lost.length} lost tenders`}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={lossReasons} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:10, fill:'var(--text-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize:10, fill:'var(--text-2)' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0,3,3,0]}>
                  {lossReasons.map((e,i)=><Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Recent Losses">
            {lost.slice(0,6).map(t=>(
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border-l)' }}>
                <DTag dept={t.dept} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{t.lossReason||'—'} · {t.closingDate||''}</div>
                </div>
                {t.ourBid && <span style={{ fontSize:12, color:'var(--text-3)', flexShrink:0, fontVariantNumeric:'tabular-nums' }}>{fmtShort(t.ourBid)}</span>}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
