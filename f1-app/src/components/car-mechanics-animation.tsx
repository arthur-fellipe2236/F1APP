import { useEffect, useRef, useMemo } from "react"

interface CarMechanicsAnimationProps {
  currentTime: number
  isPlaying?: boolean
  reduceMotion?: boolean
}

/**
 * ============================================================================
 * COMPONENTE: CarMechanicsAnimation (Módulo 1 • Cena 4 — A Máquina)
 * ============================================================================
 * Visualização técnica 2.5D de um F1 da geração 2026 em perspectiva técnica,
 * sincronizada estritamente com a narração de Mariana da Rádio F1 (cena04.mp3).
 *
 * Fases Acústicas Comprovadas:
 * - 0.0s – 4.2s:   Introdução da Máquina (visão técnica 3/4 panorâmica)
 * - 4.2s – 11.2s:  Fase A — Aerodinâmica & Downforce (streamlines e vetores descendentes)
 * - 11.2s – 18.8s: Fase B — Pneus & Freios (zoom focal, incandescência térmica gradual)
 * - 18.8s – 26.8s: Fase C — Unidade de Potência Híbrida (V6 Turbo + MGU-K elétrico ciano)
 * - 26.8s – 32.5s: Fase D — Integração Total dos Sistemas (harmonia mecânica final)
 */
export function CarMechanicsAnimation({
  currentTime,
  isPlaying = false,
  reduceMotion = false,
}: CarMechanicsAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const t = Math.max(0, currentTime)

  // --------------------------------------------------------------------------
  // MARCOS TEMPORAIS DETERMINÍSTICOS
  // --------------------------------------------------------------------------
  const phase = useMemo(() => {
    if (t < 4.2) return "intro"
    if (t < 11.2) return "aero"
    if (t < 18.8) return "brakes"
    if (t < 26.8) return "hybrid"
    return "integration"
  }, [t])

  // Intensidade dos efeitos de 0 a 1 em cada fase
  const aeroIntensity = useMemo(() => {
    if (t < 4.0) return 0
    if (t < 11.2) return Math.min(1, (t - 4.0) / 1.5)
    if (t < 18.8) return Math.max(0.15, 1 - (t - 11.2) / 2.0)
    if (t < 26.8) return 0.15
    return 0.45 // Retorno na integração final
  }, [t])

  const brakeHeat = useMemo(() => {
    if (t < 11.2) return 0
    if (t < 13.5) return Math.min(0.4, (t - 11.2) / 2.3 * 0.4) // Pneus no solo
    if (t < 17.5) return Math.min(1.0, 0.4 + (t - 13.5) / 3.0 * 0.6) // Frenagem forte
    if (t < 19.5) return Math.max(0.2, 1.0 - (t - 17.5) / 2.0 * 0.8) // Arrefecimento
    if (t < 26.8) return 0.2
    return 0.35 // Calor residual estável
  }, [t])

  const hybridEnergy = useMemo(() => {
    if (t < 18.5) return 0
    if (t < 25.5) return Math.min(1, (t - 18.5) / 1.8)
    if (t < 27.5) return Math.max(0.35, 1 - (t - 25.5) / 2.0 * 0.65)
    return 0.5 // Fluxo estável na integração
  }, [t])

  // Posição de câmera e zoom dinâmico baseado na fase
  const { zoomScale, panX, panY } = useMemo(() => {
    if (reduceMotion) return { zoomScale: 1.0, panX: 0, panY: 0 }
    if (phase === "intro") {
      return { zoomScale: 1.0, panX: 0, panY: 0 }
    }
    if (phase === "aero") {
      // Leve afastamento para exibir todo o envelope aerodinâmico
      return { zoomScale: 1.04, panX: -20, panY: -10 }
    }
    if (phase === "brakes") {
      // Zoom nas rodas e discos dianteiros/traseiros
      const p = Math.min(1, (t - 11.2) / 1.2)
      return { zoomScale: 1.0 + p * 0.18, panX: -p * 120, panY: -p * 30 }
    }
    if (phase === "hybrid") {
      // Foco central no compartimento de motor e bateria
      const p = Math.min(1, (t - 18.8) / 1.2)
      return { zoomScale: 1.12, panX: p * 40, panY: -p * 15 }
    }
    // Integração: visão total estável
    return { zoomScale: 1.0, panX: 0, panY: 0 }
  }, [phase, t, reduceMotion])

  // --------------------------------------------------------------------------
  // RENDERIZAÇÃO PARTICULAR EM CANVAS 2D: LINHAS DE FLUXO & PULSOS ELÉTRICOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Linhas de Ar Aerodinâmicas (Streamlines)
      if (aeroIntensity > 0.05 && !reduceMotion) {
        const streamCount = 18
        for (let i = 0; i < streamCount; i++) {
          const speed = 750 + (i % 5) * 180
          const progress = ((t * speed + i * 220) % 2200) / 2200
          const x = -100 + progress * 2120
          
          // Trajetória adaptada contornando o carro em perspectiva
          const baseY = 360 + i * 28
          const curveLift = Math.sin(progress * Math.PI) * 45
          const y = baseY - (progress > 0.3 && progress < 0.75 ? curveLift : 0)

          const len = 90 + (i % 4) * 35
          const alpha = (0.08 + Math.sin(progress * Math.PI) * 0.35) * aeroIntensity

          ctx.strokeStyle = `rgba(180, 230, 255, ${alpha})`
          ctx.lineWidth = i % 3 === 0 ? 3 : 1.5
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + len, y + (progress > 0.4 ? 4 : -2))
          ctx.stroke()
        }

        // Vetores de Downforce (Setas descendentes sobre os eixos)
        if (phase === "aero" || phase === "integration") {
          const downforceAlpha = Math.min(0.85, aeroIntensity * 0.9)
          
          // Eixo Dianteiro
          drawDownforceVector(ctx, 480, 480, downforceAlpha, "DOWNFORCE ASA DIANTEIRA")
          // Assoalho / Venturi
          drawDownforceVector(ctx, 960, 520, downforceAlpha * 0.9, "SUCÇÃO DO ASSOALHO")
          // Eixo Traseiro
          drawDownforceVector(ctx, 1420, 430, downforceAlpha, "DOWNFORCE ASA TRASEIRA")
        }
      }

      // 2. Pulsos de Energia Elétrica Ciano (MGU-K / Bateria)
      if (hybridEnergy > 0.05 && !reduceMotion) {
        const pulseProgress = (t * 2.2) % 1
        const batteryX = 940
        const batteryY = 570
        const mguKX = 1120
        const mguKY = 585

        // Linha condutora de alta voltagem
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 * hybridEnergy})`
        ctx.lineWidth = 3
        ctx.setLineDash([8, 6])
        ctx.beginPath()
        ctx.moveTo(batteryX, batteryY)
        ctx.lineTo(mguKX, mguKY)
        ctx.stroke()
        ctx.setLineDash([])

        // Partículas de elétrons viajando na linha
        for (let p = 0; p < 4; p++) {
          const ep = (pulseProgress + p * 0.25) % 1
          const px = batteryX + (mguKX - batteryX) * ep
          const py = batteryY + (mguKY - batteryY) * ep
          ctx.fillStyle = "#00F0FF"
          ctx.shadowColor = "#00F0FF"
          ctx.shadowBlur = 12
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [t, aeroIntensity, hybridEnergy, phase, reduceMotion, isPlaying])

  // Função auxiliar para desenhar vetores técnicos de downforce
  function drawDownforceVector(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, label: string) {
    ctx.save()
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`
    ctx.lineWidth = 2.5

    // Linha vertical descendente
    ctx.beginPath()
    ctx.moveTo(x, y - 60)
    ctx.lineTo(x, y)
    ctx.stroke()

    // Ponta da seta
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 6, y - 12)
    ctx.lineTo(x + 6, y - 12)
    ctx.closePath()
    ctx.fill()

    // Rótulo técnico
    ctx.font = "10px monospace"
    ctx.textAlign = "center"
    ctx.fillText(label, x, y - 68)
    ctx.restore()
  }

  // --------------------------------------------------------------------------
  // CORES E ESTILOS DINÂMICOS DE COMPONENTES
  // --------------------------------------------------------------------------
  // Cor do disco de freio: grafite frio -> vermelho cereja -> incandescência laranja
  const brakeColor = useMemo(() => {
    if (brakeHeat < 0.1) return "#2D3748"
    if (brakeHeat < 0.5) return `rgb(${Math.floor(80 + brakeHeat * 300)}, 40, 30)`
    return `rgb(${Math.floor(220 + brakeHeat * 35)}, ${Math.floor(50 + brakeHeat * 90)}, 20)`
  }, [brakeHeat])

  const brakeGlowOpacity = useMemo(() => {
    return Math.max(0, (brakeHeat - 0.25) * 1.3)
  }, [brakeHeat])

  return (
    <div className="relative size-full select-none overflow-hidden bg-[#04060A] flex items-center justify-center">
      {/* CENÁRIO TÉCNICO: TÚNEL DE VENTO & ILUMINAÇÃO DE ESTÚDIO */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="size-full transition-transform duration-700 ease-out"
        style={{
          transform: `scale(${zoomScale}) translate(${panX}px, ${panY}px)`,
        }}
      >
        <defs>
          {/* Gradiente do Piso Técnico */}
          <linearGradient id="m4-floor-grid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="50%" stopColor="#05070D" />
            <stop offset="100%" stopColor="#020306" />
          </linearGradient>

          {/* Brilho do Freio Incandescente */}
          <filter id="m4-brake-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Brilho Ciano Elétrico do Sistema Híbrido */}
          <filter id="m4-cyan-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente de Combustão V6 Turbo */}
          <radialGradient id="m4-v6-combustion">
            <stop offset="0%" stopColor="#FF4500" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#E10600" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* Fundo de Estúdio com Grade Métrica de Engenharia */}
        <rect width="1920" height="1080" fill="url(#m4-floor-grid)" />

        {/* Linhas de Grade de Perspectiva no Piso */}
        <g stroke="#161F30" strokeWidth="1" opacity="0.45">
          {Array.from({ length: 19 }).map((_, i) => (
            <line key={`grid-h-${i}`} x1="0" y1={450 + i * 35} x2="1920" y2={450 + i * 35} />
          ))}
          {Array.from({ length: 25 }).map((_, i) => (
            <line key={`grid-v-${i}`} x1={i * 80} y1="450" x2={i * 80} y2="1080" />
          ))}
        </g>

        {/* Eixo de Referência Central */}
        <line x1="960" y1="200" x2="960" y2="900" stroke="#E10600" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />

        {/* ==================================================================== */}
        {/* CHASSI COMPLETO DO CARRO 2026 EM PERSPECTIVA LATERAL-ISOMÉTRICA     */}
        {/* ==================================================================== */}
        <g id="f1-car-composite" transform="translate(180, 240)">
          {/* Sombra de Contato no Solo */}
          <ellipse cx="780" cy="460" rx="720" ry="40" fill="#000000" opacity="0.85" filter="blur(14px)" />

          {/* 1. Assoalho Venturi & Difusor Inferior */}
          <path
            d="M 240,430 L 1320,430 L 1380,410 L 1400,380 L 1300,390 L 300,410 Z"
            fill="#090D14"
            stroke="#1E293B"
            strokeWidth="3"
          />

          {/* 2. Asa Dianteira Multi-Elemento (Regulamento 2026) */}
          <g id="front-wing">
            <path d="M 120,430 L 310,430 L 320,400 L 160,390 Z" fill="#0D131F" stroke="#E10600" strokeWidth="3" />
            <path d="M 140,410 L 310,410" stroke="#475569" strokeWidth="2" />
            <path d="M 155,395 L 300,395" stroke="#475569" strokeWidth="2" />
            {/* Placa Lateral (Endplate) com Sensor Aerodinâmico */}
            <rect x="110" y="370" width="16" height="70" rx="4" fill="#E10600" />
          </g>

          {/* 3. Bico Dianteiro Afilado e Cone de Impacto */}
          <path
            d="M 120,410 L 480,350 L 520,310 L 480,310 L 260,380 Z"
            fill="#101726"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* 4. Carroceria Central, Monocoque e Cockpit */}
          <path
            d="M 480,310 L 820,300 L 980,240 L 1180,250 L 1260,330 L 920,380 L 480,350 Z"
            fill={phase === "hybrid" ? "rgba(16, 23, 38, 0.45)" : "#0F172A"}
            stroke={phase === "hybrid" ? "#00F0FF" : "#E10600"}
            strokeWidth={phase === "hybrid" ? "2.5" : "2"}
            className="transition-colors duration-500"
          />

          {/* 5. Halo de Titânio de Proteção */}
          <path
            d="M 750,290 Q 820,200 900,285 L 880,300 Q 820,230 770,300 Z"
            fill="#1E293B"
            stroke="#94A3B8"
            strokeWidth="3"
          />

          {/* 6. Sidepods Aerodinâmicos e Entradas de Radiador */}
          <path
            d="M 640,360 L 960,360 L 1140,400 L 640,410 Z"
            fill="#090D16"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* 7. Barbatana de Tubarão e Capô do Motor */}
          <path
            d="M 980,240 L 1260,250 L 1280,320 L 1160,320 Z"
            fill="#0B0F19"
            stroke="#E10600"
            strokeWidth="2"
          />

          {/* 8. Asa Traseira com Atuador de DRS */}
          <g id="rear-wing">
            <rect x="1240" y="160" width="160" height="24" rx="4" fill="#0B0F19" stroke="#E10600" strokeWidth="3" />
            <rect x="1260" y="190" width="130" height="14" rx="3" fill="#1E293B" />
            {/* Suportes em Cisne (Swan-neck) */}
            <line x1="1300" y1="204" x2="1280" y2="320" stroke="#64748B" strokeWidth="4" />
            <line x1="1340" y1="204" x2="1320" y2="320" stroke="#64748B" strokeWidth="4" />
            {/* Placas Laterais Traseiras */}
            <rect x="1230" y="140" width="14" height="160" rx="4" fill="#E10600" />
            <rect x="1395" y="140" width="14" height="160" rx="4" fill="#E10600" />
          </g>

          {/* ================================================================ */}
          {/* REVELAÇÃO RAIO-X: GRUPO MOTOPROPULSOR HÍBRIDO (V6 + BATERIA + MGU) */}
          {/* ================================================================ */}
          {(phase === "hybrid" || phase === "integration") && (
            <g id="hybrid-powertrain" className="transition-opacity duration-700" opacity={hybridEnergy}>
              {/* Bloco Motor V6 Turbo Combustão */}
              <rect x="990" y="275" width="140" height="85" rx="8" fill="url(#m4-v6-combustion)" stroke="#FF4500" strokeWidth="2.5" />
              <text x="1060" y="325" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                V6 TURBO 1.6L
              </text>

              {/* MGU-K (Motor Gerador Cinético Elétrico de 350 kW em 2026) */}
              <rect
                x="1145"
                y="340"
                width="80"
                height="65"
                rx="6"
                fill="#041E28"
                stroke="#00F0FF"
                strokeWidth="2.5"
                filter="url(#m4-cyan-glow)"
              />
              <text x="1185" y="378" fill="#00F0FF" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                MGU-K
              </text>

              {/* Pacote de Baterias (Energy Store) Sob o Tanque */}
              <rect
                x="840"
                y="320"
                width="130"
                height="70"
                rx="6"
                fill="#052733"
                stroke="#00F0FF"
                strokeWidth="2.5"
                filter="url(#m4-cyan-glow)"
              />
              <text x="905" y="360" fill="#00F0FF" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                BATERIA 400V
              </text>
            </g>
          )}

          {/* ================================================================ */}
          {/* CONJUNTO DE RODAS, PNEUS PIRELLI E DISCOS DE FREIO CARBONO-CARBONO */}
          {/* ================================================================ */}
          {/* Roda Dianteira */}
          <g id="front-wheel" transform="translate(360, 340)">
            {/* Pneu Dianteiro (Pirelli 18 polegadas) */}
            <circle cx="90" cy="90" r="88" fill="#090B0F" stroke="#1E293B" strokeWidth="5" />
            <circle cx="90" cy="90" r="76" fill="#111622" />
            <circle cx="90" cy="90" r="54" fill="#05070A" stroke="#475569" strokeWidth="3" />

            {/* Halo Térmico Incandescente */}
            {brakeHeat > 0.25 && (
              <circle cx="90" cy="90" r="48" fill="#FF4500" opacity={brakeGlowOpacity * 0.45} filter="url(#m4-brake-glow)" />
            )}
            {/* Disco de Freio de Carbono com Incandescência Térmica */}
            <circle
              cx="90"
              cy="90"
              r="40"
              fill={brakeColor}
              stroke="#FF8C00"
              strokeWidth={brakeHeat > 0.4 ? "3" : "1"}
              filter={brakeHeat > 0.3 ? "url(#m4-brake-glow)" : undefined}
              className="transition-colors duration-300"
            />
            {/* Pinça de Freio em Titânio */}
            <rect x="118" y="65" width="18" height="50" rx="4" fill="#E10600" stroke="#FFFFFF" strokeWidth="1" />
            {/* Calota Aerodinâmica Oficial 18" */}
            <circle cx="90" cy="90" r="22" fill="#090D14" stroke="#64748B" strokeWidth="2" />
          </g>

          {/* Roda Traseira */}
          <g id="rear-wheel" transform="translate(1120, 310)">
            {/* Pneu Traseiro 405mm */}
            <circle cx="105" cy="105" r="102" fill="#090B0F" stroke="#1E293B" strokeWidth="6" />
            <circle cx="105" cy="105" r="88" fill="#111622" />
            <circle cx="105" cy="105" r="62" fill="#05070A" stroke="#475569" strokeWidth="3" />

            {/* Disco de Freio Traseiro com Brake-by-Wire */}
            <circle
              cx="105"
              cy="105"
              r="46"
              fill={brakeColor}
              stroke="#FF8C00"
              strokeWidth={brakeHeat > 0.4 ? "3" : "1"}
              filter={brakeHeat > 0.3 ? "url(#m4-brake-glow)" : undefined}
              className="transition-colors duration-300"
            />
            {/* Pinça Traseira */}
            <rect x="138" y="78" width="20" height="54" rx="4" fill="#E10600" stroke="#FFFFFF" strokeWidth="1" />
            {/* Cubo Traseiro */}
            <circle cx="105" cy="105" r="26" fill="#090D14" stroke="#64748B" strokeWidth="2" />
          </g>
        </g>
      </svg>

      {/* Camada Dinâmica em Canvas 2D para Partículas de Ar e Energia */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 size-full"
      />

      {/* ==================================================================== */}
      {/* TELEMETRIA TÉCNICA DINÂMICA (NÃO OBSTRUTIVA NOS CANTOS)              */}
      {/* ==================================================================== */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 sm:bottom-6 sm:left-6">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-md shadow-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">FASE ATIVA</span>
            <span className="text-xs sm:text-sm font-black uppercase text-white">
              {phase === "intro" && "01 • VISÃO GERAL DA MÁQUINA"}
              {phase === "aero" && "02 • FLUXO AERODINÂMICO & DOWNFORCE"}
              {phase === "brakes" && "03 • ADERÊNCIA DOS PNEUS & FREIOS"}
              {phase === "hybrid" && "04 • GRUPO MOTOPROPULSOR HÍBRIDO"}
              {phase === "integration" && "05 • INTEGRAÇÃO MECÂNICA TOTAL"}
            </span>
          </div>
        </div>

        {/* Indicadores Dinâmicos Sutis */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            AERO: <strong className="text-cyan-400">{Math.round(aeroIntensity * 100)}%</strong>
          </span>
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            FREIOS: <strong style={{ color: brakeColor }}>{brakeHeat > 0.4 ? "AQUECIDO" : "NOMINAL"}</strong>
          </span>
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            HÍBRIDO: <strong className="text-cyan-400">{hybridEnergy > 0.3 ? "REGEN/BOOST" : "STANDBY"}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
