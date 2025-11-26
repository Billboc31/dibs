'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase, QRCode, Artist } from '@/lib/supabase'

export default function QRRecapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qrCodeId = searchParams.get('code')
  
  const [qrCode, setQrCode] = useState<QRCode | null>(null)
  const [artist, setArtist] = useState<Artist | null>(null)
  const [userStats, setUserStats] = useState({
    stanOMeter: 0,
    fanOMeter: 0
  })
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    loadRecapData()
  }, [qrCodeId])

  const loadRecapData = async () => {
    try {
      if (!qrCodeId) return

      // Load QR code info
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', qrCodeId)
        .single()

      if (qrData) {
        setQrCode(qrData)

        // Load artist info if linked
        if (qrData.artist_id) {
          const { data: artistData } = await supabase
            .from('artists')
            .select('*')
            .eq('id', qrData.artist_id)
            .single()

          if (artistData) {
            setArtist(artistData)

            // Load user stats for this artist
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: userArtist } = await supabase
                .from('user_artists')
                .select('fanitude_points')
                .eq('user_id', user.id)
                .eq('artist_id', artistData.id)
                .single()

              if (userArtist) {
                setUserStats({
                  stanOMeter: userArtist.fanitude_points,
                  fanOMeter: userArtist.fanitude_points
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading recap:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen bg-white flex flex-col p-6 relative overflow-hidden">
      {/* Floating crowns animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-bounce float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              👑
            </div>
          ))}
        </div>
      )}

      {/* Status bar */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-4">📶</div>
          <div className="w-4 h-4">📡</div>
          <div className="w-4 h-4">🔋</div>
        </div>
      </div>

      {/* Logo */}
      <div className="mb-8">
        <DibsLogo size="small" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-8">
        {qrCode?.product_name || 'Mayhem Vinyl (Collector Edition)'}
      </h1>

      {/* Product Image with Points */}
      <div className="flex-1 flex items-center justify-center mb-8 relative">
        <div className="w-80 h-80 bg-gray-200 rounded-2xl overflow-hidden relative">
          {qrCode?.product_image_url ? (
            <img
              src={qrCode.product_image_url}
              alt={qrCode.product_name || 'Product'}
              className="w-full h-full object-cover filter grayscale"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
              <div className="text-6xl filter grayscale">🎵</div>
            </div>
          )}
          
          {/* Points Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl font-black text-dibs-yellow drop-shadow-2xl mb-2">
                +
              </div>
              <div className="text-9xl font-black text-dibs-yellow drop-shadow-2xl">
                {qrCode?.points_value || 500}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Congratulations */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">CONGRATULATIONS !</h2>
        <p className="text-lg text-gray-700">
          You've just earned {qrCode?.points_value || 500} points
        </p>
      </div>

      {/* Artist Stats */}
      {artist && (
        <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🎤
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold">{artist.name} :</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Stan-O-Meter :</span>
              <span className="text-2xl font-bold">{userStats.stanOMeter.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Fan-O-Meter :</span>
              <span className="text-2xl font-bold">{userStats.fanOMeter.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={() => router.push('/profile')}
        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
      >
        Continue
      </button>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center pt-6 mt-6 border-t border-gray-200">
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



