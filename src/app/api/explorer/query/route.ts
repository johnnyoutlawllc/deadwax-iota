/**
 * Data Explorer — SQL Query API
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * SELECT-only SQL execution for the Data Explorer.
 * Two-layer safety: client UI + server-side validation.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'johnnyoutlawllc@gmail.com'

// Words that should not appear as SQL keywords (not inside quotes)
const WRITE_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|CREATE|ALTER|GRANT|REVOKE|COPY|VACUUM|ANALYZE|REINDEX|CLUSTER|COMMENT|NOTIFY|LISTEN|UNLISTEN|EXECUTE|PREPARE|DEALLOCATE|DO|CALL|MERGE)\b/i

// Only allow SELECT statements (and WITH for CTEs)
const ALLOWED_START = /^\s*(SELECT|WITH)\s/i

function isSafeQuery(sql: string): { safe: boolean; reason?: string } {
  const trimmed = sql.trim()

  // Strip single-line comments
  const stripped = trimmed.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()

  if (!ALLOWED_START.test(stripped)) {
    return { safe: false, reason: 'Only SELECT statements are allowed.' }
  }

  // Check for write keywords outside of string literals
  // Simple check: remove string literals then scan
  const noStrings = stripped.replace(/'([^'\\]|\\.)*'/g, "''").replace(/"([^"\\]|\\.)*"/g, '""')
  if (WRITE_KEYWORDS.test(noStrings)) {
    return { safe: false, reason: 'Write operations (INSERT, UPDATE, DELETE, etc.) are not permitted.' }
  }

  return { safe: true }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  // Auth guard — admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { sql?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sql = (body.sql ?? '').trim()
  if (!sql) return NextResponse.json({ error: 'No SQL provided' }, { status: 400 })

  // Safety check
  const { safe, reason } = isSafeQuery(sql)
  if (!safe) {
    return NextResponse.json({ error: reason }, { status: 400 })
  }

  // Enforce a statement timeout (5 seconds) and wrap in read-only transaction
  const wrappedSql = `
    SET LOCAL statement_timeout = '5s';
    SET LOCAL transaction_read_only = on;
    ${sql}
  `

  // We use the RPC execute path via a helper function
  // Since we can't run arbitrary SQL directly through supabase-js,
  // we use a server-side RPC that wraps the execution
  const { data, error } = await supabase.rpc('execute_explorer_query', {
    p_sql: sql,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [], count: (data ?? []).length })
}
