// Dead Wax Records — Supabase sign-out handler
// Johnny Outlaw, LLC — Designed in Rockwall, TX
//
// Standard Outlaw pattern: server-side sign-out via POST.
// See: Dead Wax Records/GOOGLE-AUTH.md

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/chi/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.outlawapps.online'))
}
