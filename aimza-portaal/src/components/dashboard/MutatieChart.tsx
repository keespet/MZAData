'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { MutatiesPerDag } from '@/lib/types/database'

interface MutatieChartProps {
  data: MutatiesPerDag[]
}

interface ChartData {
  datum: string
  nieuw: number
  gewijzigd: number
  verwijderd: number
}

export function MutatieChart({ data }: MutatieChartProps) {
  // Aggregate data by date
  const aggregatedData = data.reduce<Record<string, ChartData>>((acc, item) => {
    const datum = item.datum
    if (!acc[datum]) {
      acc[datum] = { datum, nieuw: 0, gewijzigd: 0, verwijderd: 0 }
    }
    acc[datum].nieuw += Number(item.nieuw) || 0
    acc[datum].gewijzigd += Number(item.gewijzigd) || 0
    acc[datum].verwijderd += Number(item.verwijderd) || 0
    return acc
  }, {})

  const chartData = Object.values(aggregatedData)
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .slice(-30) // Last 30 days
    .map((item) => ({
      ...item,
      datumLabel: format(parseISO(item.datum), 'd MMM', { locale: nl }),
    }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mutaties per dag (laatste 30 dagen)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            Geen data beschikbaar
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutaties per dag (laatste 30 dagen)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis
              dataKey="datumLabel"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString('nl-NL'),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Legend />
            <Bar
              dataKey="nieuw"
              name="Nieuw"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="gewijzigd"
              name="Gewijzigd"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="verwijderd"
              name="Verwijderd"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
