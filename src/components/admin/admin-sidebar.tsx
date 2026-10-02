'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, ShoppingCart, MapPin, Package, Settings, Home, Users, Boxes } from 'lucide-react'
import Image from 'next/image'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin-dashboard', icon: <Home className="h-5 w-5" /> },
  { label: 'Menu Editor', href: '/admin-dashboard/menu', icon: <Package className="h-5 w-5" /> },
  { label: 'Kitchen Accounts', href: '/admin-dashboard/kitchens', icon: <Users className="h-5 w-5" /> },
  { label: 'Inventory', href: '/admin-dashboard/inventory', icon: <Boxes className="h-5 w-5" /> },
  { label: 'Profit Calculator', href: '/admin-dashboard/calculator', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Help', href: '/admin-dashboard/help', icon: <Settings className="h-5 w-5" /> },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col min-h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-full bg-accent flex items-center justify-center">
            <Image src="/chef-logo-removebg-preview.png" alt="Logo" fill className="object-cover p-1" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-accent text-lg">Pizza Master G</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = item.href === '/admin-dashboard' 
            ? pathname === '/admin-dashboard' 
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs font-semibold text-accent mb-1">Online Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
