'use client'

import { usePathname } from 'next/navigation'

const pagesTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'CSV Upload',
  '/relaties': 'Relaties',
  '/polissen': 'Polissen',
  '/mutaties': 'Mutaties',
  '/gebruikers': 'Gebruikersbeheer',
}

export function Header() {
  const pathname = usePathname()

  // Find matching title (handle nested routes like /relaties/123)
  const title = Object.entries(pagesTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || 'Aimza'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Space for mobile menu button */}
        <div className="w-10 lg:hidden" />

        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
    </header>
  )
}
