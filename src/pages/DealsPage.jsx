import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { DealBadge, InvBadge, EmptyState, ConfirmModal, Spin, Lbl, Inp, Sel } from '../components/ui'
import { DEAL_STATUSES, DEAL_STATUS_COLORS, DEAL_TYPES, DEAL_PIPELINE, DEAL_CLOSED, INV_STATUSES, CURRENCIES, DEPTS } from '../lib/constants'
import { fmtShort, fmtCurrency, dLeft, today, genDealId, genInvId, isNewRecord } from '../lib/utils'

const ACCT_MANAGERS = ['','Tarek','Sona','Sakher','Aws','Mahmoud']
const OPP_OWNERS    = ['','Shady','Aaseim','Tamer','Nadeem','Rawan','Muath','Sonill']

export default function DealsPage() {
  const { deals, dealsLoading, addDeal, updateDeal, deleteDeal, addInvoice, updateInvoice, deleteInvoice, markInvoicePaid, toast } = useAppStore()
  const [mainTab,   setMainTab]   = useState('deals')
  const [selected,  setSelected]  = useState(null)  // deal detail slide-over
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingDeal,  setEditingDeal]  = useState(null)
  const [showInvForm,  setShowInvForm]  = useState(false)
  const [invFormData,  setInvFormData]  = useState(null)
  const [confirm,   setConfirm]   = useState(null)

  // Deals filters
  const [dQ,       setDQ]       = useState('')
  const [dStatus,  setDStatus]  = useState('All')
  const [dType,    setDType]    = useState('All')
  const [dSort,    setDSort]    = useState('updatedAt')
  const [viewMode, setViewMode] = useState('cards')

  // Payments filters
  const [pQ,      setPQ]      = useState('')
  const [pStatus, setPStatus] = useState('All')
  const [pDeal,   setPDeal]   = useState('All')
  const [pSort,   setPSort]   = useState('dueDate')

  // ── KPI calcs ──────────────────────────────────────────────────────────────
  const allInvs       = useMemo(() => (deals||[]).flatMap(d=>d.invoices||[]), [deals])
  const pipelineVal   = useMemo(() => (deals||[]).filter(d=>!DEAL_CLOSED.includes(d.status)).reduce((s,d)=>s+(Number(d.value)||0),0), [deals])
  const activeCount   = useMemo(() => (deals||[]).filter(d=>['Active','Won','Negotiation'].includes(d.status)).length, [deals])
  const totalInvoiced = useMemo(() => allInvs.reduce((s,i)=>s+(Number(i.amount)||0),0), [allInvs])
  const totalCollected= useMemo(() => allInvs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):i.status==='Partially Paid'?(Number(i.paidAmount)||0):0),0), [allInvs])
  const totalOutstanding = totalInvoiced - totalCollected
  const overdueInvs   = useMemo(() => allInvs.filter(i=>i.status==='Overdue'||(i.dueDate&&dLeft(i.dueDate)<0&&!['Paid','Cancelled'].includes(i.status))), [allInvs])
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected/totalInvoiced)*100) : 0

  // ── Filtered deals ─────────────────────────────────────────────────────────
  const filteredDeals = useMemo(() => {
    let l = [...(deals||[])]
    if (dQ) { const lq=dQ.toLowerCase(); l=l.filter(d=>[d.dealName,d.client,d.contractNumber,d.dealType,d.accountManager].some(f=>f?.toLowerCase().includes(lq))) }
    if (dStatus !== 'All') l = l.filter(d=>d.status===dStatus)
    if (dType   !== 'All') l = l.filter(d=>d.dealType===dType)
    l.sort((a,b)=>{
      if (dSort==='value')   return (Number(b.value)||0)-(Number(a.value)||0)
      if (dSort==='endDate') return (a.endDate||'9')>(b.endDate||'9')?1:-1
      if (dSort==='name')    return (a.dealName||'').localeCompare(b.dealName||'')
      return (b.updatedAt||'')>(a.updatedAt||'')?1:-1
    })
    return l
  }, [deals, dQ, dStatus, dType, dSort])

  // ── Enriched invoices ──────────────────────────────────────────────────────
  const enrichedInvs = useMemo(() => {
    let list = (deals||[]).flatMap(d=>(d.invoices||[]).map(i=>({...i,dealName:d.dealName,client:d.client,dealId:d.id,dealCurrency:d.currency})))
    if (pQ) { const lq=pQ.toLowerCase(); list=list.filter(i=>[i.invoiceNumber,i.dealName,i.client,i.description].some(f=>f?.toLowerCase().includes(lq))) }
    if (pStatus === 'Overdue') list = list.filter(i=>i.status==='Overdue'||(i.dueDate&&dLeft(i.dueDate)<0&&!['Paid','Cancelled'].includes(i.status)))
    else if (pStatus !== 'All') list = list.filter(i=>i.status===pStatus)
    if (pDeal !== 'All') list = list.filter(i=>i.dealId===pDeal)
    list.sort((a,b)=>{
      if (pSort==='amount')    return (Number(b.amount)||0)-(Number(a.amount)||0)
      if (pSort==='issueDate') return (b.issueDate||'')>(a.issueDate||'')?1:-1
      if (!a.dueDate&&!b.dueDate) return 0
      if (!a.dueDate) return 1; if (!b.dueDate) return -1
      return a.dueDate>b.dueDate?1:-1
    })
    return list
  }, [deals, pQ, pStatus, pDeal, pSort])

  const selectedDeal = (deals||[]).find(d=>d.id===selected)

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveDeal = async form => {
    if (editingDeal) { await updateDeal({ ...editingDeal, ...form, updatedAt: today() }) }
    else { await addDeal(form) }
    setShowDealForm(false); setEditingDeal(null)
  }

  const handleDeleteDeal = id => {
    setConfirm({ title:'Delete Deal', message:'This will delete the deal and all its invoices permanently.', danger:true, onConfirm:()=>{ deleteDeal(id); if(selected===id) setSelected(null) } })
  }

  const handleSaveInvoice = async data => {
    if (invFormData?.isNew) await addInvoice(data.dealId, data)
    else await updateInvoice(data)
    setShowInvForm(false); setInvFormData(null)
  }

  const handleDeleteInvoice = (dealId, invId) => {
    setConfirm({ title:'Delete Invoice', message:'Remove this invoice permanently?', danger:true, onConfirm:()=>deleteInvoice(dealId, invId) })
  }

  // ── KPI row ────────────────────────────────────────────────────────────────
  const kpis = [
    { label:'Total Deals',    value:(deals||[]).length,    sub:activeCount+' active',                  accent:'#0ea5e9' },
    { label:'Pipeline Value', value:fmtShort(pipelineVal), sub:'excl. closed',                         accent:'#3b82f6' },
    { label:'Total Invoiced', value:fmtShort(totalInvoiced),sub:allInvs.length+' invoices',            accent:'#10b981' },
    { label:'Outstanding',    value:fmtShort(totalOutstanding), sub:overdueInvs.length+' overdue',     accent:overdueInvs.length?'#ef4444':totalOutstanding>0?'#f59e0b':'#10b981' },
    { label:'Collection Rate',value:collectionRate+'%',    sub:fmtShort(totalCollected)+' collected',  accent:collectionRate>=80?'#10b981':collectionRate>=50?'#f59e0b':'#ef4444' },
  ]

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {kpis.map(k=>(
          <div key={k.label} className="card" style={{ padding:'13px 16px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.accent, borderRadius:'var(--r-xl) var(--r-xl) 0 0' }} />
            <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.09em', marginBottom:5 }}>{k.label}</div>
            <div style={{ fontSize:20, fontWeight:850, color:'var(--text)', letterSpacing:'-.04em', lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{k.value}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--border)', marginBottom:20, background:'var(--surface)', borderRadius:'12px 12px 0 0', border:'1px solid var(--border)', overflow:'hidden' }}>
        {[
          { id:'deals',    icon:'💼', label:'Deals',                 badge:(deals||[]).length },
          { id:'payments', icon:'🧾', label:'Payments & Invoices',   badge:allInvs.length, alert:overdueInvs.length },
          { id:'analytics',icon:'📊', label:'Analytics' },
        ].map(t => (
          <button key={t.id} onClick={()=>setMainTab(t.id)} style={{ flex:1, padding:'12px 16px', border:'none', background:mainTab===t.id?'var(--surface)':'var(--surface-2)', cursor:'pointer', fontFamily:'inherit', fontSize:13.5, fontWeight:mainTab===t.id?700:500, color:mainTab===t.id?'var(--blue)':'var(--text-3)', borderBottom:mainTab===t.id?'3px solid var(--blue)':'3px solid transparent', transition:'all .15s', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            {t.label}
            {t.badge!=null && <span style={{ fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:20, background:t.alert?'var(--danger)':mainTab===t.id?'var(--blue)':'var(--border)', color:t.alert||mainTab===t.id?'#fff':'var(--text-3)', marginLeft:2 }}>{t.alert?t.alert+'!':t.badge}</span>}
          </button>
        ))}
      </div>

      {/* DEALS TAB */}
      {mainTab==='deals' && (
        <DealsTab
          deals={filteredDeals} allDeals={deals||[]}
          q={dQ} setQ={setDQ}
          fStatus={dStatus} setFStatus={setDStatus}
          fType={dType}     setFType={setDType}
          sortBy={dSort}    setSortBy={setDSort}
          viewMode={viewMode} setViewMode={setViewMode}
          selected={selected} onSelect={setSelected}
          onNew={()=>{ setEditingDeal(null); setShowDealForm(true) }}
          onEdit={d=>{ setEditingDeal(d); setShowDealForm(true) }}
          onDelete={handleDeleteDeal}
        />
      )}

      {/* PAYMENTS TAB */}
      {mainTab==='payments' && (
        <PaymentsTab
          invoices={enrichedInvs} allInvs={allInvs} deals={deals||[]}
          overdueInvs={overdueInvs}
          totalInvoiced={totalInvoiced} totalCollected={totalCollected} totalOutstanding={totalOutstanding}
          q={pQ} setQ={setPQ}
          fStatus={pStatus} setFStatus={setPStatus}
          fDeal={pDeal}     setFDeal={setPDeal}
          sortBy={pSort}    setSortBy={setPSort}
          onNew={()=>{ const d=(deals||[])[0]; if(!d){toast('Create a deal first','warn');return}; setInvFormData({inv:{id:genInvId(),dealId:d.id,invoiceNumber:'',issueDate:today(),dueDate:'',amount:'',currency:'KWD',status:'Draft',description:'',paidDate:'',paidAmount:'',notes:''},dealId:d.id,isNew:true}); setShowInvForm(true) }}
          onEdit={inv=>{ setInvFormData({inv,dealId:inv.dealId,isNew:false}); setShowInvForm(true) }}
          onDelete={handleDeleteInvoice}
          onMarkPaid={markInvoicePaid}
          onSelectDeal={setSelected}
        />
      )}

      {/* ANALYTICS TAB */}
      {mainTab==='analytics' && (
        <AnalyticsTab deals={deals||[]} allInvs={allInvs} overdueInvs={overdueInvs} totalInvoiced={totalInvoiced} totalCollected={totalCollected} overdueAmt={overdueInvs.reduce((s,i)=>s+(Number(i.amount)||0),0)} collectionRate={collectionRate} markPaid={markInvoicePaid} />
      )}

      {/* Deal detail slide-over */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={()=>setSelected(null)}
          onEdit={()=>{ setEditingDeal(selectedDeal); setShowDealForm(true) }}
          onDelete={()=>handleDeleteDeal(selectedDeal.id)}
          onAddInvoice={()=>{ setInvFormData({inv:{id:genInvId(),dealId:selectedDeal.id,invoiceNumber:'',issueDate:today(),dueDate:'',amount:'',currency:selectedDeal.currency||'KWD',status:'Draft',description:'',paidDate:'',paidAmount:'',notes:''},dealId:selectedDeal.id,isNew:true}); setShowInvForm(true) }}
          onEditInvoice={inv=>{ setInvFormData({inv,dealId:inv.dealId,isNew:false}); setShowInvForm(true) }}
          onDeleteInvoice={handleDeleteInvoice}
          onMarkPaid={markInvoicePaid}
        />
      )}

      {/* Deal form */}
      {showDealForm && <DealFormModal deal={editingDeal} onSave={handleSaveDeal} onClose={()=>{ setShowDealForm(false); setEditingDeal(null) }} />}

      {/* Invoice form */}
      {showInvForm && invFormData && (
        <InvoiceFormModal
          invData={invFormData} deals={deals||[]}
          onSave={handleSaveInvoice}
          onClose={()=>{ setShowInvForm(false); setInvFormData(null) }}
        />
      )}

      {confirm && <ConfirmModal {...confirm} onClose={()=>setConfirm(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEALS TAB
// ─────────────────────────────────────────────────────────────────────────────
function DealsTab({ deals, allDeals, q, setQ, fStatus, setFStatus, fType, setFType, sortBy, setSortBy, viewMode, setViewMode, selected, onSelect, onNew, onEdit, onDelete }) {
  return (
    <div>
      {/* Toolbar */}
      <div className="card" style={{ padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:'1 1 180px', minWidth:0 }}>
          <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
          <input placeholder="Search deals, clients…" value={q} onChange={e=>setQ(e.target.value)} />
          {q && <button className="search-clear" onClick={()=>setQ('')}>×</button>}
        </div>
        <select className={`filter-select${fType!=='All'?' has-value':''}`} value={fType} onChange={e=>setFType(e.target.value)}>
          <option value="All">All Types</option>
          {DEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="updatedAt">Recent</option>
          <option value="value">Value ↓</option>
          <option value="endDate">End Date</option>
          <option value="name">Name A→Z</option>
        </select>
        <div style={{ display:'flex', gap:2, background:'var(--surface-2)', borderRadius:8, padding:2, border:'1px solid var(--border)' }}>
          {['cards','pipeline'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{ padding:'5px 11px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:viewMode===m?700:500, background:viewMode===m?'var(--surface)':'transparent', color:viewMode===m?'var(--blue)':'var(--text-3)', transition:'all .15s' }}>
              {m==='cards'?'⊞ Cards':'⠿ Pipeline'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNew}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
          New Deal
        </button>
      </div>

      {/* Status chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginRight:4 }}>Filter:</span>
        {['All',...DEAL_STATUSES].map(s=>{
          const cnt = s==='All'?allDeals.length:allDeals.filter(d=>d.status===s).length
          if (s!=='All'&&cnt===0) return null
          const active = fStatus===s
          const sc = DEAL_STATUS_COLORS[s]||{}
          return <button key={s} onClick={()=>setFStatus(s)} style={{ padding:'4px 12px', borderRadius:20, fontSize:11.5, fontWeight:active?700:500, cursor:'pointer', border:`1.5px solid ${active?(sc.border||'var(--blue)'):'var(--border)'}`, background:active?(sc.bg||'var(--blue-l)'):'var(--surface)', color:active?(sc.color||'var(--blue)'):'var(--slate)', transition:'all .15s', fontFamily:'inherit' }}>{s} ({cnt})</button>
        })}
      </div>

      {/* Results */}
      {deals.length === 0 ? (
        <EmptyState icon="💼" title="No deals yet" message="Add your first deal to start tracking" action={<button className="btn btn-primary" onClick={onNew}>+ New Deal</button>} />
      ) : viewMode === 'cards' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {deals.map(d=><DealCard key={d.id} deal={d} onClick={()=>onSelect(d.id)} onEdit={()=>onEdit(d)} onDelete={()=>onDelete(d.id)} />)}
        </div>
      ) : (
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, alignItems:'flex-start' }}>
          {DEAL_STATUSES.map(status=>{
            const items = deals.filter(d=>d.status===status)
            const sc = DEAL_STATUS_COLORS[status]||{}
            if (!items.length && !DEAL_PIPELINE.includes(status)) return null
            return (
              <div key={status} style={{ flex:'0 0 220px', minWidth:0 }}>
                <div style={{ background:sc.bg||'var(--surface-2)', border:`1px solid ${sc.border||'var(--border)'}`, borderRadius:10, padding:'8px 12px', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, fontWeight:750, color:sc.color||'var(--text-2)', textTransform:'uppercase', letterSpacing:'.06em' }}>{status}</span>
                  <span style={{ fontSize:11, fontWeight:800, color:sc.color||'var(--text-2)', background:'rgba(0,0,0,.08)', padding:'1px 7px', borderRadius:20 }}>{items.length}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {items.length===0 ? <div style={{ padding:'20px 12px', textAlign:'center', color:'var(--text-3)', fontSize:12, border:'1.5px dashed var(--border)', borderRadius:10 }}>No deals</div>
                  : items.map(d=>(
                    <div key={d.id} onClick={()=>onSelect(d.id)} style={{ background:'var(--surface)', borderRadius:10, border:'1px solid var(--border)', padding:'11px 13px', cursor:'pointer', boxShadow:'var(--sh-sm)', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 18px rgba(15,29,56,.12)';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--sh-sm)';e.currentTarget.style.transform='none'}}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4, lineHeight:1.3 }}>{d.dealName}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-3)', marginBottom:6 }}>{d.client||'—'}</div>
                      {d.value && <div style={{ fontSize:12, fontWeight:800, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(d.value)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function DealCard({ deal, onClick, onEdit, onDelete }) {
  const invs = deal.invoices || []
  const totalInv = invs.reduce((s,i)=>s+(Number(i.amount)||0),0)
  const totalPaid= invs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):i.status==='Partially Paid'?(Number(i.paidAmount)||0):0),0)
  const overdue  = invs.filter(i=>i.status==='Overdue'||(i.dueDate&&dLeft(i.dueDate)<0&&!['Paid','Cancelled'].includes(i.status))).length
  const pct      = totalInv>0?Math.round((totalPaid/totalInv)*100):null
  const daysLeft = deal.endDate ? Math.round((new Date(deal.endDate+'T00:00:00')-new Date())/86400000) : null
  const isUrgent = daysLeft!==null&&daysLeft>=0&&daysLeft<=30
  const isOver   = daysLeft!==null&&daysLeft<0&&!DEAL_CLOSED.includes(deal.status)
  const sc       = DEAL_STATUS_COLORS[deal.status]||{}
  const borderL  = isOver?'var(--danger)':isUrgent?'var(--warning)':(sc.dot||'var(--border)')

  return (
    <div onClick={onClick} style={{ background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)', borderLeft:`4px solid ${borderL}`, boxShadow:'var(--sh-sm)', cursor:'pointer', overflow:'hidden', transition:'box-shadow .18s,transform .18s' }} onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(15,29,56,.12)';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--sh-sm)';e.currentTarget.style.transform='none'}}>
      <div style={{ padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-.02em', lineHeight:1.3, marginBottom:2 }}>{deal.dealName}</div>
            <div style={{ fontSize:12, color:'var(--text-3)', display:'flex', gap:6 }}>
              <span>{deal.client||'—'}</span>
              {deal.contractNumber&&<><span style={{opacity:.4}}>·</span><span style={{fontFamily:'var(--mono)',fontSize:11}}>{deal.contractNumber}</span></>}
            </div>
          </div>
          <div style={{ display:'flex', gap:5, alignItems:'center', flexShrink:0 }}>
            <DealBadge status={deal.status} />
            <button onClick={e=>{e.stopPropagation();onEdit()}} style={{ background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4,borderRadius:6,fontSize:13 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-l)';e.currentTarget.style.color='var(--blue)'}} onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.color='var(--text-3)'}}>✏️</button>
            <button onClick={e=>{e.stopPropagation();onDelete()}} style={{ background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:4,borderRadius:6,fontSize:13 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--danger-l)';e.currentTarget.style.color='var(--danger)'}} onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.color='var(--text-3)'}}>🗑️</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--text-3)', background:'var(--surface-2)', border:'1px solid var(--border-l)', padding:'2px 7px', borderRadius:20 }}>{deal.dealType}</span>
          {deal.priority==='High' && <span style={{ fontSize:11, color:'var(--danger)', background:'var(--danger-l)', border:'1px solid var(--danger-b)', padding:'2px 7px', borderRadius:20, fontWeight:700 }}>🔴 High</span>}
          {overdue>0 && <span style={{ fontSize:11, color:'var(--danger)', background:'var(--danger-l)', border:'1px solid var(--danger-b)', padding:'2px 7px', borderRadius:20, fontWeight:700 }}>⚠ {overdue} overdue inv.</span>}
        </div>
      </div>
      <div style={{ borderTop:'1px solid var(--border-l)', padding:'9px 16px', background:'var(--surface-2)', display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
        {deal.value && <div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Contract</div><div style={{ fontSize:14, fontWeight:800, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(deal.value)}</div></div>}
        {invs.length>0 && <div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Invoiced</div><div style={{ fontSize:13, fontWeight:700, color:'var(--blue)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(totalInv)} · {invs.length} inv.</div></div>}
        {pct!==null && <div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Collected</div><div style={{ fontSize:13, fontWeight:700, color:pct>=100?'var(--success)':pct>=50?'var(--warning)':'var(--danger)' }}>{pct}%</div></div>}
        {deal.endDate && <div style={{ marginLeft:'auto' }}><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Ends</div><div style={{ fontSize:12, fontWeight:700, color:isOver?'var(--danger)':isUrgent?'var(--warning)':'var(--text-2)' }}>{isOver?`⚠ ${Math.abs(daysLeft)}d over`:isUrgent?`⏰ ${daysLeft}d`:deal.endDate}</div></div>}
        {deal.accountManager && <div style={{ marginLeft:!deal.endDate?'auto':'0', display:'flex', alignItems:'center', gap:5 }}><div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue),var(--blue-d))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{deal.accountManager[0]?.toUpperCase()||'?'}</div><span style={{ fontSize:12, color:'var(--text-2)', fontWeight:500 }}>{deal.accountManager}</span></div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function PaymentsTab({ invoices, allInvs, deals, overdueInvs, totalInvoiced, totalCollected, totalOutstanding, q, setQ, fStatus, setFStatus, fDeal, setFDeal, sortBy, setSortBy, onNew, onEdit, onDelete, onMarkPaid, onSelectDeal }) {
  const summaries = [
    { lbl:'Total Invoiced', val:fmtShort(totalInvoiced),    clr:'var(--blue)'   },
    { lbl:'Collected',      val:fmtShort(totalCollected),   clr:'var(--success)'},
    { lbl:'Outstanding',    val:fmtShort(totalOutstanding), clr:totalOutstanding>0?'var(--warning)':'var(--success)'},
    { lbl:'Overdue',        val:fmtShort(overdueInvs.reduce((s,i)=>s+(Number(i.amount)||0),0)), clr:overdueInvs.length?'var(--danger)':'var(--success)'},
  ]
  return (
    <div>
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:18 }}>
        {summaries.map(k=>(
          <div key={k.lbl} className="card" style={{ padding:'13px 16px', display:'flex', gap:12, alignItems:'center' }}>
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 }}>{k.lbl}</div>
              <div style={{ fontSize:17, fontWeight:850, color:k.clr, fontVariantNumeric:'tabular-nums', letterSpacing:'-.04em' }}>{k.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding:'10px 14px', marginBottom:14, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:'1 1 180px', minWidth:0 }}>
          <span className="search-icon"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg></span>
          <input placeholder="Search invoice #, deal, client…" value={q} onChange={e=>setQ(e.target.value)} />
          {q && <button className="search-clear" onClick={()=>setQ('')}>×</button>}
        </div>
        <select className={`filter-select${fStatus!=='All'?' has-value':''}`} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Overdue">⚠ Overdue</option>
          {INV_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className={`filter-select${fDeal!=='All'?' has-value':''}`} value={fDeal} onChange={e=>setFDeal(e.target.value)}>
          <option value="All">All Deals</option>
          {deals.map(d=><option key={d.id} value={d.id}>{d.dealName||(d.client||'Unnamed')}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="dueDate">By Due Date</option>
          <option value="issueDate">By Issue Date</option>
          <option value="amount">Amount ↓</option>
          <option value="status">By Status</option>
        </select>
        <button className="btn btn-success btn-sm" onClick={onNew}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
          Add Invoice
        </button>
      </div>

      {/* Status chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginRight:4 }}>Quick:</span>
        {[
          { id:'All',     label:'All',      cnt:allInvs.length },
          { id:'Overdue', label:'⚠ Overdue',cnt:overdueInvs.length, danger:true },
          { id:'Sent',    label:'Sent',     cnt:allInvs.filter(i=>i.status==='Sent').length },
          { id:'Partially Paid',label:'Partial',cnt:allInvs.filter(i=>i.status==='Partially Paid').length },
          { id:'Paid',    label:'✓ Paid',   cnt:allInvs.filter(i=>i.status==='Paid').length },
          { id:'Draft',   label:'Draft',    cnt:allInvs.filter(i=>i.status==='Draft').length },
        ].map(chip=>{
          if (!chip.cnt&&chip.id!=='All') return null
          const isAct = fStatus===chip.id
          return <button key={chip.id} onClick={()=>setFStatus(chip.id)} style={{ padding:'4px 12px', borderRadius:20, fontSize:11.5, fontWeight:isAct?700:500, cursor:'pointer', border:`1.5px solid ${isAct?(chip.danger?'var(--danger-b)':'var(--blue-ll)'):'var(--border)'}`, background:isAct?(chip.danger?'var(--danger-l)':'var(--blue-l)'):'var(--surface)', color:isAct?(chip.danger?'var(--danger)':'var(--blue)'):'var(--slate)', transition:'all .15s', fontFamily:'inherit' }}>{chip.label} ({chip.cnt})</button>
        })}
      </div>

      {/* Invoice table */}
      {invoices.length === 0 ? (
        <EmptyState icon="🧾" title={allInvs.length?'No invoices match':'No invoices yet'} message={allInvs.length?'Try clearing filters':'Open a deal and add invoices to track payments'} />
      ) : (
        <div className="card" style={{ overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1.1fr 100px 115px 100px 105px 155px', gap:0, background:'var(--surface-2)', borderBottom:'2px solid var(--border)' }}>
            {['Invoice / Description','Deal · Client','Amount','Due Date','Issued','Status','Actions'].map((h,i)=>(
              <div key={h} style={{ fontSize:9.5, fontWeight:750, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', padding:'9px 13px', borderRight:i<6?'1px solid var(--border-l)':'none' }}>{h}</div>
            ))}
          </div>
          {invoices.map((inv,idx)=>{
            const due  = dLeft(inv.dueDate)
            const isOver = inv.status==='Overdue'||(due!==null&&due<0&&!['Paid','Cancelled'].includes(inv.status))
            const isSoon = due!==null&&due>=0&&due<=7&&!['Paid','Cancelled'].includes(inv.status)
            const paid = Number(inv.paidAmount)||0
            const total= Number(inv.amount)||0
            const pct  = total>0?Math.round((paid/total)*100):0
            const rowBg= isOver?'rgba(239,68,68,.04)':inv.status==='Paid'?'rgba(16,185,129,.03)':'var(--surface)'
            return (
              <div key={inv.id} style={{ display:'grid', gridTemplateColumns:'1.3fr 1.1fr 100px 115px 100px 105px 155px', gap:0, background:rowBg, borderBottom:idx<invoices.length-1?'1px solid var(--border-l)':'none', transition:'background .12s' }} onMouseEnter={e=>{ if(!isOver&&inv.status!=='Paid') e.currentTarget.style.background='var(--blue-l)' }} onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                {/* Invoice # */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {isOver&&<span title="Overdue">⚠️</span>}
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text)', fontFamily:'var(--mono)' }}>{inv.invoiceNumber||<em style={{color:'var(--text-3)',fontWeight:400}}>No #</em>}</span>
                  </div>
                  {inv.description&&<div style={{ fontSize:11, color:'var(--text-3)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inv.description}</div>}
                </div>
                {/* Deal / Client */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)', cursor:'pointer' }} onClick={()=>onSelectDeal(inv.dealId)}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--blue)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inv.dealName}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{inv.client||'—'}</div>
                </div>
                {/* Amount */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(inv.amount)}</div>
                  {inv.status==='Partially Paid'&&total>0&&<div style={{ marginTop:4 }}><div style={{ height:3, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:2 }}><div style={{ height:'100%', width:pct+'%', background:'var(--warning)', borderRadius:3 }}/></div><div style={{ fontSize:9.5, color:'var(--warning)', fontWeight:700 }}>{pct}% paid</div></div>}
                </div>
                {/* Due */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)', fontSize:12.5, fontWeight:700, color:isOver?'var(--danger)':isSoon?'var(--warning)':'var(--text-2)' }}>
                  {inv.dueDate?(isOver?`⚠ ${Math.abs(due)}d over`:isSoon?`⏰ ${due}d left`:inv.dueDate):'—'}
                </div>
                {/* Issued */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)', fontSize:12, color:'var(--text-3)' }}>{inv.issueDate||'—'}</div>
                {/* Status */}
                <div style={{ padding:'10px 13px', borderRight:'1px solid var(--border-l)', display:'flex', alignItems:'center' }}><InvBadge status={inv.status} /></div>
                {/* Actions */}
                <div style={{ padding:'7px 10px', display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
                  {!['Paid','Cancelled'].includes(inv.status)&&<button onClick={()=>onMarkPaid(inv.dealId,inv.id)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--success-b)', background:'var(--success-l)', color:'var(--success)', cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--success)';e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--success-l)';e.currentTarget.style.color='var(--success)'}}>✓ Paid</button>}
                  <button onClick={()=>onEdit(inv)} style={{ padding:'5px 7px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-3)', cursor:'pointer', fontSize:12, transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-l)';e.currentTarget.style.color='var(--blue)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-2)';e.currentTarget.style.color='var(--text-3)'}}>✏️</button>
                  <button onClick={()=>onDelete(inv.dealId,inv.id)} style={{ padding:'5px 7px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-3)', cursor:'pointer', fontSize:12, transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--danger-l)';e.currentTarget.style.color='var(--danger)'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface-2)';e.currentTarget.style.color='var(--text-3)'}}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsTab({ deals, allInvs, overdueInvs, totalInvoiced, totalCollected, overdueAmt, collectionRate, markPaid }) {
  const now = new Date()
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
    return { key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label:d.toLocaleString('en',{month:'short',year:'2-digit'}) }
  })
  const monthlyData = months.map(m=>({
    ...m,
    invoiced:  allInvs.filter(i=>(i.issueDate||'').startsWith(m.key)).reduce((s,i)=>s+(Number(i.amount)||0),0),
    collected: allInvs.filter(i=>(i.issueDate||'').startsWith(m.key)&&i.status==='Paid').reduce((s,i)=>s+(Number(i.amount)||0),0),
  }))
  const maxMonth = Math.max(...monthlyData.map(m=>m.invoiced),1)

  const byDeal = deals.map(d=>{
    const dinvs = d.invoices||[]
    const inv = dinvs.reduce((s,i)=>s+(Number(i.amount)||0),0)
    const col = dinvs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):i.status==='Partially Paid'?(Number(i.paidAmount)||0):0),0)
    return { name:d.dealName||d.client||'Unnamed', inv, col, pct:inv>0?Math.round((col/inv)*100):0, count:dinvs.length }
  }).filter(d=>d.count>0).sort((a,b)=>b.inv-a.inv)

  const Hdr = ({t})=><div style={{ fontSize:12, fontWeight:750, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border-l)' }}>{t}</div>

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
      {/* Status breakdown */}
      <div className="card" style={{ padding:20 }}>
        <Hdr t="Invoice Status Breakdown" />
        {['Paid','Sent','Partially Paid','Overdue','Draft','Cancelled'].map(s=>{
          const invs = allInvs.filter(i=>i.status===s)
          const amt  = invs.reduce((sum,i)=>sum+(Number(i.amount)||0),0)
          if (!invs.length) return null
          return (
            <div key={s} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <InvBadge status={s} />
                  <span style={{ fontSize:11, color:'var(--text-3)', background:'var(--surface-2)', border:'1px solid var(--border-l)', padding:'0 5px', borderRadius:20 }}>{invs.length}</span>
                </div>
                <span style={{ fontSize:12.5, fontWeight:700, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(amt)}</span>
              </div>
              <div style={{ height:6, background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
                <div style={{ height:'100%', width:totalInvoiced>0?Math.round((amt/totalInvoiced)*100)+'%':'0%', background:s==='Paid'?'var(--success)':s==='Overdue'?'var(--danger)':s==='Partially Paid'?'var(--warning)':'var(--blue)', borderRadius:6, transition:'width .6s' }}/>
              </div>
            </div>
          )
        })}
      </div>

      {/* Collection by deal */}
      <div className="card" style={{ padding:20 }}>
        <Hdr t="Collection by Deal" />
        {byDeal.slice(0,8).map(d=>(
          <div key={d.name} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{fmtShort(d.col)} of {fmtShort(d.inv)}</div>
              </div>
              <span style={{ fontSize:12, fontWeight:800, color:d.pct>=100?'var(--success)':d.pct>=50?'var(--warning)':'var(--danger)', marginLeft:8, flexShrink:0 }}>{d.pct}%</span>
            </div>
            <div style={{ height:5, background:'var(--border)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:d.pct+'%', background:d.pct>=100?'var(--success)':d.pct>=50?'var(--warning)':'var(--danger)', borderRadius:5, transition:'width .6s' }}/>
            </div>
          </div>
        ))}
        {byDeal.length===0 && <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-3)', fontSize:13 }}>No invoices yet</div>}
      </div>

      {/* Monthly chart */}
      <div className="card" style={{ padding:20, gridColumn:'1/-1' }}>
        <Hdr t="Monthly Invoiced vs Collected (Last 6 Months)" />
        <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:130, paddingTop:8 }}>
          {monthlyData.map(m=>(
            <div key={m.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
              <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:0, justifyContent:'flex-end', flex:1 }}>
                {m.invoiced>0&&<div style={{ fontSize:9, color:'var(--text-3)', marginBottom:2 }}>{fmtShort(m.invoiced)}</div>}
                <div style={{ width:'100%', display:'flex', gap:2, justifyContent:'center', alignItems:'flex-end' }}>
                  <div title={'Invoiced: '+fmtShort(m.invoiced)} style={{ width:'46%', background:'var(--blue)', borderRadius:'4px 4px 0 0', height:Math.max((m.invoiced/maxMonth)*110,m.invoiced>0?4:0)+'px', transition:'height .5s', opacity:.8 }}/>
                  <div title={'Collected: '+fmtShort(m.collected)} style={{ width:'46%', background:'var(--success)', borderRadius:'4px 4px 0 0', height:Math.max((m.collected/maxMonth)*110,m.collected>0?4:0)+'px', transition:'height .5s', opacity:.9 }}/>
                </div>
              </div>
              <div style={{ fontSize:10, color:'var(--text-3)', marginTop:4, textAlign:'center' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:14, marginTop:12, justifyContent:'center' }}>
          {[{c:'var(--blue)',l:'Invoiced'},{c:'var(--success)',l:'Collected'}].map(l=>(
            <div key={l.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:l.c }}/>
              <span style={{ fontSize:12, color:'var(--text-3)' }}>{l.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue alert */}
      {overdueInvs.length > 0 && (
        <div style={{ background:'#fff5f5', borderRadius:14, border:'1px solid var(--danger-b)', padding:20, gridColumn:'1/-1' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <span style={{ fontSize:22 }}>⚠️</span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--danger)' }}>{overdueInvs.length} Overdue Invoice{overdueInvs.length>1?'s':''}</div>
              <div style={{ fontSize:11, color:'var(--danger)', opacity:.8 }}>Total: {fmtShort(overdueAmt)}</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {overdueInvs.slice(0,5).map(inv=>{
              const deal = (deals||[]).find(d=>d.id===inv.dealId)||{}
              const d = dLeft(inv.dueDate)
              return (
                <div key={inv.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--surface)', borderRadius:10, padding:'10px 14px', border:'1px solid var(--danger-b)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', display:'flex', gap:8 }}>
                      <span style={{ fontFamily:'var(--mono)' }}>{inv.invoiceNumber||'No #'}</span>
                      <span style={{ fontWeight:400, color:'var(--text-2)' }}>{deal.dealName||deal.client||'—'}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--danger)', fontWeight:600, marginTop:1 }}>{Math.abs(d)}d overdue · due {inv.dueDate}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--danger)', fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{fmtShort(inv.amount)}</div>
                  <button onClick={()=>markPaid(inv.dealId,inv.id)} style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'var(--success)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>✓ Mark Paid</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL DETAIL SLIDE-OVER
// ─────────────────────────────────────────────────────────────────────────────
function DealDetailPanel({ deal, onClose, onEdit, onDelete, onAddInvoice, onEditInvoice, onDeleteInvoice, onMarkPaid }) {
  const [activeTab, setActiveTab] = useState('overview')
  const invs = deal.invoices || []
  const totalInv  = invs.reduce((s,i)=>s+(Number(i.amount)||0),0)
  const totalPaid = invs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):i.status==='Partially Paid'?(Number(i.paidAmount)||0):0),0)
  const outstanding = totalInv - totalPaid
  const overdueInvs = invs.filter(i=>i.status==='Overdue'||(i.dueDate&&dLeft(i.dueDate)<0&&!['Paid','Cancelled'].includes(i.status)))
  const sc = DEAL_STATUS_COLORS[deal.status]||{}
  const daysLeft = deal.endDate ? Math.round((new Date(deal.endDate+'T00:00:00')-new Date())/86400000) : null
  const isUrgent = daysLeft!==null&&daysLeft>=0&&daysLeft<=30
  const isOver   = daysLeft!==null&&daysLeft<0&&!DEAL_CLOSED.includes(deal.status)

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" style={{ width:'min(540px,96vw)' }}>
        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${sc.bg||'var(--blue-l)'} 0%,var(--surface) 60%)`, padding:'18px 20px 14px', borderBottom:'1px solid var(--border-l)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ flex:1, paddingRight:12 }}>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', letterSpacing:'-.035em', lineHeight:1.25, marginBottom:4 }}>{deal.dealName}</div>
              <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:8 }}>{deal.client||'—'}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <DealBadge status={deal.status} />
                {deal.contractNumber&&<span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text-3)', background:'var(--surface-2)', padding:'2px 7px', borderRadius:6, border:'1px solid var(--border-l)' }}>{deal.contractNumber}</span>}
                {overdueInvs.length>0&&<span style={{ fontSize:11, fontWeight:700, color:'var(--danger)', background:'var(--danger-l)', padding:'2px 7px', borderRadius:20, border:'1px solid var(--danger-b)' }}>⚠ {overdueInvs.length} overdue</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit</button>
              <button style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid var(--danger-b)', background:'var(--danger-l)', color:'var(--danger)', cursor:'pointer', fontSize:12 }} onClick={onDelete}>🗑️</button>
              <button style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--surface)', color:'var(--text-3)', cursor:'pointer', fontSize:16 }} onClick={onClose}>×</button>
            </div>
          </div>
          {/* KPI pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {deal.value&&<KPill label="Contract" value={fmtShort(deal.value)} />}
            {invs.length>0&&<KPill label="Invoiced" value={fmtShort(totalInv)} color="var(--blue)" />}
            {invs.length>0&&<KPill label="Outstanding" value={outstanding>0?fmtShort(outstanding):'✓ Clear'} color={outstanding>0?'var(--warning)':'var(--success)'} />}
            {deal.endDate&&<KPill label="End Date" value={isOver?`⚠ ${Math.abs(daysLeft)}d over`:isUrgent?`⏰ ${daysLeft}d`:deal.endDate} color={isOver?'var(--danger)':isUrgent?'var(--warning)':undefined} />}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border-l)', flexShrink:0, background:'var(--surface)', overflowX:'auto' }}>
          {[
            { id:'overview', label:'Overview' },
            { id:'invoices', label:`Invoices (${invs.length})` },
            { id:'contract', label:'Contract' },
            { id:'history',  label:'History'  },
            { id:'notes',    label:'Notes'    },
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`dp-tab-btn${activeTab===t.id?' active':''}`} style={{ whiteSpace:'nowrap' }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {activeTab==='overview'&&<OverviewTab deal={deal} />}
          {activeTab==='invoices'&&<InvoicesTab invs={invs} deal={deal} onAdd={onAddInvoice} onEdit={onEditInvoice} onDelete={onDeleteInvoice} onMarkPaid={onMarkPaid} />}
          {activeTab==='contract'&&<ContractTab deal={deal} />}
          {activeTab==='history'&&<HistoryTab deal={deal} />}
          {activeTab==='notes'&&<div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7, background:'var(--surface-2)', padding:'14px 16px', borderRadius:12, border:'1px solid var(--border-l)', whiteSpace:'pre-wrap' }}>{deal.notes||<em style={{color:'var(--text-3)'}}>No notes</em>}</div>}
        </div>
      </div>
    </>
  )
}

function KPill({ label, value, color }) {
  return (
    <div style={{ background:'var(--surface)', borderRadius:10, padding:'7px 12px', border:'1px solid var(--border-l)', textAlign:'center' }}>
      <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:14, fontWeight:800, color:color||'var(--text)', letterSpacing:'-.04em', fontVariantNumeric:'tabular-nums' }}>{value}</div>
    </div>
  )
}

function OverviewTab({ deal }) {
  const rows = [
    { lbl:'Deal Type',      val:deal.dealType },
    { lbl:'Department',     val:deal.department },
    { lbl:'Account Manager',val:deal.accountManager },
    { lbl:'Opp. Owner',     val:deal.oppOwner },
    { lbl:'Priority',       val:deal.priority },
  ].filter(r=>r.val)
  return (
    <div>
      {DEAL_PIPELINE.includes(deal.status)&&(
        <div style={{ marginBottom:16, background:'var(--surface-2)', borderRadius:12, padding:'14px 16px', border:'1px solid var(--border-l)' }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>Pipeline Stage</div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {DEAL_PIPELINE.map((stage,i)=>{
              const curIdx = DEAL_PIPELINE.indexOf(deal.status)
              const isDone = i<=curIdx; const isCur = i===curIdx
              const sc2 = DEAL_STATUS_COLORS[stage]||{}
              return (
                <div key={stage} style={{ display:'flex', alignItems:'center', flex:i<DEAL_PIPELINE.length-1?1:'auto' }}>
                  <div title={stage} style={{ width:isCur?14:10, height:isCur?14:10, borderRadius:'50%', background:isDone?(sc2.dot||'var(--blue)'):'var(--border)', flexShrink:0, border:isCur?'3px solid var(--surface)':'none', boxShadow:isCur?`0 0 0 2px ${sc2.dot||'var(--blue)'}`:undefined, transition:'all .3s' }}/>
                  {i<DEAL_PIPELINE.length-1&&<div style={{ flex:1, height:3, background:(isDone&&i<curIdx)?(sc2.dot||'var(--blue)'):'var(--border)', borderRadius:2, margin:'0 2px', transition:'background .3s' }}/>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {rows.map(r=>(
        <div key={r.lbl} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:8, padding:'9px 0', borderBottom:'1px solid var(--border-l)' }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{r.lbl}</span>
          <span style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{r.val}</span>
        </div>
      ))}
      {deal.description&&<div style={{ marginTop:14 }}><div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Description</div><div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, background:'var(--surface-2)', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border-l)' }}>{deal.description}</div></div>}
    </div>
  )
}

function InvoicesTab({ invs, deal, onAdd, onEdit, onDelete, onMarkPaid }) {
  const totalInv  = invs.reduce((s,i)=>s+(Number(i.amount)||0),0)
  const totalPaid = invs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):i.status==='Partially Paid'?(Number(i.paidAmount)||0):0),0)
  return (
    <div>
      {invs.length>0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          {[{l:'Invoiced',val:fmtShort(totalInv),c:'var(--blue)'},{l:'Collected',val:fmtShort(totalPaid),c:'var(--success)'},{l:'Outstanding',val:fmtShort(totalInv-totalPaid),c:(totalInv-totalPaid)>0?'var(--warning)':'var(--success)'}].map(k=>(
            <div key={k.l} style={{ background:'var(--surface-2)', borderRadius:10, padding:'10px 12px', border:'1px solid var(--border-l)', textAlign:'center' }}>
              <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>{k.l}</div>
              <div style={{ fontSize:14, fontWeight:800, color:k.c, fontVariantNumeric:'tabular-nums' }}>{k.val}</div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-success" style={{ width:'100%', justifyContent:'center', marginBottom:14 }} onClick={onAdd}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
        Add Invoice
      </button>
      {invs.length===0 ? <EmptyState icon="🧾" title="No invoices yet" message="Add an invoice to start tracking payments" /> :
      [...invs].sort((a,b)=>(b.issueDate||'')>(a.issueDate||'')?1:-1).map(inv=>{
        const due = dLeft(inv.dueDate)
        const isOver = inv.status==='Overdue'||(due!==null&&due<0&&!['Paid','Cancelled'].includes(inv.status))
        const isSoon = due!==null&&due>=0&&due<=7&&!['Paid','Cancelled'].includes(inv.status)
        const paid = Number(inv.paidAmount)||0; const total= Number(inv.amount)||0; const pct=total>0?Math.round((paid/total)*100):0
        return (
          <div key={inv.id} style={{ background:'var(--surface)', border:`1px solid ${isOver?'var(--danger-b)':isSoon?'var(--warning-b)':'var(--border)'}`, borderRadius:12, padding:'12px 14px', marginBottom:8, borderLeft:`4px solid ${isOver?'var(--danger)':isSoon?'var(--warning)':'var(--border)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                  <span style={{ fontSize:12.5, fontWeight:800, color:'var(--text)', fontFamily:'var(--mono)' }}>{inv.invoiceNumber||'No #'}</span>
                  <InvBadge status={inv.status} />
                </div>
                {inv.description&&<div style={{ fontSize:11, color:'var(--text-3)' }}>{inv.description}</div>}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={()=>onEdit({...inv,dealId:deal.id})} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:6, fontSize:12 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--blue-l)'}} onMouseLeave={e=>{e.currentTarget.style.background=''}}>✏️</button>
                <button onClick={()=>onDelete(deal.id,inv.id)} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', padding:4, borderRadius:6, fontSize:12 }} onMouseEnter={e=>{e.currentTarget.style.background='var(--danger-l)'}} onMouseLeave={e=>{e.currentTarget.style.background=''}}>🗑️</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
              <div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Amount</div><div style={{ fontSize:15, fontWeight:800, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{fmtShort(inv.amount)}</div></div>
              {inv.dueDate&&<div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Due</div><div style={{ fontSize:12, fontWeight:700, color:isOver?'var(--danger)':isSoon?'var(--warning)':'var(--text-2)' }}>{isOver?`⚠ ${Math.abs(due)}d over`:isSoon?`⏰ ${due}d`:inv.dueDate}</div></div>}
              {inv.status==='Partially Paid'&&total>0&&<div style={{ flex:1, minWidth:100 }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}><span style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Collected</span><span style={{ fontSize:11, fontWeight:800, color:'var(--success)' }}>{pct}%</span></div><div style={{ height:5, background:'var(--border)', borderRadius:5, overflow:'hidden' }}><div style={{ height:'100%', width:pct+'%', background:'var(--success)', borderRadius:5 }}/></div></div>}
              {inv.status==='Paid'&&inv.paidDate&&<div><div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Paid On</div><div style={{ fontSize:12, fontWeight:700, color:'var(--success)' }}>{inv.paidDate}</div></div>}
              {!['Paid','Cancelled'].includes(inv.status)&&<button onClick={()=>onMarkPaid(deal.id,inv.id)} style={{ marginLeft:'auto', padding:'5px 12px', borderRadius:8, border:'none', background:'var(--success)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>✓ Mark Paid</button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContractTab({ deal }) {
  const rows = [
    { lbl:'Contract No.', val:deal.contractNumber },
    { lbl:'Value',        val:deal.value?fmtCurrency(deal.value,deal.currency):null },
    { lbl:'Currency',     val:deal.currency },
    { lbl:'Start Date',   val:deal.startDate },
    { lbl:'End Date',     val:deal.endDate },
    { lbl:'Renewal Date', val:deal.renewalDate },
    { lbl:'Contact',      val:deal.contactName },
    { lbl:'Email',        val:deal.contactEmail },
    { lbl:'Phone',        val:deal.contactPhone },
  ].filter(r=>r.val)
  return <div>{rows.map(r=><div key={r.lbl} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:8, padding:'9px 0', borderBottom:'1px solid var(--border-l)' }}><span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{r.lbl}</span><span style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{r.val}</span></div>)}</div>
}

function HistoryTab({ deal }) {
  const hist = (deal.history||[])
  if (!hist.length) return <div style={{ textAlign:'center', padding:40, color:'var(--text-3)', fontSize:13 }}>No status history yet</div>
  return (
    <div style={{ position:'relative', paddingLeft:20 }}>
      <div style={{ position:'absolute', left:7, top:8, bottom:8, width:2, background:'var(--border)', borderRadius:2 }}/>
      {[...hist].reverse().map((h,i)=>{
        const sc = DEAL_STATUS_COLORS[h.status]||{}
        return <div key={i} style={{ position:'relative', paddingBottom:14, paddingLeft:20 }}><div style={{ position:'absolute', left:-6, top:4, width:10, height:10, borderRadius:'50%', background:sc.dot||'var(--blue)', border:'2px solid var(--surface)', boxShadow:`0 0 0 2px ${sc.dot||'var(--blue)'}` }}/><div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-2)' }}>{h.status}</div><div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{h.date}</div></div>
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DealFormModal({ deal, onSave, onClose }) {
  const empty = { dealName:'', client:'', dealType:'Direct Contract', status:'Prospecting', priority:'Medium', accountManager:'', oppOwner:'', value:'', currency:'KWD', startDate:'', endDate:'', renewalDate:'', contractNumber:'', description:'', deliverables:'', notes:'', contactName:'', contactEmail:'', contactPhone:'', department:'AIMS-Projects' }
  const [f, setF] = useState(deal ? { ...deal } : empty)
  const [tab, setTab] = useState('basic')
  const set = (k,v) => setF(p=>({...p,[k]:v}))

  const handleSave = () => {
    if (!f.dealName.trim()) { alert('Deal name is required'); return }
    if (!f.client.trim())   { alert('Client is required'); return }
    onSave({ ...f, invoices: f.invoices||[], history: f.status!==(deal?.status) ? [...(f.history||[]),{status:f.status,date:today()}] : (f.history||[]) })
  }

  const TABS = [{id:'basic',l:'Basic'},{id:'contract',l:'Contract'},{id:'contact',l:'Contact'},{id:'notes',l:'Notes'}]
  const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' }
  const full = { gridColumn:'1/-1' }

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal-box" style={{ width:'min(620px,96vw)' }}>
        <div style={{ padding:'18px 22px 0', borderBottom:'1px solid var(--border-l)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{deal?'Edit Deal':'+ New Deal'}</div>
              <div style={{ fontSize:12, color:'var(--text-3)' }}>Sales & Payment Tracker</div>
            </div>
            <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
          </div>
          <div style={{ display:'flex' }}>
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'8px 14px', border:'none', background:'none', cursor:'pointer', fontSize:12.5, fontWeight:tab===t.id?700:500, color:tab===t.id?'var(--blue)':'var(--text-3)', borderBottom:tab===t.id?'2.5px solid var(--blue)':'2.5px solid transparent', transition:'all .15s', fontFamily:'inherit' }}>{t.l}</button>)}
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {tab==='basic'&&<div style={g2}>
            <div style={full}><Lbl>Deal Name *</Lbl><Inp value={f.dealName} onChange={e=>set('dealName',e.target.value)} placeholder="e.g. MOH Managed Services 2025" /></div>
            <div><Lbl>Client *</Lbl><Inp value={f.client} onChange={e=>set('client',e.target.value)} placeholder="Client name" /></div>
            <div><Lbl>Department</Lbl><Sel value={f.department} onChange={e=>set('department',e.target.value)}>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</Sel></div>
            <div><Lbl>Deal Type</Lbl><Sel value={f.dealType} onChange={e=>set('dealType',e.target.value)}>{DEAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</Sel></div>
            <div><Lbl>Status</Lbl><Sel value={f.status} onChange={e=>set('status',e.target.value)}>{DEAL_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
            <div><Lbl>Priority</Lbl><Sel value={f.priority} onChange={e=>set('priority',e.target.value)}>{['High','Medium','Low'].map(p=><option key={p} value={p}>{p}</option>)}</Sel></div>
            <div><Lbl>Account Manager</Lbl><Sel value={f.accountManager} onChange={e=>set('accountManager',e.target.value)}>{ACCT_MANAGERS.map(m=><option key={m} value={m}>{m||'Select…'}</option>)}</Sel></div>
            <div><Lbl>Opportunity Owner</Lbl><Sel value={f.oppOwner} onChange={e=>set('oppOwner',e.target.value)}>{OPP_OWNERS.map(o=><option key={o} value={o}>{o||'Select…'}</option>)}</Sel></div>
          </div>}
          {tab==='contract'&&<div style={g2}>
            <div><Lbl>Contract Number</Lbl><Inp value={f.contractNumber} onChange={e=>set('contractNumber',e.target.value)} placeholder="CTR-2025-001" /></div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1 }}><Lbl>Value</Lbl><Inp type="number" value={f.value} onChange={e=>set('value',e.target.value)} placeholder="0.000" /></div>
              <div style={{ width:90 }}><Lbl>Currency</Lbl><Sel value={f.currency} onChange={e=>set('currency',e.target.value)}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</Sel></div>
            </div>
            <div><Lbl>Start Date</Lbl><Inp type="date" value={f.startDate} onChange={e=>set('startDate',e.target.value)} /></div>
            <div><Lbl>End Date</Lbl><Inp type="date" value={f.endDate} onChange={e=>set('endDate',e.target.value)} /></div>
            <div><Lbl>Renewal Date</Lbl><Inp type="date" value={f.renewalDate} onChange={e=>set('renewalDate',e.target.value)} /></div>
            <div style={full}><Lbl>Deliverables</Lbl><textarea className="inp-base" rows={3} value={f.deliverables} onChange={e=>set('deliverables',e.target.value)} placeholder="Key deliverables…" /></div>
          </div>}
          {tab==='contact'&&<div style={g2}>
            <div><Lbl>Contact Name</Lbl><Inp value={f.contactName} onChange={e=>set('contactName',e.target.value)} placeholder="Full name" /></div>
            <div><Lbl>Contact Phone</Lbl><Inp value={f.contactPhone} onChange={e=>set('contactPhone',e.target.value)} placeholder="+965…" /></div>
            <div style={full}><Lbl>Contact Email</Lbl><Inp type="email" value={f.contactEmail} onChange={e=>set('contactEmail',e.target.value)} placeholder="email@example.com" /></div>
            <div style={full}><Lbl>Description</Lbl><textarea className="inp-base" rows={3} value={f.description} onChange={e=>set('description',e.target.value)} placeholder="Brief description…" /></div>
          </div>}
          {tab==='notes'&&<div><Lbl>Internal Notes</Lbl><textarea className="inp-base" rows={10} style={{ resize:'vertical' }} value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Notes, meeting outcomes, next steps…" /></div>}
        </div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border-l)', display:'flex', gap:10, justifyContent:'flex-end', background:'var(--surface-2)', flexShrink:0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{deal?'Save Changes':'Create Deal'}</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceFormModal({ invData, deals, onSave, onClose }) {
  const { inv: origInv, dealId: origDealId, isNew } = invData
  const [f,       setF]       = useState({ ...origInv })
  const [selDeal, setSelDeal] = useState(origDealId)
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  const showPaid = ['Partially Paid','Paid'].includes(f.status)
  const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' }
  const full = { gridColumn:'1/-1' }

  const handleSave = () => {
    if (!f.amount||isNaN(Number(f.amount))) { alert('Amount is required'); return }
    onSave({ ...f, dealId:selDeal })
  }

  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal-box" style={{ width:'min(520px,96vw)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'linear-gradient(135deg,#d1fae5 0%,var(--surface) 60%)' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{isNew?'+ New Invoice':'Edit Invoice'}</div>
            <div style={{ fontSize:12, color:'var(--text-3)' }}>Payment & Invoice Tracker</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
          <div style={g2}>
            <div style={full}><Lbl>Deal *</Lbl><Sel value={selDeal} onChange={e=>setSelDeal(e.target.value)}>{deals.map(d=><option key={d.id} value={d.id}>{(d.dealName||d.client||'Unnamed')+' — '+(d.client||'')}</option>)}</Sel></div>
            <div><Lbl>Invoice Number</Lbl><Inp value={f.invoiceNumber} onChange={e=>set('invoiceNumber',e.target.value)} placeholder="INV-2025-001" /></div>
            <div><Lbl>Status</Lbl><Sel value={f.status} onChange={e=>set('status',e.target.value)}>{INV_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</Sel></div>
            <div><Lbl>Issue Date</Lbl><Inp type="date" value={f.issueDate} onChange={e=>set('issueDate',e.target.value)} /></div>
            <div><Lbl>Due Date</Lbl><Inp type="date" value={f.dueDate} onChange={e=>set('dueDate',e.target.value)} /></div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1 }}><Lbl>Amount *</Lbl><Inp type="number" value={f.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.000" /></div>
              <div style={{ width:90 }}><Lbl>Currency</Lbl><Sel value={f.currency||'KWD'} onChange={e=>set('currency',e.target.value)}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</Sel></div>
            </div>
            <div style={full}><Lbl>Description</Lbl><Inp value={f.description} onChange={e=>set('description',e.target.value)} placeholder="Services for Q1 2025…" /></div>
            {showPaid&&<><div><Lbl>Amount Paid</Lbl><Inp type="number" value={f.paidAmount} onChange={e=>set('paidAmount',e.target.value)} placeholder="0.000" /></div><div><Lbl>Payment Date</Lbl><Inp type="date" value={f.paidDate} onChange={e=>set('paidDate',e.target.value)} /></div></>}
            <div style={full}><Lbl>Notes</Lbl><textarea className="inp-base" rows={2} value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Payment reference, bank transfer ID…" /></div>
          </div>
        </div>
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border-l)', display:'flex', gap:10, justifyContent:'flex-end', background:'var(--surface-2)', flexShrink:0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSave}>{isNew?'Add Invoice':'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}
