'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Error loading API spec:', err))
  }, [])

  if (!spec) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-600">Chargement de la documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white py-6 px-8">
        <h1 className="text-3xl font-bold mb-2">📚 DIBS API Documentation</h1>
        <p className="text-gray-300">Documentation complète et interactive de l'API DIBS</p>
      </div>
      
      <div className="swagger-wrapper">
        <SwaggerUI spec={spec} />
      </div>

      <style jsx global>{`
        .swagger-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
      `}</style>
    </div>
  )
}


