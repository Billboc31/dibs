'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'

export default function QRScanPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleOpenCamera = () => {
    setScanning(true)
    // Simulate camera opening
    setTimeout(() => {
      // For POC, simulate successful scan after 2 seconds
      handleScanSuccess('ALBUM_MAYHEM_2024')
    }, 2000)
  }

  const handleManualEntry = async () => {
    if (!manualCode.trim()) return
    await handleScanSuccess(manualCode.trim())
  }

  const handleScanSuccess = async (code: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Check if QR code exists
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (qrError || !qrCode) {
        alert('Code QR invalide ou expiré')
        setScanning(false)
        return
      }

      // Check if already scanned
      const { data: existingScans } = await supabase
        .from('qr_scans')
        .select('id')
        .eq('user_id', user.id)
        .eq('qr_code_id', qrCode.id)

      if (existingScans && existingScans.length >= qrCode.max_scans_per_user) {
        alert('Vous avez déjà scanné ce code QR')
        setScanning(false)
        return
      }

      // Record scan
      const { error: scanError } = await supabase
        .from('qr_scans')
        .insert({
          user_id: user.id,
          qr_code_id: qrCode.id,
          points_earned: qrCode.points_value,
          scanned_at: new Date().toISOString()
        })

      if (scanError) throw scanError

      // Update user's fanitude points if artist is linked
      if (qrCode.artist_id) {
        const { data: userArtist } = await supabase
          .from('user_artists')
          .select('fanitude_points')
          .eq('user_id', user.id)
          .eq('artist_id', qrCode.artist_id)
          .single()

        if (userArtist) {
          await supabase
            .from('user_artists')
            .update({
              fanitude_points: userArtist.fanitude_points + qrCode.points_value
            })
            .eq('user_id', user.id)
            .eq('artist_id', qrCode.artist_id)
        }
      }

      // Redirect to recap page
      router.push(`/qr-recap?code=${qrCode.id}`)
    } catch (error) {
      console.error('Error processing QR scan:', error)
      alert('Erreur lors du scan')
      setScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
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
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">SCAN YOUR QR CODE</h1>
        <p className="text-gray-600">And earn more points !</p>
      </div>

      {/* QR Code Display */}
      <div className="flex-1 flex items-center justify-center mb-8">
        <div className="relative">
          {/* QR Frame */}
          <div className="w-80 h-80 border-4 border-gray-300 rounded-3xl p-8 bg-gray-50 relative">
            {scanning ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-center">
                  <div className="text-4xl mb-4">📷</div>
                  <div className="text-gray-600">Scan en cours...</div>
                </div>
              </div>
            ) : (
              <QRCode
                value="ALBUM_MAYHEM_2024"
                size={256}
                className="w-full h-full"
              />
            )}
            
            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-gray-400 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-gray-400 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-gray-400 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-gray-400 rounded-br-lg"></div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleOpenCamera}
        disabled={scanning}
        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg mb-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {scanning ? 'SCANNING...' : 'OPEN MY CAMERA NOW !'}
      </button>

      {/* Manual Entry Link */}
      <button
        onClick={() => setShowInput(!showInput)}
        className="text-center text-gray-600 underline mb-4"
      >
        Where can I find my DIBS QR code ?
      </button>

      {/* Manual Code Entry (for testing) */}
      {showInput && (
        <div className="bg-gray-100 p-4 rounded-xl space-y-3">
          <input
            type="text"
            placeholder="Enter QR code manually"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleManualEntry}
            className="w-full bg-gray-800 text-white py-2 rounded-lg font-semibold"
          >
            Validate Code
          </button>
          <p className="text-xs text-gray-500 text-center">
            Codes test: ALBUM_MAYHEM_2024, MERCH_WEEKND_TOUR, ALBUM_KATY_SMILE
          </p>
        </div>
      )}

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



