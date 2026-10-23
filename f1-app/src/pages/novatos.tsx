import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
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
  Award,
  Search,
  X,
  AlertCircle,
  Maximize2,
  Minimize2,
  Wind,
  Sparkles,
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
    definition: "Fórmula 1, categoria de automobilismo de mais alto nível tecnológico e esportivo.",
  },
  {
    id: "piloto",
    term: "Piloto",
    category: "Geral",
    definition: "Atleta de alto rendimento que conduz o carro no limite da física.",
  },
  {
    id: "equipe",
    term: "Equipe / Construtor",
    category: "Geral",
    definition: "Organização responsável pelo projeto do carro, pela operação nos boxes e pela estratégia de corrida.",
  },
  {
    id: "grid",
    term: "Grid de largada",
    category: "Pista",
    definition: "Posições ordenadas em que os carros alinham na reta principal para iniciar o GP.",
  },
  {
    id: "classificacao",
    term: "Classificação (Qualifying)",
    category: "Pista",
    definition: "Sessão que determina a ordem de largada através das voltas mais rápidas.",
  },
  {
    id: "pitstop",
    term: "Pit stop",
    category: "Pista",
    definition: "Parada estratégica nos boxes para troca de pneus e eventuais reparos em menos de 2,5 segundos.",
  },
  {
    id: "pneus",
    term: "Pneus",
    category: "Carro",
    definition: "Compostos de borracha (Macio, Médio, Duro ou Chuva) que geram a aderência mecânica no asfalto.",
  },
  {
    id: "aerodinamica",
    term: "Aerodinâmica (Downforce & Arrasto)",
    category: "Carro",
    definition: "Controle do fluxo de ar para pressionar o carro contra o solo sem criar resistência excessiva.",
  },
  {
    id: "unidade_potencia",
    term: "Unidade de potência",
    category: "Carro",
    definition: "Conjunto propulsor híbrido formado pelo motor V6 turbo e sistemas elétricos de recuperação de energia.",
  },
  {
    id: "campeonato_pilotos",
    term: "Campeonato de pilotos",
    category: "Campeonato",
    definition: "Disputa individual onde os pilotos acumulam pontos a cada corrida até a consagração do campeão mundial.",
  },
  {
    id: "campeonato_construtores",
    term: "Campeonato de construtores",
    category: "Campeonato",
    definition: "Classificação que soma os pontos dos dois carros de cada equipe pelo troféu anual.",
  },
  {
    id: "bandeira_quadriculada",
    term: "Bandeira quadriculada",
    category: "Pista",
    definition: "Sinal visual oficial agitado na linha de chegada indicando o encerramento da corrida.",
  },
]

// ============================================================================
// DADOS DE TABELAS ILUSTRATIVAS F1 2026 (MÓDULO 1)
// ============================================================================
export const ILLUSTRATIVE_DRIVERS_CHAMPIONSHIP = [
  { pos: 1, code: "VER", name: "Max Verstappen", team: "Red Bull Racing", pts: 320, color: "#3671C6" },
  { pos: 2, code: "NOR", name: "Lando Norris", team: "McLaren", pts: 295, color: "#FF8000" },
  { pos: 3, code: "LEC", name: "Charles Leclerc", team: "Ferrari", pts: 270, color: "#E8002D" },
  { pos: 4, code: "HAM", name: "Lewis Hamilton", team: "Ferrari", pts: 210, color: "#E8002D" },
  { pos: 5, code: "PIA", name: "Oscar Piastri", team: "McLaren", pts: 195, color: "#FF8000" },
]

export const ILLUSTRATIVE_CONSTRUCTORS_CHAMPIONSHIP = [
  { pos: 1, team: "MCLAREN", pts: 490, color: "#FF8000" },
  { pos: 2, team: "FERRARI", pts: 480, color: "#E8002D" },
  { pos: 3, team: "RED BULL RACING", pts: 385, color: "#3671C6" },
  { pos: 4, team: "MERCEDES", pts: 290, color: "#27F4D2" },
]

export const ILLUSTRATIVE_RACE_TIMING = [
  { pos: 1, code: "VER", gap: "LÍDER", int: "LÍDER", color: "#3671C6", tire: "M" },
  { pos: 2, code: "NOR", gap: "+0.850", int: "+0.850", color: "#FF8000", tire: "H" },
  { pos: 3, code: "LEC", gap: "+2.120", int: "+1.270", color: "#E8002D", tire: "M" },
  { pos: 4, code: "PIA", gap: "+4.450", int: "+2.330", color: "#FF8000", tire: "H" },
  { pos: 5, code: "HAM", gap: "+5.910", int: "+1.460", color: "#E8002D", tire: "S" },
]

// ============================================================================
// ESTRUTURA GERAL DE CENAS
// ============================================================================
export interface ModuleScene {
  number: number
  id: string
  title: string
  estimatedDurationLabel: string
  durationSec: number
  imageUrl: string
  audioUrl: string
  ambientAudioUrl?: string
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
    | "mod2_machine_overview"
    | "mod2_aerodynamics"
    | "mod2_tires"
    | "mod2_steering_wheel"
    | "mod2_brakes"
    | "mod2_power_unit"
    | "mod2_setup_strategy"
    | "mod2_full_integration"
}

export const CINEMATIC_MUSIC_URL = "/audio/novatos/modulo1/trilha_cinematografica.mp3"

// ============================================================================
// CENAS DO MÓDULO 1 — O QUE É A FÓRMULA 1?
// ============================================================================
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
    estimatedDurationLabel: "28s",
    durationSec: 28.1,
    imageUrl: "/novatos/modulo1/cena02_1950.jpg",
    audioUrl: "/audio/novatos/modulo1/cena02.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena02.mp3",
    ambientDescription: "Ambiente histórico de Silverstone 1950 com textura acústica vintage",
    shortSummary:
      "Em 1950, nasceu o Campeonato Mundial de Pilotos organizado pela FIA, disputado em circuitos pelo mundo.",
    narrationTranscript:
      "Imagine uma época em que os carros de corrida eram muito diferentes dos que conhecemos hoje. Em 1950, nasceu o Campeonato Mundial de Pilotos de Fórmula 1, organizado pela Federação Internacional do Automóvel, a FIA. Desde então, pilotos e equipes passaram a disputar corridas em diferentes circuitos pelo mundo, buscando velocidade, precisão e vitória.",
    visualEffectType: "vintage_1950",
  },
  {
    number: 3,
    id: "cena03",
    title: "POR QUE SE CHAMA FÓRMULA 1?",
    estimatedDurationLabel: "23s",
    durationSec: 23.5,
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo1/cena03.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena03.mp3",
    ambientDescription: "Deslocamento de ar em alta velocidade e público ao fundo",
    shortSummary:
      "A palavra 'Fórmula' representa o conjunto de regras técnicas; o '1' identifica a categoria de topo.",
    narrationTranscript:
      "O nome tem um significado interessante. A palavra ‘Fórmula’ representa o conjunto de regras técnicas e esportivas que todos precisam respeitar. Já o número um identifica a categoria de topo dentro dessa fórmula de competição. Ou seja: não basta construir um carro rápido. É preciso construir um carro capaz de vencer respeitando as mesmas regras que os adversários.",
    visualEffectType: "parallax_track",
  },
  {
    number: 4,
    id: "cena04",
    title: "A MÁQUINA",
    estimatedDurationLabel: "31s",
    durationSec: 31.8,
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo1/cena04.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena04.mp3",
    ambientDescription: "Zumbido eletrônico dos sistemas de bordo e ressonância do motor híbrido",
    shortSummary:
      "Aerodinâmica, pneus, freios, halo, cockpit e unidade de potência trabalhando em conjunto no limite.",
    narrationTranscript:
      "Um carro de Fórmula 1 é uma máquina projetada para trabalhar no limite. A aerodinâmica ajuda a controlar o fluxo de ar e a gerar pressão sobre o carro, aumentando a aderência nas curvas. Os pneus fornecem contato com o asfalto, enquanto os freios ajudam a controlar a velocidade. A unidade de potência combina um motor de combustão com sistemas elétricos. Tudo precisa funcionar em conjunto para que o piloto consiga extrair o máximo desempenho.",
    visualEffectType: "machine_hotspots",
  },
  {
    number: 5,
    id: "cena05",
    title: "PILOTOS E EQUIPES",
    estimatedDurationLabel: "27s",
    durationSec: 27.2,
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo1/cena05.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena05.mp3",
    ambientDescription: "Pistolas pneumáticas nos boxes e comunicação de rádio",
    shortSummary:
      "Duas disputas simultâneas: pilotos pelo título individual e equipes pelo Campeonato de Construtores.",
    narrationTranscript:
      "Na Fórmula 1, existem duas disputas acontecendo ao mesmo tempo. Os pilotos lutam pelo campeonato individual, enquanto as equipes acumulam pontos para o campeonato de construtores. E a corrida não é decidida apenas pelo pé do piloto no acelerador: estratégia, comunicação, escolha dos pneus e trabalho dos mecânicos também fazem diferença.",
    visualEffectType: "pitstop_team",
  },
  {
    number: 6,
    id: "cena06",
    title: "COMO ACONTECE UMA CORRIDA",
    estimatedDurationLabel: "32s",
    durationSec: 32.4,
    imageUrl: "/backgrounds/bg-racingbulls.webp",
    audioUrl: "/audio/novatos/modulo1/cena06.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena06.mp3",
    ambientDescription: "Bipes do semáforo de largada das 5 luzes e subida de giro dos motores",
    shortSummary:
      "Treinos, classificação, formação do grid e a corrida principal até a bandeirada final.",
    narrationTranscript:
      "Um fim de semana de Fórmula 1 pode incluir treinos, classificação e corrida principal. Em determinados fins de semana, também existe uma corrida Sprint. A classificação ajuda a definir as posições de largada. Depois da preparação, os pilotos alinham seus carros e aguardam o sinal de partida. Ao longo da corrida, disputam posições, administram os pneus e seguem as estratégias de suas equipes até a bandeirada final.",
    visualEffectType: "starting_grid",
  },
  {
    number: 7,
    id: "cena07",
    title: "O QUE OBSERVAR DURANTE A PROVA",
    estimatedDurationLabel: "26s",
    durationSec: 26.9,
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo1/cena07.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena07.mp3",
    ambientDescription: "Teclados e telas do pit wall e bipes suaves de telemetria",
    shortSummary:
      "Posições, diferenças de tempo, compostos de pneus, ritmo e estratégia de paradas nos boxes.",
    narrationTranscript:
      "Quando você assistir a uma corrida, observe a posição de cada piloto, a diferença de tempo para os adversários, os pneus utilizados e as paradas nos boxes. Repare também no ritmo dos carros e nas decisões das equipes. Esses detalhes ajudam a entender por que um piloto pode ganhar posições sem necessariamente ultrapassar na pista e como a estratégia influencia o resultado.",
    visualEffectType: "telemetry_wall",
  },
  {
    number: 8,
    id: "cena08",
    title: "VOCÊ ESTÁ PRONTO PARA COMEÇAR",
    estimatedDurationLabel: "20s",
    durationSec: 20.2,
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo1/cena08.mp3",
    ambientAudioUrl: "/audio/novatos/modulo1/ambiente_cena08.mp3",
    ambientDescription: "Passagem final em alta velocidade, bandeira quadriculada e vibração do público",
    shortSummary:
      "Agora você enxerga estratégia, trabalho em equipe e tecnologia a cada volta até a bandeirada quadriculada!",
    narrationTranscript:
      "A partir de agora, quando você acompanhar uma corrida, vai começar a perceber muito mais do que carros dando voltas. Vai enxergar decisões estratégicas, disputas por posição, trabalho em equipe e tecnologia. E esse é só o começo. Na próxima aula, vamos conhecer o carro de Fórmula 1 e descobrir o que faz essa máquina ser tão especial.",
    visualEffectType: "checkered_finish",
  },
]

// ============================================================================
// CENAS DO MÓDULO 2 — A MÁQUINA (COMO FUNCIONA UM CARRO DE F1)
// ============================================================================
export const MODULE_2_SCENES: ModuleScene[] = [
  {
    number: 1,
    id: "m2_cena01",
    title: "A MÁQUINA POR INTEIRO",
    estimatedDurationLabel: "22s",
    durationSec: 22.3,
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo2/cena01.mp3",
    ambientDescription: "Harmonia dos sistemas de um carro de Fórmula 1",
    shortSummary:
      "A velocidade não depende somente da potência do motor. Aerodinâmica, pneus, freios, equilíbrio e energia trabalham juntos.",
    narrationTranscript:
      "A velocidade de um carro de Fórmula 1 não depende somente da potência do motor. Aerodinâmica, pneus, freios, equilíbrio, eletrônica, gerenciamento de energia e o trabalho de toda a equipe precisam funcionar em perfeita harmonia. Uma mudança milimétrica em uma asa ou na pressão dos pneus pode transformar completamente o comportamento e o rendimento de todo o conjunto na pista.",
    visualEffectType: "mod2_machine_overview",
  },
  {
    number: 2,
    id: "m2_cena02",
    title: "AERODINÂMICA: DOWNFORCE E ARRASTO",
    estimatedDurationLabel: "28s",
    durationSec: 27.8,
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo2/cena02.mp3",
    ambientDescription: "Fluxo aerodinâmico, asas e assoalho com efeito solo",
    shortSummary:
      "O ar empurra o carro contra o asfalto (downforce) gerando aderência, mas cria resistência (arrasto/drag) nas retas.",
    narrationTranscript:
      "Ao se deslocar em alta velocidade, o ar exerce forças intensas sobre o carro. A aerodinâmica trabalha para gerar carga aerodinâmica, conhecida como downforce, empurrando o carro contra o asfalto. Isso aumenta a aderência dos pneus e permite contornar curvas muito mais rápido. Porém, o ar também cria resistência ao avanço, o chamado arrasto ou drag, que freia o carro nas retas. O grande desafio dos engenheiros é equilibrar máxima carga com o menor arrasto possível.",
    visualEffectType: "mod2_aerodynamics",
  },
  {
    number: 3,
    id: "m2_cena03",
    title: "PNEUS: O CONTATO COM A PISTA",
    estimatedDurationLabel: "33s",
    durationSec: 32.6,
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo2/cena03.mp3",
    ambientDescription: "Compostos macios, médios, duros e pneus de chuva",
    shortSummary:
      "A temperatura e o composto determinam a aderência. O melhor pneu nem sempre é o mais macio, mas o que melhor se adapta à situação.",
    narrationTranscript:
      "Os quatro pneus são o único ponto de contato entre o carro e o asfalto. A temperatura de trabalho é fundamental: pneus frios não têm aderência, e superaquecidos se desgastam rapidamente. Compostos macios oferecem aderência imediata, mas duram menos. Compostos médios buscam equilíbrio, e os duros priorizam durabilidade para longos períodos. Em dias de pista molhada, entram os pneus intermediários e de chuva com sulcos para drenar água. Mas lembre-se: o melhor pneu nem sempre é o mais macio, e sim o que melhor se adapta à situação da corrida.",
    visualEffectType: "mod2_tires",
  },
  {
    number: 4,
    id: "m2_cena04",
    title: "COCKPIT E VOLANTE: O CENTRO DE COMANDO",
    estimatedDurationLabel: "28s",
    durationSec: 28.4,
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo2/cena04.mp3",
    ambientDescription: "Volante de corrida, visor digital e controles do piloto",
    shortSummary:
      "Um computador de bordo com dezenas de ajustes: marchas, equilíbrio de freio, energia híbrida, rádio e visor de telemetria.",
    narrationTranscript:
      "O volante de um Fórmula 1 é um verdadeiro computador de bordo. Ele não serve apenas para direcionar o carro: reúne dezenas de comandos e telas de telemetria. Por trás dele ficam as borboletas de troca de marcha. Na parte frontal, o piloto ajusta o equilíbrio de freios entre a frente e a traseira, gerencia a entrega de potência e o consumo de energia elétrica, aciona o rádio para falar com os engenheiros e acompanha marchas, velocidade e tempos de volta no visor central.",
    visualEffectType: "mod2_steering_wheel",
  },
  {
    number: 5,
    id: "m2_cena05",
    title: "FREIOS: CONTROLAR A VELOCIDADE",
    estimatedDurationLabel: "26s",
    durationSec: 25.8,
    imageUrl: "/backgrounds/bg-racingbulls.webp",
    audioUrl: "/audio/novatos/modulo2/cena05.mp3",
    ambientDescription: "Discos de carbono a 1000°C e dutos de ventilação",
    shortSummary:
      "Freios de carbono transformam energia em calor extremo. Dutos de ventilação e equilíbrio entre eixos garantem estabilidade nas curvas.",
    narrationTranscript:
      "Tão importante quanto acelerar é saber desacelerar no ponto exato. Os freios de carbono transformam a energia do movimento em calor extremo, podendo ultrapassar mil graus. Para suportar essa temperatura, dutos de refrigeração direcionam o fluxo de ar direto para os discos e pinças. Ao frear, o piloto também ajusta o equilíbrio entre os eixos dianteiro e traseiro para manter o carro estável antes de apontar para o ápice da curva.",
    visualEffectType: "mod2_brakes",
  },
  {
    number: 6,
    id: "m2_cena06",
    title: "UNIDADE DE POTÊNCIA HÍBRIDA",
    estimatedDurationLabel: "27s",
    durationSec: 27.2,
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo2/cena06.mp3",
    ambientDescription: "Motor V6 turbo, motores elétricos MGU e bateria",
    shortSummary:
      "Combustão interna aliada a sistemas elétricos de recuperação cinética e térmica, gerando potência sustentada e eficiente.",
    narrationTranscript:
      "O coração do Fórmula 1 moderno é uma unidade de potência híbrida de altíssima eficiência. Ela combina um motor de combustão interna com sistemas elétricos avançados. Durante as frenagens e pela aceleração, sistemas elétricos recuperam energia cinética e térmica que seriam desperdiçadas, armazenando essa carga em uma bateria especial. Essa energia elétrica é então liberada estrategicamente para fornecer centenas de cavalos extras de potência instantânea.",
    visualEffectType: "mod2_power_unit",
  },
  {
    number: 7,
    id: "m2_cena07",
    title: "ACERTO DO CARRO E ESTRATÉGIA",
    estimatedDurationLabel: "27s",
    durationSec: 26.8,
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo2/cena07.mp3",
    ambientDescription: "Configurações de suspensão, asas e planejamento de boxes",
    shortSummary:
      "O acerto adapta a mecânica do carro às características do circuito. A estratégia comanda paradas, pneus e ritmo de corrida.",
    narrationTranscript:
      "Cada circuito do calendário exige um acerto único. Em pistas com retas longas, as equipes reduzem as asas para cortar o arrasto. Em traçados travados e cheios de curvas, aumentam a carga aerodinâmica para grudar o carro no chão. Além disso, existe uma diferença fundamental: o acerto adapta a mecânica do carro antes da prova, enquanto a estratégia decide quando parar nos boxes, quais pneus usar e quando atacar ou poupar equipamento durante a corrida.",
    visualEffectType: "mod2_setup_strategy",
  },
  {
    number: 8,
    id: "m2_cena08",
    title: "TUDO TRABALHANDO JUNTO",
    estimatedDurationLabel: "21s",
    durationSec: 20.5,
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo2/cena08.mp3",
    ambientDescription: "Integração total dos sistemas, piloto e engenharia em ritmo de corrida",
    shortSummary:
      "A velocidade não vem de uma única peça, mas da fusão precisa de aerodinâmica, pneus, freios, energia e decisões em cada volta.",
    narrationTranscript:
      "Agora você já sabe que a velocidade de um carro de Fórmula 1 não vem de uma única peça. Ela nasce da combinação precisa entre aerodinâmica, pneus, freios, gerenciamento de energia, acerto mecânico e as decisões estratégicas da equipe em cada volta. Na pista, piloto e máquina funcionam como um só organismo no limite da física.",
    visualEffectType: "mod2_full_integration",
  },
]

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 1 (5 PERGUNTAS)
// ============================================================================
export interface QuizQuestion {
  id: number
  question: string
  options: { letter: "A" | "B" | "C" | "D"; text: string }[]
  correctLetter: "A" | "B" | "C" | "D"
  feedback: string
}

export const MODULE_1_QUIZ_QUESTIONS: QuizQuestion[] = [
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

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 2 (10 PERGUNTAS EQUILIBRADAS)
// ============================================================================
export const MODULE_2_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — Qual é a função principal da carga aerodinâmica (downforce) em um carro de Fórmula 1?",
    options: [
      { letter: "A", text: "Economizar combustível ao reduzir o peso do carro." },
      { letter: "B", text: "Empurrar o carro contra o solo para aumentar a aderência dos pneus nas curvas." },
      { letter: "C", text: "Evitar que os pneus atinjam altas temperaturas." },
      { letter: "D", text: "Substituir a necessidade do sistema de freios." },
    ],
    correctLetter: "B",
    feedback:
      "Exatamente! O downforce atua como um peso invisível que pressiona os pneus contra o solo, garantindo estabilidade e alta velocidade nas curvas.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que é o arrasto aerodinâmico (drag) e qual compromisso ele exige dos engenheiros?",
    options: [
      { letter: "A", text: "É uma pressão vertical que aumenta a frenagem sem afetar as retas." },
      { letter: "B", text: "É a força de sustentação que levanta as rodas dianteiras do asfalto." },
      { letter: "C", text: "É a resistência do ar ao avanço do carro, exigindo equilíbrio entre velocidade de reta e downforce nas curvas." },
      { letter: "D", text: "É o calor gerado pela turbulência do escapamento." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! O arrasto é a resistência que o ar impõe ao avanço do veículo. Asas maiores dão mais curvas, mas 'seguram' o carro nas retas.",
  },
  {
    id: 3,
    question: "Pergunta 3 — Por que o pneu mais macio nem sempre é a escolha ideal para toda a corrida?",
    options: [
      { letter: "A", text: "Porque é proibido pelos regulamentos em circuitos secos." },
      { letter: "B", text: "Porque, apesar da alta aderência imediata, desgasta-se e superaquece mais rápido, exigindo paradas prematuras." },
      { letter: "C", text: "Porque só funciona em temperaturas abaixo de zero." },
      { letter: "D", text: "Porque reduz a rotação do motor híbrido em linha reta." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! O melhor pneu nem sempre é o mais macio, mas sim o que oferece a combinação ideal de aderência e durabilidade para a estratégia adotada.",
  },
  {
    id: 4,
    question: "Pergunta 4 — Qual é a diferença fundamental entre os pneus slick e os pneus de chuva?",
    options: [
      { letter: "A", text: "Pneus slick são vazados para diminuir a pressão interna." },
      { letter: "B", text: "Pneus de chuva são completamente lisos para escorregar melhor." },
      { letter: "C", text: "Pneus de chuva possuem sulcos profundos para evacuar a água da pista e evitar aquaplanagem." },
      { letter: "D", text: "Pneus de chuva são fabricados com composto de borracha metálica." },
    ],
    correctLetter: "C",
    feedback:
      "Muito bem! Os pneus slick são totalmente lisos para maximizar o contato com a pista seca, enquanto os de chuva têm canais capazes de drenar até 85 litros de água por segundo.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Além de virar o carro, que outras operações cruciais são feitas pelo piloto no volante?",
    options: [
      { letter: "A", text: "Apenas buzinar e acionar o limpador de para-brisa." },
      { letter: "B", text: "Trocar de marcha, ajustar o equilíbrio de freio, gerenciar energia elétrica, falar no rádio e ler a telemetria." },
      { letter: "C", text: "Trocar os pneus e reabastecer combustível em movimento." },
      { letter: "D", text: "Controlar remotamente os sensores dos carros adversários." },
    ],
    correctLetter: "B",
    feedback:
      "Exato! O volante de F1 é um centro de comando computadorizado onde o piloto monitora centenas de parâmetros e calibra o carro curva a curva.",
  },
  {
    id: 6,
    question: "Pergunta 6 — Por que os freios de carbono de um Fórmula 1 exigem dutos de refrigeração eficientes?",
    options: [
      { letter: "A", text: "Para evitar que o sistema congele nas retas mais longas." },
      { letter: "B", text: "Porque operam sob temperaturas extremas de até 1.000°C e precisam de fluxo de ar para não perder eficácia ou falhar." },
      { letter: "C", text: "Para injetar ar nos pneus durante as reduções de marcha." },
      { letter: "D", text: "Para refrigerar o ar condicionado do cockpit." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! A desaceleração de 350 para 80 km/h em poucos metros gera calor brutal. Sem ar fresco nos dutos, os discos de carbono superaquecem e perdem potência de parada.",
  },
  {
    id: 7,
    question: "Pergunta 7 — De quais componentes principais é formada a moderna Unidade de Potência híbrida da F1?",
    options: [
      { letter: "A", text: "Apenas um motor elétrico alimentado por painéis solares." },
      { letter: "B", text: "Um motor de combustão interna V6 turbo integrado a sistemas elétricos de recuperação de energia e bateria." },
      { letter: "C", text: "Um motor a pistão tradicional a diesel com tração integral." },
      { letter: "D", text: "Dois motores a gasolina independentes sem qualquer auxílio elétrico." },
    ],
    correctLetter: "B",
    feedback:
      "Exatamente! A Unidade de Potência combina a força térmica do V6 turbo com geradores elétricos inteligentes que armazenam e liberam energia em acelerações.",
  },
  {
    id: 8,
    question: "Pergunta 8 — Como a Unidade de Potência recupera energia que seria desperdiçada na pista?",
    options: [
      { letter: "A", text: "Conectando cabos elétricos durante as paradas nos boxes." },
      { letter: "B", text: "Capturando a energia cinética gerada nas frenagens e a energia térmica dos gases do escapamento." },
      { letter: "C", text: "Instalando hélices de vento nas laterais da asa dianteira." },
      { letter: "D", text: "Através da eletricidade estática gerada pelo atrito dos macacões dos pilotos." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! Sistemas elétricos recuperam energia térmica dos gases e cinética das frenagens, recarregando a bateria para fornecer mais de 160 cavalos adicionais.",
  },
  {
    id: 9,
    question: "Pergunta 9 — Qual é a diferença prática entre o 'acerto do carro' (setup) e a 'estratégia de corrida'?",
    options: [
      { letter: "A", text: "O acerto define a pintura do carro; a estratégia define a ordem dos mecânicos." },
      { letter: "B", text: "O acerto calibra a mecânica e asas para o traçado; a estratégia planeja paradas de box, compostos e ritmo de prova." },
      { letter: "C", text: "São sinônimos que representam a mesma decisão de largada." },
      { letter: "D", text: "O acerto é decidido pelos comissários da FIA; a estratégia é exclusiva do patrocinador." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! O acerto adapta a máquina à física da pista antes da prova; a estratégia gerencia as táticas e tomadas de decisão dinâmicas durante as voltas.",
  },
  {
    id: 10,
    question: "Pergunta 10 — O que determina, em última análise, o tempo de volta e a vitória de um Fórmula 1?",
    options: [
      { letter: "A", text: "Apenas a habilidade isolada do piloto, independente da engenharia da equipe." },
      { letter: "B", text: "Exclusivamente a velocidade máxima alcançada na reta principal." },
      { letter: "C", text: "A integração harmoniosa entre aerodinâmica, pneus, freios, unidade híbrida, piloto e decisões da equipe." },
      { letter: "D", text: "Apenas a quantidade de combustível colocada no tanque antes da volta de apresentação." },
    ],
    correctLetter: "C",
    feedback:
      "Parabéns! Na Fórmula 1 moderna, o resultado nasce da sinergia impecável entre a melhor engenharia, a pilotagem no limite e o planejamento tático de cada membro da equipe.",
  },
]

// ============================================================================
// CHAVES DE LOCALSTORAGE
// ============================================================================
const STORAGE_MOD1_KEY = "f1_novatos_mod1_state_v1"
const STORAGE_MOD2_KEY = "f1_novatos_mod2_state_v1"
const STORAGE_ACTIVE_MODULE_KEY = "f1_novatos_active_module_v1"

interface PersistedModuleState {
  visitedScenes: number[]
  lastSceneIndex: number
  quizCompleted: boolean
  quizScore: number | null
}

function loadPersistedState(key: string): PersistedModuleState {
  if (typeof window === "undefined") {
    return { visitedScenes: [1], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
  }
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { visitedScenes: [1], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
    const parsed = JSON.parse(raw)
    return {
      visitedScenes: Array.isArray(parsed.visitedScenes) ? parsed.visitedScenes : [1],
      lastSceneIndex: typeof parsed.lastSceneIndex === "number" ? parsed.lastSceneIndex : 0,
      quizCompleted: Boolean(parsed.quizCompleted),
      quizScore: typeof parsed.quizScore === "number" ? parsed.quizScore : null,
    }
  } catch {
    return { visitedScenes: [1], lastSceneIndex: 0, quizCompleted: false, quizScore: null }
  }
}


export function NovatosPage() {
  // ==========================================================================
  // ESTADO DO MÓDULO ATIVO (MÓDULO 1 OU MÓDULO 2)
  // ==========================================================================
  const [activeModuleId, setActiveModuleId] = useState<1 | 2>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const modParam = urlParams.get("modulo") || urlParams.get("mod")
      if (modParam === "2") return 2
      const saved = localStorage.getItem(STORAGE_ACTIVE_MODULE_KEY)
      if (saved === "2") return 2
    }
    return 1
  })

  const currentScenes = activeModuleId === 1 ? MODULE_1_SCENES : MODULE_2_SCENES
  const currentQuizQuestions = activeModuleId === 1 ? MODULE_1_QUIZ_QUESTIONS : MODULE_2_QUIZ_QUESTIONS
  const currentStorageKey = activeModuleId === 1 ? STORAGE_MOD1_KEY : STORAGE_MOD2_KEY

  // Stage: "opening" (Hero Landing), "lesson" (Scenes 1-8), "quiz" (Final Test)
  const [viewStage, setViewStage] = useState<"opening" | "lesson" | "quiz">("opening")

  // Scene Navigation
  const [sceneIndex, setSceneIndex] = useState(0)
  const currentScene = currentScenes[sceneIndex] || currentScenes[0]

  // Persisted progress
  const [visitedScenes, setVisitedScenes] = useState<number[]>([1])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // 5-Second Post-Narration Countdown State
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)

  // Playback & Audio Controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isMusicActive, setIsMusicActive] = useState(true)

  // Independent Volume Sliders
  const [narrationVolume, setNarrationVolume] = useState(1.0)
  const [musicVolume, setMusicVolume] = useState(0.28)
  const [ambientVolume, setAmbientVolume] = useState(0.18)

  // Accessibility & UI Modals
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [glossarySearch, setGlossarySearch] = useState("")
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Interactive Scene States — Module 1
  const [mod1ActiveComponent, setMod1ActiveComponent] = useState<number | null>(null)

  // Interactive Scene States — Module 2
  const [m2Hotspot, setM2Hotspot] = useState<number>(1)
  const [m2AeroZone, setM2AeroZone] = useState<"front_wing" | "floor" | "rear_wing">("front_wing")
  const [m2AeroMode, setM2AeroMode] = useState<"downforce" | "drag">("downforce")
  const [m2TireCompound, setM2TireCompound] = useState<"soft" | "medium" | "hard">("soft")
  const [m2TireType, setM2TireType] = useState<"slick" | "wet">("slick")
  const [m2SteeringPin, setM2SteeringPin] = useState<number>(1)
  const [m2BrakeZone, setM2BrakeZone] = useState<"disc" | "cooling">("disc")
  const [m2BrakeStep, setM2BrakeStep] = useState<number>(2)
  const [m2PowerUnitPart, setM2PowerUnitPart] = useState<number>(1)
  const [m2SetupScenario, setM2SetupScenario] = useState<"straights" | "corners" | "rain">("straights")
  const [m2SummaryCard, setM2SummaryCard] = useState<number | null>(null)

  // Quiz State
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [quizSelectedOption, setQuizSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [quizShowFeedback, setQuizShowFeedback] = useState(false)

  // Audio References
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null)
  const radioAudioRef = useRef<HTMLAudioElement | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Web Audio API References
  const audioContextRef = useRef<AudioContext | null>(null)
  const narrationGainRef = useRef<GainNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)
  const narrationSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const ambientSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const isAudioContextInitRef = useRef<boolean>(false)

  // ==========================================================================
  // INICIALIZAÇÃO DE ÁUDIO WEB AUDIO API COM GAIN NODES
  // ==========================================================================
  const initWebAudioContext = useCallback(() => {
    if (typeof window === "undefined") return
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx()
      }
    }

    const ctx = audioContextRef.current
    if (!ctx) return

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {})
    }

    if (!isAudioContextInitRef.current) {
      try {
        if (narrationAudioRef.current && !narrationSourceRef.current) {
          narrationSourceRef.current = ctx.createMediaElementSource(narrationAudioRef.current)
          narrationGainRef.current = ctx.createGain()
          narrationSourceRef.current.connect(narrationGainRef.current)
          narrationGainRef.current.connect(ctx.destination)
        }

        if (musicAudioRef.current && !musicSourceRef.current) {
          musicSourceRef.current = ctx.createMediaElementSource(musicAudioRef.current)
          musicGainRef.current = ctx.createGain()
          musicSourceRef.current.connect(musicGainRef.current)
          musicGainRef.current.connect(ctx.destination)
        }

        if (ambientAudioRef.current && !ambientSourceRef.current) {
          ambientSourceRef.current = ctx.createMediaElementSource(ambientAudioRef.current)
          ambientGainRef.current = ctx.createGain()
          ambientSourceRef.current.connect(ambientGainRef.current)
          ambientGainRef.current.connect(ctx.destination)
        }

        isAudioContextInitRef.current = true
      } catch (err) {
        console.warn("Web Audio API GainNodes já conectados ou indisponíveis:", err)
      }
    }

    // Aplica volumes imediatamente
    const currentNarrationVol = isMuted ? 0 : narrationVolume
    const currentMusicVol = isMuted || !isMusicActive ? 0 : musicVolume
    const currentAmbientVol = isMuted || activeModuleId === 2 ? 0 : ambientVolume

    if (narrationGainRef.current) {
      narrationGainRef.current.gain.setValueAtTime(currentNarrationVol, ctx.currentTime)
    } else if (narrationAudioRef.current) {
      narrationAudioRef.current.volume = currentNarrationVol
    }

    if (musicGainRef.current) {
      musicGainRef.current.gain.setValueAtTime(currentMusicVol, ctx.currentTime)
    } else if (musicAudioRef.current) {
      musicAudioRef.current.volume = currentMusicVol
    }

    if (ambientGainRef.current) {
      ambientGainRef.current.gain.setValueAtTime(currentAmbientVol, ctx.currentTime)
    } else if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = currentAmbientVol
    }
  }, [isMuted, isMusicActive, narrationVolume, musicVolume, ambientVolume, activeModuleId])

  // Carrega estado persistido
  useEffect(() => {
    const state = loadPersistedState(currentStorageKey)
    setVisitedScenes(state.visitedScenes)
    setQuizCompleted(state.quizCompleted)
    setQuizScore(state.quizScore)
  }, [currentStorageKey])

  // Troca de módulo (Módulo 1 vs Módulo 2)
  const handleSelectModule = useCallback(
    (modId: 1 | 2) => {
      if (modId === activeModuleId) return
      // Para áudios e timers
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
      setCountdownSeconds(null)
      setIsPlaying(false)

      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause()
        narrationAudioRef.current.currentTime = 0
      }
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause()
        ambientAudioRef.current.currentTime = 0
      }

      setActiveModuleId(modId)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_MODULE_KEY, String(modId))
        const url = new URL(window.location.href)
        url.searchParams.set("modulo", String(modId))
        window.history.replaceState({}, "", url.toString())
      }

      // Carrega estado do novo módulo
      const targetKey = modId === 1 ? STORAGE_MOD1_KEY : STORAGE_MOD2_KEY
      const s = loadPersistedState(targetKey)
      setVisitedScenes(s.visitedScenes)
      setSceneIndex(s.lastSceneIndex < (modId === 1 ? MODULE_1_SCENES.length : MODULE_2_SCENES.length) ? s.lastSceneIndex : 0)
      setQuizCompleted(s.quizCompleted)
      setQuizScore(s.quizScore)
      setViewStage("opening")
    },
    [activeModuleId]
  )

  // Salva progresso no localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const payload: PersistedModuleState = {
      visitedScenes,
      lastSceneIndex: sceneIndex,
      quizCompleted,
      quizScore,
    }
    localStorage.setItem(currentStorageKey, JSON.stringify(payload))
  }, [visitedScenes, sceneIndex, quizCompleted, quizScore, currentStorageKey])

  // Suporte a prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Auto-Ducking: ajusta volume da música e ambiente em tempo real
  useEffect(() => {
    const ctx = audioContextRef.current
    const now = ctx ? ctx.currentTime : 0

    const targetNarration = isMuted ? 0 : narrationVolume
    let targetMusic = isMuted || !isMusicActive ? 0 : musicVolume
    let targetAmbient = isMuted || activeModuleId === 2 ? 0 : ambientVolume

    // Quando Mariana fala, a música abaixa para 22%
    if (isPlaying && targetNarration > 0) {
      targetMusic = targetMusic * 0.22
      targetAmbient = targetAmbient * 0.4
    }

    if (ctx && isAudioContextInitRef.current) {
      if (narrationGainRef.current) {
        narrationGainRef.current.gain.cancelScheduledValues(now)
        narrationGainRef.current.gain.linearRampToValueAtTime(targetNarration, now + 0.15)
      }
      if (musicGainRef.current) {
        musicGainRef.current.gain.cancelScheduledValues(now)
        musicGainRef.current.gain.linearRampToValueAtTime(targetMusic, now + 0.25)
      }
      if (ambientGainRef.current) {
        ambientGainRef.current.gain.cancelScheduledValues(now)
        ambientGainRef.current.gain.linearRampToValueAtTime(targetAmbient, now + 0.25)
      }
    } else {
      if (narrationAudioRef.current) narrationAudioRef.current.volume = targetNarration
      if (musicAudioRef.current) musicAudioRef.current.volume = targetMusic
      if (ambientAudioRef.current) ambientAudioRef.current.volume = targetAmbient
    }
  }, [isPlaying, isMuted, isMusicActive, narrationVolume, musicVolume, ambientVolume, activeModuleId])

  // Limpa o timer de contagem regressiva
  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdownSeconds(null)
  }, [])

  const handleCancelCountdown = useCallback(() => {
    clearCountdownTimer()
  }, [clearCountdownTimer])

  // Para todo o áudio da cena
  const stopAllAudio = useCallback(() => {
    clearCountdownTimer()
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
    }
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause()
      ambientAudioRef.current.currentTime = 0
    }
    if (radioAudioRef.current) {
      radioAudioRef.current.pause()
      radioAudioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }, [clearCountdownTimer])

  // Navega para uma cena específica
  const goToScene = useCallback(
    (index: number) => {
      if (index < 0 || index >= currentScenes.length) return
      stopAllAudio()
      setSceneIndex(index)
      setVisitedScenes((prev) => (prev.includes(index + 1) ? prev : [...prev, index + 1]))
      setViewStage("lesson")
      setMod1ActiveComponent(null)
      setM2Hotspot(1)
      setM2SummaryCard(null)
    },
    [currentScenes.length, stopAllAudio]
  )

  // Inicia a contagem regressiva de 5 segundos após término REAL da narração
  const startPostNarrationCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdownSeconds(5)
  }, [])

  // Gerencia o tick da contagem regressiva de 5 segundos
  useEffect(() => {
    if (countdownSeconds === null) return

    if (countdownSeconds <= 0) {
      clearCountdownTimer()
      if (sceneIndex < currentScenes.length - 1) {
        goToScene(sceneIndex + 1)
      } else {
        stopAllAudio()
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
  }, [countdownSeconds, sceneIndex, currentScenes.length, clearCountdownTimer, goToScene, stopAllAudio])

  // Reproduzir / Pausar Narração e Trilha
  const handleTogglePlay = useCallback(() => {
    initWebAudioContext()
    clearCountdownTimer()

    if (isPlaying) {
      if (narrationAudioRef.current) narrationAudioRef.current.pause()
      if (ambientAudioRef.current) ambientAudioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (musicAudioRef.current && isMusicActive && !isMuted) {
        musicAudioRef.current.play().catch(() => {})
      }
      if (ambientAudioRef.current && activeModuleId === 1 && !isMuted) {
        ambientAudioRef.current.play().catch(() => {})
      }
      if (narrationAudioRef.current) {
        narrationAudioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      }
    }
  }, [initWebAudioContext, clearCountdownTimer, isPlaying, isMusicActive, isMuted, activeModuleId])

  // Reiniciar Cena Atual
  const handleReplayScene = useCallback(() => {
    initWebAudioContext()
    clearCountdownTimer()
    if (narrationAudioRef.current) {
      narrationAudioRef.current.currentTime = 0
      narrationAudioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
    if (ambientAudioRef.current && activeModuleId === 1) {
      ambientAudioRef.current.currentTime = 0
      ambientAudioRef.current.play().catch(() => {})
    }
  }, [initWebAudioContext, clearCountdownTimer, activeModuleId])

  // Iniciar Experiência
  const handleStartExperience = useCallback(() => {
    initWebAudioContext()
    clearCountdownTimer()
    setViewStage("lesson")
    goToScene(0)
  }, [initWebAudioContext, clearCountdownTimer, goToScene])

  // Atalho de teclado para fechar tela cheia com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImageFullscreen) {
        setIsImageFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isImageFullscreen])

  // Termos filtrados do glossário
  const filteredGlossary = useMemo(() => {
    if (!glossarySearch.trim()) return GLOSSARY_TERMS
    const q = glossarySearch.toLowerCase()
    return GLOSSARY_TERMS.filter((t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q))
  }, [glossarySearch])


  // ==========================================================================
  // RENDERIZADOR DE EFEITOS E INTERATIVIDADE ESPECÍFICOS POR CENA
  // ==========================================================================
  const renderVisualOverlay = () => {
    // ------------------------------------------------------------------------
    // MÓDULO 1: O QUE É A FÓRMULA 1?
    // ------------------------------------------------------------------------
    if (activeModuleId === 1) {
      if (currentScene.visualEffectType === "rear_shimmer") {
        return (
          <>
            <div className="pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#E10600]/80 shadow-[0_0_35px_#E10600] animate-pulse" />
            <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff] animate-ping opacity-75" />
            <div className="pointer-events-none absolute bottom-[22%] left-[44%] w-[12%] h-[15%] bg-gradient-to-t from-orange-500/10 via-transparent to-transparent backdrop-blur-[1.5px] opacity-80" />
          </>
        )
      }

      if (currentScene.visualEffectType === "vintage_1950") {
        return (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.65)_100%)] opacity-85" />
        )
      }

      if (currentScene.visualEffectType === "machine_hotspots") {
        const components = [
          { id: 1, name: "Asa dianteira", top: "72%", left: "18%" },
          { id: 2, name: "Asa traseira", top: "28%", left: "82%" },
          { id: 3, name: "Pneus", top: "66%", left: "32%" },
          { id: 4, name: "Freios", top: "62%", left: "38%" },
          { id: 5, name: "Halo", top: "42%", left: "50%" },
          { id: 6, name: "Cockpit", top: "48%", left: "54%" },
          { id: 7, name: "Unidade de potência", top: "46%", left: "68%" },
        ]

        return (
          <>
            {components.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setMod1ActiveComponent(mod1ActiveComponent === c.id ? null : c.id)}
                style={{ top: c.top, left: c.left }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg",
                  mod1ActiveComponent === c.id
                    ? "bg-[#E10600] text-white ring-2 ring-white scale-110 shadow-[0_0_20px_rgba(225,6,0,0.8)]"
                    : "bg-black/85 text-white border border-white/30 hover:border-[#E10600] hover:scale-105"
                )}
              >
                <span className="w-4 h-4 rounded-full bg-[#E10600] text-white flex items-center justify-center text-[10px] font-black">
                  {c.id}
                </span>
                <span className="hidden sm:inline font-bold">{c.name}</span>
              </button>
            ))}
          </>
        )
      }

      if (currentScene.visualEffectType === "pitstop_team") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-64 max-w-[85vw] bg-black/85 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Classificação F1 2026</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E10600] text-white font-bold">PILOTOS</span>
            </div>
            <div className="space-y-1">
              {ILLUSTRATIVE_DRIVERS_CHAMPIONSHIP.slice(0, 4).map((d) => (
                <div key={d.pos} className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded hover:bg-white/5 font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-zinc-400 font-bold w-4">{d.pos}</span>
                    <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-black text-white">{d.code}</span>
                  </div>
                  <span className="font-bold text-zinc-300">{d.pts} PTS</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      if (currentScene.visualEffectType === "starting_grid") {
        return (
          <div className="absolute top-4 inset-x-0 z-20 flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/90 border border-white/20 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((light) => (
                  <div
                    key={light}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#E10600] shadow-[0_0_15px_#E10600] animate-pulse"
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-black uppercase text-zinc-300">
                LARGADA F1
              </span>
            </div>
          </div>
        )
      }

      if (currentScene.visualEffectType === "telemetry_wall") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-64 max-w-[85vw] bg-black/85 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Torre de Tempos</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">AO VIVO</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {ILLUSTRATIVE_RACE_TIMING.slice(0, 4).map((r) => (
                <div key={r.pos} className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold w-3">{r.pos}</span>
                    <span className="font-black text-white">{r.code}</span>
                    <span className="text-[9px] px-1 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {r.tire}
                    </span>
                  </div>
                  <span className="text-zinc-300 font-bold text-[11px]">{r.gap}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      if (currentScene.visualEffectType === "checkered_finish") {
        return (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 border border-white/20 shadow-xl backdrop-blur-md">
            <div className="w-5 h-5 rounded bg-white text-black font-black text-center text-xs leading-5">🏁</div>
            <span className="text-xs font-black uppercase tracking-wider text-white">Bandeirada Final</span>
          </div>
        )
      }

      return null
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2: A MÁQUINA (COMO FUNCIONA UM CARRO DE F1)
    // ------------------------------------------------------------------------
    if (activeModuleId === 2) {
      // CENA 1: A MÁQUINA POR INTEIRO
      if (currentScene.visualEffectType === "mod2_machine_overview") {
        const m2Components = [
          { id: 1, name: "Asa Dianteira", top: "72%", left: "20%", text: "Controla o fluxo inicial de ar e gera carga frontal." },
          { id: 2, name: "Pneus", top: "66%", left: "34%", text: "Aderência mecânica e contato essencial com o asfalto." },
          { id: 3, name: "Cockpit", top: "46%", left: "52%", text: "Célula de sobrevivência e central de controle do piloto." },
          { id: 4, name: "Freios", top: "62%", left: "40%", text: "Discos de carbono que suportam desaceleração de 5G e 1000°C." },
          { id: 5, name: "Unidade de Potência", top: "48%", left: "68%", text: "Motor V6 turbo híbrido com recuperação de energia elétrica." },
        ]

        const activeComp = m2Components.find((c) => c.id === m2Hotspot) || m2Components[0]

        return (
          <>
            {m2Components.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setM2Hotspot(c.id)}
                style={{ top: c.top, left: c.left }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xl",
                  m2Hotspot === c.id
                    ? "bg-[#E10600] text-white ring-2 ring-white scale-110 shadow-[0_0_24px_rgba(225,6,0,0.8)]"
                    : "bg-black/85 text-white border border-white/30 hover:border-[#E10600]"
                )}
              >
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-black">
                  {c.id}
                </span>
                <span className="hidden sm:inline font-bold uppercase">{c.name}</span>
              </button>
            ))}

            {/* Info Card Flutuante */}
            <div className="absolute bottom-3 inset-x-3 sm:bottom-5 sm:left-5 sm:right-auto z-20 sm:w-80 bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/15">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Componente Selecionado</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black uppercase">
                  {activeComp.id}. {activeComp.name}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">{activeComp.text}</p>
            </div>
          </>
        )
      }

      // CENA 2: AERODINÂMICA: DOWNFORCE E ARRASTO
      if (currentScene.visualEffectType === "mod2_aerodynamics") {
        const aeroZones = {
          front_wing: {
            title: "Asa Dianteira",
            desc: "Organiza o ar inicial que passa por cima e por baixo do carro, alimentando os túneis de efeito solo.",
          },
          floor: {
            title: "Assoalho & Efeito Solo",
            desc: "Gera a maior parte da carga aerodinâmica (downforce) sem produzir arrasto excessivo nas retas.",
          },
          rear_wing: {
            title: "Asa Traseira",
            desc: "Pressiona a traseira contra o chão para tração em curvas, mas impõe resistência ao avanço em retas.",
          },
        }

        return (
          <>
            {/* Streamlines animadas em SVG */}
            <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-60 z-10" viewBox="0 0 1000 600" fill="none">
              <path d="M 50,380 Q 250,360 400,320 T 750,260 T 950,220" stroke="#00E5FF" strokeWidth="2.5" strokeDasharray="8 6" className={!reduceMotion ? "animate-pulse" : ""} />
              <path d="M 50,420 Q 300,410 500,400 T 800,380 T 950,370" stroke="#00E5FF" strokeWidth="2" strokeDasharray="10 8" />
              <path d="M 50,450 Q 350,470 650,460 T 950,440" stroke="#E10600" strokeWidth="2" strokeDasharray="6 4" />
            </svg>

            {/* Painel de Controle Aerodinâmico */}
            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Análise de Fluxo</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">AERODINÂMICA</span>
              </div>

              {/* Botões das 3 Áreas */}
              <div className="grid grid-cols-3 gap-1 mb-2.5">
                {(["front_wing", "floor", "rear_wing"] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setM2AeroZone(zone)}
                    className={cn(
                      "py-1.5 px-1 rounded text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                      m2AeroZone === zone ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                    )}
                  >
                    {zone === "front_wing" ? "Asa Diant." : zone === "floor" ? "Assoalho" : "Asa Tras."}
                  </button>
                ))}
              </div>

              <div className="text-xs text-zinc-200 mb-3 bg-white/5 p-2 rounded-lg border border-white/10">
                <span className="font-black text-cyan-400 block mb-0.5">{aeroZones[m2AeroZone].title}:</span>
                {aeroZones[m2AeroZone].desc}
              </div>

              {/* Comparação Downforce vs Arrasto */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setM2AeroMode("downforce")}
                  className={cn(
                    "flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer text-center",
                    m2AeroMode === "downforce" ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-400"
                  )}
                >
                  🟢 Downforce (Curvas)
                </button>
                <button
                  type="button"
                  onClick={() => setM2AeroMode("drag")}
                  className={cn(
                    "flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer text-center",
                    m2AeroMode === "drag" ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-400"
                  )}
                >
                  🔵 Arrasto (Retas)
                </button>
              </div>
            </div>
          </>
        )
      }

      // CENA 3: PNEUS: O CONTATO COM A PISTA
      if (currentScene.visualEffectType === "mod2_tires") {
        const tiresData = {
          soft: { label: "MACIO (Soft)", color: "#E10600", grip: "Máxima (100%)", life: "Curta (15-22 voltas)", desc: "Aderência imediata nas curvas, ideal para volta rápida de classificação e largadas." },
          medium: { label: "MÉDIO (Medium)", color: "#FFD000", grip: "Alta (85%)", life: "Equilibrada (25-35 voltas)", desc: "Composto coringa com o melhor equilíbrio entre ritmo de prova e desgaste gradual." },
          hard: { label: "DURO (Hard)", color: "#FFFFFF", grip: "Média (70%)", life: "Longa (40+ voltas)", desc: "Construção de borracha rígida para longos trechos com degradação mínima." },
        }

        const selected = tiresData[m2TireCompound]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Tipo de Terreno</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setM2TireType("slick")}
                  className={cn(
                    "text-[9px] font-mono px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer",
                    m2TireType === "slick" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-400 hover:text-white"
                  )}
                >
                  Slick (Seco)
                </button>
                <button
                  type="button"
                  onClick={() => setM2TireType("wet")}
                  className={cn(
                    "text-[9px] font-mono px-2 py-0.5 rounded uppercase font-black transition-all cursor-pointer",
                    m2TireType === "wet" ? "bg-blue-600 text-white" : "bg-white/10 text-zinc-400 hover:text-white"
                  )}
                >
                  Chuva (Sulcado)
                </button>
              </div>
            </div>
            {m2TireType === "wet" && (
              <div className="mb-2.5 p-2 rounded-lg bg-blue-950/60 border border-blue-500/40 text-[11px] text-blue-200 leading-snug">
                <span className="font-bold block text-blue-300 mb-0.5">Pneus de Chuva (Intermediário / Full Wet):</span>
                Possuem sulcos profundos capazes de evacuar até 85 litros de água por segundo para evitar aquaplanagem.
              </div>
            )}

            {/* 3 Seletores de Pneu */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {(["soft", "medium", "hard"] as const).map((cmp) => (
                <button
                  key={cmp}
                  type="button"
                  onClick={() => setM2TireCompound(cmp)}
                  className={cn(
                    "py-1.5 px-1 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                    m2TireCompound === cmp ? "ring-2 ring-white bg-white/20 shadow-lg" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: tiresData[cmp].color, backgroundColor: cmp === "soft" ? "#E10600" : cmp === "medium" ? "#FFD000" : "#FFFFFF" }} />
                  <span className="text-white">{cmp === "soft" ? "Macio" : cmp === "medium" ? "Médio" : "Duro"}</span>
                </button>
              ))}
            </div>

            {/* Ficha Técnica Ilustrativa */}
            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 mb-2.5 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-400">Aderência:</span>
                <span className="font-bold text-white">{selected.grip}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-zinc-400">Durabilidade:</span>
                <span className="font-bold text-white">{selected.life}</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-snug">{selected.desc}</p>
            </div>

            {/* Destaque Obrigatório */}
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-300 uppercase text-center leading-tight">
              O melhor pneu não é sempre o mais macio. É o que funciona melhor na situação.
            </div>
          </div>
        )
      }

      // CENA 4: COCKPIT E VOLANTE: O CENTRO DE COMANDO
      if (currentScene.visualEffectType === "mod2_steering_wheel") {
        const steeringItems = [
          { id: 1, name: "Trocas de Marcha", top: "42%", left: "26%", desc: "Borboletas atrás do aro para reduções e subidas de marcha em milissegundos." },
          { id: 2, name: "Balanço de Freios", top: "58%", left: "32%", desc: "Ajuste manual da porcentagem de frenagem entre o eixo dianteiro e o traseiro." },
          { id: 3, name: "Gestão de Energia", top: "54%", left: "68%", desc: "Seletores de entrega elétrica do MGU-K e botão de ultrapassagem (Overtake)." },
          { id: 4, name: "Rádio da Equipe", top: "42%", left: "74%", desc: "Comunicação direta com os engenheiros de corrida no pit wall via botão PTT." },
          { id: 5, name: "Visor & Telemetria", top: "32%", left: "50%", desc: "Tela colorida com marcha atual, LEDs de rotação (RPM) e delta de tempo de volta." },
        ]

        const activeItem = steeringItems.find((s) => s.id === m2SteeringPin) || steeringItems[0]

        return (
          <>
            {/* LEDs de RPM no topo do volante */}
            <div className="absolute top-[24%] left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/80 p-1 rounded-full border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E10600] animate-pulse" />
            </div>

            {/* Marcadores numerados sobre o volante */}
            {steeringItems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setM2SteeringPin(s.id)}
                style={{ top: s.top, left: s.left }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer shadow-lg",
                  m2SteeringPin === s.id
                    ? "bg-[#E10600] text-white ring-2 ring-white scale-125 shadow-[0_0_20px_#E10600]"
                    : "bg-black/90 text-white border border-white/40 hover:scale-110"
                )}
              >
                {s.id}
              </button>
            ))}

            {/* Drawer informativo compacto */}
            <div className="absolute bottom-3 inset-x-3 sm:bottom-5 sm:left-5 sm:right-auto z-20 sm:w-80 bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Controles do Volante</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black uppercase">
                  {activeItem.id}. {activeItem.name}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">{activeItem.desc}</p>
            </div>
          </>
        )
      }

      // CENA 5: FREIOS: CONTROLAR A VELOCIDADE
      if (currentScene.visualEffectType === "mod2_brakes") {
        const cornerSteps = [
          { step: 1, title: "1. Retão", desc: "Velocidade máxima com asas alinhadas." },
          { step: 2, title: "2. Frenagem", desc: "Pico de desaceleração a 100 kg no pedal." },
          { step: 3, title: "3. Entrada", desc: "Alívio suave de freio (trail braking)." },
          { step: 4, title: "4. Saída", desc: "Aceleração total com tração traseira." },
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Sistema de Parada</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">DISCO DE CARBONO</span>
            </div>

            {/* Seletor Disco vs Refrigeração */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setM2BrakeZone("disc")}
                className={cn(
                  "py-1.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer text-center",
                  m2BrakeZone === "disc" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Disco & Pinça
              </button>
              <button
                type="button"
                onClick={() => setM2BrakeZone("cooling")}
                className={cn(
                  "py-1.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer text-center",
                  m2BrakeZone === "cooling" ? "bg-cyan-600 text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Dutos de Ar
              </button>
            </div>

            <p className="text-xs text-zinc-200 bg-white/5 p-2 rounded-lg border border-white/10 mb-3 leading-snug">
              {m2BrakeZone === "disc"
                ? "Discos de fibra de carbono trabalham entre 400°C e 1000°C gerando mais de 5G de desaceleração."
                : "Aberturas aerodinâmicas conduzem ar forçado para resfriar os discos e impedir perda de pressão hidráulica."}
            </p>

            {/* Gráfico Ilustrativo da Curva */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5">Fases de Aproximação de Curva:</span>
              <div className="grid grid-cols-4 gap-1">
                {cornerSteps.map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setM2BrakeStep(s.step)}
                    className={cn(
                      "py-1 rounded text-[9px] font-bold text-center transition-all cursor-pointer",
                      m2BrakeStep === s.step ? "bg-amber-500 text-black font-black" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                  >
                    Fase {s.step}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-amber-300 mt-2 font-medium">
                {cornerSteps[m2BrakeStep - 1].desc}
              </p>
            </div>
          </div>
        )
      }

      // CENA 6: MOTOR, ENERGIA E UNIDADE DE POTÊNCIA
      if (currentScene.visualEffectType === "mod2_power_unit") {
        const puComponents = [
          { id: 1, title: "1. Motor Combustão", desc: "V6 1.6L turboalimentado de altíssima eficiência térmica." },
          { id: 2, title: "2. Sistema Elétrico (MGU)", desc: "Motores-geradores que captam energia das frenagens e gases." },
          { id: 3, title: "3. Armazenamento", desc: "Bateria leve que guarda a eletricidade colhida na pista." },
          { id: 4, title: "4. Potência Híbrida", desc: "Liberação de centenas de cavalos elétricos na tração." },
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Propulsão Híbrida</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">V6 TURBO + ELÉTRICO</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {puComponents.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setM2PowerUnitPart(p.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-left transition-all cursor-pointer",
                    m2PowerUnitPart === p.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-200 bg-white/5 p-2 rounded-lg border border-white/10 mb-2.5">
              {puComponents[m2PowerUnitPart - 1].desc}
            </div>

            {/* Fluxo de Energia */}
            <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 text-center uppercase tracking-wide">
              ENERGIA ➔ CONVERSÃO ➔ UTILIZAÇÃO ➔ DESEMPENHO
            </div>
          </div>
        )
      }

      // CENA 7: ACERTO DO CARRO E ESTRATÉGIA
      if (currentScene.visualEffectType === "mod2_setup_strategy") {
        const scenarios = {
          straights: {
            title: "Pista com Retas Longas (Ex: Monza)",
            aero: "Asas de baixo arrasto",
            focus: "Velocidade máxima em linha reta e facilidade de ultrapassagem.",
          },
          corners: {
            title: "Pista Travada com Curvas (Ex: Mônaco)",
            aero: "Máxima carga aerodinâmica",
            focus: "Aderência em curvas lentas e alta tração de aceleração.",
          },
          rain: {
            title: "Pista com Chuva (Interlagos/Spa)",
            aero: "Pneus sulcados e altura elevada",
            focus: "Evitar aquaplanagem no assoalho e entregar potência suave.",
          },
        }

        const scn = scenarios[m2SetupScenario]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Compromisso Técnico</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">ACERTO & ESTRATÉGIA</span>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM2SetupScenario("straights")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer text-center",
                  m2SetupScenario === "straights" ? "bg-[#E10600] text-white" : "bg-white/5 text-zinc-400"
                )}
              >
                🏁 Retas
              </button>
              <button
                type="button"
                onClick={() => setM2SetupScenario("corners")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer text-center",
                  m2SetupScenario === "corners" ? "bg-[#E10600] text-white" : "bg-white/5 text-zinc-400"
                )}
              >
                🌀 Curvas
              </button>
              <button
                type="button"
                onClick={() => setM2SetupScenario("rain")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase transition-all cursor-pointer text-center",
                  m2SetupScenario === "rain" ? "bg-[#E10600] text-white" : "bg-white/5 text-zinc-400"
                )}
              >
                🌧️ Chuva
              </button>
            </div>

            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs text-zinc-200 mb-2">
              <span className="font-bold text-amber-300 block mb-1">{scn.title}</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{scn.focus}</p>
            </div>

            <div className="text-[10px] font-mono text-zinc-400 border-t border-white/10 pt-2 flex justify-between">
              <span>Acerto: Adapta o carro</span>
              <span className="text-white">Estratégia: Comanda o GP</span>
            </div>
          </div>
        )
      }

      // CENA 8: TUDO TRABALHANDO JUNTO
      if (currentScene.visualEffectType === "mod2_full_integration") {
        const quadrants = [
          { id: 1, title: "Aerodinâmica", desc: "Downforce em curvas vs arrasto em retas." },
          { id: 2, title: "Pneus & Freios", desc: "Temperatura, atrito e desaceleração de 5G." },
          { id: 3, title: "Cockpit & Energia", desc: "Mais de 1000cv híbridos nas mãos do piloto." },
          { id: 4, title: "Acerto & Estratégia", desc: "Engenharia e tática para a volta perfeita." },
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-80 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Resumo da Máquina</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">INTEGRAÇÃO TOTAL</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {quadrants.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setM2SummaryCard(m2SummaryCard === q.id ? null : q.id)}
                  className={cn(
                    "p-2 rounded-lg border text-left transition-all cursor-pointer",
                    m2SummaryCard === q.id
                      ? "bg-[#E10600]/20 border-[#E10600] ring-1 ring-[#E10600]"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <span className="text-[10px] font-black text-cyan-300 uppercase block mb-0.5">{q.title}</span>
                  <span className="text-[10px] text-zinc-300 leading-tight block">{q.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                stopAllAudio()
                setViewStage("quiz")
              }}
              className="w-full py-2 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.6)] transition-all cursor-pointer text-center"
            >
              Fazer Questionário (10 Perguntas)
            </button>
          </div>
        )
      }
    }

    return null
  }


  // ==========================================================================
  // RENDERIZAÇÃO DA PÁGINA (HERO, LESSON OU QUIZ)
  // ==========================================================================

  // Percentual de progresso
  const progressPercent = Math.round((visitedScenes.length / currentScenes.length) * 100)

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#04060A] text-white flex flex-col justify-between overflow-x-hidden select-none">
      {/* Elementos de Áudio Ocultos */}
      <audio
        ref={narrationAudioRef}
        src={currentScene.audioUrl}
        preload="auto"
        onEnded={() => {
          setIsPlaying(false)
          startPostNarrationCountdown()
        }}
      />
      <audio
        ref={musicAudioRef}
        src={CINEMATIC_MUSIC_URL}
        preload="auto"
        loop
      />
      {activeModuleId === 1 && currentScene.ambientAudioUrl && (
        <audio
          ref={ambientAudioRef}
          src={currentScene.ambientAudioUrl}
          preload="auto"
          loop
        />
      )}

      {/* ==================================================================== */}
      {/* TELA DE ABERTURA (HERO LANDING)                                      */}
      {/* ==================================================================== */}
      {viewStage === "opening" && (
        <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[85vh]">
          {/* Fundo Cinematográfico com Parallax Suave */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={activeModuleId === 1 ? "/backgrounds/bg-ferrari.webp" : "/backgrounds/bg-default.webp"}
              alt="Fundo Novatos na F1"
              className={cn(
                "w-full h-full object-cover object-center brightness-40 contrast-125 scale-105",
                !reduceMotion && "f1-scene-motion-1"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04060A] via-black/60 to-black/80" />
          </div>

          {/* Seletor de Módulos no Topo */}
          <div className="relative z-10 mb-6 flex items-center gap-2 p-1 rounded-2xl bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl">
            <button
              type="button"
              onClick={() => handleSelectModule(1)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 1 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              1. O que é a F1?
            </button>
            <button
              type="button"
              onClick={() => handleSelectModule(2)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 2 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              2. A Máquina
            </button>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono uppercase tracking-widest text-zinc-300 mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
              <span>
                {activeModuleId === 1 ? "MÓDULO 1 • O QUE É A FÓRMULA 1?" : "MÓDULO 2 • A MÁQUINA: COMO FUNCIONA O CARRO"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-md">
              Novatos na <span className="text-[#E10600]">F1</span>
            </h1>

            <p className="text-sm sm:text-lg font-bold uppercase tracking-wider text-zinc-300 mb-4">
              {activeModuleId === 1 ? "Aprenda a entender cada corrida, curva por curva" : "MÓDULO 2 — A MÁQUINA"}
            </p>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mb-8">
              {activeModuleId === 1
                ? "Você não precisa entender de automobilismo para começar. Nós explicamos as regras, estratégias, equipes e o caminho até a bandeirada final."
                : "“Um carro de Fórmula 1 não é apenas rápido. Cada peça, cada ajuste e cada decisão ajudam a transformar potência em desempenho.”"}
            </p>

            {/* Botão de Ação CTA */}
            <button
              type="button"
              onClick={handleStartExperience}
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-sm sm:text-base font-black uppercase tracking-wider shadow-[0_0_30px_rgba(225,6,0,0.65)] hover:shadow-[0_0_40px_rgba(225,6,0,0.85)] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{activeModuleId === 1 ? "COMEÇAR DO ZERO" : "INICIAR EXPERIÊNCIA"}</span>
            </button>

            {/* Acessos Rápidos no Rodapé da Abertura */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Glossário (12 Termos)</span>
              </button>

              <button
                type="button"
                onClick={() => setReduceMotion(!reduceMotion)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
              >
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                <span>Animações: {reduceMotion ? "Reduzidas" : "Ativas"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TELA DE AULA (SCENES 1 A 8)                                         */}
      {/* ==================================================================== */}
      {viewStage === "lesson" && (
        <div className="flex-1 flex flex-col p-2 sm:p-6 max-w-6xl w-full mx-auto justify-between">
          {/* Top Bar da Lição */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setViewStage("opening")}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Módulos</span>
              </button>

              <span className="px-2 py-0.5 rounded bg-[#E10600] text-white font-mono text-[10px] sm:text-xs font-black uppercase shrink-0">
                CENA 0{currentScene.number}
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white truncate">
                {currentScene.title}
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
                {progressPercent}% CONCLUÍDO
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTranscriptionOpen(!isTranscriptionOpen)}
                className={cn(
                  "px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                  isTranscriptionOpen ? "bg-white text-black border-white" : "bg-white/5 text-zinc-300 border-white/15 hover:bg-white/10"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transcrição</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImageFullscreen(true)}
                data-testid="btn-expand-fullscreen"
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </button>
            </div>
          </div>

          {/* Palco Principal da Imagem + Efeitos Visuais */}
          <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black flex items-center justify-center">
            <img
              src={currentScene.imageUrl}
              alt={currentScene.title}
              className={cn(
                "w-full h-full object-cover object-center select-none",
                !reduceMotion && (activeModuleId === 1 ? `f1-scene-motion-${currentScene.number}` : "f1-scene-motion-1"),
                currentScene.visualEffectType === "vintage_1950" && "sepia-[0.25] contrast-125 brightness-90"
              )}
            />

            {/* Gradientes de Contraste */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

            {/* Overlays Interativos por Cena */}
            {renderVisualOverlay()}
          </div>

          {/* Transcrição da Narração Flutuante */}
          {isTranscriptionOpen && (
            <div className="mt-3 p-3.5 rounded-xl bg-black/90 border border-white/20 shadow-xl backdrop-blur-md text-xs sm:text-sm text-zinc-200 leading-relaxed">
              <span className="text-[10px] font-mono uppercase text-[#E10600] font-black block mb-1">
                Mariana da Rádio F1 (Transcrição):
              </span>
              {currentScene.narrationTranscript}
            </div>
          )}

          {/* Banner de Contagem Regressiva de 5 Segundos */}
          {countdownSeconds !== null && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#E10600]/20 border border-[#E10600]/40 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E10600] text-white flex items-center justify-center text-xs font-black">
                  {countdownSeconds}
                </span>
                <span className="text-xs font-bold text-white">
                  Próxima cena em {countdownSeconds}s…
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCountdownTimer()
                    if (sceneIndex < currentScenes.length - 1) goToScene(sceneIndex + 1)
                    else setViewStage("quiz")
                  }}
                  className="px-2.5 py-1 rounded bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase cursor-pointer"
                >
                  Próxima Cena Agora
                </button>
                <button
                  type="button"
                  onClick={handleCancelCountdown}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[11px] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Barra de Controles de Áudio e Navegação */}
          <div className="mt-3 p-3 rounded-2xl bg-black/85 border border-white/15 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xl">
            {/* Reproduzir / Pausar / Repetir */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleReplayScene}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
                title="Repetir cena"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
                title={isMuted ? "Desmutar" : "Silenciar"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#E10600]" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Controles de Volume Independentes */}
            <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
              {/* Volume Mariana */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-300">Mariana:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : narrationVolume}
                  onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-[#E10600] cursor-pointer"
                />
              </div>

              {/* Volume Música */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMusicActive(!isMusicActive)}
                  className="text-[10px] font-mono uppercase text-zinc-300 hover:text-white cursor-pointer underline"
                  title="Ativar/Desativar Música"
                >
                  Música:
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted || !isMusicActive ? 0 : musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Volume Ambiente (Somente Módulo 1) */}
              {activeModuleId === 1 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-300">Ambiente:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-16 accent-amber-400 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Navegação Entre Cenas: Anterior / Próximo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToScene(sceneIndex - 1)}
                disabled={sceneIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (sceneIndex < currentScenes.length - 1) goToScene(sceneIndex + 1)
                  else {
                    stopAllAudio()
                    setViewStage("quiz")
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <span>{sceneIndex === currentScenes.length - 1 ? "Questionário" : "Próxima"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TELA DO QUESTIONÁRIO FINAL                                           */}
      {/* ==================================================================== */}
      {viewStage === "quiz" && (
        <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-2xl w-full mx-auto justify-center min-h-[85vh]">
          {!quizCompleted ? (
            <div className="bg-black/85 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/15">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  {activeModuleId === 1 ? "Módulo 1: O Que é a F1?" : "Módulo 2: A Máquina"}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">
                  Pergunta {quizQuestionIndex + 1} de {currentQuizQuestions.length}
                </span>
              </div>

              {/* Enunciado */}
              <h2 className="text-base sm:text-lg font-black text-white mb-4 leading-snug">
                {currentQuizQuestions[quizQuestionIndex].question}
              </h2>

              {/* Opções A, B, C, D */}
              <div className="space-y-2 mb-4">
                {currentQuizQuestions[quizQuestionIndex].options.map((opt) => (
                  <button
                    key={opt.letter}
                    type="button"
                    disabled={quizShowFeedback}
                    onClick={() => setQuizSelectedOption(opt.letter)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-3",
                      quizSelectedOption === opt.letter
                        ? "bg-white/15 border-[#E10600] text-white ring-1 ring-[#E10600]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
                    )}
                  >
                    <span className="w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {opt.letter}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>

              {/* Feedback Imediato */}
              {quizShowFeedback && (
                <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-zinc-200 mb-4 leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    {quizSelectedOption === currentQuizQuestions[quizQuestionIndex].correctLetter ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#E10600] shrink-0" />
                    )}
                    <span className="font-bold text-white">
                      {quizSelectedOption === currentQuizQuestions[quizQuestionIndex].correctLetter
                        ? "Resposta Correta!"
                        : `Resposta Correta: Letra ${currentQuizQuestions[quizQuestionIndex].correctLetter}`}
                    </span>
                  </div>
                  <p className="text-zinc-300">{currentQuizQuestions[quizQuestionIndex].feedback}</p>
                </div>
              )}

              {/* Botão Confirmar ou Próxima Pergunta */}
              <div className="flex justify-end">
                {!quizShowFeedback ? (
                  <button
                    type="button"
                    disabled={!quizSelectedOption}
                    onClick={() => {
                      if (!quizSelectedOption) return
                      setQuizAnswers({ ...quizAnswers, [quizQuestionIndex]: quizSelectedOption })
                      setQuizShowFeedback(true)
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-30 disabled:pointer-events-none text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Confirmar Resposta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (quizQuestionIndex < currentQuizQuestions.length - 1) {
                        setQuizQuestionIndex(quizQuestionIndex + 1)
                        setQuizSelectedOption(null)
                        setQuizShowFeedback(false)
                      } else {
                        // Calcula nota final
                        let correctCount = 0
                        currentQuizQuestions.forEach((q, idx) => {
                          const ans = idx === quizQuestionIndex ? quizSelectedOption : quizAnswers[idx]
                          if (ans === q.correctLetter) correctCount++
                        })
                        setQuizScore(correctCount)
                        setQuizCompleted(true)
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    {quizQuestionIndex < currentQuizQuestions.length - 1 ? "Próxima Pergunta" : "Ver Resultado"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Card de Resultado Final */
            <div className="bg-black/90 border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
              <div className="w-16 h-16 rounded-full bg-[#E10600]/20 border border-[#E10600] text-[#E10600] flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-1">
                {activeModuleId === 1 ? "MÓDULO 1 CONCLUÍDO" : "MÓDULO 2 CONCLUÍDO"}
              </h2>

              <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
                Você acertou {quizScore} de {currentQuizQuestions.length} perguntas ({Math.round(((quizScore || 0) / currentQuizQuestions.length) * 100)}%)
              </p>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto mb-6">
                {activeModuleId === 1
                  ? "Parabéns! Você já compreende as regras fundamentais, a história, o campeonato e os elementos de uma corrida de F1."
                  : "“Você já conhece os principais sistemas de um carro de Fórmula 1 e entende melhor como engenharia, piloto e equipe trabalham juntos.”"}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuizQuestionIndex(0)
                    setQuizAnswers({})
                    setQuizSelectedOption(null)
                    setQuizShowFeedback(false)
                    setQuizCompleted(false)
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Refazer Questionário
                </button>

                <button
                  type="button"
                  onClick={() => goToScene(0)}
                  className="px-5 py-2 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                >
                  Revisar as Cenas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE TELA CHEIA COMPLETA (PREENCHE 100% DA TELA EDGE-TO-EDGE)     */}
      {/* ==================================================================== */}
      {isImageFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-testid="fullscreen-image-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Visualização da imagem em tela cheia"
            onClick={() => setIsImageFullscreen(false)}
            className="fixed inset-0 z-[9999] w-screen h-dvh bg-black select-none overflow-hidden"
          >
            <div onClick={(e) => e.stopPropagation()} className="relative w-screen h-dvh overflow-hidden">
              <img
                src={viewStage === "opening" ? (activeModuleId === 1 ? "/backgrounds/bg-ferrari.webp" : "/backgrounds/bg-default.webp") : currentScene.imageUrl}
                data-testid="fullscreen-expanded-img"
                className={cn(
                  "w-screen h-dvh object-cover object-center select-none",
                  !reduceMotion && (activeModuleId === 1 ? `f1-scene-motion-${currentScene.number}` : "f1-scene-motion-1")
                )}
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/25 to-transparent" />
            </div>

            {/* Controles Flutuantes do Topo */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-none absolute top-3 inset-x-3 sm:top-5 sm:inset-x-6 z-20 flex items-center justify-between gap-3"
            >
              <div className="pointer-events-auto inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md shadow-xl min-w-0">
                <span className="px-2 py-0.5 rounded bg-[#E10600] text-white font-mono text-[10px] sm:text-xs font-black uppercase shrink-0">
                  {viewStage === "opening" ? "ABERTURA" : `CENA 0${currentScene.number}`}
                </span>
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white truncate">
                  {viewStage === "opening" ? `Novatos na F1 • Módulo ${activeModuleId}` : currentScene.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsImageFullscreen(false)}
                data-testid="btn-close-fullscreen"
                aria-label="Fechar tela cheia"
                className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs sm:text-sm font-black uppercase tracking-wide border border-white/25 shadow-[0_0_24px_rgba(225,6,0,0.65)] transition-all cursor-pointer min-h-[40px] shrink-0"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Fechar</span>
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ==================================================================== */}
      {/* MODAL DO GLOSSÁRIO (12 TERMOS)                                       */}
      {/* ==================================================================== */}
      {isGlossaryOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setIsGlossaryOpen(false)}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0C1017] border border-white/20 rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-black uppercase text-white">Glossário F1 (12 Termos)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlossaryOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Barra de Busca */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar termo ou explicação…"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E10600]"
                />
              </div>

              {/* Lista dos 12 Termos */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredGlossary.map((g) => (
                  <div key={g.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{g.term}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-400">
                        {g.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug">{g.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
