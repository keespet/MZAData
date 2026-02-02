import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parsePolissenCsv } from '@/lib/csv/parse-polissen'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Niet geauthenticeerd' }, { status: 401 })
    }

    // Check role
    const { data: profile } = await supabase
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
    const { polissen, dekkingen, pakketten, errors: parseErrors } = parsePolissenCsv(csvContent)

    if (parseErrors.length > 0) {
      console.error('CSV parse errors:', parseErrors)
    }

    // Get existing counts for comparison
    const { count: existingPolissenCount } = await supabase
      .from('polissen')
      .select('*', { count: 'exact', head: true })

    const existingCount = existingPolissenCount || 0
    const newCount = polissen.length

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_log')
      .insert({
        tabel_naam: 'polissen',
        bestand_naam: fileName,
        records_totaal: newCount,
        records_nieuw: newCount > existingCount ? newCount - existingCount : 0,
        records_gewijzigd: Math.min(newCount, existingCount),
        records_verwijderd: existingCount > newCount ? existingCount - newCount : 0,
        records_ongewijzigd: 0,
        status: 'success',
        uitgevoerd_door: user.id,
      })
      .select()
      .single()

    if (syncLogError) {
      console.error('Sync log error:', syncLogError)
    }

    // Delete existing data (in correct order due to foreign keys)
    await supabase.from('polis_dekkingen').delete().neq('id', 0)
    await supabase.from('polissen').delete().neq('id', '')
    await supabase.from('pakketten').delete().neq('id', '')

    // Insert pakketten first (polissen reference them)
    const BATCH_SIZE = 500

    if (pakketten.length > 0) {
      for (let i = 0; i < pakketten.length; i += BATCH_SIZE) {
        const batch = pakketten.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await supabase.from('pakketten').insert(batch)
        if (insertError) {
          console.error(`Pakket insert error (batch ${i}):`, insertError)
        }
      }
    }

    // Insert polissen
    for (let i = 0; i < polissen.length; i += BATCH_SIZE) {
      const batch = polissen.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from('polissen').insert(batch)
      if (insertError) {
        throw new Error(`Fout bij invoegen polissen (batch ${i}): ${insertError.message}`)
      }
    }

    // Insert dekkingen
    if (dekkingen.length > 0) {
      for (let i = 0; i < dekkingen.length; i += BATCH_SIZE) {
        const batch = dekkingen.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await supabase.from('polis_dekkingen').insert(batch)
        if (insertError) {
          console.error(`Dekking insert error (batch ${i}):`, insertError)
        }
      }
    }

    const duurSeconden = (Date.now() - startTime) / 1000

    // Update sync log with duration
    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({ sync_duur_seconden: duurSeconden })
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      totaal: polissen.length,
      nieuw: newCount > existingCount ? newCount - existingCount : 0,
      gewijzigd: Math.min(newCount, existingCount),
      verwijderd: existingCount > newCount ? existingCount - newCount : 0,
      ongewijzigd: 0,
      duur_seconden: duurSeconden,
      pakketten: pakketten.length,
      dekkingen: dekkingen.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
