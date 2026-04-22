'use client'
import { useRouter } from 'next/navigation'
import { formatINR } from '@/lib/supabase'

const WEEK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MOCK_REV  = [12500,18200,9800,22400,31000,45000,8500]
const MOCK_EXP  = [4200, 6100, 3500,8000, 9200, 14000,2100]

export default function DashboardClient({ jobs, invoices, parts, customers }: any) {
  const router = useRouter()
  const pending   = jobs.filter((j:any) => j.status !== 'Completed').length
  const lowStock  = parts.filter((p:any) => p.stock < p.min_stock).length
  const totalRev  = invoices.filter((i:any) => i.payment_status === 'Paid').reduce((a:number,b:any) => a + Number(b.paid_amount), 0)
  const pending$  = invoices.filter((i:any) => i.payment_status === 'Pending').reduce((a:number,b:any) => a + Number(b.amount), 0)
  const maxRev    = Math.max(...MOCK_REV)

  return (
    <div style={{ padding: '28px 32px' }} className="animate-fadeUp">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>Workshop Dashboard</div>
        <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} · Moto Care Pro
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }} className="stagger">
        {[
          { label:'Total Revenue',    value: formatINR(totalRev), sub:'Paid invoices',    color:'#fbbf24', accent:'amber'  },
          { label:'Pending Dues',     value: formatINR(pending$), sub:'Unpaid invoices',  color:'#60a5fa', accent:'blue'   },
          { label:'Active Jobs',      value: String(pending),     sub:'Jobs in progress', color:'#4ade80', accent:'green'  },
          { label:'Low Stock Alerts', value: String(lowStock),    sub:'Need reorder',     color:'#f87171', accent:'red'    },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#374151', marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { icon:'🔧', label:'New Service Job', sub:'Add a job card',   href:'/jobs'      },
          { icon:'🧾', label:'Create Invoice',  sub:'Bill a customer',  href:'/invoices'  },
          { icon:'🔔', label:'Send Reminders',  sub:'WhatsApp alerts',  href:'/reminders' },
        ].map(q => (
          <button key={q.href} onClick={() => router.push(q.href)}
            style={{ background:'#0d1018', border:'1px solid #141926', borderRadius:12, padding:16, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12, transition:'all .2s' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor='#f97316'; (e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
            onMouseOut={e  => { (e.currentTarget as HTMLElement).style.borderColor='#141926'; (e.currentTarget as HTMLElement).style.transform='none' }}
          >
            <div style={{ fontSize:22, width:40, height:40, background:'rgba(249,115,22,.1)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>{q.icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{q.label}</div>
              <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>{q.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:24 }}>
        {/* Revenue chart */}
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:16 }}>Revenue vs Expenses — This Week</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, alignItems:'end', height:100, padding:'0 4px' }}>
            {WEEK_DAYS.map((day, i) => (
              <div key={day} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background:'linear-gradient(180deg,#f97316,#ea580c)', height: (MOCK_REV[i]/maxRev*80)+'px', minHeight:4 }} />
                <div style={{ width:'100%', borderRadius:'3px 3px 0 0', background:'linear-gradient(180deg,#3b82f6,#1d4ed8)', height: (MOCK_EXP[i]/maxRev*80)+'px', minHeight:2 }} />
                <div style={{ fontSize:10, color:'#4b5563' }}>{day}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:14, marginTop:10, justifyContent:'center' }}>
            {[['#f97316','Revenue'],['#3b82f6','Expenses']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#6b7280' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>Recent Jobs</div>
          {jobs.slice(0,5).map((j:any) => (
            <div key={j.id} style={{ padding:'10px 0', borderBottom:'1px solid #141926', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{j.customer_name}</div>
                <div style={{ fontSize:11, color:'#4b5563', marginTop:2 }}>{j.vehicle_number} · {j.service_type}</div>
              </div>
              <span className={`badge badge-${j.status==='Completed'?'completed':j.status==='In Progress'?'progress':'pending'}`}>{j.status}</span>
            </div>
          ))}
          {jobs.length === 0 && <div style={{ color:'#374151', fontSize:13, textAlign:'center', padding:20 }}>No jobs yet</div>}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {/* Low stock warning */}
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>⚠️ Low Stock Items</div>
          {parts.filter((p:any) => p.stock < p.min_stock).slice(0,5).map((p:any) => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #141926' }}>
              <span style={{ fontSize:13, color:'#c4ccd8' }}>{p.name}</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#f87171', fontWeight:700 }}>{p.stock} left</span>
                <span style={{ fontSize:11, color:'#4b5563' }}>min {p.min_stock}</span>
              </div>
            </div>
          ))}
          {parts.filter((p:any) => p.stock < p.min_stock).length === 0 && (
            <div style={{ color:'#4ade80', fontSize:13, textAlign:'center', padding:16 }}>✓ All stock levels OK</div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className="mc-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:12 }}>📅 Today's Reminders</div>
          <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.8 }}>
            <div style={{ padding:'8px 0', borderBottom:'1px solid #141926', display:'flex', justifyContent:'space-between' }}>
              <span>Total Customers</span><span style={{ color:'#e2e8f0', fontWeight:600 }}>{customers.length}</span>
            </div>
            <div style={{ padding:'8px 0', borderBottom:'1px solid #141926', display:'flex', justifyContent:'space-between' }}>
              <span>Oil Due (30+ days)</span>
              <span style={{ color:'#fbbf24', fontWeight:600 }}>
                {customers.filter((c:any) => {
                  if (!c.oil_change_date) return false
                  return (Date.now() - new Date(c.oil_change_date).getTime()) / 86400000 >= 30
                }).length}
              </span>
            </div>
            <div style={{ padding:'8px 0', display:'flex', justifyContent:'space-between' }}>
              <span>Away 60+ days</span>
              <span style={{ color:'#f87171', fontWeight:600 }}>
                {customers.filter((c:any) => {
                  if (!c.service_date) return false
                  return (Date.now() - new Date(c.service_date).getTime()) / 86400000 >= 60
                }).length}
              </span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => router.push('/reminders')} style={{ width:'100%', marginTop:14 }}>
            View All Reminders →
          </button>
        </div>
      </div>
    </div>
  )
}
