import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Badge, DTag } from '../components/ui'
import { CLOSED_S, ACTIVE_S } from '../lib/constants'
import { fmtCurrency, fmtShort, fiscalYear, today } from '../lib/utils'

export default function ReportsPage() {
  const { tenders, deals } = useAppStore()
  const [exporting, setExporting] = useState(false)

  const exportCSV = (rows, filename) => {
    if (!rows.length) return
    const hdrs = Object.keys(rows[0])
    const escape = v => { const s=String(v??''); return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s.replace(/"/g,'""')+'"':s }
    const csv = [hdrs.join(','), ...rows.map(r=>hdrs.map(h=>escape(r[h])).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = filename + '_' + today() + '.csv'
    a.click()
  }

  const exportTenders = () => {
    const rows = tenders.map(t => ({
      'Dept': t.dept, 'Name': t.tenderName, 'Number': t.tenderNumber||'',
      'Type': t.tenderType||'', 'Status': t.status, 'Priority': t.priority,
      'Client': t.client||'', 'Vendor': t.vendor||'',
      'Our Bid': t.ourBid||'', 'Currency': t.currency,
      'Issue Date': t.issueDate||'', 'Closing Date': t.closingDate||'',
      'Account Manager': t.accountManager||'', 'Owner': t.oppOwner||'',
      'Fiscal Year': fiscalYear(t.closingDate),
      'Loss Reason': t.lossReason||'', 'Tags': (t.tags||[]).join('; '),
      'Created': t.createdAt||'', 'Updated': t.updatedAt||'',
    }))
    exportCSV(rows, 'TenderTrack_Export')
  }

  const exportDeals = () => {
    const rows = (deals||[]).flatMap(d => (d.invoices||[]).length > 0
      ? (d.invoices||[]).map(inv => ({
          'Deal': d.dealName, 'Client': d.client, 'Deal Type': d.dealType, 'Deal Status': d.status,
          'Contract Value': d.value||'', 'Currency': d.currency,
          'Invoice #': inv.invoiceNumber||'', 'Invoice Amount': inv.amount||'',
          'Invoice Status': inv.status, 'Issue Date': inv.issueDate||'', 'Due Date': inv.dueDate||'',
          'Paid Amount': inv.paidAmount||'', 'Paid Date': inv.paidDate||'',
          'Account Manager': d.accountManager||'', 'Department': d.department,
        }))
      : [{ 'Deal': d.dealName, 'Client': d.client, 'Deal Type': d.dealType, 'Deal Status': d.status,
           'Contract Value': d.value||'', 'Currency': d.currency, 'Invoice #': '', 'Invoice Amount': '',
           'Invoice Status': '', 'Issue Date': '', 'Due Date': '', 'Paid Amount': '', 'Paid Date': '',
           'Account Manager': d.accountManager||'', 'Department': d.department }]
    )
    exportCSV(rows, 'TenderTrack_Deals_Export')
  }

  const won     = tenders.filter(t=>t.status==='Won')
  const active  = tenders.filter(t=>ACTIVE_S.includes(t.status))
  const allInvs = (deals||[]).flatMap(d=>d.invoices||[])
  const totalInvoiced  = allInvs.reduce((s,i)=>s+(Number(i.amount)||0),0)
  const totalCollected = allInvs.reduce((s,i)=>s+(i.status==='Paid'?(Number(i.amount)||0):0),0)

  const reports = [
    { icon:'📋', title:'All Tenders Export', desc:`Export all ${tenders.length} tenders with full details to CSV`, action:exportTenders, color:'#0ea5e9' },
    { icon:'💰', title:'Won Tenders', desc:`${won.length} won tenders — ${fmtShort(won.reduce((s,t)=>s+(Number(t.ourBid)||0),0))} total`, action:()=>exportCSV(won.map(t=>({'Name':t.tenderName,'Client':t.client||'','Dept':t.dept,'Value':t.ourBid||'','Currency':t.currency,'Award Date':t.awardDate||'','Owner':t.oppOwner||t.accountManager||''})),'Won_Tenders'), color:'#10b981' },
    { icon:'📊', title:'Active Pipeline', desc:`${active.length} active tenders — ${fmtShort(active.reduce((s,t)=>s+(Number(t.ourBid)||0),0))} pipeline`, action:()=>exportCSV(active.map(t=>({'Name':t.tenderName,'Client':t.client||'','Status':t.status,'Dept':t.dept,'Value':t.ourBid||'','Currency':t.currency,'Closing':t.closingDate||'','Owner':t.oppOwner||t.accountManager||''})),'Pipeline_Report'), color:'#3b82f6' },
    { icon:'🧾', title:'Invoices & Payments', desc:`${allInvs.length} invoices — ${fmtShort(totalCollected)} collected of ${fmtShort(totalInvoiced)}`, action:exportDeals, color:'#10b981' },
    { icon:'⚠️', title:'Overdue Tenders', desc:'Tenders past their closing date', action:()=>{ const over=tenders.filter(t=>{const d=t.closingDate?Math.ceil((new Date(t.closingDate+'T00:00:00')-new Date())/86400000):null;return d!==null&&d<0&&!CLOSED_S.includes(t.status)}); exportCSV(over.map(t=>({'Name':t.tenderName,'Client':t.client||'','Status':t.status,'Closing':t.closingDate||'','Days Overdue':Math.abs(Math.ceil((new Date(t.closingDate+'T00:00:00')-new Date())/86400000))||0})),'Overdue_Tenders') }, color:'#ef4444' },
    { icon:'📅', title:'Deadline Digest', desc:'Upcoming closings in next 14 days', action:()=>{ const soon=tenders.filter(t=>{const d=t.closingDate?Math.ceil((new Date(t.closingDate+'T00:00:00')-new Date())/86400000):null;return d!==null&&d>=0&&d<=14&&!CLOSED_S.includes(t.status)}).sort((a,b)=>a.closingDate>b.closingDate?1:-1); exportCSV(soon.map(t=>({'Name':t.tenderName,'Client':t.client||'','Dept':t.dept,'Status':t.status,'Closing':t.closingDate,'Days Left':Math.ceil((new Date(t.closingDate+'T00:00:00')-new Date())/86400000)||0,'Owner':t.oppOwner||t.accountManager||''})),'Deadline_Digest') }, color:'#f97316' },
  ]

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',letterSpacing:'-.03em',marginBottom:4}}>Reports & Exports</h2>
        <p style={{fontSize:13,color:'var(--text-3)'}}>Download CSV reports for your data. All exports include the current filtered dataset.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
        {reports.map(r=>(
          <div key={r.title} className="card" style={{padding:'20px',cursor:'pointer',transition:'box-shadow .18s,transform .18s'}} onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--sh-md)';e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform=''}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:r.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{r.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:'var(--text)',marginBottom:3}}>{r.title}</div>
                <div style={{fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>{r.desc}</div>
              </div>
            </div>
            <button onClick={r.action} className="btn btn-ghost btn-sm" style={{width:'100%',justifyContent:'center',gap:8}}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3v8M5 8l3 3 3-3M3 13h10"/></svg>
              Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
