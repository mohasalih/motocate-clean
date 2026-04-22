'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, formatINR } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

type LineItem = { name:string; qty:number; rate:number }

const REFUND_REASONS = [
  'Part not available','Service not completed','Customer dissatisfied',
  'Duplicate payment','Overcharged','Warranty claim','Other',
]

const EMPTY_FORM = {
  invoice_no:'', invoice_date: new Date().toISOString().split('T')[0],
  customer_name:'', vehicle_number:'',
  items: [{ name:'Labour', qty:1, rate:0 }] as LineItem[],
  payment_status:'Pending',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'new'|'edit'|'refund'|'view'|null>(null)
  const [sel,      setSel]      = useState<any>(null)
  const [form,     setForm]     = useState<any>(EMPTY_FORM)
  const [refAmt,   setRefAmt]   = useState('')
  const [refReason,setRefReason]= useState('')
  const [toast,    setToast]    = useState<{msg:string,type:'success'|'error'}|null>(null)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending:false })
    setInvoices(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Generate next invoice number
  async function nextInvNo() {
    const { data } = await supabase.from('invoices').select('invoice_no').order('created_at',{ascending:false}).limit(1)
    if (data && data[0]) {
      const num = parseInt(data[0].invoice_no.replace(/\D/g,'')) + 1
      return 'INV-' + String(num).padStart(3,'0')
    }
    return 'INV-001'
  }

  async function openNew() {
    const no = await nextInvNo()
    setForm({ ...EMPTY_FORM, invoice_no: no })
    setSel(null); setModal('new')
  }

  function openEdit(inv: any) {
    const items: LineItem[] = Array.isArray(inv.price_lines) ? inv.price_lines : (typeof inv.price_lines === 'string' ? JSON.parse(inv.price_lines) : [])
    setForm({ ...inv, items: items.length ? items : [{ name:'Labour', qty:1, rate:0 }] })
    setSel(inv); setModal('edit')
  }

  function openView(inv: any) { setSel(inv); setModal('view') }

  function openRefund(inv: any) {
    setSel(inv); setRefAmt(String(inv.paid_amount)); setRefReason(''); setModal('refund')
  }

  function closeModal() { setModal(null); setSel(null) }

  function setItem(idx:number, key:string, val:any) {
    setForm((p:any) => ({ ...p, items: p.items.map((it:LineItem, i:number) => i===idx ? {...it,[key]:val} : it) }))
  }
  function addLine()    { setForm((p:any) => ({ ...p, items:[...p.items, {name:'',qty:1,rate:0}] })) }
  function removeLine(i:number) { setForm((p:any) => ({ ...p, items: p.items.filter((_:any,j:number) => j!==i) })) }
  const total = (form.items ?? []).reduce((a:number,b:LineItem) => a + b.qty * b.rate, 0)

  async function saveInvoice() {
    if (!form.customer_name || !form.invoice_no) {
      setToast({msg:'Invoice number and customer name required.',type:'error'}); return
    }
    setSaving(true)
    const payload = {
      invoice_no:     form.invoice_no,
      invoice_date:   form.invoice_date,
      customer_name:  form.customer_name,
      vehicle_number: form.vehicle_number,
      price_lines:    form.items,
      amount:         total,
      payment_status: form.payment_status,
    }
    const { error } = sel
      ? await supabase.from('invoices').update(payload).eq('id', sel.id)
      : await supabase.from('invoices').insert(payload)
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg: sel ? 'Invoice updated!' : 'Invoice created!', type:'success'})
    closeModal(); load()
  }

  async function markPaid(inv: any) {
    await supabase.from('invoices').update({
      payment_status:'Paid', paid_amount: inv.amount, paid_at: new Date().toISOString().split('T')[0]
    }).eq('id', inv.id)
    setToast({msg:'Invoice marked as Paid!', type:'success'}); load()
  }

  async function processRefund() {
    const amt = Number(refAmt) || 0
    if (!refReason) { setToast({msg:'Please select a refund reason.',type:'error'}); return }
    await supabase.from('invoices').update({
      payment_status:'Refunded', refund_amount: amt, refund_reason: refReason,
      refunded_at: new Date().toISOString().split('T')[0],
    }).eq('id', sel.id)
    setToast({msg:`Refund of ${formatINR(amt)} processed.`, type:'success'})
    closeModal(); load()
  }

  const displayed = filter==='All' ? invoices : invoices.filter(i => i.payment_status===filter)
  const totalPaid    = invoices.filter(i=>i.payment_status==='Paid').reduce((a,b)=>a+Number(b.paid_amount),0)
  const totalPending = invoices.filter(i=>i.payment_status==='Pending').reduce((a,b)=>a+Number(b.amount),0)
  const totalRefund  = invoices.filter(i=>i.payment_status==='Refunded').reduce((a,b)=>a+Number(b.refund_amount||0),0)

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Invoices</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>Edit invoices · Mark paid · Process refunds</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Invoice</button>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Paid',    value:formatINR(totalPaid),    color:'#4ade80', accent:'green'  },
          { label:'Pending',       value:formatINR(totalPending), color:'#fbbf24', accent:'amber'  },
          { label:'Refunded',      value:formatINR(totalRefund),  color:'#a5b4fc', accent:'purple' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:4, background:'#0a0c10', border:'1px solid #141926', borderRadius:10, padding:4, marginBottom:20, width:'fit-content' }}>
        {['All','Pending','Paid','Refunded'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'7px 16px', borderRadius:7, border:'none', background: filter===s ? '#f97316' : 'none', color: filter===s ? '#fff' : '#6b7280', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", transition:'all .18s' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mc-card" style={{ padding:0 }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div>
        ) : (
          <table className="mc-table">
            <thead>
              <tr>{['Invoice #','Date','Customer','Vehicle','Items','Amount','Status','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {displayed.map(inv => {
                const items: LineItem[] = Array.isArray(inv.price_lines) ? inv.price_lines : (typeof inv.price_lines === 'string' ? JSON.parse(inv.price_lines||'[]') : [])
                return (
                  <tr key={inv.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#f97316', cursor:'pointer' }} onClick={() => openView(inv)}>{inv.invoice_no}</span></td>
                    <td>{inv.invoice_date}</td>
                    <td><strong>{inv.customer_name}</strong></td>
                    <td>{inv.vehicle_number || '—'}</td>
                    <td style={{ color:'#6b7280' }}>{items.length} item{items.length!==1?'s':''}</td>
                    <td><strong style={{ color:'#fbbf24' }}>{formatINR(inv.amount)}</strong></td>
                    <td>
                      <span className={`badge badge-${inv.payment_status==='Paid'?'paid':inv.payment_status==='Refunded'?'refunded':'pending'}`}>{inv.payment_status}</span>
                      {inv.payment_status==='Refunded' && inv.refund_reason && (
                        <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{inv.refund_reason}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(inv)}>✏ Edit</button>
                        {inv.payment_status==='Pending' && <button className="btn-success btn-sm" onClick={() => markPaid(inv)}>✓ Paid</button>}
                        {inv.payment_status==='Paid'    && <button className="btn-danger btn-sm"  onClick={() => openRefund(inv)}>↩ Refund</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── NEW / EDIT MODAL ── */}
      {(modal==='new'||modal==='edit') && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && closeModal()}>
          <div className="mc-modal" style={{ width:620 }}>
            <h3>{modal==='new' ? 'New Invoice' : 'Edit Invoice — '+sel?.invoice_no}</h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Invoice #</label>
                <input className="mc-input" value={form.invoice_no} onChange={e => setForm((p:any)=>({...p,invoice_no:e.target.value}))} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Date</label>
                <input type="date" className="mc-input" value={form.invoice_date} onChange={e => setForm((p:any)=>({...p,invoice_date:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Customer Name</label>
                <input className="mc-input" value={form.customer_name} onChange={e => setForm((p:any)=>({...p,customer_name:e.target.value}))} placeholder="Customer name" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Vehicle Number</label>
                <input className="mc-input" value={form.vehicle_number} onChange={e => setForm((p:any)=>({...p,vehicle_number:e.target.value.toUpperCase()}))} placeholder="TN01AB1234" />
              </div>
            </div>

            {/* Line items */}
            <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Line Items</div>
            {(form.items ?? []).map((item:LineItem, idx:number) => (
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr .5fr .8fr auto auto', gap:8, marginBottom:8, alignItems:'center' }}>
                {idx===0 && <></> }
                <input className="mc-input" value={item.name}    onChange={e => setItem(idx,'name',e.target.value)}          placeholder="Description" style={{ fontSize:12 }} />
                <input className="mc-input" type="number" value={item.qty} onChange={e => setItem(idx,'qty',Number(e.target.value))} placeholder="Qty" style={{ fontSize:12 }} />
                <input className="mc-input" type="number" value={item.rate} onChange={e => setItem(idx,'rate',Number(e.target.value))} placeholder="Rate ₹" style={{ fontSize:12 }} />
                <span style={{ fontSize:12, color:'#fbbf24', fontWeight:600, minWidth:60, textAlign:'right' }}>{formatINR(item.qty*item.rate)}</span>
                <button onClick={() => removeLine(idx)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:16, padding:'0 4px' }}>×</button>
              </div>
            ))}
            <button className="btn-ghost btn-sm" onClick={addLine} style={{ marginBottom:14 }}>+ Add Line</button>

            {/* Total */}
            <div style={{ background:'#0a0c10', borderRadius:8, padding:'12px 16px', textAlign:'right', fontSize:15, fontWeight:700, color:'#fbbf24', marginBottom:4 }}>
              Total: {formatINR(total)}
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={saveInvoice} disabled={saving}>{saving ? 'Saving...' : modal==='new' ? 'Create Invoice' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {modal==='view' && sel && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && closeModal()}>
          <div className="mc-modal" style={{ width:480 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:20 }}>
              <h3 style={{ margin:0 }}>{sel.invoice_no}</h3>
              <span className={`badge badge-${sel.payment_status==='Paid'?'paid':sel.payment_status==='Refunded'?'refunded':'pending'}`}>{sel.payment_status}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[['Date',sel.invoice_date],['Customer',sel.customer_name],['Vehicle',sel.vehicle_number||'—'],['Amount',formatINR(sel.amount)]].map(([k,v])=>(
                <div key={k} style={{ background:'#0a0c10', borderRadius:6, padding:10 }}>
                  <div style={{ fontSize:10, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{k}</div>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Line Items</div>
            {(Array.isArray(sel.price_lines) ? sel.price_lines : JSON.parse(sel.price_lines||'[]')).map((item:LineItem,i:number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #141926', fontSize:13 }}>
                <span style={{ color:'#c4ccd8' }}>{item.name} × {item.qty}</span>
                <span style={{ color:'#fbbf24', fontWeight:600 }}>{formatINR(item.qty*item.rate)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontSize:15, fontWeight:700, color:'#f1f5f9' }}>
              <span>Total</span><span style={{ color:'#fbbf24' }}>{formatINR(sel.amount)}</span>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16, paddingTop:12, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={closeModal}>Close</button>
              <button className="btn-ghost" onClick={() => { closeModal(); openEdit(sel) }}>✏ Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ── */}
      {modal==='refund' && sel && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && closeModal()}>
          <div className="mc-modal" style={{ width:460 }}>
            <h3>Process Refund — {sel.invoice_no}</h3>
            <div style={{ background:'rgba(99,102,241,.05)', border:'1px solid rgba(99,102,241,.2)', borderRadius:8, padding:14, marginBottom:18 }}>
              {[['Customer',sel.customer_name],['Invoice Total',formatINR(sel.amount)],['Paid Amount',formatINR(sel.paid_amount)]].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'#9ca3af' }}>{k}:</span><span style={{ color:'#e2e8f0', fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Refund Amount (₹)</label>
              <input type="number" className="mc-input" value={refAmt} onChange={e => setRefAmt(e.target.value)} max={sel.paid_amount} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Reason for Refund</label>
              <select className="mc-select" value={refReason} onChange={e => setRefReason(e.target.value)}>
                <option value="">Select reason...</option>
                {REFUND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.15)', borderRadius:8, padding:12, fontSize:12, color:'#f87171', marginBottom:4 }}>
              ⚠️ This will mark {sel.invoice_no} as Refunded. This cannot be undone automatically.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20, paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button onClick={processRefund} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>↩ Process Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
