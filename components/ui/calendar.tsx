"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  mode?: "single" | "range"
  fromDate?: Date
  toDate?: Date
  disabled?: (date: Date) => boolean
  className?: string
}

interface CalendarGridProps {
  date: Date
  selected?: Date | Date[]
  mode?: "single" | "range"
  fromDate?: Date
  toDate?: Date
  disabled?: (date: Date) => boolean
  onSelect?: (date: Date) => void
}

function CalendarGrid({
  date,
  selected,
  mode,
  fromDate,
  toDate,
  disabled,
  onSelect,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = React.useState(date.getMonth())
  const [currentYear, setCurrentYear] = React.useState(date.getFullYear())

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

const isSelected = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day)
    if (!selected) return false
    if (selected instanceof Date) {
      return checkDate.toDateString() === selected.toDateString()
    }
    return false
  }

  const isDisabled = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day)
    if (fromDate && checkDate < fromDate) return true
    if (toDate && checkDate > toDate) return true
    if (disabled && disabled(checkDate)) return true
    return false
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDayClick = (day: number) => {
    if (onSelect) {
      const selectedDate = new Date(currentYear, currentMonth, day)
      onSelect(selectedDate)
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((blank) => (
          <div key={`blank-${blank}`} />
        ))}
        {days.map((day) => (
          <button
            key={day}
            type="button"
            disabled={isDisabled(day)}
            onClick={() => handleDayClick(day)}
            className={cn(
              "h-8 w-8 rounded-md text-sm hover:bg-slate-100 flex items-center justify-center",
              isSelected(day) && "bg-slate-900 text-white hover:bg-slate-900",
              isDisabled(day) && "opacity-50 cursor-not-allowed hover:bg-transparent"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Calendar({ selected, onSelect, fromDate, toDate, disabled, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())

  return (
    <div className={cn("rounded-md border border-slate-200 bg-white", className)}>
      <CalendarGrid
        date={currentDate}
        selected={selected}
        onSelect={(date) => {
          setCurrentDate(date)
          onSelect?.(date)
        }}
        fromDate={fromDate}
        toDate={toDate}
        disabled={disabled}
      />
    </div>
  )
}