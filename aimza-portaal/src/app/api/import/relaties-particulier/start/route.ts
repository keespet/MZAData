import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 })
    }

    // Use service client for database operations (bypasses RLS)
    const serviceClient = await createServiceClient()

    // Check role
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'uploader'].includes(profile.role)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Get count of existing records for comparison
    const { count: existingCount } = await serviceClient
      .from('relaties')
      .select('*', { count: 'exact', head: true })
      .eq('relatie_type', 'particulier')

    // Delete all existing particulier relaties
    const { error: deleteError } = await serviceClient
      .from('relaties')
      .delete()
      .eq('relatie_type', 'particulier')

    if (deleteError) {
      throw new Error(`Fout bij verwijderen oude relaties: ${deleteError.message}`)
    }

    // Create sync log entry (will be updated in finish)
    const { data: syncLog, error: syncLogError } = await serviceClient
      .from('sync_log')
      .insert({
        tabel_naam: 'relaties_particulier',
        bestand_naam: 'batch-import',
        records_totaal: 0,
        records_nieuw: 0,
        records_gewijzigd: 0,
        records_verwijderd: existingCount || 0,
        records_ongewijzigd: 0,
        status: 'processing',
        uitgevoerd_door: user.id,
      })
      .select()
      .single()

    if (syncLogError) {
      throw new Error(`Fout bij aanmaken sync log: ${syncLogError.message}`)
    }

    return NextResponse.json({
      success: true,
      syncId: syncLog.id,
      deletedCount: existingCount || 0,
    })
  } catch (error) {
    console.error('Start import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
