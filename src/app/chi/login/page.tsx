'use client'

// Dead Wax Records — Login page
// Johnny Outlaw, LLC — Designed in Greenville, TX
//
// Google OAuth. Access controlled by public.app_user_allowlist in Supabase.
// Add/remove users via the allowlist table — no code changes needed.

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

// Use the current origin at runtime so OAuth always returns to the right domain

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'unauthorized') setError('Access denied. This tool is restricted.')
    if (err === 'auth_failed') setError('Authentication failed. Please try again.')
  }, [searchParams])

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/chi`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-4 text-white font-bold text-lg">
            DW
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Dead Wax Records
          </h1>
          <p className="text-text-muted text-sm mt-1">Management Dashboard</p>
        </div>

        <div className="rounded-xl p-6 flex flex-col gap-4 bg-surface border border-border">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2e1a1a', border: '1px solid #5a2a2a', color: '#f87171' }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full rounded-lg py-3 font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50 bg-white text-gray-800 hover:bg-gray-100"
          >
            <GoogleIcon />
            {loading ? 'Redirecting…' : 'Sign in with Google'}
          </button>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-text-muted opacity-50">
            App Last Updated On:{' '}
            {new Date(process.env.NEXT_PUBLIC_BUILD_TIME!).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChiLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
