import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DashboardLayoutClient } from './layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use service client to bypass RLS for profile operations
  const serviceClient = await createServiceClient()

  // Try to get existing profile
  let { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists, create one automatically
  if (!profile) {
    const { data: newProfile, error: insertError } = await serviceClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        naam: user.user_metadata?.naam || '',
        role: 'user',
        actief: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create profile:', insertError)
      redirect('/login?error=profile_creation_failed')
    }

    profile = newProfile
  }

  if (!profile) {
    redirect('/login?error=no_profile')
  }

  return (
    <DashboardLayoutClient
      userEmail={user.email || ''}
      userName={profile.naam}
      userRole={profile.role}
    >
      {children}
    </DashboardLayoutClient>
  )
}
