export type SupportResource = { label: string; detail: string; phone: string };

// The first contact is always a real person the student knows.
// Sara: replace these two TODO lines before any student uses the app.
const SCHOOL_CONTACT: SupportResource = {
  label: "Someone you trust",
  detail: "A teacher, a parent, an older sibling, a friend. Saying it out loud to one person helps more than it sounds like it will.",
  phone: "",
};

// Verified against findahelpline.com on 17 September 2026.
// Only add a country here if you have checked the numbers yourself.
// Anywhere not listed falls back to the findahelpline directory below.
const BY_COUNTRY: Record<string, SupportResource[]> = {
  PK: [
    {
      label: "Rozan Counselling Helpline",
      detail: "Free and confidential emotional support.",
      phone: "0304 111 1741",
    },
    {
      label: "Emergency services",
      detail: "If you or someone else is in immediate danger.",
      phone: "1122",
    },
  ],
};

export function resourcesForCountry(code?: string): SupportResource[] {
  const cc = (code ?? "").toUpperCase();
  const local = BY_COUNTRY[cc];
  if (local) return [SCHOOL_CONTACT, ...local];
  const where = cc ? "findahelpline.com/countries/" + cc.toLowerCase() : "findahelpline.com";
  return [
    SCHOOL_CONTACT,
    {
      label: "Helplines near you",
      detail: "A checked, current list of free helplines for your country.",
      phone: where,
    },
  ];
}

const cache = new Map<string, { cc: string; at: number }>();

// Country only, from the request IP. Nothing is stored, nothing is asked of the user.
export async function countryFromIp(ip?: string): Promise<string | undefined> {
  if (!ip) return undefined;
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.cc;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 1500);
    const res = await fetch("https://api.country.is/" + encodeURIComponent(ip), { signal: ctl.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { country?: string };
    if (data.country) {
      cache.set(ip, { cc: data.country, at: Date.now() });
      return data.country;
    }
  } catch {
    // Best effort only. Never let this delay or block a crisis reply.
  }
  return undefined;
}
