'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const CHECKS = [
  { key:'brakes',    label:'Brake System'           },
  { key:'oil',       label:'Engine Oil Level'        },
  { key:'filters',   label:'Air / Oil Filters'       },
  { key:'tyres',     label:'Tyre Pressure & Wear'    },
  { key:'lights',    label:'Head / Tail Lights'      },
  { key:'battery',   label:'Battery Condition'       },
  { key:'coolant',   label:'Coolant / Radiator'      },
  { key:'clutch',    label:'Clutch & Gearbox'        },
  { key:'suspension',label:'Suspension & Steering'   },
  { key:'belts',     label:'Drive Belts / Chain'     },
  { key:'wipers',    label:'Wipers / Fluids'         },
  { key:'body',      label:'Body & Underbody'        },
]

const EMPTY_FORM = {
  customer_name:'', vehicle_number:'', vehicle_type:'Bike',
  mechanic:'', inspection_date: new Date().toISOString().split('T')[0], notes:'',
}

export default function InspectionPage() {
  const [form,    setForm]    = useState<any>(EMPTY_FORM)
  const [checks,  setChecks]  = useState<Record<string,string>>({})
  const [mechs,   setMechs]   = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [toast,   setToast]   = useState<any>(null)
  const [saving,  setSaving]  = useState(false)
  const [tab,     setTab]     = useState<'new'|'history'>('new')

  const loadMechs = useCallback(async () => {
    const { data } = await supabase.from('mechanics').select('id,name').eq('active',true)
    setMechs(data ?? [])
  }, [])

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from('inspections').select('*').order('created_at',{ascending:false}).limit(20)
    setHistory(data ?? [])
  }, [])

  useEffect(() => { loadMechs(); loadHistory() }, [loadMechs, loadHistory])

  function setCheck(k:string, v:string) {
    setChecks(p => ({ ...p, [k]: p[k]===v ? '' : v }))
  }

  const goodCount = Object.values(checks).filter(v=>v==='good').length
  const okCount   = Object.values(checks).filter(v=>v==='ok').length
  const badCount  = Object.values(checks).filter(v=>v==='bad').length
  const overall   = badCount > 2 ? 'Critical' : badCount > 0 || okCount > 2 ? 'Needs Attention' : goodCount > 0 ? 'Good' : 'Pending'

  async function save() {
    if (!form.customer_name || !form.vehicle_number) {
      setToast({msg:'Customer name and vehicle number required.',type:'error'}); return
    }
    setSaving(true)
    const { error } = await supabase.from('inspections').insert({
      customer_name:   form.customer_name,
      vehicle_number:  form.vehicle_number.toUpperCase(),
      vehicle_type:    form.vehicle_type,
      mechanic:        form.mechanic,
      inspection_date: form.inspection_date,
      checks,
      overall_status:  overall,
      notes:           form.notes,
    })
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg:'Inspection saved!', type:'success'})
    setForm(EMPTY_FORM); setChecks({})
    loadHistory(); setTab('history')
  }

  function F(k:string) { return (v:string) => setForm((p:any)=>({...p,[k]:v})) }

  const statusColor = {
  Good: '#4ade80',
  'Needs Attention': '#fbbf24',
  Critical: '#f87171',
  Pending: '#6b7280'
}

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Vehicle Inspection</div>
        <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Complete pre-service checklist · Saved to database</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[{k:'new',l:'🔍 New Inspection'},{k:'history',l:'📋 History'}].map(({k,l})=>(
          <button key={k} onClick={() => setTab(k as any)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background: tab===k ? '#f97316' : 'none', color: tab===k ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {l}
          </button>
        ))}
      </div>

      {tab==='new' && (
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:18 }}>
          {/* Checklist */}
          <div className="mc-card">
            <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:16 }}>Inspection Checklist</div>
            {CHECKS.map(c => (
              <div key={c.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:'#0a0c10', border:'1px solid #141926', borderRadius:8, marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#c4ccd8', fontWeight:500 }}>{c.label}</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button className={`check-btn good${checks[c.key]==='good'?' sel':''}`} onClick={() => setCheck(c.key,'good')}>✓ Good</button>
                  <button className={`check-btn ok${checks[c.key]==='ok'?' sel':''}`}     onClick={() => setCheck(c.key,'ok')}>~ OK</button>
                  <button className={`check-btn bad${checks[c.key]==='bad'?' sel':''}`}   onClick={() => setCheck(c.key,'bad')}>✗ Bad</button>
                </div>
              </div>
            ))}
          </div>

          {/* Details + summary */}
          <div>
            <div className="mc-card" style={{ marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>Vehicle Details</div>
              {[
                ['Customer Name *','customer_name','text','Customer name'],
                ['Vehicle Number *','vehicle_number','text','TN01AB1234'],
                ['Inspection Date','inspection_date','date',''],
              ].map(([l,k,t,ph]) => (
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{l}</label>
                  <input type={t} className="mc-input" value={form[k]} onChange={e => F(k)(e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Vehicle Type</label>
                <select className="mc-select" value={form.vehicle_type} onChange={e => F('vehicle_type')(e.target.value)}>
                  {['Bike','Car','Heavy Vehicle'].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Mechanic</label>
                <select className="mc-select" value={form.mechanic} onChange={e => F('mechanic')(e.target.value)}>
                  <option value="">— Select —</option>
                  {mechs.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Notes</label>
                <textarea className="mc-input" rows={3} value={form.notes} onChange={e => F('notes')(e.target.value)} placeholder="Recommendations, observations..." style={{ resize:'vertical' }} />
              </div>
            </div>

            <div className="mc-card">
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>Summary</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                {[
  ['Good', '#22c55e', goodCount],
  ['Needs Attn', '#fbbf24', okCount],
  ['Issues', '#f87171', badCount]
].map(([label, color, n], i) => (
                  <div key={l} style={{ background: `${color}14`, border: `1px solid ${color}33`, borderRadius:8, padding:12, textAlign:'center' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:tc, fontFamily:"'Syne',sans-serif" }}>{String(n)}</div>
                    <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(255,255,255,.03)', border:'1px solid #1e2535', fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <span style={{ color:'#9ca3af' }}>Overall Status</span>
                <span style={{ fontWeight:700, color:(statusColor as any)[overall]||'#6b7280' }}>{overall}</span>
              </div>
              <button className="btn-primary" style={{ width:'100%' }} onClick={save} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Inspection Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab==='history' && (
        <div className="mc-card" style={{ padding:0 }}>
          <table className="mc-table">
            <thead><tr>{['Date','Customer','Vehicle','Mechanic','Good','Issues','Overall','Notes'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#374151', padding:30 }}>No inspections yet.</td></tr>
              ) : history.map(r => {
                const ch = r.checks || {}
                const gc = Object.values(ch).filter(v=>v==='good').length
                const bc = Object.values(ch).filter(v=>v==='bad').length
                return (
                  <tr key={r.id}>
                    <td>{r.inspection_date}</td>
                    <td><strong>{r.customer_name}</strong></td>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#f97316' }}>{r.vehicle_number}</span></td>
                    <td style={{ color:'#9ca3af' }}>{r.mechanic||'—'}</td>
                    <td><span style={{ color:'#4ade80', fontWeight:600 }}>{gc}</span></td>
                    <td><span style={{ color: bc>0?'#f87171':'#4ade80', fontWeight:600 }}>{bc}</span></td>
                    <td><span style={{ color:(statusColor as any)[r.overall_status]||'#6b7280', fontWeight:600, fontSize:12 }}>{r.overall_status}</span></td>
                    <td style={{ color:'#6b7280', fontSize:12 }}>{r.notes||'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
