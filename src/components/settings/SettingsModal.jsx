import React, { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { supabase } from '../../lib/supabase'
import MigrationTool from './MigrationTool'

const TABS = [
  { id:'profile',   label:'👤 Profile'    },
  { id:'kpi',       label:'🎯 KPI Targets'},
  { id:'team',      label:'👥 Team'       },
  { id:'migrate',   label:'🔄 Migrate v6' },
  { id:'data',      label:'💾 Data'       },
  { id:'about',     label:'ℹ️ About'      },
]

export default function SettingsModal({ onClose }) {
  const { kpiTargets, setKpiTargets, tenders, deals, toast } = useAppStore()
  const { user, profile } = useAuth()
  const perms = usePermissions()
  const [tab,      setTab]      = useState('profile')
  const [kpi,      setKpi]      = useState({ ...kpiTargets })
  const [saving,   setSaving]   = useState(false)
  const [showMigrate, setShowMigrate] = useState(false)

  const saveKpi = async () => {
    setSaving(true)
    setKpiTargets(kpi)
    if (user) await supabase.from('user_settings').upsert({ user_id: user.id, kpi_targets: kpi })
    setSaving(false)
    toast('KPI targets saved')
  }

  const allInvs = (deals||[]).flatMap(d=>d.invoices||[])
  const lbl = txt => <label style={{fontSize:10.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:5}}>{txt}</label>
  const numInp = (key, label, min, max) => (
    <div key={key}>
      {lbl(label)}
      <input className="inp-base" type="number" min={min} max={max} value={kpi[key]||''} onChange={e=>setKpi(p=>({...p,[key]:Number(e.target.value)}))} />
    </div>
  )

  return (
    <>
      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
        <div className="modal-box" style={{width:'min(680px,96vw)',maxHeight:'88vh'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border-l)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{fontSize:17,fontWeight:800,color:'var(--text)'}}>⚙️ Settings</div>
            <button onClick={onClose} style={{background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:16,color:'var(--text-3)'}}>×</button>
          </div>
          <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>
            {/* Tab list */}
            <div style={{width:160,borderRight:'1px solid var(--border-l)',background:'var(--surface-2)',padding:8,flexShrink:0,overflowY:'auto'}}>
              {TABS.filter(t=>t.id==='team'?perms.canManageSettings:true).map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{width:'100%',padding:'9px 10px',borderRadius:8,border:'none',background:tab===t.id?'var(--surface)':'transparent',color:tab===t.id?'var(--blue)':'var(--text-3)',fontFamily:'inherit',fontSize:12.5,fontWeight:tab===t.id?700:500,cursor:'pointer',textAlign:'left',transition:'all .15s',display:'block',boxShadow:tab===t.id?'var(--sh-sm)':'none',marginBottom:2}}>{t.label}</button>
              ))}
            </div>

            {/* Content */}
            <div style={{flex:1,overflowY:'auto',padding:'20px 22px'}}>

              {/* PROFILE */}
              {tab==='profile'&&(
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:16}}>Account</div>
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:16,background:'var(--surface-2)',borderRadius:12,border:'1px solid var(--border-l)',marginBottom:16}}>
                    <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,var(--blue),var(--blue-d))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',flexShrink:0}}>{(profile?.full_name||user?.email||'?')[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{profile?.full_name||'Team Member'}</div>
                      <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{user?.email}</div>
                      <div style={{display:'inline-block',marginTop:4,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:perms.isAdmin?'var(--purple-l)':perms.isManager?'var(--blue-l)':'var(--surface-3)',color:perms.isAdmin?'var(--purple)':perms.isManager?'var(--blue)':'var(--text-3)',border:`1px solid ${perms.isAdmin?'var(--purple-b)':perms.isManager?'var(--blue-ll)':'var(--border)'}`}}>
                        {perms.role}
                      </div>
                    </div>
                  </div>
                  <div style={{background:'var(--surface-2)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--border-l)',marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--text)',marginBottom:4}}>Your Permissions</div>
                    {[
                      {l:'View tenders & deals',v:true},
                      {l:'Create & edit tenders',v:perms.canCreateTender},
                      {l:'Delete tenders',v:perms.canBulkEdit},
                      {l:'Import from Excel/CSV',v:perms.canImport},
                      {l:'Manage team settings',v:perms.canManageSettings},
                    ].map(p=>(
                      <div key={p.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--border-l)',fontSize:12}}>
                        <span style={{color:'var(--text-2)'}}>{p.l}</span>
                        <span style={{fontWeight:700,color:p.v?'var(--success)':'var(--text-4)'}}>{p.v?'✓':'✗'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI */}
              {tab==='kpi'&&(
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:4}}>KPI Targets</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20}}>Set goals tracked in the Analytics page.</div>
                  <div className="form-grid">
                    {numInp('winRate',      'Win Rate Target (%)',   0, 100)}
                    {numInp('totalWon',     'Total Won Target',      0, 9999)}
                    {numInp('pipelineValue','Pipeline Value (KWD)',  0, 99999999)}
                    {numInp('activeCount',  'Active Tenders Target', 0, 9999)}
                  </div>
                  <div style={{marginTop:20}}><button className="btn btn-primary btn-sm" onClick={saveKpi} disabled={saving}>{saving?'…':'Save KPI Targets'}</button></div>
                </div>
              )}

              {/* TEAM (admin only) */}
              {tab==='team'&&perms.canManageSettings&&(
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:4}}>Team & Roles</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20}}>Manage team member access levels.</div>
                  <div style={{background:'var(--info-l)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--info-b)',marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--info)',marginBottom:4}}>Role Hierarchy</div>
                    {[
                      {r:'admin',   d:'Full access — manage team, delete anything, all settings'},
                      {r:'manager', d:'Create & edit tenders, import data, view analytics'},
                      {r:'viewer',  d:'Read-only — view tenders and reports, no edits'},
                    ].map(rr=>(
                      <div key={rr.r} style={{marginBottom:6}}>
                        <span style={{fontSize:11,fontWeight:800,color:'var(--info)'}}>{rr.r.toUpperCase()}</span>
                        <span style={{fontSize:11,color:'var(--info)',marginLeft:8,opacity:.8}}>— {rr.d}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'var(--surface-2)',borderRadius:10,padding:'14px',border:'1px solid var(--border-l)',fontSize:12.5,color:'var(--text-2)',lineHeight:1.7}}>
                    To change a team member's role, update their <code style={{fontFamily:'var(--mono)',background:'var(--surface-3)',padding:'1px 4px',borderRadius:4}}>role</code> column in Supabase:<br/><br/>
                    <code style={{fontFamily:'var(--mono)',fontSize:11.5,display:'block',background:'#0f172a',color:'#a5f3fc',padding:'10px 12px',borderRadius:8,lineHeight:1.8}}>
                      UPDATE profiles SET role = 'manager'<br/>
                      WHERE email = 'user@aims.com.kw';
                    </code>
                  </div>
                </div>
              )}

              {/* MIGRATE */}
              {tab==='migrate'&&(
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:4}}>Migrate from v6</div>
                  <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20}}>Import your data from the old single-file TenderTrack app into Supabase.</div>
                  <div style={{background:'var(--surface-2)',borderRadius:12,padding:20,border:'1px solid var(--border-l)',textAlign:'center'}}>
                    <div style={{fontSize:32,marginBottom:12}}>🔄</div>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:6}}>Ready to migrate</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginBottom:20,lineHeight:1.6}}>Copy your data from the old app's browser storage and import it here. All tenders and deals will be preserved.</div>
                    <button className="btn btn-primary" onClick={()=>setShowMigrate(true)}>
                      🔄 Open Migration Wizard
                    </button>
                  </div>
                </div>
              )}

              {/* DATA */}
              {tab==='data'&&(
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:16}}>Data Summary</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                    {[{l:'Tenders',v:tenders.length},{l:'Deals',v:(deals||[]).length},{l:'Invoices',v:allInvs.length}].map(k=>(
                      <div key={k.l} style={{background:'var(--surface-2)',borderRadius:10,padding:12,border:'1px solid var(--border-l)',textAlign:'center'}}>
                        <div style={{fontSize:9.5,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{k.l}</div>
                        <div style={{fontSize:24,fontWeight:850,color:'var(--text)',letterSpacing:'-.04em'}}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'var(--surface-2)',borderRadius:12,padding:16,border:'1px solid var(--border-l)',marginBottom:14}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:4}}>Export All Data</div>
                    <div style={{fontSize:12,color:'var(--text-3)',marginBottom:12}}>Download complete dataset as JSON backup.</div>
                    <button className="btn btn-ghost btn-sm" onClick={()=>{
                      const data={tenders,deals,exportedAt:new Date().toISOString(),version:'2.0'}
                      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
                      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`tendertrack_backup_${new Date().toISOString().split('T')[0]}.json`;a.click()
                    }}>📥 Download JSON Backup</button>
                  </div>
                  <div style={{background:'var(--info-l)',borderRadius:12,padding:'14px 16px',border:'1px solid var(--info-b)'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--info)',marginBottom:4}}>☁️ Cloud Storage Active</div>
                    <div style={{fontSize:12,color:'var(--info)',opacity:.85,lineHeight:1.6}}>All data is stored in Supabase PostgreSQL and synced in real-time. Realtime collaboration is enabled.</div>
                  </div>
                </div>
              )}

              {/* ABOUT */}
              {tab==='about'&&(
                <div style={{textAlign:'center',paddingTop:20}}>
                  <div style={{fontSize:40,marginBottom:12}}>📋</div>
                  <div style={{fontSize:22,fontWeight:900,color:'var(--text)',letterSpacing:'-.04em',marginBottom:4}}>TenderTrack</div>
                  <div style={{fontSize:13,color:'var(--text-3)',marginBottom:24}}>AIMS Bid Management System · v2.0</div>
                  {[
                    {l:'Framework',  v:'React 18 + Vite'},
                    {l:'Database',   v:'Supabase (PostgreSQL)'},
                    {l:'Realtime',   v:'Supabase Realtime'},
                    {l:'Auth',       v:'Supabase Auth'},
                    {l:'State',      v:'Zustand'},
                  ].map(r=>(
                    <div key={r.l} style={{display:'flex',justifyContent:'center',gap:12,fontSize:12,marginBottom:6}}>
                      <span style={{color:'var(--text-3)',width:100,textAlign:'right'}}>{r.l}:</span>
                      <span style={{color:'var(--text-2)',fontWeight:600}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMigrate && <MigrationTool onClose={()=>setShowMigrate(false)} />}
    </>
  )
}
