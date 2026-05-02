"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
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

const MONTH_NAMES_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

const DAY_NAMES_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

interface CalendarGridProps {
  currentMonth: number
  currentYear: number
  selected?: Date
  fromDate?: Date
  toDate?: Date
  disabled?: (date: Date) => boolean
  onSelect?: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

function CalendarGrid({
  currentMonth,
  currentYear,
  selected,
  fromDate,
  toDate,
  disabled,
  onSelect,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onYearChange,
}: CalendarGridProps) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const isSelected = (day: number) => {
    if (!selected) return false
    const check = new Date(currentYear, currentMonth, day)
    return check.toDateString() === selected.toDateString()
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    )
  }

  const isDisabled = (day: number) => {
    const check = new Date(currentYear, currentMonth, day)
    if (fromDate && check < fromDate) return true
    if (toDate && check > toDate) return true
    if (disabled && disabled(check)) return true
    return false
  }

  // Build year options: ±50 years around current
  const currentRealYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 101 }, (_, i) => currentRealYear - 50 + i)

  return (
    <div className="p-3 select-none">
      {/* Header: prev / month-year dropdowns / next */}
      <div className="flex items-center justify-between mb-3 gap-1">
        <button
          type="button"
          onClick={onPrevMonth}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
          aria-label="Tháng trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 flex-1 justify-center">
          {/* Month dropdown */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="appearance-none rounded-md border border-gray-200 bg-white pl-2 pr-6 py-1 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {MONTH_NAMES_VI.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          </div>

          {/* Year dropdown */}
          <div className="relative">
            <select
              value={currentYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="appearance-none rounded-md border border-gray-200 bg-white pl-2 pr-6 py-1 text-sm font-medium cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          </div>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7")}
          aria-label="Tháng sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES_VI.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {blanks.map((b) => <div key={`b-${b}`} />)}
        {days.map((day) => {
          const sel = isSelected(day)
          const dis = isDisabled(day)
          const tod = isToday(day)
          return (
            <button
              key={day}
              type="button"
              disabled={dis}
              onClick={() => onSelect?.(new Date(currentYear, currentMonth, day))}
              className={cn(
                "h-8 w-8 mx-auto rounded-md text-sm flex items-center justify-center transition-colors",
                "hover:bg-gray-100",
                sel && "bg-gray-900 text-white hover:bg-gray-800 font-semibold",
                !sel && tod && "border border-gray-300 font-semibold",
                dis && "opacity-40 cursor-not-allowed hover:bg-transparent",
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Calendar({ selected, onSelect, fromDate, toDate, disabled, className }: CalendarProps) {
  const initial = selected || new Date()
  const [currentMonth, setCurrentMonth] = React.useState(initial.getMonth())
  const [currentYear, setCurrentYear] = React.useState(initial.getFullYear())

  // Sync when selected changes externally
  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth())
      setCurrentYear(selected.getFullYear())
    }
  }, [selected])

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  return (
    <div className={cn("rounded-md border border-gray-200 bg-white shadow-sm", className)}>
      <CalendarGrid
        currentMonth={currentMonth}
        currentYear={currentYear}
        selected={selected}
        fromDate={fromDate}
        toDate={toDate}
        disabled={disabled}
        onSelect={onSelect}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onMonthChange={setCurrentMonth}
        onYearChange={setCurrentYear}
      />
    </div>
  )
}