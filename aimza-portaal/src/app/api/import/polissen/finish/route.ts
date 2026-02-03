import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Get finish data from request body
    const { syncId, totals, fileName, duurSeconden } = await request.json() as {
      syncId: string
      totals: {
        polissen: number
        dekkingen: number
        pakketten: number
      }
      fileName: string
      duurSeconden: number
    }

    if (!syncId) {
      return NextResponse.json({ error: 'Geen syncId ontvangen' }, { status: 400 })
    }

    const totalRecords = totals.polissen + totals.dekkingen + totals.pakketten

    // Update sync log
    const { error: updateError } = await serviceClient
      .from('sync_log')
      .update({
        bestand_naam: fileName,
        records_totaal: totalRecords,
        records_nieuw: totalRecords,
        status: 'success',
        sync_duur_seconden: duurSeconden,
      })
      .eq('id', syncId)

    if (updateError) {
      throw new Error(`Fout bij updaten sync log: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      totals,
    })
  } catch (error) {
    console.error('Finish import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
