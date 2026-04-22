'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, formatINR } from '@/lib/supabase'
import Toast from '@/components/ui/Toast'

const EMPTY = { name:'', supplier:'', stock:'0', min_stock:'5', price:'0' }

export default function InventoryPage() {
  const [parts,   setParts]  = useState<any[]>([])
  const [loading, setLoading]= useState(true)
  const [modal,   setModal]  = useState(false)
  const [editPart,setEditPart]=useState<any>(null)
  const [form,    setForm]   = useState<any>(EMPTY)
  const [toast,   setToast]  = useState<any>(null)
  const [saving,  setSaving] = useState(false)
  const [restock, setRestock]= useState<{id:number,qty:string}|null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('inventory').select('*').order('name')
    setParts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setEditPart(null); setForm(EMPTY); setModal(true) }
  function openEdit(p:any) { setEditPart(p); setForm({ name:p.name, supplier:p.supplier||'', stock:String(p.stock), min_stock:String(p.min_stock), price:String(p.price) }); setModal(true) }

  async function save() {
    if (!form.name) { setToast({msg:'Part name required.',type:'error'}); return }
    setSaving(true)
    const payload = { name:form.name, supplier:form.supplier, stock:Number(form.stock)||0, min_stock:Number(form.min_stock)||5, price:Number(form.price)||0 }
    const { error } = editPart
      ? await supabase.from('inventory').update(payload).eq('id', editPart.id)
      : await supabase.from('inventory').insert(payload)
    setSaving(false)
    if (error) { setToast({msg:'Error: '+error.message,type:'error'}); return }
    setToast({msg: editPart ? 'Part updated!' : 'Part added!', type:'success'})
    setModal(false); load()
  }

  async function doRestock() {
    if (!restock) return
    const qty = Number(restock.qty) || 0
    const part = parts.find(p => p.id === restock.id)
    if (!part) return
    await supabase.from('inventory').update({ stock: part.stock + qty }).eq('id', restock.id)
    setToast({msg:`+${qty} units added to stock.`, type:'success'})
    setRestock(null); load()
  }

  async function deletePart(id:number) {
    if (!confirm('Delete this part?')) return
    await supabase.from('inventory').delete().eq('id', id)
    setToast({msg:'Part deleted.',type:'success'}); load()
  }

  const low = parts.filter(p => p.stock < p.min_stock)
  function F(k:string) { return (v:string) => setForm((p:any)=>({...p,[k]:v})) }

  return (
    <div style={{ padding:'28px 32px' }} className="animate-fadeUp">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#f1f5f9' }}>Inventory</div>
          <div style={{ fontSize:13, color:'#4b5563', marginTop:4 }}>{parts.length} parts · {low.length} low stock</div>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Add Part</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Parts',   value:String(parts.length),                                                         color:'#e2e8f0', accent:'blue'   },
          { label:'Low Stock',     value:String(low.length),                                                            color:'#f87171', accent:'red'    },
          { label:'Total Value',   value:formatINR(parts.reduce((a,b)=>a+b.stock*b.price,0)),                           color:'#fbbf24', accent:'amber'  },
          { label:'Units Sold',    value:parts.reduce((a,b)=>a+(b.units_sold||0),0).toLocaleString(),                   color:'#4ade80', accent:'green'  },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent}`}>
            <div style={{ fontSize:11, color:'#4b5563', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {low.length > 0 && (
        <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, padding:'10px 16px', marginBottom:16, fontSize:13, color:'#f87171', display:'flex', alignItems:'center', gap:8 }}>
          ⚠️ Low stock: {low.map(p=>p.name).join(', ')}
        </div>
      )}

      {/* Table */}
      <div className="mc-card" style={{ padding:0 }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Loading...</div> : (
          <table className="mc-table">
            <thead>
              <tr>{['Part Name','Supplier','In Stock','Min Stock','Unit Price','Stock Value','Units Sold','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ color:'#9ca3af' }}>{p.supplier||'—'}</td>
                  <td><span style={{ color: p.stock < p.min_stock ? '#f87171' : '#4ade80', fontWeight:700, fontSize:15 }}>{p.stock}</span></td>
                  <td style={{ color:'#6b7280' }}>{p.min_stock}</td>
                  <td>{formatINR(p.price)}</td>
                  <td style={{ color:'#fbbf24' }}>{formatINR(p.stock*p.price)}</td>
                  <td style={{ color:'#e2e8f0' }}>{p.units_sold||0}</td>
                  <td>
                    {p.stock < p.min_stock
                      ? <span className="badge badge-low">Low Stock</span>
                      : <span className="badge badge-ok">OK</span>}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn-success btn-sm" onClick={() => setRestock({id:p.id,qty:'10'})}>+Stock</button>
                      <button className="btn-ghost btn-sm"   onClick={() => openEdit(p)}>✏</button>
                      <button className="btn-danger btn-sm"  onClick={() => deletePart(p.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setModal(false)}>
          <div className="mc-modal" style={{ width:460 }}>
            <h3>{editPart ? 'Edit Part' : 'Add New Part'}</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Part Name *</label>
              <input className="mc-input" value={form.name} onChange={e => F('name')(e.target.value)} placeholder="e.g. Engine Oil Filter" />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Supplier</label>
              <input className="mc-input" value={form.supplier} onChange={e => F('supplier')(e.target.value)} placeholder="Bosch, Castrol..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
              {[['Stock Qty','stock'],['Min Alert','min_stock'],['Price (₹)','price']].map(([l,k])=>(
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</label>
                  <input type="number" className="mc-input" value={form[k]} onChange={e => F(k)(e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid #141926' }}>
              <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':editPart?'Update Part':'Add Part'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Restock modal */}
      {restock && (
        <div className="mc-modal-overlay" onClick={e => e.currentTarget===e.target && setRestock(null)}>
          <div className="mc-modal" style={{ width:360 }}>
            <h3>Restock — {parts.find(p=>p.id===restock.id)?.name}</h3>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Quantity to Add</label>
              <input type="number" className="mc-input" value={restock.qty} onChange={e => setRestock({...restock, qty:e.target.value})} />
            </div>
            <div style={{ background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#4ade80', marginBottom:14 }}>
              New stock: {(parts.find(p=>p.id===restock.id)?.stock||0) + (Number(restock.qty)||0)} units
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" onClick={() => setRestock(null)}>Cancel</button>
              <button className="btn-success" onClick={doRestock}>+ Add Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
