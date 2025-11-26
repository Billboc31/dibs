'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase, Artist, User } from '@/lib/supabase'

type LeaderboardEntry = {
  user_id: string
  username: string
  avatar_url?: string
  country: string
  country_position: number
  world_position: number
  fanitude_points: number
  is_current_user?: boolean
}

export default function CommunityPage() {
  const router = useRouter()
  const params = useParams()
  const artistId = params.artistId as string
  
  const [artist, setArtist] = useState<Artist | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommunityData()
  }, [artistId])

  const loadCommunityData = async () => {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/')
        return
      }

      console.log('📊 Chargement communauté pour artiste:', artistId)

      // Load artist info
      const { data: artistData } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single()

      if (artistData) {
        setArtist(artistData)
        console.log('🎤 Artiste:', artistData.name)
      }

      // Load ALL users with their stats for this artist (world leaderboard)
      const { data: allUsersData, error: allUsersError } = await supabase
        .from('user_artists')
        .select(`
          user_id,
          fanitude_points,
          last_listening_minutes,
          users:user_id (
            id,
            email,
            display_name,
            avatar_url,
            country
          )
        `)
        .eq('artist_id', artistId)
        .order('fanitude_points', { ascending: false })

      if (allUsersError) {
        console.error('❌ Erreur chargement leaderboard:', allUsersError)
        throw allUsersError
      }

      console.log(`👥 ${allUsersData?.length || 0} fans trouvés pour cet artiste`)

      // Calculate world rankings and filter by country
      const worldLeaderboard: LeaderboardEntry[] = []
      const countryLeaderboards: { [country: string]: LeaderboardEntry[] } = {}
      let currentUserData: any = null

      allUsersData?.forEach((entry: any, index: number) => {
        const user = entry.users
        if (!user) return

        const username = user.display_name || user.email?.split('@')[0] || 'Anonymous'
        const country = user.country || 'Unknown'

        const leaderboardEntry: LeaderboardEntry = {
          user_id: user.id,
          username,
          avatar_url: user.avatar_url,
          country,
          world_position: index + 1,
          country_position: 0, // Will be calculated below
          fanitude_points: entry.fanitude_points || 0,
          is_current_user: user.id === authUser.id
        }

        worldLeaderboard.push(leaderboardEntry)

        // Group by country for country rankings
        if (!countryLeaderboards[country]) {
          countryLeaderboards[country] = []
        }
        countryLeaderboards[country].push(leaderboardEntry)

        // Save current user data
        if (user.id === authUser.id) {
          currentUserData = leaderboardEntry
        }
      })

      // Calculate country positions
      Object.values(countryLeaderboards).forEach(countryList => {
        countryList.forEach((entry, index) => {
          entry.country_position = index + 1
        })
      })

      console.log('🏆 World leaderboard:', worldLeaderboard.length, 'entrées')
      
      if (currentUserData) {
        setCurrentUser(currentUserData)
        console.log(`👤 Position utilisateur: ${currentUserData.world_position}e (monde), ${currentUserData.country_position}e (${currentUserData.country})`)
      }

      // Show top 20 or all if less
      setLeaderboard(worldLeaderboard.slice(0, 20))

    } catch (error) {
      console.error('❌ Error loading community data:', error)
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

      {/* Logo */}
      <div className="px-6 py-4">
        <DibsLogo size="small" />
      </div>

      {/* Artist Header */}
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold mb-4">{artist?.name || 'Lady Gaga'} :</h1>
        
        <div className="flex items-start gap-4">
          {/* Artist Image */}
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {artist?.image_url ? (
              <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                🎤
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="font-bold text-lg mb-1">STATUS</div>
            {currentUser ? (
              <div className="text-sm space-y-1">
                <div>Your position : <span className="font-semibold">{currentUser.country_position?.toLocaleString()}th ({currentUser.country || 'Unknown'})</span></div>
                <div>Your position : <span className="font-semibold">{currentUser.world_position?.toLocaleString()}th (World)</span></div>
                <div className="mt-2 text-spotify-green font-bold">{currentUser.fanitude_points?.toLocaleString()} points</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Sélectionne cet artiste pour rejoindre la communauté !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community List */}
      <div className="px-6 py-4 flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Your Community : 
          <span className="text-base text-gray-600 font-normal ml-2">
            ({leaderboard.length} top fans)
          </span>
        </h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-600">
              Pas encore de fans pour cet artiste.<br />
              Sois le premier !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((member) => (
              <div 
                key={member.user_id} 
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  member.is_current_user 
                    ? 'bg-spotify-green bg-opacity-10 border-2 border-spotify-green' 
                    : 'bg-gray-50 border-2 border-transparent'
                }`}
              >
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  member.world_position === 1 ? 'bg-yellow-400 text-white' :
                  member.world_position === 2 ? 'bg-gray-300 text-white' :
                  member.world_position === 3 ? 'bg-amber-600 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  #{member.world_position}
                </div>

                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {member.is_current_user ? '😎' : '👤'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg truncate flex items-center gap-2">
                    {member.username}
                    {member.is_current_user && (
                      <span className="text-xs bg-spotify-green text-white px-2 py-1 rounded-full">
                        TOI
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {member.country_position.toLocaleString()}th in {member.country} • {member.world_position.toLocaleString()}th in World
                  </div>
                  <div className="text-sm font-bold text-spotify-green mt-1">
                    {member.fanitude_points.toLocaleString()} points
                  </div>
                </div>

                {/* Trophy for top 3 */}
                {member.world_position <= 3 && (
                  <div className="text-3xl flex-shrink-0">
                    {member.world_position === 1 ? '🏆' : 
                     member.world_position === 2 ? '🥈' : '🥉'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center py-4 border-t border-gray-200 bg-white">
        <button onClick={() => router.push('/home')} className="text-2xl">🏠</button>
        <button onClick={() => router.push('/events')} className="text-2xl">📅</button>
        <button onClick={() => router.push('/qr-scan')} className="text-2xl">📧</button>
        <button className="text-2xl relative">
          🔔
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            5
          </span>
        </button>
        <button onClick={() => router.push('/profile')} className="text-2xl">👤</button>
      </div>
    </div>
  )
}


