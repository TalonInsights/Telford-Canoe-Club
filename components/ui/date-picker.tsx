'use client'

/**
 * P0-14 — react-day-picker via the shadcn Calendar, popover pattern from
 * 21st.dev originui "Calendar [React Day Picker]"
 * (https://21st.dev/@originui/components/calendar, MIT). React-aria
 * candidates were rejected — outside the §3.6 dependency allowlist.
 * All display in Europe/London via the shared format helpers.
 */

import { CalendarIcon } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DatePicker({
  value,
  onChange,
  placeholder = 'Choose a date',
  disabled,
  id,
  className,
}: {
  value?: Date
  onChange: (date?: Date) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon aria-hidden="true" className="size-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

/** Date + wall-clock time; the caller assembles the final Date in London time. */
export function DateTimePicker({
  value,
  onChange,
  disabled,
  className,
}: {
  value?: Date
  onChange: (date?: Date) => void
  disabled?: boolean
  className?: string
}) {
  const timeId = useId()
  const timeValue = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : ''

  function withTime(base: Date, time: string): Date {
    const [h, m] = time.split(':').map(Number)
    const next = new Date(base)
    next.setHours(h ?? 0, m ?? 0, 0, 0)
    return next
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="min-w-44 grow">
        <DatePicker
          value={value}
          onChange={(d) => {
            if (!d) return onChange(undefined)
            onChange(timeValue ? withTime(d, timeValue) : d)
          }}
          disabled={disabled}
        />
      </div>
      <label htmlFor={timeId} className="sr-only">
        Time
      </label>
      <Input
        id={timeId}
        type="time"
        disabled={disabled || !value}
        value={timeValue}
        onChange={(e) => value && e.target.value && onChange(withTime(value, e.target.value))}
        className="w-32"
      />
    </div>
  )
}
