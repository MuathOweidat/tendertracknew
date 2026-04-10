import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Spin } from '../ui'
import { today, genId } from '../../lib/utils'

/**
 * MigrationTool: helps teams move data from the old single-file v6 app
 * (localStorage) into the new Supabase-backed SPA.
 *
 * Step 1 — In the OLD app, run this in the browser console:
 *   copy(JSON.stringify({tenders: JSON.parse(localStorage.getItem('tt2-data')||'[]'), deals: JSON.parse(localStorage.getItem('tt-deals')||'[]')}))
 *
 * Step 2 — Paste the JSON here and click Import.
 */
export default function MigrationTool({ onClose }) {
  const { importTenders, addDeal, addInvoice, toast } = useAppStore()
  const [step,     setStep]     = useState('paste')   // paste | preview | importing | done
  const [raw,      setRaw]      = useState('')
  const [parsed,   setParsed]   = useState(null)
  const [error,    setError]    = useState('')
  const [progress, setProgress] = useState({ done:0, total:0, current:'' })

  const CONSOLE_SCRIPT = `copy(JSON.stringify({tenders:JSON.parse(localStorage.getItem('tt2-data')||'[]'),deals:JSON.parse(localStorage.getItem('tt-deals')||'[]')}))`

  // ── Migrate a v6 tender record to match new schema ─────────────────────────
  const migrateTender = t => ({
    id:              t.id || genId(),
    dept:            t.dept             || 'AIMS-Projects',
    tenderName:      t.tenderName       || t.name || '(Unnamed)',
    tenderNumber:    t.tenderNumber     || '',
    tenderType:      t.tenderType       || '',
    status:          t.status           || 'Pending',
    priority:        t.priority         || 'Medium',
    issueDate:       t.issueDate        || '',
    closingDate:     t.closingDate      || '',
    awardDate:       t.awardDate        || '',
    followUpDate:    t.followUpDate     || '',
    client:          t.client           || '',
    contactName:     t.contactName      || '',
    contactEmail:    t.contactEmail     || '',
    contactPhone:    t.contactPhone     || '',
    accountManager:  t.accountManager   || '',
    oppOwner:        t.oppOwner         || '',
    vendor:          t.vendor           || '',
    ourBid:          t.ourBid  != null ? Number(t.ourBid)  : null,
    price:           t.price   != null ? Number(t.price)   : null,
    currency:        t.currency         || 'KWD',
    preTenderMeeting:   t.preTenderMeeting  || '',
    preTenderAttended:  t.preTenderAttended || '',
    meetingNotes:    t.meetingNotes     || '',
    solutionBrief:   t.solutionBrief    || '',
    remarks:         t.remarks          || '',
    lossReason:      t.lossReason       || '',
    lossNote:        t.lossNote         || '',
    tags:            Array.isArray(t.tags)           ? t.tags           : [],
    competitorBids:  Array.isArray(t.competitorBids) ? t.competitorBids : [],
    comments:        Array.isArray(t.comments)       ? t.comments       : [],
    docs:            Array.isArray(t.docs)           ? t.docs           : [],
    statusHistory:   Array.isArray(t.statusHistory)  ? t.statusHistory  : [],
    bidBond:         (t.bidBond && typeof t.bidBond==='object') ? t.bidBond : {},
    fiscalYear:      t.fiscalYear       || '',
    createdAt:       t.createdAt        || today(),
    updatedAt:       t.updatedAt        || today(),
  })

  const handleParse = () => {
    setError('')
    try {
      let data
      // Try parsing raw JSON
      const trimmed = raw.trim()
      if (!trimmed) { setError('Please paste your data'); return }

      // Handle both {tenders,deals} format and plain array
      const obj = JSON.parse(trimmed)
      if (Array.isArray(obj)) {
        data = { tenders: obj, deals: [] }
      } else if (obj.tenders || obj.deals) {
        data = { tenders: obj.tenders || [], deals: obj.deals || [] }
      } else {
        setError('Unrecognized format. Expected {tenders:[...], deals:[...]} or a plain array.')
        return
      }

      const migratedTenders = data.tenders.map(migrateTender).filter(t => t.tenderName)
      setParsed({ tenders: migratedTenders, deals: data.deals || [] })
      setStep('preview')
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
    }
  }

  const handleImport = async () => {
    if (!parsed) return
    setStep('importing')
    const total = parsed.tenders.length + parsed.deals.length
    setProgress({ done:0, total, current:'Importing tenders…' })

    // Import tenders in batches of 50
    let done = 0
    if (parsed.tenders.length > 0) {
      const batchSize = 50
      for (let i = 0; i < parsed.tenders.length; i += batchSize) {
        const batch = parsed.tenders.slice(i, i + batchSize)
        await importTenders(batch)
        done += batch.length
        setProgress({ done, total, current:`Tenders: ${done}/${parsed.tenders.length}` })
      }
    }

    // Import deals one-by-one (to get proper IDs for invoices)
    if (parsed.deals.length > 0) {
      setProgress({ done, total, current:'Importing deals…' })
      for (const deal of parsed.deals) {
        const invoices = deal.invoices || []
        const newDeal  = await addDeal({
          ...deal,
          id: undefined, // let Supabase generate
          invoices: [],
        })
        if (newDeal && invoices.length > 0) {
          for (const inv of invoices) {
            await addInvoice(newDeal.id, { ...inv, id: undefined, dealId: newDeal.id })
          }
        }
        done++
        setProgress({ done, total, current:`Deals: ${done - parsed.tenders.length}/${parsed.deals.length}` })
      }
    }

    setStep('done')
  }

  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(660px,96vw)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>🔄 Migrate from v6</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Import data from the old single-file TenderTrack app</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16 }}>×</button>
        </div>

        <div className="modal-body">

          {/* STEP: PASTE */}
          {step === 'paste' && (
            <div>
              {/* Instruction */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Step 1: Export from old app</div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7, marginBottom:12 }}>
                  Open your old TenderTrack HTML file in a browser, open the browser console (F12), and run this command:
                </p>
                <div style={{ background:'#0f172a', borderRadius:10, padding:'12px 16px', position:'relative' }}>
                  <code style={{ fontSize:11.5, color:'#a5f3fc', fontFamily:'monospace', display:'block', wordBreak:'break-all', lineHeight:1.6 }}>
                    {CONSOLE_SCRIPT}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(CONSOLE_SCRIPT); toast('Copied!') }}
                    style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:6, padding:'4px 10px', color:'rgba(255,255,255,.7)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}
                  >Copy</button>
                </div>
                <p style={{ fontSize:12, color:'var(--text-3)', marginTop:8 }}>
                  This copies your data to the clipboard. Then paste it below.
                </p>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:5 }}>
                  Step 2: Paste JSON Data
                </label>
                <textarea
                  className="inp-base"
                  rows={8}
                  value={raw}
                  onChange={e => setRaw(e.target.value)}
                  placeholder='{"tenders":[...],"deals":[...]}'
                  style={{ fontFamily:'var(--mono)', fontSize:12 }}
                />
              </div>

              {error && (
                <div style={{ padding:'10px 14px', background:'var(--danger-l)', border:'1px solid var(--danger-b)', borderRadius:8, color:'var(--danger)', fontSize:13, marginBottom:12 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Also accept file upload */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--surface-2)', borderRadius:8, border:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>Or upload a JSON backup file:</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={async e => {
                    const file = e.target.files[0]
                    if (!file) return
                    const text = await file.text()
                    setRaw(text)
                  }}
                  style={{ fontSize:12 }}
                />
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && parsed && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  { icon:'📋', label:'Tenders', count:parsed.tenders.length, color:'var(--blue)' },
                  { icon:'🤝', label:'Deals',   count:parsed.deals.length,   color:'var(--success)' },
                ].map(k => (
                  <div key={k.label} style={{ background:'var(--surface-2)', borderRadius:12, padding:'16px', border:'1px solid var(--border-l)', textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{k.icon}</div>
                    <div style={{ fontSize:26, fontWeight:850, color:k.color, letterSpacing:'-.04em' }}>{k.count}</div>
                    <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{k.label} found</div>
                  </div>
                ))}
              </div>

              {/* Tender preview */}
              {parsed.tenders.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Tender Preview (first 5)</div>
                  <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                    {parsed.tenders.slice(0,5).map((t,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:i<4?'1px solid var(--border-l)':'none', background:i%2===0?'var(--surface)':'var(--surface-2)' }}>
                        <span style={{ fontSize:10, fontWeight:700, color:'var(--blue)', background:'var(--blue-l)', padding:'1px 6px', borderRadius:4, flexShrink:0 }}>{t.dept?.replace('AIMS-','')}</span>
                        <span style={{ flex:1, fontSize:12.5, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.tenderName}</span>
                        <span style={{ fontSize:11, color:'var(--text-3)', flexShrink:0 }}>{t.status}</span>
                      </div>
                    ))}
                    {parsed.tenders.length > 5 && (
                      <div style={{ padding:'8px 14px', background:'var(--surface-2)', fontSize:12, color:'var(--text-3)', textAlign:'center' }}>
                        …and {parsed.tenders.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ padding:'12px 14px', background:'var(--info-l)', borderRadius:8, border:'1px solid var(--info-b)', fontSize:12.5, color:'var(--info)' }}>
                ℹ️ Existing tenders in the database will <strong>not</strong> be duplicated — each import gets a fresh ID. You can delete duplicates from the Tenders list afterwards.
              </div>
            </div>
          )}

          {/* STEP: IMPORTING */}
          {step === 'importing' && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <Spin size={44} />
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginTop:20, marginBottom:6 }}>
                Migrating data…
              </div>
              <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:20 }}>{progress.current}</div>
              <div style={{ height:8, background:'var(--border)', borderRadius:8, overflow:'hidden', maxWidth:300, margin:'0 auto' }}>
                <div style={{ height:'100%', width:progressPct+'%', background:'var(--blue)', borderRadius:8, transition:'width .4s' }} />
              </div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginTop:8 }}>{progress.done} / {progress.total}</div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', marginBottom:8, letterSpacing:'-.03em' }}>Migration Complete!</div>
              <div style={{ fontSize:14, color:'var(--text-3)', marginBottom:8 }}>
                {parsed?.tenders.length} tenders and {parsed?.deals.length} deals imported
              </div>
              <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:24 }}>
                Your data is now in Supabase and synced across all team members.
              </div>
              <button className="btn btn-primary" onClick={onClose}>View Tenders →</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'paste' || step === 'preview') && (
          <div className="modal-footer">
            {step === 'preview' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('paste')}>← Back</button>
            )}
            {step === 'paste' && (
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            )}
            {step === 'paste' && (
              <button className="btn btn-primary btn-sm" onClick={handleParse} disabled={!raw.trim()}>
                Parse Data →
              </button>
            )}
            {step === 'preview' && (
              <button className="btn btn-primary btn-sm" onClick={handleImport}>
                Import to Supabase →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
