import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DIBS - Connect with your favorite artists',
  description: 'Earn fanitude points and get priority access to concerts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="mobile-container">
          {children}
        </div>
      </body>
    </html>
  )
}



