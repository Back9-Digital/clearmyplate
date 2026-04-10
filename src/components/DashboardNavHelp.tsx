"use client"

import { useRef } from "react"
import { HelpCircle } from "lucide-react"
import { HelpBubble, HelpBubbleHandle } from "@/components/HelpBubble"

const GRAY = "#6B7B77"

/**
 * Renders the "Help" nav button + the floating HelpBubble together so
 * they share state via a ref. Used in the server-component dashboard page
 * where we can't lift useState to the page level.
 *
 * The bubble is fixed-positioned so its placement in the DOM doesn't matter.
 */
export function DashboardNavHelp() {
  const helpRef = useRef<HelpBubbleHandle>(null)

  return (
    <>
      <button
        onClick={() => helpRef.current?.open()}
        className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100 sm:gap-1.5 sm:px-3"
        style={{ color: GRAY }}
        aria-label="Help"
      >
        <HelpCircle className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Help</span>
      </button>
      <HelpBubble ref={helpRef} />
    </>
  )
}
