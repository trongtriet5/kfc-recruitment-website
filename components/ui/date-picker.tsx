"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar } from "./calendar"

interface DatePickerProps {
  value?: string            // YYYY-MM-DD string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minDate?: string          // YYYY-MM-DD
  maxDate?: string          // YYYY-MM-DD
  disabled?: boolean
  required?: boolean
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  minDate,
  maxDate,
  disabled,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value + "T00:00:00")
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      onChange?.(`${yyyy}-${mm}-${dd}`)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange?.("")
  }

  const fromDate = minDate ? new Date(minDate + "T00:00:00") : undefined
  const toDate = maxDate ? new Date(maxDate + "T00:00:00") : undefined

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3",
            !value && "text-muted-foreground",
            className
          )}
          onClick={() => !disabled && setOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
          <span className="flex-1 truncate">
            {selectedDate
              ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
              : placeholder}
          </span>
          {value && !disabled && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 text-gray-400 hover:text-gray-700"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={selectedDate}
          onSelect={handleSelect}
          fromDate={fromDate}
          toDate={toDate}
        />
      </PopoverContent>
    </Popover>
  )
}
