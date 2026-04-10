// ── Tender constants ──────────────────────────────────────────────────────────
export const STATUSES = [
  'Pending','Purchased','Submitted','Under Review','Won','Lost',
  'Lowest Price','Covering Participation','Canceled','Canceled by Client',
  'Purchased - No Bid','Reschedule',
]

export const DEPTS = ['AIMS-Projects','AIMS-Consultations','AIMS-Sales','Plexus']

export const TENDER_TYPES = [
  'Tender (مناقصة)','Practice (ممارسة)','RFQ (طلب شراء)',
  'Bidding (مزايدة)','Quotation (استدراج)','Direct (مباشر)',
  'Framework','International',
]

export const CURRENCIES = ['KWD','USD','EUR','GBP','SAR','AED']
export const PRIORITIES  = ['High','Medium','Low']

export const CLOSED_S  = ['Won','Lost','Canceled','Canceled by Client','Purchased - No Bid']
export const ACTIVE_S  = ['Pending','Purchased','Submitted','Under Review','Lowest Price','Covering Participation']

export const BB_STATUS = [
  'Active','Extended','Cancel Required','Performance Bond Required',
  'Released','Forfeited','N/A',
]

export const BB_ALERTS = {
  Lost:                 { action:'cancel',  msg:'Bid Bond should be CANCELLED — tender was lost.',      color:'#dc2626', bg:'#fee2e2', border:'#fca5a5' },
  Canceled:             { action:'cancel',  msg:'Bid Bond should be CANCELLED — tender was canceled.',   color:'#dc2626', bg:'#fee2e2', border:'#fca5a5' },
  'Canceled by Client': { action:'cancel',  msg:'Bid Bond should be CANCELLED — canceled by client.',   color:'#dc2626', bg:'#fee2e2', border:'#fca5a5' },
  'Purchased - No Bid': { action:'cancel',  msg:'Bid Bond should be CANCELLED — no bid submitted.',     color:'#dc2626', bg:'#fee2e2', border:'#fca5a5' },
  Won:                  { action:'perform', msg:'Issue PERFORMANCE BOND — tender was won!',              color:'#065f46', bg:'#d1fae5', border:'#6ee7b7' },
  Reschedule:           { action:'extend',  msg:'Consider EXTENDING Bid Bond — tender was rescheduled.', color:'#92400e', bg:'#fef3c7', border:'#fcd34d' },
  'Lowest Price':       { action:'extend',  msg:'Bid Bond may need EXTENSION — awaiting award decision.', color:'#1d4ed8', bg:'#dbeafe', border:'#93c5fd' },
  'Covering Participation': { action:'extend', msg:'Bid Bond may need EXTENSION — participation only.', color:'#5b21b6', bg:'#ede9fe', border:'#c4b5fd' },
}

export const STATUS_COLORS = {
  Submitted:              { color:'#0369a1', light:'#e0f2fe', dot:'#0ea5e9', border:'#7dd3fc' },
  'Under Review':         { color:'#92400e', light:'#fef3c7', dot:'#f59e0b', border:'#fcd34d' },
  Won:                    { color:'#065f46', light:'#d1fae5', dot:'#10b981', border:'#6ee7b7', shadow:'0 0 0 3px #d1fae5' },
  Lost:                   { color:'#991b1b', light:'#fee2e2', dot:'#ef4444', border:'#fca5a5', shadow:'0 0 0 3px #fee2e2' },
  'Lowest Price':         { color:'#1d4ed8', light:'#dbeafe', dot:'#3b82f6', border:'#93c5fd' },
  'Covering Participation': { color:'#5b21b6', light:'#ede9fe', dot:'#8b5cf6', border:'#c4b5fd' },
  Purchased:              { color:'#0e4fa8', light:'#dbeafe', dot:'#3b82f6', border:'#93c5fd' },
  'Purchased - No Bid':   { color:'#5b21b6', light:'#ede9fe', dot:'#8b5cf6', border:'#c4b5fd' },
  Canceled:               { color:'#64748b', light:'#f1f5f9', dot:'#94a3b8', border:'#cbd5e1' },
  'Canceled by Client':   { color:'#7c3aed', light:'#f5f3ff', dot:'#a78bfa', border:'#ddd6fe' },
  Reschedule:             { color:'#854d0e', light:'#fef9c3', dot:'#ca8a04', border:'#fde047' },
  Pending:                { color:'#475569', light:'#f8fafc', dot:'#94a3b8', border:'#e2e8f0' },
}

export const DEPT_COLORS = {
  'AIMS-Projects':      { color:'#1d4ed8', bg:'#dbeafe' },
  'AIMS-Consultations': { color:'#065f46', bg:'#d1fae5' },
  'AIMS-Sales':         { color:'#92400e', bg:'#fef3c7' },
  Plexus:               { color:'#5b21b6', bg:'#ede9fe' },
}

export const PRIORITY_COLORS = {
  High:   { color:'#dc2626', bg:'#fee2e2', border:'#fca5a5' },
  Medium: { color:'#d97706', bg:'#fef3c7', border:'#fcd34d' },
  Low:    { color:'#059669', bg:'#d1fae5', border:'#6ee7b7' },
}

export const ACCT_MANAGERS = ['','Tarek','Sona','Sakher','Aws','Mahmoud']
export const OPP_OWNERS    = ['','Shady','Aaseim','Tamer','Nadeem','Rawan','Muath','Sonill']

export const LOSS_REASONS = [
  'Price too high','Technical non-compliance','Bid bond issue',
  'Late submission','Scope mismatch','Competitor advantage',
  'Client relationship','Other',
]

export const COMMON_TAGS = [
  'Oracle','SAP','Fortinet','Microsoft','Renewal','Hardware',
  'Software','Support','Training','Urgent','Key Account',
]

// ── Deal / Invoice constants ──────────────────────────────────────────────────
export const DEAL_STATUSES = [
  'Prospecting','Proposal Sent','Negotiation','Won',
  'Active','Renewal Due','On Hold','Completed','Lost',
]

export const DEAL_STATUS_COLORS = {
  Prospecting:     { bg:'#e0f2fe', color:'#0369a1', border:'#7dd3fc', dot:'#0ea5e9' },
  'Proposal Sent': { bg:'#fef3c7', color:'#92400e', border:'#fcd34d', dot:'#f59e0b' },
  Negotiation:     { bg:'#fde8ff', color:'#7e22ce', border:'#e879f9', dot:'#d946ef' },
  Won:             { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7', dot:'#10b981' },
  Active:          { bg:'#dbeafe', color:'#1e40af', border:'#93c5fd', dot:'#3b82f6' },
  'Renewal Due':   { bg:'#fff7ed', color:'#c2410c', border:'#fdba74', dot:'#f97316' },
  'On Hold':       { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1', dot:'#94a3b8' },
  Completed:       { bg:'#e0e7ff', color:'#3730a3', border:'#a5b4fc', dot:'#6366f1' },
  Lost:            { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', dot:'#ef4444' },
}

export const DEAL_TYPES = [
  'Direct Contract','Framework Agreement','Retainer','Managed Services',
  'Consultancy','Software License','Hardware Supply','Annual Maintenance',
]

export const DEAL_PIPELINE = ['Prospecting','Proposal Sent','Negotiation','Won','Active','Renewal Due']
export const DEAL_CLOSED   = ['Completed','Lost','On Hold']

export const INV_STATUSES = ['Draft','Sent','Partially Paid','Paid','Overdue','Cancelled']

export const INV_STATUS_COLORS = {
  Draft:            { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1', dot:'#94a3b8' },
  Sent:             { bg:'#e0f2fe', color:'#0369a1', border:'#7dd3fc', dot:'#0ea5e9' },
  'Partially Paid': { bg:'#fef3c7', color:'#92400e', border:'#fcd34d', dot:'#f59e0b' },
  Paid:             { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7', dot:'#10b981' },
  Overdue:          { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', dot:'#ef4444' },
  Cancelled:        { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1', dot:'#94a3b8' },
}

// ── "New" tender threshold ────────────────────────────────────────────────────
export const NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

// ── Bid Bond status colors ────────────────────────────────────────────────────
export const BB_STATUS_COLORS = {
  Active:                       { bg:'#dbeafe', color:'#1e40af', border:'#93c5fd' },
  Extended:                     { bg:'#fef3c7', color:'#92400e', border:'#fcd34d' },
  'Cancel Required':            { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
  'Performance Bond Required':  { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7' },
  Released:                     { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' },
  Forfeited:                    { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
  'N/A':                        { bg:'#f1f5f9', color:'#94a3b8', border:'#e2e8f0' },
}
