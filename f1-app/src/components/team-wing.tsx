import React from "react"

interface TeamWingProps {
  theme?: string
  className?: string
}

/**
 * Componente que renderiza a estrutura aerodinâmica (asa dianteira de F1)
 * na base do cabeçalho, substituindo a borda plana por uma peça física estilizada.
 * 
 * Regra de Identidade: Não intercepta cliques (pointer-events-none) e fica
 * localizada na camada inferior à cápsula de botões F1 / F2 / F3.
 */
export const TeamWing: React.FC<TeamWingProps> = ({ theme = "default", className = "" }) => {
  // Se for o tema Ferrari
  if (theme === "ferrari") {
    return (
      <div 
        className={`w-full relative z-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <svg 
          className="w-full h-6 sm:h-7 block transition-all duration-500" 
          viewBox="0 0 1200 28" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Trama de Fibra de Carbono 2x2 */}
            <pattern id="fw-carbon-pattern" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#101014" />
              <path d="M0 0L3 3M3 3L6 6M6 0L3 3M3 3L0 6" stroke="#1d1d26" strokeWidth="0.8" />
            </pattern>

            {/* Gradiente de Pintura Rosso Corsa Oficial */}
            <linearGradient id="fw-rosso-corsa" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B3001D" />
              <stop offset="12%" stopColor="#E8002D" />
              <stop offset="50%" stopColor="#FF1A44" />
              <stop offset="88%" stopColor="#E8002D" />
              <stop offset="100%" stopColor="#B3001D" />
            </linearGradient>

            {/* Filete Aerodinâmico Giallo Modena */}
            <linearGradient id="fw-giallo-modena" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#FFD600" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
          </defs>

          {/* 1. Base Estrutural / Plano Principal (Fibra de Carbono Exposta) */}
          <path 
            d="M 20,24 L 380,24 Q 400,24 420,26 L 430,26 Q 440,26 460,24 L 740,24 Q 760,26 770,26 L 780,26 Q 800,24 820,24 L 1180,24 L 1195,28 L 5,28 Z" 
            fill="url(#fw-carbon-pattern)" 
            stroke="#22222a" 
            strokeWidth="0.7" 
          />

          {/* 2. Flap Superior Esquerdo (Rosso Corsa) */}
          <path 
            d="M 25,12 L 390,12 Q 410,12 430,19 L 450,19 Q 470,12 490,12 L 530,12 L 530,18 L 485,18 Q 465,18 445,23 L 435,23 Q 415,18 395,18 L 25,18 Z" 
            fill="url(#fw-rosso-corsa)" 
            opacity="0.95" 
          />

          {/* 3. Flap Superior Direito (Rosso Corsa) */}
          <path 
            d="M 670,12 L 710,12 Q 730,12 750,19 L 770,19 Q 790,12 810,12 L 1175,12 L 1175,18 L 805,18 Q 785,18 765,23 L 755,23 Q 735,18 715,18 L 670,18 Z" 
            fill="url(#fw-rosso-corsa)" 
            opacity="0.95" 
          />

          {/* 4. Slot Gap com Filete Amarelo Modena (Esquerdo e Direito) */}
          <path 
            d="M 25,11 L 390,11 Q 410,11 430,18 L 450,18 Q 470,11 490,11 L 530,11" 
            stroke="url(#fw-giallo-modena)" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />
          <path 
            d="M 670,11 L 710,11 Q 730,11 750,18 L 770,18 Q 790,11 810,11 L 1175,11" 
            stroke="url(#fw-giallo-modena)" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />

          {/* 5. Berço Central do Bico (sob os botões de seleção de séries) */}
          <path 
            d="M 500,16 Q 600,23 700,16 L 700,22 Q 600,28 500,22 Z" 
            fill="#121216" 
            stroke="#FFD600" 
            strokeWidth="0.8" 
            opacity="0.85" 
          />

          {/* 6. Endplate Esquerdo com defletor aerodinâmico */}
          <polygon points="5,2 25,10 25,26 5,28" fill="#E8002D" stroke="#FFD600" strokeWidth="0.8" />
          <line x1="5" y1="14" x2="25" y2="17" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />

          {/* 7. Endplate Direito com defletor aerodinâmico */}
          <polygon points="1195,2 1175,10 1175,26 1195,28" fill="#E8002D" stroke="#FFD600" strokeWidth="0.8" />
          <line x1="1195" y1="14" x2="1175" y2="17" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
        </svg>

        {/* Glow difuso inferior projetado sobre o conteúdo */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600/40 to-transparent blur-[2px]" />
      </div>
    )
  }

  // Fallback padrão para temas sem asa dedicada ainda desenvolvida
  return (
    <div 
      className={`w-full h-[2px] transition-colors duration-700 ${className}`}
      style={{
        backgroundColor: "var(--team-border-color, hsl(var(--primary)/0.5))"
      }}
    />
  )
}
