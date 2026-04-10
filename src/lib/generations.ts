// Generation limits per plan type
export const PLAN_LIMITS: Record<string, number> = {
  free:           2,  // lifetime total, not weekly
  family:         3,
  launch_special: 3,
  lifetime:       5,
}

export function generationsAllowed(planType: string): number {
  return PLAN_LIMITS[planType] ?? 0
}

export function generationsRemaining(planType: string, used: number): number {
  return Math.max(0, generationsAllowed(planType) - used)
}

/** Free users have a lifetime total (no weekly reset). Only paid plans reset weekly. */
export function isPaidPlan(planType: string): boolean {
  return planType !== "free"
}

/**
 * Returns the UTC timestamp of the most recent midnight NZT for the given day of week.
 * groceryDay: 0=Sunday, 1=Monday, ... 6=Saturday. Defaults to Monday.
 * Handles NZ DST automatically.
 */
export function getLastGroceryDayMidnightUTC(groceryDay: number = 1): Date {
  const tz  = "Pacific/Auckland"
  const now = new Date()

  // Determine current NZT offset by comparing UTC and NZT wall-clock times
  const utcWall = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const nztWall = new Date(now.toLocaleString("en-US", { timeZone: tz }))
  const offsetMs = nztWall.getTime() - utcWall.getTime()

  // Shift now into NZT space (treated as UTC arithmetic)
  const nowNZT = new Date(now.getTime() + offsetMs)

  // How many days ago was the last occurrence of groceryDay? (0 = today)
  const day = nowNZT.getUTCDay() // 0=Sun, 1=Mon … 6=Sat
  const daysAgo = (day - groceryDay + 7) % 7

  const targetNZT = new Date(nowNZT)
  targetNZT.setUTCDate(nowNZT.getUTCDate() - daysAgo)
  targetNZT.setUTCHours(0, 0, 0, 0)

  // Shift back to UTC
  return new Date(targetNZT.getTime() - offsetMs)
}

/** Backward-compatible alias (Monday = 1) */
export function getLastMondayMidnightUTC(): Date {
  return getLastGroceryDayMidnightUTC(1)
}

/** True if week_reset_at predates the most recent midnight NZT for the user's grocery day */
export function weekNeedsReset(weekResetAt: string, groceryDay: number = 1): boolean {
  return new Date(weekResetAt) < getLastGroceryDayMidnightUTC(groceryDay)
}

/** Days remaining in a 14-day free trial, based on account created_at. Negative = expired. */
export function trialDaysRemaining(createdAt: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const elapsed  = Date.now() - new Date(createdAt).getTime()
  return Math.ceil(14 - elapsed / msPerDay)
}
