import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Lbl, Inp, Sel } from '../ui'
import { STATUSES, DEPTS, TENDER_TYPES, CURRENCIES, PRIORITIES, ACCT_MANAGERS, OPP_OWNERS, COMMON_TAGS } from '../../lib/constants'
import { genId, today } from '../../lib/utils'

const TABS = [
  { id:'basic',    label:'Basic Info' },
  { id:'contract', label:'Contract'   },
  { id:'contact',  label:'Contact'    },
  { id:'bidbond',  label:'Bid Bond'   },
  { id:'notes',    label:'Notes'      },
]

const EMPTY = () => ({
  id: genId(), dept:'AIMS-Projects', tenderName:'', tenderNumber:'',
  tenderType:'', status:'Pending', priority:'Medium',
  issueDate:'', closingDate:'', awardDate:'', followUpDate:'',
  client:'', contactName:'', contactEmail:'', contactPhone:'',
  accountManager:'', oppOwner:'', vendor:'',
  ourBid:'', price:'', currency:'KWD',
  preTenderMeeting:'', preTenderAttended:'', meetingNotes:'',
  solutionBrief:'', remarks:'', lossReason:'', lossNote:'',
  tags:[], competitorBids:[], comments:[], docs:[],
  statusHistory:[], bidBond:{}, fiscalYear:'',
  createdAt: today(), updatedAt: today(),
})

export default function NewTenderModal({ existing, onClose }) {
  const { addTender, updateTender, toast } = useAppStore()
  const [f, setF] = useState(existing ? { ...existing } : EMPTY())
  const [tab, setTab] = useState('basic')
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const isEdit = !!existing

  const handleSave = async () => {
    if (!f.tenderName.trim()) { toast('Tender name is required', 'warn'); return }
    setSaving(true)
    try {
      if (isEdit) await updateTender(f)
      else        await addTender(f)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const addTag = t => {
    const tag = (t || tagInput).trim()
    if (!tag || (f.tags||[]).includes(tag)) return
    set('tags', [...(f.tags||[]), tag])
    setTagInput('')
  }
  const removeTag = t => set('tags', (f.tags||[]).filter(x => x !== t))

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(680px,96vw)' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-.03em' }}>
                {isEdit ? 'Edit Tender' : '+ New Tender'}
              </div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
                {isEdit ? f.tenderName : 'Add a new bid to your tracker'}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, color:'var(--text-3)' }}>×</button>
          </div>
          {/* Tab strip */}
          <div style={{ display:'flex', gap:0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'9px 14px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12.5, fontWeight:tab===t.id?700:500, color:tab===t.id?'var(--blue)':'var(--text-3)', borderBottom:tab===t.id?'2.5px solid var(--blue)':'2.5px solid transparent', transition:'all .15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* BASIC */}
          {tab === 'basic' && (
            <div className="form-grid">
              <div className="full">
                <Lbl>Tender Name *</Lbl>
                <Inp value={f.tenderName} onChange={e=>set('tenderName',e.target.value)} placeholder="e.g. Oracle License Renewal 2026" />
              </div>
              <div>
                <Lbl>Department</Lbl>
                <Sel value={f.dept} onChange={e=>set('dept',e.target.value)}>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Tender Type</Lbl>
                <Sel value={f.tenderType} onChange={e=>set('tenderType',e.target.value)}><option value="">Select type…</option>{TENDER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Tender Number</Lbl>
                <Inp value={f.tenderNumber} onChange={e=>set('tenderNumber',e.target.value)} placeholder="e.g. IT-2025-001" />
              </div>
              <div>
                <Lbl>Status</Lbl>
                <Sel value={f.status} onChange={e=>set('status',e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Priority</Lbl>
                <Sel value={f.priority} onChange={e=>set('priority',e.target.value)}>{PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Account Manager</Lbl>
                <Sel value={f.accountManager} onChange={e=>set('accountManager',e.target.value)}><option value="">Select…</option>{ACCT_MANAGERS.filter(Boolean).map(m=><option key={m} value={m}>{m}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Opportunity Owner</Lbl>
                <Sel value={f.oppOwner} onChange={e=>set('oppOwner',e.target.value)}><option value="">Select…</option>{OPP_OWNERS.filter(Boolean).map(o=><option key={o} value={o}>{o}</option>)}</Sel>
              </div>
              <div>
                <Lbl>Issue Date</Lbl>
                <Inp type="date" value={f.issueDate} onChange={e=>set('issueDate',e.target.value)} />
              </div>
              <div>
                <Lbl>Closing Date</Lbl>
                <Inp type="date" value={f.closingDate} onChange={e=>set('closingDate',e.target.value)} />
              </div>
              <div>
                <Lbl>Follow-up Date</Lbl>
                <Inp type="date" value={f.followUpDate} onChange={e=>set('followUpDate',e.target.value)} />
              </div>
              <div>
                <Lbl>Award Date</Lbl>
                <Inp type="date" value={f.awardDate} onChange={e=>set('awardDate',e.target.value)} />
              </div>
              {/* Tags */}
              <div className="full">
                <Lbl>Tags</Lbl>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                  {(f.tags||[]).map(t => (
                    <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'var(--blue)', background:'var(--blue-l)', border:'1px solid var(--blue-ll)', borderRadius:20, padding:'2px 8px' }}>
                      {t}
                      <button onClick={() => removeTag(t)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:12, lineHeight:1, padding:0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
                  {COMMON_TAGS.filter(t=>!(f.tags||[]).includes(t)).map(t => (
                    <button key={t} onClick={() => addTag(t)} style={{ fontSize:10.5, padding:'2px 8px', borderRadius:20, border:'1px dashed var(--border)', background:'none', cursor:'pointer', color:'var(--text-3)', fontFamily:'inherit' }}>+ {t}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <Inp value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="Custom tag…" onKeyDown={e=>e.key==='Enter'&&addTag()} />
                  <button className="btn btn-ghost btn-sm" onClick={() => addTag()}>Add</button>
                </div>
              </div>
            </div>
          )}

          {/* CONTRACT */}
          {tab === 'contract' && (
            <div className="form-grid">
              <div>
                <Lbl>Client</Lbl>
                <Inp value={f.client} onChange={e=>set('client',e.target.value)} placeholder="Client / Ministry name" />
              </div>
              <div>
                <Lbl>Vendor</Lbl>
                <Inp value={f.vendor} onChange={e=>set('vendor',e.target.value)} placeholder="Technology vendor" />
              </div>
              <div>
                <Lbl>Our Bid Amount</Lbl>
                <Inp type="number" value={f.ourBid ?? ''} onChange={e=>set('ourBid',e.target.value)} placeholder="0.000" />
              </div>
              <div>
                <Lbl>Currency</Lbl>
                <Sel value={f.currency} onChange={e=>set('currency',e.target.value)}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</Sel>
              </div>
              <div className="full">
                <Lbl>Solution Brief</Lbl>
                <textarea className="inp-base" rows={3} value={f.solutionBrief||''} onChange={e=>set('solutionBrief',e.target.value)} placeholder="Describe the solution proposed…" />
              </div>
            </div>
          )}

          {/* CONTACT */}
          {tab === 'contact' && (
            <div className="form-grid">
              <div>
                <Lbl>Contact Name</Lbl>
                <Inp value={f.contactName} onChange={e=>set('contactName',e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Lbl>Contact Phone</Lbl>
                <Inp value={f.contactPhone} onChange={e=>set('contactPhone',e.target.value)} placeholder="+965…" />
              </div>
              <div className="full">
                <Lbl>Contact Email</Lbl>
                <Inp type="email" value={f.contactEmail} onChange={e=>set('contactEmail',e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <Lbl>Pre-Tender Meeting</Lbl>
                <Inp type="date" value={f.preTenderMeeting} onChange={e=>set('preTenderMeeting',e.target.value)} />
              </div>
              <div>
                <Lbl>Meeting Attended</Lbl>
                <Sel value={f.preTenderAttended} onChange={e=>set('preTenderAttended',e.target.value)}><option value="">Select…</option>{['Yes','No','Not applicable'].map(o=><option key={o} value={o}>{o}</option>)}</Sel>
              </div>
              <div className="full">
                <Lbl>Meeting Notes</Lbl>
                <textarea className="inp-base" rows={3} value={f.meetingNotes||''} onChange={e=>set('meetingNotes',e.target.value)} placeholder="Key takeaways…" />
              </div>
            </div>
          )}

          {/* BID BOND */}
          {tab === 'bidbond' && (
            <BidBondSection bb={f.bidBond||{}} onChange={bb=>set('bidBond',bb)} />
          )}

          {/* NOTES */}
          {tab === 'notes' && (
            <div>
              <Lbl>Remarks</Lbl>
              <textarea className="inp-base" rows={6} value={f.remarks||''} onChange={e=>set('remarks',e.target.value)} placeholder="Internal notes, next steps…" style={{ marginBottom:16 }} />
              {f.status === 'Lost' && <>
                <Lbl>Loss Reason</Lbl>
                <Sel value={f.lossReason} onChange={e=>set('lossReason',e.target.value)}><option value="">Select reason…</option>{['Price too high','Technical non-compliance','Bid bond issue','Late submission','Scope mismatch','Competitor advantage','Client relationship','Other'].map(r=><option key={r} value={r}>{r}</option>)}</Sel>
                <div style={{ marginTop:12 }}>
                  <Lbl>Loss Note</Lbl>
                  <textarea className="inp-base" rows={3} value={f.lossNote||''} onChange={e=>set('lossNote',e.target.value)} placeholder="Additional context…" />
                </div>
              </>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? '…' : isEdit ? 'Save Changes' : 'Create Tender'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BidBondSection({ bb, onChange }) {
  const set = (k, v) => onChange({ ...bb, [k]: v })
  const BB_STATUSES = ['Active','Extended','Cancel Required','Performance Bond Required','Released','Forfeited','N/A']
  return (
    <div className="form-grid">
      <div>
        <Lbl>Bond Amount</Lbl>
        <Inp type="number" value={bb.amount??''} onChange={e=>set('amount',e.target.value)} placeholder="0.000" />
      </div>
      <div>
        <Lbl>Currency</Lbl>
        <Sel value={bb.currency||'KWD'} onChange={e=>set('currency',e.target.value)}>{['KWD','USD','EUR'].map(c=><option key={c} value={c}>{c}</option>)}</Sel>
      </div>
      <div>
        <Lbl>Bank</Lbl>
        <Inp value={bb.bank||''} onChange={e=>set('bank',e.target.value)} placeholder="Bank name" />
      </div>
      <div>
        <Lbl>Bond Status</Lbl>
        <Sel value={bb.bbStatus||'N/A'} onChange={e=>set('bbStatus',e.target.value)}>{BB_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</Sel>
      </div>
      <div>
        <Lbl>Issue Date</Lbl>
        <Inp type="date" value={bb.issueDate||''} onChange={e=>set('issueDate',e.target.value)} />
      </div>
      <div>
        <Lbl>Expiry Date</Lbl>
        <Inp type="date" value={bb.expiryDate||''} onChange={e=>set('expiryDate',e.target.value)} />
      </div>
      <div className="full">
        <Lbl>Notes</Lbl>
        <textarea className="inp-base" rows={2} value={bb.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Bond notes…" />
      </div>
    </div>
  )
}
