import React from "react"

interface TeamWingLiveryProps {
  theme?: string
  className?: string
}

/**
 * Renderiza a pintura oficial (livery) da escuderia sobre a asa dianteira 3D no Desktop.
 * 
 * Regra de Identidade & Acessibilidade:
 * - pointer-events-none (não bloqueia cliques)
 * - Posicionado entre a base da imagem 3D e o seletor flutuante central
 */
export const TeamWingLivery: React.FC<TeamWingLiveryProps> = ({ theme = "default", className = "" }) => {
  // OPÇÃO 01: Scuderia Ferrari
  if (theme === "ferrari") {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${className}`}
        viewBox="0 0 1024 134"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fe-red-l" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C70020" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FF1A44" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#E8002D" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fe-red-r" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C70020" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FF1A44" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#E8002D" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="fe-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#FFD600" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Flap Esquerdo Rosso Corsa */}
        <path d="M 68,36 C 120,24 180,18 274,38 L 274,58 C 180,42 120,46 68,54 Z" fill="url(#fe-red-l)" opacity="0.85" />
        <path d="M 68,36 C 120,24 180,18 274,38" stroke="url(#fe-yellow)" strokeWidth="2" strokeLinecap="round" />

        {/* Flap Direito Rosso Corsa */}
        <path d="M 956,36 C 904,24 844,18 750,38 L 750,58 C 844,42 904,46 956,54 Z" fill="url(#fe-red-r)" opacity="0.85" />
        <path d="M 956,36 C 904,24 844,18 750,38" stroke="url(#fe-yellow)" strokeWidth="2" strokeLinecap="round" />

        {/* Endplates Vermelhos com Borda Amarela */}
        <path d="M 18,18 L 48,24 L 48,110 L 18,118 Z" fill="#E8002D" opacity="0.75" />
        <line x1="18" y1="18" x2="18" y2="118" stroke="#FFD600" strokeWidth="1.8" />
        <path d="M 1006,18 L 976,24 L 976,110 L 1006,118 Z" fill="#E8002D" opacity="0.75" />
        <line x1="1006" y1="18" x2="1006" y2="118" stroke="#FFD600" strokeWidth="1.8" />
      </svg>
    )
  }

  // OPÇÃO 02: Mercedes-AMG Petronas
  if (theme === "mercedes") {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500 ${className}`}
        viewBox="0 0 1024 134"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="merc-silver-l" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9A9EA6" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#E2E5EB" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#BEC2CC" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="merc-silver-r" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9A9EA6" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#E2E5EB" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#BEC2CC" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="petronas-teal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00A19B" />
            <stop offset="50%" stopColor="#27F4D2" />
            <stop offset="100%" stopColor="#00A19B" />
          </linearGradient>
        </defs>

        {/* Flap Superior Esquerdo: Prata Fosca Acetinada */}
        <path d="M 68,36 C 120,24 180,18 274,38 L 274,58 C 180,42 120,46 68,54 Z" fill="url(#merc-silver-l)" opacity="0.88" />
        {/* Flap Inferior Esquerdo: Acento em Verde Água Petronas Elétrico */}
        <path d="M 68,48 C 120,38 180,32 274,48 L 274,54 C 180,42 120,44 68,52 Z" fill="#27F4D2" opacity="0.9" />
        {/* Bordo de Ataque Verde Petronas */}
        <path d="M 68,36 C 120,24 180,18 274,38" stroke="url(#petronas-teal-grad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Flap Superior Direito: Prata Fosca Acetinada */}
        <path d="M 956,36 C 904,24 844,18 750,38 L 750,58 C 844,42 904,46 956,54 Z" fill="url(#merc-silver-r)" opacity="0.88" />
        {/* Flap Inferior Direito: Acento em Verde Água Petronas Elétrico */}
        <path d="M 956,48 C 904,38 844,32 750,48 L 750,54 C 844,42 904,44 956,52 Z" fill="#27F4D2" opacity="0.9" />
        {/* Bordo de Ataque Verde Petronas */}
        <path d="M 956,36 C 904,24 844,18 750,38" stroke="url(#petronas-teal-grad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Endplates Prata com Contorno Verde Água */}
        <path d="M 18,18 L 48,24 L 48,110 L 18,118 Z" fill="url(#merc-silver-l)" opacity="0.8" />
        <line x1="18" y1="18" x2="18" y2="118" stroke="#27F4D2" strokeWidth="2" />
        <line x1="48" y1="24" x2="48" y2="110" stroke="#27F4D2" strokeWidth="1.2" opacity="0.7" />

        <path d="M 1006,18 L 976,24 L 976,110 L 1006,118 Z" fill="url(#merc-silver-r)" opacity="0.8" />
        <line x1="1006" y1="18" x2="1006" y2="118" stroke="#27F4D2" strokeWidth="2" />
        <line x1="976" y1="24" x2="976" y2="110" stroke="#27F4D2" strokeWidth="1.2" opacity="0.7" />
      </svg>
    )
  }

  return null
}
