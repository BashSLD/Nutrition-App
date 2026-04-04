import { useState, useEffect, useContext, createContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [otherProfile, setOtherProfile] = useState(null)
  const [viewingOther, setViewingOther] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setOtherProfile(null); setViewingOther(false); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    const { data: others } = await supabase.from('profiles').select('*').neq('id', userId)
    setOtherProfile(others?.[0] || null)
    setLoading(false)
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await fetchProfile(session.user.id)
  }

  function toggleView() {
    setViewingOther(v => !v)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  const viewingProfile = viewingOther ? otherProfile : profile
  const viewUserId = viewingOther ? otherProfile?.id : user?.id

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      viewingProfile, viewUserId, viewingOther, toggleView,
      loginWithGoogle, logout, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
