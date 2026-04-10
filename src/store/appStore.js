import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { dbToTender, tenderToDb, dbToDeal, dealToDb, dbToInvoice, invoiceToDb, today, tStr } from '../lib/utils'
import { genId, genDealId, genInvId } from '../lib/utils'

export const useAppStore = create((set, get) => ({
  // ── Auth ───────────────────────────────────────────────────────────────────
  user:    null,
  profile: null,
  setUser:    user    => set({ user }),
  setProfile: profile => set({ profile }),

  // ── UI ─────────────────────────────────────────────────────────────────────
  sidebarCollapsed: false,
  darkMode:         (() => { try { return localStorage.getItem('tt-dark')==='1' } catch { return false } })(),
  spotlight:        false,
  showNew:          false,
  showSettings:     false,
  showDataMgmt:     false,
  showNotifs:       false,
  showKpiEdit:      false,

  toggleSidebar: () => set(s => {
    const v = !s.sidebarCollapsed
    try { localStorage.setItem('tt-sidebar', v?'1':'0') } catch {}
    return { sidebarCollapsed: v }
  }),
  toggleDark: () => set(s => {
    const v = !s.darkMode
    try { localStorage.setItem('tt-dark', v?'1':'0') } catch {}
    document.documentElement.classList.toggle('dark', v)
    return { darkMode: v }
  }),
  setSpotlight:    v => set({ spotlight: v }),
  setShowNew:      v => set({ showNew: v }),
  setShowSettings: v => set({ showSettings: v }),
  setShowDataMgmt: v => set({ showDataMgmt: v }),
  setShowNotifs:   v => set({ showNotifs: v }),
  setShowKpiEdit:  v => set({ showKpiEdit: v }),

  // ── Toasts ─────────────────────────────────────────────────────────────────
  toasts: [],
  toast: (msg, type = '') => {
    const id = Date.now() + Math.random()
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
  },

  // ── KPI ────────────────────────────────────────────────────────────────────
  kpiTargets: { winRate:50, totalWon:10, pipelineValue:500000, activeCount:20 },
  setKpiTargets: kpiTargets => set({ kpiTargets }),

  // ── Activity log ───────────────────────────────────────────────────────────
  log: [],
  addLog: (icon, msg, entityType, entityId) => {
    const entry = { icon, msg, time: tStr(), entityType, entityId }
    set(s => ({ log: [entry, ...s.log].slice(0, 100) }))
    // Persist to Supabase asynchronously
    const uid = get().user?.id
    if (uid) {
      supabase.from('activity_log').insert([{
        user_id: uid, icon, message: msg, entity_type: entityType, entity_id: entityId,
      }]).then(() => {})
    }
  },

  // ── Notifications (computed from tenders) ──────────────────────────────────
  get notifications() {
    const tenders = get().tenders
    const notifs = []
    const now = new Date()
    tenders.forEach(t => {
      if (!t.closingDate) return
      const d = Math.ceil((new Date(t.closingDate + 'T00:00:00') - now) / 86400000)
      const closed = ['Won','Lost','Canceled','Canceled by Client','Purchased - No Bid'].includes(t.status)
      if (closed) return
      if (d < 0)  notifs.push({ id:`ov-${t.id}`, type:'overdue', tender:t, days: Math.abs(d), label:`${Math.abs(d)}d overdue` })
      else if (d <= 3) notifs.push({ id:`urg-${t.id}`, type:'urgent',  tender:t, days: d, label: d===0?'Due today':`${d}d left` })
      else if (d <= 7) notifs.push({ id:`warn-${t.id}`, type:'warning', tender:t, days: d, label:`${d}d left` })
      // Bond expiry
      const bb = t.bidBond || {}
      if (bb.expiryDate && bb.bbStatus === 'Active') {
        const bd = Math.ceil((new Date(bb.expiryDate+'T00:00:00') - now) / 86400000)
        if (bd >= 0 && bd <= 14) notifs.push({ id:`bb-${t.id}`, type:'bond', tender:t, days:bd, label:`Bond expires in ${bd}d` })
      }
      // Follow-up
      if (t.followUpDate && t.followUpDate <= today()) {
        notifs.push({ id:`fu-${t.id}`, type:'followup', tender:t, days:0, label:'Follow-up due' })
      }
    })
    return notifs.sort((a,b) => a.days - b.days)
  },

  // ── TENDERS ─────────────────────────────────────────────────────────────────
  tenders:        [],
  tendersLoading: false,
  tendersError:   null,
  realtimeChannel: null,

  fetchTenders: async () => {
    set({ tendersLoading: true, tendersError: null })
    try {
      const { data, error } = await supabase
        .from('tenders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      set({ tenders: data.map(dbToTender), tendersLoading: false })
    } catch (e) {
      set({ tendersError: e.message, tendersLoading: false })
      get().toast('Failed to load tenders', 'err')
    }
  },

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  subscribeRealtime: () => {
    // Unsubscribe from any existing channel
    const existing = get().realtimeChannel
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tenders' }, payload => {
        const t = dbToTender(payload.new)
        set(s => {
          if (s.tenders.find(x => x.id === t.id)) return {}
          return { tenders: [t, ...s.tenders] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tenders' }, payload => {
        const t = dbToTender(payload.new)
        set(s => ({ tenders: s.tenders.map(x => x.id === t.id ? t : x) }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tenders' }, payload => {
        set(s => ({ tenders: s.tenders.filter(x => x.id !== payload.old.id) }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deals' }, payload => {
        const d = { ...dbToDeal(payload.new), invoices: [] }
        set(s => {
          if (s.deals.find(x => x.id === d.id)) return {}
          return { deals: [d, ...s.deals] }
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals' }, payload => {
        const d = dbToDeal(payload.new)
        set(s => ({ deals: s.deals.map(x => x.id === d.id ? { ...d, invoices: x.invoices } : x) }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'deals' }, payload => {
        set(s => ({ deals: s.deals.filter(x => x.id !== payload.old.id) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
        if (payload.eventType === 'DELETE') {
          set(s => ({ deals: s.deals.map(d => ({ ...d, invoices: (d.invoices||[]).filter(i => i.id !== payload.old.id) })) }))
        } else {
          const inv = dbToInvoice(payload.new)
          set(s => ({
            deals: s.deals.map(d => {
              if (d.id !== inv.dealId) return d
              const exists = (d.invoices||[]).find(i => i.id === inv.id)
              return { ...d, invoices: exists ? (d.invoices||[]).map(i => i.id===inv.id?inv:i) : [...(d.invoices||[]), inv] }
            })
          }))
        }
      })
      .subscribe()

    set({ realtimeChannel: channel })
    return channel
  },

  unsubscribeRealtime: () => {
    const ch = get().realtimeChannel
    if (ch) { supabase.removeChannel(ch); set({ realtimeChannel: null }) }
  },

  addTender: async t => {
    const id  = t.id || genId()
    const row = tenderToDb({ ...t, id, createdAt: today(), updatedAt: today() })
    row.created_by = get().user?.id ?? null
    const { data, error } = await supabase.from('tenders').insert([row]).select().single()
    if (error) { get().toast('Failed to add tender', 'err'); return null }
    const tender = dbToTender(data)
    set(s => ({ tenders: [tender, ...s.tenders] }))
    get().addLog('➕', `Added: ${tender.tenderName.slice(0,50)}`, 'tender', tender.id)
    get().toast('Tender added')
    return tender
  },

  updateTender: async t => {
    const prev = get().tenders.find(x => x.id === t.id)
    const newHistory = prev && t.status !== prev.status
      ? [...(t.statusHistory||[]), { status: t.status, date: today() }]
      : (t.statusHistory||[])
    const updated = { ...t, statusHistory: newHistory, updatedAt: today() }
    const { data, error } = await supabase.from('tenders').update(tenderToDb(updated)).eq('id', t.id).select().single()
    if (error) { get().toast('Failed to update tender', 'err'); return }
    const tender = dbToTender(data)
    set(s => ({ tenders: s.tenders.map(x => x.id === t.id ? tender : x) }))
    get().addLog('✏️', `Updated: ${tender.tenderName.slice(0,50)}`, 'tender', tender.id)
    get().toast('Saved')
  },

  deleteTender: async id => {
    const t = get().tenders.find(x => x.id === id)
    const { error } = await supabase.from('tenders').delete().eq('id', id)
    if (error) { get().toast('Failed to delete tender', 'err'); return }
    set(s => ({ tenders: s.tenders.filter(x => x.id !== id) }))
    get().addLog('🗑', `Deleted: ${t?.tenderName?.slice(0,50)??id}`, 'tender', id)
    get().toast('Deleted')
  },

  deleteManyTenders: async ids => {
    const { error } = await supabase.from('tenders').delete().in('id', ids)
    if (error) { get().toast('Failed to delete', 'err'); return }
    set(s => ({ tenders: s.tenders.filter(x => !ids.includes(x.id)) }))
    get().addLog('🗑', `Deleted ${ids.length} tenders`)
    get().toast(`${ids.length} tenders deleted`)
  },

  bulkUpdateTenders: async updates => {
    const ids = Object.keys(updates)
    const rows = get().tenders
      .filter(t => ids.includes(t.id))
      .map(t => tenderToDb({ ...t, ...updates[t.id], updatedAt: today() }))
    const { error } = await supabase.from('tenders').upsert(rows)
    if (error) { get().toast('Bulk update failed', 'err'); return }
    set(s => ({ tenders: s.tenders.map(t => ids.includes(t.id) ? { ...t, ...updates[t.id], updatedAt: today() } : t) }))
    get().addLog('✏️', `Bulk edited ${ids.length} tenders`)
    get().toast(`${ids.length} tenders updated`)
  },

  importTenders: async records => {
    const rows = records.map(r => {
      const row = tenderToDb({ ...r, id: r.id||genId(), createdAt: r.createdAt||today(), updatedAt: today() })
      row.created_by = get().user?.id ?? null
      return row
    })
    const { data, error } = await supabase.from('tenders').insert(rows).select()
    if (error) { get().toast('Import failed: ' + error.message, 'err'); return 0 }
    set(s => ({ tenders: [...data.map(dbToTender), ...s.tenders] }))
    get().addLog('📥', `Imported ${data.length} tenders`)
    get().toast(`${data.length} tenders imported`)
    return data.length
  },

  // ── DEALS ───────────────────────────────────────────────────────────────────
  deals:        [],
  dealsLoading: false,

  fetchDeals: async () => {
    set({ dealsLoading: true })
    try {
      const { data, error } = await supabase
        .from('deals').select('*, invoices(*)').order('created_at', { ascending: false })
      if (error) throw error
      set({ deals: data.map(row => ({ ...dbToDeal(row), invoices: (row.invoices||[]).map(dbToInvoice) })), dealsLoading: false })
    } catch (e) {
      set({ dealsLoading: false })
      get().toast('Failed to load deals', 'err')
    }
  },

  addDeal: async deal => {
    const id  = genDealId()
    const row = { ...dealToDb({ ...deal, id }), created_by: get().user?.id ?? null }
    const { data, error } = await supabase.from('deals').insert([row]).select().single()
    if (error) { get().toast('Failed to add deal', 'err'); return null }
    const d = { ...dbToDeal(data), invoices: [] }
    set(s => ({ deals: [d, ...s.deals] }))
    get().addLog('➕', `Deal added: ${d.dealName}`, 'deal', d.id)
    get().toast('Deal added')
    return d
  },

  updateDeal: async deal => {
    const { data, error } = await supabase.from('deals').update(dealToDb(deal)).eq('id', deal.id).select().single()
    if (error) { get().toast('Failed to update deal', 'err'); return }
    const updated = dbToDeal(data)
    set(s => ({ deals: s.deals.map(d => d.id === deal.id ? { ...updated, invoices: d.invoices } : d) }))
    get().toast('Deal saved')
  },

  deleteDeal: async id => {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) { get().toast('Failed to delete deal', 'err'); return }
    set(s => ({ deals: s.deals.filter(d => d.id !== id) }))
    get().toast('Deal deleted')
  },

  // ── INVOICES ─────────────────────────────────────────────────────────────────
  addInvoice: async (dealId, inv) => {
    const id  = genInvId()
    const row = { ...invoiceToDb({ ...inv, id, dealId }), created_by: get().user?.id ?? null }
    const { data, error } = await supabase.from('invoices').insert([row]).select().single()
    if (error) { get().toast('Failed to add invoice', 'err'); return null }
    const invoice = dbToInvoice(data)
    set(s => ({ deals: s.deals.map(d => d.id === dealId ? { ...d, invoices: [...(d.invoices||[]), invoice] } : d) }))
    get().toast('Invoice added')
    return invoice
  },

  updateInvoice: async inv => {
    const { data, error } = await supabase.from('invoices').update(invoiceToDb(inv)).eq('id', inv.id).select().single()
    if (error) { get().toast('Failed to update invoice', 'err'); return }
    const updated = dbToInvoice(data)
    set(s => ({ deals: s.deals.map(d => d.id === inv.dealId ? { ...d, invoices: (d.invoices||[]).map(i => i.id===inv.id?updated:i) } : d) }))
    get().toast('Invoice saved')
  },

  deleteInvoice: async (dealId, invId) => {
    const { error } = await supabase.from('invoices').delete().eq('id', invId)
    if (error) { get().toast('Failed to delete invoice', 'err'); return }
    set(s => ({ deals: s.deals.map(d => d.id === dealId ? { ...d, invoices: (d.invoices||[]).filter(i => i.id !== invId) } : d) }))
    get().toast('Invoice deleted')
  },

  markInvoicePaid: async (dealId, invId) => {
    const deal = get().deals.find(d => d.id === dealId)
    if (!deal) return
    const inv = (deal.invoices||[]).find(i => i.id === invId)
    if (!inv)  return
    await get().updateInvoice({ ...inv, status:'Paid', paidDate: inv.paidDate||today(), paidAmount: inv.paidAmount||inv.amount })
  },

  // ── User settings hydration ───────────────────────────────────────────────
  hydrateUserSettings: async userId => {
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single()
    if (data?.kpi_targets) set({ kpiTargets: data.kpi_targets })
    if (data?.ui_prefs) {
      const p = data.ui_prefs
      set({
        sidebarCollapsed: p.sidebarCollapsed ?? false,
      })
    }
  },
}))
