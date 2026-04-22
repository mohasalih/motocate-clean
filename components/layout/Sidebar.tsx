'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',   icon: '⚡', label: 'Dashboard'    },
  { href: '/jobs',        icon: '🔧', label: 'Service Jobs' },
  { href: '/invoices',    icon: '🧾', label: 'Invoices'     },
  { href: '/customers',   icon: '👥', label: 'Customers'    },
  { href: '/accounting',  icon: '📊', label: 'Accounting'   },
  { href: '/inventory',   icon: '📦', label: 'Inventory'    },
  { href: '/mechanics',   icon: '👨‍🔧', label: 'Mechanics'    },
  { href: '/reminders',   icon: '🔔', label: 'Reminders'    },
  { href: '/inspection',  icon: '🔍', label: 'Inspection'   },
  { href: '/bookings',    icon: '📅', label: 'Bookings'     },
  { href: '/settings',    icon: '⚙️', label: 'Settings'     },
]

export default function Sidebar() {
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      background: '#0a0c10',
      borderRight: '1px solid #141926',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width .3s',
      overflow: 'hidden',
      height: '100vh',
    }}>
      {/* Brand */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid #141926', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, boxShadow: '0 0 16px rgba(249,115,22,.3)' }}>
          ⚙
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>MOTO CARE</div>
            <div style={{ fontSize: 9, color: '#374151', letterSpacing: '2px', whiteSpace: 'nowrap' }}>PRO SYSTEM</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${path.startsWith(item.href) ? ' active' : ''}`}
          >
            <span style={{ fontSize: 15, flexShrink: 0, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #141926', flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #1e2535', borderRadius: 6, color: '#4b5563', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Sans',sans-serif", transition: 'all .2s' }}
        >
          {collapsed ? '→' : '← Collapse'}
        </button>
      </div>
    </aside>
  )
}
