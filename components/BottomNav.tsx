'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: '🏠', path: '/home', label: 'Home' },
    { icon: '📅', path: '/events', label: 'Events' },
    { icon: '📱', path: '/qr-scan', label: 'Scan' },
    { icon: '🔔', path: '/notifications', label: 'Notifications', badge: 5 },
    { icon: '👤', path: '/profile', label: 'Profile' },
  ]

  return (
    <div className="flex justify-around items-center py-4 border-t border-gray-200 bg-white">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`text-2xl relative transition-transform hover:scale-110 ${
            pathname === item.path ? 'opacity-100' : 'opacity-60'
          }`}
          aria-label={item.label}
        >
          {item.icon}
          {item.badge && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}



