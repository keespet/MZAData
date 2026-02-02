'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Users,
  FileText,
  History,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import type { UserRole } from '@/lib/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload, roles: ['admin', 'uploader'] },
  { href: '/relaties', label: 'Relaties', icon: Users },
  { href: '/polissen', label: 'Polissen', icon: FileText },
  { href: '/mutaties', label: 'Mutaties', icon: History },
  { href: '/gebruikers', label: 'Gebruikers', icon: UserCog, roles: ['admin'] },
]

interface SidebarProps {
  userEmail: string
  userRole: UserRole
  onSignOut: () => void
}

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  )
}

function SidebarContent({
  userEmail,
  userRole,
  onSignOut,
  onLinkClick,
}: SidebarProps & { onLinkClick?: () => void }) {
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    uploader: 'Uploader',
    user: 'Gebruiker',
  }

  const roleBadgeVariants: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    uploader: 'secondary',
    user: 'outline',
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold text-gray-900">Aimza</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* User info */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {userEmail}
            </p>
            <Badge variant={roleBadgeVariants[userRole]} className="mt-1">
              {roleLabels[userRole]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            className="ml-2 text-gray-500 hover:text-gray-700"
            title="Uitloggen"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ userEmail, userRole, onSignOut }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            userEmail={userEmail}
            userRole={userRole}
            onSignOut={onSignOut}
            onLinkClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:border-r lg:bg-white">
        <SidebarContent
          userEmail={userEmail}
          userRole={userRole}
          onSignOut={onSignOut}
        />
      </aside>
    </>
  )
}
