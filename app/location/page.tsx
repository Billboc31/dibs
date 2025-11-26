'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DibsLogo from '@/components/DibsLogo'
import { supabase } from '@/lib/supabase'

export default function LocationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAllowOnce = async () => {
    await requestLocation()
  }

  const handleAllowWhileUsing = async () => {
    await requestLocation()
  }

  const handleDeny = () => {
    // Continue without location
    router.push('/profile')
  }

  const requestLocation = async () => {
    setLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur')
      setLoading(false)
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        })
      })

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Update user location
      const { error: updateError } = await supabase
        .from('users')
        .update({
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Continue to profile
      router.push('/profile')
    } catch (error: any) {
      console.error('Error getting location:', error)
      setError('Impossible d\'obtenir votre position')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Map Background (mockup) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-green-50">
        {/* Map simulation */}
        <div className="w-full h-full relative overflow-hidden">
          {/* Ocean */}
          <div className="absolute inset-0 bg-blue-200 opacity-30"></div>
          
          {/* Continents mockup */}
          <div className="absolute top-1/4 left-1/4 w-1/3 h-1/4 bg-green-300 opacity-40 rounded-full"></div>
          <div className="absolute top-1/3 right-1/4 w-1/4 h-1/3 bg-green-300 opacity-40 rounded-full"></div>
          
          {/* User position marker */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
          
          {/* Map labels */}
          <div className="absolute top-1/4 left-1/6 text-xs text-blue-600 opacity-70">
            Océan<br/>Atlantique
          </div>
          <div className="absolute top-1/3 left-1/3 text-xs text-green-700 opacity-70">
            Montréal
          </div>
          <div className="absolute bottom-1/3 right-1/3 text-xs text-green-700 opacity-70">
            New York
          </div>
        </div>
      </div>

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-gray-50">
          ⏸️
        </button>
        <button className="w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-xl hover:bg-gray-50">
          🧭
        </button>
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <DibsLogo size="small" />
      </div>

      {/* Permission Dialog */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 p-6 space-y-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold">
            Autoriser <span className="bg-black text-white px-2 py-1 rounded">DIBS</span> à utiliser<br/>
            votre position ?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Votre position est utilisée pour indiquer votre position sur le plan, obtenir des itinéraires et des estimations de temps de trajet, ainsi que pour améliorer les résultats de recherche.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <button
            onClick={handleAllowOnce}
            disabled={loading}
            className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            📍 Position exacte : Oui
          </button>

          <button
            onClick={handleAllowOnce}
            disabled={loading}
            className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Autoriser une fois
          </button>

          <button
            onClick={handleAllowWhileUsing}
            disabled={loading}
            className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Autoriser lorsque l'app est active
          </button>

          <button
            onClick={handleDeny}
            disabled={loading}
            className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Ne pas autoriser
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-600">
            Obtention de votre position...
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around items-center py-4">
          <button className="text-2xl">🏠</button>
          <button className="text-2xl">📅</button>
          <button className="text-2xl">📧</button>
          <button className="text-2xl relative">
            🔔
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              5
            </span>
          </button>
          <button className="text-2xl">👤</button>
        </div>
      </div>
    </div>
  )
}



