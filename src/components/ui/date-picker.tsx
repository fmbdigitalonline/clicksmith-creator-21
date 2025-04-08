
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date | undefined | string;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  // Handle different date formats properly
  let normalizedDate: Date | undefined;
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    normalizedDate = date;
  } else if (typeof date === 'string' && date !== '') {
    const parsedDate = new Date(date);
    normalizedDate = isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  } else {
    normalizedDate = undefined;
  }
  
  // Ensure the component re-renders when date changes
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(normalizedDate);
  
  React.useEffect(() => {
    // Check if the incoming date is different from the current state
    const incomingDate = date instanceof Date && !isNaN(date.getTime()) 
      ? date 
      : typeof date === 'string' && date !== '' 
        ? new Date(date)
        : undefined;
    
    const incomingTime = incomingDate?.getTime();
    const selectedTime = selectedDate?.getTime();
    
    if (
      (incomingTime && selectedTime && incomingTime !== selectedTime) || 
      (incomingDate === undefined && selectedDate !== undefined) ||
      (incomingDate !== undefined && selectedDate === undefined)
    ) {
      setSelectedDate(incomingDate);
    }
  }, [date, selectedDate]);
  
  const handleDateChange = (newDate: Date | undefined) => {
    console.log("Date selected:", newDate);
    setSelectedDate(newDate);
    setDate(newDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-picker-trigger"
            type="button"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
