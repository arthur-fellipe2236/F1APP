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
export const TeamWingLivery: React.FC<TeamWingLiveryProps> = () => {
  // As pinturas e acabamentos de cada equipe agora são renderizados diretamente 
  // nos assets 3D dedicados (/f1-front-wing-ferrari.png, /f1-front-wing-mercedes.png, etc.),
  // preservando a iluminação física, texturas de fibra de carbono e reflexos especulares.
  return null
}

