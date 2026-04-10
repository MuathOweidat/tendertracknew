import React, { useState, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { Spin } from '../ui'
import { today, genId } from '../../lib/utils'
import { DEPTS, STATUSES, TENDER_TYPES } from '../../lib/constants'

// ── Parse AIMS Excel using local xlsx package ────────────────────────────────
async function parseAIMSExcel(file) {
  const XLSX = await import('xlsx')
  const buf  = await file.arrayBuffer()
  const wb   = XLSX.read(buf, { type:'array', cellDates:true })

  const records = []
  const DEPT_SHEETS = ['Projects-Plexus','AIMS-Consultations','AIMS-Sales','Plexus','Projects','AIMS']

  for (const sn of wb.SheetNames) {
    const ws   = wb.Sheets[sn]
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:null })
    if (rows.length < 2) continue

    // Find header row
    let hr = -1
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i]
      if (!row) continue
      const has = f => row.some(c => typeof c === 'string' && c.toLowerCase().includes(f.toLowerCase()))
      if (has('Dept') || has('Tender') || has('Status') || has('Ministry') || has('Client')) {
        hr = i; break
      }
    }
    if (hr === -1) hr = 0

    const hdrs = (rows[hr] || []).map(h => (h ? String(h).trim().toLowerCase() : ''))

    const col = (...keys) => {
      for (const k of keys) {
        const idx = hdrs.findIndex(h => h.includes(k.toLowerCase()))
        if (idx !== -1) return idx
      }
      return -1
    }

    const cols = {
      dept:        col('dept','department','div'),
      name:        col('tender name','project name','description','title','tender','name'),
      number:      col('tender no','number','reference','ref no','tender num'),
      type:        col('type','category','kind'),
      status:      col('status','stage'),
      client:      col('ministry','client','entity','authority'),
      issue:       col('issue date','published','from date','start'),
      closing:     col('closing date','deadline','submission','due date','end'),
      bid:         col('our bid','bid amount','our price','amount'),
      currency:    col('currency','curr'),
      vendor:      col('vendor','supplier','partner'),
      owner:       col('owner','account manager','am','manager','engineer'),
      remarks:     col('remark','note','comment'),
    }

    const fmtDate = v => {
      if (!v) return ''
      if (v instanceof Date) return v.toISOString().split('T')[0]
      const s = String(v).trim()
      // Try DD/MM/YYYY or MM/DD/YYYY
      const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
      if (m1) {
        const [,a,b,c] = m1
        const yr = c.length===2 ? '20'+c : c
        return `${yr}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`
      }
      const d = new Date(s)
      if (!isNaN(d)) return d.toISOString().split('T')[0]
      return ''
    }

    const mapStatus = raw => {
      if (!raw) return 'Pending'
      const r = String(raw).toLowerCase()
      if (r.includes('won') || r.includes('award')) return 'Won'
      if (r.includes('lost') || r.includes('fail')) return 'Lost'
      if (r.includes('submit')) return 'Submitted'
      if (r.includes('review') || r.includes('evaluat')) return 'Under Review'
      if (r.includes('purchas')) return 'Purchased'
      if (r.includes('cancel')) return 'Canceled'
      if (r.includes('lowest') || r.includes('best price')) return 'Lowest Price'
      if (r.includes('pending') || r.includes('draft')) return 'Pending'
      return 'Pending'
    }

    const mapDept = (raw, sheetName) => {
      if (!raw) return sheetName.includes('Consult') ? 'AIMS-Consultations' : sheetName.includes('Sales') ? 'AIMS-Sales' : sheetName.includes('Plexus') ? 'Plexus' : 'AIMS-Projects'
      const r = String(raw).toLowerCase()
      if (r.includes('consult')) return 'AIMS-Consultations'
      if (r.includes('sales'))   return 'AIMS-Sales'
      if (r.includes('plexus'))  return 'Plexus'
      return 'AIMS-Projects'
    }

    for (let i = hr + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row.some(Boolean)) continue

      const get = idx => idx !== -1 ? row[idx] : null
      const name = get(cols.name)
      if (!name) continue

      records.push({
        id:           genId(),
        dept:         mapDept(get(cols.dept), sn),
        tenderName:   String(name).trim(),
        tenderNumber: get(cols.number) ? String(get(cols.number)).trim() : '',
        tenderType:   get(cols.type) ? String(get(cols.type)).trim() : '',
        status:       mapStatus(get(cols.status)),
        client:       get(cols.client) ? String(get(cols.client)).trim() : '',
        issueDate:    fmtDate(get(cols.issue)),
        closingDate:  fmtDate(get(cols.closing)),
        ourBid:       get(cols.bid) ? Number(String(get(cols.bid)).replace(/[,\s]/g,''))||null : null,
        currency:     get(cols.currency) ? String(get(cols.currency)).trim().toUpperCase() : 'KWD',
        vendor:       get(cols.vendor) ? String(get(cols.vendor)).trim() : '',
        accountManager: get(cols.owner) ? String(get(cols.owner)).trim() : '',
        remarks:      get(cols.remarks) ? String(get(cols.remarks)).trim() : '',
        priority:     'Medium',
        tags:         [],
        comments:     [],
        docs:         [],
        competitorBids:[],
        statusHistory: [],
        bidBond:      {},
        createdAt:    today(),
        updatedAt:    today(),
        fiscalYear:   '',
        contactName:  '', contactEmail:'', contactPhone:'',
        oppOwner:'', preTenderMeeting:'', preTenderAttended:'',
        meetingNotes:'', solutionBrief:'', lossReason:'', lossNote:'',
        awardDate:'', followUpDate:'',
      })
    }
  }

  return records
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const hdrs = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || []
    const obj  = {}
    hdrs.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/"/g,'').trim() })
    return {
      id: genId(), dept: obj.dept||'AIMS-Projects', tenderName: obj['tender name']||obj.name||obj.tendername||'',
      tenderNumber: obj['tender number']||obj.number||'', status: obj.status||'Pending',
      client: obj.client||obj.ministry||'', closingDate: obj['closing date']||obj.closingdate||'',
      issueDate: obj['issue date']||obj.issuedate||'', ourBid: obj['our bid']?Number(obj['our bid']):null,
      currency:'KWD', priority:'Medium', tags:[], comments:[], docs:[], competitorBids:[],
      statusHistory:[], bidBond:{}, createdAt:today(), updatedAt:today(),
      tenderType:'', vendor:'', accountManager:'', remarks:obj.remarks||obj.notes||'',
      contactName:'', contactEmail:'', contactPhone:'', oppOwner:'',
      preTenderMeeting:'', preTenderAttended:'', meetingNotes:'', solutionBrief:'',
      lossReason:'', lossNote:'', awardDate:'', followUpDate:'', fiscalYear:'',
    }
  }).filter(r => r.tenderName)
}

export default function ImportModal({ onClose }) {
  const { importTenders, toast } = useAppStore()
  const [stage,    setStage]    = useState('upload')   // 'upload' | 'preview' | 'importing' | 'done'
  const [records,  setRecords]  = useState([])
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef()

  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true); setError('')
    try {
      let recs = []
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        recs = await parseAIMSExcel(file)
      } else if (file.name.match(/\.csv$/i)) {
        const text = await file.text()
        recs = parseCSV(text)
      } else if (file.name.match(/\.json$/i)) {
        const text = await file.text()
        const data = JSON.parse(text)
        recs = Array.isArray(data) ? data : data.tenders || []
      } else {
        throw new Error('Unsupported file format. Use .xlsx, .csv, or .json')
      }
      if (!recs.length) throw new Error('No tenders found in this file')
      setRecords(recs)
      setStage('preview')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setStage('importing')
    const count = await importTenders(records)
    setImported(count)
    setStage('done')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(640px,96vw)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>📥 Import Tenders</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>Excel (.xlsx), CSV, or JSON backup</div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
        </div>

        <div className="modal-body">

          {/* UPLOAD */}
          {stage === 'upload' && (
            <div>
              <div
                onClick={() => fileRef.current.click()}
                style={{ border:'2px dashed var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center', cursor:'pointer', transition:'all .2s', background:'var(--surface-2)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--blue)'; e.currentTarget.style.background='var(--blue-l)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface-2)' }}
              >
                <div style={{ fontSize:40, marginBottom:12 }}>{loading ? '⏳' : '📂'}</div>
                {loading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <Spin size={18} />
                    <span style={{ fontSize:14, color:'var(--text-2)' }}>Parsing file…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Drop file or click to browse</div>
                    <div style={{ fontSize:13, color:'var(--text-3)' }}>Supports AIMS Excel format, CSV, and JSON backup files</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json" onChange={handleFile} style={{ display:'none' }} />

              {error && (
                <div style={{ marginTop:14, padding:'12px 14px', background:'var(--danger-l)', border:'1px solid var(--danger-b)', borderRadius:10, color:'var(--danger)', fontSize:13 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Format guide */}
              <div style={{ marginTop:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>Supported Formats</div>
                {[
                  { icon:'📊', name:'AIMS Excel (.xlsx)', desc:'Auto-detects columns: Dept, Tender Name, Number, Status, Client, Closing Date, Bid Amount' },
                  { icon:'📄', name:'CSV (.csv)',          desc:'Header row required. Columns: tender name, dept, status, client, closing date, our bid' },
                  { icon:'💾', name:'JSON Backup (.json)', desc:'Previously exported TenderTrack backup file' },
                ].map(f => (
                  <div key={f.name} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border-l)' }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{f.name}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:2 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {stage === 'preview' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--success-l)', borderRadius:10, border:'1px solid var(--success-b)', marginBottom:18 }}>
                <span style={{ fontSize:20 }}>✅</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--success)' }}>{records.length} tenders found</div>
                  <div style={{ fontSize:12, color:'var(--success)', opacity:.8 }}>Review below and click Import to add to your database</div>
                </div>
              </div>

              {/* Preview table */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', maxHeight:320, overflowY:'auto' }}>
                <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 90px 90px', gap:0, background:'var(--surface-2)', borderBottom:'2px solid var(--border)', position:'sticky', top:0 }}>
                  {['Dept','Tender Name','Status','Client','Closing'].map(h => (
                    <div key={h} style={{ padding:'8px 12px', fontSize:9.5, fontWeight:750, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                  ))}
                </div>
                {records.map((r, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 90px 90px 90px', gap:0, borderBottom:'1px solid var(--border-l)', background: i%2===0?'var(--surface)':'var(--surface-2)' }}>
                    <div style={{ padding:'9px 12px', fontSize:10.5, fontWeight:700, color:'var(--blue)' }}>{r.dept?.replace('AIMS-','')}</div>
                    <div style={{ padding:'9px 12px', fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.tenderName}</div>
                    <div style={{ padding:'9px 12px', fontSize:11, color:'var(--text-3)' }}>{r.status}</div>
                    <div style={{ padding:'9px 12px', fontSize:11, color:'var(--text-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.client||'—'}</div>
                    <div style={{ padding:'9px 12px', fontSize:11, color:'var(--text-3)', fontFamily:'var(--mono)' }}>{r.closingDate||'—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:12, fontSize:12, color:'var(--text-3)' }}>
                ℹ️ All tenders will be added. Duplicates can be removed from the Tenders list afterwards.
              </div>
            </div>
          )}

          {/* IMPORTING */}
          {stage === 'importing' && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <Spin size={40} />
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginTop:16, marginBottom:6 }}>Importing {records.length} tenders…</div>
              <div style={{ fontSize:13, color:'var(--text-3)' }}>Saving to Supabase database</div>
            </div>
          )}

          {/* DONE */}
          {stage === 'done' && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:8 }}>Import Complete!</div>
              <div style={{ fontSize:14, color:'var(--text-3)', marginBottom:24 }}>
                {imported} tender{imported!==1?'s':''} added to your database
              </div>
              <button className="btn btn-primary" onClick={onClose}>View Tenders</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(stage === 'preview' || stage === 'upload') && (
          <div className="modal-footer">
            <button className="btn btn-ghost btn-sm" onClick={stage==='preview' ? () => { setStage('upload'); setRecords([]) } : onClose}>
              {stage==='preview' ? '← Back' : 'Cancel'}
            </button>
            {stage === 'preview' && (
              <button className="btn btn-primary btn-sm" onClick={handleImport}>
                Import {records.length} Tenders →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
