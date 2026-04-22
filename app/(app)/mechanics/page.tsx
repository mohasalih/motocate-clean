'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, formatINR } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const EMPTY = { name:'', phone:'', role:'Mechanic', specialization:'', joining_date:'' }

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState<any[]>([])
  const [jobs,      setJobs]      = useState<any[]>([])
  const [txns,      setTxns]      = useState<any[]>([])
  const [sel,       setSel]       = useState<any>(null)
  const [modal,     setModal]     = useState(false)
  const [editMech,  setEditMech]  = useState<any>(null)
  const [form,      setForm]      = useState<any>(EMPTY)
  const [toast,     setToast]     = useState<any>(null)
  const [saving,    setSaving]    = useState(false)
  const [txnModal,  setTxnModal]  = useState(false)
  const [txnForm,   setTxnForm]   = useState({ transaction_type:'sold', item_name:'', quantity:'1', unit_price:'', notes:'' })

  const load = useCallback(async () => {
    const [m, j, t] = await Promise.all([
      supabase.from('mechanics').select('*').order('name'),
      supabase.from('jobs').select('*'),
      supabase.from('mechanic_transactions').select('*').order('created_at',{ascending:false}),
    ])
    setMechanics(m.data ?? [])
    setJobs(j.data ?? [])
    setTxns(t.data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  function mechJobs(name:string)    { return jobs.filter(j => j.mechanic === name) }
  function mechRevenue(name:string) { return mechJobs(name).filter(j=>j.status==='Completed').reduce((a:number,b:any)=>a+Number(b.estimated_amount),0) }
  function mechTxns(id:number,type:string) { return txns.filter(t=>t.mechanic_id===id&&t.transaction_type===type) }
  function mechTxnTotal(id:number,type:string) { return mechTxns(id,type).reduce((a:number,b:any)=>a+Number(b.total_value??b.quantity*b.unit_price),0) }

  function openNew()     { setEditMech(null); setForm(EMPTY); setModal(true) }
  function openEdit(m:any) { setEditMech(m); setForm({...m}); setModal(true) }

  async function save() {
    if (!form.name) { setToast({msg:'Name required.',type:'error'}); return }
    setSaving(true)
    const payload = { name:form.name, phone:form.phone, role:form.role, specialization:form.specialization, joining_date:form.joining_date||null, active:true }
    const { error } = editMech
      ? await supabase.from('mechanics').update(payload).eq('id', editMech.id)
      : await supabase.from('mechanics').insert(payload)
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg: editMech?'Updated!':'Added!', type:'success'})
    setModal(false); load()
  }

  async function saveTxn() {
    if (!sel || !txnForm.item_name) { setToast({msg:'Item name required.',type:'error'}); return }
    const { error } = await supabase.from('mechanic_transactions').insert({
      mechanic_id:       sel.id,
      mechanic_name:     sel.name,
      transaction_type:  txnForm.transaction_type,
      item_name:         txnForm.item_name,
      quantity:          Number(txnForm.quantity)||1,
      unit_price:        Number(txnForm.unit_price)||0,
      notes:             txnForm.notes,
    })
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg:'Transaction recorded!', type:'success'})
    setTxnModal(false); load()
  }

  function TF(k:string) { return (v:string) => setTxnForm((p:any)=>({...p,[k]:v})) }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Mechanics</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Performance · Parts sold · Parts used</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Mechanic</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: sel ? '1fr 420px' : '1fr', gap:18 }}>
        {/* List */}
        <div>
          {mechanics.map(m => {
            const revenue  = mechRevenue(m.name)
            const jobCount = mechJobs(m.name).length
            const sold     = mechTxnTotal(m.id,'sold')
            const used     = mechTxnTotal(m.id,'used')
            const compJobs = mechJobs(m.name).filter(j=>j.status==='Completed').length
            const eff      = jobCount > 0 ? Math.round((compJobs/jobCount)*100) : 0
            return (
              <div key={m.id} className="mc-card" style={{ marginBottom:14, cursor:'pointer', borderColor: sel?.id===m.id ? '#f97316' : '#141926', transition:'border-color .2s' }} onClick={() => setSel(sel?.id===m.id?null:m)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:14 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:22, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {m.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{m.name}</div>
                      <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{m.role} · {m.specialization||'General'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'#fbbf24', fontWeight:700, fontSize:16 }}>{formatINR(revenue)}</div>
                    <div style={{ fontSize:11, color:'#4b5563' }}>{jobCount} jobs total</div>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    ['Jobs Done',   String(compJobs), '#60a5fa'],
                    ['Efficiency',  eff+'%',          '#4ade80'],
                    ['Parts Sold',  formatINR(sold),  '#f97316'],
                    ['Parts Used',  formatINR(used),  '#f87171'],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{ background:'#07080a', borderRadius:6, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:9, color:'#4b5563', textTransform:'uppercase', letterSpacing:.5 }}>{l}</div>
                      <div style={{ fontSize:15, fontWeight:800, color:c, fontFamily:"'Syne',sans-serif", marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:eff+'%' }} /></div>
                <div style={{ display:'flex', gap:8, marginTop:12 }}>
                  <button className="btn-ghost btn-sm" onClick={e=>{e.stopPropagation();openEdit(m)}}>✏ Edit</button>
                  <button className="btn-success btn-sm" onClick={e=>{e.stopPropagation();setSel(m);setTxnModal(true)}}>+ Transaction</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {sel && (
          <div className="animate-slideIn">
            <div className="mc-card" style={{ marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>💰 Parts Sold by {sel.name.split(' ')[0]}</div>
              {mechTxns(sel.id,'sold').length === 0
                ? <div style={{ color:'#374151', fontSize:13, textAlign:'center', padding:16 }}>No sales recorded</div>
                : mechTxns(sel.id,'sold').map((t:any) => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #141926' }}>
                    <div>
                      <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{t.item_name}</div>
                      <div style={{ fontSize:11, color:'#4b5563' }}>Qty {t.quantity} · {new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span style={{ color:'#4ade80', fontWeight:600 }}>{formatINR(t.total_value??t.quantity*t.unit_price)}</span>
                  </div>
                ))
              }
              <div style={{ paddingTop:10, borderTop:'1px solid #141926', display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#4ade80' }}>
                <span>Total Sold</span><span>{formatINR(mechTxnTotal(sel.id,'sold'))}</span>
              </div>
            </div>

            <div className="mc-card">
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>🛒 Parts Used / Purchased by {sel.name.split(' ')[0]}</div>
              {mechTxns(sel.id,'used').length === 0 && mechTxns(sel.id,'purchased').length === 0
                ? <div style={{ color:'#374151', fontSize:13, textAlign:'center', padding:16 }}>No usage recorded</div>
                : [...mechTxns(sel.id,'used'), ...mechTxns(sel.id,'purchased')].map((t:any) => (
                  <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #141926' }}>
                    <div>
                      <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{t.item_name}</div>
                      <div style={{ fontSize:11, color:'#4b5563' }}>Qty {t.quantity} · {t.transaction_type}</div>
                    </div>
                    <span style={{ color:'#f87171', fontWeight:600 }}>{formatINR(t.total_value??t.quantity*t.unit_price)}</span>
                  </div>
                ))
              }
              <div style={{ paddingTop:10, borderTop:'1px solid #141926', display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#f87171' }}>
                <span>Total Cost</span><span>{formatINR(mechTxnTotal(sel.id,'used')+mechTxnTotal(sel.id,'purchased'))}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add mechanic modal */}
      {modal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setModal(false)}>
          <div className="mc-modal" style={{ width:480 }}>
            <h3>{editMech ? 'Edit Mechanic' : 'Add Mechanic'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Full Name *','name','Senthil Kumar'],['Phone','phone','9876541234'],['Role','role','Senior Mechanic'],['Specialization','specialization','Engine & Electrical']].map(([l,k,ph])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input className="mc-input" value={form[k]} onChange={e => setForm((p:any)=>({...p,[k]:e.target.value}))} placeholder={ph} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Joining Date</label>
              <input type="date" className="mc-input" value={form.joining_date} onChange={e => setForm((p:any)=>({...p,joining_date:e.target.value}))} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':editMech?'Update':'Add Mechanic'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction modal */}
      {txnModal && sel && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setTxnModal(false)}>
          <div className="mc-modal" style={{ width:440 }}>
            <h3>New Transaction — {sel.name}</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Type</label>
              <select className="mc-select" value={txnForm.transaction_type} onChange={e => TF('transaction_type')(e.target.value)}>
                <option value="sold">Sold to Customer</option>
                <option value="used">Used in Service</option>
                <option value="purchased">Purchased from Supplier</option>
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Item Name *</label>
              <input className="mc-input" value={txnForm.item_name} onChange={e => TF('item_name')(e.target.value)} placeholder="Engine Oil, Brake Pads..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Quantity</label>
                <input type="number" className="mc-input" value={txnForm.quantity} onChange={e => TF('quantity')(e.target.value)} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Unit Price (₹)</label>
                <input type="number" className="mc-input" value={txnForm.unit_price} onChange={e => TF('unit_price')(e.target.value)} />
              </div>
            </div>
            <div style={{ background:'rgba(249,115,22,.05)', border:'1px solid rgba(249,115,22,.15)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#fb923c', marginBottom:14 }}>
              Total: {formatINR((Number(txnForm.quantity)||0)*(Number(txnForm.unit_price)||0))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" onClick={() => setTxnModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTxn}>Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
