"use client"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const SAGE   = "#4A7C6F"
const BORDER = "#DDD9D1"
const DARK   = "#1C2B27"

export function DayPicker({ value, onChange }: { value: number; onChange: (day: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day, i) => {
        const selected = value === i
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(i)}
            className="rounded-full px-3.5 py-2 text-sm font-medium transition-all"
            style={
              selected
                ? { backgroundColor: SAGE, color: "white" }
                : { backgroundColor: "white", color: DARK, border: `1.5px solid ${BORDER}` }
            }
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
