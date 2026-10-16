import React, { useEffect, useRef, useState, useMemo } from "react"
import { THEMES } from "./team-theme-selector"
import { cn } from "@/lib/utils"

export const WING_ASSETS: Record<string, string> = {
  default: "/f1-front-wing.png",
  ferrari: "/f1-front-wing-ferrari.png",
  mercedes: "/f1-front-wing-mercedes.png",
  mclaren: "/f1-front-wing-mclaren.png",
  redbull: "/f1-front-wing-redbull.png",
  racingbulls: "/f1-front-wing-racingbulls.png",
  alpine: "/f1-front-wing-alpine.png",
  haas: "/f1-front-wing-haas.png",
  williams: "/f1-front-wing-williams.png",
  aston: "/f1-front-wing-aston.png",
  audi: "/f1-front-wing-audi.png",
  cadillac: "/f1-front-wing-cadillac.png",
}

export function getWingSrc(theme?: string): string {
  if (!theme || !(theme in WING_ASSETS)) {
    return WING_ASSETS.default
  }
  return WING_ASSETS[theme]
}

// Pré-carregamento imediato de todas as texturas 3D no navegador para troca com 0ms de latência
let isPreloaded = false
function preloadAllWings() {
  if (isPreloaded || typeof window === "undefined") return
  isPreloaded = true
  Object.values(WING_ASSETS).forEach((src) => {
    const img = new Image()
    img.src = src
  })
}

interface TeamWingProps {
  theme?: string
  series?: string
  className?: string
  isMobile?: boolean
  children?: React.ReactNode
}

export const TeamWing: React.FC<TeamWingProps> = ({
  theme = "default",
  series = "f1",
  className,
  isMobile = false,
  children,
}) => {
  const currentSrc = useMemo(() => getWingSrc(theme), [theme])
  const themeObj = useMemo(() => THEMES.find((t) => t.id === theme) || THEMES[0], [theme])
  
  // Dupla camada para transição cross-fade sem nenhum flash ou flicker
  const [activeSrc, setActiveSrc] = useState(currentSrc)
  const [prevSrc, setPrevSrc] = useState<string | null>(null)
  const [isCrossFading, setIsCrossFading] = useState(false)

  // 3D Interactive Tilt & Glow
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 })
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    preloadAllWings()
  }, [])

  useEffect(() => {
    if (currentSrc !== activeSrc) {
      setPrevSrc(activeSrc)
      setActiveSrc(currentSrc)
      setIsCrossFading(true)

      const timer = setTimeout(() => {
        setPrevSrc(null)
        setIsCrossFading(false)
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [currentSrc, activeSrc])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Efeito sutil e sofisticado de túnel de vento (máx ±3.5deg X, ±6deg Y)
    const rotateX = ((centerY - y) / centerY) * 3.5
    const rotateY = ((x - centerX) / centerX) * 6
    const glowX = (x / rect.width) * 100
    const glowY = (y / rect.height) * 100

    setTilt({ rotateX, rotateY, glowX, glowY })
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 })
  }

  const teamLabel = themeObj.id !== "default" ? themeObj.name : "Fórmula 1 Padrão"
  const altText = `Asa dianteira 3D - ${teamLabel} (Regulamento FIA 2026)`

  // Em mobile: versão ampliada, centralizada e elegante com cross-fade
  if (isMobile) {
    return (
      <div className={cn("w-full relative flex items-center justify-center select-none py-0.5", className)}>
        {/* Asa Dianteira em escala mobile ampliada perfeitamente integrada ao fundo do menu */}
        <div className="w-full relative flex items-center justify-center max-w-[500px] px-1">
          {prevSrc && isCrossFading && (
            <img
              src={prevSrc}
              alt={altText}
              aria-hidden="true"
              className="absolute inset-0 w-full h-auto max-h-[105px] object-contain select-none pointer-events-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.85)] transition-opacity duration-450 ease-in-out opacity-0"
            />
          )}
          <img
            src={activeSrc}
            alt={altText}
            className="w-full h-auto max-h-[105px] object-contain select-none pointer-events-none drop-shadow-[0_10px_22px_rgba(0,0,0,0.85)] transition-opacity duration-450 ease-in-out"
          />

          {/* Conteúdo sobreposto perfeitamente centralizado no bico da asa dianteira */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "-2px" }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Em desktop: Asa 3D em alta resolução com Tilt Parallax e Cross-Fade
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "w-full relative flex items-center justify-center select-none transition-transform duration-200 ease-out",
        className
      )}
      style={{
        perspective: "1000px",
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      }}
    >
      <div className="w-full relative flex items-center justify-center">
        {/* Glow dinâmico radial simulando iluminação aero de estúdio */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle at ${tilt.glowX}% ${tilt.glowY}%, var(--team-glow, rgba(255,255,255,0.08)) 0%, transparent 60%)`,
            opacity: isHovered ? 0.8 : 0.45,
          }}
        />

        {/* Camada Anterior de Transição (Cross-fade fade out) */}
        {prevSrc && isCrossFading && (
          <img
            src={prevSrc}
            alt={altText}
            aria-hidden="true"
            className="absolute inset-0 w-full h-auto max-h-[120px] lg:max-h-[134px] object-contain select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-opacity duration-500 ease-in-out opacity-0"
          />
        )}

        {/* Camada Ativa da Nova Livery (Cross-fade fade in) */}
        <img
          src={activeSrc}
          alt={altText}
          className={cn(
            "w-full h-auto max-h-[120px] lg:max-h-[134px] object-contain select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition-all duration-500 ease-in-out",
            isCrossFading ? "opacity-100" : "opacity-100"
          )}
        />

        {/* Badge Flutuante Sutil de Escuderia & Categoria no Hover */}
        {isHovered && themeObj.id !== "default" && (
          <div 
            className="absolute -bottom-1.5 px-3 py-0.5 rounded-full text-[10px] font-f1 tracking-widest uppercase font-bold text-white bg-black/80 border border-white/20 shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-none animate-in fade-in slide-in-from-bottom-1"
            style={{ borderColor: themeObj.accent || "rgba(255,255,255,0.3)" }}
          >
            {themeObj.name} · {series.toUpperCase()} Aerodynamic Spec 2026
          </div>
        )}

        {/* Conteúdo sobreposto (Cápsula F1 / F2 / F3) */}
        {children}
      </div>
    </div>
  )
}

// Compatibilidade retroativa caso referenciado
export const TeamWingLivery = TeamWing
