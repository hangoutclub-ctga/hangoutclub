"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onOk?: () => void;
}

function Calendar({ className, classNames, showOutsideDays = true, onOk, ...props }: CalendarProps) {
  return (
    <div className={cn("p-4 bg-white dark:bg-card rounded-[2rem] shadow-2xl border border-border/40 w-[320px] relative", className)}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        locale={props.locale}
        captionLayout="dropdown"
        startMonth={new Date(1900, 0)}
        endMonth={new Date(2100, 11)}
        className="p-0"
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          month_caption: "flex justify-center relative items-center h-7 mb-4",
          caption_label: "hidden",
          dropdowns: "flex justify-center gap-1 items-center z-20",
          dropdown: "text-sm font-bold text-slate-800 dark:text-slate-100 capitalize tracking-tight bg-transparent border-none cursor-pointer focus:outline-none hover:text-accent transition-colors px-1",
          nav: "flex items-center justify-between absolute w-full px-6 z-10 top-4 left-0",
          button_previous: cn(
            "h-7 w-7 bg-transparent p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center transition-colors border-none"
          ),
          button_next: cn(
            "h-7 w-7 bg-transparent p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center transition-colors border-none"
          ),
          month_grid: "w-full border-collapse",
          weekdays: "flex justify-between mb-2",
          weekday: "text-slate-400 dark:text-slate-500 w-9 font-medium text-[10px] lowercase text-center",
          weeks: "space-y-1",
          week: "flex w-full justify-between",
          day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day_button: cn(
            "h-9 w-9 p-0 font-medium text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
          ),
          selected: "bg-accent !text-white font-bold hover:bg-accent hover:!text-white focus:bg-accent focus:!text-white shadow-lg shadow-accent/20 rounded-xl [&_button]:!text-white [&_button]:font-bold [&_button]:text-white",
          today: "text-accent font-black relative after:content-[''] after:absolute after:bottom-1 after:w-1 after:h-1 after:bg-accent after:rounded-full",
          outside: "text-slate-300 dark:text-slate-600 opacity-50",
          disabled: "text-slate-200 dark:text-slate-700 opacity-30 cursor-not-allowed",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation }) => {
            if (orientation === 'left') return <ChevronLeft className="h-5 w-5 text-slate-400" />;
            return <ChevronRight className="h-5 w-5 text-slate-400" />;
          }
        }}
        disabled={[{ dayOfWeek: [0] }]}
        {...props}
      />
      <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-800 flex justify-end">
        <Button 
          size="sm"
          className="bg-accent hover:bg-accent/90 text-white font-bold py-1.5 px-4 h-8 rounded-xl tracking-wider text-[10px] uppercase shadow-sm transition-all active:scale-95"
          onClick={() => {
            if (onOk) onOk();
          }}
        >
          OK
        </Button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
