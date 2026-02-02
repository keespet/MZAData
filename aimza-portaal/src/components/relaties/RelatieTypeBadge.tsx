'use client'

import { Badge } from '@/components/ui/badge'
import { User, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RelatieTypeBadgeProps {
  type: 'particulier' | 'zakelijk'
  showIcon?: boolean
  size?: 'sm' | 'default'
}

export function RelatieTypeBadge({
  type,
  showIcon = true,
  size = 'default',
}: RelatieTypeBadgeProps) {
  const isParticulier = type === 'particulier'
  const Icon = isParticulier ? User : Building2

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        isParticulier
          ? 'border-blue-300 bg-blue-50 text-blue-700'
          : 'border-orange-300 bg-orange-50 text-orange-700',
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {showIcon && (
        <Icon
          className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
        />
      )}
      {isParticulier ? 'PARTICULIER' : 'ZAKELIJK'}
    </Badge>
  )
}
