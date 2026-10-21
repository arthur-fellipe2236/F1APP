import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Award,
  Search,
  Eye,
  Flag,
  X,
  Check,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// GLOSSÁRIO INICIAL — 12 TERMOS OFICIAIS
// ============================================================================
export interface GlossaryTerm {
  id: string
  term: string
  category: "Geral" | "Pista" | "Carro" | "Campeonato"
  definition: string
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "f1",
    term: "F1",
    category: "Geral",
    definition: "Fórmula 1, categoria de automobilismo de alto nível.",
  },
  {
    id: "piloto",
    term: "Piloto",
    category: "Geral",
    definition: "Pessoa que conduz o carro.",
  },
  {
    id: "equipe",
    term: "Equipe",
    category: "Geral",
    definition: "Organização responsável pelo carro, pela operação e pela estratégia.",
  },
  {
    id: "grid",
    term: "Grid de largada",
    category: "Pista",
    definition: "Posições em que os carros começam a corrida.",
  },
  {
    id: "classificacao",
    term: "Classificação",
    category: "Pista",
    definition: "Sessão que determina a ordem de largada, conforme o formato aplicável.",
  },
  {
    id: "pitstop",
    term: "Pit stop",
    category: "Pista",
    definition: "Parada nos boxes, geralmente para trocar pneus ou realizar serviços permitidos.",
  },
  {
    id: "pneus",
    term: "Pneus",
    category: "Carro",
    definition: "Componentes que mantêm contato com a pista e influenciam aderência e estratégia.",
  },
  {
    id: "aerodinamica",
    term: "Aerodinâmica",
    category: "Carro",
    definition: "Estudo de como o ar interage com o carro.",
  },
  {
    id: "unidade_potencia",
    term: "Unidade de potência",
    category: "Carro",
    definition: "Conjunto que inclui motor de combustão e sistemas elétricos.",
  },
  {
    id: "camp_pilotos",
    term: "Campeonato de pilotos",
    category: "Campeonato",
    definition: "Disputa individual entre os pilotos.",
  },
  {
    id: "camp_construtores",
    term: "Campeonato de construtores",
    category: "Campeonato",
    definition: "Disputa entre as equipes.",
  },
  {
    id: "bandeira_quadriculada",
    term: "Bandeira quadriculada",
    category: "Pista",
    definition: "Sinal que indica o fim da sessão ou da corrida, conforme o contexto.",
  },
]

// ============================================================================
// COMPONENTES DESTACADOS NA CENA 04 — A MÁQUINA (7 PEÇAS SINCRONIZADAS)
// ============================================================================
export interface CarComponentHotspot {
  id: number
  name: string
  shortDesc: string
  x: number // % horizontal position on image
  y: number // % vertical position on image
  appearAtSec: number // synchronized with Mariana narration
}

export const CAR_COMPONENTS_SCENE_04: CarComponentHotspot[] = [
  {
    id: 1,
    name: "1. Asa dianteira",
    shortDesc: "Direciona o fluxo de ar na frente do carro e cola o bico no asfalto.",
    x: 24,
    y: 66,
    appearAtSec: 3.2,
  },
  {
    id: 2,
    name: "2. Asa traseira",
    shortDesc: "Gera pressão aerodinâmica (downforce) para estabilidade em alta velocidade.",
    x: 78,
    y: 34,
    appearAtSec: 5.4,
  },
  {
    id: 3,
    name: "3. Pneus",
    shortDesc: "Único ponto de contato com o asfalto; determinam aderência e estratégia.",
    x: 42,
    y: 68,
    appearAtSec: 11.2,
  },
  {
    id: 4,
    name: "4. Freios",
    shortDesc: "Discos de carbono que suportam altíssimas temperaturas nas desacelerações.",
    x: 36,
    y: 62,
    appearAtSec: 14.5,
  },
  {
    id: 5,
    name: "5. Halo",
    shortDesc: "Estrutura de titânio ultra-resistente que protege a cabeça do piloto.",
    x: 50,
    y: 41,
    appearAtSec: 17.8,
  },
  {
    id: 6,
    name: "6. Cockpit",
    shortDesc: "Habitáculo de fibra de carbono onde o piloto conduz o carro.",
    x: 55,
    y: 46,
    appearAtSec: 20.0,
  },
  {
    id: 7,
    name: "7. Unidade de potência",
    shortDesc: "Combina motor a combustão V6 turbo com sistemas elétricos de recuperação de energia.",
    x: 67,
    y: 44,
    appearAtSec: 22.2,
  },
]

// ============================================================================
// AS 8 CENAS SEQUENCIAIS DO MÓDULO 1
// ============================================================================
export interface ModuleScene {
  number: number
  id: string
  title: string
  estimatedDurationLabel: string
  durationSec: number
  imageUrl: string
  audioUrl: string
  shortSummary: string
  narrationTranscript: string
  visualEffectType:
    | "rear_shimmer"
    | "vintage_1950"
    | "parallax_track"
    | "machine_hotspots"
    | "pitstop_team"
    | "starting_grid"
    | "telemetry_wall"
    | "checkered_finish"
  ambientProfile:
    | "opening_idle"
    | "vintage_archive"
    | "track_acceleration"
    | "tech_scanner"
    | "pitstop_tools"
    | "race_start"
    | "telemetry_beeps"
    | "finish_flyby"
}

export const MODULE_1_SCENES: ModuleScene[] = [
  {
    number: 1,
    id: "cena01",
    title: "A ABERTURA",
    estimatedDurationLabel: "16s",
    durationSec: 16.2,
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo1/cena01.mp3",
    shortSummary:
      "Velocidade, estratégia, talento e trabalho em equipe se encontram. Vamos entender tudo, curva por curva.",
    narrationTranscript:
      "Você está prestes a conhecer um dos esportes a motor mais tecnológicos do mundo. Aqui, velocidade, estratégia, talento e trabalho em equipe se encontram. E você não precisa saber nada sobre automobilismo para começar. Vamos entender tudo, curva por curva.",
    visualEffectType: "rear_shimmer",
    ambientProfile: "opening_idle",
  },
  {
    number: 2,
    id: "cena02",
    title: "COMO TUDO COMEÇOU",
    estimatedDurationLabel: "23s",
    durationSec: 22.9,
    imageUrl: "/novatos/modulo1/cena02_1950.jpg",
    audioUrl: "/audio/novatos/modulo1/cena02.mp3",
    shortSummary:
      "Em 1950 nasceu o Campeonato Mundial de Pilotos de Fórmula 1, organizado pela FIA.",
    narrationTranscript:
      "Imagine uma época em que os carros de corrida eram muito diferentes dos que conhecemos hoje. Em 1950, nasceu o Campeonato Mundial de Pilotos de Fórmula 1, organizado pela Federação Internacional do Automóvel, a FIA. Desde então, pilotos e equipes passaram a disputar corridas em diferentes circuitos pelo mundo, buscando velocidade, precisão e vitória.",
    visualEffectType: "vintage_1950",
    ambientProfile: "vintage_archive",
  },
  {
    number: 3,
    id: "cena03",
    title: "POR QUE SE CHAMA FÓRMULA 1?",
    estimatedDurationLabel: "23s",
    durationSec: 22.66,
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo1/cena03.mp3",
    shortSummary:
      "‘Fórmula’ é o conjunto de regras técnicas e esportivas; ‘1’ identifica a categoria de topo.",
    narrationTranscript:
      "O nome tem um significado interessante. A palavra ‘Fórmula’ representa o conjunto de regras técnicas e esportivas que todos precisam respeitar. Já o número um identifica a categoria de topo dentro dessa fórmula de competição. Ou seja: não basta construir um carro rápido. É preciso construir um carro capaz de vencer respeitando as mesmas regras que os adversários.",
    visualEffectType: "parallax_track",
    ambientProfile: "track_acceleration",
  },
  {
    number: 4,
    id: "cena04",
    title: "A MÁQUINA",
    estimatedDurationLabel: "33s",
    durationSec: 32.59,
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo1/cena04.mp3",
    shortSummary:
      "Conheça os 7 elementos fundamentais que trabalham no limite: asas, pneus, freios, halo, cockpit e unidade de potência.",
    narrationTranscript:
      "Um carro de Fórmula 1 é uma máquina projetada para trabalhar no limite. A aerodinâmica, com a asa dianteira e a asa traseira, ajuda a controlar o fluxo de ar e a gerar pressão sobre o carro, aumentando a aderência nas curvas. Os pneus fornecem contato com o asfalto, enquanto os freios ajudam a controlar a velocidade. O halo protege a cabeça do piloto dentro do cockpit. E a unidade de potência combina um motor de combustão com sistemas elétricos. Tudo precisa funcionar em conjunto para que o piloto consiga extrair o máximo desempenho.",
    visualEffectType: "machine_hotspots",
    ambientProfile: "tech_scanner",
  },
  {
    number: 5,
    id: "cena05",
    title: "PILOTOS E EQUIPES",
    estimatedDurationLabel: "21s",
    durationSec: 21.43,
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo1/cena05.mp3",
    shortSummary:
      "Duas disputas simultâneas: o Campeonato de Pilotos e o Campeonato de Construtores.",
    narrationTranscript:
      "Na Fórmula 1, existem duas disputas acontecendo ao mesmo tempo. Os pilotos lutam pelo campeonato individual, enquanto as equipes acumulam pontos para o campeonato de construtores. E a corrida não é decidida apenas pelo pé do piloto no acelerador: estratégia, comunicação, escolha dos pneus e trabalho dos mecânicos também fazem diferença.",
    visualEffectType: "pitstop_team",
    ambientProfile: "pitstop_tools",
  },
  {
    number: 6,
    id: "cena06",
    title: "COMO ACONTECE UMA CORRIDA",
    estimatedDurationLabel: "26s",
    durationSec: 26.09,
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo1/cena06.mp3",
    shortSummary:
      "Treinos, classificação, corrida Sprint em etapas específicas e a aguardada largada do Grande Prêmio.",
    narrationTranscript:
      "Um fim de semana de Fórmula 1 pode incluir treinos, classificação e corrida principal. Em determinados fins de semana, também existe uma corrida Sprint. A classificação ajuda a definir as posições de largada. Depois da preparação, os pilotos alinham seus carros e aguardam o sinal de partida. Ao longo da corrida, disputam posições, administram os pneus e seguem as estratégias de suas equipes até a bandeirada final.",
    visualEffectType: "starting_grid",
    ambientProfile: "race_start",
  },
  {
    number: 7,
    id: "cena07",
    title: "O QUE OBSERVAR DURANTE A PROVA",
    estimatedDurationLabel: "23s",
    durationSec: 23.04,
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo1/cena07.mp3",
    shortSummary:
      "Posição, diferença de tempo, compostos de pneus, ritmo de volta e janelas estratégicas de pit stop.",
    narrationTranscript:
      "Quando você assistir a uma corrida, observe a posição de cada piloto, a diferença de tempo para os adversários, os pneus utilizados e as paradas nos boxes. Repare também no ritmo dos carros e nas decisões das equipes. Esses detalhes ajudam a entender por que um piloto pode ganhar posições sem necessariamente ultrapassar na pista e como a estratégia influencia o resultado.",
    visualEffectType: "telemetry_wall",
    ambientProfile: "telemetry_beeps",
  },
  {
    number: 8,
    id: "cena08",
    title: "VOCÊ ESTÁ PRONTO PARA COMEÇAR",
    estimatedDurationLabel: "21s",
    durationSec: 21.43,
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo1/cena08.mp3",
    shortSummary:
      "Agora você enxerga estratégia, trabalho em equipe e tecnologia a cada volta até a bandeira quadriculada!",
    narrationTranscript:
      "A partir de agora, quando você acompanhar uma corrida, vai começar a perceber muito mais do que carros dando voltas. Vai enxergar decisões estratégicas, disputas por posição, trabalho em equipe e tecnologia. E esse é só o começo. Na próxima aula, vamos conhecer o carro de Fórmula 1 e descobrir o que faz essa máquina ser tão especial.",
    visualEffectType: "checkered_finish",
    ambientProfile: "finish_flyby",
  },
]

// ============================================================================
// QUESTIONÁRIO FINAL — 5 PERGUNTAS OFICIAIS
// ============================================================================
export interface QuizQuestion {
  id: number
  question: string
  options: { letter: "A" | "B" | "C" | "D"; text: string }[]
  correctLetter: "A" | "B" | "C" | "D"
  feedback: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — Em que ano começou o Campeonato Mundial de Pilotos de Fórmula 1?",
    options: [
      { letter: "A", text: "1930" },
      { letter: "B", text: "1950" },
      { letter: "C", text: "1970" },
      { letter: "D", text: "2000" },
    ],
    correctLetter: "B",
    feedback: "Isso mesmo! O campeonato mundial de pilotos começou em 1950.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que significa a palavra ‘Fórmula’ no nome da categoria?",
    options: [
      { letter: "A", text: "Uma fórmula química para combustível." },
      { letter: "B", text: "Um modelo de carro que todos devem copiar." },
      { letter: "C", text: "Um conjunto de regras técnicas e esportivas." },
      { letter: "D", text: "Uma marca de motores." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! As regras definem os limites técnicos e esportivos que as equipes precisam respeitar.",
  },
  {
    id: 3,
    question: "Pergunta 3 — Qual é o papel da FIA na Fórmula 1?",
    options: [
      { letter: "A", text: "Organizar e regulamentar o campeonato no âmbito de suas atribuições." },
      { letter: "B", text: "Construir todos os carros." },
      { letter: "C", text: "Escolher o vencedor de cada corrida." },
      { letter: "D", text: "Ser a equipe de todos os pilotos." },
    ],
    correctLetter: "A",
    feedback:
      "Exatamente! A FIA é responsável pela regulamentação e pela supervisão esportiva e técnica dentro de suas atribuições.",
  },
  {
    id: 4,
    question: "Pergunta 4 — O que é o campeonato de construtores?",
    options: [
      { letter: "A", text: "Uma competição entre fabricantes de pneus." },
      { letter: "B", text: "Uma disputa entre mecânicos." },
      { letter: "C", text: "Uma classificação baseada apenas na velocidade máxima." },
      { letter: "D", text: "Um campeonato em que as equipes acumulam pontos." },
    ],
    correctLetter: "D",
    feedback:
      "Muito bem! As equipes somam pontos conquistados por seus pilotos para disputar o campeonato de construtores.",
  },
  {
    id: 5,
    question:
      "Pergunta 5 — O que pode influenciar o resultado de uma corrida além da habilidade do piloto?",
    options: [
      { letter: "A", text: "Apenas a cor do carro." },
      { letter: "B", text: "Estratégia, pneus, trabalho da equipe e decisões durante a prova." },
      { letter: "C", text: "Somente a velocidade máxima." },
      { letter: "D", text: "Apenas a posição de largada." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! A Fórmula 1 combina habilidade, tecnologia, estratégia e trabalho em equipe.",
  },
]

const STORAGE_PROGRESS_KEY = "f1_novatos_mod1_state_v1"

interface PersistedModuleState {
  visitedScenes: number[]
  lastSceneIndex: number
  quizCompleted: boolean
  quizScore: number | null
}

function loadPersistedState(): PersistedModuleState {
  if (typeof window === "undefined") {
    return { visitedScenes: [], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
  }
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY)
    if (!raw) return { visitedScenes: [], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
    const parsed = JSON.parse(raw)
    return {
      visitedScenes: Array.isArray(parsed.visitedScenes) ? parsed.visitedScenes : [],
      lastSceneIndex: typeof parsed.lastSceneIndex === "number" ? parsed.lastSceneIndex : 0,
      quizCompleted: Boolean(parsed.quizCompleted),
      quizScore: typeof parsed.quizScore === "number" ? parsed.quizScore : null,
    }
  } catch {
    return { visitedScenes: [], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
  }
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

// ============================================================================
// COMPONENTE PRINCIPAL — NOVATOS NA F1
// ============================================================================
export function NovatosPage() {
  const [viewStage, setViewStage] = useState<"opening" | "lesson" | "quiz">("opening")
  const [sceneIndex, setSceneIndex] = useState<number>(0)
  const [persisted, setPersisted] = useState<PersistedModuleState>(() => loadPersistedState())

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(MODULE_1_SCENES[0].durationSec)
  const [resourcesReady, setResourcesReady] = useState(false)

  // 3 Independent Audio Channels
  const [narrationVolume, setNarrationVolume] = useState(1.0)
  const [musicVolume, setMusicVolume] = useState(0.22)
  const [ambientVolume, setAmbientVolume] = useState(0.35)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [isMutedAll, setIsMutedAll] = useState(false)

  // UI & Accessibility toggles
  const [showTranscript, setShowTranscript] = useState(true)
  const [showAudioMixer, setShowAudioMixer] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [glossaryQuery, setGlossaryQuery] = useState("")
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null)
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
    return false
  })

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Refs for audio engines
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const webAudioCtxRef = useRef<AudioContext | null>(null)
  const ambientNodesRef = useRef<{ stop: () => void; setGain: (v: number) => void } | null>(null)
  const triggeredEventsRef = useRef<Set<string>>(new Set())

  const currentScene = MODULE_1_SCENES[sceneIndex] || MODULE_1_SCENES[0]

  // Save persisted state
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(persisted))
    } catch {
      // ignore storage errors
    }
  }, [persisted])

  // Preload first scene image & verify audio readiness
  useEffect(() => {
    const img = new Image()
    img.src = MODULE_1_SCENES[0].imageUrl
    img.onload = () => setResourcesReady(true)
    img.onerror = () => setResourcesReady(true)
    const timer = setTimeout(() => setResourcesReady(true), 800)
    return () => clearTimeout(timer)
  }, [])

  // Calculate real course progress (8 scenes = 80%, quiz completed = +20% -> 100% only after real quiz completion)
  const progressPercent = useMemo(() => {
    const scenesPart = Math.min(8, persisted.visitedScenes.length) * 10
    const quizPart = persisted.quizCompleted ? 20 : 0
    return scenesPart + quizPart
  }, [persisted])

  // Stop Web Audio ambient synthesis cleanly
  const stopAmbientEngine = useCallback(() => {
    if (ambientNodesRef.current) {
      try {
        ambientNodesRef.current.stop()
      } catch {
        // ignore
      }
      ambientNodesRef.current = null
    }
  }, [])

  // Start Web Audio ambient synthesis tailored to current scene profile
  const startAmbientEngine = useCallback(
    (profile: ModuleScene["ambientProfile"], effectiveGain: number) => {
      stopAmbientEngine()
      if (typeof window === "undefined") return
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return
        if (!webAudioCtxRef.current) {
          webAudioCtxRef.current = new AudioCtx()
        }
        const ctx = webAudioCtxRef.current
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {})
        }

        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(Math.max(0.0001, effectiveGain * 0.14), ctx.currentTime)
        masterGain.connect(ctx.destination)

        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"

        if (profile === "vintage_archive") {
          // Warm vintage projector hum
          osc1.type = "triangle"
          osc1.frequency.setValueAtTime(62, ctx.currentTime)
          osc2.type = "sine"
          osc2.frequency.setValueAtTime(124, ctx.currentTime)
          filter.frequency.setValueAtTime(220, ctx.currentTime)
        } else if (profile === "track_acceleration" || profile === "finish_flyby") {
          // F1 V6 Hybrid engine harmonic sweep
          osc1.type = "sawtooth"
          osc1.frequency.setValueAtTime(105, ctx.currentTime)
          osc1.frequency.linearRampToValueAtTime(185, ctx.currentTime + 12)
          osc2.type = "triangle"
          osc2.frequency.setValueAtTime(210, ctx.currentTime)
          osc2.frequency.linearRampToValueAtTime(370, ctx.currentTime + 12)
          filter.frequency.setValueAtTime(420, ctx.currentTime)
        } else {
          // Subtle paddock / telemetry / idle engine bed
          osc1.type = "sawtooth"
          osc1.frequency.setValueAtTime(82, ctx.currentTime)
          osc2.type = "sine"
          osc2.frequency.setValueAtTime(164, ctx.currentTime)
          filter.frequency.setValueAtTime(260, ctx.currentTime)
        }

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(masterGain)
        osc1.start()
        osc2.start()

        ambientNodesRef.current = {
          stop: () => {
            try {
              masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
              setTimeout(() => {
                try {
                  osc1.stop()
                  osc2.stop()
                  osc1.disconnect()
                  osc2.disconnect()
                } catch {
                  // ignore
                }
              }, 160)
            } catch {
              // ignore
            }
          },
          setGain: (val: number) => {
            try {
              masterGain.gain.setTargetAtTime(Math.max(0.0001, val * 0.14), ctx.currentTime, 0.1)
            } catch {
              // ignore
            }
          },
        }
      } catch {
        // ignore autoplay restrictions
      }
    },
    [stopAmbientEngine]
  )

  // Trigger synchronized discrete sound cue (Channel C) aligned with visual timeline events
  const playSynchronizedCue = useCallback(
    (cueType: "hotspot_ping" | "wheel_gun" | "start_light" | "start_launch" | "telemetry_beep") => {
      if (isMutedAll || ambientVolume <= 0.01 || typeof window === "undefined") return
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return
        if (!webAudioCtxRef.current) {
          webAudioCtxRef.current = new AudioCtx()
        }
        const ctx = webAudioCtxRef.current
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        const level = Math.min(0.12, ambientVolume * 0.16)

        if (cueType === "hotspot_ping" || cueType === "telemetry_beep") {
          osc.type = "sine"
          osc.frequency.setValueAtTime(cueType === "hotspot_ping" ? 1320 : 1046, now)
          g.gain.setValueAtTime(level * 0.6, now)
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
          osc.connect(g)
          g.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.12)
        } else if (cueType === "start_light") {
          osc.type = "sine"
          osc.frequency.setValueAtTime(880, now)
          g.gain.setValueAtTime(level * 0.85, now)
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
          osc.connect(g)
          g.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.18)
        } else if (cueType === "start_launch") {
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(140, now)
          osc.frequency.exponentialRampToValueAtTime(340, now + 0.65)
          g.gain.setValueAtTime(level * 0.9, now)
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
          osc.connect(g)
          g.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.7)
        } else if (cueType === "wheel_gun") {
          osc.type = "triangle"
          osc.frequency.setValueAtTime(420, now)
          osc.frequency.setValueAtTime(580, now + 0.06)
          osc.frequency.setValueAtTime(460, now + 0.12)
          g.gain.setValueAtTime(level * 0.75, now)
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
          osc.connect(g)
          g.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.22)
        }
      } catch {
        // ignore
      }
    },
    [ambientVolume, isMutedAll]
  )

  // Stop all audio channels cleanly (prevents overlap between scenes)
  const stopAllAudio = useCallback(() => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.pause()
    }
    stopAmbientEngine()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTime(0)
    triggeredEventsRef.current.clear()
  }, [stopAmbientEngine])

  // Sync live volumes & Auto-Ducking across Channels A, B, and C
  useEffect(() => {
    const narGain = isMutedAll ? 0 : narrationVolume
    // Auto-ducking: while Mariana is speaking (isPlaying), music & ambient duck smoothly to 35% of user slider
    const duckFactor = isPlaying ? 0.35 : 0.85
    const musGain = isMutedAll || !musicEnabled ? 0 : musicVolume * duckFactor
    const ambGain = isMutedAll ? 0 : ambientVolume * duckFactor

    if (narrationAudioRef.current) {
      narrationAudioRef.current.volume = Math.max(0, Math.min(1, narGain))
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = Math.max(0, Math.min(1, musGain))
      if (!musicEnabled || isMutedAll) {
        musicAudioRef.current.pause()
      } else if (isPlaying && musicAudioRef.current.paused) {
        musicAudioRef.current.play().catch(() => {})
      }
    }
    if (ambientNodesRef.current) {
      ambientNodesRef.current.setGain(ambGain)
    }
  }, [narrationVolume, musicVolume, ambientVolume, musicEnabled, isMutedAll, isPlaying])

  // Play or restart current scene narration + synchronized channels
  const playSceneAudio = useCallback(
    async (targetScene: ModuleScene) => {
      stopAllAudio()

      const audio = new Audio(targetScene.audioUrl)
      narrationAudioRef.current = audio
      audio.volume = isMutedAll ? 0 : narrationVolume
      setDuration(targetScene.durationSec)

      audio.ontimeupdate = () => {
        const t = audio.currentTime
        setCurrentTime(t)

        // Synchronized timeline cues per scene
        if (targetScene.number === 4) {
          for (const comp of CAR_COMPONENTS_SCENE_04) {
            const key = `c4_${comp.id}`
            if (t >= comp.appearAtSec && !triggeredEventsRef.current.has(key)) {
              triggeredEventsRef.current.add(key)
              playSynchronizedCue("hotspot_ping")
            }
          }
        } else if (targetScene.number === 5) {
          if (t >= 13.5 && !triggeredEventsRef.current.has("c5_gun1")) {
            triggeredEventsRef.current.add("c5_gun1")
            playSynchronizedCue("wheel_gun")
          }
          if (t >= 16.5 && !triggeredEventsRef.current.has("c5_gun2")) {
            triggeredEventsRef.current.add("c5_gun2")
            playSynchronizedCue("wheel_gun")
          }
        } else if (targetScene.number === 6) {
          for (let l = 1; l <= 5; l++) {
            const key = `c6_light_${l}`
            if (t >= 11.5 + l * 1.0 && !triggeredEventsRef.current.has(key)) {
              triggeredEventsRef.current.add(key)
              playSynchronizedCue("start_light")
            }
          }
          if (t >= 17.5 && !triggeredEventsRef.current.has("c6_launch")) {
            triggeredEventsRef.current.add("c6_launch")
            playSynchronizedCue("start_launch")
          }
        } else if (targetScene.number === 7) {
          for (const sec of [4.0, 9.0, 14.5]) {
            const key = `c7_beep_${sec}`
            if (t >= sec && !triggeredEventsRef.current.has(key)) {
              triggeredEventsRef.current.add(key)
              playSynchronizedCue("telemetry_beep")
            }
          }
        }
      }

      audio.onended = () => {
        setIsPlaying(false)
        setIsPaused(false)
        stopAmbientEngine()
        if (musicAudioRef.current) {
          musicAudioRef.current.pause()
        }
      }

      // Channel B: Cinematic Instrumental Track
      if (musicEnabled && !isMutedAll) {
        if (!musicAudioRef.current) {
          musicAudioRef.current = new Audio("/radio/f1_theme.mp3")
          musicAudioRef.current.loop = true
        }
        musicAudioRef.current.volume = Math.max(0, Math.min(1, musicVolume * 0.35))
        musicAudioRef.current.play().catch(() => {})
      }

      // Channel C: Ambient Track
      if (!isMutedAll && ambientVolume > 0.01) {
        startAmbientEngine(targetScene.ambientProfile, ambientVolume * 0.35)
      }

      try {
        await audio.play()
        setIsPlaying(true)
        setIsPaused(false)
      } catch {
        setIsPlaying(false)
        setIsPaused(false)
      }
    },
    [
      stopAllAudio,
      isMutedAll,
      narrationVolume,
      musicEnabled,
      musicVolume,
      ambientVolume,
      startAmbientEngine,
      stopAmbientEngine,
      playSynchronizedCue,
    ]
  )

  const handlePauseAudio = () => {
    if (narrationAudioRef.current && isPlaying) {
      narrationAudioRef.current.pause()
      if (musicAudioRef.current) musicAudioRef.current.pause()
      stopAmbientEngine()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }

  const handleResumeAudio = async () => {
    if (narrationAudioRef.current && isPaused) {
      try {
        await narrationAudioRef.current.play()
        if (musicEnabled && !isMutedAll && musicAudioRef.current) {
          musicAudioRef.current.play().catch(() => {})
        }
        if (!isMutedAll && ambientVolume > 0.01) {
          startAmbientEngine(currentScene.ambientProfile, ambientVolume * 0.35)
        }
        setIsPlaying(true)
        setIsPaused(false)
      } catch {
        // ignore
      }
    } else if (!isPlaying) {
      playSceneAudio(currentScene)
    }
  }

  const handleReplayScene = () => {
    playSceneAudio(currentScene)
  }

  // Navigate to a specific scene index
  const goToScene = useCallback(
    (idx: number, autoStartAudio = false) => {
      const clamped = Math.max(0, Math.min(MODULE_1_SCENES.length - 1, idx))
      stopAllAudio()
      setSceneIndex(clamped)
      setSelectedHotspot(null)
      setDuration(MODULE_1_SCENES[clamped].durationSec)
      setPersisted((prev) => {
        const sceneNum = MODULE_1_SCENES[clamped].number
        const nextVisited = prev.visitedScenes.includes(sceneNum)
          ? prev.visitedScenes
          : [...prev.visitedScenes, sceneNum]
        return {
          ...prev,
          visitedScenes: nextVisited,
          lastSceneIndex: clamped,
        }
      })
      if (autoStartAudio) {
        setTimeout(() => {
          playSceneAudio(MODULE_1_SCENES[clamped])
        }, 60)
      }
    },
    [stopAllAudio, playSceneAudio]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [stopAllAudio])

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase()
    if (!q) return GLOSSARY_TERMS
    return GLOSSARY_TERMS.filter(
      (g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q)
    )
  }, [glossaryQuery])

  const quizScoreCount = useMemo(() => {
    return QUIZ_QUESTIONS.reduce((acc, q) => {
      return acc + (quizAnswers[q.id] === q.correctLetter ? 1 : 0)
    }, 0)
  }, [quizAnswers])

  const handleSelectQuizOption = (questionId: number, letter: "A" | "B" | "C" | "D") => {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({ ...prev, [questionId]: letter }))
  }

  const handleFinalizeQuiz = () => {
    setQuizSubmitted(true)
    setPersisted((prev) => ({
      ...prev,
      quizCompleted: true,
      quizScore: quizScoreCount,
    }))
  }

  const handleResetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  // Starting lights state for Scene 06 (synchronized with narration time or interactive preview)
  const activeStartLights = useMemo(() => {
    if (currentScene.number !== 6) return 0
    if (!isPlaying && currentTime === 0) return 3 // static preview when audio isn't running
    if (currentTime < 12.0) return 0
    if (currentTime < 13.0) return 1
    if (currentTime < 14.0) return 2
    if (currentTime < 15.0) return 3
    if (currentTime < 16.0) return 4
    if (currentTime < 17.5) return 5
    return -1 // -1 means LIGHTS OUT (PARTIDA!)
  }, [currentScene.number, isPlaying, currentTime])

  return (
    <div className="min-h-[82vh] rounded-2xl bg-[#080A0F] text-white border border-white/10 shadow-2xl overflow-hidden relative">
      {/* SVG Filter Definitions for Heat Shimmer (Prompt 1) & Film Grain (Prompt 3) */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="f1-heat-shimmer" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025 0.08"
              numOctaves="2"
              seed="3"
              result="noise"
            >
              {!reduceMotion && (
                <animate
                  attributeName="baseFrequency"
                  values="0.025 0.08;0.032 0.11;0.025 0.08"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={reduceMotion ? 0 : 5} />
          </filter>
        </defs>
      </svg>

      {/* TOP BAR — MODULE HEADER, PROGRESS, GLOSSARY & ACCESSIBILITY CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-[#0D1017] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-[#E10600] text-white font-black text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(225,6,0,0.5)]">
            NOVATOS NA F1
          </span>
          <span className="text-xs sm:text-sm font-semibold text-white/90">
            Módulo 1: O que é a Fórmula 1?
          </span>
        </div>

        {/* Course Progress + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs"
            title="Progresso real do Módulo 1"
          >
            <span className="text-white/60">Progresso:</span>
            <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#E10600] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white">{progressPercent}%</span>
          </div>

          <button
            type="button"
            onClick={() => setReduceMotion((prev) => !prev)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
              reduceMotion
                ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/25"
            )}
            title="Ativar ou reduzir animações visuais"
          >
            <Eye className="w-3.5 h-3.5" />
            {reduceMotion ? "Animações: Reduzidas" : "Animações: Ativas"}
          </button>

          <button
            type="button"
            onClick={() => setShowAudioMixer((prev) => !prev)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
              showAudioMixer
                ? "bg-[#E10600]/20 border-[#E10600] text-white"
                : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-[#E10600]/60"
            )}
          >
            <Sliders className="w-3.5 h-3.5 text-[#E10600]" />
            Mixer de Áudio
          </button>

          <button
            type="button"
            onClick={() => setShowGlossary(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[#E10600] text-white border border-white/15 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Glossário ({GLOSSARY_TERMS.length})
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE 3-CHANNEL AUDIO MIXER PANEL */}
      {showAudioMixer && (
        <div className="px-4 sm:px-6 py-3.5 bg-[#121621] border-b border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-white">🎙️ Canal A: Narração (Mariana)</span>
              <span className="font-mono text-white/70">{Math.round(narrationVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={narrationVolume}
              onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
              className="w-full accent-[#E10600]"
              aria-label="Volume da Narração"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-white">🎵 Canal B: Trilha Cinematográfica</span>
              <span className="font-mono text-white/70">
                {musicEnabled ? `${Math.round(musicVolume * 100)}%` : "Desligada"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              disabled={!musicEnabled}
              className="w-full accent-[#E10600]"
              aria-label="Volume da Música"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-white">🏎️ Canal C: Sons Ambientes / Pista</span>
              <span className="font-mono text-white/70">{Math.round(ambientVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              className="w-full accent-[#E10600]"
              aria-label="Volume dos Sons Ambientes"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMusicEnabled((p) => !p)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-medium transition-colors",
                musicEnabled
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/60"
              )}
            >
              {musicEnabled ? "Trilha: Ativa" : "Trilha: Off"}
            </button>
            <button
              type="button"
              onClick={() => setIsMutedAll((p) => !p)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors",
                isMutedAll
                  ? "bg-rose-600/30 border-rose-500 text-rose-200"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white"
              )}
            >
              {isMutedAll ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isMutedAll ? "Silenciado" : "Silenciar Tudo"}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 1: TELA DE ABERTURA CINEMATOGRÁFICA                            */}
      {/* ==================================================================== */}
      {viewStage === "opening" && (
        <div className="relative min-h-[72vh] flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
          {/* Background Rear F1 Car with Subtle 2.5D Depth, Heat Shimmer & Pulsing Rain Light */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/backgrounds/bg-ferrari.webp"
              alt="Carro moderno de Fórmula 1 visto de trás em circuito noturno"
              className={cn(
                "w-full h-full object-cover object-center brightness-[0.55] transition-transform duration-1000",
                !reduceMotion && "animate-[pulse_12s_ease-in-out_infinite] scale-[1.02]"
              )}
            />
            {/* Heat Shimmer Distortion Zone behind Rear Wing */}
            <div
              className="absolute left-1/2 top-[22%] -translate-x-1/2 w-[320px] h-[130px] rounded-full opacity-55"
              style={{
                filter: reduceMotion ? "none" : "url(#f1-heat-shimmer)",
                background:
                  "radial-gradient(ellipse at center, rgba(255,110,30,0.22) 0%, rgba(225,6,0,0.06) 60%, transparent 100%)",
              }}
            />
            {/* Pulsing Red Rear Rain Light */}
            <div
              className={cn(
                "absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none",
                !reduceMotion && "animate-pulse"
              )}
              style={{
                background:
                  "radial-gradient(circle, rgba(255,25,25,0.85) 0%, rgba(225,6,0,0.35) 45%, transparent 75%)",
              }}
            />
            {/* Dark Cinematic Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/60 to-[#080A0F]/80" />
          </div>

          {/* Top Opening Status Pill */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-md text-xs">
              <span className="w-2 h-2 rounded-full bg-[#E10600] animate-ping" />
              <span className="font-semibold text-white">MÓDULO 1 • O QUE É A FÓRMULA 1?</span>
              <span className="text-white/50">|</span>
              <span className="text-white/75">8 Cenas Interativas + Questionário</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/10 text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {resourcesReady
                ? "Recursos prontos · Voz Oficial: Mariana (Rádio F1)"
                : "Carregando recursos de áudio e imagem…"}
            </div>
          </div>

          {/* Center Hero Title, Subtitle & CTA */}
          <div className="relative z-10 max-w-3xl my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E10600]/20 border border-[#E10600]/50 text-red-200 text-xs font-semibold mb-4">
              <img
                src="/radio/mariana.png"
                alt="Mariana"
                className="w-5 h-5 rounded-full object-cover border border-red-400"
              />
              Guiado por Mariana — Locutora Oficial da Rádio F1
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4 leading-none">
              NOVATOS NA <span className="text-[#E10600]">F1</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-200 leading-relaxed mb-8 max-w-2xl">
              Você não precisa entender de automobilismo para começar. Nós explicamos tudo, curva
              por curva.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setViewStage("lesson")
                  goToScene(0, true)
                }}
                className="px-7 py-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white font-black text-sm sm:text-base tracking-wide uppercase shadow-[0_0_30px_rgba(225,6,0,0.65)] hover:shadow-[0_0_40px_rgba(225,6,0,0.9)] transition-all flex items-center gap-3 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                COMEÇAR DO ZERO
              </button>

              {persisted.visitedScenes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setViewStage("lesson")
                    goToScene(persisted.lastSceneIndex, false)
                  }}
                  className="px-5 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all cursor-pointer"
                >
                  Continuar da Cena {persisted.lastSceneIndex + 1} de 8
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGlossary(true)}
                className="px-5 py-4 rounded-xl bg-black/60 hover:bg-white/10 text-slate-200 font-medium text-sm border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#E10600]" />
                Explorar Glossário Inicial
              </button>
            </div>
          </div>

          {/* Bottom Scene Preview Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-4 border-t border-white/10">
            {MODULE_1_SCENES.map((sc, idx) => {
              const done = persisted.visitedScenes.includes(sc.number)
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setViewStage("lesson")
                    goToScene(idx, false)
                  }}
                  className={cn(
                    "text-left p-2.5 rounded-lg border transition-all cursor-pointer",
                    done
                      ? "bg-[#E10600]/15 border-[#E10600]/50 text-white"
                      : "bg-black/50 border-white/10 text-white/70 hover:text-white hover:border-white/25"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mb-0.5">
                    <span>CENA 0{sc.number}</span>
                    {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold truncate">{sc.title}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 2: AS 8 CENAS SEQUENCIAIS DO MÓDULO 1                          */}
      {/* ==================================================================== */}
      {viewStage === "lesson" && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Scene Navigation Pills (Cena 1 de 8 .. Cena 8 de 8) */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5">
              {MODULE_1_SCENES.map((sc, idx) => {
                const isCurrent = idx === sceneIndex
                const isDone = persisted.visitedScenes.includes(sc.number)
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => goToScene(idx, false)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border",
                      isCurrent
                        ? "bg-[#E10600] text-white border-[#E10600] shadow-[0_0_15px_rgba(225,6,0,0.5)]"
                        : isDone
                        ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                        : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                    )}
                  >
                    <span>0{sc.number}</span>
                    <span className="hidden md:inline truncate max-w-[110px]">{sc.title}</span>
                  </button>
                )
              })}
            </div>

            <span className="text-xs font-mono font-bold text-white/80 shrink-0 px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Cena {currentScene.number} de {MODULE_1_SCENES.length}
            </span>
          </div>

          {/* MAIN CINEMATIC VISUAL STAGE (NO TRADITIONAL VIDEO — LAYERED 2.5D + SVG/CSS) */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black aspect-[16/9] max-h-[540px] w-full shadow-2xl">
            {/* Base High-Definition Photograph with Scene-Specific Motion Rule */}
            <img
              key={currentScene.id}
              src={currentScene.imageUrl}
              alt={`Cena 0${currentScene.number} — ${currentScene.title}`}
              className={cn(
                "w-full h-full object-cover object-center select-none transition-transform duration-700",
                !reduceMotion &&
                  currentScene.visualEffectType === "parallax_track" &&
                  "scale-[1.03]",
                !reduceMotion &&
                  currentScene.visualEffectType === "vintage_1950" &&
                  "sepia-[0.25] contrast-125"
              )}
            />

            {/* SCENE 01 OVERLAY: Rear Wing Heat Shimmer + Pulsing Red Rain Light + Sparks */}
            {currentScene.visualEffectType === "rear_shimmer" && (
              <>
                <div
                  className="absolute left-1/2 top-[22%] -translate-x-1/2 w-[300px] h-[120px] rounded-full pointer-events-none"
                  style={{
                    filter: reduceMotion ? "none" : "url(#f1-heat-shimmer)",
                    background:
                      "radial-gradient(ellipse at center, rgba(255,120,40,0.22) 0%, transparent 75%)",
                  }}
                />
                <div
                  className={cn(
                    "absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full pointer-events-none",
                    !reduceMotion && "animate-pulse"
                  )}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,20,20,0.85) 0%, rgba(225,6,0,0.3) 50%, transparent 75%)",
                  }}
                />
              </>
            )}

            {/* SCENE 02 OVERLAY: 1950 Documentary Film Grain, Dust Scratches & Projector Flicker */}
            {currentScene.visualEffectType === "vintage_1950" && (
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none",
                  !reduceMotion && "animate-[pulse_4s_ease-in-out_infinite]"
                )}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent 0, transparent 180px, rgba(255,240,200,0.07) 181px, transparent 182px)",
                  boxShadow: "inset 0 0 90px rgba(0,0,0,0.75)",
                }}
              >
                <div className="absolute top-3 left-3 px-3 py-1 rounded bg-amber-950/80 border border-amber-400/40 text-amber-200 text-xs font-mono">
                  🎞️ ARQUIVO HISTÓRICO 1950 • FIA WORLD CHAMPIONSHIP
                </div>
              </div>
            )}

            {/* SCENE 03 OVERLAY: Why Formula 1? 2.5D Parallax + Formula & 1 Badges */}
            {currentScene.visualEffectType === "parallax_track" && (
              <div className="absolute inset-x-4 top-4 flex flex-wrap justify-between gap-3 pointer-events-none">
                <div className="px-4 py-2.5 rounded-xl bg-black/80 border border-[#E10600]/60 backdrop-blur-md max-w-xs">
                  <div className="text-[11px] font-mono text-[#E10600] font-bold">
                    TERMO 1 • &ldquo;FÓRMULA&rdquo;
                  </div>
                  <div className="text-xs text-white font-medium mt-0.5">
                    Conjunto de regras técnicas e esportivas obrigatórias para todas as equipes.
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-black/80 border border-white/25 backdrop-blur-md max-w-xs">
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">
                    TERMO 2 • &ldquo;NÚMERO 1&rdquo;
                  </div>
                  <div className="text-xs text-white font-medium mt-0.5">
                    Identifica a categoria máxima de topo dentro dessa fórmula de competição.
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 04 OVERLAY: THE MACHINE — 7 SYNCHRONIZED INTERACTIVE HOTSPOTS */}
            {currentScene.visualEffectType === "machine_hotspots" && (
              <div className="absolute inset-0">
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/80 border border-white/15 text-xs text-white/90 backdrop-blur-md">
                  🔍 <strong>7 Componentes da Máquina:</strong> Acompanhe em sincronia com a Mariana
                  ou clique em cada ponto
                </div>
                {CAR_COMPONENTS_SCENE_04.map((comp) => {
                  const isHighlightedByTime =
                    !isPlaying || currentTime === 0 || currentTime >= comp.appearAtSec
                  const isSelected = selectedHotspot === comp.id
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedHotspot(comp.id)}
                      style={{ left: `${comp.x}%`, top: `${comp.y}%` }}
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-500 cursor-pointer",
                        isHighlightedByTime ? "opacity-100 scale-100" : "opacity-35 scale-90"
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-lg backdrop-blur-md transition-all",
                          isSelected
                            ? "bg-[#E10600] text-white border-white scale-110"
                            : "bg-black/85 text-white border-[#E10600] hover:bg-[#E10600]"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#E10600] group-hover:bg-white animate-ping" />
                        {comp.name}
                      </span>
                    </button>
                  )
                })}

                {/* Active Component Detail Card */}
                {selectedHotspot !== null && (
                  <div className="absolute bottom-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-3.5 rounded-xl bg-black/90 border border-[#E10600] text-xs shadow-2xl backdrop-blur-md">
                    {(() => {
                      const item = CAR_COMPONENTS_SCENE_04.find((c) => c.id === selectedHotspot)
                      if (!item) return null
                      return (
                        <>
                          <div className="flex items-center justify-between font-bold text-white mb-1">
                            <span className="text-[#E10600]">{item.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedHotspot(null)}
                              className="text-white/50 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-slate-200 leading-relaxed">{item.shortDesc}</p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* SCENE 05 OVERLAY: PILOTOS E EQUIPES (DUAL CHAMPIONSHIP & PIT STOP) */}
            {currentScene.visualEffectType === "pitstop_team" && (
              <div className="absolute inset-x-4 top-4 flex flex-wrap justify-between gap-3 pointer-events-none">
                <div className="px-4 py-2.5 rounded-xl bg-black/80 border border-[#E10600]/60 backdrop-blur-md max-w-xs">
                  <div className="text-[11px] font-mono text-[#E10600] font-bold">
                    🏆 DISPUTA 1: CAMPEONATO DE PILOTOS
                  </div>
                  <div className="text-xs text-white mt-0.5">
                    Cada piloto soma pontos individualmente em busca do título mundial.
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-black/80 border border-sky-400/50 backdrop-blur-md max-w-xs">
                  <div className="text-[11px] font-mono text-sky-300 font-bold">
                    🛠️ DISPUTA 2: CAMPEONATO DE CONSTRUTORES
                  </div>
                  <div className="text-xs text-white mt-0.5">
                    As equipes somam os pontos de seus pilotos; pit stops e estratégia são decisivos.
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 06 OVERLAY: STARTING LIGHTS GANTRY SIMULATION */}
            {currentScene.visualEffectType === "starting_grid" && (
              <div className="absolute inset-x-0 top-3 flex flex-col items-center pointer-events-none px-4">
                <div className="px-4 py-2.5 rounded-2xl bg-[#0B0D13]/95 border border-white/20 shadow-2xl flex flex-col items-center gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                    Simulação Gráfica Didática • Semáforo Oficial de Largada
                  </div>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((lightNum) => {
                      const isLit = activeStartLights >= lightNum
                      return (
                        <div
                          key={lightNum}
                          className="w-8 h-12 rounded-lg bg-black border border-white/15 flex flex-col items-center justify-around p-1"
                        >
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full transition-all duration-200",
                              isLit
                                ? "bg-[#E10600] shadow-[0_0_14px_#E10600]"
                                : "bg-red-950/40"
                            )}
                          />
                          <span
                            className={cn(
                              "w-4 h-4 rounded-full transition-all duration-200",
                              isLit
                                ? "bg-[#E10600] shadow-[0_0_14px_#E10600]"
                                : "bg-red-950/40"
                            )}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    {activeStartLights === -1
                      ? "🟢 LUZES APAGADAS — LARGADA AUTORIZADA!"
                      : `Aguardando sinal de partida (${Math.max(0, activeStartLights)}/5 luzes)…`}
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 07 OVERLAY: ILLUSTRATIVE TELEMETRY & STRATEGY MONITOR */}
            {currentScene.visualEffectType === "telemetry_wall" && (
              <div className="absolute inset-x-4 top-4 flex flex-wrap justify-between gap-3 pointer-events-none">
                <div className="p-3.5 rounded-xl bg-black/85 border border-white/20 backdrop-blur-md text-xs w-72">
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 mb-2">
                    <span>TORRE DE POSIÇÕES & PNEUS</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">
                      Exemplo Ilustrativo
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                      <span className="font-bold text-white">1. PILOTO A</span>
                      <span className="text-red-400">● Macio</span>
                      <span className="text-white/80">Líder</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                      <span className="font-bold text-white">2. PILOTO B</span>
                      <span className="text-amber-300">● Médio</span>
                      <span className="text-emerald-400">+1.2s (Box)</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                      <span className="font-bold text-white">3. PILOTO C</span>
                      <span className="text-slate-200">● Duro</span>
                      <span className="text-white/80">+3.4s</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/85 border border-emerald-500/40 backdrop-blur-md text-xs max-w-xs">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">
                    📈 RITMO E JANELA DE PARADA (EXEMPLO ILUSTRATIVO)
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    Parar no momento certo para colocar pneus novos permite ganhar posições sem
                    precisar ultrapassar diretamente na pista.
                  </p>
                </div>
              </div>
            )}

            {/* SCENE 08 OVERLAY: CHECKERED FLAG & FINISH CTA */}
            {currentScene.visualEffectType === "checkered_finish" && (
              <div className="absolute inset-x-4 top-4 flex items-center justify-between pointer-events-none">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/85 border border-emerald-400/50 text-emerald-300 text-xs font-bold shadow-lg">
                  <Flag className="w-4 h-4" />
                  BANDEIRA QUADRICULADA • FIM DAS 8 CENAS DO MÓDULO 1
                </div>
              </div>
            )}

            {/* Bottom Scene Title Overlay inside Picture Frame */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#E10600] font-bold">
                  CENA 0{currentScene.number} DE 08 • DURAÇÃO ESTIMADA: {currentScene.estimatedDurationLabel}
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-white">{currentScene.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-3xl">
                  {currentScene.shortSummary}
                </p>
              </div>
            </div>
          </div>

          {/* MARIANA NARRATION DECK + CONTROLS + SYNCHRONIZED TRANSCRIPT */}
          <div className="rounded-2xl bg-[#0E121B] border-2 border-[#E10600]/60 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Mariana Avatar & Voice Identity Badge */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/radio/mariana.png"
                    alt="Mariana — Locutora Oficial da Rádio F1"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#E10600]"
                  />
                  {isPlaying && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-white">
                      Mariana — Locutora Oficial da Rádio F1
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E10600]/20 border border-[#E10600]/50 text-[11px] font-semibold text-red-200">
                      🎙️ Voz Oficial Preservada
                    </span>
                  </div>
                  <p className="text-xs text-white/60">
                    Narração sincronizada com auto-ducking de trilha e ambiente
                  </p>
                </div>
              </div>

              {/* Dedicated Audio Playback Buttons: Reproduzir, Pausar, Retomar, Repetir */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => playSceneAudio(currentScene)}
                  className="px-3.5 py-2 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Reproduzir
                </button>

                <button
                  type="button"
                  onClick={handlePauseAudio}
                  disabled={!isPlaying}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pausar
                </button>

                <button
                  type="button"
                  onClick={handleResumeAudio}
                  disabled={isPlaying}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Retomar
                </button>

                <button
                  type="button"
                  onClick={handleReplayScene}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Repetir Cena
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscript((prev) => !prev)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer",
                    showTranscript
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 text-[#E10600]" />
                  TRANSCRIÇÃO
                </button>
              </div>
            </div>

            {/* Interactive Audio Progress Scrubber */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white/75 w-11">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 20}
                step={0.1}
                value={Math.min(currentTime, duration || 20)}
                onChange={(e) => {
                  const nextT = parseFloat(e.target.value)
                  setCurrentTime(nextT)
                  if (narrationAudioRef.current) {
                    narrationAudioRef.current.currentTime = nextT
                  }
                }}
                className="flex-1 accent-[#E10600] cursor-pointer"
                aria-label="Progresso da narração da cena"
              />
              <span className="font-mono text-xs text-white/75 w-11 text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Accessible Written Transcript */}
            {showTranscript && (
              <div className="pt-3 border-t border-white/10">
                <div className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold mb-1">
                  📝 Transcrição Completa da Narração (Cena 0{currentScene.number}):
                </div>
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                  &ldquo;{currentScene.narrationTranscript}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* SCENE NAVIGATION FOOTER + SCENE 08 FINAL CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopAllAudio()
                  setViewStage("opening")
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Voltar ao Início
              </button>

              <button
                type="button"
                onClick={() => goToScene(sceneIndex - 1, false)}
                disabled={sceneIndex === 0}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-35 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {currentScene.number < 8 ? (
                <button
                  type="button"
                  onClick={() => goToScene(sceneIndex + 1, true)}
                  className="px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer"
                >
                  Próxima Cena (0{currentScene.number + 1})
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => goToScene(0, false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/15 transition-colors cursor-pointer"
                  >
                    REVISAR A AULA
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudio()
                      setViewStage("quiz")
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_0_25px_rgba(225,6,0,0.7)] transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    FAZER QUESTIONÁRIO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 3: QUESTIONÁRIO FINAL ("TESTE SEU CONHECIMENTO")               */}
      {/* ==================================================================== */}
      {viewStage === "quiz" && (
        <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="px-2.5 py-1 rounded bg-[#E10600]/20 border border-[#E10600]/50 text-red-300 text-xs font-bold uppercase">
                Módulo 1 • Avaliação Final
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                TESTE SEU CONHECIMENTO
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-1">
                Vamos ver o que você aprendeu sobre a Fórmula 1?
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setViewStage("lesson")
                goToScene(0, false)
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 cursor-pointer"
            >
              Revisar as Cenas
            </button>
          </div>

          {/* 5 Multiple-Choice Questions with Immediate Feedback */}
          <div className="space-y-5">
            {QUIZ_QUESTIONS.map((q) => {
              const chosen = quizAnswers[q.id]
              const isCorrect = chosen === q.correctLetter
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-[#10141F] border border-white/10 space-y-3"
                >
                  <h3 className="text-sm sm:text-base font-bold text-white">{q.question}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => {
                      const isThisSelected = chosen === opt.letter
                      const showCorrectGreen =
                        chosen !== undefined && opt.letter === q.correctLetter
                      const showWrongRed =
                        isThisSelected && opt.letter !== q.correctLetter
                      return (
                        <button
                          key={opt.letter}
                          type="button"
                          onClick={() => handleSelectQuizOption(q.id, opt.letter)}
                          className={cn(
                            "text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer",
                            showCorrectGreen
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-100"
                              : showWrongRed
                              ? "bg-rose-500/20 border-rose-400 text-rose-100"
                              : isThisSelected
                              ? "bg-[#E10600]/25 border-[#E10600] text-white"
                              : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/25"
                          )}
                        >
                          <span>
                            <strong className="mr-1.5">{opt.letter})</strong>
                            {opt.text}
                          </span>
                          {showCorrectGreen && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {showWrongRed && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Immediate Feedback after choosing an option */}
                  {chosen && (
                    <div
                      className={cn(
                        "p-3 rounded-xl text-xs sm:text-sm font-medium border",
                        isCorrect
                          ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                          : "bg-amber-950/60 border-amber-500/40 text-amber-200"
                      )}
                    >
                      {isCorrect ? (
                        <span>✅ {q.feedback}</span>
                      ) : (
                        <span>
                          💡 Resposta correta: <strong>{q.correctLetter}</strong>. {q.feedback}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quiz Completion / Score Box */}
          <div className="p-6 rounded-2xl bg-[#131824] border-2 border-[#E10600]/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              {quizSubmitted ? (
                <>
                  <div className="text-xs font-mono uppercase text-emerald-400 font-bold">
                    ✅ MÓDULO 1 CONCLUÍDO E REGISTRADO
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">
                    Sua Pontuação Final: {quizScoreCount} de {QUIZ_QUESTIONS.length} acertos
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Você completou o Módulo 1 de Novatos na F1!
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-white">
                    Responda as 5 perguntas acima e clique em Concluir Módulo 1
                  </div>
                  <div className="text-xs text-white/60">
                    Respondidas: {Object.keys(quizAnswers).length} de {QUIZ_QUESTIONS.length}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                  onClick={handleFinalizeQuiz}
                  className="px-6 py-3 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 text-white font-black text-xs sm:text-sm uppercase cursor-pointer"
                >
                  Confirmar e Concluir Módulo 1
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
                  >
                    Refazer Questionário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewStage("lesson")
                      goToScene(0, false)
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
                  >
                    Revisar as Cenas
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewStage("opening")}
                    className="px-4 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-bold cursor-pointer"
                  >
                    Voltar ao Início
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DO GLOSSÁRIO INICIAL PESQUISÁVEL (12 TERMOS)                   */}
      {/* ==================================================================== */}
      {showGlossary && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Glossário Inicial de Fórmula 1"
        >
          <div className="bg-[#0E121B] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#E10600]" />
                <h2 className="text-lg font-black text-white">Glossário Inicial — Novatos na F1</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGlossary(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                aria-label="Fechar glossário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Pesquisar termo (ex.: Pit stop, Aerodinâmica, Construtores)…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#E10600]"
                />
              </div>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredGlossary.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#E10600]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{item.term}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E10600]/20 text-red-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
