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
  let serviceClient
  try {
    serviceClient = await createServiceClient()
  } catch (e) {
    console.error('Failed to create service client:', e)
    // Service client failed - likely missing SUPABASE_SERVICE_ROLE_KEY
    // Sign out and redirect with error
    await supabase.auth.signOut()
    redirect('/login?error=profile_creation_failed')
  }

  // Try to get existing profile
  let { data: profile, error: fetchError } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists, create one automatically
  if (!profile && !fetchError?.message?.includes('multiple')) {
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
      // Sign out to prevent redirect loop, then redirect with error
      await supabase.auth.signOut()
      redirect('/login?error=profile_creation_failed')
    }

    profile = newProfile
  }

  if (!profile) {
    console.error('No profile found and could not create one')
    await supabase.auth.signOut()
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
