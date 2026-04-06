/**
 * Dead Wax Records — Strategy & Operations Dashboard
 * Johnny Outlaw, LLC — Designed in Greenville, TX
 *
 * Route: /chi/mgmt
 * Access: controlled by public.app_user_allowlist (requires 'chi' in apps[])
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

  // ── Allowlist check ─────────────────────────────────────────────────────────
  // app_user_allowlist lives in public schema — use RPC (SECURITY DEFINER) to cross schemas
  const { data: hasAccess } = await supabase.rpc('check_user_allowlist', {
    p_email: user.email ?? '',
    p_app: 'chi',
  })

  if (!hasAccess) {
    redirect('/chi/login?error=unauthorized')
  }
  // ────────────────────────────────────────────────────────────────────────────

  const [
    { data: squareKpis },
    { data: squareSalesByDate },
    { data: squareCatalogByGenre },
    { data: inventoryKpis },
    { data: inventoryFlatFacts },
    { data: topCustomers },
    { data: customerStats },
    { data: igSummary },
    { data: igPosts },
    { data: igReachTrend },
    { data: fbSummary },
    { data: fbPosts },
    { data: salesByDow },
    { data: customerOrderHistory },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase.rpc('get_square_kpis'),
    supabase.rpc('get_square_sales_by_date', { days_back: 60 }),
    supabase.rpc('get_square_catalog_by_genre'),
    supabase.rpc('get_inventory_kpis'),
    supabase.rpc('get_inventory_flat_facts').limit(5000),
    supabase.rpc('get_mgmt_top_customers', { cust_limit: 20 }),
    supabase.rpc('get_mgmt_customer_stats'),
    supabase.rpc('get_mgmt_ig_summary'),
    supabase.rpc('get_mgmt_ig_posts', { post_limit: 50 }),
    supabase.rpc('get_mgmt_ig_reach_trend', { days_back: 30 }),
    supabase.rpc('get_mgmt_fb_summary'),
    supabase.rpc('get_mgmt_fb_posts', { post_limit: 50 }),
    supabase.rpc('get_mgmt_sales_by_dow'),
    supabase.rpc('get_mgmt_all_customer_orders', { p_customer_limit: 20 }),
    supabase.rpc('get_mgmt_inventory_items', { p_genre: '', p_page: 1, p_page_size: 500 }),
  ])

  return (
    <ManagementDashboardClient
      userEmail={user.email ?? ''}
      squareKpis={squareKpis ?? null}
      squareSalesByDate={squareSalesByDate ?? []}
      squareCatalogByGenre={squareCatalogByGenre ?? []}
      inventoryKpis={inventoryKpis?.[0] ?? null}
      inventoryFlatFacts={inventoryFlatFacts ?? []}
      topCustomers={topCustomers ?? []}
      customerStats={customerStats?.[0] ?? null}
      igSummary={igSummary?.[0] ?? null}
      igPosts={igPosts ?? []}
      igReachTrend={igReachTrend ?? []}
      fbSummary={fbSummary?.[0] ?? null}
      fbPosts={fbPosts ?? []}
      salesByDow={salesByDow ?? []}
      customerOrderHistory={customerOrderHistory ?? []}
      inventoryItems={inventoryItems ?? []}
    />
  )
}
