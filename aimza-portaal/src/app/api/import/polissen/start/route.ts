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

    // Get counts of existing records
    const { count: polissenCount } = await serviceClient
      .from('polissen')
      .select('*', { count: 'exact', head: true })

    const { count: dekkingenCount } = await serviceClient
      .from('polis_dekkingen')
      .select('*', { count: 'exact', head: true })

    const { count: pakkettenCount } = await serviceClient
      .from('pakketten')
      .select('*', { count: 'exact', head: true })

    // Delete in correct order (dekkingen first due to foreign keys)
    const { error: deleteDekkingen } = await serviceClient
      .from('polis_dekkingen')
      .delete()
      .gte('id', 0) // Delete all

    if (deleteDekkingen) {
      throw new Error(`Fout bij verwijderen dekkingen: ${deleteDekkingen.message}`)
    }

    const { error: deletePolissen } = await serviceClient
      .from('polissen')
      .delete()
      .gte('id', 0) // Delete all

    if (deletePolissen) {
      throw new Error(`Fout bij verwijderen polissen: ${deletePolissen.message}`)
    }

    const { error: deletePakketten } = await serviceClient
      .from('pakketten')
      .delete()
      .gte('id', 0) // Delete all

    if (deletePakketten) {
      throw new Error(`Fout bij verwijderen pakketten: ${deletePakketten.message}`)
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await serviceClient
      .from('sync_log')
      .insert({
        tabel_naam: 'polissen',
        bestand_naam: 'batch-import',
        records_totaal: 0,
        records_nieuw: 0,
        records_gewijzigd: 0,
        records_verwijderd: (polissenCount || 0) + (dekkingenCount || 0) + (pakkettenCount || 0),
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
      deletedCount: {
        polissen: polissenCount || 0,
        dekkingen: dekkingenCount || 0,
        pakketten: pakkettenCount || 0,
      },
    })
  } catch (error) {
    console.error('Start import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
