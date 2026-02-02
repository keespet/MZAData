import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { MutatieChart } from '@/components/dashboard/MutatieChart'
import { RecentImports } from '@/components/dashboard/RecentImports'
import { BrancheChart } from '@/components/dashboard/BrancheChart'
import { QuickLinks } from '@/components/dashboard/QuickLinks'
import type { DashboardStats, MutatiesPerDag, SyncLog, PolissenPerBranche } from '@/lib/types/database'

async function getDashboardData() {
  const supabase = await createClient()

  // Get user role
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: 'admin' | 'uploader' | 'user' = 'user'
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile && 'role' in profile) {
      userRole = (profile as { role: 'admin' | 'uploader' | 'user' }).role || 'user'
    }
  }

  // Get dashboard stats
  const { data: statsData } = await supabase
    .from('dashboard_stats')
    .select('*')
    .single()

  // Get mutaties per dag
  const { data: mutatiesData } = await supabase
    .from('mutaties_per_dag')
    .select('*')
    .order('datum', { ascending: true })

  // Get recent imports
  const { data: importsData } = await supabase
    .from('sync_log')
    .select('*')
    .order('sync_datum', { ascending: false })
    .limit(5)

  // Get polissen per branche
  const { data: brancheData } = await supabase
    .from('polissen_per_branche')
    .select('*')

  return {
    userRole,
    stats: statsData as DashboardStats | null,
    mutaties: (mutatiesData || []) as MutatiesPerDag[],
    imports: (importsData || []) as SyncLog[],
    branches: (brancheData || []) as PolissenPerBranche[],
  }
}

export default async function DashboardPage() {
  const { userRole, stats, mutaties, imports, branches } = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Quick Links */}
      <QuickLinks userRole={userRole} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MutatieChart data={mutaties} />
        <BrancheChart data={branches} />
      </div>

      {/* Recent Imports */}
      <RecentImports imports={imports} />
    </div>
  )
}
