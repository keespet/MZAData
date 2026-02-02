import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { parseRelatiesZakelijkCsv } from '@/lib/csv/parse-relaties-zakelijk'
import { compareRelaties } from '@/lib/csv/parse-relaties-particulier'
import type { Relatie } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 })
    }

    // Use service client for database operations (bypasses RLS)
    const serviceClient = await createServiceClient()

    // Check role using service client
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'uploader'].includes(profile.role)) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = formData.get('fileName') as string || 'unknown.csv'

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 })
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const decoder = new TextDecoder('iso-8859-1')
    const csvContent = decoder.decode(arrayBuffer)

    // Parse CSV
    const { relaties: parsedRelaties, errors: parseErrors } = parseRelatiesZakelijkCsv(csvContent)

    if (parseErrors.length > 0) {
      console.error('CSV parse errors:', parseErrors)
    }

    // Get existing zakelijk relaties
    const { data: existingRelaties, error: fetchError } = await serviceClient
      .from('relaties')
      .select('*')
      .eq('relatie_type', 'zakelijk')

    if (fetchError) {
      throw new Error(`Fout bij ophalen bestaande relaties: ${fetchError.message}`)
    }

    // Compare and get changes
    const { nieuw, gewijzigd, verwijderd, ongewijzigd } = compareRelaties(
      (existingRelaties || []) as Relatie[],
      parsedRelaties
    )

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await serviceClient
      .from('sync_log')
      .insert({
        tabel_naam: 'relaties_zakelijk',
        bestand_naam: fileName,
        records_totaal: parsedRelaties.length,
        records_nieuw: nieuw.length,
        records_gewijzigd: gewijzigd.length,
        records_verwijderd: verwijderd.length,
        records_ongewijzigd: ongewijzigd.length,
        status: 'success',
        uitgevoerd_door: user.id,
      })
      .select()
      .single()

    if (syncLogError) {
      console.error('Sync log error:', syncLogError)
    }

    // Log individual changes
    if (syncLog) {
      const wijzigingen = [
        ...nieuw.map((r) => ({
          sync_id: syncLog.id,
          tabel_naam: 'relaties_zakelijk',
          record_id: r.id!,
          wijziging_type: 'nieuw',
          record_snapshot: r as unknown as Record<string, unknown>,
        })),
        ...gewijzigd.map((item) => ({
          sync_id: syncLog.id,
          tabel_naam: 'relaties_zakelijk',
          record_id: item.relatie.id!,
          wijziging_type: 'gewijzigd',
          veld_naam: item.changes.map((c) => c.field).join(', '),
          oude_waarde: item.changes.map((c) => String(c.old ?? '')).join(', '),
          nieuwe_waarde: item.changes.map((c) => String(c.new ?? '')).join(', '),
          record_snapshot: item.relatie as unknown as Record<string, unknown>,
        })),
        ...verwijderd.map((r) => ({
          sync_id: syncLog.id,
          tabel_naam: 'relaties_zakelijk',
          record_id: r.id,
          wijziging_type: 'verwijderd',
          record_snapshot: r as unknown as Record<string, unknown>,
        })),
      ]

      if (wijzigingen.length > 0) {
        await serviceClient.from('sync_wijzigingen').insert(wijzigingen)
      }
    }

    // Delete all existing zakelijk relaties
    const { error: deleteError } = await serviceClient
      .from('relaties')
      .delete()
      .eq('relatie_type', 'zakelijk')

    if (deleteError) {
      throw new Error(`Fout bij verwijderen oude relaties: ${deleteError.message}`)
    }

    // Insert new relaties in batches
    const BATCH_SIZE = 500
    for (let i = 0; i < parsedRelaties.length; i += BATCH_SIZE) {
      const batch = parsedRelaties.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await serviceClient.from('relaties').insert(batch)

      if (insertError) {
        throw new Error(`Fout bij invoegen relaties (batch ${i}): ${insertError.message}`)
      }
    }

    const duurSeconden = (Date.now() - startTime) / 1000

    // Update sync log with duration
    if (syncLog) {
      await serviceClient
        .from('sync_log')
        .update({ sync_duur_seconden: duurSeconden })
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      totaal: parsedRelaties.length,
      nieuw: nieuw.length,
      gewijzigd: gewijzigd.length,
      verwijderd: verwijderd.length,
      ongewijzigd: ongewijzigd.length,
      duur_seconden: duurSeconden,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
