// Dead Wax Records — Supabase auth callback handler
// Johnny Outlaw, LLC — Designed in Rockwall, TX
//
// Standard Outlaw pattern: exchanges the OAuth/magic-link code for a session,
// then redirects to `next` (defaults to /chi).
// See: Dead Wax Records/GOOGLE-AUTH.md

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chi'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/chi/login?error=auth_failed`)
}
