'use client'
import { useState } from 'react'
import Toast from '@/components/ui/Toast'

export default function SettingsPage() {
  const [toast, setToast] = useState<any>(null)
  const [intervals, setIntervals] = useState({ Bike:'45', Car:'75', 'Heavy Vehicle':'30' })
  const [garage, setGarage] = useState({
    name: 'Moto Care Pro', owner: 'Karthikeyan R', phone: '9876543210',
    address: 'Anna Nagar, Chennai - 600040', gst: '33AABCP1234Q1ZX', email: 'motocarpro@gmail.com',
  })

  function save() { setToast({msg:'Settings saved successfully!', type:'success'}) }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Settings</div>
        <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Garage info · Service intervals · User roles</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Garage info */}
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:16 }}>🏢 Garage Information</div>
          {([
            ['Garage Name','name','Moto Care Pro'],
            ['Owner Name','owner','Full name'],
            ['Phone','phone','9876543210'],
            ['Address','address','Street, City'],
            ['GST Number','gst','33AABCP1234Q1ZX'],
            ['Email','email','email@example.com'],
          ] as [string,string,string][]).map(([l,k,ph]) => (
            <div key={k} style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{l}</label>
              <input className="mc-input" value={garage[k as keyof typeof garage]} onChange={e => setGarage(p=>({...p,[k]:e.target.value}))} placeholder={ph} />
            </div>
          ))}
        </div>

        <div>
          {/* Intervals */}
          <div className="mc-card" style={{ marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:8 }}>⏱ Service Interval Settings</div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:14 }}>Auto-calculate next service date based on vehicle type</div>
            {Object.entries(intervals).map(([type,days]) => (
              <div key={type} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{type} (days)</label>
                <input type="number" className="mc-input" value={days} onChange={e => setIntervals(p=>({...p,[type]:e.target.value}))} />
              </div>
            ))}
            <div style={{ background:'rgba(249,115,22,.05)', border:'1px solid rgba(249,115,22,.15)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#fb923c' }}>
              ⚡ These values control the "Next Service Date" auto-calculation when creating service jobs.
            </div>
          </div>

          {/* Roles */}
          <div className="mc-card">
            <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>👥 User Roles</div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>Configure via Supabase Auth — invite users from your Supabase dashboard and assign roles in the profiles table.</div>
            {[
              ['Admin',           'Full access — all pages, delete, settings',   'paid'     ],
              ['Garage Owner',    'All pages except settings',                   'progress' ],
              ['Senior Mechanic', 'Jobs, inspection, inventory',                 'bike'     ],
              ['Junior Mechanic', 'Jobs and inspection only',                    'pending'  ],
            ].map(([r,d,b]) => (
              <div key={r} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #141926' }}>
                <div>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{r}</div>
                  <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>{d}</div>
                </div>
                <span className={`badge badge-${b}`}>{r.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ marginTop:20 }} onClick={save}>💾 Save All Settings</button>

      {/* Deploy info */}
      <div className="mc-card" style={{ marginTop:24 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>🚀 Deployment Info</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {[
            ['Stack',    'Next.js 14 + Supabase',     '#60a5fa'],
            ['Hosting',  'Vercel (free tier)',         '#4ade80'],
            ['Database', 'Supabase PostgreSQL',        '#fbbf24'],
            ['Auth',     'Supabase Auth',              '#c084fc'],
            ['WhatsApp', 'wa.me deep links',           '#4ade80'],
            ['Export',   'CSV / Excel coming soon',    '#9ca3af'],
          ].map(([k,v,c]) => (
            <div key={k} style={{ background:'#0a0c10', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:12, color:c, fontWeight:600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
