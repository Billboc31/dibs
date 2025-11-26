'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase, User, Artist, UserArtist } from '@/lib/supabase'

type ArtistWithData = Artist & {
  fanitude_points: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [topArtists, setTopArtists] = useState<ArtistWithData[]>([])
  const [stats, setStats] = useState({
    totalArtists: 0,
    totalPoints: 0,
    upcomingEvents: 0,
    qrScans: 0
  })
  const [joinedDate, setJoinedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      console.log('👤 Chargement profil pour:', authUser.id)

      // Load user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)
        // Format joined date
        if (userData.created_at) {
          const date = new Date(userData.created_at)
          setJoinedDate(date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }))
        }
        console.log('✅ Profil chargé:', userData.email)
      }

      // Load ALL user's artists to get total count and points
      const { data: allUserArtists } = await supabase
        .from('user_artists')
        .select('fanitude_points, artist_id, artists(*)')
        .eq('user_id', authUser.id)

      let totalPoints = 0
      if (allUserArtists && allUserArtists.length > 0) {
        // Calculate total points
        totalPoints = allUserArtists.reduce((sum, ua) => sum + (ua.fanitude_points || 0), 0)
        
        // Get top 3 for display
        const sorted = [...allUserArtists].sort((a, b) => 
          (b.fanitude_points || 0) - (a.fanitude_points || 0)
        )
        const top3 = sorted.slice(0, 3).map((ua: any) => ({
          ...ua.artists,
          fanitude_points: ua.fanitude_points
        }))
        setTopArtists(top3)
        
        console.log(`🎤 ${allUserArtists.length} artistes suivis, ${totalPoints} points totaux`)
      }

      // Load upcoming events count
      const { data: eventsData } = await supabase
        .from('user_events')
        .select('event_id, events!inner(event_date)')
        .eq('user_id', authUser.id)
        .gte('events.event_date', new Date().toISOString())

      // Load QR scans count
      const { data: scansData } = await supabase
        .from('qr_scans')
        .select('id')
        .eq('user_id', authUser.id)

      console.log(`📊 Stats: ${allUserArtists?.length || 0} artistes, ${eventsData?.length || 0} événements, ${scansData?.length || 0} scans`)

      // Real stats from database
      setStats({
        totalArtists: allUserArtists?.length || 0,
        totalPoints: totalPoints,
        upcomingEvents: eventsData?.length || 0,
        qrScans: scansData?.length || 0
      })

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <DibsLogo size="normal" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 py-3">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-4">📶</div>
          <div className="w-4 h-4">📡</div>
          <div className="w-4 h-4">🔋</div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Profile Image */}
        <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              👤
            </div>
          )}
        </div>

        {/* Name & Settings */}
        <div className="flex-1 ml-6">
          <h1 className="text-2xl font-bold">
            {user?.display_name || user?.email?.split('@')[0] || 'Utilisateur'}
          </h1>
          {user?.country && (
            <p className="text-sm text-gray-600">📍 {user.country}</p>
          )}
        </div>
        
        <button 
          onClick={() => router.push('/settings')}
          className="px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
        >
          Settings
        </button>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4 bg-gray-100 mx-6 rounded-xl">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600">ARTISTES</div>
          <div className="text-2xl font-bold">{stats.totalArtists}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600">POINTS TOTAUX</div>
          <div className="text-2xl font-bold text-spotify-green">{stats.totalPoints.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600">ÉVÉNEMENTS</div>
          <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-600">SCANS QR</div>
          <div className="text-2xl font-bold">{stats.qrScans}</div>
        </div>
      </div>

      {/* Location & Join Date */}
      <div className="px-6 py-6">
        {user?.city && user?.country ? (
          <h2 className="text-xl font-bold mb-2">
            LOCATED IN : {user.city.toUpperCase()}, {user.country.toUpperCase()}
          </h2>
        ) : user?.country ? (
          <h2 className="text-xl font-bold mb-2">
            LOCATED IN : {user.country.toUpperCase()}
          </h2>
        ) : (
          <h2 className="text-xl font-bold mb-2 text-gray-400">
            LOCALISATION NON DÉFINIE
          </h2>
        )}
        <p className="text-sm text-gray-600">
          JOINED {joinedDate || 'Recently'}
        </p>
      </div>

      {/* Top Artists */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-bold mb-4">ARTISTS FOLLOWED</h2>
        <div className="flex gap-6 overflow-x-auto">
          {topArtists.map((artist) => (
            <div key={artist.id} className="flex-shrink-0 text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-2">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🎤
                  </div>
                )}
              </div>
              <div className="text-sm font-bold">{artist.name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 flex-1">
        <h2 className="text-xl font-bold mb-4">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/qr-scan')}
            className="bg-dibs-yellow rounded-xl p-6 hover:opacity-90 transition-opacity"
          >
            <div className="text-4xl mb-2">📱</div>
            <div className="text-lg font-bold">SCAN QR</div>
            <div className="text-sm text-gray-600">{stats.qrScans} scans</div>
          </button>
          <button
            onClick={() => router.push('/select-artists')}
            className="bg-black text-white rounded-xl p-6 hover:bg-gray-800 transition-colors"
          >
            <div className="text-4xl mb-2">🎤</div>
            <div className="text-lg font-bold">ADD ARTISTS</div>
            <div className="text-sm text-gray-300">{stats.totalArtists} suivis</div>
          </button>
          {topArtists.length > 0 && (
            <button
              onClick={() => router.push(`/community/${topArtists[0].id}`)}
              className="bg-spotify-green text-white rounded-xl p-6 hover:opacity-90 transition-opacity"
            >
              <div className="text-4xl mb-2">👥</div>
              <div className="text-lg font-bold">COMMUNITY</div>
              <div className="text-sm text-white opacity-80">See rankings</div>
            </button>
          )}
          <button
            onClick={() => router.push('/connect-platform')}
            className="bg-gray-200 rounded-xl p-6 hover:bg-gray-300 transition-colors"
          >
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-lg font-bold">PLATFORMS</div>
            <div className="text-sm text-gray-600">Spotify & more</div>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center py-4 border-t border-gray-200 bg-white">
        <button onClick={() => router.push('/home')} className="text-2xl" title="Accueil">🏠</button>
        <button onClick={() => router.push('/select-artists')} className="text-2xl" title="Artistes">🎤</button>
        <button onClick={() => router.push('/qr-scan')} className="text-2xl" title="Scanner QR">📱</button>
        <button 
          onClick={() => {
            if (topArtists.length > 0) {
              router.push(`/community/${topArtists[0].id}`)
            }
          }} 
          className="text-2xl relative" 
          title="Communauté"
        >
          👥
        </button>
        <button onClick={() => router.push('/profile')} className="text-2xl opacity-100" title="Profil">👤</button>
      </div>
    </div>
  )
}

