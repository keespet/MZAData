'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import type { SyncLog } from '@/lib/types/database'

interface RecentImportsProps {
  imports: SyncLog[]
}

const tabelLabels: Record<string, string> = {
  relaties_particulier: 'Particulier',
  relaties_zakelijk: 'Zakelijk',
  polissen: 'Polissen',
}

export function RecentImports({ imports }: RecentImportsProps) {
  if (imports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Laatste imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            Nog geen imports uitgevoerd
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laatste imports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Nieuw</TableHead>
              <TableHead className="text-right">Gewijzigd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(log.sync_datum)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.tabel_naam === 'relaties_particulier'
                        ? 'default'
                        : log.tabel_naam === 'relaties_zakelijk'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {tabelLabels[log.tabel_naam] || log.tabel_naam}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'destructive'}
                    className={
                      log.status === 'success'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : ''
                    }
                  >
                    {log.status === 'success' ? 'Succesvol' : 'Fout'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {log.records_totaal.toLocaleString('nl-NL')}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  +{log.records_nieuw.toLocaleString('nl-NL')}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {log.records_gewijzigd.toLocaleString('nl-NL')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
