import { useEffect, useRef, useMemo } from "react"

interface PitstopAnimationProps {
  currentTime: number
  isPlaying?: boolean
  reduceMotion?: boolean
}

/**
 * ============================================================================
 * COMPONENTE: PitstopAnimation (Módulo 1 • Cena 5 — Pilotos e Equipes)
 * ============================================================================
 * Visualização técnica sincronizada do Pit Stop de 2 segundos da Fórmula 1,
 * demonstrando a sincronia perfeita entre piloto, mecânicos e pit wall.
 *
 * Mapeamento Acústico Comprovado (cena05.mp3 — 21,38s):
 * - 0.0s – 4.2s:   Fase A — Aproximação e entrada na baia de boxes (Box! Box!)
 * - 4.2s – 11.0s:  Fase B — Posicionamento nos colchetes e prontidão da equipe
 * - 11.0s – 16.5s: Fase C — O PIT STOP DE 2 SEGUNDOS (macacos erguem, troca dos 4 pneus)
 * - 16.5s – 21.4s: Fase D — Liberação (luz verde) e arrancada rumo à saída do pit lane
 */
export function PitstopAnimation({
  currentTime,
  isPlaying = false,
  reduceMotion = false,
}: PitstopAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const t = Math.max(0, currentTime)

  // --------------------------------------------------------------------------
  // MARCOS TEMPORAIS DETERMINÍSTICOS
  // --------------------------------------------------------------------------
  const phase = useMemo(() => {
    if (t < 4.2) return "entry"
    if (t < 11.0) return "standby"
    if (t < 16.5) return "pitstop"
    return "release"
  }, [t])

  // Posição horizontal do carro na baia de boxes
  // Carro entra da direita (x=1600), para no centro (x=840) aos 4.2s, fica parado até 16.5s, e sai pela esquerda
  const carX = useMemo(() => {
    if (t < 4.2) {
      const p = Math.min(1, t / 4.2)
      // Desaceleração suave até a marcação de parada
      const ease = 1 - Math.pow(1 - p, 2.5)
      return 1550 - ease * 710
    }
    if (t < 16.5) {
      return 840 // Parado no colchete exato
    }
    // Saída acelerando
    const p = Math.min(1, (t - 16.5) / 4.8)
    const ease = Math.pow(p, 2.2)
    return 840 - ease * 1150
  }, [t])

  // Elevação dos macacos (carro suspenso durante a troca de pneus entre 11.4s e 16.0s)
  const carLiftY = useMemo(() => {
    if (reduceMotion) return 0
    if (t < 11.4) return 0
    if (t < 12.0) {
      // Subida rápida do macaco
      const p = (t - 11.4) / 0.6
      return -Math.sin(p * Math.PI * 0.5) * 16
    }
    if (t < 15.8) {
      return -16 // Suspenso
    }
    if (t < 16.3) {
      // Queda instantânea ao solo
      const p = (t - 15.8) / 0.5
      return -16 * (1 - p)
    }
    return 0
  }, [t, reduceMotion])

  // Progresso do Pit Stop real (de 11.5s a 14.5s: 2.2 segundos cronometrados)
  const pitProgress = useMemo(() => {
    if (t < 11.5) return 0
    if (t >= 14.5) return 1.0
    return (t - 11.5) / 3.0
  }, [t])

  // Tempo do cronômetro de pit stop (0.00s a 2.14s)
  const pitTimerLabel = useMemo(() => {
    if (t < 11.5) return "0.00s"
    if (t >= 14.5) return "2.14s"
    return `${((t - 11.5) * (2.14 / 3.0)).toFixed(2)}s`
  }, [t])

  // Semáforo de liberação do gantry de box: Vermelho durante o pit stop, Verde após 16.3s
  const isGreenLight = t >= 16.3

  // --------------------------------------------------------------------------
  // PARTICULAS EM CANVAS 2D: FAÍSCAS DAS PISTOLAS PNEUMÁTICAS & FUMAÇA
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Faíscas e ar comprimido das pistolas pneumáticas durante a troca (11.8s a 15.0s)
      if (t >= 11.8 && t < 15.2 && !reduceMotion) {
        const gunElapsed = t - 11.8
        const wheelPositions = [
          { x: carX + 175, y: 520 + carLiftY }, // Dianteiro Esquerdo
          { x: carX + 175, y: 640 + carLiftY }, // Dianteiro Direito
          { x: carX + 850, y: 510 + carLiftY }, // Traseiro Esquerdo
          { x: carX + 850, y: 650 + carLiftY }, // Traseiro Direito
        ]

        wheelPositions.forEach((wp, wIdx) => {
          // Centelhas de fricção da porca central
          ctx.fillStyle = "#FFD700"
          for (let s = 0; s < 6; s++) {
            const angle = (gunElapsed * 30 + s * 1.2 + wIdx) % (Math.PI * 2)
            const dist = 10 + (Math.sin(s * 4 + gunElapsed * 20) + 1) * 12
            const sx = wp.x + Math.cos(angle) * dist
            const sy = wp.y + Math.sin(angle) * dist
            ctx.beginPath()
            ctx.arc(sx, sy, 2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Vapor de ar comprimido da pistola
          ctx.fillStyle = "rgba(230, 240, 255, 0.25)"
          ctx.beginPath()
          ctx.arc(wp.x - 25, wp.y - 10, 12 + (gunElapsed * 4) % 15, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Rastro de borracha e aceleração na saída dos boxes (t >= 16.5s)
      if (t >= 16.5 && t < 19.5 && !reduceMotion) {
        const outElapsed = t - 16.5
        ctx.fillStyle = "rgba(200, 200, 220, 0.3)"
        for (let i = 0; i < 8; i++) {
          const sx = carX + 820 + i * 25
          const sy = 620 + (Math.sin(i * 2 + outElapsed * 10) * 8)
          ctx.beginPath()
          ctx.arc(sx, sy, 10 + outElapsed * 12, 0, Math.PI * 2)
          ctx.fill()
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
  }, [t, carX, carLiftY, reduceMotion, isPlaying])

  return (
    <div className="relative size-full select-none overflow-hidden bg-[#05070D] flex items-center justify-center">
      {/* CENÁRIO VETORIAL: PIT LANE & BAIA DE BOXES DE F1 */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
      >
        <defs>
          <linearGradient id="pit-asphalt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0E14" />
            <stop offset="50%" stopColor="#121620" />
            <stop offset="100%" stopColor="#090C12" />
          </linearGradient>

          {/* Brilho da Luz Verde / Vermelha de Saída */}
          <filter id="pit-light-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Asfalto da Pista de Box */}
        <rect width="1920" height="1080" fill="url(#pit-asphalt)" />

        {/* Marcações no Asfalto da Linha Rápida do Pit Lane */}
        <line x1="0" y1="360" x2="1920" y2="360" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="40 25" opacity="0.6" />
        <line x1="0" y1="740" x2="1920" y2="740" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="40 25" opacity="0.6" />

        {/* Marcação Amarela Oficial de Parada da FIA (Colchete de Box) */}
        <g id="pit-box-markings" transform="translate(760, 480)">
          <rect x="0" y="0" width="220" height="14" rx="3" fill="#EAB308" opacity="0.9" />
          <rect x="0" y="190" width="220" height="14" rx="3" fill="#EAB308" opacity="0.9" />
          <line x1="0" y1="0" x2="0" y2="204" stroke="#EAB308" strokeWidth="6" strokeDasharray="12 8" />
          <text x="110" y="110" fill="#EAB308" fontSize="24" fontWeight="900" fontFamily="monospace" textAnchor="middle" opacity="0.4">
            PIT STOP BOX
          </text>
        </g>

        {/* PÓRTICO SUPERIOR / GANTRY COM SEMÁFORO DE SAÍDA */}
        <g id="pit-gantry" transform="translate(680, 80)">
          {/* Estrutura metálica tubular */}
          <rect x="0" y="0" width="480" height="30" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <line x1="60" y1="30" x2="60" y2="120" stroke="#334155" strokeWidth="6" />
          <line x1="420" y1="30" x2="420" y2="120" stroke="#334155" strokeWidth="6" />

          {/* Painel do Semáforo Oficial de Liberação (Pirulito Eletrônico) */}
          <rect x="190" y="25" width="100" height="80" rx="8" fill="#0A0F1D" stroke="#334155" strokeWidth="3" />
          
          {/* Luz Vermelha (HOLD / STOP) */}
          <circle
            cx="240"
            cy="50"
            r="16"
            fill={!isGreenLight ? "#E10600" : "#2A0808"}
            filter={!isGreenLight ? "url(#pit-light-glow)" : undefined}
          />
          {/* Luz Verde (GO / RELEASE) */}
          <circle
            cx="240"
            cy="82"
            r="16"
            fill={isGreenLight ? "#22C55E" : "#062410"}
            filter={isGreenLight ? "url(#pit-light-glow)" : undefined}
          />
          <text x="240" y="125" fill={isGreenLight ? "#22C55E" : "#E10600"} fontSize="13" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            {isGreenLight ? "LIBERADO • GO!" : "PARADA EM ANDAMENTO"}
          </text>
        </g>

        {/* ==================================================================== */}
        {/* CARRO DE F1 (PERSPECTIVA LATERAL/SUPERIOR)                           */}
        {/* ==================================================================== */}
        <g id="f1-car-pit" transform={`translate(${carX}, ${480 + carLiftY})`}>
          {/* Sombra Dinâmica */}
          <ellipse cx="500" cy="170" rx="460" ry="32" fill="#000000" opacity={carLiftY < 0 ? 0.45 : 0.85} filter="blur(10px)" />

          {/* Asa Dianteira */}
          <rect x="60" y="110" width="70" height="90" rx="6" fill="#0F172A" stroke="#E10600" strokeWidth="3" />
          <rect x="40" y="90" width="12" height="130" rx="3" fill="#E10600" />

          {/* Bico e Monocoque */}
          <path d="M 120,135 L 360,110 L 520,95 L 720,105 L 880,120 L 880,190 L 720,205 L 520,215 L 360,200 L 120,175 Z" fill="#0B0F19" stroke="#E10600" strokeWidth="3" />

          {/* Cockpit e Halo */}
          <ellipse cx="490" cy="155" rx="45" ry="25" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
          <circle cx="485" cy="155" r="14" fill="#E10600" />

          {/* Sidepods e Tomada de Ar Superior */}
          <path d="M 380,105 L 680,100 L 780,120 L 780,190 L 680,210 L 380,205 Z" fill="#111827" stroke="#374151" strokeWidth="2" />

          {/* Asa Traseira */}
          <rect x="880" y="80" width="40" height="150" rx="4" fill="#0B0F19" stroke="#E10600" strokeWidth="3" />
          <rect x="870" y="70" width="10" height="170" rx="2" fill="#E10600" />
          <rect x="915" y="70" width="10" height="170" rx="2" fill="#E10600" />

          {/* Macacos Mecânicos (Frente e Traseira) */}
          {carLiftY < 0 && (
            <g id="pit-jacks" stroke="#EAB308" strokeWidth="4">
              {/* Macaco Dianteiro */}
              <line x1="30" y1="155" x2="90" y2="155" />
              <circle cx="30" cy="155" r="8" fill="#EAB308" />
              {/* Macaco Traseiro */}
              <line x1="930" y1="155" x2="980" y2="155" />
              <circle cx="980" cy="155" r="8" fill="#EAB308" />
            </g>
          )}

          {/* CONJUNTO DE PNEUS DIANTEIROS E TRASEIROS */}
          {/* Pneu Dianteiro Esquerdo */}
          <g transform="translate(170, 45)">
            <rect x="0" y="0" width="75" height="48" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle cx="37" cy="24" r="14" fill="#09090B" stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"} strokeWidth="4" />
          </g>

          {/* Pneu Dianteiro Direito */}
          <g transform="translate(170, 215)">
            <rect x="0" y="0" width="75" height="48" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle cx="37" cy="24" r="14" fill="#09090B" stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"} strokeWidth="4" />
          </g>

          {/* Pneu Traseiro Esquerdo */}
          <g transform="translate(730, 35)">
            <rect x="0" y="0" width="85" height="56" rx="10" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle cx="42" cy="28" r="16" fill="#09090B" stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"} strokeWidth="4" />
          </g>

          {/* Pneu Traseiro Direito */}
          <g transform="translate(730, 215)">
            <rect x="0" y="0" width="85" height="56" rx="10" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle cx="42" cy="28" r="16" fill="#09090B" stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"} strokeWidth="4" />
          </g>
        </g>
      </svg>

      {/* Camada Dinâmica em Canvas 2D para Faíscas das Pistolas */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 size-full"
      />

      {/* ==================================================================== */}
      {/* TELEMETRIA DE PIT WALL: CRONÔMETRO DE PARADA & STATUS DA EQUIPE      */}
      {/* ==================================================================== */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex flex-col gap-1.5 sm:bottom-6 sm:left-6">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              SIMULAÇÃO DIDÁTICA • TEMPO ILUSTRATIVO: 2,14 s
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {pitTimerLabel.replace(".", ",")}
              </span>
              <span className={`text-xs font-mono font-bold uppercase ${isGreenLight ? "text-green-400" : "text-amber-400"}`}>
                {phase === "entry" && "APROXIMAÇÃO"}
                {phase === "standby" && "POSICIONAMENTO"}
                {phase === "pitstop" && "4 PNEUS EM TROCA"}
                {phase === "release" && "LIBERADO • GO!"}
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores dos Mecânicos por Roda */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            DIANT: <strong className={pitProgress >= 0.7 ? "text-red-400" : "text-amber-400"}>{pitProgress >= 0.7 ? "NOVO (MACIO)" : "TROCA"}</strong>
          </span>
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            TRAS: <strong className={pitProgress >= 0.7 ? "text-red-400" : "text-amber-400"}>{pitProgress >= 0.7 ? "NOVO (MACIO)" : "TROCA"}</strong>
          </span>
          <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5">
            STATUS: <strong className={isGreenLight ? "text-green-400" : "text-amber-400"}>{isGreenLight ? "SAÍDA LIVRE" : "SUSPENSO"}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
