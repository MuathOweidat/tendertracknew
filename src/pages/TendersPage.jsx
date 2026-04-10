import React, { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag, PBadge, NewDot, EmptyState, ConfirmModal, Spin } from '../components/ui'
import { STATUSES, DEPTS, CLOSED_S, ACTIVE_S, BB_ALERTS } from '../lib/constants'
import { dLeft, isNewRecord, fmtCurrency, today } from '../lib/utils'
import { usePermissions } from '../hooks/usePermissions'
import NewTenderModal   from '../components/tenders/NewTenderModal'
import ImportModal      from '../components/tenders/ImportModal'
import PrintModal       from '../components/tenders/PrintModal'
import BulkStatusModal  from '../components/tenders/BulkStatusModal'
import DetailPanel      from '../components/tenders/DetailPanel'

const PAGE_SIZE = 50

const SORT_OPTIONS = [
  { value:'createdAt',  label:'Date Added'   },
  { value:'closingDate',label:'Closing Date' },
  { value:'tenderName', label:'Name A→Z'    },
  { value:'ourBid',     label:'Value ↓'     },
  { value:'updatedAt',  label:'Last Updated' },
]

export default function TendersPage() {
  const { tenders, tendersLoading, deleteTender, updateTender, bulkUpdateTenders, deleteManyTenders } = useAppStore()
  const perms = usePermissions()

  const [q,           setQ]          = useState('')
  const [fDept,       setFDept]      = useState('All')
  const [fStatus,     setFStatus]    = useState('All')
  const [sortBy,      setSortBy]     = useState('createdAt')
  const [selected,    setSelected]   = useState(null)
  const [checked,     setChecked]    = useState(new Set())
  const [editing,     setEditing]    = useState(null)
  const [showNew,     setShowNew]    = useState(false)
  const [showImport,  setShowImport] = useState(false)
  const [printing,    setPrinting]   = useState(null)
  const [bulkStatus,  setBulkStatus] = useState(false)
  const [confirm,     setConfirm]    = useState(null)
  const [viewMode,    setViewMode]   = useState('list')
  const [quickChip,   setQuickChip]  = useState(null)
  const [page,        setPage]       = useState(1)

  const QUICK_CHIPS = [
    { id:'overdue',  label:'Overdue',       fn: t => { const d=dLeft(t.closingDate); return d!==null&&d<0&&!CLOSED_S.includes(t.status) } },
    { id:'week',     label:'Due this week', fn: t => { const d=dLeft(t.closingDate); return d!==null&&d>=0&&d<=7&&!CLOSED_S.includes(t.status) } },
    { id:'high',     label:'High Priority', fn: t => t.priority==='High'&&!CLOSED_S.includes(t.status) },
    { id:'new',      label:'New (7d)',       fn: t => isNewRecord(t.createdAt) },
    { id:'noowner',  label:'No Owner',      fn: t => !t.oppOwner&&!t.accountManager&&!CLOSED_S.includes(t.status) },
    { id:'followup', label:'Follow-up due', fn: t => t.followUpDate&&t.followUpDate<=today()&&!CLOSED_S.includes(t.status) },
  ]

  const filtered = useMemo(() => {
    let l = [...tenders]
    if (q) { const lq=q.toLowerCase(); l=l.filter(t=>[t.tenderName,t.client,t.tenderNumber,t.dept,t.vendor].some(f=>f?.toLowerCase().includes(lq))) }
    if (fDept   !== 'All') l = l.filter(t => t.dept   === fDept)
    if (fStatus !== 'All') l = l.filter(t => t.status === fStatus)
    if (quickChip) { const chip=QUICK_CHIPS.find(c=>c.id===quickChip); if (chip) l=l.filter(chip.fn) }
    l.sort((a,b) => {
      if (sortBy==='closingDate') return (a.closingDate||'9')>(b.closingDate||'9')?1:-1
      if (sortBy==='tenderName')  return (a.tenderName||'').localeCompare(b.tenderName||'')
      if (sortBy==='ourBid')      return (Number(b.ourBid)||0)-(Number(a.ourBid)||0)
      return (b[sortBy]||'')>(a[sortBy]||'')?1:-1
    })
    return l
  }, [tenders, q, fDept, fStatus, sortBy, quickChip])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  // Reset page on filter change
  const setFilter = (fn) => { fn(); setPage(1) }

  const selectedTender = tenders.find(t => t.id === selected)

  const handleCheck = useCallback(id => {
    setChecked(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }, [])
  const handleCheckAll = () => {
    if (checked.size === paginated.length) setChecked(new Set())
    else setChecked(new Set(paginated.map(t=>t.id)))
  }

  const handleDelete = id => {
    if (!perms.canDeleteTender(tenders.find(t=>t.id===id))) return
    setConfirm({ title:'Delete Tender', message:'This action cannot be undone.', danger:true,
      onConfirm:() => { deleteTender(id); if(selected===id) setSelected(null) } })
  }
  const handleBulkDelete = () => {
    setConfirm({ title:`Delete ${checked.size} Tenders`, message:`Permanently delete ${checked.size} tenders?`, danger:true,
      onConfirm:() => { deleteManyTenders([...checked]); setChecked(new Set()) } })
  }

  // Inline quick-status change
  const handleQuickStatus = async (t, newStatus) => {
    await updateTender({ ...t, status: newStatus,
      statusHistory: [...(t.statusHistory||[]), { status: newStatus, date: today() }] })
  }

  const newCount     = tenders.filter(t=>isNewRecord(t.createdAt)).length
  const overdueCount = tenders.filter(t=>{const d=dLeft(t.closingDate);return d!==null&&d<0&&!CLOSED_S.includes(t.status)}).length
  const activeCount  = tenders.filter(t=>ACTIVE_S.includes(t.status)).length
  const wonCount     = tenders.filter(t=>t.status==='Won').length

  return (
    <div style={{ display:'flex', gap:0, position:'relative' }}>
      <div style={{ flex:1, minWidth:0 }}>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Total',      value:tenders.length, sub:'all tenders',       color:'#0ea5e9' },
            { label:'Active',     value:activeCount,     sub:'in progress',       color:'#3b82f6' },
            { label:'Won',        value:wonCount,        sub:'this year',         color:'#10b981' },
            { label:'⚠ Overdue', value:overdueCount,    sub:'past closing date', color:overdueCount?'#ef4444':'#10b981' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding:'13px 16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.color, borderRadius:'var(--r-xl) var(--r-xl) 0 0' }} />
              <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.09em', marginBottom:5 }}>{k.label}</div>
              <div style={{ fontSize:26, fontWeight:850, color:'var(--text)', letterSpacing:'-.04em', lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="card" style={{ padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div className="search-wrap" style={{ flex:'1 1 200px', minWidth:0 }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>
            </span>
            <input placeholder="Search tenders, clients, numbers…" value={q} onChange={e=>setFilter(()=>setQ(e.target.value))} />
            {q && <button className="search-clear" onClick={()=>setFilter(()=>setQ(''))}>×</button>}
          </div>
          <select className={`filter-select${fDept!=='All'?' has-value':''}`} value={fDept} onChange={e=>setFilter(()=>setFDept(e.target.value))}>
            <option value="All">All Depts</option>
            {DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
          <select className={`filter-select${fStatus!=='All'?' has-value':''}`} value={fStatus} onChange={e=>setFilter(()=>setFStatus(e.target.value))}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display:'flex', gap:2, background:'var(--surface-2)', borderRadius:8, padding:2, border:'1px solid var(--border)' }}>
            {['list','cards'].map(m => (
              <button key={m} onClick={()=>setViewMode(m)} style={{ padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', fontSize:11, fontWeight:viewMode===m?700:500, background:viewMode===m?'var(--surface)':'transparent', color:viewMode===m?'var(--blue)':'var(--text-3)', transition:'all .15s' }}>
                {m==='list'?'≡ List':'⊞ Cards'}
              </button>
            ))}
          </div>
          {perms.canImport && (
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowImport(true)} title="Import from Excel/CSV">📥 Import</button>
          )}
          {perms.canCreateTender && (
            <button className="btn btn-primary btn-sm" onClick={()=>setShowNew(true)}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
              New
            </button>
          )}
        </div>

        {/* Quick chips */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14, alignItems:'center' }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>Filter:</span>
          {QUICK_CHIPS.map(chip => {
            const cnt = tenders.filter(chip.fn).length
            if (!cnt && chip.id !== quickChip) return null
            const active = quickChip === chip.id
            return (
              <button key={chip.id} onClick={()=>{ setQuickChip(active?null:chip.id); setPage(1) }} style={{ padding:'4px 12px', borderRadius:20, fontSize:11.5, fontWeight:active?700:500, cursor:'pointer', border:`1.5px solid ${active?'var(--blue)':'var(--border)'}`, background:active?'var(--blue-l)':'var(--surface)', color:active?'var(--blue)':'var(--slate)', transition:'all .15s', fontFamily:'inherit' }}>
                {chip.label} ({cnt})
              </button>
            )
          })}
          {newCount > 0 && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#10b981', fontWeight:600, marginLeft:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'newDotBlink 1.4s ease-in-out infinite', display:'inline-block' }} />
              {newCount} new this week
            </span>
          )}
        </div>

        {/* Bulk action bar */}
        {checked.size > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', marginBottom:12, background:'var(--blue-l)', borderRadius:10, border:'1px solid var(--blue-ll)', flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--blue)' }}>{checked.size} selected</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>setChecked(new Set())}>Clear</button>
            {perms.canBulkEdit && (
              <button className="btn btn-outline btn-sm" onClick={()=>setBulkStatus(true)}>
                🔄 Change Status
              </button>
            )}
            {perms.canBulkEdit && (
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑 Delete Selected</button>
            )}
          </div>
        )}

        {/* Results count */}
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>Showing <strong style={{color:'var(--text)'}}>{paginated.length}</strong> of {filtered.length} tenders</span>
          {totalPages > 1 && (
            <span style={{ fontSize:12, color:'var(--text-3)' }}>Page {page} of {totalPages}</span>
          )}
        </div>

        {/* Main list */}
        {tendersLoading && tenders.length === 0 ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spin size={28} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title={tenders.length ? 'No tenders match' : 'No tenders yet'} message={tenders.length ? 'Try clearing filters' : 'Add your first tender to get started'} action={!tenders.length && perms.canCreateTender && <button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ New Tender</button>} />
        ) : viewMode === 'list' ? (
          <TenderTable tenders={paginated} selectedId={selected} checked={checked} onSel={setSelected} onCk={handleCheck} onCheckAll={handleCheckAll} onEdit={perms.canCreateTender?setEditing:null} onDelete={perms.canBulkEdit?handleDelete:null} onPrint={setPrinting} onQuickStatus={handleQuickStatus} perms={perms} />
        ) : (
          <TenderCards tenders={paginated} selectedId={selected} checked={checked} onSel={setSelected} onCk={handleCheck} onEdit={perms.canCreateTender?setEditing:null} onDelete={perms.canBulkEdit?handleDelete:null} onPrint={setPrinting} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:16 }}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
              let p; if(totalPages<=7) p=i+1; else if(page<=4) p=i+1; else if(page>=totalPages-3) p=totalPages-6+i; else p=page-3+i
              return <button key={p} onClick={()=>setPage(p)} style={{ minWidth:32, padding:'5px 8px', borderRadius:7, border:`1.5px solid ${page===p?'var(--blue)':'var(--border)'}`, background:page===p?'var(--blue)':'var(--surface)', color:page===p?'#fff':'var(--text-2)', cursor:'pointer', fontSize:12.5, fontWeight:page===p?700:400 }}>{p}</button>
            })}
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedTender && (
        <DetailPanel tender={selectedTender} onClose={()=>setSelected(null)} onEdit={()=>setEditing(selectedTender)} onDelete={()=>{ handleDelete(selectedTender.id); setSelected(null) }} onSave={updateTender} onPrint={()=>setPrinting(selectedTender)} onDuplicate={()=>{ setEditing({...selectedTender, id:undefined, tenderName:'Copy of '+selectedTender.tenderName, tenderNumber:'', createdAt:today()}); setSelected(null) }} perms={perms} />
      )}

      {/* Modals */}
      {(showNew || editing) && <NewTenderModal existing={editing} onClose={()=>{ setShowNew(false); setEditing(null) }} />}
      {showImport  && <ImportModal onClose={()=>setShowImport(false)} />}
      {printing    && <PrintModal tender={printing} onClose={()=>setPrinting(null)} />}
      {bulkStatus  && <BulkStatusModal tenderIds={[...checked]} onClose={()=>{ setBulkStatus(false); setChecked(new Set()) }} />}
      {confirm     && <ConfirmModal {...confirm} onClose={()=>setConfirm(null)} />}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
function TenderTable({ tenders, selectedId, checked, onSel, onCk, onCheckAll, onEdit, onDelete, onPrint, onQuickStatus, perms }) {
  const allChecked = checked.size > 0 && checked.size === tenders.length
  return (
    <div className="card" style={{ overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'32px 8px 76px 1fr 88px 88px 88px 110px', gap:8, padding:'9px 16px', background:'var(--surface-2)', borderBottom:'2px solid var(--border)', alignItems:'center' }}>
        <input type="checkbox" checked={allChecked} onChange={onCheckAll} style={{ cursor:'pointer' }} />
        <div />
        {['Dept','Tender','Number','Value','Closing','Status'].map(h => (
          <div key={h} style={{ fontSize:10, fontWeight:750, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
        ))}
      </div>
      {tenders.map(t => <TRow key={t.id} t={t} selected={selectedId===t.id} checked={checked.has(t.id)} onSel={onSel} onCk={onCk} onEdit={onEdit} onDelete={onDelete} onPrint={onPrint} onQuickStatus={onQuickStatus} perms={perms} />)}
    </div>
  )
}

function TRow({ t, selected, checked, onSel, onCk, onEdit, onDelete, onPrint, onQuickStatus, perms }) {
  const [showStatusPicker, setShowStatusPicker] = React.useState(false)
  const isNew  = isNewRecord(t.createdAt)
  const d      = dLeft(t.closingDate)
  const closed = CLOSED_S.includes(t.status)
  const urg    = !closed && d!=null && d<=3
  const warn   = !closed && d!=null && d>3 && d<=7
  const uc     = !closed&&d!=null ? d<=0?'var(--danger)':d<=7?'var(--danger)':d<=14?'var(--warning)':'var(--slate)' : 'var(--text-3)'
  const bb     = (t.bidBond&&typeof t.bidBond==='object')?t.bidBond:{}
  const bbA    = BB_ALERTS[t.status]
  const actionPending = bbA&&bb.amount&&bb.bbStatus!=='N/A'&&bb.bbStatus!=='Released'

  const cls = ['tt-row', selected&&'selected', urg&&!selected&&'urg-danger', warn&&!selected&&'urg-warning', isNew&&'tt-new'].filter(Boolean).join(' ')

  return (
    <div className={cls} onClick={()=>onSel(t.id)} style={{ gridTemplateColumns:'32px 8px 76px 1fr 88px 88px 88px 110px', background:selected?'var(--blue-l)':undefined, position:'relative' }}>
      <div onClick={e=>{e.stopPropagation();onCk(t.id)}} style={{ display:'flex', justifyContent:'center' }}>
        <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checked?'var(--blue)':'var(--border)'}`, background:checked?'var(--blue)':'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {checked && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      </div>
      <div style={{ width:3 }} />
      <div style={{ overflow:'hidden', minWidth:0 }}><DTag dept={t.dept} /></div>
      <div style={{ overflow:'hidden', minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:selected?600:500, color:selected?'var(--blue-d)':'var(--text)', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</div>
        <div style={{ display:'flex', gap:5, marginTop:2, alignItems:'center', flexWrap:'wrap' }}>
          {t.client && <span style={{ fontSize:11, color:'var(--slate)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.client}</span>}
          {t.oppOwner && <span style={{ fontSize:10, fontWeight:600, color:'var(--purple)', background:'var(--purple-l)', padding:'1px 5px', borderRadius:4 }}>{t.oppOwner}</span>}
          {(t.comments||[]).length>0 && <span style={{ fontSize:10, color:'var(--text-3)' }}>💬{t.comments.length}</span>}
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'var(--mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderNumber||'—'}</div>
      <div style={{ fontSize:12, fontWeight:600, color:t.ourBid?'var(--blue-d)':'var(--text-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.ourBid!=null?fmtCurrency(t.ourBid,t.currency):'—'}</div>
      <div>
        {t.closingDate ? (
          <>
            <div style={{ fontSize:12, fontWeight:600, color:uc, fontFamily:'var(--mono)' }}>{t.closingDate}</div>
            {!closed&&d!=null&&<div style={{ fontSize:10, color:uc, fontWeight:600 }}>{d<0?`${Math.abs(d)}d over`:d===0?'Today':`${d}d`}</div>}
          </>
        ) : <span style={{ color:'var(--border)' }}>—</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:3, flexWrap:'wrap', position:'relative' }}>
        {/* Double-click badge to quick-change status */}
        <div onDoubleClick={e=>{ e.stopPropagation(); if(perms?.canBulkEdit) setShowStatusPicker(v=>!v) }} title={perms?.canBulkEdit?"Double-click to change status":undefined}>
          <Badge status={t.status} />
        </div>
        {isNew && <NewDot />}
        {actionPending && <span title={bbA.msg} style={{ fontSize:9, fontWeight:700, padding:'2px 4px', borderRadius:3, background:bbA.bg, color:bbA.color, border:`1px solid ${bbA.border}` }}>🏦!</span>}
        {/* Quick action buttons */}
        <div style={{ marginLeft:'auto', display:'flex', gap:2 }} onClick={e=>e.stopPropagation()}>
          {onPrint && <button onClick={()=>onPrint(t)} style={{ background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:3, borderRadius:4, fontSize:11, transition:'color .1s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--text-2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-4)'} title="Print">🖨️</button>}
          {onEdit && <button onClick={()=>onEdit(t)} style={{ background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:3, borderRadius:4, fontSize:11, transition:'color .1s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--blue)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-4)'} title="Edit">✏️</button>}
        </div>
        {/* Inline status picker (double-click) */}
        {showStatusPicker && (
          <div style={{ position:'absolute', top:'100%', right:0, zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--sh-lg)', padding:8, minWidth:180 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, padding:'0 4px' }}>Quick Status</div>
            {STATUSES.map(s => (
              <button key={s} onClick={()=>{ onQuickStatus(t,s); setShowStatusPicker(false) }} style={{ display:'block', width:'100%', padding:'7px 10px', borderRadius:7, border:'none', background:t.status===s?'var(--blue-l)':'transparent', color:t.status===s?'var(--blue)':'var(--text-2)', cursor:'pointer', textAlign:'left', fontFamily:'inherit', fontSize:12.5, fontWeight:t.status===s?700:400 }}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Cards ─────────────────────────────────────────────────────────────────────
function TenderCards({ tenders, selectedId, checked, onSel, onCk, onEdit, onDelete, onPrint }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:12 }}>
      {tenders.map(t => <TCard key={t.id} t={t} selected={selectedId===t.id} checked={checked.has(t.id)} onSel={onSel} onCk={onCk} onEdit={onEdit} onDelete={onDelete} onPrint={onPrint} />)}
    </div>
  )
}

function TCard({ t, selected, checked, onSel, onCk, onEdit, onDelete, onPrint }) {
  const isNew  = isNewRecord(t.createdAt)
  const d      = dLeft(t.closingDate)
  const closed = CLOSED_S.includes(t.status)
  const urg    = !closed&&d!=null&&d<=3
  const warn   = !closed&&d!=null&&d>3&&d<=7
  const uc     = urg?'var(--danger)':warn?'var(--warning)':'var(--text-3)'
  return (
    <div className={`card card-hover${isNew?' tt-card-new':''}`} onClick={()=>onSel(t.id)} style={{ position:'relative', borderLeft:`4px solid ${selected?'var(--blue)':urg?'var(--danger)':warn?'var(--warning)':'var(--border)'}`, background:selected?'var(--blue-l)':'var(--surface)', overflow:'hidden' }}>
      <div style={{ padding:'13px 14px 10px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', lineHeight:1.35, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{t.tenderName}</div>
            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
              <DTag dept={t.dept} />
              {t.client && <span style={{ fontSize:11, color:'var(--slate)' }}>{t.client}</span>}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
            <Badge status={t.status} />
            {isNew && <NewDot />}
          </div>
        </div>
        {(t.tags||[]).length>0 && (
          <div style={{ display:'flex', gap:3, flexWrap:'wrap', marginBottom:6 }}>
            {(t.tags||[]).slice(0,4).map(tag=><span key={tag} style={{ fontSize:9, fontWeight:700, color:'var(--blue)', background:'var(--blue-l)', border:'1px solid var(--blue-ll)', borderRadius:8, padding:'0 4px' }}>{tag}</span>)}
          </div>
        )}
      </div>
      <div style={{ borderTop:'1px solid var(--border-l)', padding:'8px 14px', background:'var(--surface-2)', display:'flex', alignItems:'center', gap:8 }}>
        {t.ourBid!=null && <span style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{fmtCurrency(t.ourBid,t.currency)}</span>}
        {t.closingDate && <span style={{ fontSize:11, color:uc, fontWeight:600, marginLeft:'auto' }}>{closed?t.closingDate:d<0?`${Math.abs(d)}d over`:d===0?'Today':`${d}d`}</span>}
        <div style={{ display:'flex', gap:3 }} onClick={e=>e.stopPropagation()}>
          {onPrint && <button onClick={()=>onPrint(t)} style={{ background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:3, borderRadius:4, fontSize:12 }} title="Print">🖨️</button>}
          {onEdit  && <button onClick={()=>onEdit(t)}  style={{ background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:3, borderRadius:4, fontSize:12 }} onMouseEnter={e=>e.currentTarget.style.color='var(--blue)'}   onMouseLeave={e=>e.currentTarget.style.color='var(--text-4)'} title="Edit">✏️</button>}
          {onDelete && <button onClick={()=>onDelete(t.id)} style={{ background:'none', border:'none', color:'var(--text-4)', cursor:'pointer', padding:3, borderRadius:4, fontSize:12 }} onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-4)'} title="Delete">🗑️</button>}
        </div>
      </div>
    </div>
  )
}
