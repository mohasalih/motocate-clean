import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations
export function getServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  })
}

// Interval logic matching your PHP system
export const SERVICE_INTERVALS: Record<string, number> = {
  'Bike': 45,
  'Car': 75,
  'Heavy Vehicle': 30,
}

export function calcNextServiceDate(serviceDate: string, vehicleType: string): string {
  const interval = SERVICE_INTERVALS[vehicleType] ?? 45
  const d = new Date(serviceDate)
  d.setDate(d.getDate() + interval)
  return d.toISOString().split('T')[0]
}

export function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

export function formatINR(amount: number): string {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const full = digits.length === 10 ? '91' + digits : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`
}
