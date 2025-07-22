import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']

export function useUser() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Kullanıcıyı başta bir kere al
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    })

    // Giriş/çıkış değişikliklerini dinle
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
