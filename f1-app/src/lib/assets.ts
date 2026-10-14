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

function f1Logo(name: string) {
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
    ...Object.fromEntries(Array.from({ length: 9 }, (_, i) => [2010 + i, { url: "/sauber/sauber-3.jpg", className: "bg-white rounded-sm" }])),
  },
  "BMW Sauber": {
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2006 + i, { url: "/sauber/sauber-2.jpg", className: "bg-white rounded-sm" }])),
  },
  "Virgin": {
    2010: { url: "/manor/manor-1.jpg", className: "bg-white rounded-sm" },
    2011: { url: "/manor/manor-2.jpg", className: "bg-white rounded-sm" },
  },
  "Marussia": {
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2012 + i, { url: "/manor/manor-3.jpg", className: "bg-white rounded-sm" }])),
  },
  "Manor Marussia": {
    2015: { url: "/manor/manor-4.jpg", className: "bg-white rounded-sm" },
    2016: { url: "/manor/manor-5.jpg", className: "bg-white rounded-sm" },
    2017: { url: "/manor/manor-5.jpg", className: "bg-white rounded-sm" },
  },
  "Lotus": {
    2010: { url: "/caterham/caterham-1.jpg", className: "bg-white rounded-sm" },
    2011: { url: "/caterham/caterham-2.jpg", className: "bg-white rounded-sm" },
  },
  "Caterham": {
    2012: { url: "/caterham/caterham-3.jpg", className: "bg-white rounded-sm" },
    2013: { url: "/caterham/caterham-3.jpg", className: "bg-white rounded-sm" },
    2014: { url: "/caterham/caterham-4.jpg", className: "bg-white rounded-sm" },
  },
  "HRT": {
    2010: { url: "/hrt/hrt-1.jpg", className: "bg-white rounded-sm" },
    2011: { url: "/hrt/hrt-2.jpg", className: "bg-white rounded-sm" },
    2012: { url: "/hrt/hrt-3.jpg", className: "bg-white rounded-sm" },
  },
  "Brawn": {
    2009: { url: "/brawn/brawn-1.jpg", className: "bg-white rounded-sm" },
  },
  "Toyota": {
    2002: { url: "/toyota/toyota-1.jpg", className: "bg-white rounded-sm" },
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [2003 + i, { url: "/toyota/toyota-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2007 + i, { url: "/toyota/toyota-3.jpg", className: "bg-white rounded-sm" }])),
  },
  "Honda": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1964 + i, { url: "/honda/honda-1.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1983 + i, { url: "/honda/honda-2.jpg", className: "bg-white rounded-sm" }])),
    ...Object.fromEntries(Array.from({ length: 2 }, (_, i) => [2006 + i, { url: "/honda/honda-3.jpg", className: "bg-white rounded-sm" }])),
    2008: { url: "/honda/honda-4.jpg", className: "bg-white rounded-sm" },
  },
  "Super Aguri": {
    2006: { url: "/aguri/aguri-1.jpg", className: "bg-white rounded-sm" },
    2007: { url: "/aguri/aguri-2.jpg", className: "bg-white rounded-sm" },
    2008: { url: "/aguri/aguri-3.jpg", className: "bg-white rounded-sm" },
  },
  "Spyker": {
    2007: { url: "/spyker/spyker-2.jpg", className: "bg-white rounded-sm" },
  },
  "Spyker MF1": {
    2006: { url: "/spyker/spyker-1.jpg", className: "bg-white rounded-sm" },
  },
  "MF1": {
    2006: { url: "/spyker/spyker-1.jpg", className: "bg-white rounded-sm" },
  },
  "BAR": {
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1999 + i, { url: "/bar/bar-1.jpg", className: "bg-white rounded-sm" }])),
  },
  "Jaguar": {
    2000: { url: "/jaguar/jaguar-1.jpg", className: "bg-white rounded-sm object-contain p-1" },
    2001: { url: "/jaguar/jaguar-2.jpg", className: "bg-white rounded-sm object-contain p-1" },
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2002 + i, { url: "/jaguar/jaguar-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Arrows": {
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1978 + i, { url: "/arrows/arrows-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1997 + i, { url: "/arrows/arrows-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Footwork": {
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1991 + i, { url: "/arrows/arrows-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Benetton": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1986 + i, { url: "/benetton/benetton-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1991 + i, { url: "/benetton/benetton-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [1994 + i, { url: "/benetton/benetton-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Prost": {
    1997: { url: "/prost/prost-1.jpg", className: "bg-white rounded-sm object-contain p-1" },
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [1998 + i, { url: "/prost/prost-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    2001: { url: "/prost/prost-3.jpg", className: "bg-white rounded-sm object-contain p-1" },
  },
  "Stewart": {
    1997: { url: "/stewart/stewart-1.jpg", className: "bg-white rounded-sm object-contain p-1" },
    1998: { url: "/stewart/stewart-2.jpg", className: "bg-white rounded-sm object-contain p-1" },
    1999: { url: "/stewart/stewart-3.jpg", className: "bg-white rounded-sm object-contain p-1" },
  },
  "Tyrrell": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1970 + i, { url: "/tyrrell/tyrrell-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 13 }, (_, i) => [1980 + i, { url: "/tyrrell/tyrrell-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [1993 + i, { url: "/tyrrell/tyrrell-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Ligier": {
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [1976 + i, { url: "/ligier/ligier-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1986 + i, { url: "/ligier/ligier-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1993 + i, { url: "/ligier/ligier-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Forti": {
    1995: { url: "/forti/forti.jpg", className: "bg-white rounded-sm object-contain p-1" },
    1996: { url: "/forti/forti.jpg", className: "bg-white rounded-sm object-contain p-1" },
  },
  "Pacific": {
    1994: { url: "/pacific/pacific.png", className: "bg-[#000000] rounded-sm object-contain p-1" },
    1995: { url: "/pacific/pacific.png", className: "bg-[#000000] rounded-sm object-contain p-1" },
  },
  "Simtek": {
    1994: { url: "/simtek/simtek.jpg", className: "bg-white rounded-sm object-contain p-1" },
    1995: { url: "/simtek/simtek.jpg", className: "bg-white rounded-sm object-contain p-1" },
  },
  "Minardi": {
    ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [1985 + i, { url: "/minardi/minardi-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 4 }, (_, i) => [1997 + i, { url: "/minardi/minardi-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [2001 + i, { url: "/minardi/minardi-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
  "Jordan": {
    ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [1991 + i, { url: "/jordan/jordan-1.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [1996 + i, { url: "/jordan/jordan-2.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
    ...Object.fromEntries(Array.from({ length: 3 }, (_, i) => [2003 + i, { url: "/jordan/jordan-3.jpg", className: "bg-white rounded-sm object-contain p-1" }])),
  },
} 

const TEAM_LOGO_BY_NAME: Record<string, TeamLogoAsset> = {
  // F1 2026 Official Vector WebP Assets
  Ferrari: {
    url: `${F1_2026_BASE}/ferrari/2026ferrarilogowhite.webp`,
    color: "#E8002D",
  },
  Mercedes: {
    url: `${F1_2026_BASE}/mercedes/2026mercedeslogowhite.webp`,
    color: "#1B1D1E",
  },
  "Red Bull Racing": {
    url: `${F1_2026_BASE}/redbullracing/2026redbullracinglogowhite.webp`,
    color: "#3671C6",
  },
  "Red Bull": {
    url: `${F1_2026_BASE}/redbullracing/2026redbullracinglogowhite.webp`,
    color: "#3671C6",
  },
  McLaren: {
    url: `${F1_2026_BASE}/mclaren/2026mclarenlogowhite.webp`,
    color: "#FF8000",
  },
  "Aston Martin": {
    url: `${F1_2026_BASE}/astonmartin/2026astonmartinlogowhite.webp`,
    color: "#229971",
  },
  Alpine: {
    url: `${F1_2026_BASE}/alpine/2026alpinelogowhite.webp`,
    color: "#0093CC",
  },
  Williams: {
    url: `${F1_2026_BASE}/williams/2026williamslogowhite.webp`,
    color: "#005AFF",
  },
  RB: {
    url: `${F1_2026_BASE}/racingbulls/2026racingbullslogowhite.webp`,
    color: "#1021C7",
  },
  "Racing Bulls": {
    url: `${F1_2026_BASE}/racingbulls/2026racingbullslogowhite.webp`,
    color: "#1021C7",
  },
  Haas: {
    url: `${F1_2026_BASE}/haas/2026haaslogowhite.webp`,
    color: "#1F1F1F",
  },
  "Haas F1 Team": {
    url: `${F1_2026_BASE}/haas/2026haaslogowhite.webp`,
    color: "#1F1F1F",
  },
  Audi: {
    url: `${F1_2026_BASE}/audi/2026audilogowhite.webp`,
    color: "#1A1A1A",
  },
  Cadillac: {
    url: `${F1_2026_BASE}/cadillac/2026cadillaclogowhite.webp`,
    color: "#111111",
  },
  "Kick Sauber": {
    url: "https://media.formula1.com/image/upload/c_fit,h_160/q_auto/v1740000001/common/f1/2024/kicksauber/2024kicksauberlogowhite.webp",
    color: "#52E252",
  },
  Sauber: {
    url: "https://media.formula1.com/image/upload/c_fit,h_160/q_auto/v1740000001/common/f1/2024/kicksauber/2024kicksauberlogowhite.webp",
    color: "#52E252",
  },
  "Alfa Romeo": {
    url: f1Logo("Alfa Romeo"),
    color: "#900000",
  },

  // F2 & F3 Teams
  "Campos Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/camposracing/2026camposracinglogowhite.webp",
    color: "#F58220",
  },
  "Invicta Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/invictaracing/2026invictaracinglogowhite.webp",
    color: "#FFD700",
  },
  "Rodin Motorsport": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/rodinmotorsport/2026rodinmotorsportlogowhite.webp",
    color: "#111111",
  },
  "MP Motorsport": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/mpmotorsport/2026mpmotorsportlogowhite.webp",
    color: "#F37320",
  },
  "DAMS Lucas Oil": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/damslucasoil/2026damslucasoillogowhite.webp",
    color: "#00A0E3",
  },
  "ART Grand Prix": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/artgrandprix/2026artgrandprixlogowhite.webp",
    color: "#111111",
  },
  TRIDENT: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/trident/2026tridentlogowhite.webp",
    color: "#0033A0",
  },
  Trident: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/trident/2026tridentlogowhite.webp",
    color: "#0033A0",
  },
  "Hitech Pulse-Eight": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/hitech/2026hitechlogowhite.webp",
    color: "#1E1E1E",
  },
  Hitech: {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/hitech/2026hitechlogowhite.webp",
    color: "#1E1E1E",
  },
  "Van Amersfoort Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/vanamersfoortracing/2026vanamersfoortracinglogowhite.webp",
    color: "#F58220",
  },
  "PREMA Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/premaracing/2026premaracinglogowhite.webp",
    color: "#E30613",
  },
  "Prema Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/premaracing/2026premaracinglogowhite.webp",
    color: "#E30613",
  },
  "AIX Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/aixracing/2026aixracinglogowhite.webp",
    color: "#C4D600",
  },
  "PHM AIX Racing": {
    url: "https://res.cloudinary.com/prod-f2f3/d_common:f2:fallback.webp/c_lfill,w_96/q_auto/v1770000000/common/f2/2026/aixracing/2026aixracinglogowhite.webp",
    color: "#C4D600",
  },
  "Jenzer Motorsport": {
    url: "https://upload.wikimedia.org/wikipedia/en/d/dd/Jenzer_Motorsport.png",
    color: "#0033A0",
  },

  // Historical / Classic Teams
  Jaguar: { url: "/jaguar/jaguar-3.jpg", className: "object-contain" },
  Arrows: { url: "/arrows/arrows-1.jpg", className: "object-contain" },
  Footwork: { url: "/arrows/arrows-2.jpg", className: "object-contain" },
  Benetton: { url: "/benetton/benetton-3.jpg", className: "object-contain" },
  Prost: { url: "/prost/prost-1.jpg", className: "object-contain" },
  Stewart: { url: "/stewart/stewart-1.jpg", className: "object-contain" },
  Tyrrell: { url: "/tyrrell/tyrrell-2.jpg", className: "object-contain" },
  Ligier: { url: "/ligier/ligier-1.jpg", className: "object-contain" },
  Forti: { url: "/forti/forti.jpg", className: "object-contain" },
  Pacific: { url: "/pacific/pacific.png", className: "object-contain" },
  Simtek: { url: "/simtek/simtek.jpg", className: "object-contain" },
  Minardi: { url: "/minardi/minardi-2.jpg", className: "object-contain" },
  Jordan: { url: "/jordan/jordan-2.jpg", className: "object-contain" },
  "Super Aguri": { url: "/aguri/aguri-2.jpg", className: "object-contain" },
  Honda: { url: "/honda/honda-3.jpg", className: "object-contain" },
  Toyota: { url: "/toyota/toyota-2.jpg", className: "object-contain" },
  Brawn: { url: "/brawn/brawn-1.jpg", className: "object-contain" },
  HRT: { url: "/hrt/hrt-3.jpg", className: "object-contain" },
  Lotus: { url: "/caterham/caterham-2.jpg", className: "object-contain" },
  Caterham: { url: "/caterham/caterham-3.jpg", className: "object-contain" },
  Virgin: { url: "/manor/manor-1.jpg", className: "object-contain" },
  Marussia: { url: "/manor/manor-3.jpg", className: "object-contain" },
  "Manor Marussia": { url: "/manor/manor-5.jpg", className: "object-contain" },
  "Sauber Clássica": { url: "/sauber/sauber-3.jpg", className: "object-contain" },
  "BMW Sauber": { url: "/sauber/sauber-2.jpg", className: "object-contain" },
  "Force India": { url: "/aston/aston-1.jpg", className: "object-contain" },
  "Racing Point": { url: "/aston/aston-2.jpg", className: "object-contain" },
  "Toro Rosso": { url: "/racingbulls/toro-rosso.jpg", className: "object-contain" },
  AlphaTauri: { url: "/racingbulls/alphatauri.jpg", className: "object-contain" },
  "Lotus F1": { url: "/alpine/lotus.jpg", className: "object-contain" },
}

const TEAM_ALIASES: Record<string, string> = {
  // Haas
  haas: "Haas",
  "haas f1 team": "Haas",
  "moneygram haas f1 team": "Haas",

  // Red Bull
  "red bull": "Red Bull Racing",
  "red bull racing": "Red Bull Racing",
  "oracle red bull racing": "Red Bull Racing",

  // Aston Martin
  "aston martin": "Aston Martin",
  "aston martin f1 team": "Aston Martin",
  "aston martin aramco": "Aston Martin",
  "aston martin aramco f1 team": "Aston Martin",
  "aston martin aramco cognac f1 team": "Aston Martin",

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
}

export function teamLogo(name: string, season?: number): TeamLogoAsset | null {
  if (!name) return null
  const canonical = TEAM_ALIASES[name.trim().toLowerCase()] || name

  // For current and future seasons (2025+), prioritize the official vector logo
  if (!season || season >= 2025) {
    if (TEAM_LOGO_BY_NAME[canonical]) {
      return TEAM_LOGO_BY_NAME[canonical]
    }
    if (TEAM_LOGO_BY_NAME[name]) {
      return TEAM_LOGO_BY_NAME[name]
    }
  }

  // Check historical season logo database
  if (season) {
    if (TEAM_SEASON_LOGOS[canonical]?.[season]) {
      return TEAM_SEASON_LOGOS[canonical][season]
    }
    if (TEAM_SEASON_LOGOS[name]?.[season]) {
      return TEAM_SEASON_LOGOS[name][season]
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
}

export function engineLogo(name: string | null): string | null {
  if (!name) return null
  return ENGINE_LOGOS[name] ?? null
}

export function displayTeamName(name: string | null, season?: number): string {
  if (!name) return ""
  
  if (name === "RB" || name === "Racing Bulls") {
    if (season === 2024) return "VISA CASH APP RB FORMULA ONE TEAM"
    if (season && season >= 2025) return "RACING BULLS F1 TEAM"
  }
  if (name === "AlphaTauri" || (name === "RB" && season && season >= 2020 && season <= 2023)) {
    return "SCUDERIA ALPHATAURI"
  }
  if (name === "Toro Rosso") {
    return "SCUDERIA TORO ROSSO"
  }
  
  if (name === "Alpine") {
    return "ALPINE F1 TEAM"
  }
  if (name === "Lotus F1") {
    return "LOTUS F1 TEAM"
  }
  if (name === "Renault") {
    if (season && season >= 1981 && season <= 2010) return "RENAULT F1 TEAM"
    if (season === 2011) return "LOTUS RENAULT GP"
    if (season && season >= 2016 && season <= 2020) return "RENAULT DP WORLD F1 TEAM"
    return "RENAULT F1 TEAM"
  }

  if (name === "Force India") return "Force India F1 Team"
  if (name === "Racing Point") return "Racing Point F1 Team"
  if (name === "Aston Martin") {
    if (season && season >= 2021) return "Aston Martin Aramco F1 Team"
    return "Aston Martin F1 Team"
  }
  if (name === "Sauber") {
    if (season && season >= 1993 && season <= 2005) return "Sauber Clássica"
    if (season && season >= 2010 && season <= 2018) return "Sauber"
    return "Sauber F1 Team"
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
    if (season && season >= 2003 && season <= 2006) return "Panasonic Toyota Racing"
    if (season && season >= 2007 && season <= 2009) return "Panasonic Toyota"
    return "Panasonic Toyota Racing"
  }
  if (name === "Honda") {
    if (season && season >= 1964 && season <= 1968) return "Honda F1 Team"
    if (season && season >= 1983 && season <= 1992) return "Honda F1"
    if (season && season >= 2006 && season <= 2008) return "Honda F1"
    return "Honda F1"
  }
  if (name === "Super Aguri") {
    return "Super Aguri F1 Team"
  }
  if (name === "Spyker") {
    return "Spyker F1 Team"
  }
  if (name === "Spyker MF1") return "Spyker MF1 Racing"
  if (name === "MF1") return "MF1 Racing"
  if (name === "BAR") {
    return "British American Racing"
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
  if (name === "Williams") {
    if (season && season >= 1978 && season <= 1993) return "WILLIAMS GRAND PRIX ENGINEERING"
    if (season && season >= 1994 && season <= 1999) return "WILLIAMS ROTHMANS"
    if (season && season >= 2000 && season <= 2013) return "WILLIAMS-BMW"
    if (season && season >= 2014 && season <= 2018) return "MARTINI WILLIAMS RACING"
    if (season && season >= 2019 && season <= 2021) return "ROKIT WILLIAMS"
    if (season && season >= 2022) return "ATLASSIAN WILLIAMS F1 TEAM"
    return "WILLIAMS GRAND PRIX ENGINEERING"
  }


  if (name === "Haas" || name === "Haas F1 Team") {
    if (season === 2019) return "RICH ENERGY HAAS F1 TEAM"
    if (season && season >= 2021 && season <= 2022) return "URALKALI HAAS F1 TEAM"
    if (season && season >= 2023) return "MONEYGRAM HAAS F1 TEAM"
    return "HAAS F1 TEAM"
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
