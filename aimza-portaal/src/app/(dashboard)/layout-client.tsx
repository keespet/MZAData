'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import type { UserRole } from '@/lib/types/database'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userEmail: string
  userName: string | null
  userRole: UserRole
}

export function DashboardLayoutClient({
  children,
  userEmail,
  userName,
  userRole,
}: DashboardLayoutClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        userEmail={userEmail}
        userRole={userRole}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-64">
        <Header />

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
