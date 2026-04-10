import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag } from '../components/ui'
import { CLOSED_S } from '../lib/constants'
import { dLeft } from '../lib/utils'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const { tenders } = useAppStore()
  const [current, setCurrent] = useState(() => { const d=new Date(); return {year:d.getFullYear(),month:d.getMonth()} })
  const [selected, setSelected] = useState(null)

  const { year, month } = current
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  // Events per day
  const eventsByDay = useMemo(() => {
    const map = {}
    tenders.forEach(t => {
      ['closingDate','followUpDate','issueDate'].forEach(field => {
        const d = t[field]
        if (!d) return
        const dt = new Date(d)
        if (dt.getFullYear()===year && dt.getMonth()===month) {
          const key = dt.getDate()
          if (!map[key]) map[key] = []
          map[key].push({ tender:t, type:field })
        }
      })
    })
    return map
  }, [tenders, year, month])

  const cells = []
  for (let i=0;i<firstDay;i++) cells.push(null)
  for (let d=1;d<=daysInMonth;d++) cells.push(d)

  const dayStr = d => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const upcoming = tenders.filter(t => {
    const d = dLeft(t.closingDate)
    return d!==null&&d>=0&&d<=30&&!CLOSED_S.includes(t.status)
  }).sort((a,b)=>a.closingDate>b.closingDate?1:-1)

  const fieldColor = { closingDate:'var(--danger)', followUpDate:'var(--cyan)', issueDate:'var(--blue)' }
  const fieldLabel = { closingDate:'Closing', followUpDate:'Follow-up', issueDate:'Issue' }

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20}}>
      <div>
        {/* Month nav */}
        <div className="card" style={{padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button onClick={()=>setCurrent(c=>c.month===0?{year:c.year-1,month:11}:{...c,month:c.month-1})} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--text-3)',padding:'2px 8px',borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>‹</button>
          <div style={{fontSize:18,fontWeight:800,color:'var(--text)',letterSpacing:'-.03em'}}>{MONTHS[month]} {year}</div>
          <button onClick={()=>setCurrent(c=>c.month===11?{year:c.year+1,month:0}:{...c,month:c.month+1})} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--text-3)',padding:'2px 8px',borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>›</button>
        </div>

        {/* Calendar grid */}
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--surface-2)',borderBottom:'1px solid var(--border)'}}>
            {DAYS.map(d=><div key={d} style={{padding:'8px 4px',textAlign:'center',fontSize:10.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.06em'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {cells.map((day,i) => {
              if (!day) return <div key={`e${i}`} style={{minHeight:80,borderBottom:'1px solid var(--border-l)',borderRight:'1px solid var(--border-l)'}}/>
              const ds = dayStr(day)
              const events = eventsByDay[day] || []
              const isToday = ds === today
              const isSel   = selected === day
              return (
                <div key={day} onClick={()=>setSelected(isSel?null:day)} style={{minHeight:80,padding:'6px 6px',borderBottom:'1px solid var(--border-l)',borderRight:'1px solid var(--border-l)',background:isSel?'var(--blue-l)':isToday?'var(--info-l)':'var(--surface)',cursor:'pointer',transition:'background .1s'}} onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='var(--surface-2)'}} onMouseLeave={e=>{e.currentTarget.style.background=isSel?'var(--blue-l)':isToday?'var(--info-l)':'var(--surface)'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:isToday?'var(--blue)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12.5,fontWeight:isToday?800:500,color:isToday?'#fff':isSel?'var(--blue)':'var(--text)',marginBottom:4}}>{day}</div>
                  {events.slice(0,3).map((ev,j)=>(
                    <div key={j} style={{fontSize:9.5,padding:'1px 4px',borderRadius:4,marginBottom:2,background:fieldColor[ev.type]||'var(--blue)',color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600}} title={ev.tender.tenderName}>
                      {fieldLabel[ev.type]}: {ev.tender.tenderName.slice(0,20)}
                    </div>
                  ))}
                  {events.length>3&&<div style={{fontSize:9,color:'var(--text-3)'}}>+{events.length-3} more</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selected && eventsByDay[selected] && (
          <div className="card" style={{padding:'14px 16px',marginTop:16}}>
            <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:12}}>{MONTHS[month]} {selected}, {year}</div>
            {eventsByDay[selected].map((ev,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--border-l)'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:fieldColor[ev.type],flexShrink:0}}/>
                <DTag dept={ev.tender.dept}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.tender.tenderName}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{fieldLabel[ev.type]} date · {ev.tender.client}</div>
                </div>
                <Badge status={ev.tender.status}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar: upcoming */}
      <div>
        <div className="card" style={{padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:12}}>⏰ Upcoming Deadlines</div>
          {upcoming.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px 0',color:'var(--text-3)',fontSize:13}}>No upcoming deadlines in 30 days</div>
          ) : upcoming.map(t=>{
            const d=dLeft(t.closingDate)
            const uc=d<=3?'var(--danger)':d<=7?'var(--warning)':'var(--text-2)'
            return (
              <div key={t.id} style={{padding:'9px 0',borderBottom:'1px solid var(--border-l)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.tenderName}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{t.client||t.dept}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:uc}}>{d===0?'Today':`${d}d`}</div>
                    <div style={{fontSize:10,color:'var(--text-3)'}}>{t.closingDate}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="card" style={{padding:'14px 16px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--text)',marginBottom:10}}>Legend</div>
          {Object.entries(fieldColor).map(([k,c])=>(
            <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{width:12,height:12,borderRadius:3,background:c,flexShrink:0}}/>
              <span style={{fontSize:12,color:'var(--text-2)'}}>{fieldLabel[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
