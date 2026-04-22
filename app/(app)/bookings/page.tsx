'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const TIMES = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM']
const STYPES = ['Oil Change','General Service','Full Service','Repair Work','Tyre Change','Battery Check','AC Service']

const EMPTY = {
  customer_name:'', phone:'', vehicle_number:'', vehicle_type:'Bike',
  service_type:'General Service', booking_date: new Date().toISOString().split('T')[0],
  booking_time:'10:00 AM', notes:'',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState<any>(EMPTY)
  const [toast,    setToast]    = useState<any>(null)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('bookings').select('*').order('booking_date').order('booking_time')
    setBookings(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(id:number, status:string) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(p => p.map(b => b.id===id ? {...b,status} : b))
    setToast({msg:`Booking ${status.toLowerCase()}.`, type:'success'})
  }

  async function saveBooking() {
    if (!form.customer_name || !form.phone) { setToast({msg:'Name and phone required.',type:'error'}); return }
    setSaving(true)
    const { error } = await supabase.from('bookings').insert({ ...form, vehicle_number: form.vehicle_number.toUpperCase() })
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg:'Booking added!', type:'success'})
    setModal(false); setForm(EMPTY); load()
  }

  function F(k:string) { return (v:string) => setForm((p:any)=>({...p,[k]:v})) }

  const today  = new Date().toISOString().split('T')[0]
  const shown  = filter==='All' ? bookings : filter==='Today' ? bookings.filter(b=>b.booking_date===today) : bookings.filter(b=>b.status===filter)
  const counts = { today: bookings.filter(b=>b.booking_date===today).length, pending: bookings.filter(b=>b.status==='Pending').length, confirmed: bookings.filter(b=>b.status==='Confirmed').length }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Service Bookings</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Manage appointments and scheduling</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ New Booking</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          {l:"Today's Bookings",  v:counts.today,     c:'#60a5fa', a:'blue'  },
          {l:'Pending Confirm',   v:counts.pending,   c:'#fbbf24', a:'amber' },
          {l:'Confirmed',         v:counts.confirmed, c:'#4ade80', a:'green' },
        ].map(s => (
          <div key={s.l} className={`stat-card ${s.a}`}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.l}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {['All','Today','Pending','Confirmed','Completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'7px 14px', borderRadius:7, border:'none', background: filter===f ? '#f97316' : 'none', color: filter===f ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Booking cards */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div>
      ) : shown.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#374151' }}>No bookings found.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {shown.map(b => (
            <div key={b.id} style={{ background:'#0d1018', border:'1px solid #141926', borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{b.customer_name}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>
                  {b.vehicle_number||'No vehicle'} · {b.vehicle_type} · {b.service_type}
                </div>
                <div style={{ fontSize:13, color:'#f97316', marginTop:4, fontWeight:600 }}>
                  📅 {b.booking_date} at {b.booking_time}
                  {b.booking_date===today && <span style={{ marginLeft:8, background:'rgba(249,115,22,.15)', padding:'2px 8px', borderRadius:4, fontSize:11 }}>Today</span>}
                </div>
                {b.notes && <div style={{ fontSize:11, color:'#4b5563', marginTop:3 }}>Note: {b.notes}</div>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
                <span className={`badge badge-${b.status==='Confirmed'?'confirmed':b.status==='Completed'?'completed':b.status==='Cancelled'?'cancelled':'pending'}`}>{b.status}</span>
                {b.status==='Pending'   && <button className="btn-success btn-sm" onClick={() => updateStatus(b.id,'Confirmed')}>✓ Confirm</button>}
                {b.status==='Confirmed' && <button className="btn-success btn-sm" onClick={() => updateStatus(b.id,'Completed')}>✓ Complete</button>}
                {b.status!=='Cancelled' && b.status!=='Completed' && <button className="btn-danger btn-sm" onClick={() => updateStatus(b.id,'Cancelled')}>✗ Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setModal(false)}>
          <div className="mc-modal">
            <h3>New Booking</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Customer Name *','customer_name','Full name'],['Phone *','phone','9876543210'],['Vehicle Number','vehicle_number','TN01AB1234']].map(([l,k,ph])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input className="mc-input" value={form[k]} onChange={e => F(k)(e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Vehicle Type</label>
                <select className="mc-select" value={form.vehicle_type} onChange={e => F('vehicle_type')(e.target.value)}>
                  {['Bike','Car','Heavy Vehicle'].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Service</label>
                <select className="mc-select" value={form.service_type} onChange={e => F('service_type')(e.target.value)}>
                  {STYPES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Date</label>
                <input type="date" className="mc-input" value={form.booking_date} onChange={e => F('booking_date')(e.target.value)} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Time</label>
                <select className="mc-select" value={form.booking_time} onChange={e => F('booking_time')(e.target.value)}>
                  {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Notes</label>
              <textarea className="mc-input" rows={2} value={form.notes} onChange={e => F('notes')(e.target.value)} placeholder="Customer requests, vehicle condition notes..." style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveBooking} disabled={saving}>{saving?'Saving...':'Add Booking'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
