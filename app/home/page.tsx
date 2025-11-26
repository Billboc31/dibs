'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import BottomNav from '@/components/BottomNav'
import StatusBar from '@/components/StatusBar'
import { supabase, Artist, Event } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [topArtists, setTopArtists] = useState<Artist[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Load user's top artists
      const { data: userArtistsData } = await supabase
        .from('user_artists')
        .select(`
          fanitude_points,
          artists (*)
        `)
        .eq('user_id', user.id)
        .order('fanitude_points', { ascending: false })
        .limit(3)

      if (userArtistsData) {
        const artists = userArtistsData.map((ua: any) => ua.artists)
        setTopArtists(artists)
      }

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5)

      if (eventsData) {
        setUpcomingEvents(eventsData)
      }

    } catch (error) {
      console.error('Error loading home data:', error)
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
      <StatusBar />

      {/* Header */}
      <div className="px-6 py-4">
        <DibsLogo size="small" />
      </div>

      {/* Welcome */}
      <div className="px-6 py-4">
        <h1 className="text-3xl font-bold mb-2">Welcome to DIBS! 👋</h1>
        <p className="text-gray-600">Earn points and get priority access to your favorite artists' concerts</p>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/qr-scan')}
          className="bg-dibs-yellow text-black p-6 rounded-2xl font-bold text-center hover:opacity-90 transition-opacity"
        >
          <div className="text-4xl mb-2">📱</div>
          <div>Scan QR Code</div>
        </button>
        <button
          onClick={() => router.push('/select-artists')}
          className="bg-black text-white p-6 rounded-2xl font-bold text-center hover:bg-gray-800 transition-colors"
        >
          <div className="text-4xl mb-2">🎤</div>
          <div>Add Artists</div>
        </button>
        <button
          onClick={() => router.push('/profile')}
          className="bg-gray-100 text-black p-6 rounded-2xl font-bold text-center hover:bg-gray-200 transition-colors"
        >
          <div className="text-4xl mb-2">👤</div>
          <div>My Profile</div>
        </button>
        <button
          onClick={() => router.push('/connect-platform')}
          className="bg-gray-100 text-black p-6 rounded-2xl font-bold text-center hover:bg-gray-200 transition-colors"
        >
          <div className="text-4xl mb-2">🎵</div>
          <div>Platforms</div>
        </button>
      </div>

      {/* Your Artists */}
      {topArtists.length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold mb-4">Your Top Artists</h2>
          <div className="space-y-3">
            {topArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => router.push(`/community/${artist.id}`)}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎤
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg">{artist.name}</div>
                  <div className="text-sm text-gray-600">View community ranking</div>
                </div>
                <div className="text-2xl">→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="px-6 py-4 flex-1">
          <h2 className="text-xl font-bold mb-4">Upcoming Concerts</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
              >
                <div className="font-bold text-lg mb-1">{event.name}</div>
                <div className="text-sm text-gray-600 mb-1">
                  📍 {event.venue_name}, {event.city}
                </div>
                <div className="text-sm text-gray-600">
                  📅 {new Date(event.event_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

