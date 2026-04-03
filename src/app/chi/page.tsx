/**
 * Dead Wax Records — Management Dashboard
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
  description: 'Management dashboard for Dead Wax Records',
}

export default async function ChiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/chi/login')

  const [
    { data: squareSummary },
    { data: squareTopItems },
    { data: recentPayments },
    { data: instagramMedia },
    { data: instagramAccount },
    { data: instagramDemographics },
    { data: facebookPosts },
    { data: dbStats },
    { data: columnProfiles },
    { data: catalogOverview },
    { data: enrichmentStats },
    { data: enrichmentSample },
    { data: squareKpis },
    { data: squareSalesByDate },
    { data: squareSalesByFormat },
    { data: squareSalesByCondition },
    { data: squareCatalogByGenre },
    { data: squareInventoryByYear },
    { data: squareFlatFacts },
  ] = await Promise.all([
    supabase.rpc('get_square_summary'),

    supabase.rpc('get_square_top_items', { item_limit: 10 }),

    supabase
      .schema('outlaw_data')
      .from('square_payments')
      .select('payment_id, amount_money, total_money, tip_money, source_type, created_at, status, card_brand, last_4, note')
      .order('created_at', { ascending: false })
      .limit(15),

    supabase.rpc('get_instagram_media_insights', { media_limit: 27 }),

    supabase
      .schema('outlaw_data')
      .from('instagram_account_history')
      .select('*')
      .order('updated', { ascending: false })
      .limit(1),

    supabase
      .schema('outlaw_data')
      .from('instagram_demographics')
      .select('*'),

    supabase.rpc('get_facebook_posts_with_metrics'),

    supabase.rpc('get_db_stats'),
    supabase.rpc('get_all_column_profiles'),
    supabase.rpc('get_catalog_overview'),
    supabase.rpc('get_enrichment_stats'),
    supabase.rpc('get_enrichment_sample', { sample_limit: 50 }),
    supabase.rpc('get_square_kpis'),
    supabase.rpc('get_square_sales_by_date', { days_back: 60 }),
    supabase.rpc('get_square_sales_by_format'),
    supabase.rpc('get_square_sales_by_condition'),
    supabase.rpc('get_square_catalog_by_genre'),
    supabase.rpc('get_square_inventory_by_year'),
    supabase.rpc('get_square_flat_facts'),
  ])

  return (
    <DeadWaxClient
      squareSummary={squareSummary ?? null}
      squareTopItems={squareTopItems ?? []}
      recentPayments={recentPayments ?? []}
      instagramMedia={instagramMedia ?? []}
      instagramAccount={instagramAccount?.[0] ?? null}
      instagramDemographics={instagramDemographics ?? []}
      facebookPosts={facebookPosts ?? []}
      dbStats={dbStats ?? []}
      columnProfiles={columnProfiles ?? []}
      catalogOverview={catalogOverview ?? null}
      enrichmentStats={enrichmentStats ?? null}
      enrichmentSample={enrichmentSample ?? []}
      squareKpis={squareKpis ?? null}
      squareSalesByDate={squareSalesByDate ?? []}
      squareSalesByFormat={squareSalesByFormat ?? []}
      squareSalesByCondition={squareSalesByCondition ?? []}
      squareCatalogByGenre={squareCatalogByGenre ?? []}
      squareInventoryByYear={squareInventoryByYear ?? []}
      squareFlatFacts={squareFlatFacts ?? []}
      userEmail={user.email ?? ''}
    />
  )
}
