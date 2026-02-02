'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, User, Building2, FileText, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/lib/types/database'

interface StatsCardsProps {
  stats: DashboardStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Totaal Relaties',
      value: stats?.totaal_relaties ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Particulier',
      value: stats?.totaal_particulier ?? 0,
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Zakelijk',
      value: stats?.totaal_zakelijk ?? 0,
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Totaal Polissen',
      value: stats?.totaal_polissen ?? 0,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Wijzigingen (7d)',
      value: (stats?.nieuwe_records_week ?? 0) + (stats?.gewijzigde_records_week ?? 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value.toLocaleString('nl-NL')}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
