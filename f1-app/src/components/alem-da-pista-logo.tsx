export function AlemDaPistaLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 0 8px rgba(225,6,0,0.4))" }}
      aria-label="Além da Pista"
    >
      <defs>
        <linearGradient id="carbonBase" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#181c2e" />
          <stop offset="100%" stopColor="#0a0c14" />
        </linearGradient>
        <linearGradient id="redApex" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E10600" />
          <stop offset="100%" stopColor="#FF3B30" />
        </linearGradient>
        <linearGradient id="cyanSpeed" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="100%" stopColor="#4FACFE" />
        </linearGradient>
      </defs>
      {/* Moldura base de fibra de carbono aero */}
      <rect width="100" height="100" rx="18" fill="url(#carbonBase)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      {/* Asas aerodinâmicas Apex em 'A' */}
      <path d="M18 78L45 16H55L82 78H67L50 36L33 78H18Z" fill="#FFFFFF" />
      {/* Linha de fluxo inferior em vermelho carmesim */}
      <path d="M34 60L76 60L68 72L26 72Z" fill="url(#redApex)" />
      {/* Aleta lateral de vórtice ciano */}
      <path d="M50 36L64 70L58 70L46 44Z" fill="url(#cyanSpeed)" opacity="0.85" />
      {/* Ponto ápice da vitória em ouro legítimo */}
      <circle cx="78" cy="22" r="8" fill="#FFD700" stroke="#000" strokeWidth="2" />
      <polygon points="78,17 80,21 84,21 81,24 82,28 78,25 74,28 75,24 72,21 76,21" fill="#000" />
    </svg>
  )
}
