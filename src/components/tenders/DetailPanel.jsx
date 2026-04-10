import React, { useState } from 'react'
import { Badge, DTag, PBadge, NewDot } from '../ui'
import { dLeft, isNewRecord, fmtCurrency } from '../../lib/utils'
import { CLOSED_S, BB_ALERTS, BB_STATUS_COLORS } from '../../lib/constants'

const TABS = [
  { id:'overview', label:'Overview' },
  { id:'bidbond',  label:'Bid Bond' },
  { id:'docs',     label:'Docs'     },
  { id:'comments', label:'Comments' },
  { id:'history',  label:'History'  },
]

export default function DetailPanel({ tender: t, onClose, onEdit, onDelete, onSave, onPrint, onDuplicate, perms }) {
  const [activeTab,   setActiveTab]   = useState('overview')
  const [newComment,  setNewComment]  = useState('')
  const [saving,      setSaving]      = useState(false)

  const d      = dLeft(t.closingDate)
  const closed = CLOSED_S.includes(t.status)
  const isNew  = isNewRecord(t.createdAt)
  const bb     = t.bidBond && typeof t.bidBond === 'object' ? t.bidBond : {}
  const bbA    = BB_ALERTS[t.status]
  const actionPending = bbA && bb.amount && bb.bbStatus !== 'N/A' && bb.bbStatus !== 'Released'

  const addComment = async () => {
    if (!newComment.trim()) return
    setSaving(true)
    const updated = {
      ...t,
      comments: [...(t.comments||[]), {
        text:   newComment.trim(),
        date:   new Date().toISOString().split('T')[0],
        author: 'Me',
      }],
    }
    await onSave(updated)
    setNewComment('')
    setSaving(false)
  }

  const Row = ({ lbl, val, mono, children }) => {
    if (!val && !children) return null
    return (
      <div style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:8, padding:'9px 0', borderBottom:'1px solid var(--border-l)' }}>
        <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', paddingTop:1 }}>{lbl}</span>
        {children || (
          <span style={{ fontSize:13, color:'var(--text-2)', fontFamily: mono ? 'var(--mono)' : 'inherit', fontWeight:500 }}>{val}</span>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel" style={{ width:'min(540px,96vw)' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ padding:'18px 20px 14px', borderBottom:'1px solid var(--border-l)', flexShrink:0, background:'linear-gradient(135deg, var(--blue-l) 0%, var(--surface) 60%)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-.03em', lineHeight:1.25, marginBottom:5 }}>{t.tenderName}</div>
              <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                <DTag dept={t.dept} />
                <Badge status={t.status} />
                {isNew && <NewDot />}
                <PBadge priority={t.priority} />
                {actionPending && (
                  <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, background:bbA.bg, color:bbA.color, border:`1px solid ${bbA.border}` }}>
                    🏦 Action needed
                  </span>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:5, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
              {onPrint     && <button onClick={onPrint}     className="btn btn-ghost btn-xs" title="Print">🖨️</button>}
              {onDuplicate && <button onClick={onDuplicate} className="btn btn-ghost btn-xs" title="Duplicate">📋</button>}
              {onEdit      && <button onClick={onEdit}      className="btn btn-ghost btn-xs">✏️ Edit</button>}
              {onDelete    && <button onClick={onDelete}    className="btn btn-danger btn-xs">🗑️</button>}
              <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, border:'1.5px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
          </div>

          {/* KPI pills */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {t.ourBid != null && (
              <div style={{ background:'var(--surface)', borderRadius:10, padding:'7px 13px', border:'1px solid var(--border-l)' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>Our Bid</div>
                <div style={{ fontSize:15, fontWeight:850, color:'var(--text)', letterSpacing:'-.03em', fontVariantNumeric:'tabular-nums' }}>{fmtCurrency(t.ourBid, t.currency)}</div>
              </div>
            )}
            {t.closingDate && (
              <div style={{ background: d!==null&&d<0&&!closed?'var(--danger-l)':d!==null&&d<=7&&!closed?'var(--warning-l)':'var(--surface)', borderRadius:10, padding:'7px 13px', border:`1px solid ${d!==null&&d<0&&!closed?'var(--danger-b)':d!==null&&d<=7&&!closed?'var(--warning-b)':'var(--border-l)'}` }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>Closing</div>
                <div style={{ fontSize:13, fontWeight:800, color: d!==null&&d<0&&!closed?'var(--danger)':d!==null&&d<=7&&!closed?'var(--warning)':'var(--text-2)' }}>
                  {closed ? t.closingDate : d===null ? t.closingDate : d<0 ? `⚠ ${Math.abs(d)}d over` : d===0 ? 'Today' : `${d}d`}
                </div>
              </div>
            )}
            {t.oppOwner && (
              <div style={{ background:'var(--surface)', borderRadius:10, padding:'7px 13px', border:'1px solid var(--border-l)' }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>Owner</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--purple)' }}>{t.oppOwner}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border-l)', flexShrink:0, overflowX:'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`dp-tab-btn${activeTab===tab.id?' active':''}`}>
              {tab.label}
              {tab.id==='comments' && (t.comments||[]).length > 0 && ` (${t.comments.length})`}
            </button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <Row lbl="Tender No."    val={t.tenderNumber} mono />
              <Row lbl="Type"          val={t.tenderType} />
              <Row lbl="Client"        val={t.client} />
              <Row lbl="Vendor"        val={t.vendor} />
              <Row lbl="Acct Manager"  val={t.accountManager} />
              <Row lbl="Contact"       val={t.contactName} />
              <Row lbl="Email"         val={t.contactEmail} />
              <Row lbl="Phone"         val={t.contactPhone} />
              <Row lbl="Issue Date"    val={t.issueDate} />
              <Row lbl="Award Date"    val={t.awardDate} />
              <Row lbl="Follow-up"     val={t.followUpDate} />
              {t.solutionBrief && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Solution Brief</div>
                  <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, background:'var(--surface-2)', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border-l)' }}>{t.solutionBrief}</div>
                </div>
              )}
              {t.remarks && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Remarks</div>
                  <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, background:'var(--surface-2)', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border-l)', whiteSpace:'pre-wrap' }}>{t.remarks}</div>
                </div>
              )}
              {t.status === 'Lost' && t.lossReason && (
                <div style={{ marginTop:12, padding:'12px 14px', background:'var(--danger-l)', borderRadius:10, border:'1px solid var(--danger-b)' }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'var(--danger)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Loss Reason</div>
                  <div style={{ fontSize:13, color:'var(--danger)', fontWeight:600 }}>{t.lossReason}</div>
                  {t.lossNote && <div style={{ fontSize:12, color:'var(--danger)', marginTop:4, opacity:.8 }}>{t.lossNote}</div>}
                </div>
              )}
              {(t.tags||[]).length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Tags</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {t.tags.map(tag => (
                      <span key={tag} style={{ fontSize:10.5, fontWeight:700, color:'var(--blue)', background:'var(--blue-l)', border:'1px solid var(--blue-ll)', borderRadius:20, padding:'2px 9px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BID BOND */}
          {activeTab === 'bidbond' && <BidBondTab bb={bb} bbA={bbA} actionPending={actionPending} />}

          {/* DOCS */}
          {activeTab === 'docs' && (
            <div>
              {(t.docs||[]).length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-3)', fontSize:13 }}>No documents attached</div>
              ) : (t.docs||[]).map((doc, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border-l)' }}>
                  <span style={{ fontSize:20 }}>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{doc.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>{doc.type} · {doc.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMMENTS */}
          {activeTab === 'comments' && (
            <div>
              <div style={{ marginBottom:16 }}>
                <textarea
                  className="inp-base"
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  style={{ marginBottom:8 }}
                  onKeyDown={e => { if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) addComment() }}
                />
                <button className="btn btn-primary btn-sm" onClick={addComment} disabled={saving || !newComment.trim()}>
                  {saving ? '…' : 'Post Comment'}
                </button>
              </div>
              {[...(t.comments||[])].reverse().map((c, i) => (
                <div key={i} style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border-l)', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{c.author || 'Team'}</span>
                    <span style={{ fontSize:11, color:'var(--text-3)' }}>{c.date}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6 }}>{c.text}</div>
                </div>
              ))}
              {(t.comments||[]).length === 0 && (
                <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-3)', fontSize:13 }}>No comments yet</div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div>
              {(t.statusHistory||[]).length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-3)', fontSize:13 }}>No status history yet</div>
              ) : (
                <div style={{ position:'relative', paddingLeft:20 }}>
                  <div style={{ position:'absolute', left:7, top:8, bottom:8, width:2, background:'var(--border)', borderRadius:2 }} />
                  {[...(t.statusHistory||[])].reverse().map((h, i) => (
                    <div key={i} style={{ position:'relative', paddingBottom:16, paddingLeft:20 }}>
                      <div style={{ position:'absolute', left:-6, top:4, width:10, height:10, borderRadius:'50%', background:'var(--blue)', border:'2px solid var(--surface)', boxShadow:'0 0 0 2px var(--blue)' }} />
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-2)' }}>{h.status}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{h.date}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function BidBondTab({ bb, bbA, actionPending }) {
  if (!bb.amount) return (
    <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-3)', fontSize:13 }}>No bid bond on this tender</div>
  )
  const expDays = bb.expiryDate ? Math.ceil((new Date(bb.expiryDate+'T00:00:00')-new Date())/86400000) : null
  const sc = BB_STATUS_COLORS[bb.bbStatus] || {}
  const R = ({ lbl, val }) => val ? (
    <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, padding:'9px 0', borderBottom:'1px solid var(--border-l)' }}>
      <span style={{ fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{lbl}</span>
      <span style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{val}</span>
    </div>
  ) : null
  return (
    <div>
      {actionPending && (
        <div style={{ padding:'12px 14px', borderRadius:10, marginBottom:16, background:bbA.bg, border:`1px solid ${bbA.border}`, color:bbA.color, fontSize:13, fontWeight:600 }}>
          ⚠️ {bbA.msg}
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20, background:sc.bg||'var(--surface-2)', color:sc.color||'var(--text-3)', border:`1px solid ${sc.border||'var(--border)'}` }}>
          {bb.bbStatus || 'Unknown'}
        </span>
      </div>
      <R lbl="Amount"  val={bb.amount ? `${bb.currency||'KWD'} ${Number(bb.amount).toLocaleString()}` : null} />
      <R lbl="Bank"    val={bb.bank} />
      <R lbl="Issued"  val={bb.issueDate} />
      <R lbl="Expires" val={bb.expiryDate ? `${bb.expiryDate}${expDays!==null ? ` (${expDays<0?Math.abs(expDays)+'d expired':expDays+'d left'})` : ''}` : null} />
      <R lbl="Notes"   val={bb.notes} />
    </div>
  )
}
