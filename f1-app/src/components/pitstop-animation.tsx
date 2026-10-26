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
 * Visualização técnica do Pit Stop de 2 segundos da Fórmula 1.
 * Monoposto amarelo em geometria e alinhamento longitudinal rigorosamente reto
 * e paralelo ao pit lane e à demarcação do box oficial da FIA.
 *
 * Mapeamento Acústico Comprovado (cena05.mp3 — 21,38s):
 * - 0.0s – 4.2s:   Fase A — Aproximação e entrada na baia de boxes (Box! Box!)
 * - 4.2s – 11.0s:  Fase B — Posicionamento no colchete e prontidão da equipe
 * - 11.0s – 16.5s: Fase C — O PIT STOP DE 2 SEGUNDOS (macacos erguem, troca dos 4 pneus)
 * - 16.5s – 21.4s: Fase D — Liberação (luz verde) e arrancada rumo à pista
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
  // Carro entra pela direita (x=1950), para perfeitamente centralizado no box (x=520) aos 4.2s,
  // fica parado até 16.5s e acelera reto pela esquerda na saída.
  const carX = useMemo(() => {
    if (t < 4.2) {
      const p = Math.min(1, t / 4.2)
      // Desaceleração suave e linearmente alinhada com a baia
      const ease = 1 - Math.pow(1 - p, 2.5)
      return 1950 - ease * 1430 // 1950 -> 520
    }
    if (t < 16.5) {
      return 520 // Perfeitamente centrado dentro do colchete oficial
    }
    // Saída acelerando em linha reta para a esquerda
    const p = Math.min(1, (t - 16.5) / 4.8)
    const ease = Math.pow(p, 2.2)
    return 520 - ease * 1550 // 520 -> -1030
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

  // Progresso do Pit Stop real (de 11.5s a 14.5s: 2.14 segundos cronometrados)
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

      // Eixo Y central rigorosamente alinhado: 550px
      const centerY = 550 + carLiftY

      // Centros exatos das 4 rodas (simetria rigorosa a +/- 80px e +/- 85px da linha de centro)
      const wheelHubs = [
        { x: carX + 150, y: centerY - 80 }, // Dianteiro Esquerdo
        { x: carX + 150, y: centerY + 80 }, // Dianteiro Direito
        { x: carX + 710, y: centerY - 85 }, // Traseiro Esquerdo
        { x: carX + 710, y: centerY + 85 }, // Traseiro Direito
      ]

      // Faíscas e ar comprimido das pistolas pneumáticas durante a troca (11.8s a 15.0s)
      if (t >= 11.8 && t < 15.2 && !reduceMotion) {
        const gunElapsed = t - 11.8

        wheelHubs.forEach((wp, wIdx) => {
          // Centelhas de fricção da porca central
          ctx.fillStyle = "#FACC15"
          for (let s = 0; s < 7; s++) {
            const angle = (gunElapsed * 32 + s * 1.1 + wIdx) % (Math.PI * 2)
            const dist = 8 + (Math.sin(s * 4 + gunElapsed * 20) + 1) * 10
            const sx = wp.x + Math.cos(angle) * dist
            const sy = wp.y + Math.sin(angle) * dist
            ctx.beginPath()
            ctx.arc(sx, sy, 2.2, 0, Math.PI * 2)
            ctx.fill()
          }

          // Vapor de ar comprimido da pistola
          ctx.fillStyle = "rgba(235, 245, 255, 0.28)"
          ctx.beginPath()
          const puffAngle = wp.y < centerY ? -Math.PI * 0.5 : Math.PI * 0.5
          ctx.arc(wp.x + Math.cos(puffAngle) * 15, wp.y + Math.sin(puffAngle) * 15, 12 + (gunElapsed * 4) % 14, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Rastro de borracha e aceleração na saída dos boxes (t >= 16.5s)
      if (t >= 16.5 && t < 19.8 && !reduceMotion) {
        const outElapsed = t - 16.5
        ctx.fillStyle = "rgba(220, 225, 235, 0.35)"
        for (let i = 0; i < 9; i++) {
          const sx = carX + 760 + i * 28
          const sy = centerY + (Math.sin(i * 2 + outElapsed * 10) * 6)
          ctx.beginPath()
          ctx.arc(sx, sy, 12 + outElapsed * 14, 0, Math.PI * 2)
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

  // Recuo dos mecânicos na liberação
  const mechanicOffset = useMemo(() => {
    if (t < 16.2) return 0
    const p = Math.min(1, (t - 16.2) / 0.8)
    return p * 50 // Recuam 50px para fora da baia na liberação do semáforo
  }, [t])

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

          {/* Gradiente da Carroceria Amarela de Corrida */}
          <linearGradient id="f1-yellow-body" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>

          <linearGradient id="f1-yellow-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
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

        {/* Linhas Brancas Delimitadoras do Pit Lane (Eixo Central em Y = 550) */}
        <line x1="0" y1="360" x2="1920" y2="360" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="40 25" opacity="0.65" />
        <line x1="0" y1="740" x2="1920" y2="740" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="40 25" opacity="0.65" />

        {/* ==================================================================== */}
        {/* COLCHETE OFICIAL DE PARADA FIA (PIT STOP BOX)                        */}
        {/* Totalmente alinhado no eixo Y = 550 (Y_top = 410, Y_bottom = 690)    */}
        {/* ==================================================================== */}
        <g id="pit-box-markings">
          {/* Linha Amarela Superior do Box */}
          <rect x="480" y="410" width="940" height="12" rx="4" fill="#EAB308" opacity="0.9" />

          {/* Linha Amarela Inferior do Box */}
          <rect x="480" y="678" width="940" height="12" rx="4" fill="#EAB308" opacity="0.9" />

          {/* Linha Frontal de Parada (Stop Line demarcada) */}
          <line x1="480" y1="410" x2="480" y2="690" stroke="#EAB308" strokeWidth="8" strokeDasharray="16 10" />

          {/* Marcas de Parada dos Pneus (Marcas em T amarelas no Asfalto) */}
          {/* Dianteiros (x = 670) */}
          <line x1="640" y1="470" x2="700" y2="470" stroke="#EAB308" strokeWidth="5" opacity="0.75" />
          <line x1="640" y1="630" x2="700" y2="630" stroke="#EAB308" strokeWidth="5" opacity="0.75" />

          {/* Traseiros (x = 1230) */}
          <line x1="1200" y1="465" x2="1260" y2="465" stroke="#EAB308" strokeWidth="5" opacity="0.75" />
          <line x1="1200" y1="635" x2="1260" y2="635" stroke="#EAB308" strokeWidth="5" opacity="0.75" />

          {/* Inscrição Central no Asfalto */}
          <text x="950" y="558" fill="#EAB308" fontSize="28" fontWeight="900" fontFamily="monospace" textAnchor="middle" opacity="0.4" letterSpacing="4">
            PIT STOP BOX
          </text>
        </g>

        {/* PÓRTICO SUPERIOR / GANTRY COM SEMÁFORO DE SAÍDA */}
        <g id="pit-gantry" transform="translate(720, 80)">
          {/* Estrutura metálica tubular */}
          <rect x="0" y="0" width="480" height="28" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
          <line x1="60" y1="28" x2="60" y2="120" stroke="#334155" strokeWidth="6" />
          <line x1="420" y1="28" x2="420" y2="120" stroke="#334155" strokeWidth="6" />

          {/* Painel do Semáforo Oficial de Liberação (Pirulito Eletrônico) */}
          <rect x="190" y="24" width="100" height="82" rx="8" fill="#0A0F1D" stroke="#334155" strokeWidth="3" />

          {/* Luz Vermelha (HOLD / STOP) */}
          <circle
            cx="240"
            cy="48"
            r="16"
            fill={!isGreenLight ? "#E10600" : "#2A0808"}
            filter={!isGreenLight ? "url(#pit-light-glow)" : undefined}
          />
          {/* Luz Verde (GO / RELEASE) */}
          <circle
            cx="240"
            cy="80"
            r="16"
            fill={isGreenLight ? "#22C55E" : "#062410"}
            filter={isGreenLight ? "url(#pit-light-glow)" : undefined}
          />
          <text x="240" y="125" fill={isGreenLight ? "#22C55E" : "#E10600"} fontSize="13" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            {isGreenLight ? "LIBERADO • GO!" : "PARADA EM ANDAMENTO"}
          </text>
        </g>

        {/* EQUIPE DE MECÂNICOS EM AÇÃO (QUADRO SINCRONIZADO) */}
        {t >= 4.0 && t <= 17.0 && (
          <g id="pit-crew" opacity={t < 4.5 ? (t - 4.0) / 0.5 : t > 16.5 ? (17.0 - t) / 0.5 : 1}>
            {/* Mecânicos Roda Dianteira Esquerda */}
            <circle cx="670" cy={470 - 75 - mechanicOffset} r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />
            <circle cx="635" cy={470 - 70 - mechanicOffset} r="12" fill="#1E293B" />
            <circle cx="705" cy={470 - 70 - mechanicOffset} r="12" fill="#1E293B" />

            {/* Mecânicos Roda Dianteira Direita */}
            <circle cx="670" cy={630 + 75 + mechanicOffset} r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />
            <circle cx="635" cy={630 + 70 + mechanicOffset} r="12" fill="#1E293B" />
            <circle cx="705" cy={630 + 70 + mechanicOffset} r="12" fill="#1E293B" />

            {/* Mecânicos Roda Traseira Esquerda */}
            <circle cx="1230" cy={465 - 80 - mechanicOffset} r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />
            <circle cx="1195" cy={465 - 75 - mechanicOffset} r="12" fill="#1E293B" />
            <circle cx="1265" cy={465 - 75 - mechanicOffset} r="12" fill="#1E293B" />

            {/* Mecânicos Roda Traseira Direita */}
            <circle cx="1230" cy={635 + 80 + mechanicOffset} r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />
            <circle cx="1195" cy={635 + 75 + mechanicOffset} r="12" fill="#1E293B" />
            <circle cx="1265" cy={635 + 75 + mechanicOffset} r="12" fill="#1E293B" />

            {/* Operador de Macaco Dianteiro */}
            <circle cx={carX - 25} cy="550" r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />

            {/* Operador de Macaco Traseiro */}
            <circle cx={carX + 895} cy="550" r="14" fill="#0F172A" stroke="#EAB308" strokeWidth="3" />
          </g>
        )}

        {/* ==================================================================== */}
        {/* CARRO DE F1 (MONOPOSTO AMARELO COM RIGOROSO ALINHAMENTO LONGITUDINAL) */}
        {/* Centro longitudinal posicionado exatamente em Y = 550                */}
        {/* ==================================================================== */}
        <g id="f1-car-pit" transform={`translate(${carX}, ${550 + carLiftY})`}>
          {/* Sombra Dinâmica Perfeitamente Reta e Paralela ao Asfalto */}
          <ellipse
            cx="430"
            cy="0"
            rx="450"
            ry="75"
            fill="#000000"
            opacity={carLiftY < 0 ? 0.35 : 0.75}
            filter="blur(12px)"
          />

          {/* Asa Traseira (x = 800 a 860, centrada em y = 0) */}
          <rect x="800" y="-85" width="40" height="170" rx="4" fill="#0B0F19" stroke="#EAB308" strokeWidth="3" />
          <rect x="790" y="-95" width="12" height="190" rx="3" fill="#EAB308" />
          <rect x="838" y="-95" width="12" height="190" rx="3" fill="#EAB308" />

          {/* Chassi, Monocoque e Bico em Amarelo de Corrida (Simetria Perfeita em y = 0) */}
          <path
            d="M 40,0 L 160,-28 L 340,-50 L 520,-62 L 720,-55 L 800,-40 L 800,40 L 720,55 L 520,62 L 340,50 L 160,28 Z"
            fill="url(#f1-yellow-body)"
            stroke="#CA8A04"
            strokeWidth="3.5"
          />

          {/* Detalhes de Fibra de Carbono Superior (Carenagem Central e Airbox) */}
          <path
            d="M 220,0 L 360,-22 L 560,-28 L 740,-20 L 740,20 L 560,28 L 360,22 Z"
            fill="#111827"
            stroke="#1F2937"
            strokeWidth="2"
          />

          {/* Cockpit e Sistema de Proteção Halo (Centrado em y = 0) */}
          <ellipse cx="440" cy="0" rx="46" ry="24" fill="#0F172A" stroke="#64748B" strokeWidth="3" />
          <circle cx="435" cy="0" r="14" fill="#EAB308" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="435" y1="-24" x2="435" y2="24" stroke="#94A3B8" strokeWidth="3" opacity="0.6" />

          {/* Asa Dianteira (x = 10 a 65, centrada em y = 0, largura 170px) */}
          <rect x="18" y="-80" width="55" height="160" rx="6" fill="#0B0F19" stroke="#EAB308" strokeWidth="3" />
          <rect x="8" y="-90" width="12" height="180" rx="3" fill="#FACC15" />

          {/* Macacos Mecânicos (Frente e Traseira durante a elevação) */}
          {carLiftY < 0 && (
            <g id="pit-jacks" stroke="#EAB308" strokeWidth="4">
              {/* Macaco Dianteiro */}
              <line x1="0" y1="0" x2="35" y2="0" />
              <circle cx="0" cy="0" r="8" fill="#FACC15" />
              {/* Macaco Traseiro */}
              <line x1="850" y1="0" x2="890" y2="0" />
              <circle cx="890" cy="0" r="8" fill="#FACC15" />
            </g>
          )}

          {/* ================================================================== */}
          {/* 4 PNEUS DE F1 RIGOROSAMENTE ALINHADOS AO EIXO LONGITUDINAL         */}
          {/* ================================================================== */}

          {/* Pneu Dianteiro Esquerdo (Centro em x = 150, y = -80) */}
          <g transform="translate(112, -104)">
            <rect x="0" y="0" width="76" height="48" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle
              cx="38"
              cy="24"
              r="14"
              fill="#09090B"
              stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"}
              strokeWidth="4"
            />
          </g>

          {/* Pneu Dianteiro Direito (Centro em x = 150, y = +80) */}
          <g transform="translate(112, 56)">
            <rect x="0" y="0" width="76" height="48" rx="8" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle
              cx="38"
              cy="24"
              r="14"
              fill="#09090B"
              stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"}
              strokeWidth="4"
            />
          </g>

          {/* Pneu Traseiro Esquerdo (Centro em x = 710, y = -85) */}
          <g transform="translate(668, -113)">
            <rect x="0" y="0" width="84" height="56" rx="10" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle
              cx="42"
              cy="28"
              r="16"
              fill="#09090B"
              stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"}
              strokeWidth="4"
            />
          </g>

          {/* Pneu Traseiro Direito (Centro em x = 710, y = +85) */}
          <g transform="translate(668, 57)">
            <rect x="0" y="0" width="84" height="56" rx="10" fill="#18181B" stroke="#27272A" strokeWidth="3" />
            <circle
              cx="42"
              cy="28"
              r="16"
              fill="#09090B"
              stroke={pitProgress >= 0.7 ? "#E10600" : "#EAB308"}
              strokeWidth="4"
            />
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
