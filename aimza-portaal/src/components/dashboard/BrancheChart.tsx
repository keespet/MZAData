'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import type { PolissenPerBranche } from '@/lib/types/database'

interface BrancheChartProps {
  data: PolissenPerBranche[]
}

const COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#8b5cf6', // purple
  '#22c55e', // green
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#eab308', // yellow
  '#6b7280', // gray
]

export function BrancheChart({ data }: BrancheChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Polissen per branche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            Geen data beschikbaar
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 8).map((item) => ({
    name: item.hoofdbranche,
    value: Number(item.aantal),
    premie: Number(item.totaal_premie),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polissen per branche</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                value.toLocaleString('nl-NL'),
                'Aantal polissen',
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
