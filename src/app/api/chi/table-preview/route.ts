// Dead Wax Records — Table Preview API
// Johnny Outlaw, LLC — Designed in Greenville, TX
//
// Returns up to 100 rows + column metadata for any allowed table.
// Used by the Database tab TableViewer.

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_SCHEMAS = ['outlaw_data', 'johnny_outlaw']

export async function GET(request: Request) {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schema  = searchParams.get('schema')  ?? 'outlaw_data'
  const table   = searchParams.get('table')   ?? ''
  const sortCol = searchParams.get('sort')    ?? null
  const sortDir = searchParams.get('dir')     ?? 'asc'
  const limitRaw = parseInt(searchParams.get('limit') ?? '100', 10)
  const limit   = isNaN(limitRaw) ? 100 : Math.min(Math.max(limitRaw, 1), 10000)

  if (!ALLOWED_SCHEMAS.includes(schema)) {
    return NextResponse.json({ error: 'Schema not allowed' }, { status: 400 })
  }
  if (!table) {
    return NextResponse.json({ error: 'Table name required' }, { status: 400 })
  }

  const [{ data: rows, error: rowsErr }, { data: columns, error: colsErr }] = await Promise.all([
    supabase.rpc('get_table_preview', {
      p_schema:   schema,
      p_table:    table,
      p_sort_col: sortCol,
      p_sort_dir: sortDir,
      p_limit:    limit,
    }),
    supabase.rpc('get_table_columns', {
      p_schema: schema,
      p_table:  table,
    }),
  ])

  if (rowsErr || colsErr) {
    return NextResponse.json({ error: rowsErr?.message ?? colsErr?.message }, { status: 500 })
  }

  return NextResponse.json({ rows: rows ?? [], columns: columns ?? [] })
}
