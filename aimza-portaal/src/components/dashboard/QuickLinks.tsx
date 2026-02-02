'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Users, FileText, Search } from 'lucide-react'
import type { UserRole } from '@/lib/types/database'

interface QuickLinksProps {
  userRole: UserRole
}

export function QuickLinks({ userRole }: QuickLinksProps) {
  const canUpload = userRole === 'admin' || userRole === 'uploader'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snelkoppelingen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {canUpload && (
            <Link href="/upload">
              <Button
                variant="outline"
                className="h-24 w-full flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
              >
                <Upload className="h-8 w-8 text-blue-600" />
                <span>CSV Upload</span>
              </Button>
            </Link>
          )}

          <Link href="/relaties">
            <Button
              variant="outline"
              className="h-24 w-full flex-col gap-2 hover:bg-green-50 hover:border-green-300"
            >
              <Users className="h-8 w-8 text-green-600" />
              <span>Relaties zoeken</span>
            </Button>
          </Link>

          <Link href="/polissen">
            <Button
              variant="outline"
              className="h-24 w-full flex-col gap-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <FileText className="h-8 w-8 text-orange-600" />
              <span>Polissen zoeken</span>
            </Button>
          </Link>

          <Link href="/mutaties">
            <Button
              variant="outline"
              className="h-24 w-full flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <Search className="h-8 w-8 text-purple-600" />
              <span>Mutaties bekijken</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
