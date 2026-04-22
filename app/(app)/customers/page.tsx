'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, formatINR, daysSince, calcNextServiceDate } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const VTYPES = ['Bike','Car','Heavy Vehicle']
const EMPTY = {
  service_code:'', customer_name:'', mobile_number:'', vehicle_number:'',
  vehicle_type:'Bike', bike_model:'', service_interval:'45',
  service_date: new Date().toISOString().split('T')[0], oil_change_date:'',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [history,   setHistory]   = useState<any[]>([])
  const [sel,       setSel]       = useState<any>(null)
  const [modal,     setModal]     = useState(false)
  const [editCust,  setEditCust]  = useState<any>(null)
  const [form,      setForm]      = useState<any>(EMPTY)
  const [search,    setSearch]    = useState('')
  const [toast,     setToast]     = useState<any>(null)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('created_at',{ascending:false})
    setCustomers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function selectCustomer(c: any) {
    setSel(c)
    const { data } = await supabase.from('service_history').select('*').eq('customer_id', c.id).order('service_date',{ascending:false})
    setHistory(data ?? [])
  }

  function openNew() {
    setEditCust(null)
    setForm({ ...EMPTY, service_code: 'SC' + Date.now().toString().slice(-4) })
    setModal(true)
  }
  function openEdit(c: any) {
    setEditCust(c)
    setForm({ ...c, service_interval: String(c.service_interval ?? '45') })
    setModal(true)
  }

  async function save() {
    if (!form.customer_name || !form.mobile_number || !form.vehicle_number) {
      setToast({msg:'Name, mobile and vehicle are required.',type:'error'}); return
    }
    setSaving(true)
    const next = form.service_date ? calcNextServiceDate(form.service_date, form.vehicle_type) : null
    const payload = {
      service_code:    form.service_code,
      customer_name:   form.customer_name.trim(),
      mobile_number:   form.mobile_number.trim(),
      vehicle_number:  form.vehicle_number.trim().toUpperCase(),
      vehicle_type:    form.vehicle_type,
      bike_model:      form.bike_model,
      service_interval:Number(form.service_interval)||45,
      service_date:    form.service_date || null,
      next_service_date: next,
      oil_change_date: form.oil_change_date || null,
    }
    const { error } = editCust
      ? await supabase.from('customers').update(payload).eq('id', editCust.id)
      : await supabase.from('customers').insert(payload)
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg: editCust ? 'Customer updated!' : 'Customer added!', type:'success'})
    setModal(false); load()
  }

  async function deleteCustomer(id:number) {
    if (!confirm('Delete this customer and all their history?')) return
    await supabase.from('customers').delete().eq('id', id)
    setSel(null); setHistory([]); load()
    setToast({msg:'Customer deleted.',type:'success'})
  }

  const filtered = customers.filter(c =>
    !search || c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile_number?.includes(search) || c.service_code?.toLowerCase().includes(search.toLowerCase())
  )

  function F(k:string) { return (v:string) => setForm((p:any) => ({...p,[k]:v})) }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Customers</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>{customers.length} registered vehicles</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Customer</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input className="mc-input" style={{ maxWidth:360 }} placeholder="Search by name, vehicle, phone, service code..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: sel ? '1fr 400px' : '1fr', gap:18 }}>
        {/* Table */}
        <div className="mc-card" style={{ padding:0 }}>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div> : (
            <table className="mc-table">
              <thead>
                <tr>{['Code','Customer','Vehicle','Type','Model','Last Service','Next Due','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const overdue = c.next_service_date && new Date(c.next_service_date) < new Date()
                  return (
                    <tr key={c.id} style={{ cursor:'pointer', background: sel?.id===c.id ? 'rgba(249,115,22,.04)' : '' }} onClick={() => selectCustomer(c)}>
                      <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#f97316' }}>{c.service_code}</span></td>
                      <td><strong>{c.customer_name}</strong><div style={{ fontSize:11, color:'#4b5563' }}>{c.mobile_number}</div></td>
                      <td>{c.vehicle_number}</td>
                      <td><span className={`badge badge-${c.vehicle_type==='Bike'?'bike':c.vehicle_type==='Car'?'car':'heavy'}`}>{c.vehicle_type}</span></td>
                      <td style={{ color:'#9ca3af', fontSize:12 }}>{c.bike_model || '—'}</td>
                      <td>{c.service_date || '—'}</td>
                      <td><span style={{ color: overdue ? '#f87171' : '#4ade80', fontSize:12, fontWeight:600 }}>{c.next_service_date || '—'}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); openEdit(c) }}>✏</button>
                          <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteCustomer(c.id) }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Profile panel */}
        {sel && (
          <div className="animate-slideIn">
            <div className="mc-card" style={{ marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:14 }}>👤 Customer Profile</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Name',       sel.customer_name],
                  ['Phone',      sel.mobile_number],
                  ['Vehicle',    sel.vehicle_number],
                  ['Type',       sel.vehicle_type],
                  ['Model',      sel.bike_model||'—'],
                  ['Code',       sel.service_code],
                  ['Last Svc',   sel.service_date||'—'],
                  ['Next Due',   sel.next_service_date||'—'],
                  ['Oil Changed',sel.oil_change_date||'—'],
                  ['Interval',   (sel.service_interval||45)+' days'],
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'#0a0c10', borderRadius:6, padding:10 }}>
                    <div style={{ fontSize:9, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:12, color:'#e2e8f0', fontWeight:600 }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button className="btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openEdit(sel)}>✏ Edit</button>
                <button className="btn-danger btn-sm" style={{ flex:1 }} onClick={() => deleteCustomer(sel.id)}>🗑 Delete</button>
              </div>
            </div>

            <div className="mc-card">
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>📋 Service History ({history.length})</div>
              {history.length === 0 ? (
                <div style={{ color:'#374151', fontSize:13, textAlign:'center', padding:20 }}>No history yet</div>
              ) : history.map(h => (
                <div key={h.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #141926' }}>
                  <div>
                    <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{h.service_type||'Service'}</div>
                    <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>{h.service_date} · {h.mechanic||'—'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:'#fbbf24', fontWeight:600, fontSize:13 }}>{h.amount ? formatINR(h.amount) : '—'}</div>
                    {h.service_km && <div style={{ fontSize:11, color:'#4b5563' }}>{h.service_km.toLocaleString()} km</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setModal(false)}>
          <div className="mc-modal">
            <h3>{editCust ? 'Edit Customer' : 'Add New Customer'}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[
                ['Service Code','service_code','SC001'],
                ['Customer Name *','customer_name','Full name'],
                ['Mobile Number *','mobile_number','9876543210'],
                ['Vehicle Number *','vehicle_number','TN01AB1234'],
              ].map(([l,k,ph]) => (
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input className="mc-input" value={form[k]} onChange={e => F(k)(e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Vehicle Type</label>
                <select className="mc-select" value={form.vehicle_type} onChange={e => { F('vehicle_type')(e.target.value); F('service_interval')(e.target.value==='Car'?'75':e.target.value==='Heavy Vehicle'?'30':'45') }}>
                  {VTYPES.map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Bike/Car Model</label>
                <input className="mc-input" value={form.bike_model} onChange={e => F('bike_model')(e.target.value)} placeholder="Royal Enfield Classic 350" />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:4 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Last Service Date</label>
                <input type="date" className="mc-input" value={form.service_date} onChange={e => F('service_date')(e.target.value)} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Oil Change Date</label>
                <input type="date" className="mc-input" value={form.oil_change_date} onChange={e => F('oil_change_date')(e.target.value)} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Interval (days)</label>
                <input type="number" className="mc-input" value={form.service_interval} onChange={e => F('service_interval')(e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':editCust?'Update':'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
