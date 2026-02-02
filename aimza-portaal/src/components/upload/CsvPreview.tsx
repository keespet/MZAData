'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CsvPreviewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  headers: string[]
  rows: string[][]
}

export function CsvPreview({
  isOpen,
  onClose,
  title,
  headers,
  rows,
}: CsvPreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title} - Preview (eerste 10 rijen)</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                {headers.slice(0, 8).map((header, index) => (
                  <TableHead key={index} className="min-w-[120px]">
                    {header}
                  </TableHead>
                ))}
                {headers.length > 8 && (
                  <TableHead className="text-gray-400">
                    +{headers.length - 8} meer...
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="font-mono text-gray-500">
                    {rowIndex + 1}
                  </TableCell>
                  {row.slice(0, 8).map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="max-w-[200px] truncate"
                      title={cell}
                    >
                      {cell || <span className="text-gray-300">-</span>}
                    </TableCell>
                  ))}
                  {row.length > 8 && <TableCell className="text-gray-400">...</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="text-sm text-gray-500">
          Totaal kolommen: {headers.length}
        </div>
      </DialogContent>
    </Dialog>
  )
}
