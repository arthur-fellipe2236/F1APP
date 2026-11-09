/**
 * Além da Pista — F1 Team Historical Logo Resolver Helper
 * OP-08.03: Helper tipado de resolução temporal de logos históricas (1950–2026).
 *
 * Módulo puro, determinístico e autônomo. Não realiza requisições de rede.
 * Preserva estritamente a autenticidade de cada época sem fallback anacrônico.
 */

export type RightsClass = 'Classe A' | 'Classe B' | 'Classe C' | 'Classe D' | 'DESCONHECIDA';
export type VerificationStatus = 'VERIFICADO' | 'PENDENTE_LICENCA' | 'EM_REVISAO' | 'QUARENTENA' | 'NONE';
export type AssetIntegrityStatus = 'VALID_SVG' | 'LEGACY_BITMAP' | 'CORRUPT_XML' | 'FILE_NOT_FOUND' | 'NONE';

export type ResolverStatus =
  | 'FOUND'
  | 'TEAM_NOT_FOUND'
  | 'BEFORE_ORIGIN'
  | 'AFTER_DECEASE'
  | 'HISTORICAL_GAP'
  | 'QUARANTINED_OR_INVALID';

export interface TeamLogoRecord {
  team_id: string;
  team_name: string;
  constructor_name: string;
  official_entrant_name: string;
  lineage_id: string;
  season_start: number;
  season_end: number;
  logo_id: string;
  asset_path: string;
  asset_format: 'SVG' | 'PNG' | string;
  source_url: string;
  source_description: string;
  historical_evidence: string;
  rights_class: RightsClass;
  rights_basis: string;
  verification_status: VerificationStatus;
  fallback_allowed: false;
  variant: string;
  priority: number;
}

export interface ResolveOptions {
  /** Preferência de variante ('primary_official', 'tobacco_free', 'monochrome', etc.) */
  variantPreference?: string;
  /** Permitir inclusão de candidatos em quarentena (padrão: false) */
  allowQuarantined?: boolean;
}

export interface ResolveTeamLogoResult {
  status: ResolverStatus;
  matched: boolean;
  teamId: string;
  season: number;
  reasonCode: string;
  diagnosticMessage: string;
  selectedEntry: TeamLogoRecord | null;
  assetPath: string | null;
  selectedVariant: string | null;
  historicalEvidence: string | null;
  integrityStatus: AssetIntegrityStatus;
  rightsStatus: {
    rightsClass: RightsClass;
    rightsBasis: string | null;
    verificationStatus: VerificationStatus;
    nominativeFairUseApplies: boolean;
  };
  rejectionReason: string | null;
}

/**
 * Registro Canônico Imutável de Identidades Visuais Históricas (1950–2026)
 * Auditado e estruturado nas operações OP-08.01 e OP-08.02.
 */
export const HISTORICAL_REGISTRY: readonly TeamLogoRecord[] = [
  {
    team_id: "FERRARI",
    team_name: "Ferrari",
    constructor_name: "Ferrari",
    official_entrant_name: "Scuderia Ferrari",
    lineage_id: "LIN-MARANELLO",
    season_start: 1950,
    season_end: 1979,
    logo_id: "FER-1950",
    asset_path: "/teams/ferrari_1950.svg",
    asset_format: "SVG",
    source_url: "https://www.ferrari.com/en-EN/history/heritage",
    source_description: "Acervo Hist\u00f3rico / Ferrari Heritage & FIA Official",
    historical_evidence: "Escudo cl\u00e1ssico pintado \u00e0 m\u00e3o nas carenagens dos modelos 125 F1, 500 F2, 156 e 312T.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use (Uso enciclop\u00e9dico sem conota\u00e7\u00e3o comercial).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "FERRARI",
    team_name: "Ferrari",
    constructor_name: "Ferrari",
    official_entrant_name: "Scuderia Ferrari / Scuderia Ferrari Marlboro",
    lineage_id: "LIN-MARANELLO",
    season_start: 1980,
    season_end: 2019,
    logo_id: "FER-1997",
    asset_path: "/teams/ferrari_classic.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Scuderia_Ferrari_Logo.svg",
    source_description: "FIA Press Archives / Scuderia Ferrari Marlboro & Vodafone era",
    historical_evidence: "Uniformes oficiais da era Schumacher/R\u00e4ikk\u00f6nen e bico dos carros F2002, F2004 e F2007.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 (Uso estritamente jornal\u00edstico/hist\u00f3rico).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "FERRARI",
    team_name: "Ferrari",
    constructor_name: "Ferrari",
    official_entrant_name: "Scuderia Ferrari / Scuderia Ferrari HP",
    lineage_id: "LIN-MARANELLO",
    season_start: 2020,
    season_end: 2026,
    logo_id: "FER-2020",
    asset_path: "/teams/ferrari_modern.svg",
    asset_format: "SVG",
    source_url: "https://www.ferrari.com/en-EN/formula1",
    source_description: "Formula 1 Press / Identidade institucional contempor\u00e2nea de Maranello",
    historical_evidence: "Pintura oficial nos carros SF-23, SF-24 e SF-25.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MCLAREN",
    team_name: "McLaren",
    constructor_name: "McLaren",
    official_entrant_name: "Bruce McLaren Motor Racing",
    lineage_id: "LIN-WOKING",
    season_start: 1966,
    season_end: 1980,
    logo_id: "MCL-1967",
    asset_path: "/teams/mclaren_kiwi.svg",
    asset_format: "SVG",
    source_url: "https://www.mclaren.com/racing/heritage/speedy-kiwi/",
    source_description: "Bruce McLaren Trust / Speedy Kiwi original desenhado por Michael Turner",
    historical_evidence: "Decalque do Speedy Kiwi aplicado nos carros M7A e M23 de Fittipaldi e Hunt.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 (Uso nominativo esportivo).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MCLAREN",
    team_name: "McLaren",
    constructor_name: "McLaren",
    official_entrant_name: "Marlboro McLaren International",
    lineage_id: "LIN-WOKING",
    season_start: 1981,
    season_end: 1996,
    logo_id: "MCL-1981",
    asset_path: "/teams/mclaren_classic.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:McLaren_Logo.svg",
    source_description: "FIA Official Yearbooks / Era Project Four & Ron Dennis",
    historical_evidence: "Estampado nos carros MP4/2 de Lauda e Prost e nos MP4/4 e MP4/5 de Ayrton Senna.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Doutrina do Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MCLAREN",
    team_name: "McLaren",
    constructor_name: "McLaren",
    official_entrant_name: "West McLaren Mercedes / Vodafone McLaren Mercedes",
    lineage_id: "LIN-WOKING",
    season_start: 1997,
    season_end: 2016,
    logo_id: "MCL-1997",
    asset_path: "/teams/mclaren_speedmark.svg",
    asset_format: "SVG",
    source_url: "https://www.mclaren.com/racing/heritage/",
    source_description: "McLaren Corporate Manual / Cria\u00e7\u00e3o do Speedmark aerodin\u00e2mico",
    historical_evidence: "Bicampeonato de H\u00e4kkinen (1998-1999) e t\u00edtulo de Hamilton em 2008.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 (Uso estritamente editorial).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MCLAREN",
    team_name: "McLaren",
    constructor_name: "McLaren",
    official_entrant_name: "McLaren Formula 1 Team",
    lineage_id: "LIN-WOKING",
    season_start: 2017,
    season_end: 2026,
    logo_id: "MCL-2017",
    asset_path: "/teams/mclaren_papaya.svg",
    asset_format: "SVG",
    source_url: "https://www.mclaren.com",
    source_description: "McLaren Racing Press / Era moderna Laranja Papaya",
    historical_evidence: "Monopostos MCL35M, MCL36 e MCL38 de Norris e Piastri.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "WILLIAMS",
    team_name: "Williams",
    constructor_name: "Williams",
    official_entrant_name: "Williams Grand Prix Engineering",
    lineage_id: "LIN-GROVE",
    season_start: 1977,
    season_end: 1993,
    logo_id: "WIL-1977",
    asset_path: "/teams/williams_classic.svg",
    asset_format: "SVG",
    source_url: "https://www.williamsf1.com/heritage",
    source_description: "Williams Heritage Collection / Emblema circular original de Frank Williams & Patrick Head",
    historical_evidence: "Carros FW07 de Jones (1980), FW08 de Rosberg (1982) e FW11 de Mansell e Piquet.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "WILLIAMS",
    team_name: "Williams",
    constructor_name: "Williams",
    official_entrant_name: "Rothmans Williams Renault",
    lineage_id: "LIN-GROVE",
    season_start: 1994,
    season_end: 1999,
    logo_id: "WIL-1994",
    asset_path: "/teams/williams_classic.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Williams_F1_logo.svg",
    source_description: "Williams Heritage / Era campe\u00e3 dos anos 1990",
    historical_evidence: "Carros FW16, FW18 e FW19 campe\u00f5es mundiais com Hill e Villeneuve.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "WILLIAMS",
    team_name: "Williams",
    constructor_name: "Williams",
    official_entrant_name: "Williams Racing",
    lineage_id: "LIN-GROVE",
    season_start: 2000,
    season_end: 2026,
    logo_id: "WIL-2020",
    asset_path: "/teams/williams_classic.svg",
    asset_format: "SVG",
    source_url: "https://www.williamsf1.com",
    source_description: "Williams Racing Official Press / Monograma contempor\u00e2neo W",
    historical_evidence: "Monopostos FW22 a FW46.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality (Monograma tipogr\u00e1fico simples) e Art. 132, IV da LPI.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "TYRRELL",
    team_name: "Tyrrell",
    constructor_name: "Tyrrell",
    official_entrant_name: "Tyrrell Racing Organisation / Elf Team Tyrrell",
    lineage_id: "LIN-BRACKLEY",
    season_start: 1970,
    season_end: 1998,
    logo_id: "TYR-1971",
    asset_path: "/teams/tyrrell.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Tyrrell_Racing_logo.svg",
    source_description: "Tyrrell Racing Trust & Autocourse",
    historical_evidence: "Bicos do Tyrrell 003 e do P34 de 6 rodas de Stewart e Scheckter.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality (Geometria her\u00e1ldica e tipografia nominativa).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BAR",
    team_name: "BAR",
    constructor_name: "BAR",
    official_entrant_name: "British American Racing",
    lineage_id: "LIN-BRACKLEY",
    season_start: 1999,
    season_end: 2005,
    logo_id: "BAR-1999",
    asset_path: "/teams/bar.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:British_American_Racing_logo.svg",
    source_description: "FIA Yearbooks / British American Tobacco Archives",
    historical_evidence: "Estampado nos carros BAR 01 ao BAR 006 vice-campe\u00e3o de construtores em 2004.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 (Uso estritamente hist\u00f3rico).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "HONDA_WORKS",
    team_name: "Honda",
    constructor_name: "Honda",
    official_entrant_name: "Honda Racing F1 Team",
    lineage_id: "LIN-BRACKLEY",
    season_start: 2006,
    season_end: 2008,
    logo_id: "HON-2006",
    asset_path: "/teams/honda.svg",
    asset_format: "SVG",
    source_url: "https://global.honda/heritage/",
    source_description: "Honda Motor Co. Heritage",
    historical_evidence: "Monoposto RA106 vencedor do GP da Hungria 2006 com Jenson Button.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BRAWN",
    team_name: "Brawn",
    constructor_name: "Brawn",
    official_entrant_name: "Brawn GP Formula One Team",
    lineage_id: "LIN-BRACKLEY",
    season_start: 2009,
    season_end: 2009,
    logo_id: "BRAWN-2009",
    asset_path: "/teams/brawn.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Brawn_GP_logo.svg",
    source_description: "FIA Press Archives / Brawn GP BGP 001 Heritage",
    historical_evidence: "Pintura do BGP 001 campe\u00e3o mundial com Jenson Button e Rubens Barrichello.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality (Tipografia simples e tra\u00e7o geom\u00e9trico minimalista).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MERCEDES_MODERN",
    team_name: "Mercedes",
    constructor_name: "Mercedes",
    official_entrant_name: "Mercedes-AMG Petronas F1 Team",
    lineage_id: "LIN-BRACKLEY",
    season_start: 2010,
    season_end: 2026,
    logo_id: "MER-2010",
    asset_path: "/teams/mercedes_amg_petronas.svg",
    asset_format: "SVG",
    source_url: "https://www.mercedesamgf1.com",
    source_description: "Mercedes-Benz AG Media / Identidade moderna de Brackley",
    historical_evidence: "Monopostos W01 a W15 octacampe\u00f5es de construtores.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "TOLEMAN",
    team_name: "Toleman",
    constructor_name: "Toleman",
    official_entrant_name: "Toleman Group Motorsport",
    lineage_id: "LIN-ENSTONE",
    season_start: 1981,
    season_end: 1985,
    logo_id: "TOL-1981",
    asset_path: "/classic/toleman.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Toleman_logo.svg",
    source_description: "Motorsport Images / Toleman Group Archives",
    historical_evidence: "Carro\u00e7aria do Toleman TG184 de Ayrton Senna em M\u00f4naco 1984.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Marca comercial extinta nos anos 1980.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BENETTON",
    team_name: "Benetton",
    constructor_name: "Benetton",
    official_entrant_name: "Benetton Formula / United Colors of Benetton",
    lineage_id: "LIN-ENSTONE",
    season_start: 1986,
    season_end: 2001,
    logo_id: "BEN-1986",
    asset_path: "/teams/benetton.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Benetton_Formula_logo.svg",
    source_description: "Benetton Group Heritage",
    historical_evidence: "B194 e B195 campe\u00f5es mundiais com Michael Schumacher.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 (Uso nominativo editorial).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RENAULT_WORKS2",
    team_name: "Renault",
    constructor_name: "Renault",
    official_entrant_name: "Renault F1 Team",
    lineage_id: "LIN-ENSTONE",
    season_start: 2002,
    season_end: 2011,
    logo_id: "REN-2002",
    asset_path: "/teams/renault.svg",
    asset_format: "SVG",
    source_url: "https://www.renaultgroup.com/en/our-company/heritage/",
    source_description: "Renault Sport Heritage",
    historical_evidence: "Carros R25 e R26 campe\u00f5es com Alonso em 2005 e 2006.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "LOTUS_ENSTONE",
    team_name: "Lotus",
    constructor_name: "Lotus",
    official_entrant_name: "Lotus F1 Team",
    lineage_id: "LIN-ENSTONE",
    season_start: 2012,
    season_end: 2015,
    logo_id: "LOT-2012",
    asset_path: "/teams/lotusf1.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Lotus_F1_Team_logo.svg",
    source_description: "Genii Capital Enstone Archives",
    historical_evidence: "Monopostos Lotus E20 e E21 com vitórias de Kimi Räikkönen.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RENAULT_WORKS3",
    team_name: "Renault",
    constructor_name: "Renault",
    official_entrant_name: "Renault Sport Formula One Team",
    lineage_id: "LIN-ENSTONE",
    season_start: 2016,
    season_end: 2020,
    logo_id: "REN-2002",
    asset_path: "/teams/renault.svg",
    asset_format: "SVG",
    source_url: "https://www.renaultgroup.com",
    source_description: "Renault Sport F1",
    historical_evidence: "RS16 ao RS20 de Ricciardo e H\u00fclkenberg.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ALPINE",
    team_name: "Alpine",
    constructor_name: "Alpine",
    official_entrant_name: "Alpine F1 Team",
    lineage_id: "LIN-ENSTONE",
    season_start: 2021,
    season_end: 2026,
    logo_id: "ALP-2021",
    asset_path: "/teams/alpine_2021.svg",
    asset_format: "SVG",
    source_url: "https://www.alpinecars.com",
    source_description: "Alpine Cars Press",
    historical_evidence: "A521 vencedor na Hungria 2021 com Ocon, A522, A523, A524.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "JORDAN",
    team_name: "Jordan",
    constructor_name: "Jordan",
    official_entrant_name: "Jordan Grand Prix",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 1991,
    season_end: 2005,
    logo_id: "JOR-1991",
    asset_path: "/teams/jordan.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Jordan_Grand_Prix_logo.svg",
    source_description: "Silverstone Museum / Jordan GP Heritage",
    historical_evidence: "Jordan 191 (estreia de Schumacher), 198 (dobradinha em Spa 1998) e 199.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MIDLAND",
    team_name: "MF1",
    constructor_name: "MF1",
    official_entrant_name: "Midland F1 Racing",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 2006,
    season_end: 2006,
    logo_id: "MID-2006",
    asset_path: "/teams/mf1_racing.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:MF1_Racing_logo.svg",
    source_description: "FIA Archives",
    historical_evidence: "Monoposto M16 com motores Toyota pilotado por Monteiro e Albers.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SPYKER",
    team_name: "Spyker",
    constructor_name: "Spyker",
    official_entrant_name: "Spyker F1 Team",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 2007,
    season_end: 2007,
    logo_id: "SPY-2007",
    asset_path: "/teams/spyker_f1.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Spyker_F1_logo.svg",
    source_description: "Spyker Cars N.V.",
    historical_evidence: "Spyker F8-VII no GP da Europa de 2007 liderado por Markus Winkelhock.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "FORCE_INDIA",
    team_name: "Force India",
    constructor_name: "Force India",
    official_entrant_name: "Force India Formula One Team",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 2008,
    season_end: 2018,
    logo_id: "FOR-2008",
    asset_path: "/teams/forceindia.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Force_India_logo.svg",
    source_description: "Force India Press Archives",
    historical_evidence: "VJM02 da pole de Fisichella em Spa 2009 e p\u00f3dios de Sergio P\u00e9rez.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RACING_POINT",
    team_name: "Racing Point",
    constructor_name: "Racing Point",
    official_entrant_name: "Racing Point F1 Team",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 2018,
    season_end: 2020,
    logo_id: "RP-2019",
    asset_path: "/teams/racingpoint.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Racing_Point_logo.svg",
    source_description: "Formula 1 Press",
    historical_evidence: "RP20 vencedor do GP de Sakhir 2020 com Sergio P\u00e9rez.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ASTON_MARTIN_MODERN",
    team_name: "Aston Martin",
    constructor_name: "Aston Martin",
    official_entrant_name: "Aston Martin Aramco F1 Team",
    lineage_id: "LIN-SILVERSTONE",
    season_start: 2021,
    season_end: 2026,
    logo_id: "AST-2021",
    asset_path: "/teams/astonmartin.svg",
    asset_format: "SVG",
    source_url: "https://www.astonmartinf1.com",
    source_description: "Aston Martin Lagonda Press",
    historical_evidence: "Monopostos AMR21 a AMR24 de Vettel e Alonso.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MINARDI",
    team_name: "Minardi",
    constructor_name: "Minardi",
    official_entrant_name: "Minardi Team",
    lineage_id: "LIN-FAENZA",
    season_start: 1985,
    season_end: 2005,
    logo_id: "MIN-1985",
    asset_path: "/teams/minardi.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Minardi_logo.svg",
    source_description: "Minardi Heritage",
    historical_evidence: "M185 a PS05 de Martini, Fisichella e Alonso.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "TORO_ROSSO",
    team_name: "Toro Rosso",
    constructor_name: "Toro Rosso",
    official_entrant_name: "Scuderia Toro Rosso",
    lineage_id: "LIN-FAENZA",
    season_start: 2006,
    season_end: 2019,
    logo_id: "STR-2006",
    asset_path: "/teams/tororosso.svg",
    asset_format: "SVG",
    source_url: "https://www.redbull.com/int-en/toro-rosso-heritage",
    source_description: "Red Bull Media House",
    historical_evidence: "STR3 da vit\u00f3ria de Sebastian Vettel em Monza 2008.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ALPHATAURI",
    team_name: "AlphaTauri",
    constructor_name: "AlphaTauri",
    official_entrant_name: "Scuderia AlphaTauri",
    lineage_id: "LIN-FAENZA",
    season_start: 2020,
    season_end: 2023,
    logo_id: "AT-2020",
    asset_path: "/teams/alphatauri.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:AlphaTauri_logo.svg",
    source_description: "AlphaTauri Fashion & F1 Press",
    historical_evidence: "AT01 da vit\u00f3ria de Pierre Gasly em Monza 2020.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RB_RACING_BULLS",
    team_name: "RB",
    constructor_name: "RB",
    official_entrant_name: "Visa Cash App RB F1 Team",
    lineage_id: "LIN-FAENZA",
    season_start: 2024,
    season_end: 2026,
    logo_id: "RB-2024",
    asset_path: "/teams/racing_bulls.svg",
    asset_format: "SVG",
    source_url: "https://www.visacashapprb.com",
    source_description: "Formula 1 Press",
    historical_evidence: "Monopostos VCARB 01 e VCARB 02 de Ricciardo e Tsunoda.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SAUBER",
    team_name: "Sauber",
    constructor_name: "Sauber",
    official_entrant_name: "Team Sauber Formula 1",
    lineage_id: "LIN-HINWIL",
    season_start: 1993,
    season_end: 2005,
    logo_id: "SAU-1993",
    asset_path: "/teams/sauber_classic.svg",
    asset_format: "SVG",
    source_url: "https://www.sauber-group.com/motorsport/heritage",
    source_description: "Sauber Motorsport AG",
    historical_evidence: "C12 de estreia em 1993 e C20 do 4\u00ba lugar de construtores em 2001.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BMW_SAUBER",
    team_name: "BMW Sauber",
    constructor_name: "BMW Sauber",
    official_entrant_name: "BMW Sauber F1 Team",
    lineage_id: "LIN-HINWIL",
    season_start: 2006,
    season_end: 2009,
    logo_id: "BMWS-2006",
    asset_path: "/teams/bmw_sauber.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:BMW_Sauber_F1_Team_Logo.svg",
    source_description: "BMW Group Archives",
    historical_evidence: "Monopostos F1.06 a F1.08 da vit\u00f3ria de Kubica em Montreal 2008.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SAUBER_INDEP",
    team_name: "Sauber",
    constructor_name: "Sauber",
    official_entrant_name: "Sauber F1 Team",
    lineage_id: "LIN-HINWIL",
    season_start: 2010,
    season_end: 2018,
    logo_id: "SAU-1993",
    asset_path: "/teams/sauber_classic.svg",
    asset_format: "SVG",
    source_url: "https://www.sauber-group.com",
    source_description: "Sauber Motorsport AG",
    historical_evidence: "C29 a C37 de Kobayashi e P\u00e9rez (4 p\u00f3dios em 2012).",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ALFA_ROMEO_SAUBER",
    team_name: "Alfa Romeo",
    constructor_name: "Alfa Romeo",
    official_entrant_name: "Alfa Romeo Racing / Alfa Romeo F1 Team",
    lineage_id: "LIN-HINWIL",
    season_start: 2019,
    season_end: 2023,
    logo_id: "ALF-2019",
    asset_path: "/teams/alfaromeo.svg",
    asset_format: "SVG",
    source_url: "https://www.alfaromeo.com/heritage",
    source_description: "Stellantis Heritage",
    historical_evidence: "Monopostos C38 a C43 de Kimi R\u00e4ikk\u00f6nen e Valtteri Bottas.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "KICK_SAUBER",
    team_name: "Kick Sauber",
    constructor_name: "Kick Sauber",
    official_entrant_name: "Stake F1 Team Kick Sauber",
    lineage_id: "LIN-HINWIL",
    season_start: 2024,
    season_end: 2025,
    logo_id: "KICK-2024",
    asset_path: "/teams/kicksauber.svg",
    asset_format: "SVG",
    source_url: "https://www.sauber-group.com",
    source_description: "Sauber Group",
    historical_evidence: "Monoposto C44 com pintura verde neon fluorescente em 2024.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality (Tipografia angular contemporânea).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "AUDI_WORKS",
    team_name: "Audi",
    constructor_name: "Audi",
    official_entrant_name: "Audi Revolut F1 Team",
    lineage_id: "LIN-HINWIL",
    season_start: 2026,
    season_end: 2026,
    logo_id: "AUDI-2026",
    asset_path: "/teams/audi_2026.svg",
    asset_format: "SVG",
    source_url: "https://www.audi-mediacenter.com",
    source_description: "Audi AG Media Center",
    historical_evidence: "Pintura conceito oficial e apresenta\u00e7\u00e3o do programa de f\u00e1brica 2026.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "STEWART",
    team_name: "Stewart",
    constructor_name: "Stewart",
    official_entrant_name: "Stewart Grand Prix",
    lineage_id: "LIN-MILTON-KEYNES",
    season_start: 1997,
    season_end: 1997,
    logo_id: "STW-1997",
    asset_path: "/teams/stewart_1997.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Stewart_Grand_Prix_logo.svg",
    source_description: "Stewart Racing Archives (1997)",
    historical_evidence: "Stewart SF01 de Jackie Stewart e Paul Stewart com Rubens Barrichello (pódio em Mônaco 1997); emblema inaugural limpo.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "STEWART",
    team_name: "Stewart",
    constructor_name: "Stewart",
    official_entrant_name: "Stewart Grand Prix / MCI WorldCom",
    lineage_id: "LIN-MILTON-KEYNES",
    season_start: 1998,
    season_end: 1999,
    logo_id: "STW-1998",
    asset_path: "/teams/stewart_1998.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Stewart_Grand_Prix_logo.svg",
    source_description: "Stewart Racing Archives (1998–1999)",
    historical_evidence: "SF02 e SF3 com patrocínio MCI WorldCom; vitória histórica de Johnny Herbert no GP da Europa de 1999.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "JAGUAR",
    team_name: "Jaguar",
    constructor_name: "Jaguar",
    official_entrant_name: "Jaguar Racing F1 Team",
    lineage_id: "LIN-MILTON-KEYNES",
    season_start: 2000,
    season_end: 2004,
    logo_id: "JAG-2000",
    asset_path: "/teams/jaguar.svg",
    asset_format: "SVG",
    source_url: "https://www.jaguar.com/about-jaguar/heritage/",
    source_description: "Jaguar Land Rover Heritage",
    historical_evidence: "R1 a R5 pilotados por Irvine, Webber e De la Rosa.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RED_BULL_RACING",
    team_name: "Red Bull",
    constructor_name: "Red Bull",
    official_entrant_name: "Red Bull Racing",
    lineage_id: "LIN-MILTON-KEYNES",
    season_start: 2005,
    season_end: 2021,
    logo_id: "RBR-2005",
    asset_path: "/teams/red_bull_racing_classic.svg",
    asset_format: "SVG",
    source_url: "https://www.redbullracing.com",
    source_description: "Red Bull GmbH Media Archives (Era pré-Oracle)",
    historical_evidence: "Monopostos RB1 a RB16B; títulos mundiais de Sebastian Vettel (2010–2013) e Max Verstappen (2021) sem patrocínio-título Oracle.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RED_BULL_RACING",
    team_name: "Red Bull",
    constructor_name: "Red Bull",
    official_entrant_name: "Oracle Red Bull Racing",
    lineage_id: "LIN-MILTON-KEYNES",
    season_start: 2022,
    season_end: 2026,
    logo_id: "RBR-2022",
    asset_path: "/teams/oracle_red_bull_racing.svg",
    asset_format: "SVG",
    source_url: "https://www.redbullracing.com",
    source_description: "Red Bull GmbH Media / Oracle Partnership",
    historical_evidence: "Monopostos RB18, RB19 e RB20 com patrocínio-título Oracle anunciado em 2022.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "LOTUS_CLASSIC",
    team_name: "Team Lotus",
    constructor_name: "Lotus",
    official_entrant_name: "Team Lotus",
    lineage_id: "INDEP-LOTUS",
    season_start: 1958,
    season_end: 1994,
    logo_id: "LOT-1958",
    asset_path: "/teams/teamlotus.svg",
    asset_format: "SVG",
    source_url: "https://classicteamlotus.co.uk",
    source_description: "Classic Team Lotus / Clive Chapman Archives",
    historical_evidence: "Lotus 25, 49, 72 e 79 campeões com Clark, Hill, Rindt, Fittipaldi e Andretti.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BRABHAM",
    team_name: "Brabham",
    constructor_name: "Brabham",
    official_entrant_name: "Motor Racing Developments / Brabham",
    lineage_id: "INDEP-BRABHAM",
    season_start: 1962,
    season_end: 1992,
    logo_id: "BRAB-1962",
    asset_path: "/classic/brabham.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Brabham_logo.svg",
    source_description: "Brabham Automotive Archives",
    historical_evidence: "BT19 de Jack Brabham (1966) e BT49/BT52 de Nelson Piquet (1981 e 1983).",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Vetor hist\u00f3rico de dom\u00ednio p\u00fablico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "COOPER",
    team_name: "Cooper",
    constructor_name: "Cooper",
    official_entrant_name: "Cooper Car Company",
    lineage_id: "INDEP-COOPER",
    season_start: 1950,
    season_end: 1969,
    logo_id: "COO-1950",
    asset_path: "/classic/cooper.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Cooper_Car_Company_logo.svg",
    source_description: "National Motor Museum Beaulieu",
    historical_evidence: "Cooper T51 e T53 com motor traseiro de Jack Brabham.",
    rights_class: "Classe A",
    rights_basis: "Dom\u00ednio p\u00fablico pela data de cria\u00e7\u00e3o pr\u00e9-1960 sem renova\u00e7\u00e3o marc\u00e1ria.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "BRM",
    team_name: "BRM",
    constructor_name: "BRM",
    official_entrant_name: "British Racing Motors",
    lineage_id: "INDEP-BRM",
    season_start: 1951,
    season_end: 1977,
    logo_id: "BRM-1951",
    asset_path: "/classic/brm.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:British_Racing_Motors_logo.svg",
    source_description: "Owen Organisation Archives",
    historical_evidence: "BRM P57 de Graham Hill (1962).",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Logotipo nominativo cl\u00e1ssico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MATRA",
    team_name: "Matra",
    constructor_name: "Matra",
    official_entrant_name: "Matra Sports",
    lineage_id: "INDEP-MATRA",
    season_start: 1967,
    season_end: 1972,
    logo_id: "MAT-1967",
    asset_path: "/classic/matra.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Matra_logo.svg",
    source_description: "Mus\u00e9e Matra Romorantin",
    historical_evidence: "Matra MS80 campe\u00e3o mundial de 1969 com Jackie Stewart.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "LIGIER",
    team_name: "Ligier",
    constructor_name: "Ligier",
    official_entrant_name: "Equipe Ligier",
    lineage_id: "INDEP-LIGIER",
    season_start: 1976,
    season_end: 1996,
    logo_id: "LIG-1976",
    asset_path: "/classic/ligier_gitanes.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Equipe_Ligier_logo.svg",
    source_description: "Guy Ligier Archives",
    historical_evidence: "Ligier JS11 e JS43 vencedor em M\u00f4naco 1996.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "PROST",
    team_name: "Prost",
    constructor_name: "Prost",
    official_entrant_name: "Prost Grand Prix",
    lineage_id: "INDEP-LIGIER",
    season_start: 1997,
    season_end: 2001,
    logo_id: "PRO-1997",
    asset_path: "/teams/prost.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Prost_Grand_Prix_logo.svg",
    source_description: "Prost Grand Prix Archives",
    historical_evidence: "Monopostos AP01 a AP04 de Panis e Trulli.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ARROWS_FOOTWORK",
    team_name: "Arrows",
    constructor_name: "Arrows",
    official_entrant_name: "Arrows Grand Prix International",
    lineage_id: "INDEP-ARROWS",
    season_start: 1978,
    season_end: 1990,
    logo_id: "ARR-1978",
    asset_path: "/teams/arrows_classic.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Arrows_Grand_Prix_logo.svg",
    source_description: "Arrows F1 Trust (Fase Arrows Clássica I)",
    historical_evidence: "Monopostos FA1 a A11B; pódios de Patrese, Mass, Boutsen e Warwick antes da aquisição pela Footwork.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ARROWS_FOOTWORK",
    team_name: "Arrows",
    constructor_name: "Arrows",
    official_entrant_name: "Arrows Grand Prix International",
    lineage_id: "INDEP-ARROWS",
    season_start: 1997,
    season_end: 2002,
    logo_id: "ARR-1997",
    asset_path: "/teams/arrows_classic.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Arrows_Grand_Prix_logo.svg",
    source_description: "Arrows F1 Trust (Fase Arrows Clássica II pós-Footwork)",
    historical_evidence: "Arrows A18 a A23; retorno da denominação Arrows após a era Footwork (quase vitória de Damon Hill na Hungria 1997).",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MARCH",
    team_name: "March",
    constructor_name: "March",
    official_entrant_name: "March Engineering",
    lineage_id: "INDEP-MARCH",
    season_start: 1970,
    season_end: 1992,
    logo_id: "MAR-1970",
    asset_path: "/classic/march.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:March_Engineering_logo.svg",
    source_description: "March Heritage",
    historical_evidence: "March 701 de Jackie Stewart e March 711 de Ronnie Peterson.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SURTEES",
    team_name: "Surtees",
    constructor_name: "Surtees",
    official_entrant_name: "Surtees Racing Organisation",
    lineage_id: "INDEP-SURTEES",
    season_start: 1970,
    season_end: 1978,
    logo_id: "SUR-1970",
    asset_path: "/classic/surtees.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Surtees_logo.svg",
    source_description: "John Surtees Foundation",
    historical_evidence: "Monopostos TS7 a TS19 pilotados por John Surtees e Carlos Pace.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Logotipo hist\u00f3rico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "HESKETH",
    team_name: "Hesketh",
    constructor_name: "Hesketh",
    official_entrant_name: "Hesketh Racing",
    lineage_id: "INDEP-HESKETH",
    season_start: 1974,
    season_end: 1978,
    logo_id: "HES-1974",
    asset_path: "/classic/hesketh.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Hesketh_Racing_logo.svg",
    source_description: "Lord Hesketh Estate",
    historical_evidence: "Hesketh 308 de James Hunt na vit\u00f3ria de Zandvoort 1975.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SHADOW",
    team_name: "Shadow",
    constructor_name: "Shadow",
    official_entrant_name: "Shadow Racing Cars",
    lineage_id: "INDEP-SHADOW",
    season_start: 1973,
    season_end: 1980,
    logo_id: "SHA-1973",
    asset_path: "/classic/shadow.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Shadow_Racing_Cars_logo.svg",
    source_description: "Don Nichols Estate",
    historical_evidence: "Shadow DN8 da vit\u00f3ria de Alan Jones na \u00c1ustria 1977.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "FITTIPALDI",
    team_name: "Fittipaldi",
    constructor_name: "Fittipaldi",
    official_entrant_name: "Copersucar-Fittipaldi / Fittipaldi Automotive",
    lineage_id: "INDEP-FITTIPALDI",
    season_start: 1975,
    season_end: 1982,
    logo_id: "FIT-1975",
    asset_path: "/classic/fittipaldi.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Fittipaldi_Automotive_logo.svg",
    source_description: "Fam\u00edlia Fittipaldi Archives",
    historical_evidence: "Carros FD01, FD04 e F5A pilotados por Wilson e Emerson Fittipaldi.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Legado Esportivo Nacional.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "WOLF",
    team_name: "Wolf",
    constructor_name: "Wolf",
    official_entrant_name: "Walter Wolf Racing",
    lineage_id: "INDEP-WOLF",
    season_start: 1977,
    season_end: 1979,
    logo_id: "WOL-1977",
    asset_path: "/classic/wolf.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Walter_Wolf_Racing_logo.svg",
    source_description: "Walter Wolf Archive",
    historical_evidence: "Wolf WR1 de Jody Scheckter em tr\u00eas vit\u00f3rias em 1977.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "PENSKE",
    team_name: "Penske",
    constructor_name: "Penske",
    official_entrant_name: "Penske Cars",
    lineage_id: "INDEP-PENSKE",
    season_start: 1974,
    season_end: 1977,
    logo_id: "PEN-1974",
    asset_path: "/classic/penske.svg",
    asset_format: "SVG",
    source_url: "https://www.teampenske.com/about/heritage/",
    source_description: "Team Penske Archives",
    historical_evidence: "Penske PC4 vencedor na \u00c1ustria 1976 com John Watson.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "EAGLE",
    team_name: "Eagle",
    constructor_name: "Eagle",
    official_entrant_name: "Anglo American Racers",
    lineage_id: "INDEP-EAGLE",
    season_start: 1966,
    season_end: 1969,
    logo_id: "EAG-1966",
    asset_path: "/classic/eagle.svg",
    asset_format: "SVG",
    source_url: "https://allamericanracers.com",
    source_description: "Dan Gurney's All American Racers",
    historical_evidence: "Eagle T1G Weslake em Spa 1967 com Dan Gurney.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "TOYOTA_WORKS",
    team_name: "Toyota",
    constructor_name: "Toyota",
    official_entrant_name: "Panasonic Toyota Racing",
    lineage_id: "INDEP-TOYOTA",
    season_start: 2002,
    season_end: 2009,
    logo_id: "TOY-2002",
    asset_path: "/teams/toyota.svg",
    asset_format: "SVG",
    source_url: "https://toyotagazooracing.com",
    source_description: "Toyota Gazoo Racing Heritage",
    historical_evidence: "Monopostos TF102 a TF109 de Trulli e Glock.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "HAAS",
    team_name: "Haas",
    constructor_name: "Haas",
    official_entrant_name: "Haas F1 Team",
    lineage_id: "INDEP-HAAS",
    season_start: 2016,
    season_end: 2026,
    logo_id: "HAA-2016",
    asset_path: "/teams/haas_f1_team.svg",
    asset_format: "SVG",
    source_url: "https://www.haasf1team.com",
    source_description: "Haas Automation Press",
    historical_evidence: "VF-16 a VF-24 de Grosjean, Magnussen e H\u00fclkenberg.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "CADILLAC_WORKS",
    team_name: "Cadillac",
    constructor_name: "Cadillac",
    official_entrant_name: "Cadillac Formula 1 Team",
    lineage_id: "INDEP-CADILLAC",
    season_start: 2026,
    season_end: 2026,
    logo_id: "CAD-2026",
    asset_path: "/teams/cadillac.svg",
    asset_format: "SVG",
    source_url: "https://media.cadillac.com",
    source_description: "General Motors Pressroom",
    historical_evidence: "Apresenta\u00e7\u00e3o oficial de entrada na F1 como 11\u00aa equipe.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ALFA_ROMEO_WORKS1",
    team_name: "Alfa Romeo",
    constructor_name: "Alfa Romeo",
    official_entrant_name: "Alfa Romeo S.p.A.",
    lineage_id: "PIONEER-ALFA",
    season_start: 1950,
    season_end: 1951,
    logo_id: "ALF-1950",
    asset_path: "/teams/alfa_romeo_1950.svg",
    asset_format: "SVG",
    source_url: "https://www.museoalfaromeo.com",
    source_description: "Museo Storico Alfa Romeo Arese",
    historical_evidence: "Alfetta 158 campe\u00e3 com Farina em 1950 e 159 com Fangio em 1951.",
    rights_class: "Classe A",
    rights_basis: "Dom\u00ednio p\u00fablico pela antiguidade do registro hist\u00f3rico original pr\u00e9-1950.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "secondary_sports",
    priority: 100
  },
  {
    team_id: "MASERATI",
    team_name: "Maserati",
    constructor_name: "Maserati",
    official_entrant_name: "Officine Alfieri Maserati",
    lineage_id: "PIONEER-MASERATI",
    season_start: 1950,
    season_end: 1957,
    logo_id: "MAS-1950",
    asset_path: "/classic/maserati.svg",
    asset_format: "SVG",
    source_url: "https://www.maserati.com/global/en/brand/our-story/history",
    source_description: "Maserati Classic Archive",
    historical_evidence: "Maserati 250F campe\u00e3o do mundo com Fangio em 1957.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MERCEDES_CLASSIC",
    team_name: "Mercedes-Benz",
    constructor_name: "Mercedes-Benz",
    official_entrant_name: "Daimler-Benz AG",
    lineage_id: "PIONEER-MERCEDES",
    season_start: 1954,
    season_end: 1955,
    logo_id: "MER-1954",
    asset_path: "/teams/mercedes_1954.svg",
    asset_format: "SVG",
    source_url: "https://www.mercedes-benz.com/en/art-and-culture/museum/",
    source_description: "Mercedes-Benz Classic Museum",
    historical_evidence: "As Flechas de Prata W196 de Fangio e Moss.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996 e Nominative Fair Use.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "VANWALL",
    team_name: "Vanwall",
    constructor_name: "Vanwall",
    official_entrant_name: "Vandervell Products",
    lineage_id: "PIONEER-VANWALL",
    season_start: 1954,
    season_end: 1960,
    logo_id: "VAN-1954",
    asset_path: "/classic/vanwall.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Vanwall_logo.svg",
    source_description: "Donington Grand Prix Exhibition",
    historical_evidence: "Vanwall VW5 campe\u00e3o de construtores de 1958 com Moss e Brooks.",
    rights_class: "Classe A",
    rights_basis: "Fabricante extinta h\u00e1 mais de 60 anos; dom\u00ednio p\u00fablico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "LANCIA",
    team_name: "Lancia",
    constructor_name: "Lancia",
    official_entrant_name: "Scuderia Lancia",
    lineage_id: "PIONEER-LANCIA",
    season_start: 1954,
    season_end: 1955,
    logo_id: "LAN-1954",
    asset_path: "/teams/lancia.svg",
    asset_format: "SVG",
    source_url: "https://www.fcaheritage.com",
    source_description: "Centro Storico Lancia",
    historical_evidence: "Lancia D50 de Alberto Ascari.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "GORDINI",
    team_name: "Gordini",
    constructor_name: "Gordini",
    official_entrant_name: "Equipe Gordini",
    lineage_id: "PIONEER-GORDINI",
    season_start: 1950,
    season_end: 1956,
    logo_id: "GOR-1950",
    asset_path: "/teams/gordini.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Gordini_logo.svg",
    source_description: "Renault Classic Heritage",
    historical_evidence: "Gordini Type 16 de Jean Behra.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Marca hist\u00f3rica dos anos 1950.",
    verification_status: "QUARENTENA",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "CONNAUGHT",
    team_name: "Connaught",
    constructor_name: "Connaught",
    official_entrant_name: "Connaught Engineering",
    lineage_id: "PIONEER-CONNAUGHT",
    season_start: 1952,
    season_end: 1959,
    logo_id: "CON-1952",
    asset_path: "/teams/connaught.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Connaught_logo.svg",
    source_description: "Brooklands Museum",
    historical_evidence: "Connaught Type B vencedor do GP de Siracusa 1955.",
    rights_class: "Classe A",
    rights_basis: "Dom\u00ednio p\u00fablico hist\u00f3rico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ZAKSPEED",
    team_name: "Zakspeed",
    constructor_name: "Zakspeed",
    official_entrant_name: "West Zakspeed Racing",
    lineage_id: "INDEP-ZAKSPEED",
    season_start: 1985,
    season_end: 1989,
    logo_id: "ZAK-1985",
    asset_path: "/classic/zakspeed.svg",
    asset_format: "SVG",
    source_url: "https://www.zakspeed.de",
    source_description: "Zakspeed Motorsport",
    historical_evidence: "Monopostos 841 a 891 de Danner e Schneider.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality (Geometria rel\u00e2mpago e texto nominativo).",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "AGS",
    team_name: "AGS",
    constructor_name: "AGS",
    official_entrant_name: "Automobiles Gonfaronnaises Sportives",
    lineage_id: "INDEP-AGS",
    season_start: 1986,
    season_end: 1991,
    logo_id: "AGS-1986",
    asset_path: "/classic/ags.svg",
    asset_format: "SVG",
    source_url: "https://www.agsformule1.com",
    source_description: "AGS Formule 1 Circuit du Var",
    historical_evidence: "JH23 e JH24 de Streiff e Dalmas.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Acervo garagista.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "LARROUSSE",
    team_name: "Larrousse",
    constructor_name: "Larrousse",
    official_entrant_name: "Equipe Larrousse",
    lineage_id: "INDEP-LARROUSSE",
    season_start: 1987,
    season_end: 1994,
    logo_id: "LAR-1987",
    asset_path: "/classic/larrousse.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Larrousse_logo.svg",
    source_description: "G\u00e9rard Larrousse Archives",
    historical_evidence: "Lola LC90 com motor Lamborghini no p\u00f3dio do Jap\u00e3o 1990.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "COLONI",
    team_name: "Coloni",
    constructor_name: "Coloni",
    official_entrant_name: "Coloni Racing",
    lineage_id: "INDEP-COLONI",
    season_start: 1987,
    season_end: 1991,
    logo_id: "COL-1987",
    asset_path: "/classic/coloni.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Coloni_Racing_logo.svg",
    source_description: "Coloni Motorsport",
    historical_evidence: "Coloni FC187 e C3 de Tarquini e Moreno.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ANDREA_MODA",
    team_name: "Andrea Moda",
    constructor_name: "Andrea Moda",
    official_entrant_name: "Andrea Moda Formula",
    lineage_id: "INDEP-COLONI",
    season_start: 1992,
    season_end: 1992,
    logo_id: "MODA-1992",
    asset_path: "/teams/andreamoda.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Andrea_Moda_Formula_logo.svg",
    source_description: "Andrea Sassetti Archives",
    historical_evidence: "Andrea Moda S921 qualificado em M\u00f4naco 1992 com Roberto Moreno.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "EUROBRUN",
    team_name: "EuroBrun",
    constructor_name: "EuroBrun",
    official_entrant_name: "EuroBrun Racing",
    lineage_id: "INDEP-EUROBRUN",
    season_start: 1988,
    season_end: 1990,
    logo_id: "EUR-1988",
    asset_path: "/classic/eurobrun.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:EuroBrun_logo.svg",
    source_description: "Brun Motorsport",
    historical_evidence: "ER188 e ER189 de Larrauri e Modena.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "RIAL",
    team_name: "Rial",
    constructor_name: "Rial",
    official_entrant_name: "Rial Racing",
    lineage_id: "INDEP-RIAL",
    season_start: 1988,
    season_end: 1989,
    logo_id: "RIA-1988",
    asset_path: "/classic/rial.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Rial_Racing_logo.svg",
    source_description: "Rial Leichtmetallfelgen",
    historical_evidence: "Rial ARC-01 no 4\u00ba lugar de De Cesaris em Detroit 1988.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ONYX",
    team_name: "Onyx",
    constructor_name: "Onyx",
    official_entrant_name: "Moneytron Onyx F1",
    lineage_id: "INDEP-ONYX",
    season_start: 1989,
    season_end: 1990,
    logo_id: "ONY-1989",
    asset_path: "/classic/onyx.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Onyx_Grand_Prix_logo.svg",
    source_description: "Onyx Race Engineering",
    historical_evidence: "Onyx ORE-1 no p\u00f3dio de Stefan Johansson em Portugal 1989.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "OSELLA",
    team_name: "Osella",
    constructor_name: "Osella",
    official_entrant_name: "Osella Squadra Corse",
    lineage_id: "INDEP-OSELLA",
    season_start: 1980,
    season_end: 1990,
    logo_id: "OSE-1980",
    asset_path: "/classic/osella.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Osella_logo.svg",
    source_description: "Osella Corse",
    historical_evidence: "Monopostos FA1 a FA1M de Eddie Cheever e Ghinzani.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "SIMTEK",
    team_name: "Simtek",
    constructor_name: "Simtek",
    official_entrant_name: "MTV Simtek Ford",
    lineage_id: "INDEP-SIMTEK",
    season_start: 1994,
    season_end: 1995,
    logo_id: "SIM-1994",
    asset_path: "/teams/simtek.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Simtek_logo.svg",
    source_description: "Simtek Research Archives",
    historical_evidence: "Simtek S941 e S951 de David Brabham e Jos Verstappen.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "FORTI",
    team_name: "Forti",
    constructor_name: "Forti",
    official_entrant_name: "Parmalat Forti Ford",
    lineage_id: "INDEP-FORTI",
    season_start: 1995,
    season_end: 1996,
    logo_id: "FOR-1995",
    asset_path: "/teams/forti.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Forti_Corse_logo.svg",
    source_description: "Forti Corse",
    historical_evidence: "Forti FG01 de Pedro Paulo Diniz em 1995.",
    rights_class: "Classe A",
    rights_basis: "PD-textlogo / Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ENSIGN",
    team_name: "Ensign",
    constructor_name: "Ensign",
    official_entrant_name: "Team Ensign",
    lineage_id: "INDEP-ENSIGN",
    season_start: 1973,
    season_end: 1982,
    logo_id: "ENS-1973",
    asset_path: "/classic/ensign.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Ensign_Racing_logo.svg",
    source_description: "Mo Nunn Archives",
    historical_evidence: "Ensign N177 e N179 com radiador no bico.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "THEODORE",
    team_name: "Theodore",
    constructor_name: "Theodore",
    official_entrant_name: "Theodore Racing",
    lineage_id: "INDEP-THEODORE",
    season_start: 1978,
    season_end: 1983,
    logo_id: "THE-1978",
    asset_path: "/classic/theodore.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Theodore_Racing_logo.svg",
    source_description: "Teddy Yip Archives",
    historical_evidence: "TR1 vencedor com Keke Rosberg no International Trophy 1978.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "ATS",
    team_name: "ATS",
    constructor_name: "ATS",
    official_entrant_name: "Auto Technisches Spezialzubeh\u00f6r",
    lineage_id: "INDEP-ATS",
    season_start: 1977,
    season_end: 1984,
    logo_id: "ATS-1977",
    asset_path: "/classic/ats.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:ATS_Wheels_logo.svg",
    source_description: "ATS Leichtmetallr\u00e4der",
    historical_evidence: "ATS D1 a D7 de Stuck, Rosberg e Berger.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "CATERHAM_TEAM",
    team_name: "Caterham",
    constructor_name: "Caterham",
    official_entrant_name: "Caterham F1 Team",
    lineage_id: "INDEP-CATERHAM",
    season_start: 2012,
    season_end: 2014,
    logo_id: "CAT-2012",
    asset_path: "/teams/caterham.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Caterham_F1_Team_logo.svg",
    source_description: "Caterham Cars",
    historical_evidence: "Monopostos CT01 a CT05 de Kovalainen e Kobayashi.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "MANOR_MARUSSIA",
    team_name: "Marussia",
    constructor_name: "Marussia",
    official_entrant_name: "Marussia F1 Team / Manor Racing",
    lineage_id: "INDEP-MANOR",
    season_start: 2012,
    season_end: 2016,
    logo_id: "MAR-2012",
    asset_path: "/teams/marussia.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:Marussia_F1_Team_logo.svg",
    source_description: "Manor Motorsport Archives",
    historical_evidence: "MR03 do 9\u00ba lugar de Jules Bianchi em M\u00f4naco 2014.",
    rights_class: "Classe B",
    rights_basis: "Art. 132, IV da Lei 9.279/1996.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  },
  {
    team_id: "HRT_TEAM",
    team_name: "HRT",
    constructor_name: "HRT",
    official_entrant_name: "HRT Formula 1 Team",
    lineage_id: "INDEP-HRT",
    season_start: 2010,
    season_end: 2012,
    logo_id: "HRT-2010",
    asset_path: "/teams/hrt.svg",
    asset_format: "SVG",
    source_url: "https://commons.wikimedia.org/wiki/File:HRT_F1_Team_logo.svg",
    source_description: "HRT Archives",
    historical_evidence: "Monopostos F110 a F112 de Bruno Senna e De la Rosa.",
    rights_class: "Classe A",
    rights_basis: "Threshold of Originality / Monograma tipogr\u00e1fico.",
    verification_status: "VERIFICADO",
    fallback_allowed: false,
    variant: "primary_official",
    priority: 100
  }
];

/**
 * Mapeamento estático pré-calculado de limites cronológicos por equipe.
 */
interface TeamBounds {
  minSeason: number;
  maxSeason: number;
  teamName: string;
  lineageId: string;
}

const TEAM_BOUNDS_MAP: Record<string, TeamBounds> = (() => {
  const map: Record<string, TeamBounds> = {};
  for (const rec of HISTORICAL_REGISTRY) {
    const tid = rec.team_id;
    if (!map[tid]) {
      map[tid] = {
        minSeason: rec.season_start,
        maxSeason: rec.season_end,
        teamName: rec.team_name,
        lineageId: rec.lineage_id,
      };
    } else {
      map[tid].minSeason = Math.min(map[tid].minSeason, rec.season_start);
      map[tid].maxSeason = Math.max(map[tid].maxSeason, rec.season_end);
    }
  }
  return map;
})();

/**
 * Função central de resolução temporal de identidades visuais de construtores da F1.
 *
 * @param teamId Identificador canônico da equipe (ex: 'FERRARI', 'MCLAREN', 'TYRRELL')
 * @param season Ano inteiro da temporada consultada (1950 a 2026)
 * @param options Opções de consulta (preferência de variante)
 * @returns ResolveTeamLogoResult com o ativo selecionado e diagnóstico auditável
 */
export function resolveTeamLogo(
  teamId: string,
  season: number,
  options?: ResolveOptions
): ResolveTeamLogoResult {
  const normalizedId = teamId ? teamId.trim().toUpperCase() : '';
  const bounds = TEAM_BOUNDS_MAP[normalizedId];

  // 1. Verificação de existência da equipe no catálogo canônico
  if (!bounds) {
    return {
      status: 'TEAM_NOT_FOUND',
      matched: false,
      teamId: normalizedId,
      season,
      reasonCode: 'ERR_UNKNOWN_TEAM',
      diagnosticMessage: `Identificador de equipe '${teamId}' não localizado no registro canônico histórico.`,
      selectedEntry: null,
      assetPath: null,
      selectedVariant: null,
      historicalEvidence: null,
      integrityStatus: 'NONE',
      rightsStatus: {
        rightsClass: 'DESCONHECIDA',
        rightsBasis: null,
        verificationStatus: 'NONE',
        nominativeFairUseApplies: false,
      },
      rejectionReason: 'Equipe não cadastrada na base de construtores.',
    };
  }

  // 2. Verificação de limite temporal inferior (temporada anterior à estreia)
  if (season < bounds.minSeason) {
    return {
      status: 'BEFORE_ORIGIN',
      matched: false,
      teamId: normalizedId,
      season,
      reasonCode: 'HIST_TEMPORAL_PREDECEASE',
      diagnosticMessage: `A temporada ${season} antecede a fundação ou estreia oficial da equipe ${bounds.teamName} na Fórmula 1 (estreia em ${bounds.minSeason}).`,
      selectedEntry: null,
      assetPath: null,
      selectedVariant: null,
      historicalEvidence: null,
      integrityStatus: 'NONE',
      rightsStatus: {
        rightsClass: 'DESCONHECIDA',
        rightsBasis: null,
        verificationStatus: 'NONE',
        nominativeFairUseApplies: false,
      },
      rejectionReason: `Temporada ${season} anterior ao ano inicial comprovado (${bounds.minSeason}).`,
    };
  }

  // 3. Verificação de limite temporal superior (temporada posterior à extinção)
  if (season > bounds.maxSeason) {
    return {
      status: 'AFTER_DECEASE',
      matched: false,
      teamId: normalizedId,
      season,
      reasonCode: 'HIST_TEMPORAL_POST_EXTINCTION',
      diagnosticMessage: `A temporada ${season} é posterior ao encerramento ou transferência de operações da equipe ${bounds.teamName} (última temporada ativa: ${bounds.maxSeason}).`,
      selectedEntry: null,
      assetPath: null,
      selectedVariant: null,
      historicalEvidence: null,
      integrityStatus: 'NONE',
      rightsStatus: {
        rightsClass: 'DESCONHECIDA',
        rightsBasis: null,
        verificationStatus: 'NONE',
        nominativeFairUseApplies: false,
      },
      rejectionReason: `Temporada ${season} posterior ao ano final comprovado (${bounds.maxSeason}).`,
    };
  }

  // 4. Filtragem de candidatos dentro do intervalo inclusivo [season_start, season_end]
  const matchingCandidates = HISTORICAL_REGISTRY.filter(
    (rec) => rec.team_id === normalizedId && rec.season_start <= season && season <= rec.season_end
  );

  // 5. Lacuna histórica documentada (equipe competiu, mas não há identidade certificada)
  if (matchingCandidates.length === 0) {
    return {
      status: 'HISTORICAL_GAP',
      matched: false,
      teamId: normalizedId,
      season,
      reasonCode: 'HIST_UNAUTHENTICATED_GAP',
      diagnosticMessage: `Lacuna histórica documentada: a equipe ${bounds.teamName} disputou a temporada ${season}, porém não possui identidade visual certificada nos acervos auditados.`,
      selectedEntry: null,
      assetPath: null,
      selectedVariant: null,
      historicalEvidence: null,
      integrityStatus: 'NONE',
      rightsStatus: {
        rightsClass: 'DESCONHECIDA',
        rightsBasis: null,
        verificationStatus: 'NONE',
        nominativeFairUseApplies: true,
      },
      rejectionReason: 'Ausência de evidência iconográfica de época certificada.',
    };
  }

  // 6. Filtro de quarentena de integridade e direitos
  const allowQuarantine = options?.allowQuarantined ?? false;
  const approvedCandidates = matchingCandidates.filter((cand) => {
    if (allowQuarantine) return true;
    if (cand.rights_class === 'Classe D') return false;
    if (cand.verification_status === 'QUARENTENA') return false;
    return true;
  });

  if (approvedCandidates.length === 0) {
    const quarantined = matchingCandidates[0];
    return {
      status: 'QUARANTINED_OR_INVALID',
      matched: false,
      teamId: normalizedId,
      season,
      reasonCode: 'SEC_RIGHTS_OR_CORRUPT_ASSET',
      diagnosticMessage: `Identidade visual da equipe ${bounds.teamName} para a temporada ${season} retida em quarentena técnica ou de governança de direitos.`,
      selectedEntry: quarantined,
      assetPath: quarantined.asset_path,
      selectedVariant: quarantined.variant,
      historicalEvidence: quarantined.historical_evidence,
      integrityStatus: quarantined.verification_status === 'QUARENTENA' ? 'CORRUPT_XML' : 'VALID_SVG',
      rightsStatus: {
        rightsClass: quarantined.rights_class,
        rightsBasis: quarantined.rights_basis,
        verificationStatus: quarantined.verification_status,
        nominativeFairUseApplies: true,
      },
      rejectionReason: 'Ativo retido em quarentena (inconsistência sintática ou ausência de licença/procedência).',
    };
  }

  // 7. Desempate determinístico por preferência de variante e prioridade
  const variantPref = options?.variantPreference || 'primary_official';
  const sorted = [...approvedCandidates].sort((a, b) => {
    const aMatch = a.variant === variantPref ? 1 : 0;
    const bMatch = b.variant === variantPref ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return b.priority - a.priority;
  });

  const chosen = sorted[0];

  return {
    status: 'FOUND',
    matched: true,
    teamId: normalizedId,
    season,
    reasonCode: 'MATCH_EXACT_INTERVAL',
    diagnosticMessage: `Identidade ${chosen.logo_id} selecionada para a equipe ${bounds.teamName} na temporada ${season} (vigência comprovada: ${chosen.season_start}–${chosen.season_end}).`,
    selectedEntry: chosen,
    assetPath: chosen.asset_path,
    selectedVariant: chosen.variant,
    historicalEvidence: chosen.historical_evidence,
    integrityStatus: chosen.asset_format === 'SVG' ? 'VALID_SVG' : 'LEGACY_BITMAP',
    rightsStatus: {
      rightsClass: chosen.rights_class,
      rightsBasis: chosen.rights_basis,
      verificationStatus: chosen.verification_status,
      nominativeFairUseApplies: true,
    },
    rejectionReason: null,
  };
}

/**
 * Retorna os limites temporais comprovados de uma equipe.
 */
export function getTeamHistoricalBounds(teamId: string): TeamBounds | null {
  const tid = teamId ? teamId.trim().toUpperCase() : '';
  return TEAM_BOUNDS_MAP[tid] || null;
}

/**
 * Lista todos os identificadores canônicos de equipes catalogadas.
 */
export function getAllCatalogedTeamIds(): string[] {
  return Object.keys(TEAM_BOUNDS_MAP).sort();
}

/**
 * Tabela de Cores Canônicas Institucionais por Construtor Histórico
 */
export const TEAM_BRAND_COLORS: Record<string, string> = {
  FERRARI: '#CE2B37',
  MCLAREN: '#FF8000',
  WILLIAMS: '#001B36',
  TYRRELL: '#002B7F',
  BAR: '#FFFFFF',
  HONDA_WORKS: '#FC0217',
  BRAWN: '#000000',
  MERCEDES_MODERN: '#0A141A',
  MERCEDES_CLASSIC: '#0A141A',
  TOLEMAN: '#002B7F',
  BENETTON: '#007A3E',
  RENAULT_WORKS1: '#FFD000',
  RENAULT_WORKS2: '#FFD000',
  RENAULT_WORKS3: '#FFD000',
  LOTUS_ENSTONE: '#000000',
  ALPINE: '#0090FF',
  JORDAN: '#FFDE00',
  MIDLAND: '#0A0D12',
  SPYKER: '#FF7A00',
  FORCE_INDIA: '#F58020',
  RACING_POINT: '#F596C8',
  ASTON_MARTIN_MODERN: '#006F62',
  MINARDI: '#0A0D12',
  TORO_ROSSO: '#001A30',
  ALPHATAURI: '#FFFFFF',
  RB_RACING_BULLS: '#0D1B3E',
  SAUBER: '#001D38',
  SAUBER_INDEP: '#001D38',
  BMW_SAUBER: '#001D38',
  ALFA_ROMEO_SAUBER: '#900000',
  ALFA_ROMEO_WORKS1: '#900000',
  KICK_SAUBER: '#00E700',
  AUDI_WORKS: '#000000',
  STEWART: '#0C2340',
  JAGUAR: '#004225',
  RED_BULL_RACING: '#041E42',
  LOTUS_CLASSIC: '#004225',
  BRABHAM: '#002B7F',
  COOPER: '#004225',
  BRM: '#004225',
  MATRA: '#002B7F',
  LIGIER: '#002B7F',
  PROST: '#002060',
  ARROWS_FOOTWORK: '#FF6600',
  MARCH: '#002B7F',
  SURTEES: '#002B7F',
  HESKETH: '#FFFFFF',
  SHADOW: '#000000',
  FITTIPALDI: '#007A3E',
  WOLF: '#000000',
  PENSKE: '#001B36',
  PARNELLI: '#001B36',
  EAGLE: '#001B36',
  TOYOTA_WORKS: '#FFFFFF',
  SUPER_AGURI: '#FFFFFF',
  HAAS: '#FFFFFF',
  CADILLAC_WORKS: '#111111',
  MASERATI: '#002B7F',
  VANWALL: '#004225',
  LANCIA: '#002B7F',
  TALBOT_LAGO: '#002B7F',
  GORDINI: '#002B7F',
  CONNAUGHT: '#004225',
  HWM: '#004225',
  ZAKSPEED: '#000000',
  AGS: '#002B7F',
  LARROUSSE: '#002B7F',
  COLONI: '#FFDE00',
  ANDREA_MODA: '#000000',
  EUROBRUN: '#FF6600',
  RIAL: '#002B7F',
  ONYX: '#002060',
  OSELLA: '#002B7F',
  FONDMETAL: '#000000',
  SIMTEK: '#160728',
  PACIFIC: '#0A0C10',
  FORTI: '#FFCC00',
  ENSIGN: '#002B7F',
  THEODORE: '#D40000',
  ATS: '#FFD000',
  CATERHAM_TEAM: '#003D1B',
  MANOR_MARUSSIA: '#FFFFFF',
  HRT_TEAM: '#E10600',
};

/**
 * Retorna a cor canônica da equipe ou valor padrão neutro.
 */
export function getTeamBrandColor(teamId: string): string {
  const tid = teamId ? teamId.trim().toUpperCase() : '';
  return TEAM_BRAND_COLORS[tid] || '#0A141A';
}

/**
 * Mapeia denominações comerciais, nomes de construtores e variações textuais
 * para o team_id canônico, considerando o ano consultado para desambiguação de homônimos.
 */
export function mapNameToTeamId(name: string, season?: number): string | null {
  if (!name) return null;
  const raw = name.trim();
  const upper = raw.toUpperCase();

  // 1. Verificação direta se já é um team_id canônico
  if (TEAM_BOUNDS_MAP[upper]) {
    return upper;
  }

  const lower = raw.toLowerCase();

  // 2. Construtores com motores/fornecedores comumente presentes no nome oficial
  // Ex: 'McLaren Mercedes', 'Vodafone McLaren Mercedes', 'McLaren Honda' -> MCLAREN
  if (lower.includes('mclaren')) return 'MCLAREN';
  // Ex: 'Williams Renault', 'Williams BMW', 'Williams Mercedes' -> WILLIAMS
  if (lower.includes('williams')) return 'WILLIAMS';
  // Ex: 'Red Bull Racing Renault', 'Red Bull Honda' -> RED_BULL_RACING
  if (lower.includes('red bull') || lower.includes('redbull')) return 'RED_BULL_RACING';
  // Ex: 'Benetton Renault', 'Benetton Ford', 'Benetton BMW' -> BENETTON
  if (lower.includes('benetton')) return 'BENETTON';
  // Ex: 'Tyrrell Ford', 'Tyrrell Yamaha', 'Tyrrell Renault' -> TYRRELL
  if (lower.includes('tyrrell')) return 'TYRRELL';
  // Ex: 'Brabham Alfa Romeo', 'Brabham BMW', 'Brabham Repco' -> BRABHAM
  if (lower.includes('brabham')) return 'BRABHAM';
  // Ex: 'Jordan Ford', 'Jordan Mugen-Honda', 'Jordan Peugeot' -> JORDAN
  if (lower.includes('jordan')) return 'JORDAN';
  // Ex: 'Aston Martin Aramco Mercedes' -> ASTON_MARTIN_MODERN
  if (lower.includes('aston martin')) return 'ASTON_MARTIN_MODERN';
  // Ex: 'Force India Mercedes' -> FORCE_INDIA
  if (lower.includes('force india')) return 'FORCE_INDIA';
  // Ex: 'Racing Point BWT Mercedes' -> RACING_POINT
  if (lower.includes('racing point')) return 'RACING_POINT';
  // Ex: 'Brawn GP Mercedes' -> BRAWN
  if (lower.includes('brawn')) return 'BRAWN';
  // Ex: 'Stewart Ford' -> STEWART
  if (lower.includes('stewart')) return 'STEWART';
  // Ex: 'Jaguar Cosworth' -> JAGUAR
  if (lower.includes('jaguar')) return 'JAGUAR';
  // Ex: 'Toro Rosso Ferrari', 'Toro Rosso Renault' -> TORO_ROSSO
  if (lower.includes('toro rosso')) return 'TORO_ROSSO';
  // Ex: 'AlphaTauri Honda' -> ALPHATAURI
  if (lower.includes('alphatauri')) return 'ALPHATAURI';
  // Ex: 'Visa Cash App RB' -> RB_RACING_BULLS
  if (lower.includes('racing bulls') || lower === 'rb' || lower.includes('visa cash app') || lower.includes('cash app rb')) return 'RB_RACING_BULLS';
  // Ex: 'Haas Ferrari' -> HAAS
  if (lower.includes('haas')) return 'HAAS';
  // Ex: 'Ligier Renault', 'Ligier Matra' -> LIGIER
  if (lower.includes('ligier')) return 'LIGIER';
  // Ex: 'Prost Peugeot', 'Prost Acer' -> PROST
  if (lower.includes('prost')) return 'PROST';
  // Ex: 'Arrows Porsche', 'Footwork Mugen-Honda' -> ARROWS_FOOTWORK
  if (lower.includes('arrows') || lower.includes('footwork')) return 'ARROWS_FOOTWORK';
  // Ex: 'Minardi Ford', 'Minardi Ferrari' -> MINARDI
  if (lower.includes('minardi')) return 'MINARDI';

  // 3. Desambiguação de Homônimos Críticos por Temporada
  if (lower.includes('lotus')) {
    if (season && season <= 1994) return 'LOTUS_CLASSIC';
    if (season && season >= 2012 && season <= 2015) return 'LOTUS_ENSTONE';
    if (season && (season === 2010 || season === 2011)) return 'CATERHAM_TEAM';
    return season && season >= 2010 ? 'LOTUS_ENSTONE' : 'LOTUS_CLASSIC';
  }

  if (lower.includes('bmw sauber') || lower === 'bmw') return 'BMW_SAUBER';
  if (lower.includes('kick sauber') || lower.includes('stake')) return 'KICK_SAUBER';
  if (lower.includes('alfa romeo') || lower.includes('alfaromeo')) {
    if (season && season <= 1951) return 'ALFA_ROMEO_WORKS1';
    return 'ALFA_ROMEO_SAUBER';
  }
  if (lower.includes('sauber')) return 'SAUBER';

  // Equipes de fábrica com fornecimento simultâneo de motor:
  if (lower.includes('renault')) {
    if (season && season <= 1985) return 'RENAULT_WORKS1';
    if (season && season >= 2016) return 'RENAULT_WORKS3';
    return 'RENAULT_WORKS2';
  }

  if (lower.includes('mercedes')) {
    if (season && season <= 1955) return 'MERCEDES_CLASSIC';
    return 'MERCEDES_MODERN';
  }

  // 4. Mapeamentos Diretos e Invariantes
  if (lower.includes('ferrari')) return 'FERRARI';
  if (lower.includes('bar') || lower.includes('british american')) return 'BAR';
  if (lower.includes('honda')) return 'HONDA_WORKS';
  if (lower.includes('toleman')) return 'TOLEMAN';
  if (lower.includes('alpine')) return 'ALPINE';
  if (lower.includes('midland') || lower.includes('mf1')) return 'MIDLAND';
  if (lower.includes('spyker')) return 'SPYKER';
  if (lower.includes('audi')) return 'AUDI_WORKS';
  if (lower.includes('cooper')) return 'COOPER';
  if (lower.includes('brm') || lower.includes('british racing motors')) return 'BRM';
  if (lower.includes('matra')) return 'MATRA';
  if (/\bmarch\b/i.test(lower)) return 'MARCH';
  if (lower.includes('surtees')) return 'SURTEES';
  if (lower.includes('hesketh')) return 'HESKETH';
  if (lower.includes('shadow')) return 'SHADOW';
  if (lower.includes('fittipaldi') || lower.includes('copersucar')) return 'FITTIPALDI';
  if (lower.includes('wolf')) return 'WOLF';
  if (lower.includes('penske')) return 'PENSKE';
  if (lower.includes('parnelli')) return 'PARNELLI';
  if (lower.includes('eagle')) return 'EAGLE';
  if (lower.includes('toyota')) return 'TOYOTA_WORKS';
  if (lower.includes('super aguri')) return 'SUPER_AGURI';
  if (lower.includes('cadillac')) return 'CADILLAC_WORKS';
  if (lower.includes('maserati')) return 'MASERATI';
  if (lower.includes('vanwall')) return 'VANWALL';
  if (lower.includes('lancia')) return 'LANCIA';
  if (lower.includes('talbot')) return 'TALBOT_LAGO';
  if (lower.includes('gordini')) return 'GORDINI';
  if (lower.includes('connaught')) return 'CONNAUGHT';
  if (lower.includes('hwm')) return 'HWM';
  if (lower.includes('zakspeed')) return 'ZAKSPEED';
  if (lower.includes('ags')) return 'AGS';
  if (lower.includes('larrousse')) return 'LARROUSSE';
  if (lower.includes('coloni')) return 'COLONI';
  if (lower.includes('andrea moda')) return 'ANDREA_MODA';
  if (lower.includes('eurobrun')) return 'EUROBRUN';
  if (lower.includes('rial')) return 'RIAL';
  if (lower.includes('onyx')) return 'ONYX';
  if (lower.includes('osella')) return 'OSELLA';
  if (lower.includes('fondmetal')) return 'FONDMETAL';
  if (lower.includes('simtek')) return 'SIMTEK';
  if (lower.includes('pacific')) return 'PACIFIC';
  if (lower.includes('forti')) return 'FORTI';
  if (lower.includes('ensign')) return 'ENSIGN';
  if (lower.includes('theodore')) return 'THEODORE';
  if (/\bats\b/i.test(lower) || lower.includes('automobili turismo e sport')) return 'ATS';
  if (lower.includes('caterham')) return 'CATERHAM_TEAM';
  if (lower.includes('marussia') || lower.includes('manor') || lower.includes('virgin')) return 'MANOR_MARUSSIA';
  if (lower.includes('hrt') || lower.includes('hispania')) return 'HRT_TEAM';

  return null;
}
