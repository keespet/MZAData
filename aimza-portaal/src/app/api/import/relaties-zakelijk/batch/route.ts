import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Relatie } from '@/lib/types/database'

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
    const { records, syncId } = await request.json() as {
      records: Partial<Relatie>[]
      syncId: string
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Geen records ontvangen' }, { status: 400 })
    }

    if (!syncId) {
      return NextResponse.json({ error: 'Geen syncId ontvangen' }, { status: 400 })
    }

    // Add relatie_type to all records
    const recordsWithType = records.map(r => ({
      ...r,
      relatie_type: 'zakelijk' as const,
    }))

    // Insert batch
    const { error: insertError } = await serviceClient
      .from('relaties')
      .insert(recordsWithType)

    if (insertError) {
      throw new Error(`Fout bij invoegen batch: ${insertError.message}`)
    }

    return NextResponse.json({
      success: true,
      inserted: records.length,
    })
  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onbekende fout' },
      { status: 500 }
    )
  }
}
