import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'

export default function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth()
  const location = useLocation()

  // mode: 'signin' | 'signup' | 'forgot' | 'reset'
  const [mode,     setMode]     = useState(() => new URLSearchParams(location.search).get('reset') ? 'reset' : 'signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [password2,setPassword2]= useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const switchMode = m => { setMode(m); setError(''); setSuccess('') }

  const handle = async e => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        if (password !== password2) throw new Error('Passwords do not match')
        if (password.length < 6)    throw new Error('Password must be at least 6 characters')
        await signUp(email, password, name)
        setSuccess('Account created! Check your email to confirm, then sign in.')
        switchMode('signin')
      } else if (mode === 'forgot') {
        await resetPassword(email)
        setSuccess('Password reset email sent — check your inbox.')
      } else if (mode === 'reset') {
        if (password !== password2) throw new Error('Passwords do not match')
        if (password.length < 6)    throw new Error('Password must be at least 6 characters')
        await updatePassword(password)
        setSuccess('Password updated successfully.')
        switchMode('signin')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const titles = {
    signin: { h: 'Welcome back',          sub: 'Sign in to your workspace' },
    signup: { h: 'Create account',        sub: 'Join your team on TenderTrack' },
    forgot: { h: 'Reset your password',   sub: "We'll send you a reset link" },
    reset:  { h: 'Set new password',      sub: 'Choose a strong password' },
  }
  const { h, sub } = titles[mode]

  const lbl = txt => (
    <label style={{ display:'block', fontSize:10.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>
      {txt}
    </label>
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'#0f2d56', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 14px', boxShadow:'0 4px 14px rgba(15,45,86,.35)' }}>
            📋
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-.04em', marginBottom:4 }}>TenderTrack</h1>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>AIMS Bid Management System</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:'32px 28px' }}>
          <div style={{ marginBottom:22 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{h}</h2>
            <p style={{ fontSize:13, color:'var(--text-3)' }}>{sub}</p>
          </div>

          <form onSubmit={handle}>
            {mode === 'signup' && (
              <div style={{ marginBottom:14 }}>
                {lbl('Full Name')}
                <input className="inp-base" type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required />
              </div>
            )}

            {(mode !== 'reset') && (
              <div style={{ marginBottom:14 }}>
                {lbl('Work Email')}
                <input className="inp-base" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@aims.com.kw" required autoComplete="email" />
              </div>
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div style={{ marginBottom:14 }}>
                {lbl(mode === 'reset' ? 'New Password' : 'Password')}
                <input className="inp-base" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete={mode==='signin'?'current-password':'new-password'} />
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div style={{ marginBottom:16 }}>
                {lbl('Confirm Password')}
                <input className="inp-base" type="password" value={password2} onChange={e=>setPassword2(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete="new-password" />
              </div>
            )}

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--danger-l)', border:'1px solid var(--danger-b)', color:'var(--danger)', fontSize:13, marginBottom:14 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--success-l)', border:'1px solid var(--success-b)', color:'var(--success)', fontSize:13, marginBottom:14 }}>
                {success}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={loading}>
              {loading ? '…' : mode==='signin'?'Sign In':mode==='signup'?'Create Account':mode==='forgot'?'Send Reset Email':'Update Password'}
            </button>
          </form>

          {/* Mode switchers */}
          <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
            {mode === 'signin' && (
              <>
                <span style={{ fontSize:13, color:'var(--text-3)' }}>
                  No account?{' '}
                  <button onClick={()=>switchMode('signup')} style={{ background:'none', border:'none', color:'var(--blue)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Sign up</button>
                </span>
                <button onClick={()=>switchMode('forgot')} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', fontSize:12.5 }}>
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'signup' && (
              <span style={{ fontSize:13, color:'var(--text-3)' }}>
                Already have an account?{' '}
                <button onClick={()=>switchMode('signin')} style={{ background:'none', border:'none', color:'var(--blue)', fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Sign in</button>
              </span>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button onClick={()=>switchMode('signin')} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontFamily:'inherit', fontSize:12.5 }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:11, color:'var(--text-4)', marginTop:20 }}>
          © {new Date().getFullYear()} AIMS Kuwait · TenderTrack v2
        </p>
      </div>
    </div>
  )
}
