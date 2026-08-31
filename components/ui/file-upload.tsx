'use client'

/**
 * P0-15 — pattern from 21st.dev joyco "File Dropzone"
 * (https://21st.dev/@joyco/components/file-dropzone, MIT; CSV-specific and
 * form-attached variants rejected). Multi-file, type/size validation, per-file
 * progress, image previews, keyboard operable (real button + input, not a
 * div). Storage-agnostic: the caller injects `upload` (the Supabase Storage
 * adapter arrives with the features that use it in Phases 5–6).
 */

import { CloudUpload, File as FileIcon, X } from 'lucide-react'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type UploadItem = {
  id: string
  file: File
  previewUrl?: string
  progress: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}

export function FileUpload({
  accept,
  maxSizeMb = 20,
  multiple = true,
  label = 'Add files',
  hint,
  upload,
  onComplete,
}: {
  accept?: string[]
  maxSizeMb?: number
  multiple?: boolean
  label?: string
  hint?: string
  upload: (file: File, onProgress: (pct: number) => void) => Promise<void>
  onComplete?: (file: File) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)

  function validate(file: File): string | null {
    if (accept && !accept.some((t) => file.type === t || file.name.toLowerCase().endsWith(t))) {
      return `That file type isn't accepted here`
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `Too large — the limit is ${maxSizeMb}MB`
    }
    return null
  }

  function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const id = `${file.name}-${file.size}-${file.lastModified}`
      const error = validate(file)
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      const item: UploadItem = {
        id,
        file,
        previewUrl,
        progress: 0,
        status: error ? 'error' : 'uploading',
        error: error ?? undefined,
      }
      setItems((prev) => [...prev.filter((p) => p.id !== id), item])
      if (!error) {
        upload(file, (pct) =>
          setItems((prev) => prev.map((p) => (p.id === id ? { ...p, progress: pct } : p)))
        )
          .then(() => {
            setItems((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: 100, status: 'done' } : p))
            )
            onComplete?.(file)
          })
          .catch((e: unknown) =>
            setItems((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      status: 'error',
                      error: e instanceof Error ? e.message : 'Upload failed — try again',
                    }
                  : p
              )
            )
          )
      }
    }
  }

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragging ? 'border-river bg-foam' : 'border-stone bg-card hover:border-river'
        )}
      >
        <CloudUpload aria-hidden="true" className="size-8 text-river" />
        <span className="font-medium">{label}</span>
        <span className="text-micro text-ink-muted">
          {hint ?? `Drag and drop, or choose files — up to ${maxSizeMb}MB each`}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={multiple}
          accept={accept?.join(',')}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-stone bg-card p-2.5"
            >
              {item.previewUrl ? (
                <Image
                  src={item.previewUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foam">
                  <FileIcon aria-hidden="true" className="size-4 text-ink-muted" />
                </span>
              )}
              <div className="min-w-0 grow">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                {item.status === 'error' ? (
                  <p className="text-micro text-signal">{item.error}</p>
                ) : (
                  <div
                    role="progressbar"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${item.file.name}`}
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone"
                  >
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width]',
                        item.status === 'done' ? 'bg-success' : 'bg-river'
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <p className="text-micro text-ink-muted">
                {item.status === 'done' ? 'Done' : item.status === 'error' ? 'Failed' : `${item.progress}%`}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item.file.name}`}
                onClick={() => {
                  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
                  setItems((prev) => prev.filter((p) => p.id !== item.id))
                }}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
