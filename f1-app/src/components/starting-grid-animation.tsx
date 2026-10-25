import { useEffect, useRef } from "react"

interface StartingGridAnimationProps {
  currentTime: number
  isPlaying: boolean
  reduceMotion?: boolean
}

/**
 * Motor de Animação Real da Largada de F1 (Módulo 1, Cena 6)
 * Sincronizado deterministicamente com o áudio real de Mariana da Rádio F1 (26.09s):
 * 
 * - t < 11.5s: Estado A — Grid alinhado, luzes apagadas, expectativa.
 * - 11.5s <= t < 16.5s: Estado B — 5 luzes vermelhas acendem sequencialmente (1 a cada 1s).
 * - 16.5s <= t < 17.5s: Estado C — Todas as 5 luzes acesas, giro máximo dos motores.
 * - 17.5s: Estado D — BLECAUTE SIMULTÂNEO de todas as 5 luzes.
 * - t >= 17.5s: Estado E — Arrancada com compressão de suspensão, fumaça e aceleração em perspectiva.
 */
export function StartingGridAnimation({
  currentTime,
  isPlaying,
  reduceMotion = false,
}: StartingGridAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // --------------------------------------------------------------------------
  // CÁLCULO DETERMINÍSTICO DE ESTADOS (100% PURO EM FUNÇÃO DO TEMPO)
  // --------------------------------------------------------------------------
  const t = Math.max(0, currentTime)

  // Sequência de 5 Luzes
  const lightsCount =
    t < 11.5 ? 0 :
    t < 12.5 ? 1 :
    t < 13.5 ? 2 :
    t < 14.5 ? 3 :
    t < 15.5 ? 4 :
    t < 17.5 ? 5 : 0 // Apagamento simultâneo aos 17.5s

  const isLightsOut = t >= 17.5
  const isAllLightsOn = t >= 15.5 && t < 17.5
  const isRacing = t >= 17.5

  // Tempo decorrido após a largada (em segundos)
  const launchElapsed = Math.max(0, t - 17.5)

  // Curva de aceleração física do carro (0 a 1)
  // Fórmula exponencial suave: nos primeiros 0.5s traciona, depois dispara
  const launchProgress = Math.min(1.0, Math.pow(launchElapsed / 8.0, 1.85))

  // Posição do carro em perspectiva tridimensional
  // P1 parte de x=740, y=740 e avança rumo ao ponto de fuga central (x=960, y=490)
  const carX = 740 + launchProgress * 210
  const carY = 740 - launchProgress * 260
  const carScale = Math.max(0.18, 1.0 - launchProgress * 0.78)

  // Física de compressão da suspensão traseira (squat) na arrancada
  const suspensionSquat =
    isRacing && launchElapsed < 1.2 && !reduceMotion
      ? Math.sin((launchElapsed / 1.2) * Math.PI) * 7
      : 0

  // Efeito de vibração pré-largada (motores a 11.500 RPM)
  const engineVibration =
    isAllLightsOn && !reduceMotion
      ? (Math.sin(t * 85) * 1.2)
      : 0

  // Tremor sutil de câmera na arrancada explosiva
  const cameraShake =
    isRacing && launchElapsed < 0.6 && !reduceMotion
      ? Math.sin(launchElapsed * 60) * (1 - launchElapsed / 0.6) * 3
      : 0

  // --------------------------------------------------------------------------
  // PARTÍCULAS EM CANVAS 2D: FUMAÇA DOS PNEUS E FAÍSCAS DO ASSOALHO
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    // Render loop vinculado ao requestAnimationFrame
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (isRacing && launchElapsed < 3.2 && !reduceMotion) {
        const timeRatio = 1 - launchElapsed / 3.2
        const pCount = Math.floor(25 * timeRatio)

        // Fumaça volumétrica nas rodas traseiras (Pirelli P-Zero)
        for (let i = 0; i < pCount; i++) {
          const offsetX = (Math.sin(i * 1.5 + launchElapsed * 10) * 45) * carScale
          const offsetY = (launchElapsed * 18 + i * 2) * carScale
          const radius = (12 + (launchElapsed * 35) + i * 2) * carScale
          const alpha = 0.22 * timeRatio

          ctx.fillStyle = `rgba(220, 220, 230, ${alpha})`
          ctx.beginPath()
          // Roda Esquerda
          ctx.arc(carX - 110 * carScale + offsetX, carY + 30 * carScale + offsetY, radius, 0, Math.PI * 2)
          // Roda Direita
          ctx.arc(carX + 110 * carScale + offsetX, carY + 30 * carScale + offsetY, radius, 0, Math.PI * 2)
          ctx.fill()
        }

        // Faíscas de titânio (skid block tocando o asfalto)
        if (launchElapsed > 0.1 && launchElapsed < 1.4) {
          ctx.fillStyle = "#FFD700"
          for (let s = 0; s < 12; s++) {
            const sparkX = carX + (Math.sin(s * 3.7 + launchElapsed * 20) * 30) * carScale
            const sparkY = carY + (35 + Math.random() * 25) * carScale
            ctx.beginPath()
            ctx.arc(sparkX, sparkY, 2.5 * carScale, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Linhas cinéticas de velocidade (speed streaks) durante a aceleração
      if (isRacing && launchElapsed > 0.4 && !reduceMotion) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
        ctx.lineWidth = 2
        for (let l = 0; l < 8; l++) {
          const sx = 200 + ((l * 190 + launchElapsed * 900) % 1520)
          const sy = 480 + ((l * 85 + launchElapsed * 750) % 550)
          const len = 70 + (launchElapsed * 30)
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(sx - len * 0.4, sy + len)
          ctx.stroke()
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
  }, [isRacing, launchElapsed, carX, carY, carScale, reduceMotion, isPlaying])

  return (
    <div
      className="absolute inset-0 select-none overflow-hidden bg-[#05070B] transition-transform duration-75"
      style={{
        transform: cameraShake ? `translate3d(0, ${cameraShake}px, 0)` : undefined,
      }}
    >
      {/* ==================================================================== */}
      {/* CENÁRIO CINEMATOGRÁFICO: CIRCUITO NOTURNO COM ILUMINAÇÃO DE GP       */}
      {/* ==================================================================== */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover pointer-events-none"
      >
        <defs>
          {/* Brilho Intenso das Lâmpadas Vermelhas FIA (Bloom) */}
          <filter id="f1-red-bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradiente do Asfalto em Perspectiva */}
          <linearGradient id="f1-asphalt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0E14" />
            <stop offset="40%" stopColor="#12161F" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>

          {/* Gradiente das Zebras Vermelhas e Brancas */}
          <linearGradient id="f1-kerb-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E10600" />
            <stop offset="100%" stopColor="#990000" />
          </linearGradient>
        </defs>

        {/* Céu Crepuscular e Iluminação de GP Noturno */}
        <rect width="1920" height="490" fill="#030508" />
        <ellipse cx="960" cy="240" rx="900" ry="220" fill="rgba(6, 182, 212, 0.04)" />
        <circle cx="340" cy="180" r="160" fill="rgba(255, 255, 255, 0.03)" />
        <circle cx="1580" cy="180" r="160" fill="rgba(255, 255, 255, 0.03)" />

        {/* Torres de Refletores ao Fundo */}
        <line x1="260" y1="480" x2="260" y2="120" stroke="#334155" strokeWidth="4" />
        <circle cx="260" cy="115" r="28" fill="#F8FAFC" opacity="0.85" filter="drop-shadow(0 0 25px #ffffff)" />

        <line x1="1660" y1="480" x2="1660" y2="120" stroke="#334155" strokeWidth="4" />
        <circle cx="1660" cy="115" r="28" fill="#F8FAFC" opacity="0.85" filter="drop-shadow(0 0 25px #ffffff)" />

        {/* Arquibancadas e Pit Wall nas Margens */}
        <polygon points="0,380 420,490 0,560" fill="#080C14" />
        <polygon points="1920,380 1500,490 1920,560" fill="#080C14" />

        {/* ------------------------------------------------------------------ */}
        {/* PISTA E RETAS DO CIRCUITO (PONTO DE FUGA CENTRAL: 960, 490)         */}
        {/* ------------------------------------------------------------------ */}
        {/* Corpo Principal da Pista de Asfalto */}
        <polygon points="960,480 320,1080 1600,1080" fill="url(#f1-asphalt)" />

        {/* Zebras Laterais Esquerda e Direita em Perspectiva */}
        <polygon points="960,480 270,1080 320,1080" fill="url(#f1-kerb-red)" />
        <polygon points="960,480 1600,1080 1650,1080" fill="url(#f1-kerb-red)" />

        {/* Linha Tracejada Central da Pista */}
        <line x1="960" y1="490" x2="960" y2="1080" stroke="#475569" strokeWidth="3" strokeDasharray="25,20" opacity="0.5" />

        {/* Marcas de Borracha de Arrancadas (Groove de Aderência) */}
        <polygon points="930,490 945,490 730,1080 670,1080" fill="#0A0D14" opacity="0.75" />
        <polygon points="975,490 990,490 1250,1080 1190,1080" fill="#0A0D14" opacity="0.75" />

        {/* Colchete de Largada P1 (Pole Position - Onde o carro está) */}
        <g opacity={Math.max(0.2, 1.0 - launchProgress * 1.5)}>
          <polygon points="610,750 870,750 890,780 590,780" fill="none" stroke="#FFFFFF" strokeWidth="5" />
          <text x="560" y="775" fill="#FFFFFF" fontSize="24" fontFamily="monospace" fontWeight="900" opacity="0.8">
            P1
          </text>
        </g>

        {/* Colchete P2 (Atrás à direita) */}
        <polygon points="1050,790 1310,790 1330,815 1030,815" fill="none" stroke="#64748B" strokeWidth="4" opacity="0.5" />
        <text x="1350" y="810" fill="#94A3B8" fontSize="20" fontFamily="monospace" fontWeight="bold" opacity="0.6">
          P2
        </text>

        {/* Colchete P3 (Atrás à esquerda) */}
        <polygon points="530,850 790,850 810,875 510,875" fill="none" stroke="#64748B" strokeWidth="3" opacity="0.4" />

        {/* ================================================================== */}
        {/* PÓRTICO OFICIAL DA FIA COM 5 CONJUNTOS DE LUZES DE LARGADA        */}
        {/* ================================================================== */}
        {/* Estrutura Metálica de Treliça (Gantry) */}
        <rect x="520" y="160" width="880" height="14" fill="#334155" />
        <line x1="520" y1="167" x2="360" y2="490" stroke="#1E293B" strokeWidth="8" />
        <line x1="1400" y1="167" x2="1560" y2="490" stroke="#1E293B" strokeWidth="8" />

        {/* 5 Conjuntos de Caixas de Luzes FIA (Colunas 1 a 5) */}
        {[
          { id: 1, cx: 720 },
          { id: 2, cx: 840 },
          { id: 3, cx: 960 },
          { id: 4, cx: 1080 },
          { id: 5, cx: 1200 },
        ].map((light) => {
          const isTurnedOn = light.id <= lightsCount && !isLightsOut
          return (
            <g key={light.id}>
              {/* Caixa Protetora Preta com Viseira */}
              <rect
                x={light.cx - 36}
                y={185}
                width={72}
                height={125}
                rx={10}
                fill="#0A0C10"
                stroke="#1E293B"
                strokeWidth={3}
                filter="drop-shadow(0 6px 12px rgba(0,0,0,0.85))"
              />

              {/* Lâmpadas Auxiliares Superiores (Desligadas / Estado Padrão) */}
              <circle cx={light.cx - 16} cy={206} r={10} fill="#141822" stroke="#2D3748" strokeWidth={1.5} />
              <circle cx={light.cx + 16} cy={206} r={10} fill="#141822" stroke="#2D3748" strokeWidth={1.5} />

              {/* Lâmpada Vermelha Intermediária */}
              <circle cx={light.cx - 16} cy={240} r={12} fill="#181B24" stroke="#2D3748" strokeWidth={1.5} />
              <circle cx={light.cx + 16} cy={240} r={12} fill="#181B24" stroke="#2D3748" strokeWidth={1.5} />

              {/* LÂMPADA VERMELHA PRINCIPAL FIA DE LARGADA */}
              {isTurnedOn ? (
                <>
                  {/* Halo Difuso Incandescente */}
                  <circle
                    cx={light.cx - 16}
                    cy={278}
                    r={20}
                    fill="#FF1E00"
                    opacity={0.85}
                    filter="url(#f1-red-bloom)"
                  />
                  <circle
                    cx={light.cx + 16}
                    cy={278}
                    r={20}
                    fill="#FF1E00"
                    opacity={0.85}
                    filter="url(#f1-red-bloom)"
                  />
                  {/* Núcleo Incandescente */}
                  <circle cx={light.cx - 16} cy={278} r={13} fill="#FFFFFF" />
                  <circle cx={light.cx + 16} cy={278} r={13} fill="#FFFFFF" />
                </>
              ) : (
                <>
                  {/* Lente Vermelha Apagada */}
                  <circle cx={light.cx - 16} cy={278} r={12} fill="#2A0808" stroke="#4A1010" strokeWidth={2} />
                  <circle cx={light.cx + 16} cy={278} r={12} fill="#2A0808" stroke="#4A1010" strokeWidth={2} />
                </>
              )}
            </g>
          )
        })}

        {/* Reflexo das 5 Luzes no Asfalto */}
        {lightsCount > 0 && !isLightsOut && (
          <ellipse
            cx="960"
            cy="495"
            rx={lightsCount * 80}
            ry={12}
            fill="#FF1E00"
            opacity={0.25}
            filter="url(#f1-red-bloom)"
          />
        )}

        {/* ================================================================== */}
        {/* O MONOPOSTO DE FÓRMULA 1 (DESENHADO EM VETOR DE ALTA PRECISÃO)     */}
        {/* ================================================================== */}
        <g
          transform={`translate(${carX}, ${carY + suspensionSquat + engineVibration}) scale(${carScale}) translate(-180, -110)`}
          filter="drop-shadow(0 25px 25px rgba(0,0,0,0.9))"
        >
          {/* Sombra de Contato dos Pneus com o Solo */}
          <ellipse cx="180" cy="115" rx="140" ry="24" fill="#000000" opacity="0.85" />

          {/* Difusor Traseiro e Assoalho Inferior */}
          <polygon points="90,95 270,95 285,110 75,110" fill="#0A0D14" stroke="#1E293B" strokeWidth="2" />
          <line x1="120" y1="95" x2="115" y2="110" stroke="#334155" strokeWidth="3" />
          <line x1="150" y1="95" x2="148" y2="110" stroke="#334155" strokeWidth="3" />
          <line x1="180" y1="95" x2="180" y2="110" stroke="#334155" strokeWidth="3" />
          <line x1="210" y1="95" x2="212" y2="110" stroke="#334155" strokeWidth="3" />
          <line x1="240" y1="95" x2="245" y2="110" stroke="#334155" strokeWidth="3" />

          {/* Luz de Chuva Central FIA (Piscando Vermelho em Standby) */}
          <rect x="172" y="97" width="16" height="8" rx="2" fill={isRacing ? "#333333" : "#E10600"} filter={!isRacing ? "url(#f1-red-bloom)" : undefined} />

          {/* Pneu Traseiro Esquerdo (Pirelli P-Zero 405mm) */}
          <rect x="35" y="45" width="55" height="75" rx="8" fill="#111318" stroke="#1F2430" strokeWidth="3" />
          <line x1="45" y1="45" x2="45" y2="120" stroke="#2D3748" strokeWidth="2" />
          <circle cx="62" cy="82" r="16" fill="#0B0E14" stroke="#E10600" strokeWidth="3" />

          {/* Pneu Traseiro Direito */}
          <rect x="270" y="45" width="55" height="75" rx="8" fill="#111318" stroke="#1F2430" strokeWidth="3" />
          <line x1="315" y1="45" x2="315" y2="120" stroke="#2D3748" strokeWidth="2" />
          <circle cx="298" cy="82" r="16" fill="#0B0E14" stroke="#E10600" strokeWidth="3" />

          {/* Braços de Suspensão Wishbone em Carbono */}
          <line x1="90" y1="65" x2="135" y2="75" stroke="#475569" strokeWidth="4" />
          <line x1="90" y1="85" x2="135" y2="80" stroke="#475569" strokeWidth="4" />
          <line x1="270" y1="65" x2="225" y2="75" stroke="#475569" strokeWidth="4" />
          <line x1="270" y1="85" x2="225" y2="80" stroke="#475569" strokeWidth="4" />

          {/* Saída de Escapamento Central e Capô do Motor V6 Turbo */}
          <path d="M 140,55 L 220,55 L 210,95 L 150,95 Z" fill="#0D1117" stroke="#30363D" strokeWidth="2" />
          <circle cx="180" cy="72" r="11" fill="#1F2430" stroke="#E10600" strokeWidth="2.5" />
          {/* Efeito de Fogo no Escapamento na Arrancada */}
          {isRacing && launchElapsed < 0.8 && (
            <ellipse cx="180" cy="72" rx="14" ry="18" fill="#FF8C00" filter="url(#f1-red-bloom)" opacity="0.9" />
          )}

          {/* Cockpit, Halo de Titânio e Capacete do Piloto */}
          <ellipse cx="180" cy="38" rx="20" ry="16" fill="#1E293B" stroke="#475569" strokeWidth="3" />
          {/* Capacete com Viseira Espelhada */}
          <circle cx="180" cy="36" r="10" fill="#E10600" />
          <rect x="174" y="34" width="12" height="4" rx="1" fill="#FBBF24" />

          {/* Asa Traseira e Placas Laterais Aerodinâmicas (Regulamento FIA) */}
          <rect x="70" y="8" width="220" height="18" rx="4" fill="#0F141C" stroke="#E10600" strokeWidth="3" />
          <rect x="90" y="26" width="180" height="10" rx="2" fill="#1A202C" />
          {/* Suportes Centrais em Cisne da Asa Traseira (Swan-neck) */}
          <line x1="165" y1="26" x2="160" y2="60" stroke="#475569" strokeWidth="3.5" />
          <line x1="195" y1="26" x2="200" y2="60" stroke="#475569" strokeWidth="3.5" />
          {/* Placas Laterais da Asa (Endplates) */}
          <rect x="64" y="2" width="8" height="48" rx="3" fill="#E10600" />
          <rect x="288" y="2" width="8" height="48" rx="3" fill="#E10600" />
        </g>
      </svg>

      {/* Camada Dinâmica em Canvas 2D para Efeitos Volumétricos de Partículas */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 size-full"
      />
    </div>
  )
}
