'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, FileText, MessageCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: FileText
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircle
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User
  }
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <div className="mobile-nav">
      <div className="flex justify-around items-center">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
