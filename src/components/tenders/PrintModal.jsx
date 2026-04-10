import React, { useRef } from 'react'
import { fmtCurrency, dLeft } from '../../lib/utils'
import { CLOSED_S } from '../../lib/constants'

export default function PrintModal({ tender: t, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Tender — ${t.tenderName}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0f172a; background: #fff; }
        .page { padding: 28px 32px; max-width: 900px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #0f2d56; }
        .logo { font-size: 22pt; font-weight: 900; color: #0f2d56; letter-spacing: -.04em; }
        .logo span { font-size: 10pt; display: block; color: #64748b; font-weight: 500; margin-top: 2px; }
        .meta { text-align: right; font-size: 9pt; color: #64748b; }
        h2 { font-size: 15pt; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -.02em; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 9pt; font-weight: 700; }
        .section { margin-bottom: 18px; }
        .section-title { font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
        .row { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
        .row-label { font-size: 9pt; font-weight: 600; color: #64748b; min-width: 130px; flex-shrink: 0; }
        .row-val { font-size: 10pt; color: #0f172a; }
        .highlight { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; }
        .highlight p { font-size: 10pt; font-weight: 600; color: #92400e; }
        .notes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 10pt; color: #374151; line-height: 1.6; white-space: pre-wrap; }
        .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8.5pt; color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        th { text-align: left; font-size: 8.5pt; font-weight: 700; color: #64748b; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: .05em; }
        td { padding: 6px 8px; border: 1px solid #e2e8f0; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
      </head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const d      = dLeft(t.closingDate)
  const closed = CLOSED_S.includes(t.status)
  const bb     = t.bidBond && typeof t.bidBond === 'object' ? t.bidBond : {}
  const hasBond = bb.amount && bb.bbStatus && bb.bbStatus !== 'N/A'

  const statusColors = {
    Won:  { bg:'#d1fae5', color:'#065f46' },
    Lost: { bg:'#fee2e2', color:'#991b1b' },
    Submitted: { bg:'#e0f2fe', color:'#0369a1' },
  }
  const sc = statusColors[t.status] || { bg:'#f1f5f9', color:'#475569' }

  const Row = ({ l, v, mono }) => v ? (
    <div className="row">
      <span className="row-label">{l}</span>
      <span className="row-val" style={mono ? { fontFamily:'monospace' } : {}}>{v}</span>
    </div>
  ) : null

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(820px,96vw)', maxHeight:'90vh' }} onClick={e => e.stopPropagation()}>

        {/* Controls */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>🖨️ Print Tender Sheet</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Print / Save PDF</button>
            <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px', background:'#f0f4f8' }}>
          <div ref={printRef}>
            <div className="page" style={{ background:'#fff', borderRadius:8, padding:'28px 32px', boxShadow:'0 2px 16px rgba(0,0,0,.08)' }}>

              {/* Header */}
              <div className="header">
                <div>
                  <div className="logo">TenderTrack <span>AIMS Bid Management System</span></div>
                  <div style={{ marginTop:10 }}>
                    <h2>{t.tenderName}</h2>
                    <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center', flexWrap:'wrap' }}>
                      <span className="badge" style={{ background:sc.bg, color:sc.color }}>{t.status}</span>
                      <span style={{ fontSize:'9pt', fontWeight:600, color:'#64748b' }}>{t.dept}</span>
                      {t.priority === 'High' && <span className="badge" style={{ background:'#fee2e2', color:'#991b1b' }}>🔴 High Priority</span>}
                    </div>
                  </div>
                </div>
                <div className="meta">
                  <div>Generated: {new Date().toLocaleDateString('en-KW', { day:'2-digit', month:'long', year:'numeric' })}</div>
                  {t.tenderNumber && <div style={{ marginTop:4, fontFamily:'monospace', fontWeight:600 }}>{t.tenderNumber}</div>}
                </div>
              </div>

              {/* Alert if closing soon */}
              {!closed && d !== null && d <= 7 && (
                <div className="highlight">
                  <p>⚠️ {d < 0 ? `OVERDUE — ${Math.abs(d)} days past closing` : d === 0 ? 'CLOSING TODAY' : `Closing in ${d} days — ${t.closingDate}`}</p>
                </div>
              )}

              <div className="grid">
                {/* Basic info */}
                <div className="section">
                  <div className="section-title">Basic Information</div>
                  <Row l="Department"     v={t.dept} />
                  <Row l="Tender Type"    v={t.tenderType} />
                  <Row l="Tender Number"  v={t.tenderNumber} mono />
                  <Row l="Fiscal Year"    v={t.fiscalYear} />
                  <Row l="Issue Date"     v={t.issueDate} />
                  <Row l="Closing Date"   v={t.closingDate} />
                  <Row l="Award Date"     v={t.awardDate} />
                  <Row l="Follow-up"      v={t.followUpDate} />
                </div>

                {/* Commercial */}
                <div className="section">
                  <div className="section-title">Commercial Details</div>
                  <Row l="Client / Ministry" v={t.client} />
                  <Row l="Vendor / Partner"  v={t.vendor} />
                  <Row l="Our Bid"           v={t.ourBid != null ? fmtCurrency(t.ourBid, t.currency) : null} />
                  <Row l="Currency"          v={t.currency} />
                  <Row l="Account Manager"   v={t.accountManager} />
                  <Row l="Opportunity Owner" v={t.oppOwner} />
                  <Row l="Contact"           v={t.contactName} />
                  <Row l="Email"             v={t.contactEmail} />
                  <Row l="Phone"             v={t.contactPhone} />
                </div>
              </div>

              {/* Bid bond */}
              {hasBond && (
                <div className="section">
                  <div className="section-title">Bid Bond</div>
                  <div className="grid">
                    <Row l="Bank"        v={bb.bank} />
                    <Row l="Amount"      v={bb.amount ? fmtCurrency(bb.amount, bb.currency||'KWD') : null} />
                    <Row l="Status"      v={bb.bbStatus} />
                    <Row l="Issue Date"  v={bb.issueDate} />
                    <Row l="Expiry Date" v={bb.expiryDate} />
                  </div>
                </div>
              )}

              {/* Solution brief */}
              {t.solutionBrief && (
                <div className="section">
                  <div className="section-title">Solution Brief</div>
                  <div className="notes">{t.solutionBrief}</div>
                </div>
              )}

              {/* Status history */}
              {(t.statusHistory||[]).length > 0 && (
                <div className="section">
                  <div className="section-title">Status History</div>
                  <table>
                    <thead><tr><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {[...(t.statusHistory||[])].reverse().map((h, i) => (
                        <tr key={i}><td>{h.status}</td><td>{h.date}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Remarks */}
              {t.remarks && (
                <div className="section">
                  <div className="section-title">Remarks</div>
                  <div className="notes">{t.remarks}</div>
                </div>
              )}

              {/* Tags */}
              {(t.tags||[]).length > 0 && (
                <div className="section">
                  <div className="section-title">Tags</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {t.tags.map(tag => (
                      <span key={tag} style={{ fontSize:'9pt', fontWeight:700, color:'#1e66d4', background:'#ebf2fd', border:'1px solid #d6e7fb', borderRadius:20, padding:'2px 9px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                <span>TenderTrack — AIMS Kuwait</span>
                <span>Confidential — Internal Use Only</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
