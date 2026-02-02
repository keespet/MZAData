'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { User, Building2, FileText, Upload, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DropZoneVariant = 'particulier' | 'zakelijk' | 'polissen'

interface DropZoneProps {
  variant: DropZoneVariant
  onFileSelect: (file: File) => void
  onPreview: () => void
  onImport: () => void
  selectedFile: File | null
  isLoading?: boolean
  canPreview?: boolean
  canImport?: boolean
}

const variantConfig: Record<
  DropZoneVariant,
  {
    label: string
    icon: React.ElementType
    colorClass: string
    bgClass: string
    borderClass: string
  }
> = {
  particulier: {
    label: 'Relaties Particulier',
    icon: User,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-300 hover:border-blue-400',
  },
  zakelijk: {
    label: 'Relaties Zakelijk',
    icon: Building2,
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300 hover:border-orange-400',
  },
  polissen: {
    label: 'Polissen',
    icon: FileText,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-300 hover:border-green-400',
  },
}

export function DropZone({
  variant,
  onFileSelect,
  onPreview,
  onImport,
  selectedFile,
  isLoading = false,
  canPreview = false,
  canImport = false,
}: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const config = variantConfig[variant]
  const Icon = config.icon

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
      setIsDragActive(false)
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isLoading,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all cursor-pointer min-h-[200px]',
          isDragActive || isDragAccept
            ? `${config.bgClass} ${config.borderClass}`
            : 'border-gray-300 hover:border-gray-400',
          isDragReject && 'border-red-500 bg-red-50',
          selectedFile && 'border-green-500 bg-green-50',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'rounded-full p-3 mb-3',
            selectedFile ? 'bg-green-100' : config.bgClass
          )}
        >
          {selectedFile ? (
            <Check className="h-8 w-8 text-green-600" />
          ) : (
            <Icon className={cn('h-8 w-8', config.colorClass)} />
          )}
        </div>

        <p className="text-sm font-medium text-gray-900">{config.label}</p>

        {selectedFile ? (
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600 truncate max-w-[200px]">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">
            Sleep CSV hier of klik om te selecteren
          </p>
        )}

        {isDragReject && (
          <p className="mt-2 text-xs text-red-600">
            Alleen CSV bestanden toegestaan
          </p>
        )}
      </div>

      {selectedFile && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onPreview}
            disabled={!canPreview || isLoading}
          >
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={onImport}
            disabled={!canImport || isLoading}
          >
            {isLoading ? 'Bezig...' : 'Importeren'}
          </Button>
        </div>
      )}
    </div>
  )
}
