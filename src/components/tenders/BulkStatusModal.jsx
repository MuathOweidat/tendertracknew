import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { Badge } from '../ui'
import { STATUSES, CLOSED_S, LOSS_REASONS } from '../../lib/constants'
import { today } from '../../lib/utils'

export default function BulkStatusModal({ tenderIds, onClose }) {
  const { tenders, bulkUpdateTenders, toast } = useAppStore()
  const [status,     setStatus]     = useState('')
  const [lossReason, setLossReason] = useState('')
  const [lossNote,   setLossNote]   = useState('')
  const [followUp,   setFollowUp]   = useState('')
  const [saving,     setSaving]     = useState(false)

  const selectedTenders = tenders.filter(t => tenderIds.includes(t.id))
  const isLoss = status === 'Lost'
  const needsFollowUp = ['Submitted', 'Under Review', 'Lowest Price'].includes(status)

  const handleApply = async () => {
    if (!status) { toast('Please select a status', 'warn'); return }
    setSaving(true)
    const updates = {}
    tenderIds.forEach(id => {
      const t = tenders.find(x => x.id === id)
      if (!t) return
      updates[id] = {
        status,
        statusHistory: [...(t.statusHistory||[]), { status, date: today() }],
        ...(isLoss && lossReason ? { lossReason } : {}),
        ...(isLoss && lossNote   ? { lossNote   } : {}),
        ...(followUp              ? { followUpDate: followUp } : {}),
        updatedAt: today(),
      }
    })
    await bulkUpdateTenders(updates)
    setSaving(false)
    onClose()
  }

  // Group selected by current status
  const byStatus = selectedTenders.reduce((acc, t) => {
    acc[t.status] = (acc[t.status]||0)+1
    return acc
  }, {})

  const lbl = txt => (
    <label style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:5 }}>{txt}</label>
  )

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width:'min(520px,96vw)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border-l)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>Bulk Status Update</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>
              Updating <strong style={{ color:'var(--blue)' }}>{tenderIds.length}</strong> tender{tenderIds.length!==1?'s':''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16 }}>×</button>
        </div>

        <div className="modal-body">
          {/* Current status summary */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Current Statuses</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.entries(byStatus).map(([s, cnt]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <Badge status={s} />
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>×{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* New status picker */}
          <div style={{ marginBottom:16 }}>
            {lbl('Set All To')}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding:'8px 12px', borderRadius:8, border:`2px solid ${status===s?'var(--blue)':'var(--border)'}`,
                    background: status===s ? 'var(--blue-l)' : 'var(--surface)',
                    cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all .15s',
                    display:'flex', alignItems:'center', gap:8,
                  }}
                >
                  <div style={{ width:6, height:6, borderRadius:'50%', background:status===s?'var(--blue)':'var(--border)', flexShrink:0 }} />
                  <span style={{ fontSize:12.5, fontWeight:status===s?700:500, color:status===s?'var(--blue)':'var(--text-2)' }}>{s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Loss reason (conditional) */}
          {isLoss && (
            <div style={{ marginBottom:14 }}>
              {lbl('Loss Reason')}
              <select className="inp-base" value={lossReason} onChange={e => setLossReason(e.target.value)}>
                <option value="">Select reason…</option>
                {LOSS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ marginTop:10 }}>
                {lbl('Loss Note (optional)')}
                <textarea className="inp-base" rows={2} value={lossNote} onChange={e => setLossNote(e.target.value)} placeholder="Additional context…" />
              </div>
            </div>
          )}

          {/* Follow-up date (conditional) */}
          {needsFollowUp && (
            <div style={{ marginBottom:14 }}>
              {lbl('Set Follow-up Date (optional)')}
              <input className="inp-base" type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} />
            </div>
          )}

          {/* Warning */}
          {status && (
            <div style={{ padding:'10px 14px', borderRadius:8, background: CLOSED_S.includes(status)?'var(--warning-l)':'var(--info-l)', border:`1px solid ${CLOSED_S.includes(status)?'var(--warning-b)':'var(--info-b)'}`, fontSize:12.5, color: CLOSED_S.includes(status)?'var(--warning)':'var(--info)' }}>
              {CLOSED_S.includes(status)
                ? `⚠️ This will close ${tenderIds.length} tender${tenderIds.length!==1?'s':''}. This action can be reversed by editing individual tenders.`
                : `ℹ️ All ${tenderIds.length} selected tenders will be set to "${status}".`
              }
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            disabled={!status || saving}
          >
            {saving ? '…' : `Apply to ${tenderIds.length} Tender${tenderIds.length!==1?'s':''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
