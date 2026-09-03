const NATIONALITY_TO_ISO = {
  neerlandês: "nl",
  britânico: "gb",
  monegasco: "mc",
  espanhol: "es",
  australiano: "au",
  alemão: "de",
  francês: "fr",
  canadense: "ca",
  finlandês: "fi",
  dinamarquês: "dk",
  japonês: "jp",
  mexicano: "mx",
  italiano: "it",
  estadunidense: "us",
  sueco: "se",
  tailandês: "th",
  argentino: "ar",
  brasileiro: "br",
  chinês: "cn",
  belga: "be",
  neozelandês: "nz",
  austríaco: "at",
  suíço: "ch",
  irlandês: "ie",
  "sul-africano": "za",
  polonês: "pl",
  nederlands: "nl",
} as Record<string, string>

const COUNTRY_TO_ISO = {
  bahrain: "bh",
  bahrein: "bh",
  "saudi arabia": "sa",
  "arábia saudita": "sa",
  australia: "au",
  "austrália": "au",
  italy: "it",
  itália: "it",
  "united states": "us",
  usa: "us",
  "estados unidos": "us",
  spain: "es",
  espanha: "es",
  monaco: "mc",
  mônaco: "mc",
  azerbaijan: "az",
  azerbaijão: "az",
  canada: "ca",
  canadá: "ca",
  france: "fr",
  frança: "fr",
  austria: "at",
  áustria: "at",
  "united kingdom": "gb",
  uk: "gb",
  "reino unido": "gb",
  belgium: "be",
  bélgica: "be",
  singapore: "sg",
  japão: "jp",
  japan: "jp",
  qatar: "qa",
  mexico: "mx",
  méxico: "mx",
  brazil: "br",
  brasil: "br",
  netherlands: "nl",
  "países baixos": "nl",
  "united arab emirates": "ae",
  "emirados árabes unidos": "ae",
  china: "cn",
  hungary: "hu",
  hungria: "hu",
  suíça: "ch",
  suica: "ch",
  switzerland: "ch",
  alemanha: "de",
  germany: "de",
  italia: "it",
  "república tcheca": "cz",
  "czech republic": "cz",
} as Record<string, string>

function lookup(table: Record<string, string>, raw: string | null | undefined) {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  return table[key] ?? null
}

export function flagFromNationality(
  nationality: string | null,
  width = 40,
): string | null {
  const iso =
    lookup(NATIONALITY_TO_ISO, nationality) ??
    (nationality && /^[a-z]{2}$/i.test(nationality.trim())
      ? nationality.toLowerCase()
      : null)
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null
}

export function flagFromCountry(
  country: string | null,
  width = 40,
): string | null {
  const iso = lookup(COUNTRY_TO_ISO, country)
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null
}

const F1_LOGO_BASE =
  "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos"
const F1_2026_BASE =
  "https://media.formula1.com/image/upload/c_fit,h_160/q_auto/v1740000001/common/f1/2026"

function f1Logo(name: string) {
  return `${F1_LOGO_BASE}/${encodeURIComponent(name)}.png.transform/1col/image.png`
}

export interface TeamLogoAsset {
  url: string
  className?: string
}

const TEAM_LOGO_BY_NAME: Record<string, TeamLogoAsset> = {
  "Red Bull Racing": { url: f1Logo("Red Bull") },
  Ferrari: { url: f1Logo("Ferrari") },
  McLaren: { url: f1Logo("McLaren") },
  Mercedes: { url: f1Logo("Mercedes") },
  "Aston Martin": { url: f1Logo("Aston Martin") },
  Alpine: { url: f1Logo("Alpine") },
  Williams: { url: f1Logo("Williams") },
  Haas: { url: f1Logo("Haas") },
  AlphaTauri: { url: f1Logo("AlphaTauri") },
  "Alfa Romeo": { url: f1Logo("Alfa Romeo") },
  "Kick Sauber": { url: f1Logo("Kick Sauber") },
  RB: { url: f1Logo("RB") },
  "Visa Cash App RB": { url: f1Logo("RB") },
  "Racing Bulls": {
    url: `${F1_2026_BASE}/racingbulls/2026racingbullslogo.webp`,
  },
  Audi: {
    url: `${F1_2026_BASE}/audi/2026audilogowhite.webp`,
    className: "brightness-0 dark:brightness-100",
  },
  Cadillac: {
    url: `${F1_2026_BASE}/cadillac/2026cadillaclogo.webp`,
  },
}

export function teamLogo(name: string): TeamLogoAsset | null {
  return TEAM_LOGO_BY_NAME[name] ?? null
}

const ENGINE_LOGOS: Record<string, string> = {
  Ferrari: "https://upload.wikimedia.org/wikipedia/en/d/df/Scuderia_Ferrari_HP_logo_24.svg",
  Mercedes:
    "https://upload.wikimedia.org/wikipedia/commons/9/9e/Mercedes-Benz_Logo_2010.svg",
  Renault:
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Renault_2021.svg",
  Honda: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Honda_Racing_logo_%282022%29.svg",
  "Honda RBPT":
    "https://upload.wikimedia.org/wikipedia/commons/c/c7/Honda_Racing_logo_%282022%29.svg",
  "Red Bull Ford":
    "https://upload.wikimedia.org/wikipedia/en/a/ae/Red_Bull_Powertrains_logo.png",
  Audi: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
}

export function engineLogo(name: string | null): string | null {
  if (!name) return null
  return ENGINE_LOGOS[name] ?? null
}
