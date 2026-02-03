import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Polis, PolisDekking, Pakket } from '@/lib/types/database'

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

    // Get batch data from request body
    const { polissen, dekkingen, pakketten, syncId } = await request.json() as {
      polissen: Partial<Polis>[]
      dekkingen: Partial<PolisDekking>[]
      pakketten: Partial<Pakket>[]
      syncId: string
    }

    if (!syncId) {
      return NextResponse.json({ error: 'Geen syncId ontvangen' }, { status: 400 })
    }

    let insertedPolissen = 0
    let insertedDekkingen = 0
    let insertedPakketten = 0

    // Insert pakketten first (no dependencies)
    if (pakketten && pakketten.length > 0) {
      const { error: pakketError } = await serviceClient
        .from('pakketten')
        .upsert(pakketten, { onConflict: 'id' })

      if (pakketError) {
        throw new Error(`Fout bij invoegen pakketten: ${pakketError.message}`)
      }
      insertedPakketten = pakketten.length
    }

    // Insert polissen
    if (polissen && polissen.length > 0) {
      const { error: polisError } = await serviceClient
        .from('polissen')
        .upsert(polissen, { onConflict: 'id' })

      if (polisError) {
        throw new Error(`Fout bij invoegen polissen: ${polisError.message}`)
      }
      insertedPolissen = polissen.length
    }

    // Insert dekkingen last (depends on polissen)
    if (dekkingen && dekkingen.length > 0) {
      const { error: dekkingError } = await serviceClient
        .from('polis_dekkingen')
        .insert(dekkingen)

      if (dekkingError) {
        throw new Error(`Fout bij invoegen dekkingen: ${dekkingError.message}`)
      }
      insertedDekkingen = dekkingen.length
    }

    return NextResponse.json({
      success: true,
      inserted: {
        polissen: insertedPolissen,
        dekkingen: insertedDekkingen,
        pakketten: insertedPakketten,
      },
    })
  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
