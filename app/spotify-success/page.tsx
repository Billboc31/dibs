'use client'

import { useEffect, useState } from 'react'
import DibsLogo from '@/components/DibsLogo'

export default function SpotifySuccessPage() {
  // Pas de redirection, la page reste affichée

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-green-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Card principale */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <DibsLogo size="normal" />
          </div>

          {/* Animation de succès */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
              <svg 
                className="w-16 h-16 text-white animate-check-draw" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            {/* Cercles d'animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-4 border-green-200 rounded-full animate-ping-slow opacity-30"></div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Connexion réussie !
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 mb-2">
            Ton compte <span className="font-semibold text-spotify-green">Spotify</span> a été connecté avec succès.
          </p>
          
          <p className="text-md text-gray-500 mb-8">
            Tu peux maintenant retourner sur l'application mobile DIBS.
          </p>

          {/* Badge Spotify */}
          <div className="inline-flex items-center gap-2 bg-green-50 text-spotify-green px-4 py-2 rounded-full mb-8 border border-green-200">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className="font-semibold">Spotify connecté</span>
          </div>

          {/* Message final */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Tu peux fermer cette page et retourner sur l'application mobile
            </p>
          </div>
        </div>

        {/* Instruction supplémentaire */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Retourne sur l'app mobile pour continuer
          </p>
        </div>
      </div>

      {/* Styles pour les animations */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dasharray: 0, 100;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 100, 0;
            opacity: 1;
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-check-draw {
          animation: check-draw 0.8s ease-in-out 0.3s both;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  )
}

