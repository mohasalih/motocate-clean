'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, formatINR } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

export default function AccountingPage() {
  const [jobs,      setJobs]     = useState<any[]>([])
  const [purchases, setPurchases]= useState<any[]>([])
  const [tab,       setTab]      = useState<'sales'|'purchases'|'profit'>('sales')
  const [toast,     setToast]    = useState<any>(null)
  const [loading,   setLoading]  = useState(true)
  const [pModal,    setPModal]   = useState(false)
  const [pForm,     setPForm]    = useState({ part_name:'', supplier:'', quantity:'1', unit_cost:'', purchase_date: new Date().toISOString().split('T')[0], mechanic:'', notes:'' })
  const [saving,    setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [j, p] = await Promise.all([
      supabase.from('jobs').select('*').order('service_date',{ascending:false}),
      supabase.from('purchases').select('*').order('purchase_date',{ascending:false}),
    ])
    setJobs(j.data ?? [])
    setPurchases(p.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalSales   = jobs.filter(j=>j.status==='Completed').reduce((a:number,b:any) => a+Number(b.estimated_amount),0)
  const totalExp     = purchases.reduce((a:number,b:any) => a+Number(b.total_cost??b.quantity*b.unit_cost),0)
  const profit       = totalSales - totalExp
  const margin       = totalSales > 0 ? ((profit/totalSales)*100).toFixed(1) : '0'

  // Weekly breakdown
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const MOCK  = [12500,18200,9800,22400,31000,45000,8500]
  const MEXPE = [4200, 6100, 3500,8000, 9200,14000,2100]
  const maxVal = Math.max(...MOCK)

  async function savePurchase() {
    if (!pForm.part_name || !pForm.unit_cost) { setToast({msg:'Part name and cost required.',type:'error'}); return }
    setSaving(true)
    const { error } = await supabase.from('purchases').insert({
      part_name:     pForm.part_name,
      supplier:      pForm.supplier,
      quantity:      Number(pForm.quantity)||1,
      unit_cost:     Number(pForm.unit_cost)||0,
      purchase_date: pForm.purchase_date,
      mechanic:      pForm.mechanic,
      notes:         pForm.notes,
    })
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg:'Purchase recorded!',type:'success'})
    setPModal(false); load()
  }

  function PF(k:string) { return (v:string) => setPForm((p:any)=>({...p,[k]:v})) }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Accounting</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Sales income · Purchase expenses · Profit tracking</div>
        </div>
        <button className="btn-primary" onClick={() => setPModal(true)}>+ Record Purchase</button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Sales',    value:formatINR(totalSales), color:'#4ade80', accent:'green'  },
          { label:'Total Expenses', value:formatINR(totalExp),   color:'#f87171', accent:'red'    },
          { label:'Net Profit',     value:formatINR(profit),     color:'#fbbf24', accent:'amber'  },
          { label:'Profit Margin',  value:margin+'%',            color:'#60a5fa', accent:'blue'   },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {(['sales','purchases','profit'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background: tab===t ? '#f97316' : 'none', color: tab===t ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==='sales' && (
        <div className="mc-card" style={{ padding:0 }}>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div> : (
            <table className="mc-table">
              <thead><tr>{['Job','Customer','Vehicle','Service','Mechanic','Date','Amount','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#f97316' }}>JOB-{j.id}</span></td>
                    <td><strong>{j.customer_name}</strong></td>
                    <td>{j.vehicle_number}</td>
                    <td>{j.service_type}</td>
                    <td style={{ color:'#9ca3af' }}>{j.mechanic||'—'}</td>
                    <td>{j.service_date}</td>
                    <td><strong style={{ color:'#fbbf24' }}>{formatINR(j.estimated_amount)}</strong></td>
                    <td><span className={`badge badge-${j.status==='Completed'?'paid':j.status==='In Progress'?'progress':'pending'}`}>{j.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==='purchases' && (
        <div className="mc-card" style={{ padding:0 }}>
          <table className="mc-table">
            <thead><tr>{['#','Part / Item','Supplier','Qty','Unit Cost','Total','Date','Mechanic'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#6b7280' }}>PO-{p.id}</span></td>
                  <td><strong>{p.part_name}</strong></td>
                  <td style={{ color:'#9ca3af' }}>{p.supplier||'—'}</td>
                  <td>{p.quantity}</td>
                  <td>{formatINR(p.unit_cost)}</td>
                  <td><strong style={{ color:'#f87171' }}>{formatINR(p.total_cost??p.quantity*p.unit_cost)}</strong></td>
                  <td>{p.purchase_date}</td>
                  <td style={{ color:'#9ca3af' }}>{p.mechanic||'—'}</td>
                </tr>
              ))}
              {purchases.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', color:'#374151', padding:30 }}>No purchases recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab==='profit' && (
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:16 }}>Weekly Revenue vs Expenses</div>
          {days.map((day, i) => (
            <div key={day} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                <span style={{ color:'#9ca3af', fontWeight:600, width:30 }}>{day}</span>
                <span style={{ color:'#fbbf24', fontWeight:600 }}>{formatINR(MOCK[i])}</span>
                <span style={{ color:'#60a5fa', fontSize:11 }}>- {formatINR(MEXPE[i])}</span>
                <span style={{ color:'#4ade80', fontWeight:600 }}>{formatINR(MOCK[i]-MEXPE[i])} profit</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: (MOCK[i]/maxVal*100)+'%' }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #141926', paddingTop:16, marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700 }}>
              <span style={{ color:'#6b7280' }}>Weekly Total Profit</span>
              <span style={{ color:'#4ade80' }}>{formatINR(MOCK.reduce((a,b)=>a+b,0) - MEXPE.reduce((a,b)=>a+b,0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase modal */}
      {pModal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setPModal(false)}>
          <div className="mc-modal" style={{ width:500 }}>
            <h3>Record Purchase / Expense</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Part Name *','part_name','Engine oil, brake pads...'],['Supplier','supplier','Castrol, Bosch...']].map(([l,k,ph])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input className="mc-input" value={pForm[k as keyof typeof pForm]} onChange={e => PF(k)(e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Qty','quantity','1'],['Unit Cost (₹)','unit_cost','0']].map(([l,k,ph])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input type="number" className="mc-input" value={pForm[k as keyof typeof pForm]} onChange={e => PF(k)(e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Date</label>
                <input type="date" className="mc-input" value={pForm.purchase_date} onChange={e => PF('purchase_date')(e.target.value)} />
              </div>
            </div>
            <div style={{ background:'rgba(249,115,22,.05)', border:'1px solid rgba(249,115,22,.15)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#fb923c', marginBottom:14 }}>
              Total Cost: <strong>{formatINR((Number(pForm.quantity)||0)*(Number(pForm.unit_cost)||0))}</strong>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={() => setPModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={savePurchase} disabled={saving}>{saving?'Saving...':'Record Purchase'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
