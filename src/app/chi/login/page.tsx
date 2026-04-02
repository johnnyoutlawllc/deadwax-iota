'use client'

// Dead Wax Records — Login page
// Johnny Outlaw, LLC — Designed in Rockwall, TX
//
// Magic link login. Only johnnyoutlawllc@gmail.com is permitted.

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const ALLOWED_EMAIL = 'johnnyoutlawllc@gmail.com'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'unauthorized') setError('Access denied. This tool is restricted.')
    if (err === 'auth_failed') setError('Authentication failed. Please try again.')
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: ALLOWED_EMAIL,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/chi`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-4 text-white font-bold text-lg"
          >
            DW
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Dead Wax Records
          </h1>
          <p className="text-text-muted text-sm mt-1">Management Dashboard</p>
        </div>

        {sent ? (
          /* ── Sent state ── */
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: '#111', border: '1px solid #222' }}
          >
            <div className="text-3xl mb-3">📬</div>
            <p className="text-text-primary font-semibold mb-1">Check your email</p>
            <p className="text-text-muted text-sm">
              A magic link was sent to{' '}
              <span className="text-accent">{ALLOWED_EMAIL}</span>. Click the
              link to sign in.
            </p>
          </div>
        ) : (
          /* ── Login form ── */
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div
              className="rounded-xl p-6 flex flex-col gap-4"
              style={{ background: '#111', border: '1px solid #222' }}
            >
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-widest">
                  Email
                </label>
                <div
                  className="w-full rounded-lg px-4 py-2.5 text-sm text-text-secondary"
                  style={{ background: '#0a0a0a', border: '1px solid #333' }}
                >
                  {ALLOWED_EMAIL}
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: '#2e1a1a', border: '1px solid #5a2a2a', color: '#f87171' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 font-semibold text-sm text-white transition-opacity disabled:opacity-50"
                style={{ background: '#ff6b35' }}
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </div>

            <p className="text-center text-xs text-text-muted">
              Access is restricted to authorized users only.
            </p>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-text-muted hover:text-accent transition-colors">
            ← Back to Outlaw Apps
          </a>
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
