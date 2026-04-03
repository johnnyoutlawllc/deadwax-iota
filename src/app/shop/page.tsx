// Dead Wax Records — Shop Page
// Johnny Outlaw, LLC — Designed in Rockwall, TX

import type { Metadata } from 'next'
import ShopClient from './ShopClient'

export const metadata: Metadata = {
  title: 'Shop — Dead Wax Records',
  description: 'Browse vinyl records, CDs, cassettes, and more — powered by enriched Square catalog data.',
}

export default function ShopPage() {
  return <ShopClient />
}
