"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface MonthPickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function MonthPicker({ value, onChange, placeholder = "Chọn tháng", className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedMonth, setSelectedMonth] = React.useState<string>(value || "")
  const [selectedYear, setSelectedYear] = React.useState<string>(value ? value.split("-")[0] : String(new Date().getFullYear()))

  const months = [
    { value: "01", label: "Tháng 1" },
    { value: "02", label: "Tháng 2" },
    { value: "03", label: "Tháng 3" },
    { value: "04", label: "Tháng 4" },
    { value: "05", label: "Tháng 5" },
    { value: "06", label: "Tháng 6" },
    { value: "07", label: "Tháng 7" },
    { value: "08", label: "Tháng 8" },
    { value: "09", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i))

  const displayValue = () => {
    if (!value) return ""
    const [year, month] = value.split("-")
    const m = months.find(m => m.value === month)
    return m ? `${m.label} ${year}` : value
  }

  const handleMonthSelect = (month: string) => {
    const newValue = `${selectedYear}-${month}`
    setSelectedMonth(month)
    onChange?.(newValue)
  }

  const handleYearSelect = (year: string) => {
    setSelectedYear(year)
    if (selectedMonth) {
      const newValue = `${year}-${selectedMonth}`
      onChange?.(newValue)
    }
  }

  const handleClear = () => {
    setSelectedMonth("")
    onChange?.("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayValue() || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={(v) => handleMonthSelect(v)}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Tháng" /></SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={(v) => handleYearSelect(v)}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Năm" /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear} className="w-full">
            Xóa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}