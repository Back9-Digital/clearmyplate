const GHL_API = "https://services.leadconnectorhq.com"
const GHL_VERSION = "2021-07-28"

function planTag(planType: string): string {
  switch (planType) {
    case "family":
    case "family_monthly":
    case "family_annual":  return "plan-family"
    case "launch_special": return "plan-launch-special"
    case "lifetime":       return "plan-lifetime"
    default:               return "plan-free"
  }
}

type UpsertContactParams = {
  email: string
  tags: string[]
  firstName?: string
}

async function upsertContact(params: UpsertContactParams): Promise<void> {
  const token      = process.env.GHL_PRIVATE_TOKEN
  const locationId = process.env.GHL_LOCATION_ID

  if (!token || !locationId) {
    console.warn("[ghl] GHL_PRIVATE_TOKEN or GHL_LOCATION_ID not set — skipping")
    return
  }

  const body: Record<string, unknown> = {
    locationId,
    email: params.email,
    tags:  params.tags,
  }
  if (params.firstName) body.firstName = params.firstName

  const res = await fetch(`${GHL_API}/contacts/upsert`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      Version:        GHL_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)")
    throw new Error(`GHL upsert failed ${res.status}: ${text}`)
  }
}

/** Called on signup — tags the contact as a free user */
export async function ghlTrackSignup(email: string, firstName?: string): Promise<void> {
  try {
    await upsertContact({
      email,
      firstName,
      tags: ["clearmyplate", "clearmyplate-signup", "plan-free", "welcome"],
    })
  } catch (err) {
    console.error("[ghl] signup upsert failed:", err)
  }
}

/** Adds arbitrary tags to an existing (or new) GHL contact */
export async function ghlAddTags(email: string, tags: string[]): Promise<void> {
  try {
    await upsertContact({ email, tags })
  } catch (err) {
    console.error("[ghl] addTags upsert failed:", err)
  }
}

/** Called on successful payment — updates the contact with their paid plan tag */
export async function ghlTrackPayment(email: string, planType: string): Promise<void> {
  try {
    await upsertContact({
      email,
      tags: ["clearmyplate", "clearmyplate-paid", planTag(planType)],
    })
  } catch (err) {
    console.error("[ghl] payment upsert failed:", err)
  }
}
