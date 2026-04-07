/**
 * Data Explorer — Page
 * Johnny Outlaw, LLC — Designed in Greenville, TX
 *
 * Route: /explorer
 * Access: johnnyoutlawllc@gmail.com only
 *
 * Admin-only Supabase explorer — SELECT queries across all schemas.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExplorerClient from './ExplorerClient'

const ADMIN_EMAIL = 'johnnyoutlawllc@gmail.com'

export const metadata = {
  title: 'Data Explorer — Dead Wax Records',
  description: 'Admin-only Supabase explorer for Dead Wax Records infrastructure',
}

export default async function ExplorerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/chi/login?next=/explorer')
  if (user.email !== ADMIN_EMAIL) redirect('/')

  return <ExplorerClient userEmail={user.email ?? ''} />
}
