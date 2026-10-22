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
  X,
  Check,
  AlertCircle,
  Clock,
  FastForward,
  Music,
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
// COMPONENTES DO CARRO NA CENA 04 — IDENTIFICAÇÃO NUMERADA DE 1 A 7
// ============================================================================
export interface CarComponentHotspot {
  id: number
  shortLabel: string
  title: string
  name: string
  shortDesc: string
  markerX: number // % horizontal position of numbered badge on 16:9 image
  markerY: number // % vertical position of numbered badge on 16:9 image
  targetX: number // % exact horizontal target point on the F1 car part
  targetY: number // % exact vertical target point on the F1 car part
  appearAtSec: number // synchronized with Mariana narration
}

export const CAR_COMPONENTS_SCENE_04: CarComponentHotspot[] = [
  {
    id: 1,
    shortLabel: "1",
    title: "Asa dianteira",
    name: "1. Asa dianteira",
    shortDesc:
      "ajuda a controlar o fluxo de ar na parte frontal do carro e contribui para o equilíbrio aerodinâmico.",
    markerX: 15.5,
    markerY: 63.5,
    targetX: 23.5,
    targetY: 63.5,
    appearAtSec: 3.2,
  },
  {
    id: 2,
    shortLabel: "2",
    title: "Asa traseira",
    name: "2. Asa traseira",
    shortDesc:
      "contribui para o equilíbrio aerodinâmico e para a geração de carga aerodinâmica.",
    markerX: 64.5,
    markerY: 36.5,
    targetX: 62.5,
    targetY: 53.5,
    appearAtSec: 5.4,
  },
  {
    id: 3,
    shortLabel: "3",
    title: "Pneus",
    name: "3. Pneus",
    shortDesc:
      "são o contato do carro com o asfalto e influenciam a aderência, a frenagem e a estratégia.",
    markerX: 49.5,
    markerY: 85.0,
    targetX: 49.5,
    targetY: 69.0,
    appearAtSec: 11.2,
  },
  {
    id: 4,
    shortLabel: "4",
    title: "Freios",
    name: "4. Freios",
    shortDesc: "permitem reduzir a velocidade e controlar a frenagem nas curvas.",
    markerX: 27.5,
    markerY: 45.0,
    targetX: 27.5,
    targetY: 62.5,
    appearAtSec: 14.5,
  },
  {
    id: 5,
    shortLabel: "5",
    title: "Halo",
    name: "5. Halo",
    shortDesc: "estrutura de proteção que ajuda a proteger a cabeça do piloto.",
    markerX: 37.5,
    markerY: 38.0,
    targetX: 41.0,
    targetY: 53.0,
    appearAtSec: 17.8,
  },
  {
    id: 6,
    shortLabel: "6",
    title: "Cockpit",
    name: "6. Cockpit",
    shortDesc: "compartimento onde o piloto se senta e controla o carro.",
    markerX: 46.0,
    markerY: 37.5,
    targetX: 44.0,
    targetY: 56.0,
    appearAtSec: 20.0,
  },
  {
    id: 7,
    shortLabel: "7",
    title: "Unidade de potência",
    name: "7. Unidade de potência",
    shortDesc:
      "conjunto que inclui o motor de combustão interna e os sistemas elétricos de propulsão.",
    markerX: 55.0,
    markerY: 37.5,
    targetX: 52.0,
    targetY: 55.0,
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
  ambientAudioUrl: string
  ambientDescription: string
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
}

export const CINEMATIC_MUSIC_URL = "/audio/novatos/modulo1/trilha_cinematografica.mp3"

export const MODULE_1_SCENES: ModuleScene[] = [
  {
    number: 1,
    id: "cena01",
    title: "A ABERTURA",
    estimatedDurationLabel: "16s",
    durationSec: 16.2,
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo1/cena01.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena01.mp3",
    ambientDescription: "Motor V6 híbrido em marcha lenta no circuito noturno, vento e arquibancada",
    shortSummary:
      "Velocidade, estratégia, talento e trabalho em equipe se encontram. Vamos entender tudo, curva por curva.",
    narrationTranscript:
      "Você está prestes a conhecer um dos esportes a motor mais tecnológicos do mundo. Aqui, velocidade, estratégia, talento e trabalho em equipe se encontram. E você não precisa saber nada sobre automobilismo para começar. Vamos entender tudo, curva por curva.",
    visualEffectType: "rear_shimmer",
  },
  {
    number: 2,
    id: "cena02",
    title: "COMO TUDO COMEÇOU",
    estimatedDurationLabel: "23s",
    durationSec: 22.9,
    imageUrl: "/novatos/modulo1/cena02_1950.jpg",
    audioUrl: "/audio/novatos/modulo1/cena02.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena02.mp3",
    ambientDescription: "Projetor cinematográfico histórico de 1950 e motores clássicos de época",
    shortSummary:
      "Em 1950 nasceu o Campeonato Mundial de Pilotos de Fórmula 1, organizado pela FIA.",
    narrationTranscript:
      "Imagine uma época em que os carros de corrida eram muito diferentes dos que conhecemos hoje. Em 1950, nasceu o Campeonato Mundial de Pilotos de Fórmula 1, organizado pela Federação Internacional do Automóvel, a FIA. Desde então, pilotos e equipes passaram a disputar corridas em diferentes circuitos pelo mundo, buscando velocidade, precisão e vitória.",
    visualEffectType: "vintage_1950",
  },
  {
    number: 3,
    id: "cena03",
    title: "POR QUE SE CHAMA FÓRMULA 1?",
    estimatedDurationLabel: "23s",
    durationSec: 22.66,
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo1/cena03.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena03.mp3",
    ambientDescription: "Aceleração de F1 em reta, trocas de marcha em alta rotação e passagem na pista",
    shortSummary:
      "‘Fórmula’ é o conjunto de regras técnicas e esportivas; ‘1’ identifica a categoria de topo.",
    narrationTranscript:
      "O nome tem um significado interessante. A palavra ‘Fórmula’ representa o conjunto de regras técnicas e esportivas que todos precisam respeitar. Já o número um identifica a categoria de topo dentro dessa fórmula de competição. Ou seja: não basta construir um carro rápido. É preciso construir um carro capaz de vencer respeitando as mesmas regras que os adversários.",
    visualEffectType: "parallax_track",
  },
  {
    number: 4,
    id: "cena04",
    title: "A MÁQUINA",
    estimatedDurationLabel: "33s",
    durationSec: 32.59,
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo1/cena04.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena04.mp3",
    ambientDescription: "Túnel de vento aerodinâmico, telemetria dos 7 componentes e giro da unidade de potência",
    shortSummary:
      "Conheça os 7 elementos fundamentais que trabalham no limite: asas, pneus, freios, halo, cockpit e unidade de potência.",
    narrationTranscript:
      "Um carro de Fórmula 1 é uma máquina projetada para trabalhar no limite. A aerodinâmica, com a asa dianteira e a asa traseira, ajuda a controlar o fluxo de ar e a gerar pressão sobre o carro, aumentando a aderência nas curvas. Os pneus fornecem contato com o asfalto, enquanto os freios ajudam a controlar a velocidade. O halo protege a cabeça do piloto dentro do cockpit. E a unidade de potência combina um motor de combustão com sistemas elétricos. Tudo precisa funcionar em conjunto para que o piloto consiga extrair o máximo desempenho.",
    visualEffectType: "machine_hotspots",
  },
  {
    number: 5,
    id: "cena05",
    title: "PILOTOS E EQUIPES",
    estimatedDurationLabel: "21s",
    durationSec: 21.43,
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo1/cena05.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena05.mp3",
    ambientDescription: "Ambiente de boxes, pistolas pneumáticas de pit stop e saída do carro",
    shortSummary:
      "Duas disputas simultâneas: o Campeonato de Pilotos e o Campeonato de Construtores.",
    narrationTranscript:
      "Na Fórmula 1, existem duas disputas acontecendo ao mesmo tempo. Os pilotos lutam pelo campeonato individual, enquanto as equipes acumulam pontos para o campeonato de construtores. E a corrida não é decidida apenas pelo pé do piloto no acelerador: estratégia, comunicação, escolha dos pneus e trabalho dos mecânicos também fazem diferença.",
    visualEffectType: "pitstop_team",
  },
  {
    number: 6,
    id: "cena06",
    title: "COMO ACONTECE UMA CORRIDA",
    estimatedDurationLabel: "26s",
    durationSec: 26.09,
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo1/cena06.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena06.mp3",
    ambientDescription: "Grid de largada, bipes oficiais das 5 luzes vermelhas e arrancada dos carros",
    shortSummary:
      "Treinos, classificação, corrida Sprint em etapas específicas e a aguardada largada do Grande Prêmio.",
    narrationTranscript:
      "Um fim de semana de Fórmula 1 pode incluir treinos, classificação e corrida principal. Em determinados fins de semana, também existe uma corrida Sprint. A classificação ajuda a definir as posições de largada. Depois da preparação, os pilotos alinham seus carros e aguardam o sinal de partida. Ao longo da corrida, disputam posições, administram os pneus e seguem as estratégias de suas equipes até a bandeirada final.",
    visualEffectType: "starting_grid",
  },
  {
    number: 7,
    id: "cena07",
    title: "O QUE OBSERVAR DURANTE A PROVA",
    estimatedDurationLabel: "23s",
    durationSec: 23.04,
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo1/cena07.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena07.mp3",
    ambientDescription: "Passagens na reta principal, sinais de telemetria e estratégia de pit wall",
    shortSummary:
      "Posição, diferença de tempo, compostos de pneus, ritmo de volta e janelas estratégicas de pit stop.",
    narrationTranscript:
      "Quando você assistir a uma corrida, observe a posição de cada piloto, a diferença de tempo para os adversários, os pneus utilizados e as paradas nos boxes. Repare também no ritmo dos carros e nas decisões das equipes. Esses detalhes ajudam a entender por que um piloto pode ganhar posições sem necessariamente ultrapassar na pista e como a estratégia influencia o resultado.",
    visualEffectType: "telemetry_wall",
  },
  {
    number: 8,
    id: "cena08",
    title: "VOCÊ ESTÁ PRONTO PARA COMEÇAR",
    estimatedDurationLabel: "21s",
    durationSec: 21.43,
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo1/cena08.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena08.mp3",
    ambientDescription: "Passagem final em alta velocidade, bandeira quadriculada e vibração do público",
    shortSummary:
      "Agora você enxerga estratégia, trabalho em equipe e tecnologia a cada volta até a bandeira quadriculada!",
    narrationTranscript:
      "A partir de agora, quando você acompanhar uma corrida, vai começar a perceber muito mais do que carros dando voltas. Vai enxergar decisões estratégicas, disputas por posição, trabalho em equipe e tecnologia. E esse é só o começo. Na próxima aula, vamos conhecer o carro de Fórmula 1 e descobrir o que faz essa máquina ser tão especial.",
    visualEffectType: "checkered_finish",
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

  // 2 Independent Audio Channels: Mariana Narration + Cinematic Soundtrack (with auto-ducking)
  const [narrationVolume, setNarrationVolume] = useState(1.0)
  const [musicVolume, setMusicVolume] = useState(0.45)
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [isMutedAll, setIsMutedAll] = useState(false)
  const [testingMusic, setTestingMusic] = useState<boolean>(false)

  // 5-Second Post-Narration Countdown State
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)
  const [countdownCanceled, setCountdownCanceled] = useState<boolean>(false)

  // Scene 06 idle light cycle so the starting semaphore is visibly alive even when audio is paused
  const [idleLightCycle, setIdleLightCycle] = useState<number>(3)

  // UI & Accessibility toggles (Transcript collapsed by default per audiovisual design)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showAudioMixer, setShowAudioMixer] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [glossaryQuery, setGlossaryQuery] = useState("")
  const [selectedHotspot, setSelectedHotspot] = useState<number>(1)
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
    return false
  })

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Refs for HTML5 Audio channels & timers
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentScene = MODULE_1_SCENES[sceneIndex] || MODULE_1_SCENES[0]
  const activeComponentObj =
    CAR_COMPONENTS_SCENE_04.find((c) => c.id === selectedHotspot) || CAR_COMPONENTS_SCENE_04[0]

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
    const timer = setTimeout(() => setResourcesReady(true), 600)
    return () => clearTimeout(timer)
  }, [])

  // Cycle Scene 06 starting lights automatically when narration is not actively driving them
  useEffect(() => {
    if (currentScene.number !== 6 || reduceMotion || isPlaying) return
    const timer = setInterval(() => {
      setIdleLightCycle((prev) => {
        if (prev >= 5) return -1
        if (prev === -1) return 1
        return prev + 1
      })
    }, 1100)
    return () => clearInterval(timer)
  }, [currentScene.number, reduceMotion, isPlaying])

  // Calculate real course progress (8 scenes = 80%, quiz completed = +20% -> 100% only after real quiz completion)
  const progressPercent = useMemo(() => {
    const scenesPart = Math.min(8, persisted.visitedScenes.length) * 10
    const quizPart = persisted.quizCompleted ? 20 : 0
    return scenesPart + quizPart
  }, [persisted])

  // Helper to clear any active 5-second countdown timer
  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdownSeconds(null)
  }, [])

  const handleCancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdownSeconds(null)
    setCountdownCanceled(true)
  }, [])

  // Stop all audio channels cleanly (prevents overlap between scenes)
  const stopAllAudio = useCallback(
    (keepBackgroundMusic = false) => {
      clearCountdownTimer()
      setTestingMusic(false)
      if (narrationAudioRef.current) {
        narrationAudioRef.current.onended = null
        narrationAudioRef.current.ontimeupdate = null
        narrationAudioRef.current.pause()
        narrationAudioRef.current.currentTime = 0
      }
      if (!keepBackgroundMusic && musicAudioRef.current) {
        musicAudioRef.current.pause()
      }
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentTime(0)
    },
    [clearCountdownTimer]
  )

  // Compute effective volumes & apply Auto-Ducking across Narration and Cinematic Soundtrack
  useEffect(() => {
    const narGain = isMutedAll ? 0 : narrationVolume
    const musicDuck = isPlaying && !testingMusic ? 0.42 : 0.92
    const musGain = isMutedAll || !musicEnabled ? 0 : Math.min(1, musicVolume * musicDuck)

    if (narrationAudioRef.current) {
      narrationAudioRef.current.volume = Math.max(0, Math.min(1, narGain))
    }
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = Math.max(0, Math.min(1, musGain))
      if (!musicEnabled || isMutedAll) {
        musicAudioRef.current.pause()
      } else if ((isPlaying || testingMusic) && musicAudioRef.current.paused) {
        musicAudioRef.current.play().catch(() => {})
      }
    }
  }, [
    narrationVolume,
    musicVolume,
    musicEnabled,
    isMutedAll,
    isPlaying,
    testingMusic,
  ])

  // Start the 5-second countdown after Mariana's narration genuinely finishes
  const startPostNarrationCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdownCanceled(false)
    setCountdownSeconds(5)
  }, [])

  // Play or restart current scene narration + synchronized cinematic soundtrack
  const playSceneAudio = useCallback(
    async (targetScene: ModuleScene) => {
      stopAllAudio(true)
      setCountdownCanceled(false)

      // Channel A: Mariana Narration (reuse DOM <audio> element for mobile unlock persistence)
      const narAudio = narrationAudioRef.current ?? new Audio()
      narrationAudioRef.current = narAudio
      if (!narAudio.src.endsWith(targetScene.audioUrl)) {
        narAudio.src = targetScene.audioUrl
      }
      narAudio.currentTime = 0
      narAudio.volume = isMutedAll ? 0 : narrationVolume
      setDuration(targetScene.durationSec)

      // Channel B: Cinematic Instrumental Track (persistent across scenes for smooth transition)
      const musAudio = musicAudioRef.current ?? new Audio(CINEMATIC_MUSIC_URL)
      musAudio.loop = true
      if (!musAudio.src.endsWith(CINEMATIC_MUSIC_URL)) {
        musAudio.src = CINEMATIC_MUSIC_URL
      }
      musicAudioRef.current = musAudio
      musAudio.volume =
        isMutedAll || !musicEnabled ? 0 : Math.min(1, musicVolume * 0.42)

      narAudio.ontimeupdate = () => {
        const t = narAudio.currentTime
        setCurrentTime(t)
        // Auto-highlight corresponding car component in Scene 04 as Mariana speaks
        if (targetScene.number === 4) {
          let activeId = 1
          for (const comp of CAR_COMPONENTS_SCENE_04) {
            if (t >= comp.appearAtSec) {
              activeId = comp.id
            }
          }
          setSelectedHotspot((prev) => (prev === activeId ? prev : activeId))
        }
      }

      narAudio.onended = () => {
        setIsPlaying(false)
        setIsPaused(false)
        startPostNarrationCountdown()
      }

      narAudio.onerror = () => {
        setIsPlaying(false)
        setIsPaused(false)
      }

      if (musicEnabled && !isMutedAll) {
        musAudio.play().catch(() => {})
      }

      try {
        await narAudio.play()
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
      startPostNarrationCountdown,
    ]
  )

  // Toggle standalone test for Cinematic Soundtrack
  const handleToggleTestMusic = useCallback(async () => {
    if (testingMusic) {
      setTestingMusic(false)
      if (!isPlaying && musicAudioRef.current) {
        musicAudioRef.current.pause()
      }
      return
    }

    setTestingMusic(true)
    setIsMutedAll(false)
    setMusicEnabled(true)
    const mus = musicAudioRef.current ?? new Audio(CINEMATIC_MUSIC_URL)
    mus.loop = true
    if (!mus.src.endsWith(CINEMATIC_MUSIC_URL)) {
      mus.src = CINEMATIC_MUSIC_URL
    }
    musicAudioRef.current = mus
    mus.volume = Math.max(0.15, Math.min(1, musicVolume * 0.92))
    await mus.play().catch(() => {})
  }, [testingMusic, isPlaying, musicVolume])

  const handlePauseAudio = () => {
    clearCountdownTimer()
    if (narrationAudioRef.current && isPlaying) {
      narrationAudioRef.current.pause()
      if (musicAudioRef.current) musicAudioRef.current.pause()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }

  const handleResumeAudio = async () => {
    clearCountdownTimer()
    setCountdownCanceled(false)
    if (narrationAudioRef.current && isPaused) {
      try {
        await narrationAudioRef.current.play()
        if (musicEnabled && !isMutedAll && musicAudioRef.current) {
          musicAudioRef.current.play().catch(() => {})
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
    clearCountdownTimer()
    setCountdownCanceled(false)
    playSceneAudio(currentScene)
  }

  // Navigate to a specific scene index
  const goToScene = useCallback(
    (idx: number, autoStartAudio = false) => {
      const clamped = Math.max(0, Math.min(MODULE_1_SCENES.length - 1, idx))
      stopAllAudio(autoStartAudio)
      setCountdownCanceled(false)
      setSceneIndex(clamped)
      setSelectedHotspot(1)
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
        }, 80)
      }
    },
    [stopAllAudio, playSceneAudio]
  )

  // Manage the 5-second countdown tick & automatic transition
  useEffect(() => {
    if (countdownSeconds === null) return

    if (countdownSeconds <= 0) {
      clearCountdownTimer()
      if (sceneIndex < MODULE_1_SCENES.length - 1) {
        goToScene(sceneIndex + 1, true)
      } else {
        stopAllAudio(false)
        setViewStage("quiz")
      }
      return
    }

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)
    countdownTimerRef.current = timer

    return () => {
      clearInterval(timer)
    }
  }, [countdownSeconds, sceneIndex, clearCountdownTimer, goToScene, stopAllAudio])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio(false)
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

  // Starting lights state for Scene 06 (synchronized with narration time or automatic idle cycle)
  const activeStartLights = useMemo(() => {
    if (currentScene.number !== 6) return 0
    if (!isPlaying && currentTime === 0) return idleLightCycle
    if (currentTime < 12.0) return 1
    if (currentTime < 13.0) return 2
    if (currentTime < 14.0) return 3
    if (currentTime < 15.0) return 4
    if (currentTime < 16.5) return 5
    return -1 // -1 means LIGHTS OUT (LARGADA!)
  }, [currentScene.number, isPlaying, currentTime, idleLightCycle])

  return (
    <div className="min-h-[82vh] rounded-2xl bg-[#080A0F] text-white border border-white/10 shadow-2xl overflow-x-hidden relative">
      {/* Persistent 2-Channel HTML5 Audio Elements (unlocked on first user gesture for mobile Safari/Chrome) */}
      <audio
        ref={narrationAudioRef}
        src={currentScene.audioUrl}
        preload="auto"
        data-channel="narration"
        className="hidden"
      />
      <audio
        ref={musicAudioRef}
        src={CINEMATIC_MUSIC_URL}
        preload="auto"
        loop
        data-channel="music"
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* GPU-ACCELERATED CSS KEYFRAMES & MOBILE-COMPATIBLE MOTION CLASSES     */}
      {/* ==================================================================== */}
      <style>{`
        @keyframes f1RearIdleMotion {
          0%, 100% { transform: translate3d(0%, 0%, 0) scale(1.03); }
          25% { transform: translate3d(-0.6%, -0.4%, 0) scale(1.045); }
          50% { transform: translate3d(0.5%, -0.8%, 0) scale(1.055); }
          75% { transform: translate3d(-0.3%, -0.3%, 0) scale(1.04); }
        }
        @keyframes f1VintageArchivePan {
          0%, 100% { transform: translate3d(-1.4%, -0.5%, 0) scale(1.06); }
          50% { transform: translate3d(1.4%, 0.6%, 0) scale(1.09); }
        }
        @keyframes f1CarTrackGlide {
          0% { transform: translate3d(-2.6%, 0.6%, 0) scale(1.065) rotate(-0.45deg); }
          35% { transform: translate3d(1.8%, -0.6%, 0) scale(1.09) rotate(0.35deg); }
          70% { transform: translate3d(-1.2%, -0.3%, 0) scale(1.075) rotate(-0.2deg); }
          100% { transform: translate3d(-2.6%, 0.6%, 0) scale(1.065) rotate(-0.45deg); }
        }
        @keyframes f1WindTunnelFloat {
          0%, 100% { transform: translate3d(0%, 0%, 0) scale(1.015); }
          50% { transform: translate3d(-0.9%, -0.7%, 0) scale(1.032); }
        }
        @keyframes f1PitBoxAction {
          0%, 100% { transform: translate3d(-1.8%, 0.4%, 0) scale(1.06); }
          45% { transform: translate3d(1.6%, -0.7%, 0) scale(1.088); }
          80% { transform: translate3d(0.4%, 0.5%, 0) scale(1.07); }
        }
        @keyframes f1GridLaunchMotion {
          0%, 100% { transform: translate3d(-2.2%, 0.5%, 0) scale(1.06); }
          50% { transform: translate3d(2.2%, -0.6%, 0) scale(1.095); }
        }
        @keyframes f1HeatWaveRise {
          0% { transform: translate3d(-50%, 6px, 0) scaleX(0.92) scaleY(0.95); opacity: 0.35; }
          50% { transform: translate3d(-48%, -10px, 0) scaleX(1.12) scaleY(1.15); opacity: 0.78; }
          100% { transform: translate3d(-52%, -24px, 0) scaleX(0.96) scaleY(0.92); opacity: 0.25; }
        }
        @keyframes f1SpeedStreaks {
          0% { background-position: 0px 0px; opacity: 0.45; }
          50% { opacity: 0.75; }
          100% { background-position: -360px 0px; opacity: 0.45; }
        }
        @keyframes f1BodySheen {
          0% { transform: translate3d(-140%, 0, 0) skewX(-25deg); }
          55%, 100% { transform: translate3d(260%, 0, 0) skewX(-25deg); }
        }
        @keyframes f1TireSmokePuff {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.85); opacity: 0.22; }
          50% { transform: translate3d(-18px, -10px, 0) scale(1.35); opacity: 0.58; }
        }
        @keyframes f1RainLightPulse {
          0%, 100% { transform: translate3d(-50%, -50%, 0) scale(0.85); opacity: 0.45; }
          50% { transform: translate3d(-50%, -50%, 0) scale(1.28); opacity: 1; }
        }
        @keyframes f1SparkRise {
          0% { transform: translate3d(0, 16px, 0) scale(0.75); opacity: 0; }
          30% { opacity: 0.95; }
          100% { transform: translate3d(-18px, -48px, 0) scale(1.25); opacity: 0; }
        }
        @keyframes f1ProjectorFlicker {
          0%, 100% { opacity: 0.16; transform: translate3d(0, 0, 0); }
          25% { opacity: 0.34; transform: translate3d(-3px, 1px, 0); }
          50% { opacity: 0.12; transform: translate3d(2px, -1px, 0); }
          75% { opacity: 0.38; transform: translate3d(-2px, 0, 0); }
        }
        @keyframes f1AeroStream {
          0% { stroke-dashoffset: 240; opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0.35; }
        }
        @keyframes f1HudScanline {
          0% { transform: translate3d(0, -100%, 0); opacity: 0.25; }
          50% { opacity: 0.65; }
          100% { transform: translate3d(0, 320%, 0); opacity: 0.25; }
        }
        @keyframes f1FlagWave {
          0%, 100% { transform: perspective(300px) rotateY(0deg) skewY(0deg) scale(1); }
          50% { transform: perspective(300px) rotateY(-16deg) skewY(4deg) scale(1.06); }
        }

        .f1-scene-motion-1 {
          will-change: transform;
          animation: f1RearIdleMotion 5.2s ease-in-out infinite;
        }
        .f1-scene-motion-2 {
          will-change: transform;
          animation: f1VintageArchivePan 7.5s ease-in-out infinite;
        }
        .f1-scene-motion-3 {
          will-change: transform;
          animation: f1CarTrackGlide 5.6s ease-in-out infinite;
        }
        .f1-scene-motion-4 {
          will-change: transform;
          animation: f1WindTunnelFloat 6.2s ease-in-out infinite;
        }
        .f1-scene-motion-5 {
          will-change: transform;
          animation: f1PitBoxAction 5.4s ease-in-out infinite;
        }
        .f1-scene-motion-6 {
          will-change: transform;
          animation: f1GridLaunchMotion 5.0s ease-in-out infinite;
        }
        .f1-scene-motion-7 {
          will-change: transform;
          animation: f1CarTrackGlide 5.2s ease-in-out infinite;
        }
        .f1-scene-motion-8 {
          will-change: transform;
          animation: f1CarTrackGlide 4.8s ease-in-out infinite;
        }
        .f1-motion-paused {
          animation: none !important;
          transform: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .f1-scene-motion-1,
          .f1-scene-motion-2,
          .f1-scene-motion-3,
          .f1-scene-motion-4,
          .f1-scene-motion-5,
          .f1-scene-motion-6,
          .f1-scene-motion-7,
          .f1-scene-motion-8 {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ==================================================================== */}
      {/* 1 & 2. CABEÇALHO COMPACTO + IDENTIFICAÇÃO DO MÓDULO E PROGRESSO      */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-3.5 sm:px-6 py-3 bg-[#0D1017] border-b border-white/10">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-1 rounded-md bg-[#E10600] text-white font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(225,6,0,0.5)] shrink-0">
              NOVATOS NA F1
            </span>
            <span className="text-xs sm:text-sm font-bold text-white/95 truncate">
              Módulo 1: O que é a Fórmula 1?
            </span>
          </div>

          {/* Mobile compact Glossary trigger */}
          <button
            type="button"
            onClick={() => setShowGlossary(true)}
            className="sm:hidden px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-[#E10600] text-white border border-white/15 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#E10600]" />
            Glossário
          </button>
        </div>

        {/* Course Progress + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs"
            title="Progresso real do Módulo 1"
          >
            <span className="text-white/60">Progresso:</span>
            <div className="w-16 sm:w-20 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#E10600] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-white">{progressPercent}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setReduceMotion((prev) => !prev)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer",
                reduceMotion
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-white/25"
              )}
              title="Ativar ou reduzir animações visuais"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{reduceMotion ? "Movimento: Reduzido" : "Movimento: Ativo"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAudioMixer((prev) => !prev)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer",
                showAudioMixer
                  ? "bg-[#E10600]/20 border-[#E10600] text-white"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-[#E10600]/60"
              )}
            >
              <Sliders className="w-3.5 h-3.5 text-[#E10600]" />
              <span>Mixer</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGlossary(true)}
              className="hidden sm:flex px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[#E10600] text-white border border-white/15 transition-colors items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Glossário ({GLOSSARY_TERMS.length})
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE TOP 2-CHANNEL AUDIO MIXER PANEL */}
      {showAudioMixer && (
        <div className="px-3.5 sm:px-6 py-3.5 bg-[#121621] border-b border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-center text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex justify-between mb-1.5">
              <span className="font-semibold text-white">🎙️ Narração (Mariana)</span>
              <span className="font-mono text-white/80">{Math.round(narrationVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={narrationVolume}
              onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
              className="w-full accent-[#E10600] cursor-pointer"
              aria-label="Volume da Narração"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-white truncate">🎵 Trilha Cinematográfica</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleTestMusic}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                    testingMusic
                      ? "bg-[#E10600] border-white text-white"
                      : "bg-white/10 border-white/20 text-white/80 hover:text-white"
                  )}
                >
                  {testingMusic ? "Parar Teste" : "Ouvir Trilha"}
                </button>
                <span className="font-mono text-white/80">
                  {musicEnabled ? `${Math.round(musicVolume * 100)}%` : "Off"}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              disabled={!musicEnabled}
              className="w-full accent-[#E10600] cursor-pointer"
              aria-label="Volume da Trilha Cinematográfica"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMusicEnabled((p) => !p)}
              className={cn(
                "px-3 py-2 rounded-lg border font-medium transition-colors cursor-pointer",
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
                "px-3 py-2 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer",
                isMutedAll
                  ? "bg-rose-600/30 border-rose-500 text-rose-200"
                  : "bg-white/5 border-white/10 text-white/80 hover:text-white"
              )}
            >
              {isMutedAll ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {isMutedAll ? "Silenciado" : "Silenciar"}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 1: TELA DE ABERTURA CINEMATOGRÁFICA (RESPONSIVA MOBILE/DESKTOP)*/}
      {/* ==================================================================== */}
      {viewStage === "opening" && (
        <div className="relative flex flex-col justify-between p-4 sm:p-10 lg:p-12 overflow-hidden">
          {/* Desktop full-bleed background / Mobile dedicated top hero visual */}
          <div className="relative sm:absolute sm:inset-0 aspect-video sm:aspect-auto rounded-2xl sm:rounded-none overflow-hidden mb-4 sm:mb-0 border border-white/15 sm:border-0 pointer-events-none">
            <img
              src="/backgrounds/bg-ferrari.webp"
              alt="Carro moderno de Fórmula 1 visto de trás em circuito noturno"
              data-testid="opening-hero-img"
              className={cn(
                "w-full h-full object-cover object-center sm:brightness-[0.52]",
                reduceMotion ? "f1-motion-paused" : "f1-scene-motion-1"
              )}
            />
            {/* Pure CSS Heat Shimmer Distortion Waves behind Rear Wing */}
            {!reduceMotion && (
              <>
                <div
                  className="absolute left-1/2 top-[22%] w-48 sm:w-72 h-16 sm:h-24 rounded-full pointer-events-none blur-md"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(255,120,30,0.34) 0%, rgba(225,6,0,0.14) 55%, transparent 80%)",
                    animation: "f1HeatWaveRise 2.1s ease-in-out infinite",
                  }}
                />
                <div
                  className="absolute left-1/2 top-[28%] w-40 sm:w-64 h-14 sm:h-20 rounded-full pointer-events-none blur-sm"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(255,190,100,0.24) 0%, transparent 75%)",
                    animation: "f1HeatWaveRise 1.6s ease-in-out infinite 0.5s",
                  }}
                />
              </>
            )}
            {/* Pulsing Red Rear Rain Light */}
            <div
              className="absolute left-1/2 top-[60%] w-16 h-16 sm:w-24 sm:h-24 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,30,30,0.95) 0%, rgba(225,6,0,0.45) 45%, transparent 75%)",
                animation: reduceMotion ? "none" : "f1RainLightPulse 1.8s ease-in-out infinite",
              }}
            />
            {/* Dark Cinematic Vignette on Desktop */}
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/65 to-[#080A0F]/80" />
          </div>

          {/* Top Opening Status Pill */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/15 backdrop-blur-md text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-[#E10600] animate-ping shrink-0" />
              <span className="font-semibold text-white">MÓDULO 1 • O QUE É A FÓRMULA 1?</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 text-[11px] sm:text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>
                {resourcesReady
                  ? "Narração Mariana + Trilha Prontas"
                  : "Carregando recursos de áudio e imagem…"}
              </span>
            </div>
          </div>

          {/* Center Hero Title, Subtitle & CTA */}
          <div className="relative z-10 max-w-3xl my-auto py-2 sm:py-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E10600]/20 border border-[#E10600]/50 text-red-200 text-xs font-semibold mb-3">
              <img
                src="/radio/mariana.png"
                alt="Mariana"
                className="w-5 h-5 rounded-full object-cover border border-red-400"
              />
              Guiado por Mariana — Locutora Oficial da Rádio F1
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 leading-tight">
              NOVATOS NA <span className="text-[#E10600]">F1</span>
            </h1>

            <p className="text-sm sm:text-xl text-slate-200 font-medium leading-relaxed mb-6 max-w-2xl">
              Você não precisa entender de automobilismo para começar. Nós explicamos tudo, curva
              por curva.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewStage("lesson")
                  goToScene(0, true)
                }}
                className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white font-black text-sm sm:text-base tracking-wide uppercase shadow-[0_0_30px_rgba(225,6,0,0.65)] hover:shadow-[0_0_40px_rgba(225,6,0,0.9)] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                COMEÇAR DO ZERO
              </button>

              {persisted.visitedScenes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setViewStage("lesson")
                    goToScene(persisted.lastSceneIndex, true)
                  }}
                  className="w-full sm:w-auto justify-center px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Continuar da Cena 0{MODULE_1_SCENES[persisted.lastSceneIndex]?.number || 1}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewStage("quiz")}
                className="w-full sm:w-auto justify-center px-4 py-3.5 rounded-xl bg-black/70 hover:bg-white/10 text-white/85 hover:text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#E10600]" />
                Ir ao Questionário
              </button>
            </div>
          </div>

          {/* Bottom 8-Scene Quick Overview Strip */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-5 mt-5 border-t border-white/10">
            {MODULE_1_SCENES.map((sc, idx) => {
              const done = persisted.visitedScenes.includes(sc.number)
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setViewStage("lesson")
                    goToScene(idx, true)
                  }}
                  className={cn(
                    "text-left p-2.5 rounded-lg border transition-all cursor-pointer",
                    done
                      ? "bg-[#E10600]/15 border-[#E10600]/50 text-white"
                      : "bg-black/60 border-white/10 text-white/75 hover:text-white hover:border-white/25"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/55 mb-0.5">
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
      {/* STAGE 2: AS 8 CENAS SEQUENCIAIS DO MÓDULO 1 (MINIMALISTA/AUDIOVISUAL)*/}
      {/* ==================================================================== */}
      {viewStage === "lesson" && (
        <div className="p-3 sm:p-6 space-y-3.5 sm:space-y-4">
          {/* ================================================================ */}
          {/* PALCO VISUAL DA CENA (COM PAINEL LATERAL NA CENA 04 NO DESKTOP)  */}
          {/* ================================================================ */}
          <div
            className={cn(
              currentScene.visualEffectType === "machine_hotspots"
                ? "grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
                : "max-w-5xl mx-auto"
            )}
          >
            {/* IMAGEM PRINCIPAL ANIMADA (PROPORÇÃO 16:9 FIXA PARA PRECISÃO DE COORDENADAS) */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden border border-white/15 bg-[#05070B] aspect-video w-full shadow-2xl",
                currentScene.visualEffectType === "machine_hotspots" && "lg:col-span-7"
              )}
              data-testid="scene-visual-stage"
            >
              {/* UNIFIED ANIMATED CANVAS: Car + Scene 04 Markers move together in lockstep */}
              <div
                key={`motion-${currentScene.id}`}
                data-testid="scene-animated-layer"
                data-scene-number={currentScene.number}
                className={cn(
                  "relative w-full h-full",
                  reduceMotion
                    ? "f1-motion-paused"
                    : `f1-scene-motion-${currentScene.number}`
                )}
              >
                <img
                  src={currentScene.imageUrl}
                  alt={`Cena 0${currentScene.number} — ${currentScene.title}`}
                  data-testid="scene-main-img"
                  className={cn(
                    "w-full h-full object-cover object-center select-none pointer-events-none",
                    currentScene.visualEffectType === "vintage_1950" && "sepia-[0.22] contrast-115"
                  )}
                />

                {/* SCENE 04 OVERLAY: Aerodynamic Streamlines + SVG Connectors + Markers 1 to 7 */}
                {currentScene.visualEffectType === "machine_hotspots" && (
                  <div className="absolute inset-0 z-[4]">
                    {/* Animated Wind-Tunnel Streamlines */}
                    {!reduceMotion && (
                      <svg
                        viewBox="0 0 800 450"
                        className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
                      >
                        <path
                          d="M 55 300 Q 230 250, 410 190 T 745 145"
                          fill="none"
                          stroke="#E10600"
                          strokeWidth="2.2"
                          strokeDasharray="18 14"
                          style={{ animation: "f1AeroStream 2.1s linear infinite" }}
                        />
                        <path
                          d="M 85 335 Q 275 290, 465 235 T 760 190"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="1.8"
                          strokeDasharray="14 18"
                          style={{ animation: "f1AeroStream 2.5s linear infinite" }}
                        />
                      </svg>
                    )}

                    {/* SVG Connector Lines & Target Dots on the Exact Car Parts */}
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      {CAR_COMPONENTS_SCENE_04.map((comp) => {
                        const isSelected = selectedHotspot === comp.id
                        return (
                          <g key={`line-${comp.id}`}>
                            <line
                              x1={comp.markerX}
                              y1={comp.markerY}
                              x2={comp.targetX}
                              y2={comp.targetY}
                              stroke={isSelected ? "#E10600" : "rgba(255,255,255,0.68)"}
                              strokeWidth={isSelected ? "0.7" : "0.38"}
                              strokeDasharray={isSelected ? "none" : "1.1 0.8"}
                            />
                            <circle
                              cx={comp.targetX}
                              cy={comp.targetY}
                              r={isSelected ? "1.35" : "0.85"}
                              fill={isSelected ? "#E10600" : "#FFFFFF"}
                              stroke="#080A0F"
                              strokeWidth="0.3"
                            />
                          </g>
                        )
                      })}
                    </svg>

                    {/* Discrete Numbered Markers 1 to 7 on the Image */}
                    {CAR_COMPONENTS_SCENE_04.map((comp) => {
                      const isHighlightedByTime =
                        !isPlaying || currentTime === 0 || currentTime >= comp.appearAtSec
                      const isSelected = selectedHotspot === comp.id
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          data-component-marker={comp.id}
                          onClick={() => setSelectedHotspot(comp.id)}
                          style={{ left: `${comp.markerX}%`, top: `${comp.markerY}%` }}
                          className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer z-10",
                            isHighlightedByTime ? "opacity-100" : "opacity-65"
                          )}
                          aria-label={`${comp.id}. ${comp.title}`}
                        >
                          <span
                            className={cn(
                              "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black border-2 shadow-lg transition-transform",
                              isSelected
                                ? "bg-[#E10600] text-white border-white scale-125 shadow-[0_0_16px_#E10600]"
                                : "bg-[#0B0E17]/90 text-white border-[#E10600] hover:bg-[#E10600] hover:scale-110"
                            )}
                          >
                            {comp.shortLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Layer 3: Visible Asphalt Speed Lines on Track Scenes */}
              {!reduceMotion &&
                (currentScene.visualEffectType === "parallax_track" ||
                  currentScene.visualEffectType === "starting_grid" ||
                  currentScene.visualEffectType === "telemetry_wall" ||
                  currentScene.visualEffectType === "checkered_finish") && (
                  <div
                    data-testid="scene-speed-streaks"
                    className="absolute inset-x-0 bottom-0 h-[36%] z-[2] pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, transparent 0px, transparent 65px, rgba(255,255,255,0.28) 65px, rgba(225,6,0,0.48) 105px, transparent 105px)",
                      backgroundSize: "360px 100%",
                      maskImage: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)",
                      WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)",
                      animation: "f1SpeedStreaks 0.95s linear infinite",
                    }}
                  />
                )}

              {/* Layer 4: Continuous Bodywork Specular Light Reflection Sweep */}
              {!reduceMotion && currentScene.visualEffectType !== "vintage_1950" && (
                <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
                  <div
                    data-testid="scene-body-sheen"
                    className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={{
                      animation: "f1BodySheen 4.8s ease-in-out infinite",
                    }}
                  />
                </div>
              )}

              {/* SCENE 01 OVERLAY: Pure-CSS Rear Wing Heat Shimmer + Pulsing Red Rain Light + Rising Sparks */}
              {currentScene.visualEffectType === "rear_shimmer" && (
                <div className="absolute inset-0 z-[3] pointer-events-none">
                  {!reduceMotion && (
                    <>
                      <div
                        className="absolute left-1/2 top-[22%] w-48 sm:w-72 h-20 sm:h-28 rounded-full blur-md"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(255,120,40,0.36) 0%, rgba(225,6,0,0.14) 55%, transparent 80%)",
                          animation: "f1HeatWaveRise 2s ease-in-out infinite",
                        }}
                      />
                      <div
                        className="absolute left-1/2 top-[28%] w-36 sm:w-56 h-14 sm:h-20 rounded-full blur-sm"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(255,200,110,0.26) 0%, transparent 75%)",
                          animation: "f1HeatWaveRise 1.5s ease-in-out infinite 0.4s",
                        }}
                      />
                    </>
                  )}
                  <div
                    className="absolute left-1/2 top-[62%] w-14 h-14 sm:w-20 sm:h-20 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,25,25,0.95) 0%, rgba(225,6,0,0.45) 50%, transparent 75%)",
                      animation: reduceMotion ? "none" : "f1RainLightPulse 1.8s ease-in-out infinite",
                    }}
                  />
                  {!reduceMotion &&
                    [18, 34, 50, 66, 82].map((leftPct, i) => (
                      <span
                        key={leftPct}
                        className="absolute bottom-[16%] w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 shadow-[0_0_10px_#E10600]"
                        style={{
                          left: `${leftPct}%`,
                          animation: `f1SparkRise ${1.8 + i * 0.35}s ease-out infinite`,
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                    ))}
                </div>
              )}

              {/* SCENE 02 OVERLAY: 1950 Documentary Film Grain, Dust Scratches & Projector Flicker */}
              {currentScene.visualEffectType === "vintage_1950" && (
                <div
                  className="absolute inset-0 z-[3] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent 0, transparent 90px, rgba(255,240,200,0.14) 91px, transparent 93px)",
                    boxShadow: "inset 0 0 70px rgba(0,0,0,0.78)",
                    animation: reduceMotion ? "none" : "f1ProjectorFlicker 2.4s infinite",
                  }}
                />
              )}

              {/* SCENE 03, 05, 06: Tire Smoke Puffs near Front/Rear Wheels */}
              {!reduceMotion &&
                (currentScene.visualEffectType === "parallax_track" ||
                  currentScene.visualEffectType === "pitstop_team" ||
                  currentScene.visualEffectType === "starting_grid") && (
                  <div className="absolute inset-0 z-[3] pointer-events-none">
                    <div
                      className="absolute left-[24%] bottom-[14%] w-24 sm:w-36 h-12 sm:h-16 rounded-full blur-md"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(240,245,255,0.42) 0%, transparent 72%)",
                        animation: "f1TireSmokePuff 2.2s ease-in-out infinite",
                      }}
                    />
                    <div
                      className="absolute right-[20%] bottom-[16%] w-28 sm:w-40 h-14 sm:h-20 rounded-full blur-md"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(240,245,255,0.36) 0%, transparent 72%)",
                        animation: "f1TireSmokePuff 2.7s ease-in-out infinite 0.6s",
                      }}
                    />
                  </div>
                )}

              {/* SCENE 06 OVERLAY: COMPACT STARTING LIGHTS SEMAPHORE AT TOP OF FRAME */}
              {currentScene.visualEffectType === "starting_grid" && (
                <div className="absolute inset-x-0 top-2.5 z-[3] flex justify-center pointer-events-none px-2">
                  <div className="px-3 py-1.5 rounded-xl bg-[#0B0D13]/90 border border-white/20 shadow-xl flex items-center gap-2 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((lightNum) => {
                        const isLit = activeStartLights >= lightNum
                        return (
                          <div
                            key={lightNum}
                            className="w-5 h-7 sm:w-6 sm:h-9 rounded bg-black border border-white/15 flex flex-col items-center justify-around p-0.5"
                          >
                            <span
                              className={cn(
                                "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-150",
                                isLit
                                  ? "bg-[#E10600] shadow-[0_0_10px_#E10600]"
                                  : "bg-red-950/40"
                              )}
                            />
                            <span
                              className={cn(
                                "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-150",
                                isLit
                                  ? "bg-[#E10600] shadow-[0_0_10px_#E10600]"
                                  : "bg-red-950/40"
                              )}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-400">
                      {activeStartLights === -1
                        ? "🟢 LARGADA!"
                        : `${Math.max(0, activeStartLights)}/5`}
                    </span>
                  </div>
                </div>
              )}

              {/* SCENE 07 OVERLAY: TELEMETRY SCANLINE & LIVE PIT WALL HUD */}
              {currentScene.visualEffectType === "telemetry_wall" && !reduceMotion && (
                <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
                  <div
                    className="w-full h-10 bg-gradient-to-b from-transparent via-[#E10600]/25 to-transparent"
                    style={{ animation: "f1HudScanline 3.2s linear infinite" }}
                  />
                </div>
              )}

              {/* SCENE 08 OVERLAY: ANIMATED WAVING CHECKERED FLAG BADGE */}
              {currentScene.visualEffectType === "checkered_finish" && (
                <div className="absolute top-3 right-3 z-[3] pointer-events-none">
                  <div
                    className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/25 text-xs font-black text-white flex items-center gap-1.5 shadow-lg"
                    style={{
                      animation: reduceMotion ? "none" : "f1FlagWave 2.2s ease-in-out infinite",
                    }}
                  >
                    <span>🏁</span>
                    <span>BANDEIRA QUADRICULADA</span>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* CENA 04: IDENTIFICAÇÃO DOS COMPONENTES DE 1 A 7                */}
            {/* No computador: painel lateral ao lado da imagem.               */}
            {/* No celular: destaque ativo + lista compacta abaixo da imagem.  */}
            {/* ============================================================== */}
            {currentScene.visualEffectType === "machine_hotspots" && (
              <div
                className="lg:col-span-5 rounded-2xl bg-[#0D111A] border border-white/15 p-3 sm:p-4 space-y-2.5 shadow-xl"
                data-testid="scene04-component-list"
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E10600]" />
                    Componentes do Carro (1 a 7)
                  </span>
                  <span className="text-[11px] text-white/60">Toque em um número</span>
                </div>

                {/* Destaque do componente selecionado no momento */}
                <div
                  className="p-2.5 sm:p-3 rounded-xl bg-[#E10600]/15 border border-[#E10600] text-xs sm:text-sm"
                  data-testid="scene04-active-component-card"
                >
                  <div className="font-black text-white">
                    {activeComponentObj.id}. {activeComponentObj.title}
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed mt-0.5">
                    <strong className="text-white">{activeComponentObj.title}</strong> —{" "}
                    {activeComponentObj.shortDesc}
                  </p>
                </div>

                {/* Lista compacta e organizada das 7 identificações */}
                <div className="grid grid-cols-1 gap-1.5">
                  {CAR_COMPONENTS_SCENE_04.map((comp) => {
                    const isSelected = selectedHotspot === comp.id
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        data-component-legend-item={comp.id}
                        onClick={() => setSelectedHotspot(comp.id)}
                        className={cn(
                          "w-full text-left p-2 sm:p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer",
                          isSelected
                            ? "bg-[#E10600]/20 border-[#E10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.28)]"
                            : "bg-black/45 border-white/10 text-slate-200 hover:bg-white/5 hover:border-white/25"
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 border",
                            isSelected
                              ? "bg-[#E10600] text-white border-white"
                              : "bg-[#141926] text-white border-[#E10600]"
                          )}
                        >
                          {comp.id}
                        </span>
                        <span className="text-xs leading-snug">
                          <strong className="font-bold text-white">{comp.title}</strong> —{" "}
                          <span className="text-slate-300">{comp.shortDesc}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* CRONÔMETRO DE 5 SEGUNDOS (QUANDO A NARRAÇÃO TERMINA)             */}
          {/* ================================================================ */}
          {countdownSeconds !== null && (
            <div
              className="rounded-2xl bg-gradient-to-r from-[#1A090D] via-[#131824] to-[#0E121B] border-2 border-[#E10600] p-4 sm:p-5 shadow-[0_0_30px_rgba(225,6,0,0.35)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E10600] text-white font-black text-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_#E10600]">
                  {countdownSeconds}
                </div>
                <div>
                  {currentScene.number < 8 ? (
                    <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#E10600]" />
                      Próxima cena em {countdownSeconds}{" "}
                      {countdownSeconds === 1 ? "segundo" : "segundos"}…
                    </div>
                  ) : (
                    <div className="text-sm sm:text-base font-black text-emerald-300">
                      🏁 Módulo concluído. Vamos testar o que você aprendeu?
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {currentScene.number < 8 ? (
                  <button
                    type="button"
                    onClick={() => goToScene(sceneIndex + 1, true)}
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Próxima cena agora
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      clearCountdownTimer()
                      stopAllAudio(false)
                      setViewStage("quiz")
                    }}
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <Award className="w-4 h-4" />
                    Fazer questionário
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 cursor-pointer min-h-[40px]"
                >
                  Cancelar contagem
                </button>
              </div>
            </div>
          )}

          {/* Last scene completion card when countdown was canceled */}
          {countdownSeconds === null && countdownCanceled && currentScene.number === 8 && (
            <div className="rounded-2xl bg-[#101923] border border-emerald-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm font-black text-emerald-300">
                🏁 Módulo concluído. Vamos testar o que você aprendeu?
              </div>
              <button
                type="button"
                onClick={() => {
                  stopAllAudio(false)
                  setViewStage("quiz")
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
              >
                <Award className="w-4 h-4" />
                Fazer questionário
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* CONTROLES DE NARRAÇÃO DA MARIANA + TRILHA CINEMATOGRÁFICA        */}
          {/* ================================================================ */}
          <div className="rounded-2xl bg-[#0E121B] border-2 border-[#E10600]/60 p-3.5 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Mariana Avatar & Voice Identity Badge */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src="/radio/mariana.png"
                    alt="Mariana — Locutora Oficial da Rádio F1"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#E10600]"
                  />
                  {isPlaying && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-white">
                      Mariana — Locutora Oficial da Rádio F1
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E10600]/20 border border-[#E10600]/50 text-[10px] font-semibold text-red-200">
                      🎙️ Voz Oficial
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Trilha musical com redução automática durante a narração
                  </p>
                </div>
              </div>

              {/* Dedicated Audio Playback Buttons + Discrete "Ver transcrição" Button */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => playSceneAudio(currentScene)}
                  className="px-3.5 py-2 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Reproduzir
                </button>

                <button
                  type="button"
                  onClick={handlePauseAudio}
                  disabled={!isPlaying}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pausar
                </button>

                <button
                  type="button"
                  onClick={handleResumeAudio}
                  disabled={isPlaying}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Play className="w-3.5 h-3.5" />
                  Retomar
                </button>

                <button
                  type="button"
                  onClick={handleReplayScene}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Repetir
                </button>

                <button
                  type="button"
                  onClick={() => setShowTranscript((prev) => !prev)}
                  className={cn(
                    "col-span-2 sm:col-span-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer min-h-[40px]",
                    showTranscript
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-white/5 border-white/10 text-white/75 hover:text-white"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 text-[#E10600]" />
                  {showTranscript ? "Ocultar transcrição" : "Ver transcrição"}
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
                  clearCountdownTimer()
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

            {/* OPTIONAL COLLAPSIBLE TRANSCRIPT (HIDDEN BY DEFAULT) */}
            {showTranscript && (
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10">
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed break-words">
                  &ldquo;{currentScene.narrationTranscript}&rdquo;
                </p>
              </div>
            )}

            {/* BALANCED 2-CHANNEL AUDIO MIXER (NARRATION + CINEMATIC SOUNDTRACK) */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    🎙️ Voz Mariana
                  </span>
                  <span className="font-mono text-white/75">
                    {Math.round(narrationVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={narrationVolume}
                  onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#E10600] cursor-pointer"
                  aria-label="Controle de volume da narração"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-white flex items-center gap-1 truncate">
                    <Music className="w-3.5 h-3.5 text-[#E10600] shrink-0" />
                    <span className="truncate">Trilha Cinematográfica</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleTestMusic}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                        testingMusic
                          ? "bg-[#E10600] border-white text-white"
                          : "bg-white/10 border-white/20 text-white/85 hover:text-white"
                      )}
                    >
                      {testingMusic ? "Parar" : "Testar"}
                    </button>
                    <span className="font-mono text-white/75">
                      {musicEnabled ? `${Math.round(musicVolume * 100)}%` : "Off"}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={musicVolume}
                  onChange={(e) => {
                    setMusicEnabled(true)
                    setMusicVolume(parseFloat(e.target.value))
                  }}
                  className="w-full accent-[#E10600] cursor-pointer"
                  aria-label="Controle de volume da trilha cinematográfica"
                />
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* INDICADOR DE CENA E NAVEGAÇÃO INFERIOR (ÚNICO E SEM DUPLICAÇÃO)  */}
          {/* ================================================================ */}
          <div className="rounded-2xl bg-[#0D1017] border border-white/10 p-3 sm:p-4 space-y-3">
            {/* Scene Sequence Indicator (01 to 08) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                {MODULE_1_SCENES.map((sc, idx) => {
                  const isCurrent = idx === sceneIndex
                  const isDone = persisted.visitedScenes.includes(sc.number)
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => goToScene(idx, true)}
                      className={cn(
                        "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border min-h-[36px]",
                        isCurrent
                          ? "bg-[#E10600] text-white border-[#E10600] shadow-[0_0_15px_rgba(225,6,0,0.5)]"
                          : isDone
                          ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                          : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                      )}
                    >
                      <span>0{sc.number}</span>
                      <span className="hidden lg:inline truncate max-w-[115px]">{sc.title}</span>
                    </button>
                  )
                })}
              </div>

              <span className="text-xs font-mono font-bold text-white/90 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 self-start sm:self-auto shrink-0">
                Cena {currentScene.number} de {MODULE_1_SCENES.length}
              </span>
            </div>

            {/* Bottom Navigation Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAllAudio(false)
                    setViewStage("opening")
                  }}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer min-h-[42px]"
                >
                  Voltar ao Início
                </button>

                <button
                  type="button"
                  onClick={() => goToScene(sceneIndex - 1, true)}
                  disabled={sceneIndex === 0}
                  className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-35 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer min-h-[42px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => setShowGlossary(true)}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/85 hover:text-white text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[42px]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#E10600]" />
                  Glossário
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {currentScene.number < 8 ? (
                  <button
                    type="button"
                    onClick={() => goToScene(sceneIndex + 1, true)}
                    className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer min-h-[42px]"
                  >
                    Próxima Cena (0{currentScene.number + 1})
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => goToScene(0, true)}
                      className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/15 transition-colors cursor-pointer min-h-[42px]"
                    >
                      REVISAR A AULA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopAllAudio(false)
                        setViewStage("quiz")
                      }}
                      className="flex-1 sm:flex-initial justify-center px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-[0_0_25px_rgba(225,6,0,0.7)] transition-all cursor-pointer min-h-[42px]"
                    >
                      <Award className="w-4 h-4" />
                      FAZER QUESTIONÁRIO
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 3: QUESTIONÁRIO FINAL ("TESTE SEU CONHECIMENTO")               */}
      {/* ==================================================================== */}
      {viewStage === "quiz" && (
        <div className="p-4 sm:p-10 max-w-4xl mx-auto space-y-6">
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
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 cursor-pointer min-h-[40px]"
            >
              Revisar as Cenas
            </button>
          </div>

          {/* 5 Multiple-Choice Questions with Immediate Feedback */}
          <div className="space-y-4 sm:space-y-5">
            {QUIZ_QUESTIONS.map((q) => {
              const chosen = quizAnswers[q.id]
              const isCorrect = chosen === q.correctLetter
              return (
                <div
                  key={q.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#10141F] border border-white/10 space-y-3"
                >
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {q.question}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt) => {
                      const isThisSelected = chosen === opt.letter
                      const showCorrectGreen =
                        chosen !== undefined && opt.letter === q.correctLetter
                      const showWrongRed = isThisSelected && opt.letter !== q.correctLetter
                      return (
                        <button
                          key={opt.letter}
                          type="button"
                          onClick={() => handleSelectQuizOption(q.id, opt.letter)}
                          className={cn(
                            "text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer min-h-[44px]",
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
                          {showCorrectGreen && (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {showWrongRed && (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
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
          <div className="p-5 sm:p-6 rounded-2xl bg-[#131824] border-2 border-[#E10600]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            <div className="flex flex-wrap items-center gap-2.5">
              {!quizSubmitted ? (
                <button
                  type="button"
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                  onClick={handleFinalizeQuiz}
                  className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 text-white font-black text-xs sm:text-sm uppercase cursor-pointer min-h-[44px]"
                >
                  Confirmar e Concluir Módulo 1
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer min-h-[40px]"
                  >
                    Refazer Questionário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewStage("lesson")
                      goToScene(0, false)
                    }}
                    className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer min-h-[40px]"
                  >
                    Revisar as Cenas
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewStage("opening")}
                    className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-bold cursor-pointer min-h-[40px]"
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Glossário Inicial de Fórmula 1"
        >
          <div className="bg-[#0E121B] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#E10600]" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Glossário Inicial — Novatos na F1
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGlossary(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Fechar glossário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Pesquisar termo (ex.: Pit stop, Aerodinâmica, Construtores)…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#E10600]"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
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
