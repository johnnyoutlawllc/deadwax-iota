// Dead Wax Records — Root redirect
// Johnny Outlaw, LLC — Designed in Greenville, TX
//
// This instance is CHI-only. The root always redirects to the login page.

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/chi/login')
}
