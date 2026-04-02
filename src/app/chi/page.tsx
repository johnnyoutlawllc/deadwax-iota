/**
 * Dead Wax Records — Channel Health Index Dashboard
 * Johnny Outlaw, LLC — Designed in Rockwall, TX
 *
 * Route: /chi
 * Access: johnnyoutlawllc@gmail.com only (enforced via middleware.ts)
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DeadWaxClient from './DeadWaxClient'

export const metadata = {
  title: 'Dead Wax Records — Dashboard',
  description: 'Inventory & social media management for Dead Wax Records',
}

export default async function ChiPage() {
  const supabase = await createClient()

  // Double-check auth server-side (middleware.ts is the primary guard)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/chi/login')

  // Fetch all dashboard data in parallel
  const [
    { data: accountHistory },
    { data: recentInsights },
    { data: recentMedia },
    { data: catalogItems, count: catalogCount },
    { data: recentPayments },
    { data: dbStats },
  ] = await Promise.all([
    supabase
      .schema('outlaw_data')
      .from('instagram_account_history')
      .select('*')
      .order('updated', { ascending: false })
      .limit(2),

    supabase
      .schema('outlaw_data')
      .from('instagram_insights')
      .select('*')
      .eq('metric', 'reach')
      .order('date', { ascending: false })
      .limit(7),

    supabase
      .schema('outlaw_data')
      .from('instagram_media')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(6),

    supabase
      .schema('outlaw_data')
      .from('square_catalog_items')
      .select('catalog_object_id, name, description, is_archived, updated_at', { count: 'exact' })
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(100),

    supabase
      .schema('outlaw_data')
      .from('square_payments')
      .select('payment_id, amount_money, total_money, source_type, created_at, status, card_brand, last_4')
      .order('created_at', { ascending: false })
      .limit(10),

    supabase.rpc('get_db_stats'),
  ])

  return (
    <DeadWaxClient
      accountHistory={accountHistory ?? []}
      recentInsights={recentInsights ?? []}
      recentMedia={recentMedia ?? []}
      catalogItems={catalogItems ?? []}
      catalogCount={catalogCount ?? 0}
      recentPayments={recentPayments ?? []}
      dbStats={dbStats ?? []}
      userEmail={user.email ?? ''}
    />
  )
}
