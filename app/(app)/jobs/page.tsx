'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, calcNextServiceDate, formatINR } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const VTYPES  = ['Bike','Car','Heavy Vehicle']
const STYPES  = ['Oil Change','General Service','Full Service','Repair Work','Tyre Change','Battery Replacement','AC Service','Custom']
const INTERVALS: Record<string,number> = { Bike:45, Car:75, 'Heavy Vehicle':30 }

const EMPTY_FORM = {
  customer_name:'', phone:'', vehicle_number:'', vehicle_type:'Bike',
  bike_model:'', service_type:'Oil Change', mechanic:'',
  service_date: new Date().toISOString().split('T')[0],
  estimated_amount:'', notes:'', status:'Pending',
}

export default function JobsPage() {
  const [jobs,     setJobs]    = useState<any[]>([])
  const [mechs,    setMechs]   = useState<any[]>([])
  const [loading,  setLoading] = useState(true)
  const [modal,    setModal]   = useState(false)
  const [editJob,  setEditJob] = useState<any>(null)
  const [form,     setForm]    = useState<any>(EMPTY_FORM)
  const [filter,   setFilter]  = useState('All')
  const [toast,    setToast]   = useState<{msg:string,type:'success'|'error'}|null>(null)
  const [saving,   setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [j, m] = await Promise.all([
      supabase.from('jobs').select('*').order('created_at', { ascending:false }),
      supabase.from('mechanics').select('*').eq('active', true),
    ])
    setJobs(j.data ?? [])
    setMechs(m.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditJob(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }
  function openEdit(j: any) {
    setEditJob(j)
    setForm({ ...j, estimated_amount: String(j.estimated_amount ?? '') })
    setModal(true)
  }
  function closeModal() { setModal(false); setEditJob(null) }

  async function save() {
    if (!form.customer_name || !form.vehicle_number) {
      setToast({ msg:'Customer name and vehicle number are required.', type:'error' }); return
    }
    setSaving(true)
    const next = calcNextServiceDate(form.service_date, form.vehicle_type)
    const payload = {
      customer_name:    form.customer_name.trim(),
      phone:            form.phone.trim(),
      vehicle_number:   form.vehicle_number.trim().toUpperCase(),
      vehicle_type:     form.vehicle_type,
      bike_model:       form.bike_model.trim(),
      service_type:     form.service_type,
      mechanic:         form.mechanic,
      service_date:     form.service_date,
      next_service_date:next,
      estimated_amount: Number(form.estimated_amount) || 0,
      notes:            form.notes.trim(),
      status:           form.status,
    }
    const { error } = editJob
      ? await supabase.from('jobs').update(payload).eq('id', editJob.id)
      : await supabase.from('jobs').insert(payload)

    setSaving(false)
    if (error) { setToast({ msg:'Error: ' + error.message, type:'error' }); return }
    setToast({ msg: editJob ? 'Job updated!' : 'Job created!', type:'success' })
    closeModal(); load()
  }

  async function updateStatus(id: number, status: string) {
    await supabase.from('jobs').update({ status }).eq('id', id)
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  async function deleteJob(id: number) {
    if (!confirm('Delete this job?')) return
    await supabase.from('jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
    setToast({ msg:'Job deleted.', type:'success' })
  }

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.status === filter)

  function F(k: string) { return (v: string) => setForm((p:any) => ({ ...p, [k]:v })) }

  const nextDatePreview = form.service_date
    ? calcNextServiceDate(form.service_date, form.vehicle_type)
    : '-'

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Service Jobs</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>{jobs.length} total jobs · {jobs.filter(j=>j.status==='Pending').length} pending</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Job</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {['All','Pending','In Progress','Completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background: filter===s ? '#f97316' : 'none', color: filter===s ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mc-card" style={{ padding:0 }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#374151' }}>No jobs found.</div>
        ) : (
          <table className="mc-table">
            <thead>
              <tr>
                {['Customer','Vehicle','Type','Service','Mechanic','Date','Amount','Status','Actions'].map(h =>
                  <th key={h}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id}>
                  <td><strong>{j.customer_name}</strong><div style={{ fontSize:11, color:'#4b5563' }}>{j.phone}</div></td>
                  <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#f97316' }}>{j.vehicle_number}</span></td>
                  <td><span className={`badge badge-${j.vehicle_type==='Bike'?'bike':j.vehicle_type==='Car'?'car':'heavy'}`}>{j.vehicle_type}</span></td>
                  <td>{j.service_type}</td>
                  <td style={{ color:'#9ca3af' }}>{j.mechanic || '—'}</td>
                  <td>{j.service_date}</td>
                  <td><strong style={{ color:'#fbbf24' }}>{formatINR(j.estimated_amount)}</strong></td>
                  <td>
                    <select className="mc-select" style={{ width:130, fontSize:12 }}
                      value={j.status} onChange={e => updateStatus(j.id, e.target.value)}>
                      {['Pending','In Progress','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(j)}>✏</button>
                      <button className="btn-danger btn-sm" onClick={() => deleteJob(j.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && closeModal()}>
          <div className="mc-modal">
            <h3>{editJob ? 'Edit Job' : 'New Service Job'}</h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Customer Name *</label>
                <input className="mc-input" value={form.customer_name} onChange={e => F('customer_name')(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Phone</label>
                <input className="mc-input" value={form.phone} onChange={e => F('phone')(e.target.value)} placeholder="9876543210" />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Vehicle Number *</label>
                <input className="mc-input" value={form.vehicle_number} onChange={e => F('vehicle_number')(e.target.value)} placeholder="TN01AB1234" style={{ textTransform:'uppercase' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Vehicle Type</label>
                <select className="mc-select" value={form.vehicle_type} onChange={e => F('vehicle_type')(e.target.value)}>
                  {VTYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Service Type</label>
                <select className="mc-select" value={form.service_type} onChange={e => F('service_type')(e.target.value)}>
                  {STYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Assign Mechanic</label>
                <select className="mc-select" value={form.mechanic} onChange={e => F('mechanic')(e.target.value)}>
                  <option value="">— Select —</option>
                  {mechs.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Service Date</label>
                <input type="date" className="mc-input" value={form.service_date} onChange={e => F('service_date')(e.target.value)} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Estimated Amount (₹)</label>
                <input type="number" className="mc-input" value={form.estimated_amount} onChange={e => F('estimated_amount')(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Notes</label>
              <textarea className="mc-input" rows={2} value={form.notes} onChange={e => F('notes')(e.target.value)} placeholder="Special instructions, observations..." style={{ resize:'vertical' }} />
            </div>

            {/* Smart interval info */}
            <div style={{ background:'rgba(249,115,22,.05)', border:'1px solid rgba(249,115,22,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#fb923c', marginBottom:4 }}>
              ⚡ Next service auto-set: <strong>{nextDatePreview}</strong> &nbsp;({INTERVALS[form.vehicle_type]}-day interval for {form.vehicle_type})
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editJob ? 'Update Job' : 'Create Job'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
