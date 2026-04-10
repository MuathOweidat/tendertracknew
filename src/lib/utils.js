import { NEW_THRESHOLD_MS } from './constants'

// ── Date helpers ──────────────────────────────────────────────────────────────
export const today    = () => new Date().toISOString().split('T')[0]
export const dLeft    = d  => d ? Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000) : null
export const daysAgo  = d  => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null
export const fiscalYear = d => {
  if (!d) return ''
  const y = +d.slice(0,4), m = +d.slice(5,7)
  return m >= 4 ? `${y}-${y+1}` : `${y-1}-${y}`
}
export const isNewRecord = createdAt => {
  if (!createdAt) return false
  try { return (Date.now() - new Date(createdAt).getTime()) < NEW_THRESHOLD_MS } catch { return false }
}

// ── Currency formatters ───────────────────────────────────────────────────────
export const fmtCurrency = (v, currency = 'KWD') => {
  if (v == null || v === '' || isNaN(v)) return '—'
  const dec = currency === 'KWD' ? 3 : 2
  return new Intl.NumberFormat('en', {
    style: 'currency', currency, minimumFractionDigits: dec, maximumFractionDigits: dec,
  }).format(Number(v))
}

export const fmtShort = (v, currency = 'KWD') => {
  if (v == null || v === '' || isNaN(Number(v))) return '—'
  const n   = Number(v)
  const sym = currency === 'KWD' ? 'KWD' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency
  const dec = currency === 'KWD' ? 3 : 2
  if (n >= 1_000_000) return sym + ' ' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return sym + ' ' + (n / 1_000).toFixed(1) + 'K'
  return sym + ' ' + n.toFixed(dec)
}

// ── ID generators ─────────────────────────────────────────────────────────────
export const genId     = () => 't-'   + Date.now() + Math.floor(Math.random() * 99999)
export const genDealId = () => 'd-'   + Date.now() + '-' + Math.random().toString(36).slice(2,6)
export const genInvId  = () => 'inv-' + Date.now() + '-' + Math.random().toString(36).slice(2,6)

// ── Snapshot timestamp ────────────────────────────────────────────────────────
export const tStr = () => new Date().toLocaleString('en-KW', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
})

// ── DB row ↔ app object mappers ───────────────────────────────────────────────
export const dbToTender = row => ({
  id:               row.id,
  dept:             row.dept             ?? 'AIMS-Projects',
  tenderName:       row.tender_name      ?? '',
  tenderNumber:     row.tender_number    ?? '',
  tenderType:       row.tender_type      ?? '',
  status:           row.status           ?? 'Pending',
  priority:         row.priority         ?? 'Medium',
  issueDate:        row.issue_date       ?? '',
  closingDate:      row.closing_date     ?? '',
  awardDate:        row.award_date       ?? '',
  followUpDate:     row.follow_up_date   ?? '',
  client:           row.client           ?? '',
  contactName:      row.contact_name     ?? '',
  contactEmail:     row.contact_email    ?? '',
  contactPhone:     row.contact_phone    ?? '',
  accountManager:   row.account_manager  ?? '',
  oppOwner:         row.opp_owner        ?? '',
  vendor:           row.vendor           ?? '',
  ourBid:           row.our_bid          != null ? Number(row.our_bid) : null,
  price:            row.price            != null ? Number(row.price)   : null,
  currency:         row.currency         ?? 'KWD',
  preTenderMeeting: row.pre_tender_meeting  ?? '',
  preTenderAttended:row.pre_tender_attended ?? '',
  meetingNotes:     row.meeting_notes    ?? '',
  solutionBrief:    row.solution_brief   ?? '',
  remarks:          row.remarks          ?? '',
  lossReason:       row.loss_reason      ?? '',
  lossNote:         row.loss_note        ?? '',
  tags:             Array.isArray(row.tags)           ? row.tags           : [],
  competitorBids:   Array.isArray(row.competitor_bids)? row.competitor_bids: [],
  comments:         Array.isArray(row.comments)       ? row.comments       : [],
  docs:             Array.isArray(row.docs)            ? row.docs            : [],
  statusHistory:    Array.isArray(row.status_history)  ? row.status_history  : [],
  bidBond:          row.bid_bond && typeof row.bid_bond === 'object' ? row.bid_bond : {},
  fiscalYear:       row.fiscal_year ?? '',
  createdAt:        row.created_at  ?? '',
  updatedAt:        row.updated_at  ?? '',
})

export const tenderToDb = t => ({
  id:                 t.id,
  dept:               t.dept,
  tender_name:        t.tenderName,
  tender_number:      t.tenderNumber    || null,
  tender_type:        t.tenderType      || null,
  status:             t.status,
  priority:           t.priority,
  issue_date:         t.issueDate       || null,
  closing_date:       t.closingDate     || null,
  award_date:         t.awardDate       || null,
  follow_up_date:     t.followUpDate    || null,
  client:             t.client          || null,
  contact_name:       t.contactName     || null,
  contact_email:      t.contactEmail    || null,
  contact_phone:      t.contactPhone    || null,
  account_manager:    t.accountManager  || null,
  opp_owner:          t.oppOwner        || null,
  vendor:             t.vendor          || null,
  our_bid:            t.ourBid          != null ? t.ourBid  : null,
  price:              t.price           != null ? t.price   : null,
  currency:           t.currency        || 'KWD',
  pre_tender_meeting: t.preTenderMeeting  || null,
  pre_tender_attended:t.preTenderAttended || null,
  meeting_notes:      t.meetingNotes    || null,
  solution_brief:     t.solutionBrief   || null,
  remarks:            t.remarks         || null,
  loss_reason:        t.lossReason      || null,
  loss_note:          t.lossNote        || null,
  tags:               t.tags            ?? [],
  competitor_bids:    t.competitorBids  ?? [],
  comments:           t.comments        ?? [],
  docs:               t.docs            ?? [],
  status_history:     t.statusHistory   ?? [],
  bid_bond:           t.bidBond         ?? {},
  fiscal_year:        t.fiscalYear      || null,
  updated_at:         new Date().toISOString(),
})

export const dbToDeal = row => ({
  id:             row.id,
  dealName:       row.deal_name       ?? '',
  client:         row.client          ?? '',
  dealType:       row.deal_type       ?? 'Direct Contract',
  status:         row.status          ?? 'Prospecting',
  priority:       row.priority        ?? 'Medium',
  accountManager: row.account_manager ?? '',
  oppOwner:       row.opp_owner       ?? '',
  value:          row.value           != null ? String(row.value) : '',
  currency:       row.currency        ?? 'KWD',
  startDate:      row.start_date      ?? '',
  endDate:        row.end_date        ?? '',
  renewalDate:    row.renewal_date    ?? '',
  contractNumber: row.contract_number ?? '',
  description:    row.description     ?? '',
  deliverables:   row.deliverables    ?? '',
  notes:          row.notes           ?? '',
  contactName:    row.contact_name    ?? '',
  contactEmail:   row.contact_email   ?? '',
  contactPhone:   row.contact_phone   ?? '',
  department:     row.department      ?? 'AIMS-Projects',
  tags:           Array.isArray(row.tags)    ? row.tags    : [],
  history:        Array.isArray(row.history) ? row.history : [],
  createdAt:      row.created_at      ?? '',
  updatedAt:      row.updated_at      ?? '',
})

export const dealToDb = d => ({
  id:              d.id,
  deal_name:       d.dealName,
  client:          d.client,
  deal_type:       d.dealType,
  status:          d.status,
  priority:        d.priority,
  account_manager: d.accountManager || null,
  opp_owner:       d.oppOwner       || null,
  value:           d.value          ? Number(d.value) : null,
  currency:        d.currency       || 'KWD',
  start_date:      d.startDate      || null,
  end_date:        d.endDate        || null,
  renewal_date:    d.renewalDate    || null,
  contract_number: d.contractNumber || null,
  description:     d.description    || null,
  deliverables:    d.deliverables   || null,
  notes:           d.notes          || null,
  contact_name:    d.contactName    || null,
  contact_email:   d.contactEmail   || null,
  contact_phone:   d.contactPhone   || null,
  department:      d.department     || 'AIMS-Projects',
  tags:            d.tags           ?? [],
  history:         d.history        ?? [],
  updated_at:      new Date().toISOString(),
})

export const dbToInvoice = row => ({
  id:            row.id,
  dealId:        row.deal_id       ?? '',
  invoiceNumber: row.invoice_number ?? '',
  issueDate:     row.issue_date    ?? '',
  dueDate:       row.due_date      ?? '',
  amount:        row.amount        != null ? String(row.amount) : '',
  currency:      row.currency      ?? 'KWD',
  status:        row.status        ?? 'Draft',
  description:   row.description   ?? '',
  paidDate:      row.paid_date     ?? '',
  paidAmount:    row.paid_amount   != null ? String(row.paid_amount) : '',
  notes:         row.notes         ?? '',
  createdAt:     row.created_at    ?? '',
  updatedAt:     row.updated_at    ?? '',
})

export const invoiceToDb = inv => ({
  id:             inv.id,
  deal_id:        inv.dealId,
  invoice_number: inv.invoiceNumber || null,
  issue_date:     inv.issueDate     || null,
  due_date:       inv.dueDate       || null,
  amount:         Number(inv.amount),
  currency:       inv.currency      || 'KWD',
  status:         inv.status,
  description:    inv.description   || null,
  paid_date:      inv.paidDate      || null,
  paid_amount:    inv.paidAmount    ? Number(inv.paidAmount) : null,
  notes:          inv.notes         || null,
  updated_at:     new Date().toISOString(),
})

// ── Misc helpers ──────────────────────────────────────────────────────────────
export const clsx = (...classes) => classes.filter(Boolean).join(' ')

export const debounce = (fn, ms) => {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}
