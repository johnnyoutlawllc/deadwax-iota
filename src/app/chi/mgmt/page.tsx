/**
 * Dead Wax Records — Strategy & Operations Dashboard
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Route: /chi/mgmt
 * Access: Auth-gated (same as /chi)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ManagementDashboardClient from './ManagementDashboardClient'

export const metadata = {
  title: 'Dead Wax Records — Strategy Dashboard',
  description: 'Role-based strategy & operations dashboard for Dead Wax Records',
}

export default async function MgmtPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/chi/login')

  return <ManagementDashboardClient userEmail={user.email ?? ''} />
}
