const NATIONALITY_TO_ISO = {
  neerlandês: "nl",

  cingalês: "lk",
  "sul-coreano": "kr",
  colombiano: "co",
  jamaicano: "jm",
  português: "pt",
  "hongconguês": "hk",
  estadunidense: "us",

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
  holandês: "nl",
  russo: "ru",
  raf: "ru",
  venezuelano: "ve",
  indiano: "in",
  húngaro: "hu",
  indonésio: "id",
  indonesian: "id",
  malaio: "my",
  nederlands: "nl",

  dutch: "nl",
  british: "gb",
  monegasque: "mc",
  spanish: "es",
  australian: "au",
  german: "de",
  french: "fr",
  canadian: "ca",
  finnish: "fi",
  danish: "dk",
  japanese: "jp",
  mexican: "mx",
  italian: "it",
  american: "us",
  swedish: "se",
  thai: "th",
  argentine: "ar",
  brazilian: "br",
  chinese: "cn",
  belgian: "be",
  "new zealander": "nz",
  austrian: "at",
  swiss: "ch",
  irish: "ie",
  "south african": "za",
  polish: "pl",
  russian: "ru",
  venezuelan: "ve",
  indian: "in",
  colombian: "co",
  portuguese: "pt",
  hungarian: "hu",
  malaysian: "my",
  norwegian: "no",
  paraguayan: "py",
  bulgarian: "bg",


  búlgaro: "bg",
  paraguaio: "py",
  americano: "us",
  norueguês: "no",
  "ar": "ar",
  "co": "co",
  "nl": "nl",
  "gb": "gb",
  "nz": "nz",
  "sg": "sg",

} as Record<string, string>

const COUNTRY_TO_ISO = {
  malaysia: "my",
  "malásia": "my",
  malasia: "my",
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
  singapura: "sg",
  japão: "jp",
  japan: "jp",
  qatar: "qa",
  "catar": "qa",
  "uae": "ae",
  "abu dhabi": "ae",
  "méxico": "mx",
  mexico: "mx",
  brazil: "br",
  brasil: "br",
  netherlands: "nl",
  holanda: "nl",
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

  dutch: "nl",
  british: "gb",
  monegasque: "mc",
  spanish: "es",
  australian: "au",
  german: "de",
  french: "fr",
  canadian: "ca",
  finnish: "fi",
  danish: "dk",
  japanese: "jp",
  mexican: "mx",
  italian: "it",
  american: "us",
  swedish: "se",
  thai: "th",
  argentine: "ar",
  brazilian: "br",
  chinese: "cn",
  belgian: "be",
  "new zealander": "nz",
  austrian: "at",
  swiss: "ch",
  irish: "ie",
  "south african": "za",
  polish: "pl",
  russian: "ru",
  venezuelan: "ve",
  indian: "in",
  colombian: "co",
  portuguese: "pt",
  hungarian: "hu",
  indonesian: "id",
  malaysian: "my",
  norwegian: "no",
  paraguayan: "py",
  bulgarian: "bg",


  búlgaro: "bg",
  paraguaio: "py",
  americano: "us",
  norueguês: "no",
  "ar": "ar",
  "co": "co",
  "nl": "nl",
  "gb": "gb",
  "nz": "nz",
  "sg": "sg",

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
  country: string | null | undefined,
  width = 40,
): string | null {
  const iso = lookup(COUNTRY_TO_ISO, country ?? null)
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null
}

const F1_LOGO_BASE =
  "https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/team%20logos"
const F1_2026_BASE =
  "https://media.formula1.com/image/upload/c_fit,h_160/q_auto/v1740000001/common/f1/2026"

export function f1Logo(name: string) {
  return `${F1_LOGO_BASE}/${encodeURIComponent(name)}.png.transform/1col/image.png`
}

export interface TeamLogoAsset {
  url: string
  className?: string
  color?: string
  invertDark?: boolean
}


export const TEAM_SEASON_LOGOS: Record<string, Record<number, TeamLogoAsset>> = {
  "Ferrari": {
    ...Object.fromEntries(Array.from({ length: 35 }, (_, i) => [1950 + i, { url: "/teams/ferrari_classic.svg", color: "#CE2B37", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1985 + i, { url: "/ferrari/1983-1994.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [1994 + i, { url: "/ferrari/1994-1996.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [1996 + i, { url: "/ferrari/1996-2006.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2007 + i, { url: "/ferrari/2007-2010.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [2011 + i, { url: "/ferrari/2011-2017.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2018 + i, { url: "/ferrari/2018.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2019 + i, { url: "/ferrari/2018-2021.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2022 + i, { url: "/ferrari/2022-2024.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2024 + i, { url: "/ferrari/2024-Present.jpg", className: "bg-white rounded-sm" }])),
  },
  "Mercedes": {
    1954: { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" },
    1955: { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" },
    ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => [2010 + i, { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Mercedes-AMG Petronas": {
    ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => [2010 + i, { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Mercedes-AMG Petronas F1 Team": {
    ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => [2010 + i, { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Red Bull": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [2005 + i, { url: "/teams/red_bull_racing_classic.svg", color: "#001A30", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2018 + i, { url: "/teams/aston_martin_red_bull_racing.svg", color: "#001A30", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2022 + i, { url: "/teams/oracle_red_bull_racing.svg", color: "#041E42", className: "object-contain p-0.5 filter-none" }])),
  },
  "Red Bull Racing": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [2005 + i, { url: "/teams/red_bull_racing_classic.svg", color: "#001A30", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2018 + i, { url: "/teams/aston_martin_red_bull_racing.svg", color: "#001A30", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2022 + i, { url: "/teams/oracle_red_bull_racing.svg", color: "#041E42", className: "object-contain p-0.5 filter-none" }])),
  },
  "Racing Bulls": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2024 + i, { url: "/teams/racing_bulls.svg", color: "#0D1B3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "RB": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2024 + i, { url: "/teams/racing_bulls.svg", color: "#0D1B3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Visa Cash App RB": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2024 + i, { url: "/teams/racing_bulls.svg", color: "#0D1B3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "McLaren": {
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => [1966 + i, { url: "/teams/mclaren_classic.svg", color: "#FF1801", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1985 + i, { url: "/mclaren/1981-1990.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/mclaren/1991-1997.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1997 + i, { url: "/mclaren/1997-2006.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2007 + i, { url: "/mclaren/2007-2017.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2017 + i, { url: "/mclaren/2017-2021.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2021 + i, { url: "/mclaren/2021-Present.jpg", className: "bg-white rounded-sm" }])),
  },
  "Renault": {
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1977 + i, { url: "/teams/renault_turbo.svg", color: "#FFD000", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 25 }, (_, i) => [1986 + i, { url: "/alpine/renault-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2011 + i, { url: "/alpine/lotus.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2016 + i, { url: "/alpine/renault-2.jpg", className: "bg-white rounded-sm" }])),
  },
  "Haas": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2016 + i, { url: "/teams/haas_f1_team.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    2019: { url: "/teams/rich_energy_haas.svg", color: "#000000", className: "object-contain p-0.5 filter-none" },
    2020: { url: "/teams/haas_f1_team.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
    2021: { url: "/teams/uralkali_haas.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
    2022: { url: "/teams/haas_f1_team.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2023 + i, { url: "/teams/moneygram_haas.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Rich Energy Haas F1 Team": {
    2019: { url: "/teams/rich_energy_haas.svg", color: "#000000", className: "object-contain p-0.5 filter-none" },
  },
  "Williams": {
    ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [1978 + i, { url: "/teams/williams_grand_prix.svg", color: "#001B36", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1994 + i, { url: "/williams/williams-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [2000 + i, { url: "/williams/williams-3.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2014 + i, { url: "/williams/williams-4.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2019 + i, { url: "/williams/williams-5.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2022 + i, { url: "/williams/williams-6.jpg", className: "bg-white rounded-sm" }])),
  },
  "Williams Grand Prix Engineering": {
    ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [1978 + i, { url: "/teams/williams_grand_prix.svg", color: "#001B36", className: "object-contain p-0.5 filter-none" }])),
  },
  "Sauber": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1993 + i, { url: "/teams/sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, { url: "/teams/bmw_sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [2010 + i, { url: "/teams/sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2024 + i, { url: "/teams/kicksauber.svg", color: "#52E252", className: "brightness-100 filter-none" }])),
  },
  "Sauber F1 Team": {
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [2010 + i, { url: "/teams/sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Sauber Clássica": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1993 + i, { url: "/teams/sauber_classic.svg", color: "#001D38", className: "object-contain p-0.5 filter-none" }])),
  },
  "BMW Sauber": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, { url: "/teams/bmw_sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "BMW Sauber F1 Team": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, { url: "/teams/bmw_sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Virgin": {
    2010: { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
    2011: { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Virgin Racing": {
    2010: { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Marussia Virgin": {
    2011: { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Marussia": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/teams/marussia.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Marussia F1 Team": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/teams/marussia.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Manor Marussia": {
    2015: { url: "/teams/manor_marussia.svg", color: "#18181C", className: "object-contain p-0.5 filter-none" },
    2016: { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
    2017: { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
  },
  "Manor Racing": {
    2016: { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
    2017: { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
  },
  "Lotus": {
    ...Object.fromEntries(Array.from({ length: 35 }, (_, i) => [1960 + i, { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }])),
    2010: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
    2011: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  },
  "Team Lotus": {
    ...Object.fromEntries(Array.from({ length: 35 }, (_, i) => [1960 + i, { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }])),
  },
  "Caterham": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/teams/caterham.svg", color: "#003D1B", className: "object-contain p-0.5 filter-none" }])),
  },
  "Caterham F1 Team": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/teams/caterham.svg", color: "#003D1B", className: "object-contain p-0.5 filter-none" }])),
  },
  "HRT": {
    2010: { url: "/teams/hispania.svg", color: "#E10600", className: "object-contain p-0.5" },
    2011: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
    2012: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
  },
  "Brawn": {
    2009: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Brawn GP": {
    2009: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Brawn GP Formula One Team": {
    2009: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  },
  "Toyota": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2002 + i, { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Toyota Racing": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2002 + i, { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Panasonic Toyota Racing": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2002 + i, { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Honda": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1964 + i, { url: "/honda/honda-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1983 + i, { url: "/honda/honda-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2006 + i, { url: "/teams/honda.svg", color: "#fc0217", className: "object-contain p-0.5" }])),
  },
  "Super Aguri": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2006 + i, { url: "/teams/superaguri.svg", color: "#FFFFFF", className: "object-contain p-0.5" }])),
  },
  "Spyker": {
    2007: { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  },
  "Spyker F1 Team": {
    2007: { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  },
  "Spyker MF1": {
    2006: { url: "/teams/spykermf1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  },
  "Spyker MF1 Racing": {
    2006: { url: "/teams/spykermf1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  },
  "MF1": {
    2006: { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  },
  "MF1 Racing": {
    2006: { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  },
  "Midland": {
    2006: { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  },
  "BAR": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Lucky Strike BAR Honda": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "BAR Honda": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "British American Racing": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Jaguar": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2000 + i, { url: "/teams/jaguar.svg", color: "#004225", className: "object-contain p-0.5" }])),
  },
  "Arrows": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1978 + i, { url: "/teams/arrows_classic.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1997 + i, { url: "/teams/arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2000 + i, { url: "/teams/orange_arrows.svg", color: "#000000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Arrows Grand Prix": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1978 + i, { url: "/teams/arrows_classic.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1997 + i, { url: "/teams/arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Orange Arrows": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2000 + i, { url: "/teams/orange_arrows.svg", color: "#000000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Footwork": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Arrows Footwork": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Footwork Arrows": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1986 + i, { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1994 + i, { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton Formula": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1986 + i, { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1994 + i, { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton Formula United Colors of Benetton": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1986 + i, { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton Formula United Colors": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1986 + i, { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton United": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1986 + i, { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Benetton Formula Mild Seven": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1994 + i, { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" }])),
  },
  "Prost": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1997 + i, { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" }])),
    2001: { url: "/teams/prost_acer.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  },
  "Prost Grand Prix": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1997 + i, { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" }])),
    2001: { url: "/teams/prost_acer.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  },
  "Prost Grand Prix Acer": {
    2001: { url: "/teams/prost_acer.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  },
  "Stewart": {
    1997: { url: "/teams/stewart_1997.svg", color: "#0C2340", className: "object-contain p-0.5" },
    1998: { url: "/teams/stewart_1997.svg", color: "#0C2340", className: "object-contain p-0.5" },
    1999: { url: "/teams/stewart.png", color: "#FFFFFF", className: "object-contain p-0.5" },
  },
  "Tyrrell": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1970 + i, { url: "/teams/tyrrell.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1980 + i, { url: "/teams/tyrrell_candy_braun.svg", color: "#00142A", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1993 + i, { url: "/teams/tyrrell.svg", color: "#002B7F", className: "object-contain p-1" }])),
  },
  "Tyrrell Candy Braun": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1980 + i, { url: "/teams/tyrrell_candy_braun.svg", color: "#00142A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Ligier": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1976 + i, { url: "/teams/ligier_gitanes.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1986 + i, { url: "/teams/ligier_blondes.svg", color: "#001C42", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1993 + i, { url: "/teams/ligier_gauloises.svg", color: "#001D4A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Ligier F1 Team Gitanes": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1976 + i, { url: "/teams/ligier_gitanes.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }])),
  },
  "Ligier Gitanes Blondes": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1986 + i, { url: "/teams/ligier_blondes.svg", color: "#001C42", className: "object-contain p-0.5 filter-none" }])),
  },
  "Ligier F1 Gauloises": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1993 + i, { url: "/teams/ligier_gauloises.svg", color: "#001D4A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Forti": {
    1995: { url: "/teams/forti.svg", color: "#FFCC00", className: "object-contain p-0.5" },
    1996: { url: "/teams/forti.svg", color: "#FFCC00", className: "object-contain p-0.5" },
  },
  "Pacific": {
    1994: { url: "/teams/pacific.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
    1995: { url: "/teams/pacific.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  },
  "Simtek": {
    1994: { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
    1995: { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
  },
  "MTV Simtek Ford": {
    1994: { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
    1995: { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
  },
  "Leyton House": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1988 + i, { url: "/teams/leytonhouse.svg", color: "#071017", className: "object-contain p-0.5 filter-none" }])),
  },
  "Leyton House Racing": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1988 + i, { url: "/teams/leytonhouse.svg", color: "#071017", className: "object-contain p-0.5 filter-none" }])),
  },
  "Brabham": {
    ...Object.fromEntries(Array.from({ length: 31 }, (_, i) => [1962 + i, { url: "/classic/brabham.svg", color: "#001633", className: "object-contain p-0.5 filter-none" }])),
  },
  "Euro Brun": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1988 + i, { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" }])),
  },
  "EuroBrun": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1988 + i, { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" }])),
  },
  "Osella": {
    ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [1980 + i, { url: "/classic/osella.svg", color: "#0E1117", className: "object-contain p-0.5 filter-none" }])),
  },
  "Onyx": {
    1989: { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
    1990: { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
  },
  "Moneytron Onyx": {
    1989: { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
    1990: { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
  },
  "Spirit": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1982 + i, { url: "/classic/spirit.svg", color: "#0E1014", className: "object-contain p-0.5 filter-none" }])),
  },
  "Spirit Racing": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1982 + i, { url: "/classic/spirit.svg", color: "#0E1014", className: "object-contain p-0.5 filter-none" }])),
  },
  "Toleman": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1981 + i, { url: "/classic/toleman.svg", color: "#001B44", className: "object-contain p-0.5 filter-none" }])),
  },
  "Toleman Motorsport": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1981 + i, { url: "/classic/toleman.svg", color: "#001B44", className: "object-contain p-0.5 filter-none" }])),
  },
  "Theodore": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, { url: "/classic/theodore.svg", color: "#D60000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Theodore Racing": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, { url: "/classic/theodore.svg", color: "#D60000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Fittipaldi": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1975 + i, { url: "/classic/fittipaldi.svg", color: "#009B3A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Fittipaldi Automotive": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1975 + i, { url: "/classic/fittipaldi.svg", color: "#009B3A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Ensign": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1973 + i, { url: "/classic/ensign.svg", color: "#0A1830", className: "object-contain p-0.5 filter-none" }])),
  },
  "Team Ensign": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1973 + i, { url: "/classic/ensign.svg", color: "#0A1830", className: "object-contain p-0.5 filter-none" }])),
  },
  "Shadow": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1973 + i, { url: "/classic/shadow.svg", color: "#050608", className: "object-contain p-0.5 filter-none" }])),
  },
  "Shadow Racing Cars": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1973 + i, { url: "/classic/shadow.svg", color: "#050608", className: "object-contain p-0.5 filter-none" }])),
  },
  "March": {
    ...Object.fromEntries(Array.from({ length: 23 }, (_, i) => [1970 + i, { url: "/classic/march.svg", color: "#009384", className: "object-contain p-0.5 filter-none" }])),
  },
  "March Engineering": {
    ...Object.fromEntries(Array.from({ length: 23 }, (_, i) => [1970 + i, { url: "/classic/march.svg", color: "#009384", className: "object-contain p-0.5 filter-none" }])),
  },
  "Wolf": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1976 + i, { url: "/classic/wolf.svg", color: "#0A0A0A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Walter Wolf Racing": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1976 + i, { url: "/classic/wolf.svg", color: "#0A0A0A", className: "object-contain p-0.5 filter-none" }])),
  },
  "Hesketh": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1973 + i, { url: "/classic/hesketh.svg", color: "#C00000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Hesketh Racing": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1973 + i, { url: "/classic/hesketh.svg", color: "#C00000", className: "object-contain p-0.5 filter-none" }])),
  },
  "Surtees": {
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1970 + i, { url: "/classic/surtees.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }])),
  },
  "BRM": {
    ...Object.fromEntries(Array.from({ length: 27 }, (_, i) => [1951 + i, { url: "/classic/brm.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }])),
  },
  "British Racing Motors": {
    ...Object.fromEntries(Array.from({ length: 27 }, (_, i) => [1951 + i, { url: "/classic/brm.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }])),
  },
  "Matra": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1968 + i, { url: "/classic/matra.svg", color: "#0038A8", className: "object-contain p-0.5 filter-none" }])),
  },
  "Equipe Matra Sports": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1968 + i, { url: "/classic/matra.svg", color: "#0038A8", className: "object-contain p-0.5 filter-none" }])),
  },
  "Cooper": {
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [1950 + i, { url: "/classic/cooper.svg", color: "#002D15", className: "object-contain p-0.5 filter-none" }])),
  },
  "Cooper Car Company": {
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [1950 + i, { url: "/classic/cooper.svg", color: "#002D15", className: "object-contain p-0.5 filter-none" }])),
  },
  "Maserati": {
    ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [1950 + i, { url: "/classic/maserati.svg", color: "#0A1832", className: "object-contain p-0.5 filter-none" }])),
  },
  "Officine Alfieri Maserati": {
    ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [1950 + i, { url: "/classic/maserati.svg", color: "#0A1832", className: "object-contain p-0.5 filter-none" }])),
  },
  "Vanwall": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1954 + i, { url: "/classic/vanwall.svg", color: "#003515", className: "object-contain p-0.5 filter-none" }])),
  },
  "Eagle": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1966 + i, { url: "/classic/eagle.svg", color: "#0A152E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Anglo American Racers": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1966 + i, { url: "/classic/eagle.svg", color: "#0A152E", className: "object-contain p-0.5 filter-none" }])),
  },
  "Porsche": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1960 + i, { url: "/classic/porsche.svg", color: "#141416", className: "object-contain p-0.5 filter-none" }])),
  },
  "Penske": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1974 + i, { url: "/classic/penske.svg", color: "#002244", className: "object-contain p-0.5 filter-none" }])),
  },
  "Penske Cars": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1974 + i, { url: "/classic/penske.svg", color: "#002244", className: "object-contain p-0.5 filter-none" }])),
  },
  "Minardi": {
    ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [1985 + i, { url: "/teams/minardi.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }])),
  },
  "Minardi F1 Team": {
    ...Object.fromEntries(Array.from({ length: 21 }, (_, i) => [1985 + i, { url: "/teams/minardi.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }])),
  },
  "Minardi European": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }])),
  },
  "European Minardi": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }])),
  },
  "Jordan": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }])),
    1997: { url: "/teams/jordan_bitten_hisses.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
    1998: { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
    1999: { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
    2000: { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }])),
  },
  "Jordan Grand Prix": {
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [1991 + i, { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }])),
  },
  "Jordan Grand Prix Buzzin Hornets": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }])),
  },
  "Jordan Grand Prix Bitten Hisses": {
    1997: { url: "/teams/jordan_bitten_hisses.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
  },
} 

const TEAM_LOGO_BY_NAME: Record<string, TeamLogoAsset> = {
  // F1 2026 Official Vector SVG Assets
  Ferrari: {
    url: `${F1_2026_BASE}/ferrari/2026ferrarilogowhite.svg`,
    color: "#E8002D",
  },
  Mercedes: {
    url: "/teams/mercedes_amg_petronas.svg",
    color: "#0A141A",
    className: "object-contain p-0.5 filter-none",
  },
  "Mercedes-AMG Petronas": {
    url: "/teams/mercedes_amg_petronas.svg",
    color: "#0A141A",
    className: "object-contain p-0.5 filter-none",
  },
  "Mercedes-AMG Petronas F1 Team": {
    url: "/teams/mercedes_amg_petronas.svg",
    color: "#0A141A",
    className: "object-contain p-0.5 filter-none",
  },
  "Red Bull Racing": {
    url: "/teams/oracle_red_bull_racing.svg",
    color: "#041E42",
    className: "object-contain p-0.5 filter-none",
  },
  "Red Bull": {
    url: "/teams/oracle_red_bull_racing.svg",
    color: "#041E42",
    className: "object-contain p-0.5 filter-none",
  },
  "Oracle Red Bull Racing": {
    url: "/teams/oracle_red_bull_racing.svg",
    color: "#041E42",
    className: "object-contain p-0.5 filter-none",
  },
  "Aston Martin Red Bull Racing": {
    url: "/teams/aston_martin_red_bull_racing.svg",
    color: "#001A30",
    className: "object-contain p-0.5 filter-none",
  },
  McLaren: {
    url: `${F1_2026_BASE}/mclaren/2026mclarenlogowhite.svg`,
    color: "#FF8000",
  },
  "Aston Martin": {
    url: "/teams/astonmartin.svg",
    color: "#229971",
  },
  Alpine: {
    url: `${F1_2026_BASE}/alpine/2026alpinelogowhite.svg`,
    color: "#0093CC",
  },
  Williams: {
    url: `${F1_2026_BASE}/williams/2026williamslogowhite.svg`,
    color: "#005AFF",
  },
  RB: {
    url: "/teams/racing_bulls.svg",
    color: "#0D1B3E",
    className: "object-contain p-0.5 filter-none",
  },
  "Racing Bulls": {
    url: "/teams/racing_bulls.svg",
    color: "#0D1B3E",
    className: "object-contain p-0.5 filter-none",
  },
  "Visa Cash App RB": {
    url: "/teams/racing_bulls.svg",
    color: "#0D1B3E",
    className: "object-contain p-0.5 filter-none",
  },
  "Visa Cash App RB Formula One Team": {
    url: "/teams/racing_bulls.svg",
    color: "#0D1B3E",
    className: "object-contain p-0.5 filter-none",
  },
  Haas: {
    url: "/teams/moneygram_haas.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Haas F1 Team": {
    url: "/teams/haas_f1_team.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Rich Energy Haas F1 Team": {
    url: "/teams/rich_energy_haas.svg",
    color: "#000000",
    className: "object-contain p-0.5 filter-none",
  },
  "MoneyGram Haas F1 Team": {
    url: "/teams/moneygram_haas.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Moneygran Haas F1 Team": {
    url: "/teams/moneygram_haas.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Uralkali Haas F1 Team": {
    url: "/teams/uralkali_haas.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  Audi: {
    url: `${F1_2026_BASE}/audi/2026audilogowhite.svg`,
    color: "#1A1A1A",
  },
  Cadillac: {
    url: "/teams/cadillac.svg",
    color: "#111111",
  },
  "Kick Sauber": {
    url: "/teams/kicksauber.svg",
    color: "#52E252",
    className: "brightness-100 filter-none",
  },
  Sauber: {
    url: "/teams/sauber.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Sauber F1 Team": {
    url: "/teams/sauber.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Sauber Motorsport": {
    url: "/teams/sauber.svg",
    color: "#FFFFFF",
    className: "object-contain p-0.5 filter-none",
  },
  "Alfa Romeo": {
    url: "/teams/alfaromeo.svg",
    color: "#900000",
    className: "object-contain",
  },
  AlphaTauri: {
    url: "/teams/alphatauri.svg",
    color: "#00293F",
  },

  // F2 & F3 Teams
  "Campos Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/camposracing/2026camposracinglogowhite.svg",
    color: "#F58220",
  },
  "Invicta Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/invictaracing/2026invictaracinglogowhite.svg",
    color: "#FFD700",
  },
  "Rodin Motorsport": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/rodinmotorsport/2026rodinmotorsportlogowhite.svg",
    color: "#111111",
  },
  "MP Motorsport": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/mpmotorsport/2026mpmotorsportlogowhite.svg",
    color: "#F37320",
  },
  "DAMS Lucas Oil": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/damslucasoil/2026damslucasoillogowhite.svg",
    color: "#00A0E3",
  },
  "ART Grand Prix": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/artgrandprix/2026artgrandprixlogowhite.svg",
    color: "#111111",
  },
  TRIDENT: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/trident/2026tridentlogowhite.svg",
    color: "#0033A0",
  },
  Trident: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/trident/2026tridentlogowhite.svg",
    color: "#0033A0",
  },
  "Hitech Pulse-Eight": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/hitech/2026hitechlogowhite.svg",
    color: "#1E1E1E",
  },
  Hitech: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/hitech/2026hitechlogowhite.svg",
    color: "#1E1E1E",
  },
  "Van Amersfoort Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/vanamersfoortracing/2026vanamersfoortracinglogowhite.svg",
    color: "#F58220",
  },
  "PREMA Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/premaracing/2026premaracinglogowhite.svg",
    color: "#E30613",
  },
  "Prema Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/premaracing/2026premaracinglogowhite.svg",
    color: "#E30613",
  },
  "AIX Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/aixracing/2026aixracinglogowhite.svg",
    color: "#C4D600",
  },
  "PHM AIX Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/aixracing/2026aixracinglogowhite.svg",
    color: "#C4D600",
  },
  "Jenzer Motorsport": {
    url: "https://upload.wikimedia.org/wikipedia/en/d/dd/Jenzer_Motorsport.png",
    color: "#0033A0",
  },

  // Historical / Classic Teams
  Jaguar: { url: "/teams/jaguar.svg", color: "#004225", className: "object-contain p-0.5" },
  Arrows: { url: "/teams/arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Arrows Grand Prix": { url: "/teams/arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  Footwork: { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Arrows Footwork": { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Footwork Arrows": { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  Benetton: { url: "/teams/benetton_mild_seven.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  Prost: { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  Stewart: { url: "/teams/stewart.png", color: "#FFFFFF", className: "object-contain p-0.5" },
  Tyrrell: { url: "/teams/tyrrell_candy_braun.svg", color: "#00142A", className: "object-contain p-0.5 filter-none" },
  "Tyrrell Candy Braun": { url: "/teams/tyrrell_candy_braun.svg", color: "#00142A", className: "object-contain p-0.5 filter-none" },
  "Tyrrell Racing": { url: "/teams/tyrrell.svg", color: "#002B7F", className: "object-contain p-1" },
  Ligier: { url: "/teams/ligier_gauloises.svg", color: "#001D4A", className: "object-contain p-0.5 filter-none" },
  "Ligier F1 Gauloises": { url: "/teams/ligier_gauloises.svg", color: "#001D4A", className: "object-contain p-0.5 filter-none" },
  "Ligier Gitanes Blondes": { url: "/teams/ligier_blondes.svg", color: "#001C42", className: "object-contain p-0.5 filter-none" },
  "Ligier Gitanes": { url: "/teams/ligier_gitanes.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" },
  Forti: { url: "/teams/forti.svg", color: "#FFCC00", className: "object-contain p-0.5" },
  Pacific: { url: "/teams/pacific.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Simtek: { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
  "MTV Simtek Ford": { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
  "Simtek Grand Prix": { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" },
  "Williams Grand Prix Engineering": { url: "/teams/williams_grand_prix.svg", color: "#001B36", className: "object-contain p-0.5 filter-none" },
  "Leyton House": { url: "/teams/leytonhouse.svg", color: "#071017", className: "object-contain p-0.5 filter-none" },
  "Leyton House Racing": { url: "/teams/leytonhouse.svg", color: "#071017", className: "object-contain p-0.5 filter-none" },
  Fondmetal: { url: "/teams/fondmetal.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Lambo: { url: "/teams/lambo.svg", color: "#0D1322", className: "object-contain p-0.5" },
  "Modena Team": { url: "/teams/lambo.svg", color: "#0D1322", className: "object-contain p-0.5" },
  "Andrea Moda": { url: "/teams/andreamoda.svg", color: "#111111", className: "object-contain p-0.5" },
  Minardi: { url: "/teams/minardi.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  "Minardi F1 Team": { url: "/teams/minardi.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  "Minardi European": { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  "European Minardi": { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  Jordan: { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
  "Jordan Grand Prix": { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
  "Jordan Grand Prix Buzzin Hornets": { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
  "Jordan Grand Prix Bitten Hisses": { url: "/teams/jordan_bitten_hisses.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" },
  "Super Aguri": { url: "/teams/superaguri.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Honda: { url: "/teams/honda.svg", color: "#fc0217", className: "object-contain p-0.5" },
  Toyota: { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Toyota Racing": { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Panasonic Toyota Racing": { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  Brawn: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Brawn GP": { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Brawn GP Formula One Team": { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  HRT: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
  Lotus: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  "Team Lotus": { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  Caterham: { url: "/teams/caterham.svg", color: "#003D1B", className: "object-contain p-0.5 filter-none" },
  "Caterham F1 Team": { url: "/teams/caterham.svg", color: "#003D1B", className: "object-contain p-0.5 filter-none" },
  Virgin: { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Virgin Racing": { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  Marussia: { url: "/teams/marussia.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Marussia F1 Team": { url: "/teams/marussia.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Marussia Virgin": { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Manor Marussia": { url: "/teams/manor_marussia.svg", color: "#18181C", className: "object-contain p-0.5 filter-none" },
  "Manor Racing": { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
  Manor: { url: "/teams/manor_racing.svg", color: "#001428", className: "object-contain p-0.5 filter-none" },
  "Sauber Clássica": { url: "/teams/sauber_classic.svg", color: "#001D38", className: "object-contain p-0.5 filter-none" },
  "BMW Sauber": { url: "/teams/bmw_sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "BMW Sauber F1 Team": { url: "/teams/bmw_sauber.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  BAR: { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "BAR Honda": { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Lucky Strike BAR Honda": { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "British American Racing": { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" },
  "Orange Arrows": { url: "/teams/orange_arrows.svg", color: "#000000", className: "object-contain p-0.5 filter-none" },
  "Prost Grand Prix": { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  "Prost Grand Prix Acer": { url: "/teams/prost_acer.svg", color: "#002060", className: "object-contain p-0.5 filter-none" },
  "Benetton Formula": { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" },
  "Benetton Formula Mild Seven": { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" },
  "Benetton Formula United Colors of Benetton": { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" },
  "Benetton Formula United Colors": { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" },
  "Benetton United": { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" },
  Spyker: { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  "Spyker F1": { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  "Spyker F1 Team": { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  "Spyker MF1": { url: "/teams/spykermf1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  "Spyker MF1 Racing": { url: "/teams/spykermf1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" },
  MF1: { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  "MF1 Racing": { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  Midland: { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" },
  "Force India": { url: "/teams/forceindia.svg", color: "#F58020", className: "object-contain" },
  "Racing Point": { url: "/teams/racingpoint.svg", color: "#F596C8" },
  "Toro Rosso": { url: "/teams/tororosso.svg", color: "#001A30", className: "object-contain brightness-100 filter-none" },
  "Lotus F1": { url: "/teams/lotusf1.svg", color: "#1E1E1E", className: "object-contain" },
  Renault: { url: "/teams/renault.svg", color: "#FFF500", className: "brightness-100 filter-none" },

  // Classic Era Teams (1985-1989)
  Brabham: { url: "/classic/brabham.svg", color: "#001633", className: "object-contain p-0.5 filter-none" },
  "Brabham Grand Prix": { url: "/classic/brabham.svg", color: "#001633", className: "object-contain p-0.5 filter-none" },
  "Motor Racing Developments": { url: "/classic/brabham.svg", color: "#001633", className: "object-contain p-0.5 filter-none" },
  March: { url: "/classic/march.svg", color: "#009384", className: "object-contain" },
  Toleman: { url: "/classic/toleman.svg", color: "#001B44", className: "object-contain p-0.5 filter-none" },
  "Toleman Motorsport": { url: "/classic/toleman.svg", color: "#001B44", className: "object-contain p-0.5 filter-none" },
  Larrousse: { url: "/classic/larrousse.svg", color: "#1B4D3E", className: "object-contain" },
  Osella: { url: "/classic/osella.svg", color: "#0E1117", className: "object-contain p-0.5 filter-none" },
  "Osella Squadra Corse": { url: "/classic/osella.svg", color: "#0E1117", className: "object-contain p-0.5 filter-none" },
  Zakspeed: { url: "/classic/zakspeed.svg", color: "#C00000", className: "object-contain" },
  Lola: { url: "/classic/lola.svg", color: "#D40000", className: "object-contain" },
  Dallara: { url: "/classic/dallara.svg", color: "#A6192E", className: "object-contain" },
  AGS: { url: "/classic/ags.svg", color: "#2A52BE", className: "object-contain" },
  Coloni: { url: "/classic/coloni.svg", color: "#F7D117", className: "object-contain" },
  Rial: { url: "/classic/rial.svg", color: "#003399", className: "object-contain" },
  Onyx: { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
  "Moneytron Onyx": { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
  "Onyx Grand Prix": { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" },
  "Euro Brun": { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" },
  EuroBrun: { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" },
  "EuroBrun Racing": { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" },
  Spirit: { url: "/classic/spirit.svg", color: "#0E1014", className: "object-contain p-0.5 filter-none" },
  "Spirit Racing": { url: "/classic/spirit.svg", color: "#0E1014", className: "object-contain p-0.5 filter-none" },
  RAM: { url: "/classic/ram.svg", color: "#007A3D", className: "object-contain" },
  Fittipaldi: { url: "/classic/fittipaldi.svg", color: "#009B3A", className: "object-contain p-0.5 filter-none" },
  "Fittipaldi Automotive": { url: "/classic/fittipaldi.svg", color: "#009B3A", className: "object-contain p-0.5 filter-none" },
  ATS: { url: "/classic/ats.svg", color: "#FEDF00", className: "object-contain" },
  Theodore: { url: "/classic/theodore.svg", color: "#D60000", className: "object-contain p-0.5 filter-none" },
  "Theodore Racing": { url: "/classic/theodore.svg", color: "#D60000", className: "object-contain p-0.5 filter-none" },
  Ensign: { url: "/classic/ensign.svg", color: "#0A1830", className: "object-contain p-0.5 filter-none" },
  "Team Ensign": { url: "/classic/ensign.svg", color: "#0A1830", className: "object-contain p-0.5 filter-none" },
  Shadow: { url: "/classic/shadow.svg", color: "#050608", className: "object-contain p-0.5 filter-none" },
  "Shadow Racing Cars": { url: "/classic/shadow.svg", color: "#050608", className: "object-contain p-0.5 filter-none" },
  Wolf: { url: "/classic/wolf.svg", color: "#0A0A0A", className: "object-contain p-0.5 filter-none" },
  "Walter Wolf Racing": { url: "/classic/wolf.svg", color: "#0A0A0A", className: "object-contain p-0.5 filter-none" },
  Hesketh: { url: "/classic/hesketh.svg", color: "#C00000", className: "object-contain p-0.5 filter-none" },
  "Hesketh Racing": { url: "/classic/hesketh.svg", color: "#C00000", className: "object-contain p-0.5 filter-none" },
  Surtees: { url: "/classic/surtees.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" },
  "Surtees Racing Organisation": { url: "/classic/surtees.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" },
  BRM: { url: "/classic/brm.svg", color: "#004225", className: "object-contain p-0.5 filter-none" },
  "British Racing Motors": { url: "/classic/brm.svg", color: "#004225", className: "object-contain p-0.5 filter-none" },
  Matra: { url: "/classic/matra.svg", color: "#0038A8", className: "object-contain p-0.5 filter-none" },
  "Equipe Matra Sports": { url: "/classic/matra.svg", color: "#0038A8", className: "object-contain p-0.5 filter-none" },
  Penske: { url: "/classic/penske.svg", color: "#002244", className: "object-contain p-0.5 filter-none" },
  "Penske Cars": { url: "/classic/penske.svg", color: "#002244", className: "object-contain p-0.5 filter-none" },
  Cooper: { url: "/classic/cooper.svg", color: "#002D15", className: "object-contain p-0.5 filter-none" },
  "Cooper Car Company": { url: "/classic/cooper.svg", color: "#002D15", className: "object-contain p-0.5 filter-none" },
  Eagle: { url: "/classic/eagle.svg", color: "#0A152E", className: "object-contain p-0.5 filter-none" },
  Porsche: { url: "/classic/porsche.svg", color: "#141416", className: "object-contain p-0.5 filter-none" },
  Maserati: { url: "/classic/maserati.svg", color: "#0A1832", className: "object-contain p-0.5 filter-none" },
  "Officine Alfieri Maserati": { url: "/classic/maserati.svg", color: "#0A1832", className: "object-contain p-0.5 filter-none" },
  Vanwall: { url: "/classic/vanwall.svg", color: "#003515", className: "object-contain p-0.5 filter-none" },
}

const TEAM_ALIASES: Record<string, string> = {
  // Force India & Racing Point
  "force india": "Force India",
  "force india f1 team": "Force India",
  "sahara force india": "Force India",
  "sahara force india f1 team": "Force India",
  "racing point force india": "Force India",
  "racing point force india f1 team": "Force India",

  // Toro Rosso
  "toro rosso": "Toro Rosso",
  "scuderia toro rosso": "Toro Rosso",
  "scuderia toro rosso honda": "Toro Rosso",
  "red bull toro rosso honda": "Toro Rosso",

  // Lotus F1, Team Lotus & Caterham
  "lotus f1": "Lotus F1",
  "lotus f1 team": "Lotus F1",
  "lotus racing": "Lotus",
  caterham: "Caterham",
  "caterham f1 team": "Caterham",

  // Virgin, Marussia & Manor
  virgin: "Virgin",
  "virgin racing": "Virgin",
  "marussia virgin": "Marussia Virgin",
  "marussia virgin racing": "Marussia Virgin",
  marussia: "Marussia",
  "marussia f1 team": "Marussia",
  manor: "Manor Racing",
  "manor marussia": "Manor Marussia",
  "manor marussia f1 team": "Manor Marussia",
  "manor racing": "Manor Racing",
  "manor racing mrt": "Manor Racing",

  // HRT
  hrt: "HRT",
  "hrt f1 team": "HRT",
  "hrt formula 1 team": "HRT",
  hispania: "HRT",
  "hispania racing": "HRT",
  "hispania racing f1 team": "HRT",
  "hispania racing team": "HRT",

  // BMW Sauber
  "bmw sauber": "BMW Sauber",
  "bmw sauber f1 team": "BMW Sauber",

  // Haas
  haas: "Haas",
  "haas f1 team": "Haas F1 Team",
  "moneygram haas f1 team": "Haas",
  "moneygran haas f1 team": "Haas",
  "uralkali haas f1 team": "Haas",
  "rich energy haas": "Rich Energy Haas F1 Team",
  "rich energy haas f1 team": "Rich Energy Haas F1 Team",

  // Red Bull
  "red bull": "Red Bull Racing",
  "red bull racing": "Red Bull Racing",
  "oracle red bull racing": "Red Bull Racing",
  "aston martin red bull racing": "Red Bull Racing",
  "red bull racing honda": "Red Bull Racing",

  // Racing Point
  "racing point": "Racing Point",
  "racing point f1 team": "Racing Point",
  "bwt racing point": "Racing Point",
  "bwt racing point f1 team": "Racing Point",
  "sportpesa racing point": "Racing Point",
  "sportpesa racing point f1 team": "Racing Point",

  // Renault
  renault: "Renault",
  "renault f1 team": "Renault",
  "renault dp world f1 team": "Renault",
  "renault sport": "Renault",
  "renault sport f1 team": "Renault",

  // Aston Martin
  "aston martin": "Aston Martin",
  "aston martin f1 team": "Aston Martin",
  "aston martin aramco": "Aston Martin",
  "aston martin aramco f1 team": "Aston Martin",
  "aston martin aramco cognac f1 team": "Aston Martin",
  "aston martin aramco cognizant": "Aston Martin",
  "aston martin aramco cognizant f1 team": "Aston Martin",
  "aston martin aramco cognizant formula one team": "Aston Martin",
  "aston martin cognizant": "Aston Martin",
  "aston martin cognizant f1 team": "Aston Martin",
  "aston martin cognizant formula one team": "Aston Martin",

  // Alpine
  alpine: "Alpine",
  "alpine f1 team": "Alpine",
  "bwt alpine f1 team": "Alpine",

  // Williams
  williams: "Williams",
  "williams racing": "Williams",
  "williams grand prix engineering": "Williams",

  // Sauber / Audi
  "kick sauber": "Kick Sauber",
  "stake f1 team kick sauber": "Kick Sauber",
  sauber: "Sauber",
  "sauber f1 team": "Sauber",
  "sauber motorsport": "Sauber",
  audi: "Audi",
  "audi f1 team": "Audi",
  "audi sport": "Audi",

  // Cadillac
  cadillac: "Cadillac",
  "cadillac f1 team": "Cadillac",
  "cadillac formula 1 team": "Cadillac",

  // AlphaTauri
  alphatauri: "AlphaTauri",
  "alphatauri f1 team": "AlphaTauri",
  "scuderia alphatauri": "AlphaTauri",
  "scuderia alphatauri f1 team": "AlphaTauri",
  "scuderia alphatauri honda": "AlphaTauri",

  // Racing Bulls / RB
  rb: "Racing Bulls",
  "racing bulls": "Racing Bulls",
  "racing bulls f1 team": "Racing Bulls",
  "visa cash app rb": "Racing Bulls",
  "visa cash app rb formula one team": "Racing Bulls",
  vcarb: "Racing Bulls",

  // Ferrari
  ferrari: "Ferrari",
  "scuderia ferrari": "Ferrari",
  "scuderia ferrari hp": "Ferrari",
  "scuderia ferrari mission winnow": "Ferrari",

  // McLaren
  mclaren: "McLaren",
  "mclaren f1 team": "McLaren",
  "mclaren formula 1 team": "McLaren",

  // Mercedes
  mercedes: "Mercedes",
  "mercedes-amg": "Mercedes",
  "mercedes-amg petronas": "Mercedes",
  "mercedes-amg petronas f1 team": "Mercedes",
  "mercedes amg": "Mercedes",

  // Alfa Romeo
  "alfa romeo": "Alfa Romeo",
  "alfa romeo racing": "Alfa Romeo",
  "alfa romeo f1 team": "Alfa Romeo",
  "alfa romeo f1 team orlen": "Alfa Romeo",
  "alfa romeo orlen": "Alfa Romeo",
  "alfa romeo f1 team stake": "Alfa Romeo",

  // F2 & F3 Aliases
  prema: "PREMA Racing",
  "prema racing": "PREMA Racing",
  trident: "TRIDENT",
  "trident motorsport": "TRIDENT",
  campos: "Campos Racing",
  "campos racing": "Campos Racing",
  rodin: "Rodin Motorsport",
  "rodin motorsport": "Rodin Motorsport",
  mp: "MP Motorsport",
  "mp motorsport": "MP Motorsport",
  dams: "DAMS Lucas Oil",
  "dams lucas oil": "DAMS Lucas Oil",
  art: "ART Grand Prix",
  "art grand prix": "ART Grand Prix",
  hitech: "Hitech Pulse-Eight",
  "hitech pulse-eight": "Hitech Pulse-Eight",
  "hitech grand prix": "Hitech Pulse-Eight",
  "van amersfoort": "Van Amersfoort Racing",
  "van amersfoort racing": "Van Amersfoort Racing",
  invicta: "Invicta Racing",
  "invicta racing": "Invicta Racing",
  "invicta virtuosi racing": "Invicta Racing",
  virtuosi: "Invicta Racing",
  aix: "AIX Racing",
  "aix racing": "AIX Racing",
  "phm aix racing": "AIX Racing",
  "phm racing": "AIX Racing",
  jenzer: "Jenzer Motorsport",
  "jenzer motorsport": "Jenzer Motorsport",
  "team lotus": "Team Lotus",
  "euro brun": "Euro Brun",
  eurobrun: "Euro Brun",
  brabham: "Brabham",
  march: "March",
  toleman: "Toleman",
  "toleman motorsport": "Toleman",
  larrousse: "Larrousse",
  osella: "Osella",
  zakspeed: "Zakspeed",
  lola: "Lola",
  dallara: "Dallara",
  ags: "AGS",
  coloni: "Coloni",
  rial: "Rial",
  onyx: "Onyx",
  "moneytron onyx": "Onyx",
  "onyx grand prix": "Onyx",
  spirit: "Spirit",
  "spirit racing": "Spirit",
  ram: "RAM",
  "ram racing": "RAM",
  fittipaldi: "Fittipaldi",
  "fittipaldi automotive": "Fittipaldi",
  copersucar: "Fittipaldi",
  "copersucar-fittipaldi": "Fittipaldi",
  ats: "ATS",
  "ats racing": "ATS",
  "ats wheels": "ATS",
  theodore: "Theodore",
  "theodore racing": "Theodore",
  ensign: "Ensign",
  "team ensign": "Ensign",
  shadow: "Shadow",
  "shadow racing": "Shadow",
  "shadow racing cars": "Shadow",
  // 2005-2009 Historical Teams
  bar: "BAR",
  "bar honda": "BAR",
  "british american racing": "BAR",
  "lucky strike bar honda": "BAR",
  "lucky strike bar": "BAR",
  "sauber clássica": "Sauber Clássica",
  "sauber classica": "Sauber Clássica",
  "sauber petronas": "Sauber",
  "red bull sauber petronas": "Sauber",
  arrows: "Arrows",
  "orange arrows": "Orange Arrows",
  "arrows grand prix": "Arrows",
  "arrows grand prix international": "Arrows",
  footwork: "Footwork",
  "footwork arrows": "Footwork",
  "arrows footwork": "Footwork",
  "footwork grand prix": "Footwork",
  "footwork grand prix international": "Footwork",
  prost: "Prost",
  "prost grand prix": "Prost",
  "prost grand prix acer": "Prost",
  "prost acer": "Prost",
  "prost grand prix yahoo!": "Prost",
  "prost yahoo": "Prost",
  "prost grand prix formula one team": "Prost 1997",
  benetton: "Benetton",
  "benetton formula": "Benetton",
  "benetton formula 1": "Benetton",
  "benetton formula mild seven": "Benetton",
  "benetton mild seven": "Benetton",
  "benetton formula united colors": "Benetton United",
  "benetton formula united colors of benetton": "Benetton United",
  jordan: "Jordan",
  "jordan grand prix": "Jordan",
  minardi: "Minardi",
  "scuderia minardi": "Minardi",
  mf1: "MF1",
  "mf1 racing": "MF1",
  midland: "Spyker MF1",
  "midland f1": "Spyker MF1",
  "midland f1 racing": "Spyker MF1",
  "spyker mf1": "Spyker MF1",
  "spyker mf1 racing": "Spyker MF1",
  spyker: "Spyker",
  "spyker f1": "Spyker",
  "spyker f1 team": "Spyker",
  brawn: "Brawn",
  "brawn gp": "Brawn",
  "brawn gp f1 team": "Brawn",
  "brawn gp formula one team": "Brawn",
  toyota: "Toyota",
  "toyota racing": "Toyota",
  "panasonic toyota racing": "Toyota",
  "panasonic toyota": "Toyota",
  honda: "Honda",
  "honda racing": "Honda",
  "honda racing f1 team": "Honda",
  "honda f1": "Honda",
  "honda f1 team": "Honda",
  "super aguri": "Super Aguri",
  "super aguri f1": "Super Aguri",
  "super aguri f1 team": "Super Aguri",

  // 1990-1998 Constructors
  tyrrell: "Tyrrell",
  "tyrrell racing": "Tyrrell",
  "tyrrell racing organisation": "Tyrrell",
  "tyrrell candy braun": "Tyrrell Candy Braun",
  "tyrrell mild seven": "Tyrrell",
  ligier: "Ligier",
  "equipe ligier": "Ligier",
  "ligier gitanes": "Ligier Gitanes",
  "ligier gitanes blondes": "Ligier Gitanes Blondes",
  "ligier f1 team gitanes": "Ligier Gitanes",
  "ligier f1 gauloises": "Ligier",
  forti: "Forti",
  "forti corse": "Forti",
  pacific: "Pacific",
  "pacific grand prix": "Pacific",
  "pacific racing": "Pacific",
  simtek: "Simtek",
  "simtek grand prix": "Simtek",
  "mtv simtek ford": "Simtek",
  "leyton house": "Leyton House",
  "leyton house racing": "Leyton House",
  "leyton house formula one racing team": "Leyton House",
  fondmetal: "Fondmetal",
  "fondmetal corse": "Fondmetal",
  "fondmetal f1": "Fondmetal",
  lambo: "Lambo",
  "modena team": "Lambo",
  "modena team lambo": "Lambo",
  modena: "Lambo",
  "andrea moda": "Andrea Moda",
  "andrea moda formula": "Andrea Moda",
  "maserati": "Maserati",
  "officine alfieri maserati": "Maserati",
  "vanwall": "Vanwall",
}

export function teamLogo(name: string, season?: number): TeamLogoAsset | null {
  if (!name) return null
  const canonical = TEAM_ALIASES[name.trim().toLowerCase()] || name

  // Mercedes-AMG Petronas F1 Team High-Res Vector Branding (2010-2026 and 1954-1955)
  if (
    canonical === "Mercedes" ||
    canonical === "Mercedes-AMG Petronas" ||
    canonical === "Mercedes-AMG Petronas F1 Team" ||
    name.toLowerCase().includes("mercedes")
  ) {
    return {
      url: "/teams/mercedes_amg_petronas.svg",
      color: "#0A141A",
      className: "object-contain p-0.5 filter-none",
    }
  }

  // Red Bull Racing (2005-2026) High-Res Official Vector Branding
  if (
    canonical === "Red Bull" ||
    canonical === "Red Bull Racing" ||
    canonical === "Oracle Red Bull Racing" ||
    canonical === "Aston Martin Red Bull Racing" ||
    name.toLowerCase().includes("red bull")
  ) {
    if (season && season >= 2022) {
      return {
        url: "/teams/oracle_red_bull_racing.svg",
        color: "#041E42",
        className: "object-contain p-0.5 filter-none",
      }
    }
    if (season && season >= 2018 && season <= 2021) {
      return {
        url: "/teams/aston_martin_red_bull_racing.svg",
        color: "#001A30",
        className: "object-contain p-0.5 filter-none",
      }
    }
    if (season && season >= 2005 && season <= 2017) {
      return {
        url: "/teams/red_bull_racing_classic.svg",
        color: "#001A30",
        className: "object-contain p-0.5 filter-none",
      }
    }
    return {
      url: "/teams/oracle_red_bull_racing.svg",
      color: "#041E42",
      className: "object-contain p-0.5 filter-none",
    }
  }

  // Racing Bulls / Visa Cash App RB (2024-2026) High-Res Official Vector Branding
  if (
    canonical === "Racing Bulls" ||
    canonical === "RB" ||
    canonical === "Visa Cash App RB" ||
    canonical === "Visa Cash App RB Formula One Team" ||
    name.toLowerCase().includes("racing bulls") ||
    name.toLowerCase().includes("visa cash app") ||
    name.toLowerCase().includes("cash app rb") ||
    name.trim().toLowerCase() === "rb"
  ) {
    return {
      url: "/teams/racing_bulls.svg",
      color: "#0D1B3E",
      className: "object-contain p-0.5 filter-none",
    }
  }

  // Special high-res branding for Rich Energy Haas, Haas F1 Team, and Sauber
  if (
    (season === 2019 && (name.toLowerCase().includes("haas") || canonical === "Haas")) ||
    name.toLowerCase().includes("rich energy") ||
    canonical === "Rich Energy Haas F1 Team"
  ) {
    return {
      url: "/teams/rich_energy_haas.svg",
      color: "#000000",
      className: "object-contain p-0.5 filter-none",
    }
  }

  if (name.toLowerCase().includes("haas") || canonical === "Haas" || canonical === "Haas F1 Team") {
    if (season === 2021) {
      return {
        url: "/teams/uralkali_haas.svg",
        color: "#FFFFFF",
        className: "object-contain p-0.5 filter-none",
      }
    }
    if (season && season >= 2023) {
      return {
        url: "/teams/moneygram_haas.svg",
        color: "#FFFFFF",
        className: "object-contain p-0.5 filter-none",
      }
    }
    return {
      url: "/teams/haas_f1_team.svg",
      color: "#FFFFFF",
      className: "object-contain p-0.5 filter-none",
    }
  }

  if (name.toLowerCase().includes("sauber") || canonical === "Sauber" || canonical === "Kick Sauber" || canonical === "BMW Sauber") {
    if (season && season >= 2006 && season <= 2009) {
      return {
        url: "/teams/bmw_sauber.svg",
        color: "#001830",
        className: "object-contain p-0.5 filter-none",
      }
    }
    if (season && season >= 2024) {
      return {
        url: "/teams/kicksauber.svg",
        color: "#52E252",
        className: "object-contain p-0.5 brightness-100 filter-none",
      }
    }
    return {
      url: "/teams/sauber.svg",
      color: "#FFFFFF",
      className: "object-contain p-0.5 filter-none",
    }
  }

  // Specific historical exceptions for 2010-2014 distinct identities
  if ((season === 2012 || season === 2013 || season === 2014) && (canonical === "Caterham" || canonical === "Caterham F1 Team" || name.toLowerCase().includes("caterham"))) {
    return { url: "/teams/caterham.svg", color: "#003D1B", className: "object-contain p-0.5 filter-none" }
  }
  if ((season === 2012 || season === 2013 || season === 2014) && (canonical === "Marussia" || canonical === "Marussia F1 Team" || name.toLowerCase().includes("marussia"))) {
    return { url: "/teams/marussia.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }
  if (season === 2010 && (canonical === "HRT" || name.toLowerCase().includes("hispania"))) {
    return { url: "/teams/hispania.svg", color: "#E10600", className: "object-contain p-0.5" }
  }
  if ((season === 2010 || season === 2011) && (canonical === "Lotus" || canonical === "Team Lotus")) {
    return { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" }
  }
  if (season === 2011 && (canonical === "Virgin" || canonical === "Marussia Virgin" || name.toLowerCase().includes("virgin"))) {
    return { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }
  if (season === 2010 && (canonical === "Virgin" || canonical === "Virgin Racing" || name.toLowerCase().includes("virgin"))) {
    return { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season <= 2005 && (canonical === "Kick Sauber" || canonical === "Sauber" || canonical === "Sauber Clássica" || name.toLowerCase().includes("sauber"))) {
    return { url: "/teams/sauber_classic.svg", color: "#001D38", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1980 && season <= 1992 && (canonical === "Tyrrell" || name.toLowerCase().includes("tyrrell"))) {
    return { url: "/teams/tyrrell_candy_braun.svg", color: "#00142A", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season < 1980 && (canonical === "Tyrrell" || name.toLowerCase().includes("tyrrell"))) {
    return { url: "/teams/tyrrell.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }
  }
  // Arrows and Footwork Era Overrides
  if (canonical === "Orange Arrows" || (season && season >= 2000 && season <= 2002 && name.toLowerCase().includes("arrows"))) {
    return { url: "/teams/orange_arrows.svg", color: "#000000", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Footwork" || canonical === "Arrows Footwork" || canonical === "Footwork Arrows" || (season && season >= 1991 && season <= 1996 && name.toLowerCase().includes("arrows"))) {
    return { url: "/teams/footwork_arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1997 && season <= 1999 && (canonical === "Arrows" || name.toLowerCase().includes("arrows"))) {
    return { url: "/teams/arrows.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1978 && season <= 1990 && (canonical === "Arrows" || name.toLowerCase().includes("arrows"))) {
    return { url: "/teams/arrows_classic.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }

  // Jordan Grand Prix Era Overrides
  if (canonical === "Jordan" || canonical === "Jordan Grand Prix" || name.toLowerCase().includes("jordan")) {
    if (season === 1997 || name.toLowerCase().includes("bitten hisses")) {
      return { url: "/teams/jordan_bitten_hisses.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }
    }
    if ((season && season >= 1998 && season <= 2000) || name.toLowerCase().includes("buzzin hornets")) {
      return { url: "/teams/jordan_buzzin_hornets.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }
    }
    return { url: "/teams/jordan.svg", color: "#FFDE00", className: "object-contain p-0.5 filter-none" }
  }

  // Minardi Era Overrides
  if (canonical === "Minardi" || canonical === "Minardi F1 Team" || canonical === "Minardi European" || canonical === "European Minardi" || name.toLowerCase().includes("minardi")) {
    if ((season && season >= 2001) || name.toLowerCase().includes("european")) {
      return { url: "/teams/minardi_european.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }
    }
    return { url: "/teams/minardi.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }
  }

  // BAR Honda Era Overrides
  if (canonical === "BAR" || canonical === "BAR Honda" || canonical === "Lucky Strike BAR Honda" || canonical === "British American Racing" || name.toLowerCase().includes("bar")) {
    return { url: "/teams/bar.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }

  // Benetton Era Overrides
  if (
    canonical === "Benetton" ||
    canonical === "Benetton Formula" ||
    canonical === "Benetton United" ||
    canonical === "Benetton Formula Mild Seven" ||
    canonical === "Benetton Formula United Colors" ||
    canonical === "Benetton Formula United Colors of Benetton" ||
    name.toLowerCase().includes("benetton")
  ) {
    if ((season && season >= 1994) || name.toLowerCase().includes("mild seven")) {
      return { url: "/teams/benetton_mild_seven.svg", color: "#008BE3", className: "object-contain p-0.5 filter-none" }
    }
    return { url: "/teams/benetton_united.svg", color: "#007A3E", className: "object-contain p-0.5 filter-none" }
  }

  // Toyota Racing Era Overrides
  if (canonical === "Toyota" || canonical === "Toyota Racing" || canonical === "Panasonic Toyota Racing" || name.toLowerCase().includes("toyota")) {
    return { url: "/teams/panasonic_toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5 filter-none" }
  }

  // Spyker & MF1 Era Overrides
  if (canonical === "Spyker" || canonical === "Spyker F1" || canonical === "Spyker F1 Team" || name.toLowerCase().includes("spyker")) {
    if (season === 2006 || name.toLowerCase().includes("mf1")) {
      return { url: "/teams/spykermf1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" }
    }
    return { url: "/teams/spyker_f1.svg", color: "#FF7A00", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "MF1" || canonical === "MF1 Racing" || canonical === "Midland" || name.toLowerCase().includes("mf1") || name.toLowerCase().includes("midland")) {
    return { url: "/teams/mf1_racing.svg", color: "#0A0D12", className: "object-contain p-0.5 filter-none" }
  }

  // Prost Grand Prix Era Overrides
  if (canonical === "Prost" || canonical === "Prost Grand Prix" || canonical === "Prost Grand Prix Acer" || name.toLowerCase().includes("prost")) {
    if (season === 2001 || name.toLowerCase().includes("acer")) {
      return { url: "/teams/prost_acer.svg", color: "#002060", className: "object-contain p-0.5 filter-none" }
    }
    return { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" }
  }
  // 1966-1984 Classic Era High-Res Branding
  if (season && season >= 1966 && season <= 1984 && (canonical === "McLaren" || name.toLowerCase().includes("mclaren"))) {
    return { url: "/teams/mclaren_classic.svg", color: "#FF1801", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1950 && season <= 1984 && (canonical === "Ferrari" || name.toLowerCase().includes("ferrari"))) {
    return { url: "/teams/ferrari_classic.svg", color: "#CE2B37", className: "object-contain p-0.5 filter-none" }
  }
  if (season && (season === 1954 || season === 1955) && (canonical === "Mercedes" || name.toLowerCase().includes("mercedes"))) {
    return { url: "/teams/mercedes_amg_petronas.svg", color: "#0A141A", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Maserati" || canonical === "Officine Alfieri Maserati" || name.toLowerCase().includes("maserati")) {
    return { url: "/classic/maserati.svg", color: "#0A1832", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Vanwall" || name.toLowerCase().includes("vanwall")) {
    return { url: "/classic/vanwall.svg", color: "#003515", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season <= 1985 && (canonical === "Alfa Romeo" || name.toLowerCase().includes("alfa romeo"))) {
    return { url: "/teams/alfaromeo.svg", color: "#900000", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Cooper" || canonical === "Cooper Car Company" || name.toLowerCase().includes("cooper")) {
    return { url: "/classic/cooper.svg", color: "#002D15", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Eagle" || canonical === "Anglo American Racers" || name.toLowerCase().includes("eagle")) {
    return { url: "/classic/eagle.svg", color: "#0A152E", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Porsche" || name.toLowerCase().includes("porsche")) {
    return { url: "/classic/porsche.svg", color: "#141416", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1964 && season <= 1968 && (canonical === "Honda" || name.toLowerCase().includes("honda"))) {
    return { url: "/teams/honda.svg", color: "#fc0217", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1977 && season <= 1985 && (canonical === "Renault" || name.toLowerCase().includes("renault"))) {
    return { url: "/teams/renault_turbo.svg", color: "#FFD000", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1976 && season <= 1985 && (canonical === "Ligier" || name.toLowerCase().includes("ligier"))) {
    return { url: "/teams/ligier_gitanes.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Theodore" || canonical === "Theodore Racing" || name.toLowerCase().includes("theodore")) {
    return { url: "/classic/theodore.svg", color: "#D60000", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Fittipaldi" || canonical === "Fittipaldi Automotive" || name.toLowerCase().includes("fittipaldi") || name.toLowerCase().includes("copersucar")) {
    return { url: "/classic/fittipaldi.svg", color: "#009B3A", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Ensign" || canonical === "Team Ensign" || name.toLowerCase().includes("ensign")) {
    return { url: "/classic/ensign.svg", color: "#0A1830", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Shadow" || canonical === "Shadow Racing Cars" || name.toLowerCase().includes("shadow")) {
    return { url: "/classic/shadow.svg", color: "#050608", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Lotus" || canonical === "Team Lotus" || name.toLowerCase().includes("team lotus") || (season && season <= 1994 && name.toLowerCase().includes("lotus"))) {
    return { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "March" || canonical === "March Engineering" || name.toLowerCase().includes("march")) {
    return { url: "/classic/march.svg", color: "#009384", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Wolf" || canonical === "Walter Wolf Racing" || name.toLowerCase().includes("wolf")) {
    return { url: "/classic/wolf.svg", color: "#0A0A0A", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Hesketh" || canonical === "Hesketh Racing" || name.toLowerCase().includes("hesketh")) {
    return { url: "/classic/hesketh.svg", color: "#C00000", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Surtees" || canonical === "Surtees Racing Organisation" || name.toLowerCase().includes("surtees")) {
    return { url: "/classic/surtees.svg", color: "#002B7F", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "BRM" || canonical === "British Racing Motors" || name.toLowerCase().includes("brm") || name.toLowerCase().includes("british racing motors")) {
    return { url: "/classic/brm.svg", color: "#004225", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Matra" || canonical === "Equipe Matra Sports" || name.toLowerCase().includes("matra")) {
    return { url: "/classic/matra.svg", color: "#0038A8", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Penske" || canonical === "Penske Cars" || name.toLowerCase().includes("penske")) {
    return { url: "/classic/penske.svg", color: "#002244", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1986 && season <= 1992 && (canonical === "Ligier" || name.toLowerCase().includes("ligier"))) {
    return { url: "/teams/ligier_blondes.svg", color: "#001C42", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1993 && season <= 1996 && (canonical === "Ligier" || name.toLowerCase().includes("ligier"))) {
    return { url: "/teams/ligier_gauloises.svg", color: "#001D4A", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1991 && season <= 1996 && (canonical === "Footwork" || name.toLowerCase().includes("footwork") || name.toLowerCase().includes("arrows footwork"))) {
    return { url: "/teams/footwork_arrows.svg", color: "#0B1017", className: "object-contain p-0.5 filter-none" }
  }
  if (season && (season === 1994 || season === 1995) && (canonical === "Simtek" || name.toLowerCase().includes("simtek"))) {
    return { url: "/teams/mtv_simtek_ford.svg", color: "#160728", className: "object-contain p-0.5 filter-none" }
  }

  if (canonical === "Leyton House" || name.toLowerCase().includes("leyton")) {
    return { url: "/teams/leytonhouse.svg", color: "#071017", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Brabham" || name.toLowerCase().includes("brabham")) {
    return { url: "/classic/brabham.svg", color: "#001633", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Euro Brun" || canonical === "EuroBrun" || name.toLowerCase().includes("euro brun") || name.toLowerCase().includes("eurobrun")) {
    return { url: "/classic/eurobrun.svg", color: "#101217", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Osella" || name.toLowerCase().includes("osella")) {
    return { url: "/classic/osella.svg", color: "#0E1117", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Toleman" || canonical === "Toleman Motorsport" || name.toLowerCase().includes("toleman")) {
    return { url: "/classic/toleman.svg", color: "#001B44", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Onyx" || canonical === "Moneytron Onyx" || name.toLowerCase().includes("onyx")) {
    return { url: "/classic/onyx.svg", color: "#0B0914", className: "object-contain p-0.5 filter-none" }
  }
  if (canonical === "Spirit" || canonical === "Spirit Racing" || name.toLowerCase().includes("spirit")) {
    return { url: "/classic/spirit.svg", color: "#0E1014", className: "object-contain p-0.5 filter-none" }
  }
  if (season && season >= 1991 && season <= 1995 && (canonical === "Jordan" || name.toLowerCase().includes("jordan"))) {
    return { url: "/teams/jordan_1991.svg", color: "#005536", className: "object-contain p-0.5" }
  }
  if (season === 1997 && (canonical === "Prost" || name.toLowerCase().includes("prost"))) {
    return { url: "/teams/prost.svg", color: "#002060", className: "object-contain p-0.5 filter-none" }
  }
  if (season && (season === 1997 || season === 1998) && (canonical === "Stewart" || name.toLowerCase().includes("stewart"))) {
    return { url: "/teams/stewart_1997.svg", color: "#0C2340", className: "object-contain p-0.5" }
  }
  if (season && (season === 1995 || season === 1996) && (canonical === "Forti" || name.toLowerCase().includes("forti"))) {
    return { url: "/teams/forti.svg", color: "#FFCC00", className: "object-contain p-0.5" }
  }

  // Classic Williams Grand Prix Engineering (1978-1993)
  if (season && season >= 1978 && season <= 1993 && (canonical === "Williams" || name.toLowerCase().includes("williams"))) {
    return { url: "/teams/williams_grand_prix.svg", color: "#001B36", className: "object-contain p-0.5 filter-none" }
  }

  // From 1985 to modern era (2026), prioritize pristine vector and curated high-res logos
  if (!season || season >= 1985) {
    // 1. Check if there is a specific curated season logo that is NOT an old scanned jpg
    const seasonLogo = season ? (TEAM_SEASON_LOGOS[canonical]?.[season] ?? TEAM_SEASON_LOGOS[name]?.[season]) : undefined
    if (seasonLogo && !seasonLogo.url.includes("/ferrari/") && !seasonLogo.url.includes("/mclaren/") && !seasonLogo.url.includes("/williams/") && !seasonLogo.url.includes("/redbull/") && !seasonLogo.url.includes("/alpine/") && !seasonLogo.url.includes("/mercedes/")) {
      const fallbackColor = TEAM_LOGO_BY_NAME[canonical]?.color ?? TEAM_LOGO_BY_NAME[name]?.color
      return {
        ...seasonLogo,
        color: seasonLogo.color ?? fallbackColor,
      }
    }

    // 2. Otherwise prioritize pristine vector logos from TEAM_LOGO_BY_NAME
    if (TEAM_LOGO_BY_NAME[canonical]) {
      return TEAM_LOGO_BY_NAME[canonical]
    }
    if (TEAM_LOGO_BY_NAME[name]) {
      return TEAM_LOGO_BY_NAME[name]
    }
  }

  // Pre-1985 vintage seasons (1950-1984)
  if (season) {
    const seasonLogo = TEAM_SEASON_LOGOS[canonical]?.[season] ?? TEAM_SEASON_LOGOS[name]?.[season]
    if (seasonLogo) {
      const fallbackColor = TEAM_LOGO_BY_NAME[canonical]?.color ?? TEAM_LOGO_BY_NAME[name]?.color
      return {
        ...seasonLogo,
        color: seasonLogo.color ?? fallbackColor,
      }
    }
  }

  return TEAM_LOGO_BY_NAME[canonical] ?? TEAM_LOGO_BY_NAME[name] ?? null
}

const ENGINE_LOGOS: Record<string, string> = {
  Ferrari: "/engines/ferrari.svg",
  Mercedes: "/engines/mercedes.svg",
  "Mercedes-Benz": "/engines/mercedes.svg",
  Renault: "/engines/renault.svg",
  Honda: "/engines/honda.svg",
  "Honda RBPT": "/engines/honda_rbpt.svg",
  "Red Bull Ford": "/engines/ford.svg",
  Ford: "/engines/ford.svg",
  "Ford Cosworth": "/engines/ford.svg",
  Cosworth: "/engines/cosworth.svg",
  BMW: "/engines/bmw.svg",
  Audi: "/engines/audi.svg",
  Porsche: "/engines/porsche.svg",
  "TAG Porsche": "/engines/tag.svg",
  TAG: "/engines/tag.svg",
  "TAG Heuer": "/engines/tag.svg",
  Peugeot: "/engines/peugeot.svg",
  "Mugen-Honda": "/engines/mugen.svg",
  Mugen: "/engines/mugen.svg",
  Yamaha: "/engines/yamaha.svg",
  Toyota: "/engines/toyota.svg",
  Lamborghini: "/engines/lamborghini.svg",
  Hart: "/engines/hart.svg",
  Judd: "/engines/judd.svg",
  Petronas: "/engines/petronas.svg",
  Ilmor: "/engines/ilmor.svg",
  "Alfa Romeo": "/engines/alfa_romeo.svg",
  Matra: "/engines/matra.svg",
  Mecachrome: "/engines/mecachrome.svg",
  Supertec: "/engines/supertec.svg",
  Playlife: "/engines/playlife.svg",
  Asiatech: "/engines/asiatech.svg",
  Acer: "/engines/ferrari.svg",
  European: "/engines/cosworth.svg",
  Fondmetal: "/engines/ford.svg",
  Megatron: "/engines/bmw.svg",
  Subaru: "/engines/subaru.svg",
  Zakspeed: "/engines/zakspeed.svg",
  "Motori Moderni": "/engines/alfa_romeo.svg",
  "BWT Mercedes": "/engines/mercedes.svg",
  Climax: "/engines/climax.svg",
  "Coventry Climax": "/engines/climax.svg",
  Repco: "/engines/repco.svg",
}

export function engineLogo(name: string | null): string | null {
  if (!name) return null
  const trimmed = name.trim()
  if (ENGINE_LOGOS[trimmed]) return ENGINE_LOGOS[trimmed]

  const lower = trimmed.toLowerCase()
  if (lower.includes("climax")) return "/engines/climax.svg"
  if (lower.includes("repco")) return "/engines/repco.svg"
  if (lower.includes("ferrari") || lower.includes("acer")) return "/engines/ferrari.svg"
  if (lower.includes("mercedes")) return "/engines/mercedes.svg"
  if (lower.includes("renault")) return "/engines/renault.svg"
  if (lower.includes("honda")) return lower.includes("rbpt") ? "/engines/honda_rbpt.svg" : "/engines/honda.svg"
  if (lower.includes("ford") || lower.includes("cosworth") || lower.includes("european") || lower.includes("fondmetal")) {
    return lower.includes("cosworth") && !lower.includes("ford") ? "/engines/cosworth.svg" : "/engines/ford.svg"
  }
  if (lower.includes("bmw") || lower.includes("megatron")) return "/engines/bmw.svg"
  if (lower.includes("audi")) return "/engines/audi.svg"
  if (lower.includes("porsche")) return "/engines/porsche.svg"
  if (lower.includes("tag")) return "/engines/tag.svg"
  if (lower.includes("peugeot")) return "/engines/peugeot.svg"
  if (lower.includes("mugen")) return "/engines/mugen.svg"
  if (lower.includes("yamaha")) return "/engines/yamaha.svg"
  if (lower.includes("toyota")) return "/engines/toyota.svg"
  if (lower.includes("lamborghini")) return "/engines/lamborghini.svg"
  if (lower.includes("hart")) return "/engines/hart.svg"
  if (lower.includes("judd")) return "/engines/judd.svg"
  if (lower.includes("petronas")) return "/engines/petronas.svg"
  if (lower.includes("ilmor")) return "/engines/ilmor.svg"
  if (lower.includes("alfa")) return "/engines/alfa_romeo.svg"
  if (lower.includes("matra")) return "/engines/matra.svg"
  if (lower.includes("mecachrome")) return "/engines/mecachrome.svg"
  if (lower.includes("supertec")) return "/engines/supertec.svg"
  if (lower.includes("playlife")) return "/engines/playlife.svg"
  if (lower.includes("asiatech")) return "/engines/asiatech.svg"
  if (lower.includes("subaru")) return "/engines/subaru.svg"
  if (lower.includes("zakspeed")) return "/engines/zakspeed.svg"

  return null
}

export interface TeamMetadataInfo {
  city: string
  country: string
  founded: number
  engine: string
}

export const TEAM_METADATA_FALLBACK: Record<string, TeamMetadataInfo> = {
  Mercedes: { city: "Brackley", country: "Alemanha", founded: 2010, engine: "Mercedes" },
  Ferrari: { city: "Maranello", country: "Itália", founded: 1950, engine: "Ferrari" },
  Williams: { city: "Grove", country: "Reino Unido", founded: 1977, engine: "Mercedes" },
  Sauber: { city: "Hinwil", country: "Suíça", founded: 1993, engine: "Ferrari" },
  "Sauber Clássica": { city: "Hinwil", country: "Suíça", founded: 1993, engine: "Petronas" },
  "BMW Sauber": { city: "Hinwil", country: "Suíça", founded: 2006, engine: "BMW" },
  "Kick Sauber": { city: "Hinwil", country: "Suíça", founded: 2024, engine: "Ferrari" },
  Audi: { city: "Neuburg an der Donau", country: "Alemanha", founded: 2026, engine: "Audi" },
  "Red Bull Racing": { city: "Milton Keynes", country: "Reino Unido", founded: 2005, engine: "Red Bull Ford" },
  "Force India": { city: "Silverstone", country: "Reino Unido", founded: 2007, engine: "Mercedes" },
  "Racing Point": { city: "Silverstone", country: "Reino Unido", founded: 2018, engine: "BWT Mercedes" },
  "Aston Martin": { city: "Silverstone", country: "Reino Unido", founded: 2009, engine: "Mercedes" },
  "Toro Rosso": { city: "Faenza", country: "Itália", founded: 2005, engine: "Honda" },
  AlphaTauri: { city: "Faenza", country: "Itália", founded: 2020, engine: "Honda RBPT" },
  RB: { city: "Faenza", country: "Itália", founded: 2024, engine: "Honda RBPT" },
  "Racing Bulls": { city: "Faenza", country: "Itália", founded: 2025, engine: "Red Bull Ford" },
  McLaren: { city: "Woking", country: "Reino Unido", founded: 1963, engine: "Mercedes" },
  Renault: { city: "Enstone", country: "França", founded: 1977, engine: "Renault" },
  Alpine: { city: "Enstone", country: "França", founded: 2021, engine: "Renault" },
  "Lotus F1": { city: "Enstone", country: "Reino Unido", founded: 2012, engine: "Renault" },
  Haas: { city: "Kannapolis", country: "Estados Unidos", founded: 2014, engine: "Ferrari" },
  "Haas F1 Team": { city: "Kannapolis", country: "Estados Unidos", founded: 2014, engine: "Ferrari" },
  Cadillac: { city: "Fishers", country: "Estados Unidos", founded: 2026, engine: "Ferrari" },
  "Alfa Romeo": { city: "Hinwil", country: "Suíça", founded: 2018, engine: "Ferrari" },
  Benetton: { city: "Enstone", country: "Reino Unido", founded: 1986, engine: "Ford Cosworth" },
  Jordan: { city: "Silverstone", country: "Irlanda", founded: 1991, engine: "Ford Cosworth" },
  Lotus: { city: "Hethel", country: "Reino Unido", founded: 1952, engine: "Honda" },
  "Team Lotus": { city: "Hethel", country: "Reino Unido", founded: 1952, engine: "Honda" },
  Brabham: { city: "Chessington", country: "Reino Unido", founded: 1962, engine: "BMW" },
  Tyrrell: { city: "Ockham", country: "Reino Unido", founded: 1968, engine: "Ford Cosworth" },
  Ligier: { city: "Abrest", country: "França", founded: 1976, engine: "Renault" },
  Minardi: { city: "Faenza", country: "Itália", founded: 1979, engine: "Ford Cosworth" },
  Arrows: { city: "Milton Keynes", country: "Reino Unido", founded: 1978, engine: "Ford Cosworth" },
  Footwork: { city: "Milton Keynes", country: "Reino Unido", founded: 1991, engine: "Porsche" },
  Prost: { city: "Guyancourt", country: "França", founded: 1997, engine: "Peugeot" },
  Stewart: { city: "Milton Keynes", country: "Reino Unido", founded: 1997, engine: "Ford" },
  Jaguar: { city: "Milton Keynes", country: "Reino Unido", founded: 2000, engine: "Cosworth" },
  BAR: { city: "Brackley", country: "Reino Unido", founded: 1999, engine: "Honda" },
  "Lucky Strike BAR Honda": { city: "Brackley", country: "Reino Unido", founded: 1999, engine: "Honda" },
  "BAR Honda": { city: "Brackley", country: "Reino Unido", founded: 1999, engine: "Honda" },
  Honda: { city: "Brackley", country: "Japão", founded: 1964, engine: "Honda" },
  Brawn: { city: "Brackley", country: "Reino Unido", founded: 2009, engine: "Mercedes" },
  Toyota: { city: "Colônia", country: "Alemanha", founded: 2002, engine: "Toyota" },
  "Super Aguri": { city: "Leafield", country: "Japão", founded: 2006, engine: "Honda" },
  Spyker: { city: "Silverstone", country: "Holanda", founded: 2007, engine: "Ferrari" },
  "Spyker MF1": { city: "Silverstone", country: "Holanda", founded: 2006, engine: "Toyota" },
  MF1: { city: "Silverstone", country: "Rússia", founded: 2006, engine: "Toyota" },
  Midland: { city: "Silverstone", country: "Rússia", founded: 2006, engine: "Toyota" },
  Virgin: { city: "Dinnington", country: "Reino Unido", founded: 2010, engine: "Cosworth" },
  Marussia: { city: "Banbury", country: "Reino Unido", founded: 2012, engine: "Cosworth" },
  "Manor Marussia": { city: "Banbury", country: "Reino Unido", founded: 2015, engine: "Ferrari" },
  "Manor Racing": { city: "Banbury", country: "Reino Unido", founded: 2015, engine: "Mercedes" },
  Caterham: { city: "Leafield", country: "Reino Unido", founded: 2012, engine: "Renault" },
  HRT: { city: "Madrid", country: "Espanha", founded: 2010, engine: "Cosworth" },
  Larrousse: { city: "Antony", country: "França", founded: 1987, engine: "Lamborghini" },
  Lola: { city: "Huntingdon", country: "Reino Unido", founded: 1958, engine: "Ford Cosworth" },
  March: { city: "Bicester", country: "Reino Unido", founded: 1969, engine: "Judd" },
  "Leyton House": { city: "Bicester", country: "Reino Unido", founded: 1990, engine: "Judd" },
  Dallara: { city: "Varano de' Melegari", country: "Itália", founded: 1988, engine: "Ford Cosworth" },
  Osella: { city: "Volpiano", country: "Itália", founded: 1980, engine: "Ford Cosworth" },
  Fondmetal: { city: "Palosco", country: "Itália", founded: 1991, engine: "Ford Cosworth" },
  Simtek: { city: "Banbury", country: "Reino Unido", founded: 1989, engine: "Ford Cosworth" },
  Pacific: { city: "Thetford", country: "Reino Unido", founded: 1984, engine: "Ford Cosworth" },
  Forti: { city: "Alessandria", country: "Itália", founded: 1977, engine: "Ford Cosworth" },
  "Andrea Moda": { city: "Civitanova Marche", country: "Itália", founded: 1992, engine: "Judd" },
  Lambo: { city: "Modena", country: "Itália", founded: 1991, engine: "Lamborghini" },
  "Modena Team": { city: "Modena", country: "Itália", founded: 1991, engine: "Lamborghini" },
  AGS: { city: "Gonfaron", country: "França", founded: 1986, engine: "Ford Cosworth" },
  "Euro Brun": { city: "Senago", country: "Itália", founded: 1988, engine: "Judd" },
  Rial: { city: "Fussgönheim", country: "Alemanha", founded: 1988, engine: "Ford Cosworth" },
  Onyx: { city: "Littlehampton", country: "Reino Unido", founded: 1989, engine: "Ford Cosworth" },
  Zakspeed: { city: "Niederzissen", country: "Alemanha", founded: 1985, engine: "Zakspeed" },
  Coloni: { city: "Passignano sul Trasimeno", country: "Itália", founded: 1987, engine: "Ford Cosworth" },
  RAM: { city: "Silverstone", country: "Reino Unido", founded: 1976, engine: "Hart" },
  Spirit: { city: "Slough", country: "Reino Unido", founded: 1981, engine: "Hart" },
  Toleman: { city: "Witney", country: "Reino Unido", founded: 1981, engine: "Hart" },
  ATS: { city: "Bad Dürkheim", country: "Alemanha", founded: 1977, engine: "Ford Cosworth" },
  Theodore: { city: "Hong Kong", country: "Hong Kong", founded: 1977, engine: "Ford Cosworth" },
  Fittipaldi: { city: "Reading", country: "Brasil", founded: 1974, engine: "Ford Cosworth" },
  Ensign: { city: "Burntwood", country: "Reino Unido", founded: 1973, engine: "Ford Cosworth" },
  Shadow: { city: "Northampton", country: "Reino Unido", founded: 1969, engine: "Ford Cosworth" },
}

export const HISTORICAL_TEAM_ENGINES: Record<string, Record<number, string>> = {
  Ferrari: Object.fromEntries(Array.from({ length: 47 }, (_, i) => [1980 + i, "Ferrari"])),
  McLaren: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1984 + i, "TAG Porsche"])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1988 + i, "Honda"])),
    1993: "Ford Cosworth",
    1994: "Peugeot",
    ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [1995 + i, "Mercedes"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2015 + i, "Honda"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2018 + i, "Renault"])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2021 + i, "Mercedes"])),
  },
  Williams: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1984 + i, "Honda"])),
    1988: "Judd",
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1989 + i, "Renault"])),
    1998: "Mecachrome",
    1999: "Supertec",
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2000 + i, "BMW"])),
    2006: "Cosworth",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2007 + i, "Toyota"])),
    2010: "Cosworth",
    2011: "Cosworth",
    2012: "Renault",
    2013: "Renault",
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [2014 + i, "Mercedes"])),
  },
  "Red Bull Racing": {
    2005: "Cosworth",
    2006: "Ferrari",
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [2007 + i, "Renault"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2016 + i, "TAG Heuer"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2019 + i, "Honda"])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2022 + i, "Honda RBPT"])),
    2026: "Red Bull Ford",
  },
  Mercedes: Object.fromEntries(Array.from({ length: 17 }, (_, i) => [2010 + i, "Mercedes"])),
  Renault: {
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1977 + i, "Renault"])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2002 + i, "Renault"])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2016 + i, "Renault"])),
  },
  Alpine: {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2021 + i, "Renault"])),
    2026: "Mercedes",
  },
  "Aston Martin": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2021 + i, "Mercedes"])),
    2026: "Honda",
  },
  "Force India": {
    2008: "Ferrari",
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2009 + i, "Mercedes"])),
  },
  "Racing Point": Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2018 + i, "BWT Mercedes"])),
  "Toro Rosso": {
    2006: "Cosworth",
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [2007 + i, "Ferrari"])),
    2014: "Renault",
    2015: "Renault",
    2016: "Ferrari",
    2017: "Renault",
    2018: "Honda",
    2019: "Honda",
  },
  AlphaTauri: {
    2020: "Honda",
    2021: "Honda",
    2022: "Honda RBPT",
    2023: "Honda RBPT",
  },
  RB: { 2024: "Honda RBPT" },
  "Racing Bulls": {
    2025: "Honda RBPT",
    2026: "Red Bull Ford",
  },
  Sauber: {
    1993: "Ilmor",
    1994: "Mercedes",
    1995: "Ford Cosworth",
    1996: "Ford Cosworth",
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1997 + i, "Petronas"])),
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [2010 + i, "Ferrari"])),
  },
  "Sauber Clássica": Object.fromEntries(Array.from({ length: 9 }, (_, i) => [1997 + i, "Petronas"])),
  "BMW Sauber": Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, "BMW"])),
  "Alfa Romeo": Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2018 + i, "Ferrari"])),
  "Kick Sauber": { 2024: "Ferrari", 2025: "Ferrari" },
  Audi: { 2026: "Audi" },
  Haas: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [2016 + i, "Ferrari"])),
  "Haas F1 Team": Object.fromEntries(Array.from({ length: 11 }, (_, i) => [2016 + i, "Ferrari"])),
  Cadillac: { 2026: "Ferrari" },
  Benetton: {
    1986: "BMW",
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1987 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1995 + i, "Renault"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, "Playlife"])),
    2001: "Renault",
  },
  Jordan: {
    1991: "Ford Cosworth",
    1992: "Yamaha",
    1993: "Hart",
    1994: "Hart",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1995 + i, "Peugeot"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, "Mugen-Honda"])),
    2001: "Honda",
    2002: "Honda",
    2003: "Ford Cosworth",
    2004: "Ford Cosworth",
    2005: "Toyota",
  },
  Lotus: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1983 + i, "Renault"])),
    1987: "Honda",
    1988: "Honda",
    1989: "Judd",
    1990: "Lamborghini",
    1991: "Judd",
    1992: "Ford Cosworth",
    1993: "Ford Cosworth",
    1994: "Mugen-Honda",
    2010: "Cosworth",
    2011: "Renault",
  },
  "Team Lotus": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1983 + i, "Renault"])),
    1987: "Honda",
    1988: "Honda",
    1989: "Judd",
    1990: "Lamborghini",
    1991: "Judd",
    1992: "Ford Cosworth",
    1993: "Ford Cosworth",
    1994: "Mugen-Honda",
    2011: "Renault",
  },
  "Lotus F1": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, "Renault"])),
    2015: "Mercedes",
  },
  Brabham: {
    1980: "Ford Cosworth",
    1981: "Ford Cosworth",
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1982 + i, "BMW"])),
    1989: "Judd",
    1990: "Judd",
    1991: "Yamaha",
    1992: "Judd",
  },
  Tyrrell: {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    1985: "Renault",
    1986: "Renault",
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1987 + i, "Ford Cosworth"])),
    1991: "Honda",
    1992: "Ilmor",
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1993 + i, "Yamaha"])),
    1997: "Ford Cosworth",
    1998: "Ford Cosworth",
  },
  Ligier: {
    1980: "Ford Cosworth",
    1981: "Matra",
    1982: "Matra",
    1983: "Ford Cosworth",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1984 + i, "Renault"])),
    1987: "Megatron",
    1988: "Judd",
    1989: "Ford Cosworth",
    1990: "Ford Cosworth",
    1991: "Lamborghini",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1992 + i, "Renault"])),
    1995: "Mugen-Honda",
    1996: "Mugen-Honda",
  },
  Minardi: {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1985 + i, "Motori Moderni"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1988 + i, "Ford Cosworth"])),
    1991: "Ferrari",
    1992: "Lamborghini",
    1993: "Ford Cosworth",
    1994: "Ford Cosworth",
    1995: "Mugen-Honda",
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1996 + i, "Ford Cosworth"])),
    2000: "Fondmetal",
    2001: "European",
    2002: "Asiatech",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2003 + i, "Cosworth"])),
  },
  Arrows: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1984 + i, "BMW"])),
    1987: "Megatron",
    1988: "Megatron",
    1989: "Ford Cosworth",
    1990: "Ford Cosworth",
    1996: "Hart",
    1997: "Yamaha",
    1998: "Arrows",
    1999: "Arrows",
    2000: "Supertec",
    2001: "Asiatech",
    2002: "Cosworth",
  },
  Footwork: {
    1991: "Porsche",
    1992: "Mugen-Honda",
    1993: "Mugen-Honda",
    1994: "Ford Cosworth",
    1995: "Ford Cosworth",
    1996: "Hart",
  },
  Prost: {
    1997: "Mugen-Honda",
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, "Peugeot"])),
    2001: "Acer",
  },
  Stewart: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1997 + i, "Ford"])),
  Jaguar: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2000 + i, "Cosworth"])),
  BAR: {
    1999: "Supertec",
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2000 + i, "Honda"])),
  },
  "Lucky Strike BAR Honda": Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2000 + i, "Honda"])),
  "BAR Honda": Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2000 + i, "Honda"])),
  Honda: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2006 + i, "Honda"])),
  Brawn: { 2009: "Mercedes" },
  Toyota: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2002 + i, "Toyota"])),
  "Super Aguri": Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2006 + i, "Honda"])),
  Spyker: { 2007: "Ferrari" },
  "Spyker MF1": { 2006: "Toyota" },
  MF1: { 2006: "Toyota" },
  Midland: { 2006: "Toyota" },
  Virgin: { 2010: "Cosworth", 2011: "Cosworth" },
  Marussia: {
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2012 + i, "Cosworth"])),
    2014: "Ferrari",
  },
  "Manor Marussia": {
    2015: "Ferrari",
    2016: "Mercedes",
  },
  "Manor Racing": { 2016: "Mercedes" },
  Caterham: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, "Renault"])),
  HRT: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2010 + i, "Cosworth"])),
  Larrousse: {
    1987: "Ford Cosworth",
    1988: "Ford Cosworth",
    1989: "Lamborghini",
    1990: "Lamborghini",
    1991: "Ford Cosworth",
    1992: "Lamborghini",
    1993: "Ford Cosworth",
    1994: "Ford Cosworth",
  },
  March: {
    1987: "Ford Cosworth",
    1988: "Ford Cosworth",
    1989: "Judd",
    1990: "Judd",
    1992: "Ilmor",
  },
  "Leyton House": {
    1990: "Judd",
    1991: "Ilmor",
  },
  Dallara: {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1988 + i, "Ford Cosworth"])),
    1991: "Judd",
    1992: "Ferrari",
  },
  Osella: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1984 + i, "Alfa Romeo"])),
    1989: "Ford Cosworth",
    1990: "Ford Cosworth",
  },
  Fondmetal: { 1991: "Ford Cosworth", 1992: "Ford Cosworth" },
  Simtek: { 1994: "Ford Cosworth", 1995: "Ford Cosworth" },
  Pacific: { 1994: "Ilmor", 1995: "Ford Cosworth" },
  Forti: { 1995: "Ford Cosworth", 1996: "Ford Cosworth" },
  "Andrea Moda": { 1992: "Judd" },
  Lambo: { 1991: "Lamborghini" },
  "Modena Team": { 1991: "Lamborghini" },
  AGS: {
    1986: "Motori Moderni",
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1987 + i, "Ford Cosworth"])),
  },
  "Euro Brun": Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1988 + i, "Judd"])),
  Rial: { 1988: "Ford Cosworth", 1989: "Ford Cosworth" },
  Onyx: { 1989: "Ford Cosworth", 1990: "Ford Cosworth" },
  Zakspeed: {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1985 + i, "Zakspeed"])),
    1989: "Yamaha",
  },
  Coloni: {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1987 + i, "Ford Cosworth"])),
    1990: "Subaru",
    1991: "Ford Cosworth",
  },
  RAM: {
    1983: "Ford Cosworth",
    1984: "Hart",
    1985: "Hart",
  },
  Spirit: {
    1983: "Honda",
    1984: "Hart",
    1985: "Hart",
  },
  Toleman: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1981 + i, "Hart"])),
  ATS: {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1980 + i, "Ford Cosworth"])),
    1983: "BMW",
    1984: "BMW",
  },
  Theodore: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1981 + i, "Ford Cosworth"])),
  Fittipaldi: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1980 + i, "Ford Cosworth"])),
  Ensign: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1980 + i, "Ford Cosworth"])),
  Shadow: { 1980: "Ford Cosworth" },
}

export function getTeamEngine(teamName: string | null | undefined, season?: number, fallbackEngine?: string | null): string {
  if (!teamName) return fallbackEngine || "—"
  const trimmed = teamName.trim()
  const canonical = TEAM_ALIASES[trimmed.toLowerCase()] || trimmed
  if (season && HISTORICAL_TEAM_ENGINES[canonical]?.[season]) {
    return HISTORICAL_TEAM_ENGINES[canonical][season]
  }
  if (season && HISTORICAL_TEAM_ENGINES[trimmed]?.[season]) {
    return HISTORICAL_TEAM_ENGINES[trimmed][season]
  }
  if (fallbackEngine && fallbackEngine !== "—") return fallbackEngine
  return TEAM_METADATA_FALLBACK[canonical]?.engine || TEAM_METADATA_FALLBACK[trimmed]?.engine || "—"
}

export function getTeamMetadata(teamName: string | null | undefined): TeamMetadataInfo | null {
  if (!teamName) return null
  const trimmed = teamName.trim()
  const canonical = TEAM_ALIASES[trimmed.toLowerCase()] || trimmed
  return TEAM_METADATA_FALLBACK[canonical] || TEAM_METADATA_FALLBACK[trimmed] || null
}

export function formatTeamHeadquarters(city?: string | null, country?: string | null, teamName?: string | null): string {
  if (city && country) return `${city}, ${country}`
  if (country) return country
  if (teamName) {
    const meta = getTeamMetadata(teamName)
    if (meta) return `${meta.city}, ${meta.country}`
  }
  return "—"
}


export function displayTeamName(name: string | null, season?: number): string {
  if (!name) return ""
  
  if (name === "RB" || name === "Racing Bulls" || name === "Racing Bulls F1 Team" || name === "VCARB") {
    if (season === 2024) return "Visa Cash App RB Formula One Team"
    if (season && season >= 2025) return "Racing Bulls F1 Team"
    if (season && season >= 2020 && season <= 2023) return "Scuderia AlphaTauri"
    return "Racing Bulls F1 Team"
  }
  if (name === "AlphaTauri" || (name === "RB" && season && season >= 2020 && season <= 2023)) {
    return "Scuderia AlphaTauri"
  }
  if (name === "Mercedes" || name === "Mercedes-AMG" || name === "Mercedes-AMG Petronas" || name === "Mercedes-AMG Petronas F1 Team") {
    if (season && season >= 2010 && season <= 2011) return "Mercedes GP Petronas F1 Team"
    return "Mercedes-AMG Petronas F1 Team"
  }
  if (name === "Toro Rosso") {
    return "Scuderia Toro Rosso"
  }
  
  if (name === "Alpine" || name === "Alpine F1 Team" || name === "BWT Alpine" || name === "BWT Alpine F1 Team") {
    if (season === 2021) return "Alpine F1 Team"
    if (season && season >= 2022) return "BWT Alpine F1 Team"
    return "BWT Alpine F1 Team"
  }
  if (name === "Lotus F1") {
    return "Lotus F1 Team"
  }
  if (name === "Renault") {
    if (season && season >= 1981 && season <= 2001) return "Renault F1 Team"
    if (season && season >= 2002 && season <= 2006) return "Mild Seven Renault F1 Team"
    if (season && season >= 2007 && season <= 2009) return "ING Renault F1 Team"
    if (season === 2010) return "Renault F1 Team"
    if (season === 2011) return "Lotus Renault GP"
    if (season && season >= 2016 && season <= 2020) return "Renault DP World F1 Team"
    return "Renault F1 Team"
  }

  if (name === "Force India") return "Force India F1 Team"
  if (name === "Racing Point" || name === "Racing Point F1 Team") {
    if (season === 2019) return "SportPesa Racing Point F1 Team"
    if (season === 2020) return "BWT Racing Point F1 Team"
    return "Racing Point F1 Team"
  }
  if (name === "Aston Martin" || name === "Aston Martin Aramco" || name === "Aston Martin F1 Team") {
    if (season === 2021) return "Aston Martin Cognizant F1 Team"
    if (season === 2022) return "Aston Martin Aramco Cognizant F1 Team"
    if (season && season >= 2023) return "Aston Martin Aramco F1 Team"
    return "Aston Martin Aramco F1 Team"
  }
  if (name === "Sauber" || name === "Kick Sauber" || name === "Stake F1 Team") {
    if (season === 2024 || season === 2025) return "Stake F1 Team Kick Sauber"
    if (season && season >= 1993 && season <= 2005) return "Sauber Clássica"
    if (season && season >= 2010 && season <= 2018) return "Sauber"
    return "Kick Sauber F1 Team"
  }
  if (name === "BMW Sauber") return "BMW Sauber F1 Team"
  if (name === "Virgin") {
    if (season === 2010) return "Virgin Racing"
    if (season === 2011) return "Marussia Virgin"
    return "Virgin Racing"
  }
  if (name === "Marussia") return "Marussia F1 Team"
  if (name === "Manor Marussia") {
    if (season === 2015) return "Manor Marussia F1 Team"
    if (season && season >= 2016) return "Manor Racing"
    return "Manor Racing"
  }
  if (name === "Lotus") {
    if (season === 2010) return "Lotus Racing"
    if (season === 2011) return "Team Lotus"
    return "Team Lotus"
  }
  if (name === "Caterham") return "Caterham F1 Team"
  if (name === "HRT") {
    if (season === 2010) return "Hispania Racing Team"
    return "HRT F1 Team"
  }
  if (name === "Brawn") {
    return "Brawn GP Formula One Team"
  }
  if (name === "Toyota") {
    if (season === 2002) return "Toyota Racing"
    if (season && season >= 2003 && season <= 2009) return "Panasonic Toyota Racing"
    return "Panasonic Toyota Racing"
  }
  if (name === "Honda") {
    if (season && season >= 1964 && season <= 1968) return "Honda F1 Team"
    if (season && season >= 1983 && season <= 1992) return "Honda F1"
    if (season && season >= 2006 && season <= 2008) return "Honda Racing F1 Team"
    return "Honda Racing F1 Team"
  }
  if (name === "Super Aguri") {
    return "Super Aguri F1 Team"
  }
  if (name === "Spyker") {
    return "Spyker F1 Team"
  }
  if (name === "Spyker MF1") return "Spyker MF1 Racing"
  if (name === "MF1") return "MF1 Racing"
  if (name === "BAR" || name === "BAR Honda") {
    return "Lucky Strike BAR Honda"
  }
  if (name === "Jordan") {
    if (season && season >= 1991 && season <= 1995) return "Jordan Grand Prix"
    if (season && season >= 1996 && season <= 2002) return "Jordan Grand Prix Buzzin Hornets"
    if (season && season >= 2003 && season <= 2005) return "Jordan Grand Prix Bitten Hisses"
    return "Jordan Grand Prix"
  }
  if (name === "Jaguar") {
    if (season === 2000) return "Jaguar Racing Beck"
    if (season === 2001) return "Jaguar Racing HSBC"
    return "Jaguar Racing"
  }
  if (name === "Footwork") return "Arrows Footwork"
  if (name === "Arrows") {
    if (season && season >= 2000 && season <= 2002) return "Orange Arrows"
    return "Arrows"
  }
  if (name === "Benetton") {
    if (season && season >= 1986 && season <= 1990) return "Benetton Formula United Colors of Benetton"
    if (season && season >= 1991 && season <= 1993) return "Benetton Formula United Colors"
    if (season && season >= 1994 && season <= 2001) return "Benetton Formula Mild Seven"
    return "Benetton Formula"
  }
  if (name === "Prost") {
    if (season === 1997) return "Prost Grand Prix Formula One Team"
    if (season && season >= 1998 && season <= 2000) return "Prost Grand Prix Yahoo!"
    if (season === 2001) return "Prost Grand Prix Acer"
    return "Prost Grand Prix"
  }
  if (name === "Stewart") {
    if (season === 1997) return "Stewart Grand Prix Formula One Team"
    if (season === 1998) return "Stewart Grand Prix MCI Worldcom"
    if (season === 1999) return "Stewart Lear"
    return "Stewart Grand Prix"
  }
  if (name === "Tyrrell") {
    if (season && season >= 1970 && season <= 1979) return "Tyrrell Racing One Team Elf"
    if (season && season >= 1980 && season <= 1992) return "Tyrrell Candy Braun"
    if (season && season >= 1993 && season <= 1998) return "Tyrrell Mild Seven"
    return "Tyrrell Racing"
  }
  if (name === "Ligier") {
    if (season && season >= 1976 && season <= 1985) return "Ligier F1 Team Gitanes"
    if (season && season >= 1986 && season <= 1992) return "Ligier Gitanes Blondes"
    if (season && season >= 1993 && season <= 1996) return "Ligier F1 Gauloises"
    return "Equipe Ligier"
  }
  if (name === "Forti") {
    return "Forti Corse"
  }
  if (name === "Pacific") {
    return "Pacific Grand Prix"
  }
  if (name === "Simtek") {
    return "MTV Simtek Ford"
  }
  if (name === "Leyton House") {
    return "Leyton House Racing"
  }
  if (name === "Fondmetal") {
    return "Fondmetal Corse"
  }
  if (name === "Lambo" || name === "Modena Team") {
    return "Modena Team Lambo"
  }
  if (name === "Fittipaldi") {
    return "Fittipaldi Automotive"
  }
  if (name === "Theodore") {
    return "Theodore Racing"
  }
  if (name === "Ensign") {
    return "Team Ensign"
  }
  if (name === "Shadow") {
    return "Shadow Racing Cars"
  }
  if (name === "ATS") {
    return "ATS Wheels F1 Team"
  }
  if (name === "Andrea Moda") {
    return "Andrea Moda Formula"
  }
  if (name === "Minardi") {
    if (season && season >= 2001 && season <= 2005) return "Minardi European"
    return "Minardi F1 Team"
  }
  if (name === "Williams" || name === "Williams Racing") {
    if (season && season >= 1978 && season <= 1993) return "Williams Grand Prix Engineering"
    if (season && season >= 1994 && season <= 1999) return "Williams Rothmans"
    if (season && season >= 2000 && season <= 2005) return "BMW WilliamsF1 Team"
    if (season === 2006) return "WilliamsF1 Team"
    if (season && season >= 2007 && season <= 2011) return "AT&T Williams"
    if (season && season >= 2012 && season <= 2013) return "Williams F1 Team"
    if (season && season >= 2014 && season <= 2018) return "Martini Williams Racing"
    if (season === 2019) return "ROKiT Williams Racing"
    if (season && season >= 2020) return "Williams Racing"
    return "Williams Racing"
  }

  if (name === "Haas" || name === "Haas F1 Team") {
    if (season === 2019) return "Rich Energy Haas F1 Team"
    if (season === 2020) return "Haas F1 Team"
    if (season === 2021) return "Uralkali Haas F1 Team"
    if (season === 2022) return "Haas F1 Team"
    if (season && season >= 2023) return "MoneyGram Haas F1 Team"
    return "MoneyGram Haas F1 Team"
  }

  if (name === "Alfa Romeo" || name === "Alfa Romeo F1 Team") {
    if (season === 2019) return "Alfa Romeo Racing"
    if (season && season >= 2020 && season <= 2021) return "Alfa Romeo Racing ORLEN"
    if (season === 2022) return "Alfa Romeo F1 Team ORLEN"
    if (season === 2023) return "Alfa Romeo F1 Team Stake"
    return "Alfa Romeo F1 Team"
  }

  if (name === "Red Bull" || name === "Red Bull Racing" || name === "Oracle Red Bull Racing") {
    if (season === 2020) return "Aston Martin Red Bull Racing"
    if (season === 2021) return "Red Bull Racing Honda"
    if (season && season >= 2022) return "Oracle Red Bull Racing"
    if (!season) return "Oracle Red Bull Racing"
    return "Red Bull Racing"
  }

  if (name === "Ferrari" || name === "Scuderia Ferrari" || name === "Scuderia Ferrari HP") {
    if (season && season >= 1997 && season <= 2010) return "Scuderia Ferrari Marlboro"
    if (season === 2021) return "Scuderia Ferrari Mission Winnow"
    if (season && season >= 2024) return "Scuderia Ferrari HP"
    if (season && season >= 2020 && season <= 2023) return "Scuderia Ferrari"
    if (!season) return "Scuderia Ferrari HP"
    return "Scuderia Ferrari"
  }

  if (name === "Mercedes" || name === "Mercedes-AMG Petronas" || name === "Mercedes-AMG Petronas F1 Team") {
    return "Mercedes-AMG Petronas F1 Team"
  }

  if (name === "McLaren" || name === "Mclaren" || name === "McLaren F1 Team" || name === "Mclaren F1 Team") {
    if (season && season >= 1997 && season <= 2005) return "West McLaren Mercedes"
    if (season === 2006) return "Team McLaren Mercedes"
    if (season && season >= 2007 && season <= 2013) return "Vodafone McLaren Mercedes"
    return "Mclaren F1 Team"
  }

  return name
}

export function formatNationality(nationality: string | null): string {
  if (!nationality) return ""
  return nationality
}

export function formatCountry(country: string | null | undefined): string {
  if (!country) return ""
  return country
}

export const HISTORICAL_CONSTRUCTOR_ORDERS: Record<number, Record<string, number>> = {
  1980: {
    Williams: 1,
    Ligier: 2,
    Brabham: 3,
    Renault: 4,
    "Team Lotus": 5,
    Tyrrell: 6,
    Arrows: 7,
    Fittipaldi: 8,
    McLaren: 9,
    Ferrari: 10,
    "Alfa Romeo": 11,
    ATS: 12,
    Ensign: 13,
    Osella: 14,
    Shadow: 15,
  },
  1981: {
    Williams: 1,
    Brabham: 2,
    Renault: 3,
    Ligier: 4,
    Ferrari: 5,
    McLaren: 6,
    "Team Lotus": 7,
    Arrows: 8,
    "Alfa Romeo": 9,
    Tyrrell: 10,
    Ensign: 11,
    Theodore: 12,
    ATS: 13,
    March: 14,
    Fittipaldi: 15,
    Osella: 16,
    Toleman: 17,
  },
  1982: {
    Ferrari: 1,
    McLaren: 2,
    Renault: 3,
    Williams: 4,
    Brabham: 5,
    "Team Lotus": 6,
    Tyrrell: 7,
    Ligier: 8,
    "Alfa Romeo": 9,
    Arrows: 10,
    ATS: 11,
    Osella: 12,
    Fittipaldi: 13,
    March: 14,
    Ensign: 15,
    Toleman: 16,
    Theodore: 17,
  },
  1983: {
    Ferrari: 1,
    Renault: 2,
    Brabham: 3,
    Williams: 4,
    McLaren: 5,
    "Alfa Romeo": 6,
    Tyrrell: 7,
    "Team Lotus": 8,
    Toleman: 9,
    Arrows: 10,
    Theodore: 11,
    Ligier: 12,
    Spirit: 13,
    ATS: 14,
    Osella: 15,
    RAM: 16,
  },
  1984: {
    McLaren: 1,
    Ferrari: 2,
    "Team Lotus": 3,
    Brabham: 4,
    Renault: 5,
    Williams: 6,
    Toleman: 7,
    "Alfa Romeo": 8,
    Arrows: 9,
    Ligier: 10,
    Osella: 11,
    ATS: 12,
    Spirit: 13,
    RAM: 14,
    Tyrrell: 15,
  },
  1985: {
    McLaren: 1,
    Ferrari: 2,
    Williams: 3,
    "Team Lotus": 4,
    Brabham: 5,
    Ligier: 6,
    Renault: 7,
    Arrows: 8,
    Tyrrell: 9,
    Osella: 10,
    Minardi: 11,
    "Alfa Romeo": 12,
    RAM: 13,
    Zakspeed: 14,
    Toleman: 15,
    Spirit: 16,
    Lola: 17,
  },
  1986: {
    Williams: 1,
    McLaren: 2,
    "Team Lotus": 3,
    Ferrari: 4,
    Benetton: 5,
    Ligier: 6,
    Tyrrell: 7,
    Lola: 8,
    Brabham: 9,
    Arrows: 10,
    Zakspeed: 11,
    Osella: 12,
    Minardi: 13,
    AGS: 14,
  },
  1987: {
    Williams: 1,
    McLaren: 2,
    "Team Lotus": 3,
    Ferrari: 4,
    Benetton: 5,
    Tyrrell: 6,
    Arrows: 7,
    Brabham: 8,
    Lola: 9,
    Zakspeed: 10,
    Ligier: 11,
    AGS: 12,
    March: 13,
    Osella: 14,
    Minardi: 15,
    Coloni: 16,
  },
  1988: {
    McLaren: 1,
    Ferrari: 2,
    Benetton: 3,
    "Team Lotus": 4,
    Arrows: 5,
    March: 6,
    Williams: 7,
    Tyrrell: 8,
    Rial: 9,
    Minardi: 10,
    Dallara: 11,
    AGS: 12,
    Coloni: 13,
    Larrousse: 14,
    Osella: 15,
    "Euro Brun": 16,
    Zakspeed: 17,
    Ligier: 18,
  },
  1989: {
    McLaren: 1,
    Williams: 2,
    Ferrari: 3,
    Benetton: 4,
    Tyrrell: 5,
    "Team Lotus": 6,
    Arrows: 7,
    Dallara: 8,
    Brabham: 9,
    Onyx: 10,
    March: 11,
    Larrousse: 12,
    Ligier: 13,
    Rial: 14,
    AGS: 15,
    Minardi: 16,
    Osella: 17,
    "Euro Brun": 18,
    Coloni: 19,
    Zakspeed: 20,
  },
  1999: {
    Ferrari: 1,
    McLaren: 2,
    Jordan: 3,
    Stewart: 4,
    Williams: 5,
    Benetton: 6,
    Prost: 7,
    Sauber: 8,
    Arrows: 9,
    Minardi: 10,
    BAR: 11,
  },
  2000: {
    Ferrari: 1,
    McLaren: 2,
    Williams: 3,
    Benetton: 4,
    BAR: 5,
    Jordan: 6,
    Arrows: 7,
    Sauber: 8,
    Jaguar: 9,
    Minardi: 10,
    Prost: 11,
  },
  2001: {
    Ferrari: 1,
    McLaren: 2,
    Williams: 3,
    Sauber: 4,
    Jordan: 5,
    BAR: 6,
    Benetton: 7,
    Jaguar: 8,
    Prost: 9,
    Arrows: 10,
    Minardi: 11,
  },
  2002: {
    Ferrari: 1,
    Williams: 2,
    McLaren: 3,
    Renault: 4,
    Sauber: 5,
    Jordan: 6,
    Jaguar: 7,
    BAR: 8,
    Minardi: 9,
    Toyota: 10,
    Arrows: 11,
  },
  2003: {
    Ferrari: 1,
    Williams: 2,
    McLaren: 3,
    Renault: 4,
    BAR: 5,
    Sauber: 6,
    Jaguar: 7,
    Toyota: 8,
    Jordan: 9,
    Minardi: 10,
  },
  2004: {
    Ferrari: 1,
    BAR: 2,
    Renault: 3,
    Williams: 4,
    McLaren: 5,
    Sauber: 6,
    Jaguar: 7,
    Toyota: 8,
    Jordan: 9,
    Minardi: 10,
  },
  2005: {
    Renault: 1,
    McLaren: 2,
    Ferrari: 3,
    Toyota: 4,
    Williams: 5,
    BAR: 6,
    "BAR Honda": 6,
    "Red Bull Racing": 7,
    "Red Bull": 7,
    Sauber: 8,
    Jordan: 9,
    Minardi: 10,
  },
  2006: {
    Renault: 1,
    Ferrari: 2,
    McLaren: 3,
    Honda: 4,
    "BMW Sauber": 5,
    Sauber: 5,
    Toyota: 6,
    "Red Bull Racing": 7,
    "Red Bull": 7,
    Williams: 8,
    "Toro Rosso": 9,
    MF1: 10,
    Midland: 10,
    "Spyker MF1": 10,
    "Super Aguri": 11,
  },
  2007: {
    Ferrari: 1,
    "BMW Sauber": 2,
    Sauber: 2,
    Renault: 3,
    Williams: 4,
    "Red Bull Racing": 5,
    "Red Bull": 5,
    Toyota: 6,
    "Toro Rosso": 7,
    Honda: 8,
    "Super Aguri": 9,
    Spyker: 10,
    McLaren: 11,
  },
  2008: {
    Ferrari: 1,
    McLaren: 2,
    "BMW Sauber": 3,
    Sauber: 3,
    Renault: 4,
    Toyota: 5,
    "Toro Rosso": 6,
    "Red Bull Racing": 7,
    "Red Bull": 7,
    Williams: 8,
    Honda: 9,
    "Force India": 10,
    "Super Aguri": 11,
  },
  2009: {
    Brawn: 1,
    "Brawn GP": 1,
    "Red Bull Racing": 2,
    "Red Bull": 2,
    McLaren: 3,
    Ferrari: 4,
    Toyota: 5,
    "BMW Sauber": 6,
    Sauber: 6,
    Williams: 7,
    Renault: 8,
    "Force India": 9,
    "Toro Rosso": 10,
  },
  2010: {
    "Red Bull Racing": 1,
    McLaren: 2,
    Ferrari: 3,
    Mercedes: 4,
    Renault: 5,
    Williams: 6,
    "Force India": 7,
    "BMW Sauber": 8,
    Sauber: 8,
    "Toro Rosso": 9,
    Lotus: 10,
    HRT: 11,
    Virgin: 12,
  },
  2011: {
    "Red Bull Racing": 1,
    McLaren: 2,
    Ferrari: 3,
    Mercedes: 4,
    Renault: 5,
    "Force India": 6,
    Sauber: 7,
    "Toro Rosso": 8,
    Williams: 9,
    Lotus: 10,
    HRT: 11,
    Virgin: 12,
  },
  2012: {
    "Red Bull Racing": 1,
    Ferrari: 2,
    McLaren: 3,
    "Lotus F1": 4,
    Mercedes: 5,
    Sauber: 6,
    "Force India": 7,
    Williams: 8,
    "Toro Rosso": 9,
    Caterham: 10,
    Marussia: 11,
    HRT: 12,
  },
  2013: {
    "Red Bull Racing": 1,
    Mercedes: 2,
    Ferrari: 3,
    "Lotus F1": 4,
    McLaren: 5,
    "Force India": 6,
    Sauber: 7,
    "Toro Rosso": 8,
    Williams: 9,
    Marussia: 10,
    Caterham: 11,
  },
  2014: {
    Mercedes: 1,
    "Red Bull Racing": 2,
    Williams: 3,
    Ferrari: 4,
    McLaren: 5,
    "Force India": 6,
    "Toro Rosso": 7,
    "Lotus F1": 8,
    Marussia: 9,
    Sauber: 10,
    Caterham: 11,
  },
  2015: {
    Mercedes: 1,
    Ferrari: 2,
    Williams: 3,
    "Red Bull Racing": 4,
    "Force India": 5,
    "Lotus F1": 6,
    "Toro Rosso": 7,
    Sauber: 8,
    McLaren: 9,
    Marussia: 10,
    "Manor Marussia": 10,
  },
  2016: {
    Mercedes: 1,
    "Red Bull Racing": 2,
    Ferrari: 3,
    "Force India": 4,
    Williams: 5,
    McLaren: 6,
    "Toro Rosso": 7,
    Haas: 8,
    Renault: 9,
    Sauber: 10,
    "Manor Marussia": 11,
    Marussia: 11,
  },
  2017: {
    Mercedes: 1,
    Ferrari: 2,
    "Red Bull Racing": 3,
    "Force India": 4,
    Williams: 5,
    Renault: 6,
    "Toro Rosso": 7,
    Haas: 8,
    McLaren: 9,
    Sauber: 10,
  },
  2018: {
    Mercedes: 1,
    Ferrari: 2,
    "Red Bull Racing": 3,
    Renault: 4,
    Haas: 5,
    McLaren: 6,
    "Force India": 7,
    "Racing Point": 7,
    Sauber: 8,
    "Toro Rosso": 9,
    Williams: 10,
  },
  2019: {
    Mercedes: 1,
    Ferrari: 2,
    "Red Bull Racing": 3,
    McLaren: 4,
    Renault: 5,
    "Toro Rosso": 6,
    "Racing Point": 7,
    "Alfa Romeo": 8,
    Haas: 9,
    Williams: 10,
  },
  2020: {
    Mercedes: 1,
    "Red Bull Racing": 2,
    McLaren: 3,
    "Racing Point": 4,
    Renault: 5,
    Ferrari: 6,
    AlphaTauri: 7,
    "Alfa Romeo": 8,
    Haas: 9,
    Williams: 10,
  },
  2021: {
    Mercedes: 1,
    "Red Bull Racing": 2,
    Ferrari: 3,
    McLaren: 4,
    Alpine: 5,
    AlphaTauri: 6,
    "Aston Martin": 7,
    Williams: 8,
    "Alfa Romeo": 9,
    Haas: 10,
  },
  2022: {
    "Red Bull Racing": 1,
    Ferrari: 2,
    Mercedes: 3,
    Alpine: 4,
    McLaren: 5,
    "Alfa Romeo": 6,
    "Aston Martin": 7,
    Haas: 8,
    AlphaTauri: 9,
    Williams: 10,
  },
  2023: {
    "Red Bull Racing": 1,
    Mercedes: 2,
    Ferrari: 3,
    McLaren: 4,
    "Aston Martin": 5,
    Alpine: 6,
    Williams: 7,
    AlphaTauri: 8,
    "Alfa Romeo": 9,
    Haas: 10,
  },
  2026: {
    McLaren: 1,
    Mercedes: 2,
    "Red Bull Racing": 3,
    Ferrari: 4,
    Williams: 5,
    "Aston Martin": 6,
    Alpine: 7,
    Haas: 8,
    Audi: 9,
    "Racing Bulls": 10,
    Cadillac: 11,
  },
}

export function getTeamStandingsOrder(name: string | null | undefined, season?: number): number {
  if (!name || !season) return 999
  const seasonTable = HISTORICAL_CONSTRUCTOR_ORDERS[season]
  if (!seasonTable) return 999
  const canonical = TEAM_ALIASES[name.trim().toLowerCase()] || name
  return seasonTable[canonical] ?? seasonTable[name] ?? 999
}

const HISTORICAL_DRIVER_PHOTOS: Record<string, string> = {
  "Nelson Piquet": "/drivers/piquet_1987.jpg",
  "Ayrton Senna": "/drivers/senna.jpg",
  "Alain Prost": "/drivers/prost.jpg",
  "Niki Lauda": "/drivers/lauda.jpg",
  "Keke Rosberg": "/drivers/rosberg.jpg",
  "Nigel Mansell": "/drivers/mansell.jpg",
  "Alan Jones": "/drivers/alan_jones.jpg",
  "Emerson Fittipaldi": "/drivers/fittipaldi.jpg",
  "Jackie Stewart": "/drivers/stewart.jpg",
  "James Hunt": "/drivers/hunt.jpg",
  "Mario Andretti": "/drivers/andretti.jpg",
  "Jody Scheckter": "/drivers/scheckter.jpg",
  "Jochen Rindt": "/drivers/rindt.jpg",
  "Ronnie Peterson": "/drivers/peterson.jpg",
  "Clay Regazzoni": "/drivers/regazzoni.jpg",
  "Carlos Reutemann": "/drivers/reutemann.jpg",
  "Graham Hill": "/drivers/graham_hill.jpg",
  "Jim Clark": "/drivers/clark.jpg",
  "Jack Brabham": "/drivers/brabham.jpg",
  "Denny Hulme": "/drivers/hulme.jpg",
  "John Surtees": "/drivers/surtees.jpg",
  "Phil Hill": "/drivers/phil_hill.jpg",
  "Bruce McLaren": "/drivers/mclaren.jpg",
  "Dan Gurney": "/drivers/gurney.jpg",
  "Juan Manuel Fangio": "/drivers/fangio.jpg",
  "Juan Fangio": "/drivers/fangio.jpg",
  "Alberto Ascari": "/drivers/ascari.jpg",
  "Nino Farina": "/drivers/farina.jpg",
  "Giuseppe Farina": "/drivers/farina.jpg",
  "Mike Hawthorn": "/drivers/hawthorn.jpg",
  "Stirling Moss": "/drivers/moss.jpg",
}

export function driverPhoto(
  driverName: string | null | undefined,
  season?: number,
  fallbackUrl?: string | null
): string | null {
  if (!driverName) return fallbackUrl ?? null

  const norm = driverName.trim().toLowerCase()
  if (norm.includes("piquet") && (norm.includes("jr") || norm.includes("junior"))) {
    return fallbackUrl ?? null
  }

  for (const [key, path] of Object.entries(HISTORICAL_DRIVER_PHOTOS)) {
    if (norm === key.toLowerCase() || norm.includes(key.toLowerCase())) {
      if (!season || season <= 2000 || !fallbackUrl) {
        return path
      }
    }
  }

  return fallbackUrl ?? null
}

