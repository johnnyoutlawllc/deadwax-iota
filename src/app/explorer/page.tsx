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
  title: 'Data Explorer — Outlaw Apps',
  description: 'Admin-only Supabase explorer for Outlaw Apps infrastructure',
}

export default async function ExplorerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/chi/login?next=/explorer')
  if (user.email !== ADMIN_EMAIL) redirect('/')

  return <ExplorerClient userEmail={user.email ?? ''} />
}
