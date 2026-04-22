'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, daysSince, buildWhatsAppLink } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const GARAGE_NAME = process.env.NEXT_PUBLIC_GARAGE_NAME || 'Moto Care Pro'

export default function RemindersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<'oil'|'repeat'|'upcoming'>('oil')
  const [toast,     setToast]     = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('customer_name')
    setCustomers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Oil 30+ days
  const oilDue = customers.filter(c => c.oil_change_date && daysSince(c.oil_change_date) >= 30)
  // Away 60+ days
  const away60 = customers.filter(c => c.service_date && daysSince(c.service_date) >= 60)
  // Service due within 7 days
  const dueSoon = customers.filter(c => {
    if (!c.next_service_date) return false
    const diff = (new Date(c.next_service_date).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 7
  })

  async function markOilDone(c: any) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('customers').update({ oil_change_date: today, oil_reminder_sent: false }).eq('id', c.id)
    setToast({msg:`Oil change marked for ${c.customer_name}`, type:'success'})
    load()
  }

  async function markReminderSent(c: any) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('customers').update({ repeat_reminder_sent_on: today }).eq('id', c.id)
    setToast({msg:`Marked sent for ${c.customer_name}`, type:'success'})
    load()
  }

  function sendAll(list: any[], msgFn: (c:any)=>string) {
    if (!list.length) { setToast({msg:'No customers to send to.',type:'error'}); return }
    list.forEach((c,i) => {
      const link = buildWhatsAppLink(c.mobile_number, msgFn(c))
      if (link) setTimeout(() => window.open(link,'_blank'), i * 500)
    })
    setToast({msg:`Opening ${list.length} WhatsApp chats...`, type:'success'})
  }

  const oilMsg  = (c:any) => `Dear ${c.customer_name}, it has been ${daysSince(c.oil_change_date)} days since your oil change for ${c.vehicle_number}. Please visit ${GARAGE_NAME} for a quick oil change. - ${GARAGE_NAME}`
  const repMsg  = (c:any) => `Hello ${c.customer_name}! We miss you at ${GARAGE_NAME}. It has been ${daysSince(c.service_date)} days since your last service. Visit us for a great offer on your next service! - ${GARAGE_NAME}`
  const dueMsg  = (c:any) => `Hi ${c.customer_name}, your ${c.vehicle_type} service is due on ${c.next_service_date}. Book your slot now at ${GARAGE_NAME} to avoid waiting. Call us or reply here. - ${GARAGE_NAME}`

  const listMap: Record<string,any[]> = { oil: oilDue, repeat: away60, upcoming: dueSoon }
  const msgMap:  Record<string,(c:any)=>string> = { oil: oilMsg, repeat: repMsg, upcoming: dueMsg }
  const list = listMap[tab]
  const msgFn = msgMap[tab]

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>WhatsApp Reminders</div>
        <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Oil alerts · Repeat customers · Service due soon</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Oil Due (30+ days)',    value:String(oilDue.length),  color:'#fbbf24', accent:'amber', t:'oil'      },
          { label:'Away 60+ Days',         value:String(away60.length),  color:'#f87171', accent:'red',   t:'repeat'   },
          { label:'Service Due (7 days)',  value:String(dueSoon.length), color:'#4ade80', accent:'green', t:'upcoming' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`} style={{ cursor:'pointer' }} onClick={() => setTab(s.t as any)}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#374151', marginTop:4 }}>Click to view</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {[
          {k:'oil',      l:'🛢 Oil Reminders'},
          {k:'repeat',   l:'🔄 Repeat Customers'},
          {k:'upcoming', l:'📅 Upcoming Service'},
        ].map(({k,l}) => (
          <button key={k} onClick={() => setTab(k as any)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background: tab===k ? '#f97316' : 'none', color: tab===k ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Send all button */}
      {list.length > 0 && (
        <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
          <button className="wa-btn" style={{ padding:'10px 20px', fontSize:13 }} onClick={() => sendAll(list, msgFn)}>
            📱 Send WhatsApp to All ({list.length})
          </button>
          {tab==='repeat' && (
            <button className="btn-ghost btn-sm" onClick={async () => {
              const today = new Date().toISOString().split('T')[0]
              await supabase.from('customers').update({ repeat_reminder_sent_on: today })
                .in('id', away60.map(c=>c.id))
              setToast({msg:'All repeat reminders marked as sent.',type:'success'}); load()
            }}>Mark All Sent</button>
          )}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#374151', fontSize:14 }}>
          {tab==='oil' ? '✅ No oil reminders due right now.' : tab==='repeat' ? '✅ No inactive customers.' : '✅ No upcoming services in 7 days.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {list.map(c => {
            const days = tab==='oil' ? daysSince(c.oil_change_date) : tab==='repeat' ? daysSince(c.service_date) : Math.ceil((new Date(c.next_service_date).getTime()-Date.now())/86400000)
            const waLink = buildWhatsAppLink(c.mobile_number, msgFn(c))
            return (
              <div key={c.id} style={{ background:'#0d1018', border:'1px solid #141926', borderRadius:10, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0' }}>{c.customer_name} — <span style={{ fontFamily:'monospace', fontSize:12, color:'#f97316' }}>{c.vehicle_number}</span></div>
                  <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>
                    {c.bike_model||c.vehicle_type} · Phone: {c.mobile_number}
                    {tab==='oil'      && ` · Last oil: ${c.oil_change_date} · `}
                    {tab==='repeat'   && ` · Last visit: ${c.service_date} · `}
                    {tab==='upcoming' && ` · Due: ${c.next_service_date} · `}
                    <span style={{ color: tab==='upcoming' ? '#4ade80' : '#fbbf24', fontWeight:600 }}>
                      {tab==='upcoming' ? `${days} days left` : `${days} days`}
                    </span>
                  </div>
                  {tab==='repeat' && c.repeat_reminder_sent_on && (
                    <div style={{ fontSize:11, color:'#4b5563', marginTop:3 }}>Last reminder sent: {c.repeat_reminder_sent_on}</div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  {c.mobile_number ? (
                    <a href={waLink} target="_blank" rel="noreferrer" className="wa-btn">📱 WhatsApp</a>
                  ) : (
                    <span style={{ fontSize:12, color:'#4b5563' }}>No mobile</span>
                  )}
                  {tab==='oil'    && <button className="btn-success btn-sm" onClick={() => markOilDone(c)}>✓ Oil Done</button>}
                  {tab==='repeat' && <button className="btn-ghost btn-sm"   onClick={() => markReminderSent(c)}>✓ Sent</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
