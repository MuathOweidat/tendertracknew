import React from 'react'
export default function AppSkeleton() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <div style={{ width:220, background:'#0f2d56', flexShrink:0 }} />
      <div style={{ flex:1, padding:24 }}>
        <div style={{ height:56, background:'#fff', borderBottom:'1px solid #e2e8f0', marginBottom:24 }} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height:90, borderRadius:16, background:'#fff', border:'1px solid #e2e8f0', overflow:'hidden', position:'relative' }}>
              <div className="skeleton-line" style={{ position:'absolute', inset:0, height:'100%', borderRadius:0 }} />
            </div>
          ))}
        </div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="skeleton-line" style={{ height:52, marginBottom:8, borderRadius:8 }} />
        ))}
      </div>
    </div>
  )
}
