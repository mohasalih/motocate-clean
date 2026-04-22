'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#07080a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', overflow: 'hidden',
    }}>
      {/* Ripple rings */}
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="splash-ring" style={{
          width: i * 140, height: i * 140,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}

      {/* Gears */}
      <div style={{
        position: 'relative', marginBottom: 20, zIndex: 1,
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity .8s',
        filter: 'drop-shadow(0 0 24px rgba(249,115,22,.6))',
      }}>
        <span className="animate-spin-gear" style={{ fontSize: 72, display: 'block' }}>⚙️</span>
        <span className="animate-spin-back" style={{ fontSize: 26, position: 'absolute', top: -6, right: -22 }}>⚙️</span>
        <span className="animate-spin-gear" style={{ fontSize: 20, position: 'absolute', bottom: 0,  left: -26, animationDuration: '8s' }}>⚙️</span>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 900,
        background: 'linear-gradient(135deg,#f97316,#fbbf24,#f97316)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: -1,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all .8s',
      }}>
        MOTO CARE PRO
      </div>

      <div style={{
        color: '#4b5563', fontSize: 12, letterSpacing: 4,
        textTransform: 'uppercase', marginTop: 6,
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity .8s .1s',
      }}>
        Garage Management System
      </div>

      {/* CTA */}
      <button
        className="btn-primary animate-glow"
        onClick={() => router.push('/dashboard')}
        style={{
          marginTop: 48, padding: '14px 52px', borderRadius: 50,
          fontSize: 15, letterSpacing: 2, textTransform: 'uppercase',
          opacity: phase >= 3 ? 1 : 0, transition: 'opacity .8s',
        }}
      >
        ▶ START ENGINE
      </button>

      {/* Version */}
      <div style={{ position: 'absolute', bottom: 24, fontSize: 11, color: '#374151', letterSpacing: 1 }}>
        v2.0 — Next.js + Supabase
      </div>
    </div>
  )
}
