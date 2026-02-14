"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(date)

  // Separate time state
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "09:00"
  )

  React.useEffect(() => {
    if (date) {
      setSelectedDateTime(date)
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve the time when selecting a new date
      const [hours, minutes] = timeValue.split(":").map(Number)
      selectedDate.setHours(hours, minutes, 0, 0)
      setSelectedDateTime(selectedDate)
    } else {
      setSelectedDateTime(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)

    if (selectedDateTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(selectedDateTime)
      newDateTime.setHours(hours, minutes, 0, 0)
      setSelectedDateTime(newDateTime)
    }
  }

  const handleApply = () => {
    setDate(selectedDateTime)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedDateTime(undefined)
    setDate(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP 'at' p")
          ) : (
            <span>Pick a date and time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
          />
          
          <div className="border-t pt-3 px-3">
            <Label htmlFor="time-picker" className="text-sm font-medium mb-2 block">
              <Clock className="inline h-3.5 w-3.5 mr-1.5" />
              Time
            </Label>
            <Input
              id="time-picker"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 px-3 pb-1">
            <Button
              onClick={handleApply}
              disabled={!selectedDateTime || disabled}
              className="flex-1"
              size="sm"
            >
              Apply
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={disabled}
              className="flex-1"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
