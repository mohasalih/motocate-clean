import { supabase } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const [jobsRes, invoicesRes, partsRes, customersRes] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    supabase.from('inventory').select('*'),
    supabase.from('customers').select('*'),
  ])

  return (
    <DashboardClient
      jobs={jobsRes.data ?? []}
      invoices={invoicesRes.data ?? []}
      parts={partsRes.data ?? []}
      customers={customersRes.data ?? []}
    />
  )
}
