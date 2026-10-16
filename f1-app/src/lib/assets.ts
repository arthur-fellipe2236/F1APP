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
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [1950 + i, { url: "/ferrari/1950-1964.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => [1964 + i, { url: "/ferrari/1964-1983.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 11 }, (_, i) => [1983 + i, { url: "/ferrari/1983-1994.jpg", className: "bg-white rounded-sm" }])),
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
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2010 + i, { url: "/mercedes/2010-2011.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/mercedes/2012-2014.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2015 + i, { url: "/mercedes/2015-2016.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2017 + i, { url: "/mercedes/2017-2019.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [2020 + i, { url: "/mercedes/2020-2025.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2026 + i, { url: "/mercedes/2026-Present.jpg", className: "bg-white rounded-sm" }])),
  },
  "McLaren": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1963 + i, { url: "/mclaren/1963-1966.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [1967 + i, { url: "/mclaren/1967-1980.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1981 + i, { url: "/mclaren/1981-1990.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/mclaren/1991-1997.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1997 + i, { url: "/mclaren/1997-2006.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2007 + i, { url: "/mclaren/2007-2017.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2017 + i, { url: "/mclaren/2017-2021.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2021 + i, { url: "/mclaren/2021-Present.jpg", className: "bg-white rounded-sm" }])),
  },
  "Red Bull Racing": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2005 + i, { url: "/redbull/2005-2012.jpg", className: "rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2013 + i, { url: "/redbull/2013-2015.jpg", className: "rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2016 + i, { url: "/redbull/2005-2012.jpg", className: "rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2018 + i, { url: "/redbull/2018-2020.jpg", className: "rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2021 + i, { url: "/redbull/2005-2012.jpg", className: "rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2022 + i, { url: "/redbull/2022-Present.jpg", className: "rounded-sm" }])),
  },
  "Renault": {
    ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [1981 + i, { url: "/alpine/renault-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2011 + i, { url: "/alpine/lotus.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2016 + i, { url: "/alpine/renault-2.jpg", className: "bg-white rounded-sm" }])),
  },
  "Haas": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2016 + i, { url: "/haas/haas-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2019 + i, { url: "/haas/haas-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 1 }, (_, i) => [2020 + i, { url: "/haas/haas-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2021 + i, { url: "/haas/haas-3.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => [2023 + i, { url: "/haas/haas-4.jpg", className: "bg-white rounded-sm" }])),
  },
  "Williams": {
    ...Object.fromEntries(Array.from({ length: 16 }, (_, i) => [1978 + i, { url: "/williams/williams-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1994 + i, { url: "/williams/williams-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 14 }, (_, i) => [2000 + i, { url: "/williams/williams-3.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2014 + i, { url: "/williams/williams-4.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2019 + i, { url: "/williams/williams-5.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2022 + i, { url: "/williams/williams-6.jpg", className: "bg-white rounded-sm" }])),
  },
  "Sauber": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1993 + i, { url: "/sauber/sauber-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [2010 + i, { url: "/teams/sauber.svg", color: "#002B49", className: "object-contain" }])),
  },
  "BMW Sauber": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, { url: "/teams/bmwsauber.svg", color: "#FFFFFF", className: "object-contain p-0.5" }])),
  },
  "Virgin": {
    2010: { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
    2011: { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  },
  "Marussia Virgin": {
    2011: { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  },
  "Marussia": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2012 + i, { url: "/teams/marussia.png", color: "#1E1E1E", className: "object-contain" }])),
  },
  "Manor Marussia": {
    2015: { url: "/teams/marussia.png", color: "#1E1E1E", className: "object-contain" },
    2016: { url: "/teams/manor.png", color: "#1E1E1E", className: "object-contain" },
    2017: { url: "/teams/manor.png", color: "#1E1E1E", className: "object-contain" },
  },
  "Lotus": {
    2010: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
    2011: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  },
  "Caterham": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/teams/caterham.svg", color: "#005030", className: "object-contain p-0.5" }])),
  },
  "HRT": {
    2010: { url: "/teams/hispania.svg", color: "#E10600", className: "object-contain p-0.5" },
    2011: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
    2012: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
  },
  "Brawn": {
    2009: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  },
  "Toyota": {
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [2002 + i, { url: "/teams/toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5" }])),
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
    2007: { url: "/teams/spyker.png", color: "#F58020", className: "object-contain p-0.5" },
  },
  "Spyker MF1": {
    2006: { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  },
  "MF1": {
    2006: { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  },
  "Midland": {
    2006: { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  },
  "BAR": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/bar/bar-1.jpg", className: "bg-white rounded-sm" }])),
  },
  "Jaguar": {
    2000: { url: "/jaguar/jaguar-1.jpg", className: "bg-white rounded-sm object-contain" },
    2001: { url: "/jaguar/jaguar-2.jpg", className: "bg-white rounded-sm object-contain" },
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2002 + i, { url: "/jaguar/jaguar-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Arrows": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1978 + i, { url: "/arrows/arrows-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1997 + i, { url: "/arrows/arrows-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Footwork": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/arrows/arrows-2.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Benetton": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1986 + i, { url: "/benetton/benetton-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1991 + i, { url: "/benetton/benetton-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1994 + i, { url: "/benetton/benetton-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Prost": {
    1997: { url: "/prost/prost-1.jpg", className: "bg-white rounded-sm object-contain" },
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, { url: "/prost/prost-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    2001: { url: "/prost/prost-3.jpg", className: "bg-white rounded-sm object-contain" },
  },
  "Stewart": {
    1997: { url: "/stewart/stewart-1.jpg", className: "bg-white rounded-sm object-contain" },
    1998: { url: "/stewart/stewart-2.jpg", className: "bg-white rounded-sm object-contain" },
    1999: { url: "/stewart/stewart-3.jpg", className: "bg-white rounded-sm object-contain" },
  },
  "Tyrrell": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1970 + i, { url: "/tyrrell/tyrrell-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1980 + i, { url: "/tyrrell/tyrrell-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1993 + i, { url: "/tyrrell/tyrrell-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Ligier": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1976 + i, { url: "/ligier/ligier-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1986 + i, { url: "/ligier/ligier-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1993 + i, { url: "/ligier/ligier-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Forti": {
    1995: { url: "/forti/forti.jpg", className: "bg-white rounded-sm object-contain" },
    1996: { url: "/forti/forti.jpg", className: "bg-white rounded-sm object-contain" },
  },
  "Pacific": {
    1994: { url: "/pacific/pacific.png", className: "bg-[#000000] rounded-sm object-contain" },
    1995: { url: "/pacific/pacific.png", className: "bg-[#000000] rounded-sm object-contain" },
  },
  "Simtek": {
    1994: { url: "/simtek/simtek.jpg", className: "bg-white rounded-sm object-contain" },
    1995: { url: "/simtek/simtek.jpg", className: "bg-white rounded-sm object-contain" },
  },
  "Minardi": {
    ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [1985 + i, { url: "/minardi/minardi-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1997 + i, { url: "/minardi/minardi-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/minardi/minardi-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
  "Jordan": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1991 + i, { url: "/jordan/jordan-1.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1996 + i, { url: "/jordan/jordan-2.jpg", className: "bg-white rounded-sm object-contain" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2003 + i, { url: "/jordan/jordan-3.jpg", className: "bg-white rounded-sm object-contain" }])),
  },
} 

const TEAM_LOGO_BY_NAME: Record<string, TeamLogoAsset> = {
  // F1 2026 Official Vector SVG Assets
  Ferrari: {
    url: `${F1_2026_BASE}/ferrari/2026ferrarilogowhite.svg`,
    color: "#E8002D",
  },
  Mercedes: {
    url: `${F1_2026_BASE}/mercedes/2026mercedeslogowhite.svg`,
    color: "#00A19B",
  },
  "Red Bull Racing": {
    url: `${F1_2026_BASE}/redbullracing/2026redbullracinglogowhite.svg`,
    color: "#3671C6",
  },
  "Red Bull": {
    url: `${F1_2026_BASE}/redbullracing/2026redbullracinglogowhite.svg`,
    color: "#3671C6",
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
    url: `${F1_2026_BASE}/racingbulls/2026racingbullslogowhite.svg`,
    color: "#1021C7",
  },
  "Racing Bulls": {
    url: `${F1_2026_BASE}/racingbulls/2026racingbullslogowhite.svg`,
    color: "#1021C7",
  },
  Haas: {
    url: `${F1_2026_BASE}/haas/2026haaslogowhite.svg`,
    color: "#1F1F1F",
  },
  "Haas F1 Team": {
    url: `${F1_2026_BASE}/haas/2026haaslogowhite.svg`,
    color: "#1F1F1F",
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
    url: "/teams/kicksauber.svg",
    color: "#52E252",
    className: "brightness-100 filter-none",
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
  Jaguar: { url: "/jaguar/jaguar-3.jpg", color: "#004225", className: "object-contain" },
  Arrows: { url: "/arrows/arrows-1.jpg", color: "#E56717", className: "object-contain" },
  Footwork: { url: "/arrows/arrows-2.jpg", color: "#E56717", className: "object-contain" },
  Benetton: { url: "/benetton/benetton-3.jpg", color: "#008751", className: "object-contain" },
  Prost: { url: "/prost/prost-1.jpg", color: "#002B7F", className: "object-contain" },
  Stewart: { url: "/stewart/stewart-1.jpg", color: "#FFFFFF", className: "object-contain" },
  Tyrrell: { url: "/tyrrell/tyrrell-2.jpg", color: "#002B7F", className: "object-contain" },
  Ligier: { url: "/ligier/ligier-1.jpg", color: "#0055A5", className: "object-contain" },
  Forti: { url: "/forti/forti.jpg", color: "#FFD700", className: "object-contain" },
  Pacific: { url: "/pacific/pacific.png", color: "#009384", className: "object-contain" },
  Simtek: { url: "/simtek/simtek.jpg", color: "#48286A", className: "object-contain" },
  Minardi: { url: "/minardi/minardi-3.jpg", color: "#1E1E1E", className: "object-contain bg-white rounded-sm" },
  Jordan: { url: "/jordan/jordan-3.jpg", color: "#FFDE00", className: "object-contain bg-white rounded-sm" },
  "Super Aguri": { url: "/teams/superaguri.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Honda: { url: "/teams/honda.svg", color: "#fc0217", className: "object-contain p-0.5" },
  Toyota: { url: "/teams/toyota.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Brawn: { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  "Brawn GP": { url: "/teams/brawn.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  HRT: { url: "/teams/hrt.svg", color: "#1E1E1E", className: "object-contain" },
  Lotus: { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  "Team Lotus": { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" },
  Caterham: { url: "/teams/caterham.svg", color: "#005030", className: "object-contain p-0.5" },
  Virgin: { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  Marussia: { url: "/teams/marussia.png", color: "#1E1E1E", className: "object-contain" },
  "Manor Marussia": { url: "/teams/manor.png", color: "#1E1E1E", className: "object-contain" },
  "Manor Racing": { url: "/teams/manor.png", color: "#1E1E1E", className: "object-contain" },
  "Sauber Clássica": { url: "/teams/sauber.svg", color: "#002B49", className: "object-contain" },
  "BMW Sauber": { url: "/teams/bmwsauber.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  BAR: { url: "/bar/bar-1.jpg", color: "#FFFFFF", className: "object-contain bg-white rounded-sm" },
  "BAR Honda": { url: "/bar/bar-1.jpg", color: "#FFFFFF", className: "object-contain bg-white rounded-sm" },
  Spyker: { url: "/teams/spyker.png", color: "#F58020", className: "object-contain p-0.5" },
  "Spyker MF1": { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  MF1: { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  Midland: { url: "/teams/spykermf1.svg", color: "#1E1E1E", className: "object-contain" },
  "Marussia Virgin": { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" },
  "Force India": { url: "/teams/forceindia.svg", color: "#F58020", className: "object-contain" },
  "Racing Point": { url: "/teams/racingpoint.svg", color: "#F596C8" },
  "Toro Rosso": { url: "/teams/tororosso.svg", color: "#001A30", className: "object-contain brightness-100 filter-none" },
  "Lotus F1": { url: "/teams/lotusf1.svg", color: "#1E1E1E", className: "object-contain" },
  Renault: { url: "/teams/renault.svg", color: "#FFF500", className: "brightness-100 filter-none" },

  // Classic Era Teams (1985-1989)
  Brabham: { url: "/classic/brabham.svg", color: "#002B49", className: "object-contain" },
  March: { url: "/classic/march.svg", color: "#009384", className: "object-contain" },
  Toleman: { url: "/classic/toleman.svg", color: "#002244", className: "object-contain" },
  Larrousse: { url: "/classic/larrousse.svg", color: "#1B4D3E", className: "object-contain" },
  Osella: { url: "/classic/osella.svg", color: "#181818", className: "object-contain" },
  Zakspeed: { url: "/classic/zakspeed.svg", color: "#C00000", className: "object-contain" },
  Lola: { url: "/classic/lola.svg", color: "#D40000", className: "object-contain" },
  Dallara: { url: "/classic/dallara.svg", color: "#A6192E", className: "object-contain" },
  AGS: { url: "/classic/ags.svg", color: "#2A52BE", className: "object-contain" },
  Coloni: { url: "/classic/coloni.svg", color: "#F7D117", className: "object-contain" },
  Rial: { url: "/classic/rial.svg", color: "#003399", className: "object-contain" },
  Onyx: { url: "/classic/onyx.svg", color: "#0038A8", className: "object-contain" },
  "Euro Brun": { url: "/classic/eurobrun.svg", color: "#FF5F00", className: "object-contain" },
  EuroBrun: { url: "/classic/eurobrun.svg", color: "#FF5F00", className: "object-contain" },
  Spirit: { url: "/classic/spirit.svg", color: "#C8102E", className: "object-contain" },
  RAM: { url: "/classic/ram.svg", color: "#007A3D", className: "object-contain" },
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
  manor: "Manor Marussia",
  "manor marussia": "Manor Marussia",
  "manor marussia f1 team": "Manor Marussia",
  "manor racing": "Manor Marussia",
  "manor racing mrt": "Manor Marussia",

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
  "haas f1 team": "Haas",
  "moneygram haas f1 team": "Haas",
  "uralkali haas f1 team": "Haas",

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

  // Sauber / Audi
  "kick sauber": "Kick Sauber",
  "stake f1 team kick sauber": "Kick Sauber",
  sauber: "Kick Sauber",
  "sauber f1 team": "Kick Sauber",
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
  larrousse: "Larrousse",
  osella: "Osella",
  zakspeed: "Zakspeed",
  lola: "Lola",
  dallara: "Dallara",
  ags: "AGS",
  coloni: "Coloni",
  rial: "Rial",
  onyx: "Onyx",
  // 2005-2009 Historical Teams
  bar: "BAR",
  "bar honda": "BAR",
  "british american racing": "BAR",
  jordan: "Jordan",
  "jordan grand prix": "Jordan",
  minardi: "Minardi",
  "scuderia minardi": "Minardi",
  mf1: "MF1",
  midland: "MF1",
  "midland f1": "MF1",
  "midland f1 racing": "MF1",
  "spyker mf1": "Spyker MF1",
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
}

export function teamLogo(name: string, season?: number): TeamLogoAsset | null {
  if (!name) return null
  const canonical = TEAM_ALIASES[name.trim().toLowerCase()] || name

  // Specific historical exceptions for 2010-2011 distinct identities
  if (season === 2010 && (canonical === "HRT" || name.toLowerCase().includes("hispania"))) {
    return { url: "/teams/hispania.svg", color: "#E10600", className: "object-contain p-0.5" }
  }
  if ((season === 2010 || season === 2011) && (canonical === "Lotus" || canonical === "Team Lotus")) {
    return { url: "/teams/teamlotus.svg", color: "#004225", className: "object-contain" }
  }
  if (season === 2011 && (canonical === "Virgin" || canonical === "Marussia Virgin" || name.toLowerCase().includes("virgin"))) {
    return { url: "/teams/marussia_virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" }
  }
  if (season === 2010 && (canonical === "Virgin" || name.toLowerCase().includes("virgin"))) {
    return { url: "/teams/virgin.svg", color: "#FFFFFF", className: "object-contain p-0.5" }
  }

  // From 2010 to modern era (2026), prioritize the pristine official vector / high-res logos
  if (!season || season >= 2010) {
    if (TEAM_LOGO_BY_NAME[canonical]) {
      return TEAM_LOGO_BY_NAME[canonical]
    }
    if (TEAM_LOGO_BY_NAME[name]) {
      return TEAM_LOGO_BY_NAME[name]
    }
  }

  // Pre-2005 vintage seasons (1950-2004)
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
  Ferrari: "https://upload.wikimedia.org/wikipedia/en/d/df/Scuderia_Ferrari_HP_logo_24.svg",
  Mercedes:
    "https://upload.wikimedia.org/wikipedia/commons/9/9e/Mercedes-Benz_Logo_2010.svg",
  Renault: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Logo.svg",
  Honda: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Honda_Racing_logo_%282022%29.svg",
  "Honda RBPT": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Honda_Racing_logo_%282022%29.svg",
  "Red Bull Ford": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ford_Motor_Company_Logo.svg",
  Audi: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
  Mecachrome: "https://upload.wikimedia.org/wikipedia/commons/d/da/Nouveau_logo_Mecachrome.png",
  BMW: "/engines/bmw.svg",
  Ford: "/engines/ford.svg",
  "Ford Cosworth": "/engines/ford.svg",
  Cosworth: "/engines/cosworth.svg",
  Porsche: "/engines/porsche.svg",
  Lamborghini: "/engines/lamborghini.svg",
  Toyota: "/engines/toyota.svg",
  Peugeot: "/engines/peugeot.svg",
  Judd: "/engines/judd.svg",
  Hart: "/engines/hart.svg",
  Zakspeed: "/engines/zakspeed.svg",
}

export function engineLogo(name: string | null): string | null {
  if (!name) return null
  return ENGINE_LOGOS[name] ?? null
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
  if (name === "Arrows") return "Arrows"
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
    if (season && season >= 2023) return "Moneygran Haas F1 Team"
    return "Moneygran Haas F1 Team"
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

export function formatCountry(country: string | null): string {
  if (!country) return ""
  return country
}

export const HISTORICAL_CONSTRUCTOR_ORDERS: Record<number, Record<string, number>> = {
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

