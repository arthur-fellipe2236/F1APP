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
  Clock,
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
    id: "team_principal",
    term: "Team Principal",
    category: "Geral",
    definition: "Líder geral e diretor executivo da equipe, responsável pela gestão esportiva, financeira, contratações e representação oficial perante a FIA.",
  },
  {
    id: "engenheiro_corrida",
    term: "Engenheiro de corrida",
    category: "Geral",
    definition: "Ponto central de comunicação no rádio com o piloto durante as sessões, orientando acertos mecânicos, ritmo e procedimentos operacionais.",
  },
  {
    id: "engenheiro_desempenho",
    term: "Engenheiro de desempenho",
    category: "Carro",
    definition: "Especialista técnico que analisa dados de telemetria, comportamento dos pneus, freios e equilíbrio dinâmico para extrair velocidade máxima do carro.",
  },
  {
    id: "estrategista",
    term: "Estrategista",
    category: "Pista",
    definition: "Profissional que utiliza modelos matemáticos e simulações para calcular o melhor momento de paradas nos boxes, escolha de pneus e reação ao tráfego.",
  },
  {
    id: "pit_wall",
    term: "Pit wall",
    category: "Pista",
    definition: "Estação de comando instalada na mureta dos boxes voltada para a reta principal, onde chefes e engenheiros acompanham a corrida em múltiplos monitores.",
  },
  {
    id: "pit_crew",
    term: "Pit crew",
    category: "Pista",
    definition: "Equipe de mecânicos altamente treinados que executa a troca dos quatro pneus em cerca de dois segundos e eventuais ajustes de asa.",
  },
  {
    id: "garagem",
    term: "Garagem",
    category: "Pista",
    definition: "Área fechada nos boxes onde o carro é inspecionado, reparado, calibrado e abastecido com sistemas de engenharia de ponta.",
  },
  {
    id: "gps",
    term: "GPS",
    category: "Geral",
    definition: "Sistema oficial de posicionamento por satélite que rastreia as coordenadas de todos os carros no circuito para análise de setores e segurança.",
  },
  {
    id: "dados_desempenho",
    term: "Dados de desempenho",
    category: "Carro",
    definition: "Informações coletadas por sensores sobre velocidade em curvas, forças G, pressão de freios e temperaturas para guiar o trabalho de evolução do carro.",
  },
  {
    id: "setup",
    term: "Setup",
    category: "Carro",
    definition: "Conjunto de regulagens mecânicas e aerodinâmicas (inclinação de asas, rigidez de molas, altura do solo, cambagem) adaptado para cada circuito.",
  },
  {
    id: "degradacao_pneus",
    term: "Degradação dos pneus",
    category: "Carro",
    definition: "Perda gradual de aderência e aumento do tempo de volta causada pelo superaquecimento e desgaste da borracha ao longo de sequências de voltas.",
  },
  {
    id: "cost_cap",
    term: "Cost cap",
    category: "Campeonato",
    definition: "Teto orçamentário anual regulamentado pela FIA para limitar os custos elegíveis de desenvolvimento dos carros e promover equilíbrio esportivo.",
  },
  {
    id: "simulacao",
    term: "Simulação",
    category: "Geral",
    definition: "Modelagem virtual e computacional de cenários de corrida, escoamento de ar (CFD) ou acertos de suspensão para validar hipóteses antes da pista.",
  },
  {
    id: "formula",
    term: "Fórmula",
    category: "Geral",
    definition: "Conjunto de regulamentos técnicos e esportivos rígidos e unificados que definem as condições de construção dos carros e de disputa da categoria.",
  },
  {
    id: "grand_prix",
    term: "Grand Prix",
    category: "Geral",
    definition: "Expressão tradicional ('Grande Prêmio') usada desde as origens do automobilismo para designar uma corrida principal de primeira grandeza.",
  },
  {
    id: "campeonato_pilotos",
    term: "Campeonato de pilotos",
    category: "Campeonato",
    definition: "Competição oficial da FIA que coroa o piloto individual que acumula a maior pontuação durante todas as etapas do ano.",
  },
  {
    id: "campeonato_construtores",
    term: "Campeonato de construtores",
    category: "Campeonato",
    definition: "Competição oficial entre as equipes e fabricantes de chassis, somando os pontos obtidos pelos dois carros de cada escuderia.",
  },
  {
    id: "aerodinamica",
    term: "Aerodinâmica",
    category: "Carro",
    definition: "Estudo e aplicação do fluxo de ar sobre e sob o carro para gerar estabilidade, resfriamento e pressão descendente sem arrasto excessivo.",
  },
  {
    id: "downforce",
    term: "Downforce",
    category: "Carro",
    definition: "Força aerodinâmica descendente gerada por asas, difusores e efeito solo que empurra o carro contra o asfalto, aumentando a velocidade em curvas.",
  },
  {
    id: "unidade_potencia",
    term: "Unidade de potência (Power Unit)",
    category: "Carro",
    definition: "Conjunto propulsor integrado composto pelo motor de combustão interna (ICE), turbo e sistemas elétricos de recuperação e entrega de energia.",
  },
  {
    id: "hibrido",
    term: "Híbrido",
    category: "Carro",
    definition: "Sistema que combina propulsão a combustão tradicional com motores elétricos e baterias para maximizar a potência e a eficiência energética.",
  },
  {
    id: "halo",
    term: "Halo",
    category: "Carro",
    definition: "Estrutura curva de proteção em titânio instalada sobre o cockpit desde 2018 para proteger a cabeça do piloto contra impactos e detritos.",
  },
  {
    id: "hans",
    term: "HANS (Head and Neck Support)",
    category: "Carro",
    definition: "Dispositivo de segurança obrigatório apoiado nos ombros e conectado ao capacete para evitar desacelerações extremas e lesões na coluna cervical.",
  },
  {
    id: "regulamento_tecnico",
    term: "Regulamento técnico",
    category: "Geral",
    definition: "Caderno oficial de normas da FIA que determina as dimensões, pesos, materiais, motores e aerodinâmica permitidos em cada geração de carros.",
  },
  {
    id: "regulamento_esportivo",
    term: "Regulamento esportivo",
    category: "Geral",
    definition: "Conjunto de regras da FIA que disciplina o formato do fim de semana, procedimentos de largada, conduta em pista, bandeiras e penalidades.",
  },
  {
    id: "pole_position",
    term: "Pole position",
    category: "Pista",
    definition: "A primeira posição do grid de largada, conquistada pelo piloto mais rápido na sessão classificatória oficial.",
  },
  {
    id: "era_hibrida",
    term: "Era híbrida",
    category: "Geral",
    definition: "Período da F1 iniciado em 2014 com a adoção dos motores V6 turbo híbridos com recuperação de energia térmica e cinética.",
  },
  {
    id: "recharge",
    term: "Recharge (Recuperação de Energia)",
    category: "Carro",
    definition: "Gerenciamento e recuperação de energia cinética nas frenagens e de fluxo térmico para recarregar o sistema de baterias da unidade de potência.",
  },
  {
    id: "estrategia_corrida",
    term: "Estratégia de corrida",
    category: "Geral",
    definition: "Planejamento dinâmico que define o momento das paradas, uso dos compostos de pneus e ritmo de prova para maximizar o resultado da equipe.",
  },
  {
    id: "composto",
    term: "Composto",
    category: "Carro",
    definition: "Tipo e dureza da borracha do pneu (Macio, Médio, Duro, Intermediário e Chuva Extrema) adaptado à pista e temperatura.",
  },
  {
    id: "degradacao",
    term: "Degradação",
    category: "Carro",
    definition: "Perda térmica e mecânica de desempenho e aderência do pneu ao longo das voltas decorrentes do atrito com o asfalto.",
  },
  {
    id: "desgaste",
    term: "Desgaste",
    category: "Carro",
    definition: "Consumo físico da borracha da banda de rodagem, aproximando o pneu da carcaça estrutural.",
  },
  {
    id: "janela_parada",
    term: "Janela de parada",
    category: "Pista",
    definition: "Intervalo de voltas calculado pelos estrategistas no qual fazer o pit stop traz o menor prejuízo de tempo e tráfego.",
  },
  {
    id: "pitstop",
    term: "Pit stop",
    category: "Pista",
    definition: "Parada nos boxes onde a equipe troca os quatro pneus em cerca de 2 segundos e faz eventuais ajustes na asa dianteira.",
  },
  {
    id: "undercut",
    term: "Undercut",
    category: "Pista",
    definition: "Manobra estratégica de antecipar o pit stop para usar pneus novos e superar o rival quando ele fizer a parada voltas depois.",
  },
  {
    id: "overcut",
    term: "Overcut",
    category: "Pista",
    definition: "Estratégia de permanecer na pista com ar limpo enquanto o rival para, tirando vantagem de ritmo ou de uma neutralização.",
  },
  {
    id: "gap",
    term: "Gap",
    category: "Pista",
    definition: "Diferença de tempo em segundos entre dois pilotos na pista ou a distância total de um carro em relação ao líder.",
  },
  {
    id: "ritmo_corrida",
    term: "Ritmo de corrida",
    category: "Geral",
    definition: "Capacidade do carro e do piloto de manter tempos de volta velozes e consistentes com tanque cheio e desgaste de pneus.",
  },
  {
    id: "trafego",
    term: "Tráfego",
    category: "Pista",
    definition: "Presença de carros mais lentos ou retardatários à frente que geram ar turbulento e atrasam o tempo de volta.",
  },
  {
    id: "telemetria",
    term: "Telemetria",
    category: "Geral",
    definition: "Transmissão sem fio de centenas de sensores do carro em tempo real para os computadores dos engenheiros no muro dos boxes.",
  },
  {
    id: "safety_car",
    term: "Safety Car",
    category: "Pista",
    definition: "Carro de segurança físico que entra na pista para neutralizar e liderar o pelotão em velocidade reduzida durante acidentes.",
  },
  {
    id: "virtual_safety_car",
    term: "Virtual Safety Car (VSC)",
    category: "Pista",
    definition: "Procedimento eletrônico que impõe tempo delta mínimo obrigatório em todos os setores sem a presença do carro físico na pista.",
  },
  {
    id: "pneus_intermediarios",
    term: "Pneus intermediários",
    category: "Carro",
    definition: "Compostos com sulcos médios identificados pela faixa verde, indicados para asfalto molhado sem poças profundas.",
  },
  {
    id: "pneus_chuva_extrema",
    term: "Pneus de chuva extrema",
    category: "Carro",
    definition: "Pneus com sulcos profundos com faixa azul, capazes de evacuar até 85 litros de água por segundo em chuva intensa.",
  },
  {
    id: "f1",
    term: "F1",
    category: "Geral",
    definition: "Fórmula 1, categoria de automobilismo de mais alto nível tecnológico e esportivo.",
  },
  {
    id: "grid",
    term: "Grid de largada",
    category: "Pista",
    definition: "Posições ordenadas em que os carros alinham na reta principal para iniciar o GP.",
  },
  {
    id: "ultrapassagem",
    term: "Ultrapassagem",
    category: "Pista",
    definition: "Manobra controlada em que um carro supera outro na pista dentro das regras e limites estabelecidos.",
  },
  {
    id: "defesa_posicao",
    term: "Defesa de posição",
    category: "Pista",
    definition: "Ação do piloto à frente para dificultar a passagem do adversário escolhendo sua linha sem mudanças perigosas de direção.",
  },
  {
    id: "disputa_roda_a_roda",
    term: "Disputa roda a roda",
    category: "Pista",
    definition: "Momento de alta tensão em que dois carros emparelham lado a lado e dividem o espaço de frenagem e contorno de curva.",
  },
  {
    id: "vacuo",
    term: "Vácuo (Slipstream)",
    category: "Pista",
    definition: "Bolsão de ar de baixa pressão criado atrás do carro líder que permite ao perseguidor atingir maior velocidade em reta.",
  },
  {
    id: "trajetoria",
    term: "Trajetória",
    category: "Pista",
    definition: "Linha geométrica e dinâmica traçada pelo piloto na entrada, tangência e saída da curva.",
  },
  {
    id: "ponto_frenagem",
    term: "Ponto de frenagem",
    category: "Pista",
    definition: "Marca visual na pista onde o piloto pressiona o pedal com força máxima para desacelerar antes de virar o volante.",
  },
  {
    id: "apex",
    term: "Apex (Ponto de Tangência)",
    category: "Pista",
    definition: "Ponto mais interno da curva por onde o carro passa para otimizar o raio e a velocidade de saída.",
  },
  {
    id: "limites_pista",
    term: "Limites de pista",
    category: "Pista",
    definition: "Linhas brancas que delimitam a área de competição; exceder com as 4 rodas pode acarretar perda de tempo ou penalidade.",
  },
  {
    id: "aerodinamica_ativa",
    term: "Aerodinâmica ativa",
    category: "Carro",
    definition: "Tecnologia de 2026 que ajusta os elementos móveis das asas dianteira e traseira entre modos de curva e reta.",
  },
  {
    id: "corner_mode",
    term: "Corner Mode",
    category: "Carro",
    definition: "Configuração de asa fechada de alta sustentação para máxima pressão aerodinâmica (downforce) nas curvas.",
  },
  {
    id: "straight_mode",
    term: "Straight Mode",
    category: "Carro",
    definition: "Configuração de baixa resistência (baixo arrasto) em zonas de reta autorizadas para elevar a velocidade final.",
  },
  {
    id: "overtake_mode",
    term: "Overtake Mode",
    category: "Carro",
    definition: "Recurso regulamentar de 2026 que libera impulso adicional de potência elétrica para apoiar tentativas de ultrapassagem.",
  },
  {
    id: "boost_mode",
    term: "Boost Mode",
    category: "Carro",
    definition: "Modo de entrega tática de energia elétrica da bateria que o piloto pode acionar tanto para atacar quanto para defender.",
  },
  {
    id: "drs_tradicional",
    term: "DRS tradicional",
    category: "Carro",
    definition: "Sistema histórico (2011–2025) que abria a asa traseira a menos de 1s do carro da frente; substituído em 2026 pela aerodinâmica ativa.",
  },
  {
    id: "comissarios",
    term: "Comissários da FIA (Stewards)",
    category: "Geral",
    definition: "Painel independente de juízes que analisa telemetria e imagens de incidentes para aplicar advertências e punições.",
  },
  {
    id: "investigacao",
    term: "Investigação",
    category: "Pista",
    definition: "Abertura oficial de análise de um incidente de corrida; não implica condenação prévia.",
  },
  {
    id: "penalidade",
    term: "Penalidade de tempo",
    category: "Pista",
    definition: "Punição de 5 ou 10 segundos adicionados ao tempo do piloto na parada ou no resultado final da prova.",
  },
  {
    id: "reentrada_pista",
    term: "Reentrada na pista",
    category: "Pista",
    definition: "Retorno seguro de um carro que escapou para a área de escape, sem criar perigo para os competidores em pista.",
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
  subtitle?: string
  estimatedDurationLabel?: string
  durationSec?: number
  imageUrl: string
  audioUrl: string
  ambientAudioUrl?: string
  ambientDescription?: string
  shortSummary?: string
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
    | "mod3_weekend_format"
    | "mod3_practice_analysis"
    | "mod3_qualifying_grid"
    | "mod3_start_sequence"
    | "mod3_race_tower"
    | "mod3_pitstop_strategy"
    | "mod3_flags_safety_car"
    | "mod3_finish_championship"
    | "mod4_roles_strategy"
    | "mod4_tire_choice_sim"
    | "mod4_pitstop_timing_calc"
    | "mod4_safety_car_rain"
    | "mod4_telemetry_radio_data"
    | "mod4_alternate_plans"
    | "mod4_strategist_challenge"
    | "mod4_strategic_thinking_summary"
    | "mod5_overtaking_anatomy"
    | "mod5_attack_tech_2026"
    | "mod5_defense_limits"
    | "mod5_side_by_side_rules"
    | "mod5_track_limits_runoff"
    | "mod5_stewards_investigations"
    | "mod5_overtaking_challenges"
    | "mod5_overtaking_summary"
    | "mod6_birth_of_f1"
    | "mod6_cars_evolution"
    | "mod6_legendary_drivers"
    | "mod6_rivalries"
    | "mod6_safety_evolution"
    | "mod6_senna_brazil_legacy"
    | "mod6_modern_f1_2026"
    | "mod6_history_summary"
    | "mod7_team_roles"
    | "mod7_radio_communication"
    | "mod7_pitwall_command"
    | "mod7_pitstop_anatomy"
    | "mod7_telemetry_analysis"
    | "mod7_two_drivers_one_team"
    | "mod7_cost_cap_development"
    | "mod7_team_principal_challenge"
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

// ============================================================================
// CENAS DO MÓDULO 3 — DENTRO DA CORRIDA: APRENDA A ACOMPANHAR A TRANSMISSÃO
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 4 — A MENTE POR TRÁS DA CORRIDA: ESTRATÉGIA, PNEUS E BOXES
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 5 — A ARTE DE ULTRAPASSAR: ATAQUE, DEFESA E REGRAS
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 6 — A HISTÓRIA DA FÓRMULA 1 (75 ANOS DE EVOLUÇÃO)
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 7 — POR TRÁS DA EQUIPE: ENGENHEIROS, ESTRATÉGIA E DADOS
// ============================================================================
export const MODULE_7_SCENES: ModuleScene[] = [
  {
    id: "m7_c1",
    number: 1,
    title: "Uma Equipe é Muito Mais do que um Carro",
    subtitle: "Quem faz a Fórmula 1 acontecer nos bastidores",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo7/cena01.mp3",
    narrationTranscript:
      "Olá! Seja bem-vindo ao Módulo 7 de Novatos na F1: Por Trás da Equipe! Quando você assiste a uma corrida, é fácil focar apenas no piloto que está no cockpit. Mas a verdade é que um carro de Fórmula 1 é operado por centenas de pessoas altamente especializadas. Na liderança geral está o Team Principal, que coordena as diretrizes esportivas e financeiras. Ao lado do piloto atuam os engenheiros de corrida e de desempenho, ajustando cada parâmetro mecânico. Na fábrica e nos boxes, projetistas aerodinâmicos, analistas de dados, mecânicos de montagem e equipes de logística trabalham em perfeita sintonia. O piloto é quem acelera na pista, mas o resultado final é uma vitória de todo o time.",
    visualEffectType: "mod7_team_roles",
  },
  {
    id: "m7_c2",
    number: 2,
    title: "O Engenheiro e o Rádio",
    subtitle: "Uma voz no rádio. Uma equipe inteira por trás",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo7/cena02.mp3",
    narrationTranscript:
      "A relação entre o piloto e seu engenheiro de corrida é uma das parcerias mais intensas do esporte. Durante a prova, o engenheiro é o único elo de voz do piloto com o mundo exterior. Ele precisa filtrar milhares de informações para transmitir apenas o que é essencial: tráfego, ritmo dos adversários, modo de motor e condições de pista. Quando o piloto relata pelo rádio que o carro está saindo de frente em uma curva, os engenheiros comparam essa sensação humana com os dados dos sensores para sugerir ajustes na asa ou no diferencial. É uma conversa rápida, codificada e onde cada segundo de hesitação custa posições.",
    visualEffectType: "mod7_radio_communication",
  },
  {
    id: "m7_c3",
    number: 3,
    title: "O Pit Wall: Centro de Decisões",
    subtitle: "A corrida também é disputada na estratégia",
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo7/cena03.mp3",
    narrationTranscript:
      "Ao lado da pista, de frente para a reta principal, fica o famoso Pit Wall. Ali sentam os líderes da equipe: o chefe de equipe, o diretor esportivo e os chefes de estratégia e engenharia. Em suas telas brilhantes, eles acompanham um fluxo contínuo de dados: intervalos em tempo real, telemetria de degradação dos pneus, radares meteorológicos e simulações probabilísticas. É no pit wall que se decide se a equipe deve arriscar um undercut, estender uma sequência de voltas ou reagir a um Safety Car. Cada comando enviado pelo rádio é fruto de cálculos matemáticos para maximizar as chances de pontos.",
    visualEffectType: "mod7_pitwall_command",
  },
  {
    id: "m7_c4",
    number: 4,
    title: "Mecânicos e Pit Stops",
    subtitle: "Segundos que exigem meses de preparação",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo7/cena04.mp3",
    narrationTranscript:
      "No pit lane, uma parada nos boxes dura pouco mais de dois segundos, mas exige meses de treinamento atlético e precisão milimétrica. Cerca de vinte mecânicos atuam em sincronia perfeita: erguem o carro com macacos dianteiro e traseiro, desaparafusam as porcas com pistolas pneumáticas de alta velocidade, retiram as rodas antigas, encaixam os novos compostos e liberam o piloto com um sinal luminoso. Além da troca rápida, os mecânicos são responsáveis por montar, inspecionar e revisar cada componente do carro entre as sessões. Um trabalho exaustivo onde a segurança é sempre a regra número um.",
    visualEffectType: "mod7_pitstop_anatomy",
  },
  {
    id: "m7_c5",
    number: 5,
    title: "Telemetria e Dados",
    subtitle: "O carro fala através de mais de 300 sensores",
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo7/cena05.mp3",
    narrationTranscript:
      "Um carro de Fórmula 1 moderno possui mais de trezentos sensores distribuídos por todos os sistemas. Eles medem pressão hidráulica, temperatura dos freios, rotação do motor, velocidade das rodas e aceleração lateral. Esses dados são transmitidos instantaneamente para a garagem e para a fábrica através da telemetria. Os engenheiros conseguem sobrepor duas voltas na tela do computador para ver exatamente onde o piloto freou mais cedo ou acelerou melhor na saída de uma curva. A telemetria não pilota o carro remotamente, mas serve como um raio-x digital para diagnosticar problemas e encontrar frações de segundo.",
    visualEffectType: "mod7_telemetry_analysis",
  },
  {
    id: "m7_c6",
    number: 6,
    title: "Dois Pilotos, Uma Equipe",
    subtitle: "Cooperação e competição no limite da pista",
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo7/cena06.mp3",
    narrationTranscript:
      "Na Fórmula 1, seu companheiro de equipe é a sua primeira referência e também o seu maior rival, porque ele é o único na pista que pilota exatamente o mesmo equipamento que você. Mas a equipe pontua de forma combinada no Campeonato de Construtores, que é de onde vem a maior parte da premiação financeira. Por isso, os pilotos compartilham seus dados de telemetria e trabalham juntos no acerto do carro. Quando os dois carros disputam a mesma curva na pista, a equipe exige respeito mútuo, pois uma colisão entre companheiros é o pior cenário possível para qualquer escuderia.",
    visualEffectType: "mod7_two_drivers_one_team",
  },
  {
    id: "m7_c7",
    number: 7,
    title: "Desenvolvimento e Limite de Custos",
    subtitle: "O desafio do Cost Cap na busca por desempenho",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo7/cena07.mp3",
    narrationTranscript:
      "Construir um carro vencedor exige um imenso investimento tecnológico. No passado, equipes com orçamentos gigantescos gastavam centenas de milhões de dólares a mais que as equipes menores. Para equilibrar o grid e garantir a sobrevivência financeira do esporte, a FIA implementou o regulamento de Cost Cap, que estabelece um teto de gastos rigoroso para o desenvolvimento dos carros. Com esse limite, as equipes não podem simplesmente gastar sem parar; elas precisam escolher com inteligência onde aplicar cada recurso, equilibrando atualizações aerodinâmicas, confiabilidade mecânica e testes no túnel de vento.",
    visualEffectType: "mod7_cost_cap_development",
  },
  {
    id: "m7_c8",
    number: 8,
    title: "Desafio: Você é o Chefe da Equipe",
    subtitle: "A corrida está em suas mãos na reta final",
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo7/cena08.mp3",
    narrationTranscript:
      "Agora que você conheceu todos os bastidores de uma equipe de Fórmula 1, chegou a sua vez de liderar! Na nossa simulação interativa, você vai assumir o papel de chefe de equipe na reta final de uma corrida imprevisível. Analise os relatos do piloto, avalie a telemetria, monitore a aproximação dos adversários e tome as decisões certas sobre pneus e estratégia. Lembre-se: na Fórmula 1, velocidade na pista é fundamental, mas transformar dados em decisões corretas é o que separa os vencedores dos derrotados. Boa sorte no comando da equipe!",
    visualEffectType: "mod7_team_principal_challenge",
  },
]

export const MODULE_6_SCENES: ModuleScene[] = [
  {
    id: "m6_c1",
    number: 1,
    title: "O Nascimento da Fórmula 1",
    subtitle: "Antes de tudo, a largada: 1950 e as origens dos GPs",
    imageUrl: "/novatos/modulo1/cena02_1950.jpg",
    audioUrl: "/audio/novatos/modulo6/cena01.mp3",
    narrationTranscript:
      "Olá! Bem-vindo ao Módulo 6 de Novatos na F1. Hoje vamos viajar por 75 anos de velocidade, coragem e evolução. Antes de existir um campeonato mundial oficial, as corridas de Grand Prix já empolgavam multidões pela Europa desde o final do século dezenove. Mas após a Segunda Guerra Mundial, o automobilismo se reorganizou e a Federação Internacional de Automobilismo estabeleceu a Fórmula 1. A palavra Fórmula significa exatamente isso: um conjunto rígido de regras técnicas e esportivas para nivelar a disputa. O marco inaugural do campeonato aconteceu em treze de maio de 1950, no circuito de Silverstone, no Grande Prêmio da Grã-Bretanha. O italiano Giuseppe Farina, ao volante de uma Alfa Romeo, venceu a corrida e tornou-se o primeiro campeão mundial da história. Naquela época, os carros tinham motor dianteiro, não havia asas aerodinâmicas e a segurança era quase inexistente. Uma era de bravura que plantou as raízes de tudo o que vemos hoje.",
    visualEffectType: "mod6_birth_of_f1",
  },
  {
    id: "m6_c2",
    number: 2,
    title: "A Revolução dos Carros",
    subtitle: "Máquinas que mudaram o esporte: dos anos 50 a 2026",
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo6/cena02.mp3",
    narrationTranscript:
      "A Fórmula 1 nunca parou no tempo. Cada década transformou profundamente as máquinas na pista. Nos anos 1950, os carros eram tubulares, com pneus estreitos e mecânica tradicional. Já nos anos 1960, a Cooper e a Lotus consolidaram uma revolução: posicionar o motor atrás do piloto, melhorando o centro de gravidade e a agilidade nas curvas. Nos anos 1970 e 1980, surgiu a aerodinâmica com as primeiras asas e o efeito solo, acompanhada pela explosão dos motores turbo, que ultrapassavam mil cavalos em classificação. Nos anos 1990 e 2000, entraram em cena a fibra de carbono, suspensões ativas e eletrônica de ponta com os potentes motores V10. Em 2014, teve início a Era Híbrida, combinando motores de combustão com potentes sistemas elétricos de recuperação de energia. E para 2026, chega a nova geração: carros com aerodinâmica ativa e unidades de potência com divisão praticamente igual entre potência térmica e elétrica.",
    visualEffectType: "mod6_cars_evolution",
  },
  {
    id: "m6_c3",
    number: 3,
    title: "Os Pilotos que Marcaram Época",
    subtitle: "Os nomes que entraram para a história",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo6/cena03.mp3",
    narrationTranscript:
      "Ao longo de mais de sete décadas, milhares de pilotos disputaram curvas no limite, mas alguns nomes se tornaram imortais. Comparar épocas distantes exige muito cuidado, porque Juan Manuel Fangio, pentacampeão nos anos 1950, corria com óculos de motociclista e circuitos de rua sem proteção. Nos anos 1960, o escocês Jim Clark assombrou o mundo pela suavidade e precisão ao volante. Jackie Stewart conquistou três títulos e liderou a cruzada pioneira pela segurança das pistas. Niki Lauda provou determinação inacreditável ao sobreviver a um terrível acidente em 1976 e voltar a vencer. Alain Prost destacou-se pela inteligência estratégica como O Professor. Ayrton Senna encantou o planeta com velocidade pura em voltas rápidas e maestria na chuva. Michael Schumacher redefiniu o condicionamento físico e o trabalho de equipe com sete títulos mundiais, marca igualada por Lewis Hamilton, recordista absoluto de poles e vitórias. Cada um dominou sua era dentro de suas próprias circunstâncias históricas.",
    visualEffectType: "mod6_legendary_drivers",
  },
  {
    id: "m6_c4",
    number: 4,
    title: "Rivalidades que Definiram Gerações",
    subtitle: "Quando a disputa vai além da velocidade",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo6/cena04.mp3",
    narrationTranscript:
      "A história da Fórmula 1 também é feita de grandes duelos. Rivalidades intensas colocaram estilos opostos frente a frente e pararam o mundo esportivo. Em 1976, o carisma impulsivo do britânico James Hunt mediu forças contra a meticulosidade austríaca de Niki Lauda, decidido sob chuva torrencial em Fuji. No final dos anos 1980 e início dos anos 1990, Ayrton Senna e Alain Prost protagonizaram a rivalidade mais emblemática do automobilismo dentro da mesma equipe, a McLaren. A velocidade visceral e determinação de Senna contrastavam com a precisão tática e consistência de Prost, gerando decisões de campeonato históricas. Décadas depois, Michael Schumacher travou batalhas épicas contra Damon Hill, Jacques Villeneuve e Mika Häkkinen, enquanto Lewis Hamilton viveu disputas eletrizantes contra Nico Rosberg e Max Verstappen. Uma rivalidade de verdade não depende de atritos pessoais, mas da busca implacável por cada milésimo de segundo.",
    visualEffectType: "mod6_rivalries",
  },
  {
    id: "m6_c5",
    number: 5,
    title: "A Segurança: Lições Vitais",
    subtitle: "Evoluir também significa proteger vidas",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo6/cena05.mp3",
    narrationTranscript:
      "Nas primeiras décadas da Fórmula 1, o perigo fazia parte da rotina. Pilotos usavam capacetes abertos de couro, macacões de tecido comum e corriam em pistas cercadas por árvores e postes. Foi graças à coragem de pilotos como Jackie Stewart e à evolução técnica que a segurança se tornou prioridade absoluta. Surgiram células de sobrevivência em fibra de carbono, tanques de combustível deformáveis, macacões à prova de fogo e o dispositivo HANS para proteger a coluna cervical. O trágico fim de semana de Imola em 1994, com as mortes de Roland Ratzenberger e Ayrton Senna, gerou uma comoção mundial que acelerou reformas profundas em circuitos, testes de impacto e protocolos médicos chefiados pelo Professor Sid Watkins. Mais recentemente, em 2018, a FIA introduziu o Halo, estrutura de titânio sobre o cockpit que já salvou vidas em múltiplos incidentes graves. O automobilismo nunca será totalmente isento de riscos, mas a missão contínua da engenharia é proteger a vida de quem está ao volante.",
    visualEffectType: "mod6_safety_evolution",
  },
  {
    id: "m6_c6",
    number: 6,
    title: "Ayrton Senna e o Legado Brasileiro",
    subtitle: "O Brasil que acelerou o mundo",
    imageUrl: "/radio/senna.jpg",
    audioUrl: "/audio/novatos/modulo6/cena06.mp3",
    narrationTranscript:
      "Para os brasileiros, a Fórmula 1 tem uma ligação emocional profunda. Nascido em São Paulo em 1960, Ayrton Senna estreou na F1 em 1984 pela Toleman, brilhou na Lotus e alcançou o topo do mundo na McLaren, conquistando os campeonatos mundiais de 1988, 1990 e 1991. Suas voltas de classificação quase perfeitas e sua habilidade inacreditável no asfalto molhado transformaram suas vitórias em momentos de orgulho nacional nas manhãs de domingo. O acidente fatal em Imola, no dia primeiro de maio de 1994, interrompeu sua trajetória, mas seu legado transcendeu o esporte com a criação do Instituto Ayrton Senna, que apoia a educação de milhões de jovens. Senna faz parte de uma linhagem de ouro que inclui Emerson Fittipaldi, primeiro brasileiro campeão do mundo, Nelson Piquet, com três títulos mundiais, além de grandes vencedores e vice-campeões como Rubens Barrichello e Felipe Massa. O Brasil construiu capítulos essenciais da história da Fórmula 1.",
    visualEffectType: "mod6_senna_brazil_legacy",
  },
  {
    id: "m6_c7",
    number: 7,
    title: "A F1 Moderna e a Revolução de 2026",
    subtitle: "O futuro também faz parte da história",
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo6/cena07.mp3",
    narrationTranscript:
      "Hoje, a Fórmula 1 é o laboratório de engenharia mais avançado e assistido do planeta. Centenas de engenheiros utilizam simulações em supercomputadores, túneis de vento e inteligência de dados para otimizar frações de segundo. E em 2026, a categoria dá mais um salto monumental. Os carros adotam combustíveis cem por cento sustentáveis, reduzindo a pegada ambiental. As novas unidades de potência passam a ter praticamente metade de sua propulsão vinda de motores elétricos, com recuperação maciça de energia. O clássico DRS dá lugar à aerodinâmica ativa, alternando as asas entre Corner Mode nas curvas e Straight Mode nas retas. Além disso, pilotos ganham recursos como o Overtake Mode para disputas diretas. A história nos mostra que toda grande mudança de regulamento redefine quem constrói o melhor carro e reabre a disputa pelo campeonato.",
    visualEffectType: "mod6_modern_f1_2026",
  },
  {
    id: "m6_c8",
    number: 8,
    title: "O Que a História nos Ensina",
    subtitle: "A próxima volta começa agora: 75 anos de paixão",
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo6/cena08.mp3",
    narrationTranscript:
      "Ao conhecer a trajetória da Fórmula 1, você passa a assistir a cada corrida com outros olhos. Você percebe que o domínio de uma equipe depende de acertar o regulamento da época; que cada piloto lendário superou desafios únicos de seu tempo; que cada dispositivo de segurança no carro tem uma história de aprendizado por trás; e que a busca pela inovação nunca cessa. Agora que você completou a jornada pelos 75 anos da Fórmula 1, é hora de testar seus conhecimentos e fixar o que aprendeu. Faça o nosso quiz de 10 perguntas ou revise os fatos marcantes da linha do tempo. Bem-vindo à história da Fórmula 1. A sua próxima volta começa agora!",
    visualEffectType: "mod6_history_summary",
  },
]

export const MODULE_5_SCENES: ModuleScene[] = [
  {
    id: "m5_c1",
    number: 1,
    title: "Como Nasce uma Ultrapassagem",
    subtitle: "Vácuo, aproximação, frenagem e ponto de tangência",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo5/cena01.mp3",
    narrationTranscript:
      "Bem-vindo ao Módulo 5 do Novatos na F1! Hoje vamos entender uma das partes mais emocionantes de uma corrida: a disputa por posição. Uma ultrapassagem começa muito antes de os carros ficarem lado a lado. O piloto precisa observar a distância, aproveitar oportunidades de velocidade, escolher uma trajetória e calcular a frenagem. Ao mesmo tempo, o adversário tenta defender sua posição. E existe um detalhe fundamental: estar mais rápido não significa ter direito automático de passar por qualquer espaço. A manobra precisa acontecer de maneira controlada e respeitando as regras.",
    visualEffectType: "mod5_overtaking_anatomy",
  },
  {
    id: "m5_c2",
    number: 2,
    title: "O Ataque em 2026",
    subtitle: "Aerodinâmica ativa e Overtake Mode vs antigo DRS",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo5/cena02.mp3",
    narrationTranscript:
      "Agora vem uma mudança importante para quem acompanha a Fórmula 1 em 2026. O antigo DRS, que abria uma parte da asa traseira em determinadas condições, foi substituído por uma nova combinação de recursos. A aerodinâmica ativa permite ajustar os elementos das asas entre modos voltados para curvas e para retas, de acordo com as zonas e condições previstas. Já o Overtake Mode oferece ao piloto uma oportunidade adicional de utilizar energia elétrica para atacar quando os requisitos regulamentares são atendidos. Esses sistemas ajudam a criar oportunidades, mas não garantem uma ultrapassagem.",
    visualEffectType: "mod5_attack_tech_2026",
  },
  {
    id: "m5_c3",
    number: 3,
    title: "Como Defender uma Posição",
    subtitle: "Antecipação, linha defensiva e o que é proibido",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo5/cena03.mp3",
    narrationTranscript:
      "Defender uma posição também é uma arte. O piloto que está à frente precisa escolher sua trajetória e tentar dificultar a vida do adversário, sem transformar a disputa em uma situação perigosa. Uma boa defesa exige antecipação, controle do carro e atenção ao posicionamento do rival. Mas defender não significa ter liberdade para empurrar outro carro para fora da pista ou mudar de direção de maneira perigosa. A análise depende da situação concreta e das regras aplicáveis.",
    visualEffectType: "mod5_defense_limits",
  },
  {
    id: "m5_c4",
    number: 4,
    title: "Roda a Roda: Direito ao Espaço",
    subtitle: "Ataque por dentro vs por fora e diretrizes da FIA",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo5/cena04.mp3",
    narrationTranscript:
      "É aqui que a disputa fica mais delicada. Dois carros podem chegar à mesma curva por trajetórias diferentes e ambos precisam conseguir contornar a curva sem provocar uma colisão. Mas quem está por dentro não ganha automaticamente todos os direitos, assim como quem está por fora não perde automaticamente o direito ao espaço. A FIA publica diretrizes para ajudar os comissários a avaliar as disputas. Elas consideram o posicionamento dos carros, o controle da manobra, a trajetória e a possibilidade de completar a curva dentro dos limites da pista. A decisão final depende das circunstâncias e dos regulamentos aplicáveis.",
    visualEffectType: "mod5_side_by_side_rules",
  },
  {
    id: "m5_c5",
    number: 5,
    title: "Limites de Pista e Reentradas",
    subtitle: "Linhas brancas, zebras e ganho de vantagem",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo5/cena05.mp3",
    narrationTranscript:
      "Uma ultrapassagem pode parecer concluída, mas ainda existe uma pergunta importante: o piloto respeitou os limites da pista? Sair da pista pode trazer uma vantagem, provocar uma perda de posição ou fazer parte de uma situação em que o piloto tentou evitar um contato. Por isso, os comissários precisam analisar o contexto. Também é importante observar como um carro retorna à pista depois de sair dela. O retorno não deve criar perigo ou obrigar outros pilotos a desviar de maneira arriscada.",
    visualEffectType: "mod5_track_limits_runoff",
  },
  {
    id: "m5_c6",
    number: 6,
    title: "Investigações e Penalidades",
    subtitle: "Como a direção de prova e os comissários julgam",
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo5/cena06.mp3",
    narrationTranscript:
      "Quando acontece um incidente, a direção de prova e os comissários podem analisar a situação. Eles consideram as imagens disponíveis, as informações relevantes e os regulamentos aplicáveis. Uma investigação não significa necessariamente que alguém será punido. Às vezes, não há infração; em outras situações, uma penalidade pode ser aplicada. É por isso que vale a pena entender a diferença entre observar uma disputa e julgar oficialmente o que aconteceu.",
    visualEffectType: "mod5_stewards_investigations",
  },
  {
    id: "m5_c7",
    number: 7,
    title: "Desafio da Disputa",
    subtitle: "Analise quatro manobras reais e aplique as regras",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo5/cena07.mp3",
    narrationTranscript:
      "Agora é sua vez! Você vai observar diferentes disputas e tentar entender o que cada piloto está fazendo. Preste atenção na posição dos carros, na trajetória, no momento da frenagem e no espaço disponível. Sua missão não é simplesmente escolher quem deve ganhar. É analisar a situação com cuidado e entender o que as regras e as diretrizes permitem concluir. Vamos para a pista!",
    visualEffectType: "mod5_overtaking_challenges",
  },
  {
    id: "m5_c8",
    number: 8,
    title: "Entenda Antes de Julgar",
    subtitle: "Síntese dos cinco princípios de uma disputa justa",
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo5/cena08.mp3",
    narrationTranscript:
      "Você chegou ao fim da nossa aula sobre ultrapassagens! Agora sabe que atacar exige preparação, que defender exige controle e que uma disputa roda a roda precisa ser entendida com atenção. Também aprendeu que a Fórmula 1 de 2026 possui recursos diferentes do DRS tradicional e que nem toda disputa pode ser julgada apenas por uma imagem isolada. O segredo é observar a posição dos carros, a trajetória, a execução da manobra e as regras aplicáveis. Com prática, você vai começar a entender cada vez melhor o que acontece na pista. Agora, vamos testar seu conhecimento!",
    visualEffectType: "mod5_overtaking_summary",
  },
]

export const MODULE_4_SCENES: ModuleScene[] = [
  {
    id: "m4_c1",
    number: 1,
    title: "A Estratégia Antes da Largada",
    subtitle: "Quem participa das decisões no pit wall",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo4/cena01.mp3",
    narrationTranscript:
      "Bem-vindo de volta ao Novatos na F1! Hoje você vai descobrir algo que nem sempre aparece nas imagens da transmissão: a batalha de estratégia. Uma equipe não precisa apenas construir um carro rápido. Ela precisa decidir como usar os pneus, quando parar, como reagir aos rivais e como adaptar seus planos ao que acontece na pista. O piloto sente o comportamento do carro, o engenheiro de corrida mantém a comunicação e os estrategistas analisam cenários, tempos e oportunidades. E atenção: nem sempre o plano mais rápido no papel é o melhor quando a corrida começa.",
    visualEffectType: "mod4_roles_strategy",
  },
  {
    id: "m4_c2",
    number: 2,
    title: "Pneus: Tempo Ganho e Perdido",
    subtitle: "Aderência, temperatura, degradação e desgaste",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo4/cena02.mp3",
    narrationTranscript:
      "Os pneus são uma das peças mais importantes do quebra-cabeça. Eles são o contato do carro com o asfalto e influenciam diretamente a aderência, a frenagem e a velocidade nas curvas. Em condições de pista seca, você normalmente verá os compostos macio, médio e duro. O macio costuma oferecer mais desempenho em determinadas condições, mas pode perder rendimento mais rapidamente. O duro tende a resistir melhor em algumas situações, embora nem sempre seja o mais rápido. O médio fica entre essas características, mas tudo depende do circuito, da temperatura, do carro e do modo como o piloto utiliza os pneus.",
    visualEffectType: "mod4_tire_choice_sim",
  },
  {
    id: "m4_c3",
    number: 3,
    title: "Pit Stop: A Hora de Parar",
    subtitle: "Janela tática, tempo total perdido e tráfego",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo4/cena03.mp3",
    narrationTranscript:
      "Uma parada nos boxes parece simples: o carro entra, a equipe troca os pneus e ele volta para a pista. Mas a decisão vai muito além do tempo que os mecânicos levam para fazer o serviço. O estrategista precisa considerar o tempo gasto no pit lane, o limite de velocidade, o trânsito na pista, a posição dos rivais, o desgaste dos pneus e o ritmo esperado depois da parada. Um pit stop muito cedo pode obrigar o piloto a administrar os pneus por muito tempo. Uma parada tardia pode custar posições se os rivais aproveitarem a oportunidade.",
    visualEffectType: "mod4_pitstop_timing_calc",
  },
  {
    id: "m4_c4",
    number: 4,
    title: "Safety Car, VSC e Chuva",
    subtitle: "Quando as condições de pista mudam o plano",
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo4/cena04.mp3",
    narrationTranscript:
      "Imagine que sua equipe planejou parar daqui a cinco voltas. De repente, aparece um Safety Car. Os carros reduzem a velocidade e a corrida passa a ser controlada de outra maneira. Uma parada pode ficar mais atraente porque o custo relativo de entrar nos boxes pode mudar. Mas isso não significa que parar seja sempre a decisão certa. A equipe precisa considerar a posição, o estado dos pneus, a estratégia dos rivais e as regras em vigor naquele momento.",
    visualEffectType: "mod4_safety_car_rain",
  },
  {
    id: "m4_c5",
    number: 5,
    title: "Rádio e Telemetria",
    subtitle: "O que os dados e setores revelam aos engenheiros",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo4/cena05.mp3",
    narrationTranscript:
      "Enquanto você acompanha a transmissão, a equipe está analisando muito mais do que a posição do carro. Ela compara os tempos por volta, observa os setores, avalia a diferença para os rivais, acompanha o comportamento dos pneus e escuta o que o piloto relata. Um piloto pode dizer que está perdendo aderência na saída das curvas. Os dados ajudam a equipe a verificar se o ritmo realmente caiu e se o problema parece estar aumentando. Nenhum indicador, sozinho, conta a história inteira.",
    visualEffectType: "mod4_telemetry_radio_data",
  },
  {
    id: "m4_c6",
    number: 6,
    title: "Planos Alternativos e Resposta",
    subtitle: "Como uma equipe reage quando o plano A falha",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo4/cena06.mp3",
    narrationTranscript:
      "Uma estratégia não é uma promessa de que tudo vai acontecer exatamente como planejado. É um plano que precisa ser atualizado. Um rival pode parar antes do esperado, um pneu pode perder rendimento, a chuva pode chegar ou um Safety Car pode mudar as oportunidades. Uma equipe preparada trabalha com alternativas e tenta responder sem perder de vista a posição, o ritmo e as condições do carro.",
    visualEffectType: "mod4_alternate_plans",
  },
  {
    id: "m4_c7",
    number: 7,
    title: "Desafio do Estrategista",
    subtitle: "Sua decisão em tempo real pode mudar a corrida",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo4/cena07.mp3",
    narrationTranscript:
      "Chegou a sua vez. Você está no muro dos boxes e precisa ajudar a equipe a tomar uma decisão. Observe os pneus, a posição, os tempos e o que está acontecendo na pista. Não procure uma resposta mágica: procure a decisão mais coerente com as informações disponíveis. Preparado? Vamos para a corrida!",
    visualEffectType: "mod4_strategist_challenge",
  },
  {
    id: "m4_c8",
    number: 8,
    title: "Pense Como um Estrategista",
    subtitle: "Síntese dos cinco pilares fundamentais da vitória",
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo4/cena08.mp3",
    narrationTranscript:
      "Você chegou ao final da nossa aula sobre estratégia de corrida! Agora sabe que pneus não são apenas pneus, que uma parada envolve muito mais do que a troca em si e que os dados precisam ser interpretados em conjunto. Você também viu como Safety Car, chuva e ritmo dos rivais podem mudar um plano. A estratégia perfeita não existe em todas as situações. O que existe é uma equipe preparada para avaliar informações, entender os riscos e tomar a melhor decisão possível com o que sabe naquele momento. Agora, vamos testar o que você aprendeu!",
    visualEffectType: "mod4_strategic_thinking_summary",
  },
]

export const MODULE_3_SCENES: ModuleScene[] = [
  {
    id: "m3_c1",
    number: 1,
    title: "O Fim de Semana de F1",
    subtitle: "Treinos, classificação e o formato do Grande Prêmio",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo3/cena01.mp3",
    narrationTranscript:
      "Um Grande Prêmio de Fórmula 1 não é apenas a corrida de domingo. É uma jornada que começa na sexta-feira. No formato tradicional, as equipes têm três treinos livres para acertar o carro, uma classificação no sábado para definir o grid e o Grande Prêmio no domingo. Já nos fins de semana com formato Sprint, a intensidade é imediata: temos apenas um treino livre, seguido pela classificação da Sprint, a corrida curta Sprint no sábado, e depois a classificação principal que define as posições da grande largada no domingo.",
    visualEffectType: "mod3_weekend_format",
  },
  {
    id: "m3_c2",
    number: 2,
    title: "Treinos Livres: A Preparação",
    subtitle: "O que os dados e sequências de voltas revelam",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo3/cena02.mp3",
    narrationTranscript:
      "Durante os treinos livres, o cronômetro nem sempre conta a história toda. Fazer a volta mais rápida em um treino não garante a vitória no domingo. As equipes testam diferentes cargas de combustível, avaliam o desgaste dos pneus macios, médios e duros e simulam o ritmo de corrida em sequências de várias voltas. O verdadeiro segredo que os engenheiros procuram não é apenas uma volta rápida isolada, mas a consistência do carro volta após volta.",
    visualEffectType: "mod3_practice_analysis",
  },
  {
    id: "m3_c3",
    number: 3,
    title: "Classificação e Grid de Largada",
    subtitle: "A batalha eliminatória no Q1, Q2 e Q3 pela Pole Position",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo3/cena03.mp3",
    narrationTranscript:
      "No sábado, a pressão atinge o pico com a classificação. No formato tradicional, ela é dividida em três fases eliminatórias: Q1, Q2 e Q3. Os cinco pilotos mais lentos são eliminados a cada rodada. No Q3, os dez pilotos mais rápidos disputam no limite a cobiçada Pole Position, o primeiro lugar do grid de largada. Lembre-se: o menor tempo de volta válido conquista o topo, mas penalidades de motor ou infrações ainda podem alterar a ordem final de largada.",
    visualEffectType: "mod3_qualifying_grid",
  },
  {
    id: "m3_c4",
    number: 4,
    title: "A Largada: Cinco Luzes",
    subtitle: "O procedimento e a tensão antes da primeira curva",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo3/cena04.mp3",
    narrationTranscript:
      "A largada é o momento mais tenso de uma corrida. Os vinte carros se alinham no grid após a volta de apresentação. Acima deles, o pórtico acende uma a uma as cinco luzes vermelhas. Quando todas as cinco luzes finalmente se apagam, a corrida começa! Não existe um cronômetro previsível: o diretor de prova varia o tempo de espera para testar os reflexos e a tração dos pilotos. Uma largada perfeita exige reação instantânea e precisão cirúrgica na primeira curva.",
    visualEffectType: "mod3_start_sequence",
  },
  {
    id: "m3_c5",
    number: 5,
    title: "A Corrida: Torre, GAP e INT",
    subtitle: "Como ler as diferenças de tempo e identificar disputas",
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo3/cena05.mp3",
    narrationTranscript:
      "Durante a corrida, a torre de transmissão na lateral da tela é o seu mapa de bordo. Ali você vê a posição de cada piloto, mas preste atenção em duas siglas fundamentais: GAP e INT. GAP é a distância em segundos até o líder da prova. Já INT é o intervalo em relação ao carro imediatamente à frente. Se o INT estiver caindo abaixo de um segundo, prepare-se: uma tentativa de ultrapassagem com asa móvel aberta está prestes a acontecer.",
    visualEffectType: "mod3_race_tower",
  },
  {
    id: "m3_c6",
    number: 6,
    title: "Pit Stops e Estratégia",
    subtitle: "Undercut, Overcut e a batalha nos boxes",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo3/cena06.mp3",
    narrationTranscript:
      "Nenhum piloto vence sozinho na pista; as corridas são vencidas ou perdidas nos boxes. Um pit stop de Fórmula 1 troca quatro pneus em menos de três segundos. É aqui que entram as grandes jogadas táticas: o Undercut, quando um piloto para antes do adversário para usar pneus novos e tentar passar na saída dos boxes; e o Overcut, quando o piloto fica mais tempo na pista aproveitando ar limpo e ritmo constante. Cada segundo conta.",
    visualEffectType: "mod3_pitstop_strategy",
  },
  {
    id: "m3_c7",
    number: 7,
    title: "Bandeiras e Safety Car",
    subtitle: "Sinalizações, neutralizações e punições dos comissários",
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo3/cena07.mp3",
    narrationTranscript:
      "A direção de prova monitora cada metro de asfalto para garantir a segurança. Bandeira amarela significa perigo no setor e ultrapassagens são proibidas. Bandeira vermelha suspende a corrida imediatamente. Em incidentes maiores, o Safety Car entra na pista para agrupar o pelotão e reduzir o ritmo, enquanto o Virtual Safety Car impõe um limite eletrônico de velocidade sem o carro físico. Os comissários também analisam toques e infrações, aplicando punições de tempo que mudam o resultado.",
    visualEffectType: "mod3_flags_safety_car",
  },
  {
    id: "m3_c8",
    number: 8,
    title: "Bandeirada, Resultado e Pontos",
    subtitle: "Inspeção técnica, pontos e a classificação dos campeonatos",
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo3/cena08.mp3",
    narrationTranscript:
      "A bandeira quadriculada sela a linha de chegada, mas a corrida só termina de verdade após a inspeção técnica e a homologação dos comissários. A posição na pista pode mudar com penalidades pós-prova. Os dez primeiros colocados somam pontos preciosos para o Campeonato Mundial de Pilotos e para o Campeonato de Construtores, que define as premiações e o prestígio das equipes. Agora, quando você acompanhar uma corrida de Fórmula 1, vai conseguir olhar além da velocidade. Vai entender as posições, os intervalos, as estratégias e as decisões que podem mudar tudo até a bandeirada.",
    visualEffectType: "mod3_finish_championship",
  },
]

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

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 3 (10 PERGUNTAS EQUILIBRADAS)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 4 (10 PERGUNTAS DE ESTRATÉGIA)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 5 (10 PERGUNTAS SOBRE ULTRAPASSAGENS)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 6 (10 PERGUNTAS SOBRE A HISTÓRIA DA F1)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 7 (10 PERGUNTAS SOBRE OS BASTIDORES DA EQUIPE)
// ============================================================================
export const MODULE_7_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — Qual é a principal função do engenheiro de corrida?",
    options: [
      { letter: "A", text: "Conduzir o carro durante a corrida." },
      { letter: "B", text: "Atuar como ponto central de comunicação técnica com o piloto e ajudar a analisar o desempenho." },
      { letter: "C", text: "Decidir sozinho todos os regulamentos da categoria." },
      { letter: "D", text: "Trabalhar exclusivamente na publicidade da equipe." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! O engenheiro de corrida conecta as informações do piloto, os dados e as decisões técnicas relevantes.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que é o pit wall?",
    options: [
      { letter: "A", text: "A parede que separa o motor do cockpit." },
      { letter: "B", text: "Uma área junto à pista onde determinados integrantes acompanham a sessão e coordenam decisões." },
      { letter: "C", text: "O nome oficial do volante." },
      { letter: "D", text: "Um tipo de pneu." },
    ],
    correctLetter: "B",
    feedback:
      "Exato! O pit wall é a estação de comando na mureta dos boxes onde os principais líderes e estrategistas monitoram a corrida.",
  },
  {
    id: 3,
    question: "Pergunta 3 — Por que os mecânicos são fundamentais para uma equipe?",
    options: [
      { letter: "A", text: "Porque substituem os pilotos durante a corrida." },
      { letter: "B", text: "Porque decidem todas as penalidades." },
      { letter: "C", text: "Porque preparam, inspecionam, mantêm e reparam os carros, além de executar operações como pit stops." },
      { letter: "D", text: "Porque controlam remotamente o carro na pista." },
    ],
    correctLetter: "C",
    feedback:
      "Perfeito! Os mecânicos preparam, ajustam e garantem a integridade mecânica do carro, além de executar pit stops ultravelozes.",
  },
  {
    id: 4,
    question: "Pergunta 4 — O que é telemetria?",
    options: [
      { letter: "A", text: "Um sistema que permite controlar livremente a direção do carro à distância." },
      { letter: "B", text: "Um método de transmissão e análise de dados técnicos do veículo." },
      { letter: "C", text: "Uma estratégia obrigatória de troca de pneus." },
      { letter: "D", text: "Um tipo de classificação do campeonato." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! A telemetria coleta e transmite em tempo real centenas de parâmetros de sensores do carro para diagnóstico da engenharia.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Por que a equipe analisa os dados junto com o relato do piloto?",
    options: [
      { letter: "A", text: "Porque os dados sempre substituem a percepção do piloto." },
      { letter: "B", text: "Porque o relato do piloto nunca é útil." },
      { letter: "C", text: "Porque as duas fontes de informação podem se complementar para entender o comportamento do carro." },
      { letter: "D", text: "Porque a equipe precisa ignorar as condições da pista." },
    ],
    correctLetter: "C",
    feedback:
      "Exato! A percepção do piloto e os dados dos sensores se complementam para identificar as causas exatas do comportamento do carro.",
  },
  {
    id: 6,
    question: "Pergunta 6 — Qual é uma das responsabilidades de um estrategista?",
    options: [
      { letter: "A", text: "Avaliar cenários de corrida, pneus, tráfego e possíveis paradas." },
      { letter: "B", text: "Definir sozinho todas as regras da FIA." },
      { letter: "C", text: "Fabricar todos os componentes do carro pessoalmente." },
      { letter: "D", text: "Substituir o piloto em todas as decisões de pilotagem." },
    ],
    correctLetter: "A",
    feedback:
      "Correto! O estrategista avalia janelas de pit stop, degradação de compostos, tráfego e probabilidades para maximizar pontos.",
  },
  {
    id: 7,
    question: "Pergunta 7 — Por que companheiros de equipe podem cooperar e competir ao mesmo tempo?",
    options: [
      { letter: "A", text: "Porque nunca disputam posições entre si." },
      { letter: "B", text: "Porque buscam resultados individuais enquanto também contribuem para o campeonato de construtores." },
      { letter: "C", text: "Porque apenas um dos pilotos pode marcar pontos em uma temporada." },
      { letter: "D", text: "Porque todos os regulamentos exigem que um piloto deixe o outro vencer." },
    ],
    correctLetter: "B",
    feedback:
      "Excelente! Ambos competem pelo campeonato individual de pilotos, mas somam forças para o cobiçado Campeonato de Construtores.",
  },
  {
    id: 8,
    question: "Pergunta 8 — O que é o limite de custos da F1?",
    options: [
      { letter: "A", text: "Uma regra que determina quanto cada piloto pode ganhar em pontos." },
      { letter: "B", text: "Um limite que inclui absolutamente todas as despesas sem exceções." },
      { letter: "C", text: "Um conjunto de regras financeiras que limita determinados custos elegíveis das equipes." },
      { letter: "D", text: "Uma regra que obriga todas as equipes a gastar exatamente o mesmo valor." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! O Cost Cap define um limite orçamentário para despesas elegíveis de desenvolvimento, favorecendo o equilíbrio sustentável.",
  },
  {
    id: 9,
    question: "Pergunta 9 — Se um piloto relata perda de aderência, qual é uma abordagem técnica adequada?",
    options: [
      { letter: "A", text: "Ignorar a informação." },
      { letter: "B", text: "Mandar o piloto acelerar sem avaliar o problema." },
      { letter: "C", text: "Analisar o relato, os dados disponíveis e as condições de pista e pneus." },
      { letter: "D", text: "Trocar imediatamente todos os componentes do carro." },
    ],
    correctLetter: "C",
    feedback:
      "Parabéns! Uma equipe de ponta combina a sensação descrita pelo piloto com a telemetria térmica e de pressão dos pneus.",
  },
  {
    id: 10,
    question: "Pergunta 10 — O que determina o sucesso de uma equipe de F1?",
    options: [
      { letter: "A", text: "Apenas o orçamento." },
      { letter: "B", text: "Apenas a habilidade do piloto." },
      { letter: "C", text: "Apenas a velocidade de uma parada nos boxes." },
      { letter: "D", text: "A combinação de engenharia, pilotagem, estratégia, confiabilidade, organização e execução." },
    ],
    correctLetter: "D",
    feedback:
      "Perfeito! Na Fórmula 1, vencer depende de transformar informação, preparação coletiva e decisões integradas em desempenho.",
  },
]

export const MODULE_6_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Questão 1 — Quando começou o Campeonato Mundial de Fórmula 1?",
    options: [
      { letter: "A", text: "1930" },
      { letter: "B", text: "1950" },
      { letter: "C", text: "1960" },
      { letter: "D", text: "1975" },
    ],
    correctLetter: "B",
    feedback:
      "O Campeonato Mundial de Fórmula 1 foi oficialmente inaugurado em 13 de maio de 1950, no circuito de Silverstone, no Grande Prêmio da Grã-Bretanha.",
  },
  {
    id: 2,
    question: "Questão 2 — Quem foi o primeiro campeão mundial de pilotos da Fórmula 1?",
    options: [
      { letter: "A", text: "Juan Manuel Fangio" },
      { letter: "B", text: "Giuseppe Farina" },
      { letter: "C", text: "Jim Clark" },
      { letter: "D", text: "Alberto Ascari" },
    ],
    correctLetter: "B",
    feedback:
      "O piloto italiano Giuseppe Farina venceu a temporada inaugural de 1950 ao volante de uma Alfa Romeo 158, tornando-se o primeiro campeão mundial da história.",
  },
  {
    id: 3,
    question: "Questão 3 — O que significa dizer que a Fórmula 1 segue uma \"fórmula\" de regras?",
    options: [
      { letter: "A", text: "Todos os carros precisam ser idênticos." },
      { letter: "B", text: "Os pilotos devem utilizar o mesmo estilo de pilotagem." },
      { letter: "C", text: "Os carros e as equipes devem respeitar regulamentos técnicos e esportivos." },
      { letter: "D", text: "Todas as corridas precisam acontecer no mesmo circuito." },
    ],
    correctLetter: "C",
    feedback:
      "A palavra 'Fórmula' define o conjunto de regulamentos técnicos e desportivos aos quais todos os carros, motores e competidores devem obedecer estritamente.",
  },
  {
    id: 4,
    question: "Questão 4 — Por que mudanças de regulamento podem alterar a ordem competitiva das equipes?",
    options: [
      { letter: "A", text: "Porque podem favorecer soluções técnicas diferentes." },
      { letter: "B", text: "Porque garantem que a mesma equipe vença todas as corridas." },
      { letter: "C", text: "Porque eliminam a necessidade de estratégia." },
      { letter: "D", text: "Porque tornam os carros exatamente iguais." },
    ],
    correctLetter: "A",
    feedback:
      "Grandes alterações regulamentares zeram conceitos antigos e premiam as escuderias que interpretam e desenvolvem soluções de engenharia mais eficientes sob o novo livro de regras.",
  },
  {
    id: 5,
    question: "Questão 5 — O que tornou as unidades de potência híbridas importantes para a F1 moderna?",
    options: [
      { letter: "A", text: "Elas eliminaram completamente os motores de combustão." },
      { letter: "B", text: "Elas combinaram motor de combustão e sistemas elétricos de energia." },
      { letter: "C", text: "Elas acabaram com a necessidade de combustível." },
      { letter: "D", text: "Elas tornaram a aerodinâmica irrelevante." },
    ],
    correctLetter: "B",
    feedback:
      "Introduzidas em 2014, as unidades híbridas uniram o motor a combustão V6 turbo aos sistemas elétricos de recuperação de energia (MGU-K e MGU-H), elevando a eficiência térmica acima de 50%.",
  },
  {
    id: 6,
    question: "Questão 6 — Como devemos comparar pilotos de épocas diferentes?",
    options: [
      { letter: "A", text: "Considerando somente a velocidade máxima dos carros." },
      { letter: "B", text: "Considerando apenas o número de seguidores." },
      { letter: "C", text: "Ignorando os regulamentos e as condições históricas." },
      { letter: "D", text: "Considerando títulos, adversários, carros, regras e contexto histórico." },
    ],
    correctLetter: "D",
    feedback:
      "Comparações entre gerações distintas exigem respeito ao contexto: as condições de segurança, número de GPs por ano, confiabilidade mecânica e regulamentos eram incomparáveis.",
  },
  {
    id: 7,
    question: "Questão 7 — Qual foi uma das funções do Halo introduzido na F1 em 2018?",
    options: [
      { letter: "A", text: "Aumentar a velocidade nas retas." },
      { letter: "B", text: "Proteger o cockpit contra determinados impactos e objetos." },
      { letter: "C", text: "Substituir os cintos de segurança." },
      { letter: "D", text: "Controlar automaticamente a direção do carro." },
    ],
    correctLetter: "B",
    feedback:
      "O Halo é uma estrutura curva de titânio fixada ao redor do cockpit que suporta até 12 toneladas e foi desenvolvida para proteger a cabeça do piloto contra impactos externos e objetos.",
  },
  {
    id: 8,
    question: "Questão 8 — Quantos campeonatos mundiais de pilotos Ayrton Senna conquistou?",
    options: [
      { letter: "A", text: "Um" },
      { letter: "B", text: "Dois" },
      { letter: "C", text: "Três" },
      { letter: "D", text: "Cinco" },
    ],
    correctLetter: "C",
    feedback:
      "Ayrton Senna conquistou três títulos mundiais de pilotos na Fórmula 1: em 1988, 1990 e 1991, todos pilotando pela equipe McLaren.",
  },
  {
    id: 9,
    question: "Questão 9 — O que é correto afirmar sobre a história da segurança na Fórmula 1?",
    options: [
      { letter: "A", text: "A segurança ficou pronta em uma única temporada." },
      { letter: "B", text: "O Halo eliminou todos os riscos do automobilismo." },
      { letter: "C", text: "A segurança evoluiu por meio de diversas mudanças técnicas, médicas e de procedimentos." },
      { letter: "D", text: "A segurança depende exclusivamente da habilidade do piloto." },
    ],
    correctLetter: "C",
    feedback:
      "A segurança na F1 é fruto de aprendizado acumulado por décadas: células em fibra de carbono, barreiras deformáveis, HANS, Halo e rigorosos protocolos médicos.",
  },
  {
    id: 10,
    question: "Questão 10 — O que caracteriza a nova etapa técnica da F1 em 2026?",
    options: [
      { letter: "A", text: "O retorno integral aos carros de 1950." },
      { letter: "B", text: "A ausência de sistemas elétricos." },
      { letter: "C", text: "A eliminação de todas as regras técnicas." },
      { letter: "D", text: "Uma nova geração de carros, aerodinâmica ativa e unidades de potência com maior participação elétrica." },
    ],
    correctLetter: "D",
    feedback:
      "O regulamento de 2026 combina aerodinâmica ativa móvel (Corner e Straight Mode), combustíveis 100% sustentáveis e divisão praticamente igualitária entre potência térmica e elétrica.",
  },
]

export const MODULE_5_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — O que é o vácuo durante uma disputa?",
    options: [
      { letter: "A", text: "Uma zona do pit lane em que os carros devem parar." },
      { letter: "B", text: "Um efeito em que o carro perseguidor pode aproveitar a redução da resistência do ar causada pelo carro à frente." },
      { letter: "C", text: "Uma penalidade por ultrapassagem." },
      { letter: "D", text: "Uma configuração de pneus." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! O carro da frente desloca o ar, criando uma zona de menor resistência (arrasto) que facilita a aproximação e velocidade final do perseguidor.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que o piloto precisa avaliar antes de tentar ultrapassar?",
    options: [
      { letter: "A", text: "Apenas a posição na classificação." },
      { letter: "B", text: "Apenas a velocidade máxima." },
      { letter: "C", text: "Distância, velocidade relativa, frenagem, trajetória, aderência e espaço disponível." },
      { letter: "D", text: "Somente o número de voltas restantes." },
    ],
    correctLetter: "C",
    feedback:
      "Exatamente! Ultrapassar com sucesso exige calcular a frenagem no limite, prever a reação do rival e garantir que há espaço físico para contornar a curva.",
  },
  {
    id: 3,
    question: "Pergunta 3 — Qual é a diferença entre o DRS tradicional e os recursos de ataque de 2026?",
    options: [
      { letter: "A", text: "O DRS tradicional continua sendo o recurso normal de ultrapassagem em 2026." },
      { letter: "B", text: "Em 2026, a aerodinâmica ativa e o Overtake Mode fazem parte de um sistema diferente do DRS tradicional." },
      { letter: "C", text: "O DRS tradicional controla os pneus." },
      { letter: "D", text: "O Overtake Mode garante que o carro passe pelo adversário." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! Em 2026, a aerodinâmica ativa alterna as asas entre Corner e Straight Mode, enquanto o Overtake Mode gerencia o disparo elétrico da bateria.",
  },
  {
    id: 4,
    question: "Pergunta 4 — O que é o Overtake Mode?",
    options: [
      { letter: "A", text: "Um recurso de utilização de energia que pode ajudar uma tentativa de ultrapassagem, sujeito às condições regulamentares." },
      { letter: "B", text: "Uma bandeira usada para indicar chuva." },
      { letter: "C", text: "Um sistema que troca os pneus automaticamente." },
      { letter: "D", text: "Uma penalidade por defender uma posição." },
    ],
    correctLetter: "A",
    feedback:
      "Isso mesmo! O Overtake Mode oferece potência elétrica extra nas retas para aumentar o poder de aceleração sob critérios do regulamento esportivo.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Um piloto que ataca por dentro de uma curva tem prioridade automática?",
    options: [
      { letter: "A", text: "Sim, em todas as circunstâncias." },
      { letter: "B", text: "Sim, desde que esteja mais rápido." },
      { letter: "C", text: "Não. A situação deve ser avaliada conforme o posicionamento, a execução da manobra e as regras aplicáveis." },
      { letter: "D", text: "Não, porque ultrapassar por dentro é sempre proibido." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! Ter a linha de dentro não dá direito de espalhar e jogar o rival para fora. É preciso manter o controle e contornar a curva nos limites da pista.",
  },
  {
    id: 6,
    question: "Pergunta 6 — O piloto que tenta ultrapassar por fora perde automaticamente o direito ao espaço?",
    options: [
      { letter: "A", text: "Sim, sempre." },
      { letter: "B", text: "Não. A disputa depende das circunstâncias e dos critérios aplicáveis." },
      { letter: "C", text: "Sim, desde que o adversário esteja à frente na reta." },
      { letter: "D", text: "Não, porque o piloto por fora sempre tem prioridade." },
    ],
    correctLetter: "B",
    feedback:
      "Exatamente! Se o piloto por fora estiver emparelhado de forma significativa no apex com o carro sob controle, ele tem direito legítimo ao espaço de corrida.",
  },
  {
    id: 7,
    question: "Pergunta 7 — Qual é o objetivo principal de uma defesa de posição bem executada?",
    options: [
      { letter: "A", text: "Forçar o adversário para fora da pista." },
      { letter: "B", text: "Mudar de direção repetidamente para impedir a ultrapassagem." },
      { letter: "C", text: "Proteger a posição de forma controlada, respeitando as regras e o espaço dos demais carros." },
      { letter: "D", text: "Impedir qualquer tentativa de ultrapassagem, independentemente da situação." },
    ],
    correctLetter: "C",
    feedback:
      "Muito bem! Uma grande defesa posiciona o carro com antecedência na linha interna sem mudanças bruscas de trajetória na frenagem e respeitando os rivais.",
  },
  {
    id: 8,
    question: "Pergunta 8 — Sair dos limites da pista durante uma ultrapassagem significa que haverá sempre a mesma penalidade?",
    options: [
      { letter: "A", text: "Sim, todos os casos recebem exatamente a mesma penalidade." },
      { letter: "B", text: "Não. A situação e as regras aplicáveis precisam ser avaliadas." },
      { letter: "C", text: "Sim, o piloto sempre perde cinco posições." },
      { letter: "D", text: "Não, porque os limites da pista não são relevantes na F1." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! Os comissários avaliam se houve ganho duradouro de vantagem, se o piloto foi forçado ou se devolveu a posição imediatamente.",
  },
  {
    id: 9,
    question: "Pergunta 9 — Uma investigação dos comissários significa que o piloto já foi considerado culpado?",
    options: [
      { letter: "A", text: "Sim, a investigação confirma automaticamente a infração." },
      { letter: "B", text: "Sim, e a penalidade já está definida." },
      { letter: "C", text: "Não. A investigação serve para avaliar as evidências e determinar se houve infração." },
      { letter: "D", text: "Não, porque os comissários não podem analisar imagens." },
    ],
    correctLetter: "C",
    feedback:
      "Isso mesmo! A notificação de investigação indica apenas a abertura do processo para apurar telemetria e imagens; muitas investigações terminam como incidente de corrida.",
  },
  {
    id: 10,
    question: "Pergunta 10 — Qual é a maneira mais adequada de analisar uma disputa roda a roda?",
    options: [
      { letter: "A", text: "Decidir apenas pela posição final dos carros." },
      { letter: "B", text: "Escolher sempre o piloto que estava à frente antes da curva." },
      { letter: "C", text: "Observar posicionamento, trajetória, controle da manobra, limites da pista e regulamentos aplicáveis." },
      { letter: "D", text: "Considerar que o piloto mais rápido tem sempre direito à trajetória inteira." },
    ],
    correctLetter: "C",
    feedback:
      "Parabéns! Analisar como um especialista exige olhar o conjunto: quem estava emparelhado no apex, o controle da direção e o respeito aos limites da pista.",
  },
]

export const MODULE_4_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — Qual é o principal objetivo da estratégia de corrida?",
    options: [
      { letter: "A", text: "Fazer todas as paradas o mais rápido possível, independentemente do cenário." },
      { letter: "B", text: "Tomar decisões para buscar o melhor resultado possível considerando ritmo, pneus, rivais e condições." },
      { letter: "C", text: "Usar sempre o pneu macio." },
      { letter: "D", text: "Evitar qualquer mudança no plano inicial." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! A estratégia busca maximizar o resultado final integrando velocidade, ritmo de prova, degradação dos pneus e resposta aos concorrentes.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que significa degradação dos pneus?",
    options: [
      { letter: "A", text: "A redução do desempenho dos pneus ao longo do uso." },
      { letter: "B", text: "A perda automática de todas as posições." },
      { letter: "C", text: "A redução da velocidade máxima permitida no pit lane." },
      { letter: "D", text: "A troca obrigatória de pneus em toda volta." },
    ],
    correctLetter: "A",
    feedback:
      "Exatamente! Degradação é a queda gradual de aderência e tempo de volta provocada pelo ciclo térmico e atrito da borracha no asfalto.",
  },
  {
    id: 3,
    question: "Pergunta 3 — O que é um undercut?",
    options: [
      { letter: "A", text: "Permanecer na pista até o final sem parar." },
      { letter: "B", text: "Parar depois do rival e tentar ganhar tempo apenas na volta de entrada." },
      { letter: "C", text: "Parar antes do rival para tentar obter vantagem com pneus novos." },
      { letter: "D", text: "Ultrapassar obrigatoriamente outro carro dentro do pit lane." },
    ],
    correctLetter: "C",
    feedback:
      "Perfeito! O undercut antecipa a parada para aproveitar a borracha nova imediata e ganhar a posição quando o concorrente fizer seu pit stop.",
  },
  {
    id: 4,
    question: "Pergunta 4 — O que é um overcut?",
    options: [
      { letter: "A", text: "Uma tentativa de ganhar vantagem permanecendo na pista enquanto o rival para, quando as condições favorecem essa opção." },
      { letter: "B", text: "Uma penalidade por ultrapassagem." },
      { letter: "C", text: "Um tipo de pneu de chuva." },
      { letter: "D", text: "Uma parada feita exclusivamente para trocar o volante." },
    ],
    correctLetter: "A",
    feedback:
      "Isso mesmo! O overcut estende o stint na pista com ar limpo, ritmo forte ou torcendo por um Safety Car favorável.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Por que o tempo de uma parada não é apenas o tempo gasto trocando os pneus?",
    options: [
      { letter: "A", text: "Porque o piloto precisa abandonar a corrida." },
      { letter: "B", text: "Porque o custo também inclui percorrer o pit lane e retornar à pista, além dos efeitos de tráfego e posição." },
      { letter: "C", text: "Porque todas as equipes têm o mesmo tempo de parada total." },
      { letter: "D", text: "Porque o tempo de serviço nunca influencia a corrida." },
    ],
    correctLetter: "B",
    feedback:
      "Exatamente! A perda total inclui o tempo em velocidade limitada (80 km/h) no pit lane, desaceleração na entrada, parada física e reinserção na pista.",
  },
  {
    id: 6,
    question: "Pergunta 6 — O que é o Safety Car?",
    options: [
      { letter: "A", text: "Um modo de aumentar a velocidade dos carros." },
      { letter: "B", text: "Um sistema que permite ultrapassagens livres." },
      { letter: "C", text: "Um procedimento de neutralização da corrida com carro de segurança, segundo as regras aplicáveis." },
      { letter: "D", text: "Um tipo de pneu intermediário." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! O Safety Car entra na pista para neutralizar o perigo, reduzindo e agrupando o pelotão de forma controlada.",
  },
  {
    id: 7,
    question: "Pergunta 7 — Por que uma equipe compara várias voltas em vez de avaliar somente uma?",
    options: [
      { letter: "A", text: "Porque uma única volta sempre é inválida." },
      { letter: "B", text: "Porque várias voltas ajudam a identificar tendências de ritmo e possíveis mudanças no desempenho." },
      { letter: "C", text: "Porque os pneus só funcionam em voltas pares." },
      { letter: "D", text: "Porque o rádio não funciona em uma volta isolada." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! Uma única volta pode sofrer com tráfego ou erros pontuais; uma sequência de voltas expõe a curva real de degradação e consistência.",
  },
  {
    id: 8,
    question: "Pergunta 8 — O que a idade dos pneus permite concluir?",
    options: [
      { letter: "A", text: "Permite saber com certeza o vencedor." },
      { letter: "B", text: "Determina sozinha a hora exata da parada." },
      { letter: "C", text: "É uma informação útil, mas precisa ser interpretada junto com ritmo, condições e outros dados." },
      { letter: "D", text: "Mostra automaticamente a temperatura exata do asfalto." },
    ],
    correctLetter: "C",
    feedback:
      "Exato! Saber quantas voltas o pneu tem é um indicador valioso, mas deve ser cruzado com o feedback do piloto, tempos de setor e telemetria.",
  },
  {
    id: 9,
    question: "Pergunta 9 — A chuva começa a cair durante uma corrida. Qual é a atitude estratégica mais coerente?",
    options: [
      { letter: "A", text: "Manter obrigatoriamente o plano inicial." },
      { letter: "B", text: "Considerar as condições da pista, a aderência, a previsão, os pneus e o momento adequado para agir." },
      { letter: "C", text: "Trocar imediatamente todos os componentes do carro." },
      { letter: "D", text: "Escolher sempre pneus de chuva extrema, independentemente das condições." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! A decisão de mudar para pneus de chuva depende da intensidade da água, do radar meteorológico e do ponto de crossover de aderência.",
  },
  {
    id: 10,
    question: "Pergunta 10 — O que caracteriza uma boa decisão estratégica?",
    options: [
      { letter: "A", text: "Ser sempre a mesma em todas as corridas." },
      { letter: "B", text: "Ignorar os rivais e confiar apenas na posição atual." },
      { letter: "C", text: "Ser tomada com base nas informações disponíveis, considerando vantagens, riscos e possíveis mudanças." },
      { letter: "D", text: "Garantir a vitória antes da largada." },
    ],
    correctLetter: "C",
    feedback:
      "Parabéns! Na Fórmula 1, uma grande estratégia avalia riscos e probabilidades em tempo real, mantendo flexibilidade para reagir a qualquer imprevisto.",
  },
]

export const MODULE_3_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — No formato tradicional de fim de semana de Fórmula 1, quais sessões compõem a programação oficial?",
    options: [
      { letter: "A", text: "Dois treinos livres na sexta e duas corridas completas no domingo." },
      { letter: "B", text: "Três treinos livres (TL1, TL2, TL3), a Classificação no sábado e o Grande Prêmio no domingo." },
      { letter: "C", text: "Apenas uma corrida rápida no sábado e uma corrida de duplas no domingo." },
      { letter: "D", text: "Quatro sessões de classificação com eliminação direta na sexta-feira." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! No formato tradicional, as equipes têm TL1 e TL2 na sexta, TL3 e Classificação no sábado, e a corrida principal no domingo.",
  },
  {
    id: 2,
    question: "Pergunta 2 — Por que a volta mais rápida isolada em um treino livre nem sempre revela quem vencerá a corrida?",
    options: [
      { letter: "A", text: "Porque os tempos de treino livre são multiplicados por um fator aleatório pela FIA." },
      { letter: "B", text: "Porque os carros correm com motores elétricos desligados durante os treinos." },
      { letter: "C", text: "Porque as equipes testam cargas variadas de combustível, pneus diferentes e simulam sequências longas de voltas em ritmo de prova." },
      { letter: "D", text: "Porque é proibido ultrapassar qualquer carro durante os treinos livres." },
    ],
    correctLetter: "C",
    feedback:
      "Exatamente! Uma volta rápida isolada pode ser feita com tanque vazio e pneu macio novo, enquanto a consistência em sequências longas (long runs) revela o real ritmo de corrida.",
  },
  {
    id: 3,
    question: "Pergunta 3 — No formato eliminatório da classificação (Q1, Q2 e Q3), o que é a Pole Position?",
    options: [
      { letter: "A", text: "A posição do piloto que fez mais ultrapassagens no Q1." },
      { letter: "B", text: "O primeiro lugar do grid de largada, conquistado pelo piloto mais rápido do Q3." },
      { letter: "C", text: "A punição aplicada ao piloto mais lento da sessão de sexta-feira." },
      { letter: "D", text: "O posto de largada reservado exclusivamente para o campeão do ano anterior." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! A pole position pertence ao piloto que marca o melhor tempo válido na fase decisiva (Q3), garantindo a primeira vaga na largada.",
  },
  {
    id: 4,
    question: "Pergunta 4 — No procedimento normal de largada de um GP, em qual momento exato os carros podem acelerar para a corrida?",
    options: [
      { letter: "A", text: "Quando a primeira luz vermelha se acende no pórtico." },
      { letter: "B", text: "No exato instante em que todas as cinco luzes vermelhas se apagam." },
      { letter: "C", text: "Quando o Safety Car apaga seus giroflexes nos boxes." },
      { letter: "D", text: "Após soar uma buzina de 10 segundos no pit wall." },
    ],
    correctLetter: "B",
    feedback:
      "Isso mesmo! As 5 luzes vermelhas acendem sequencialmente e, após um intervalo variável e imprevisível, todas se apagam simultaneamente, liberando a largada.",
  },
  {
    id: 5,
    question: "Pergunta 5 — O que representa a torre vertical de posições exibida na tela durante a transmissão de uma corrida?",
    options: [
      { letter: "A", text: "A ordem de chegada do ano anterior e a potência dos motores." },
      { letter: "B", text: "A ordem em pista dos pilotos, suas abreviações, posições e diferenças de tempo atualizadas." },
      { letter: "C", text: "Apenas o número de voltas que cada carro ainda precisa cumprir." },
      { letter: "D", text: "A escala de pontuação dos comissários de prova." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! A torre lateral é o guia principal do espectador, mostrando a posição em tempo real, códigos de 3 letras, equipes e os deltas de tempo.",
  },
  {
    id: 6,
    question: "Pergunta 6 — Na torre de transmissão, qual é a diferença fundamental entre as siglas GAP e INT?",
    options: [
      { letter: "A", text: "GAP indica a diferença para o líder; INT indica o intervalo em relação ao carro imediatamente à frente." },
      { letter: "B", text: "GAP significa velocidade máxima; INT significa quantidade de pit stops realizados." },
      { letter: "C", text: "GAP é a temperatura dos freios; INT é a pressão dos pneus traseiros." },
      { letter: "D", text: "Ambas significam exatamente a mesma coisa sem qualquer distinção." },
    ],
    correctLetter: "A",
    feedback:
      "Exatamente! GAP é a distância em segundos acumulada até o primeiro colocado (líder), enquanto INT (Interval) mede a distância para o carro que está logo na sua frente.",
  },
  {
    id: 7,
    question: "Pergunta 7 — Por que a janela de pit stop e a estratégia de pneus são tão determinantes para o resultado de uma prova?",
    options: [
      { letter: "A", text: "Porque os pilotos ganham pontos extras toda vez que passam pelo pit lane." },
      { letter: "B", text: "Porque pneus novos entregam muito mais aderência e ritmo, permitindo ganhar posições na pista ou nos boxes." },
      { letter: "C", text: "Porque é obrigatório trocar de piloto na metade do Grande Prêmio." },
      { letter: "D", text: "Porque os carros não têm permissão para terminar a corrida com pneus da mesma cor da asa dianteira." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! Um pneu novo gera vantagem imediata de aderência, permitindo voltas muito mais rápidas e possibilitando superar adversários de forma tática.",
  },
  {
    id: 8,
    question: "Pergunta 8 — O que é a manobra estratégica conhecida como 'Undercut'?",
    options: [
      { letter: "A", text: "Parar nos boxes antes do adversário direto para aproveitar pneus novos e ultrapassá-lo quando ele parar." },
      { letter: "B", text: "Ultrapassar um concorrente passando por baixo do assoalho do outro carro." },
      { letter: "C", text: "Ficar na pista até a última volta sem jamais trocar de composto." },
      { letter: "D", text: "Reduzir intencionalmente a velocidade na reta para resfriar os radiadores." },
    ],
    correctLetter: "A",
    feedback:
      "Perfeito! O Undercut consiste em antecipar o pit stop, virar voltas rápidas com borracha nova e assumir a posição quando o rival parar voltas depois.",
  },
  {
    id: 9,
    question: "Pergunta 9 — Qual é a principal diferença operacional entre o Safety Car físico e o Virtual Safety Car (VSC)?",
    options: [
      { letter: "A", text: "O Safety Car físico fecha o pit lane; o VSC obriga todos os pilotos a pararem nos boxes." },
      { letter: "B", text: "O Safety Car físico entra na pista liderando e agrupando o pelotão; o VSC impõe limite eletrônico de velocidade por setores sem carro na pista." },
      { letter: "C", text: "O VSC só é usado em treinos livres; o Safety Car só corre em pistas molhadas." },
      { letter: "D", text: "Não há diferença: ambos utilizam um carro real conduzindo o pelotão." },
    ],
    correctLetter: "B",
    feedback:
      "Exatamente! O Safety Car lidera fisicamente a fila na pista, enquanto o VSC gerencia o ritmo por meio de deltas de tempo nos painéis eletrônicos dos próprios carros.",
  },
  {
    id: 10,
    question: "Pergunta 10 — Por que a posição em que um carro cruza a linha de chegada na bandeirada pode não ser sua posição oficial final?",
    options: [
      { letter: "A", text: "Porque o público vota na internet para decidir o pódio verdadeiro após a prova." },
      { letter: "B", text: "Porque penalidades de tempo aplicadas pelos comissários ou irregularidades técnicas podem alterar a classificação definitiva." },
      { letter: "C", text: "Porque a bandeirada é apenas uma saudação cerimonial sem valor esportivo." },
      { letter: "D", text: "Porque as voltas mais rápidas são sorteadas para definir quem recebe os troféus." },
    ],
    correctLetter: "B",
    feedback:
      "Parabéns! Punições de tempo por incidentes em pista ou desclassificações na pesagem e inspeção técnica pós-corrida podem alterar completamente o resultado oficial.",
  },
]

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
const STORAGE_MOD3_KEY = "f1_novatos_mod3_state_v1"
const STORAGE_MOD4_KEY = "f1_novatos_mod4_state_v1"
const STORAGE_MOD5_KEY = "f1_novatos_mod5_state_v1"
const STORAGE_MOD6_KEY = "f1_novatos_mod6_state_v1"
const STORAGE_MOD7_KEY = "f1_novatos_mod7_state_v1"
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
  const [activeModuleId, setActiveModuleId] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const modParam = urlParams.get("modulo") || urlParams.get("mod")
      if (modParam === "7") return 7
      if (modParam === "6") return 6
      if (modParam === "5") return 5
      if (modParam === "4") return 4
      if (modParam === "3") return 3
      if (modParam === "2") return 2
      const saved = localStorage.getItem(STORAGE_ACTIVE_MODULE_KEY)
      if (saved === "7") return 7
      if (saved === "6") return 6
      if (saved === "5") return 5
      if (saved === "4") return 4
      if (saved === "3") return 3
      if (saved === "2") return 2
    }
    return 1
  })

  const currentScenes = activeModuleId === 1 ? MODULE_1_SCENES : activeModuleId === 2 ? MODULE_2_SCENES : activeModuleId === 3 ? MODULE_3_SCENES : activeModuleId === 4 ? MODULE_4_SCENES : activeModuleId === 5 ? MODULE_5_SCENES : activeModuleId === 6 ? MODULE_6_SCENES : MODULE_7_SCENES
  const currentQuizQuestions = activeModuleId === 1 ? MODULE_1_QUIZ_QUESTIONS : activeModuleId === 2 ? MODULE_2_QUIZ_QUESTIONS : activeModuleId === 3 ? MODULE_3_QUIZ_QUESTIONS : activeModuleId === 4 ? MODULE_4_QUIZ_QUESTIONS : activeModuleId === 5 ? MODULE_5_QUIZ_QUESTIONS : activeModuleId === 6 ? MODULE_6_QUIZ_QUESTIONS : MODULE_7_QUIZ_QUESTIONS
  const currentStorageKey = activeModuleId === 1 ? STORAGE_MOD1_KEY : activeModuleId === 2 ? STORAGE_MOD2_KEY : activeModuleId === 3 ? STORAGE_MOD3_KEY : activeModuleId === 4 ? STORAGE_MOD4_KEY : activeModuleId === 5 ? STORAGE_MOD5_KEY : activeModuleId === 6 ? STORAGE_MOD6_KEY : STORAGE_MOD7_KEY

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

  // Interactive Scene States — Module 3
  const [m3WeekendFormat, setM3WeekendFormat] = useState<"traditional" | "sprint">("traditional")
  const [m3PracticePicked, setM3PracticePicked] = useState<"A" | "B" | null>(null)
  const [m3GridSorted, setM3GridSorted] = useState<boolean>(false)
  const [m3StartStep, setM3StartStep] = useState<number>(0)
  const [m3StartAnswer, setM3StartAnswer] = useState<number | null>(null)
  const [m3TowerSelected, setM3TowerSelected] = useState<"VER" | "NOR" | "LEC" | "HAM">("LEC")
  const [m3StrategyPicked, setM3StrategyPicked] = useState<"undercut" | "overcut" | "traffic">("undercut")
  const [m3IncidentScenario, setM3IncidentScenario] = useState<1 | 2 | 3>(1)

  // Interactive Scene States — Module 4
  const [m4Role, setM4Role] = useState<"pilot" | "engineer" | "strategist" | "pitcrew">("strategist")
  const [m4RoleQuestionAnswer, setM4RoleQuestionAnswer] = useState<string | null>(null)
  const [m4TireScenario, setM4TireScenario] = useState<1 | 2 | 3>(1)
  const [m4PitChoice, setM4PitChoice] = useState<"now" | "stay3" | "wait_info" | null>(null)
  const [m4RainChoice, setM4RainChoice] = useState<"slick" | "inter" | "wait" | null>(null)
  const [m4ShowDataAnalysis, setM4ShowDataAnalysis] = useState<boolean>(false)
  const [m4AlternatePlan, setM4AlternatePlan] = useState<"anticipate" | "stay" | "more_data" | null>(null)
  const [m4ChallengeStep, setM4ChallengeStep] = useState<1 | 2 | 3 | 4>(1)
  const [m4ChallengeP1, setM4ChallengeP1] = useState<"stop" | "stay" | "evaluate" | null>(null)
  const [m4ChallengeP2, setM4ChallengeP2] = useState<"protect" | "attack" | "data" | null>(null)

  // Interactive Scene States — Module 5
  const [m5StraightPoint, setM5StraightPoint] = useState<1 | 2 | 3>(1)
  const [m5AttackCard, setM5AttackCard] = useState<"aero" | "overtake" | "drs">("aero")
  const [m5DefenseScenario, setM5DefenseScenario] = useState<1 | 2 | 3>(1)
  const [m5SideScenario, setM5SideScenario] = useState<"inside" | "outside">("inside")
  const [m5TrackLimitScenario, setM5TrackLimitScenario] = useState<1 | 2 | 3>(1)
  const [m5AnalystAction, setM5AnalystAction] = useState<"investigate" | "monitor" | "incident" | null>(null)
  const [m5ChallengeStep, setM5ChallengeStep] = useState<1 | 2 | 3 | 4>(1)
  const [m5ChallengeAnswers, setM5ChallengeAnswers] = useState<Record<number, string>>({})
  const [m5ShowSummaryReview, setM5ShowSummaryReview] = useState<boolean>(false)

  // Interactive Scene States — Module 6
  const [m6Timeline1950Open, setM6Timeline1950Open] = useState<boolean>(false)
  const [m6ReflectionAnswered, setM6ReflectionAnswered] = useState<boolean>(false)
  const [m6SelectedDecade, setM6SelectedDecade] = useState<"50s" | "60s" | "70s_80s" | "90s_00s" | "10s" | "20s" | "2026">("50s")
  const [m6SelectedDriver, setM6SelectedDriver] = useState<"fangio" | "clark" | "stewart" | "lauda" | "prost" | "senna" | "schumacher" | "hamilton">("senna")
  const [m6SelectedRivalry, setM6SelectedRivalry] = useState<"hunt_lauda" | "senna_prost" | "schumi_rivals" | "hamilton_rivals">("senna_prost")
  const [m6SelectedSafetyPoint, setM6SelectedSafetyPoint] = useState<"capacete" | "monocoque" | "cintos" | "hans" | "halo">("halo")
  const [m6SelectedSennaMilestone, setM6SelectedSennaMilestone] = useState<number>(1)
  const [m6SelectedEraCompare, setM6SelectedEraCompare] = useState<"1950" | "2014" | "2026">("2026")
  const [m6FavoriteEra, setM6FavoriteEra] = useState<string | null>(null)
  const [m6BrazilianDriverDetail, setM6BrazilianDriverDetail] = useState<"fittipaldi" | "piquet" | "barrichello" | "massa" | null>(null)

  // Interactive Scene States — Module 7
  const [m7SelectedRole, setM7SelectedRole] = useState<"tp" | "race_eng" | "perf_eng" | "strategist" | "mechanic" | "aero" | "data">("tp")
  const [m7SelectedRadioSim, setM7SelectedRadioSim] = useState<1 | 2 | 3>(1)
  const [m7SelectedPitWallMetric, setM7SelectedPitWallMetric] = useState<"gap" | "tire" | "traffic" | "weather">("gap")
  const [m7PitStopStep, setM7PitStopStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [m7TelemetryPoint, setM7TelemetryPoint] = useState<1 | 2 | 3>(1)
  const [m7TeammateDecision, setM7TeammateDecision] = useState<"swap" | "free" | "hold" | null>(null)
  const [m7BudgetAero, setM7BudgetAero] = useState<number>(40)
  const [m7BudgetReliability, setM7BudgetReliability] = useState<number>(35)
  const [m7BudgetSimulation, setM7BudgetSimulation] = useState<number>(25)
  const [m7ChallengeStep, setM7ChallengeStep] = useState<1 | 2 | 3>(1)
  const [m7ChallengeAnswers, setM7ChallengeAnswers] = useState<Record<number, string>>({})



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

  // Troca de módulo (Módulo 1 a 7)
  const handleSelectModule = useCallback(
    (modId: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
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
      const targetKey = modId === 1 ? STORAGE_MOD1_KEY : modId === 2 ? STORAGE_MOD2_KEY : modId === 3 ? STORAGE_MOD3_KEY : modId === 4 ? STORAGE_MOD4_KEY : modId === 5 ? STORAGE_MOD5_KEY : modId === 6 ? STORAGE_MOD6_KEY : STORAGE_MOD7_KEY
      const maxLen = modId === 1 ? MODULE_1_SCENES.length : modId === 2 ? MODULE_2_SCENES.length : modId === 3 ? MODULE_3_SCENES.length : modId === 4 ? MODULE_4_SCENES.length : modId === 5 ? MODULE_5_SCENES.length : modId === 6 ? MODULE_6_SCENES.length : MODULE_7_SCENES.length
      const s = loadPersistedState(targetKey)
      setVisitedScenes(s.visitedScenes)
      setSceneIndex(s.lastSceneIndex < maxLen ? s.lastSceneIndex : 0)
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
      setM3WeekendFormat("traditional")
      setM3PracticePicked(null)
      setM3GridSorted(false)
      setM3StartStep(0)
      setM3StartAnswer(null)
      setM3TowerSelected("LEC")
      setM3StrategyPicked("undercut")
      setM3IncidentScenario(1)
      setM4Role("strategist")
      setM4RoleQuestionAnswer(null)
      setM4TireScenario(1)
      setM4PitChoice(null)
      setM4RainChoice(null)
      setM4ShowDataAnalysis(false)
      setM4AlternatePlan(null)
      setM4ChallengeStep(1)
      setM4ChallengeP1(null)
      setM4ChallengeP2(null)
      setM5StraightPoint(1)
      setM5AttackCard("aero")
      setM5DefenseScenario(1)
      setM5SideScenario("inside")
      setM5TrackLimitScenario(1)
      setM5AnalystAction(null)
      setM5ChallengeStep(1)
      setM5ChallengeAnswers({})
      setM5ShowSummaryReview(false)
      setM6Timeline1950Open(false)
      setM6ReflectionAnswered(false)
      setM6BrazilianDriverDetail(null)
      setM7SelectedRadioSim(1)
      setM7TeammateDecision(null)
      setM7ChallengeStep(1)
      setM7ChallengeAnswers({})
      setM7PitStopStep(1)
      setM7TelemetryPoint(1)
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
    // ------------------------------------------------------------------------
    // MÓDULO 4: A MENTE POR TRÁS DA CORRIDA: ESTRATÉGIA, PNEUS E BOXES
    // ------------------------------------------------------------------------
    if (activeModuleId === 4) {
      // CENA 1: A ESTRATÉGIA COMEÇA ANTES DA LARGADA
      if (currentScene.visualEffectType === "mod4_roles_strategy") {
        const roles = [
          { id: "pilot", title: "Piloto", desc: "Sente o comportamento do carro, a aderência na pista e relata o desgaste da borracha curva a curva.", role: "Condução e Feedback" },
          { id: "engineer", title: "Engenheiro de Corrida", desc: "A voz no rádio. Traduz os pedidos do piloto e transmite as ordens técnicas e deltas de tempo.", role: "Comunicação e Operação" },
          { id: "strategist", title: "Estrategistas", desc: "Ficam no muro dos boxes e na fábrica. Simulam cenários matemáticos, paradas e o momento ideal do pit stop.", role: "Decisão e Modelagem" },
          { id: "pitcrew", title: "Equipe dos Boxes", desc: "Mais de 20 mecânicos sincronizados trocam 4 pneus em menos de 2,5 segundos sob pressão extrema.", role: "Execução do Pit Stop" },
        ]

        const currentRole = roles.find((r) => r.id === m4Role) || roles[2]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Quem Faz o Quê?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">PIT WALL</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setM4Role(r.id as any)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-left transition-all cursor-pointer",
                    m4Role === r.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {r.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 mb-2.5 text-xs">
              <span className="font-bold text-cyan-400 block mb-0.5">{currentRole.role}:</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{currentRole.desc}</p>
            </div>

            {/* Pergunta de Fixação */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] font-bold text-amber-300 mb-1.5">
                Quem avalia os cenários de parada e compara diferentes planos de corrida?
              </p>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                {[
                  { id: "pilot", text: "Piloto" },
                  { id: "strategist", text: "Estrategistas" },
                  { id: "pitcrew", text: "Equipe dos Boxes" },
                  { id: "engineer", text: "Engenheiro" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setM4RoleQuestionAnswer(opt.id)}
                    className={cn(
                      "py-1 px-1.5 rounded text-[10px] font-mono transition-all cursor-pointer text-center",
                      m4RoleQuestionAnswer === opt.id
                        ? opt.id === "strategist"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-red-900/80 text-white"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {m4RoleQuestionAnswer && (
                <div className="text-[10px] text-zinc-300 bg-white/5 p-1.5 rounded border border-white/10 leading-tight">
                  {m4RoleQuestionAnswer === "strategist"
                    ? "Correto! Os estrategistas comparam modelos de ritmo, tráfego e degrau de pneus para definir o plano ideal."
                    : "Quase lá. O piloto e o engenheiro fornecem dados em tempo real, mas a modelagem dos planos cabe aos estrategistas."}
                </div>
              )}
            </div>
          </div>
        )
      }

      // CENA 2: PNEUS: TEMPO GANHO E PERDIDO
      if (currentScene.visualEffectType === "mod4_tire_choice_sim") {
        const scenarios = [
          {
            id: 1 as const,
            title: "1. Poucas Voltas Restantes (Buscar Desempenho)",
            recom: "Macio (Soft)",
            logic: "Máxima aderência imediata para atacar nas voltas finais.",
            advantage: "Ganha até 1 segundo por volta em relação a pneus velhos.",
            risk: "Superaquecimento rápido se pressionar demais em ar turbulento.",
            extra: "Estrategista verifica se haverá voltas suficientes para ultrapassar antes de degradar.",
            bars: { grip: 95, deg: 85, life: 30 },
          },
          {
            id: 2 as const,
            title: "2. Longo Trecho pela Frente (Foco em Durabilidade)",
            recom: "Duro (Hard)",
            logic: "Construção de borracha rígida para resistir a mais de 35 voltas.",
            advantage: "Ritmo constante com degradação muito baixa.",
            risk: "Demora mais voltas para atingir a temperatura ideal de funcionamento.",
            extra: "Estrategista monitora se o asfalto está quente o bastante para dar aderência ao composto duro.",
            bars: { grip: 70, deg: 30, life: 95 },
          },
          {
            id: 3 as const,
            title: "3. Pista com Chuva e Baixa Aderência",
            recom: "Intermediário / Chuva Extrema",
            logic: "Compostos com sulcos para evacuar água e evitar aquaplanagem.",
            advantage: "Permite tracionar e frear em segurança no asfalto molhado.",
            risk: "Se a pista secar rápido, o pneu superaquece e se desfaz em poucas voltas.",
            extra: "Estrategista vigia o radar meteorológico para antecipar o crossover.",
            bars: { grip: 60, deg: 50, life: 60 },
          },
        ]

        const scn = scenarios.find((s) => s.id === m4TireScenario) || scenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Qual Pneu Escolher?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">COMPOSTOS</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM4TireScenario(s.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m4TireScenario === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Barras Didáticas Qualitativas */}
            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 mb-2 space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Aderência Inicial:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scn.bars.grip}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sensibilidade ao Desgaste:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${scn.bars.deg}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Durabilidade em Voltas:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${scn.bars.life}%` }} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1 bg-white/5 p-2 rounded-lg border border-white/10 leading-snug">
              <span className="font-bold text-amber-300 block">Composto Recomendado: {scn.recom}</span>
              <p><strong className="text-emerald-400">Vantagem:</strong> {scn.advantage}</p>
              <p><strong className="text-rose-400">Risco:</strong> {scn.risk}</p>
            </div>
          </div>
        )
      }

      // CENA 3: PIT STOP: QUANDO É A HORA DE PARAR?
      if (currentScene.visualEffectType === "mod4_pitstop_timing_calc") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">PIT STOP</span>
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-xs text-zinc-200 mb-2.5 space-y-0.5 font-mono">
              <div className="flex justify-between"><span>Posição Atual:</span><strong className="text-white">P4</strong></div>
              <div className="flex justify-between"><span>Rival à Frente:</span><strong className="text-amber-400">P3 (+1.4s)</strong></div>
              <div className="flex justify-between"><span>Voltas Restantes:</span><strong className="text-white">20 voltas</strong></div>
              <div className="flex justify-between"><span>Perda Total no Pit:</span><strong className="text-rose-400">~22.0 segundos</strong></div>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              Seus pneus perdem ritmo e o rival não parou. Qual decisão tomar?
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM4PitChoice("now")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "now" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Parar Agora (Undercut)
              </button>
              <button
                type="button"
                onClick={() => setM4PitChoice("stay3")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "stay3" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Ficar +3 Voltas
              </button>
              <button
                type="button"
                onClick={() => setM4PitChoice("wait_info")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "wait_info" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Aguardar Dados
              </button>
            </div>

            {m4PitChoice && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug mb-2">
                {m4PitChoice === "now" && (
                  <>
                    <span className="font-bold text-emerald-400 block mb-0.5">Tentativa de Undercut:</span>
                    Você coloca pneus novos e vira 1,5s mais rápido. Se sair livre de tráfego, assume o P3 quando o rival parar!
                  </>
                )}
                {m4PitChoice === "stay3" && (
                  <>
                    <span className="font-bold text-amber-400 block mb-0.5">Aposta no Overcut:</span>
                    Seus pneus continuam degradando, mas você torce por um Safety Car oportuno para economizar 10s no pit stop.
                  </>
                )}
                {m4PitChoice === "wait_info" && (
                  <>
                    <span className="font-bold text-cyan-400 block mb-0.5">Cautela Tática:</span>
                    A equipe monitora se outros carros que já pararam pegaram tráfego no pelotão intermediário antes de decidir.
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setM4PitChoice(null)}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer block text-center w-full"
            >
              Reiniciar Cenário
            </button>
          </div>
        )
      }

      // CENA 4: SAFETY CAR, VSC E BANDEIRAS
      if (currentScene.visualEffectType === "mod4_safety_car_rain") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Imprevisto na Pista</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-black">A CHUVA CHEGOU!</span>
            </div>

            {/* Linha do Tempo Didática */}
            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-300 text-center uppercase tracking-wide mb-2.5">
              Plano Inicial ➔ Chuva na Curva 4 ➔ Nova Avaliação ➔ Decisão
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 leading-snug">
              Pingos de chuva no setor 2, mas a reta ainda está seca. Alguns rivais continuam de slick. O que fazer?
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM4RainChoice("slick")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "slick" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Manter Slick
              </button>
              <button
                type="button"
                onClick={() => setM4RainChoice("inter")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "inter" ? "bg-emerald-600 text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Colocar Inter
              </button>
              <button
                type="button"
                onClick={() => setM4RainChoice("wait")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "wait" ? "bg-amber-600 text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Aguardar Radar
              </button>
            </div>

            {m4RainChoice && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug">
                {m4RainChoice === "slick" && (
                  <p>Vantagem se a chuva parar rápido; mas alto risco de rodar se o asfalto encharcar.</p>
                )}
                {m4RainChoice === "inter" && (
                  <p>Segurança total na chuva; mas se o sol abrir, os intermediários superaquecem e derretem em 3 voltas.</p>
                )}
                {m4RainChoice === "wait" && (
                  <p>A equipe consulta a telemetria do radar de tempestade para não parar uma volta antes da hora.</p>
                )}
              </div>
            )}
          </div>
        )
      }

      // CENA 5: RÁDIO, TELEMETRIA E O QUE OS DADOS REVELAM
      if (currentScene.visualEffectType === "mod4_telemetry_radio_data") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Exemplo Ilustrativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">TELEMETRIA</span>
            </div>

            <table className="w-full text-[11px] font-mono mb-2.5">
              <thead>
                <tr className="border-b border-white/15 text-zinc-400 text-[10px]">
                  <th className="text-left pb-1">Indicador</th>
                  <th className="text-right pb-1 text-white">Piloto A</th>
                  <th className="text-right pb-1 text-cyan-300">Piloto B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                <tr><td className="py-1">Volta anterior</td><td className="text-right">1:32.400</td><td className="text-right">1:32.700</td></tr>
                <tr><td className="py-1">Volta atual</td><td className="text-right text-rose-400">1:33.100</td><td className="text-right text-emerald-400">1:32.800</td></tr>
                <tr><td className="py-1">Idade pneus</td><td className="text-right">18 voltas</td><td className="text-right">8 voltas</td></tr>
                <tr><td className="py-1">Posição</td><td className="text-right font-black">P4</td><td className="text-right font-black">P5</td></tr>
              </tbody>
            </table>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              O que você conclui com esses dados?
            </p>

            <button
              type="button"
              onClick={() => setM4ShowDataAnalysis(!m4ShowDataAnalysis)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center mb-2"
            >
              {m4ShowDataAnalysis ? "Ocultar Análise" : "Mostrar Análise dos Estrategistas"}
            </button>

            {m4ShowDataAnalysis && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 space-y-1 leading-snug">
                <p>• <strong>Piloto A perdeu 0,700s</strong> na volta atual, indicando provável queda no rendimento dos pneus de 18 voltas.</p>
                <p>• <strong>Piloto B foi 0,300s mais rápido</strong> (1:32.800 vs 1:33.100) na volta atual, diminuindo a distância.</p>
                <p className="text-amber-300 font-bold">• Mas atenção: uma única volta não prova tudo! É preciso avaliar mais setores para confirmar a tendência.</p>
              </div>
            )}
          </div>
        )
      }

      // CENA 6: COMUNICAÇÃO, ERROS E PLANOS ALTERNATIVOS
      if (currentScene.visualEffectType === "mod4_alternate_plans") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Plano A ou Plano B?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">CONTINGÊNCIA</span>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2.5 leading-snug">
              Seu plano era parar na volta 30. Mas seu rival direto parou na volta 25 e está voando baixo com pneus novos.
            </p>

            <div className="space-y-1 mb-2.5">
              {[
                { id: "anticipate", title: "1. Antecipar a Parada Agora", desc: "Limita o dano do undercut do rival chamando o piloto imediatamente." },
                { id: "stay", title: "2. Ficar na Pista e Acelerar", desc: "Tenta acumular ar limpo e parar no fim da prova com pneus bem mais novos." },
                { id: "more_data", title: "3. Pedir Mais Dados de Rádio", desc: "Checa se o rival pegou tráfego antes de queimar o plano A." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM4AlternatePlan(opt.id as any)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m4AlternatePlan === opt.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span className="block font-black">{opt.title}</span>
                  <span className="block text-[9px] font-normal text-zinc-300">{opt.desc}</span>
                </button>
              ))}
            </div>

            {m4AlternatePlan && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug mb-1">
                <span className="font-bold text-amber-300 block mb-0.5">Avaliação da Escolha:</span>
                Toda decisão envolve risco. Antecipar reduz a perda direta, mas encurta a vida dos pneus no último trecho. Ficar na pista exige ar livre absoluto.
              </div>
            )}
          </div>
        )
      }

      // CENA 7: DESAFIO DO ESTRATEGISTA: SUA DECISÃO PODE MUDAR A CORRIDA
      if (currentScene.visualEffectType === "mod4_strategist_challenge") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Desafio Interativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">
                ETAPA {m4ChallengeStep} DE 4
              </span>
            </div>

            {/* ETAPA 1: ESCOLHA INICIAL */}
            {m4ChallengeStep === 1 && (
              <div className="space-y-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] font-mono">
                  <div>• 10 voltas restantes | Seu piloto em P3</div>
                  <div>• Rival em P4 a 2,4s acabou de colocar pneus novos</div>
                  <div>• Seu piloto está com Médios de 15 voltas perdendo ritmo</div>
                </div>

                <p className="text-[11px] text-white font-bold">Qual deve ser a prioridade da equipe?</p>

                <div className="space-y-1">
                  {[
                    { id: "stop", label: "Parar imediatamente para defender" },
                    { id: "stay", label: "Permanecer na pista e administrar o ritmo" },
                    { id: "evaluate", label: "Avaliar o ritmo do rival antes de confirmar" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setM4ChallengeP1(opt.id as any)}
                      className={cn(
                        "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                        m4ChallengeP1 === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {m4ChallengeP1 && (
                  <button
                    type="button"
                    onClick={() => setM4ChallengeStep(2)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Confirmar e Ver Próxima Volta ➔
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 2: NOVO ACONTECIMENTO */}
            {m4ChallengeStep === 2 && (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold block text-amber-300 mb-0.5">⚠️ Volta 50/57: O Rival Atacou!</span>
                  O rival fez a volta mais rápida da prova e a diferença caiu de 2,4s para 1,1s! Seus pneus traseiros começam a deslizar na curva 9.
                </div>

                <p className="text-[11px] text-white font-bold">A situação mudou. Como você reage?</p>

                <button
                  type="button"
                  onClick={() => setM4ChallengeStep(3)}
                  className="w-full py-1.5 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Tomar Decisão Final de Corrida ➔
                </button>
              </div>
            )}

            {/* ETAPA 3: DECISÃO FINAL */}
            {m4ChallengeStep === 3 && (
              <div className="space-y-2">
                <p className="text-[11px] text-white font-bold">Escolha sua ação com a justificativa:</p>

                <div className="space-y-1">
                  {[
                    { id: "protect", label: "“Quero proteger a posição na pista até o final.”" },
                    { id: "attack", label: "“Quero buscar uma oportunidade de parada estratégica.”" },
                    { id: "data", label: "“Preciso de mais dados de rádio antes de arriscar.”" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setM4ChallengeP2(opt.id as any)}
                      className={cn(
                        "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                        m4ChallengeP2 === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {m4ChallengeP2 && (
                  <button
                    type="button"
                    onClick={() => setM4ChallengeStep(4)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Gerar Relatório de Estratégia 📊
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 4: RELATÓRIO DO ESTRATEGISTA */}
            {m4ChallengeStep === 4 && (
              <div className="space-y-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[10px] space-y-1 leading-snug">
                  <div className="font-black text-cyan-300 uppercase">Relatório de Decisão do Estrategista</div>
                  <div>• <strong>Ação:</strong> {m4ChallengeP2 === "protect" ? "Defesa de Posição na Pista" : m4ChallengeP2 === "attack" ? "Parada Agressiva de Pneus Novos" : "Gestão Baseada em Dados"}</div>
                  <div>• <strong>Vantagem:</strong> Evita a perda garantida de 22s no pit lane mantendo o carro na frente na pista.</div>
                  <div>• <strong>Risco:</strong> Vulnerabilidade contra o DRS do adversário na volta final.</div>
                  <div>• <strong>Lição:</strong> Não existe resposta mágica; toda decisão em F1 gerencia probabilidades e riscos.</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setM4ChallengeStep(1)
                    setM4ChallengeP1(null)
                    setM4ChallengeP2(null)
      setM5StraightPoint(1)
      setM5AttackCard("aero")
      setM5DefenseScenario(1)
      setM5SideScenario("inside")
      setM5TrackLimitScenario(1)
      setM5AnalystAction(null)
      setM5ChallengeStep(1)
      setM5ChallengeAnswers({})
      setM5ShowSummaryReview(false)
      setM6Timeline1950Open(false)
      setM6ReflectionAnswered(false)
      setM6BrazilianDriverDetail(null)
      setM7SelectedRadioSim(1)
      setM7TeammateDecision(null)
      setM7ChallengeStep(1)
      setM7ChallengeAnswers({})
      setM7PitStopStep(1)
      setM7TelemetryPoint(1)
                  }}
                  className="w-full py-1 text-[10px] text-zinc-400 hover:text-white underline cursor-pointer text-center block"
                >
                  Recomeçar Desafio
                </button>
              </div>
            )}
          </div>
        )
      }

      // CENA 8: RESUMO: PENSE COMO UM ESTRATEGISTA
      if (currentScene.visualEffectType === "mod4_strategic_thinking_summary") {
        const pillars = [
          "1. A estratégia é uma decisão coletiva de equipe.",
          "2. Pneus influenciam ritmo, aderência e durabilidade.",
          "3. Pit stops envolvem custo total, tráfego e posição.",
          "4. Dados e rádio ajudam a interpretar tendências.",
          "5. Um bom plano precisa se adaptar aos imprevistos.",
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Cinco Pilares Fundamentais</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">SÍNTESE</span>
            </div>

            <div className="space-y-1.5 mb-3">
              {pillars.map((p, idx) => (
                <div key={idx} className="bg-white/5 py-1 px-2 rounded border border-white/10 text-[10px] text-zinc-200">
                  {p}
                </div>
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
              Fazer o Quiz Final (10 Perguntas)
            </button>
          </div>
        )
      }
    }
    // ------------------------------------------------------------------------
    // MÓDULO 5: A ARTE DE ULTRAPASSAR: ATAQUE, DEFESA E REGRAS
    // ------------------------------------------------------------------------
    if (activeModuleId === 5) {
      // CENA 1: COMO NASCE UMA ULTRAPASSAGEM
      if (currentScene.visualEffectType === "mod5_overtaking_anatomy") {
        const straightPhases = [
          {
            id: 1 as const,
            title: "1. Início da Reta (Vácuo)",
            desc: "O perseguidor entra no fluxo de ar de baixa resistência do líder (vácuo/slipstream), ganhando velocidade para emparelhar.",
          },
          {
            id: 2 as const,
            title: "2. Aproximação da Frenagem",
            desc: "O atacante escolhe a linha interna ou externa e define a referência visual exata para aplicar mais de 100 kg no freio.",
          },
          {
            id: 3 as const,
            title: "3. Entrada e Apex da Curva",
            desc: "Controla o carro em desaceleração profunda para buscar a tangência interna sem travar rodas ou empurrar o adversário.",
          },
        ]

        const currentPhase = straightPhases.find((p) => p.id === m5StraightPoint) || straightPhases[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Anatomia da Manobra</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">ULTRAPASSAGEM</span>
            </div>

            {/* Linha Visual das Fases */}
            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-300 text-center uppercase tracking-wide mb-2.5">
              Preparação ➔ Aproximação ➔ Ataque ➔ Frenagem ➔ Saída
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              Selecione o ponto da manobra para entender o que o piloto faz:
            </p>

            <div className="space-y-1 mb-2.5">
              {straightPhases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setM5StraightPoint(p.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5StraightPoint === p.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug">
              <span className="font-bold text-amber-300 block mb-0.5">{currentPhase.title}:</span>
              {currentPhase.desc}
            </div>
          </div>
        )
      }

      // CENA 2: O ATAQUE EM 2026: AERODINÂMICA ATIVA E OVERTAKE MODE
      if (currentScene.visualEffectType === "mod5_attack_tech_2026") {
        const cards = [
          {
            id: "aero" as const,
            title: "Aerodinâmica Ativa (2026)",
            role: "Corner Mode vs Straight Mode",
            desc: "As asas dianteira e traseira ajustam seus ângulos: máxima sustentação nas curvas (Corner Mode) e baixíssimo arrasto nas retas autorizadas (Straight Mode).",
          },
          {
            id: "overtake" as const,
            title: "Overtake Mode (2026)",
            role: "Potência Elétrica Extra",
            desc: "Disparo adicional de energia da bateria disponível sob requisitos regulamentares para auxiliar na aceleração durante a manobra.",
          },
          {
            id: "drs" as const,
            title: "DRS Tradicional (Histórico 2011–2025)",
            role: "Contexto de Transmissões Antigas",
            desc: "Abria fisicamente um flap da asa traseira a menos de 1 segundo do líder. Não é o sistema padrão de 2026, servindo como referência histórica.",
          },
        ]

        const currentC = cards.find((c) => c.id === m5AttackCard) || cards[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Recursos Técnicos de 2026</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">AERO & ENERGIA</span>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setM5AttackCard(c.id)}
                  className={cn(
                    "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                    m5AttackCard === c.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                  )}
                >
                  {c.id === "aero" ? "Aero Ativa" : c.id === "overtake" ? "Overtake" : "Antigo DRS"}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs text-zinc-200 space-y-1 leading-snug">
              <span className="font-bold text-amber-300 block">{currentC.title}</span>
              <span className="text-[10px] font-mono text-cyan-300 block mb-1">Função: {currentC.role}</span>
              <p className="text-[11px] text-zinc-300">{currentC.desc}</p>
            </div>

            <div className="mt-2 text-[10px] text-zinc-400 text-center font-mono">
              Overtake Mode cria oportunidade, mas a ultrapassagem exige perícia na freada.
            </div>
          </div>
        )
      }

      // CENA 3: COMO DEFENDER UMA POSIÇÃO
      if (currentScene.visualEffectType === "mod5_defense_limits") {
        const defenseScenarios = [
          {
            id: 1 as const,
            title: "1. Defesa Firme e Limpa",
            badge: "PERMITIDO",
            color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
            desc: "O piloto se posiciona previamente na linha interna com clareza antes do ponto de frenagem, forçando o rival a contornar por fora.",
          },
          {
            id: 2 as const,
            title: "2. Mudança Perigosa na Freada",
            badge: "PROIBIDO (Moving Under Braking)",
            color: "text-rose-400 border-rose-500/40 bg-rose-950/40",
            desc: "Mudar de direção já em processo de frenagem desestabiliza o adversário a mais de 300 km/h e causa colisões graves.",
          },
          {
            id: 3 as const,
            title: "3. Espalhar Sem Deixar Espaço",
            badge: "SOB INVESTIGAÇÃO",
            color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
            desc: "Se o adversário já estiver emparelhado lado a lado, empurrá-lo para fora da zebra além dos limites da pista pode gerar penalidade.",
          },
        ]

        const currentDef = defenseScenarios.find((d) => d.id === m5DefenseScenario) || defenseScenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Defesa Inteligente ou Arriscada?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">DEFESA</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {defenseScenarios.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setM5DefenseScenario(d.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5DefenseScenario === d.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {d.title}
                </button>
              ))}
            </div>

            <div className={cn("p-2 rounded-lg border text-xs leading-snug", currentDef.color)}>
              <span className="font-mono font-black block text-[10px] uppercase mb-0.5">{currentDef.badge}</span>
              <p className="text-[11px] text-zinc-200">{currentDef.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 4: RODA A RODA: QUEM TEM DIREITO AO ESPAÇO?
      if (currentScene.visualEffectType === "mod5_side_by_side_rules") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Diretrizes da FIA</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">RODA A RODA</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => setM5SideScenario("inside")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m5SideScenario === "inside" ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Ataque por Dentro
              </button>
              <button
                type="button"
                onClick={() => setM5SideScenario("outside")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m5SideScenario === "outside" ? "bg-cyan-600 text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Ataque por Fora
              </button>
            </div>

            {/* Painel Informativo: O que os comissários observam? */}
            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[10px] space-y-1 mb-2 leading-snug">
              <div className="font-bold text-amber-300 uppercase">O que os comissários observam no Apex?</div>
              <div>• <strong>Posicionamento relativo:</strong> eixo dianteiro alinhado com o retrovisor/eixo do rival.</div>
              <div>• <strong>Controle do carro:</strong> capacidade real de fazer a curva sem travar rodas.</div>
              <div>• <strong>Limites de pista:</strong> manter pelo menos uma roda dentro da linha branca.</div>
            </div>

            <div className="text-[11px] text-zinc-300 bg-white/5 p-2 rounded-lg border border-white/10 leading-snug">
              {m5SideScenario === "inside" ? (
                <>
                  <strong className="text-white block mb-0.5">Por Dentro:</strong>
                  Estar por dentro não dá direito de espalhar na saída e empurrar o rival para fora. É preciso deixar espaço de corrida.
                </>
              ) : (
                <>
                  <strong className="text-cyan-300 block mb-0.5">Por Fora:</strong>
                  Se o atacante estiver emparelhado no apex sob controle, ele não perde o direito ao espaço e não pode ser empurrado para a grama.
                </>
              )}
            </div>
          </div>
        )
      }

      // CENA 5: LIMITES DE PISTA, REJUNTES E REENTRADAS
      if (currentScene.visualEffectType === "mod5_track_limits_runoff") {
        const scenarios = [
          {
            id: 1 as const,
            title: "1. Manobra Dentro das Linhas",
            status: "VÁLIDA 🟢",
            desc: "Pelo menos parte de uma das quatro rodas permaneceu sobre a linha branca ou zebra em toda a curva.",
          },
          {
            id: 2 as const,
            title: "2. Ultrapassou Fora da Pista",
            status: "VANTAGEM INDEVIDA 🔴",
            desc: "Completou a manobra com as 4 rodas além da linha branca. Deve devolver a posição imediatamente ou sofrerá punição de tempo.",
          },
          {
            id: 3 as const,
            title: "3. Saiu para Evitar Colisão",
            status: "ANALISADO PELOS COMISSÁRIOS 🟡",
            desc: "Espalhou para a área de escape para não bater no rival que perdeu o ponto de frenagem e reentrou em segurança sem acelerar no tráfego.",
          },
        ]

        const scn = scenarios.find((s) => s.id === m5TrackLimitScenario) || scenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">A Ultrapassagem Valeu?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">LIMITES</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM5TrackLimitScenario(s.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5TrackLimitScenario === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-xs text-zinc-200">
              <span className="font-mono font-bold text-amber-300 block text-[10px] mb-0.5">{scn.status}</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{scn.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 6: INVESTIGAÇÕES, BANDEIRAS E PENALIDADES
      if (currentScene.visualEffectType === "mod5_stewards_investigations") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Comissários da FIA</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-black">INVESTIGAÇÃO</span>
            </div>

            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-200 mb-2 leading-snug">
              <strong>Incidente Curva 1:</strong> Toque de rodas na entrada do apex. Ambos os carros continuam na prova sem danos estruturais.
            </div>

            <p className="text-[11px] text-white font-bold mb-2">Você é o analista da corrida. Qual a ação mais coerente?</p>

            <div className="space-y-1 mb-2.5">
              {[
                { id: "investigate", label: "Abrir Investigação Formal dos Comissários" },
                { id: "monitor", label: "Continuar Acompanhando Sem Concluir Prematuramente" },
                { id: "incident", label: "Encerrar Imediatamente Sem Penalidade" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM5AnalystAction(opt.id as any)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                    m5AnalystAction === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {m5AnalystAction && (
              <div className="text-[10px] text-zinc-300 bg-white/5 p-2 rounded border border-white/10 leading-tight">
                {m5AnalystAction === "monitor" || m5AnalystAction === "investigate"
                  ? "Excelente! Um incidente nunca deve ser julgado por apenas um ângulo de câmera. Os comissários cruzam telemetria de freio, esterço e onboard antes de decidir."
                  : "Cuidado: Decidir sem avaliar telemetria ou se um piloto freou tarde demais é precipitado. É essencial analisar todos os ângulos."}
              </div>
            )}
          </div>
        )
      }

      // CENA 7: DESAFIO INTERATIVO: VOCÊ DECIDE A DISPUTA
      if (currentScene.visualEffectType === "mod5_overtaking_challenges") {
        const challenges = [
          {
            step: 1 as const,
            title: "Desafio 1 — Ataque na Reta",
            question: "Dois carros se aproximam da curva a 320 km/h. O que o piloto deve avaliar antes da manobra?",
            options: [
              { id: "correct", text: "Distância, velocidade relativa, frenagem, trajetória e espaço disponível.", correct: true },
              { id: "tires", text: "Apenas a cor dos pneus.", correct: false },
              { id: "pos", text: "Apenas a posição atual na classificação.", correct: false },
            ],
            fb: "Correto! A velocidade relativa e o posicionamento são fundamentais, mas a frenagem e o espaço disponível decidem o sucesso da manobra.",
          },
          {
            step: 2 as const,
            title: "Desafio 2 — Disputa por Dentro",
            question: "É possível afirmar automaticamente que o piloto por dentro sempre tem prioridade absoluta?",
            options: [
              { id: "yes", text: "Sim, quem está por dentro nunca precisa dar espaço.", correct: false },
              { id: "correct", text: "Não. É necessário analisar posicionamento, controle, trajetória e limites de pista.", correct: true },
              { id: "speed", text: "Sim, desde que esteja mais rápido.", correct: false },
            ],
            fb: "Exato! Ter a linha interna não dá passe livre para empurrar o concorrente para a brita. Ambos precisam de espaço de corrida.",
          },
          {
            step: 3 as const,
            title: "Desafio 3 — Disputa por Fora",
            question: "O piloto que tenta ultrapassar por fora perde automaticamente o direito ao espaço?",
            options: [
              { id: "yes", text: "Sim, quem está por fora assume todo o risco.", correct: false },
              { id: "correct", text: "Não. Se estiver emparelhado no apex com o carro sob controle, tem direito legítimo ao espaço.", correct: true },
              { id: "never", text: "Sim, porque ultrapassar por fora é proibido pela FIA.", correct: false },
            ],
            fb: "Perfeito! As diretrizes da FIA protegem o piloto por fora quando há sobreposição significativa de eixos no apex.",
          },
          {
            step: 4 as const,
            title: "Desafio 4 — Recursos de 2026",
            question: "O Overtake Mode garante uma ultrapassagem automática?",
            options: [
              { id: "yes", text: "Sim, o carro ultrapassa sem qualquer chance de defesa.", correct: false },
              { id: "correct", text: "Não. Ele fornece potência elétrica extra, mas a manobra depende da execução do piloto na frenagem.", correct: true },
              { id: "drs", text: "Sim, porque funciona exatamente igual ao antigo DRS.", correct: false },
            ],
            fb: "Isso mesmo! O Overtake Mode é uma ferramenta de apoio elétrico, mas não substitui a precisão cirúrgica na freada.",
          },
        ]

        const currentCh = challenges.find((c) => c.step === m5ChallengeStep) || challenges[0]
        const currentAns = m5ChallengeAnswers[m5ChallengeStep]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">
                DESAFIO {m5ChallengeStep} DE 4
              </span>
            </div>

            <p className="text-[11px] font-bold text-white mb-2">{currentCh.question}</p>

            <div className="space-y-1 mb-2.5">
              {currentCh.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM5ChallengeAnswers((prev) => ({ ...prev, [m5ChallengeStep]: opt.id }))}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                    currentAns === opt.id
                      ? opt.correct
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-red-900/80 text-white"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {currentAns && (
              <div className="text-[10px] text-zinc-300 bg-white/5 p-2 rounded border border-white/10 mb-2 leading-tight">
                {currentCh.fb}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              {m5ChallengeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setM5ChallengeStep((prev) => (prev - 1) as any)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-300 cursor-pointer"
                >
                  Anterior
                </button>
              )}
              {m5ChallengeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setM5ChallengeStep((prev) => (prev + 1) as any)}
                  disabled={!currentAns}
                  className="ml-auto px-3 py-1 rounded bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 text-xs font-black uppercase text-white cursor-pointer"
                >
                  Próximo Desafio ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setM5ShowSummaryReview(true)}
                  className="ml-auto px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase text-white cursor-pointer"
                >
                  Revisar o que Aprendi
                </button>
              )}
            </div>

            {m5ShowSummaryReview && (
              <div className="mt-2 p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-200 space-y-1">
                <span className="font-bold block text-cyan-300">Resumo da Análise Especializada:</span>
                <div>• Ultrapassar exige gestão de energia de 2026 e controle absoluto.</div>
                <div>• Nem a linha interna nem a externa dão direitos incondicionais.</div>
                <div>• Comissários julgam por telemetria, não por impressões isoladas.</div>
              </div>
            )}
          </div>
        )
      }

      // CENA 8: RESUMO: ENTENDA A DISPUTA ANTES DE JULGÁ-LA
      if (currentScene.visualEffectType === "mod5_overtaking_summary") {
        const principles = [
          "1. Uma ultrapassagem exige preparação, vácuo e controle.",
          "2. A defesa deve respeitar as regras e a segurança dos rivais.",
          "3. Os recursos de 2026 (Aero Ativa + Overtake) substituem o DRS.",
          "4. A posição relativa dos carros no apex decide o direito ao espaço.",
          "5. Incidentes devem ser avaliados com evidências e telemetria.",
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Cinco Princípios Fundamentais</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">SÍNTESE</span>
            </div>

            <div className="space-y-1.5 mb-3">
              {principles.map((p, idx) => (
                <div key={idx} className="bg-white/5 py-1 px-2 rounded border border-white/10 text-[10px] text-zinc-200">
                  {p}
                </div>
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
              Iniciar Quiz (10 Perguntas)
            </button>
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 3: DENTRO DA CORRIDA: APRENDA A ACOMPANHAR UMA TRANSMISSÃO
    // ------------------------------------------------------------------------
    if (activeModuleId === 3) {
      // CENA 1: O FIM DE SEMANA DE FÓRMULA 1
      if (currentScene.visualEffectType === "mod3_weekend_format") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Estrutura do Evento</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">PROGRAMAÇÃO</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setM3WeekendFormat("traditional")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m3WeekendFormat === "traditional" ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Tradicional
              </button>
              <button
                type="button"
                onClick={() => setM3WeekendFormat("sprint")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m3WeekendFormat === "sprint" ? "bg-amber-600 text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Formato Sprint
              </button>
            </div>

            {m3WeekendFormat === "traditional" ? (
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-cyan-400 block text-[11px]">SEXTA-FEIRA:</span>
                  TL1 (Treino Livre 1) & TL2 (Treino Livre 2)
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-amber-400 block text-[11px]">SÁBADO:</span>
                  TL3 & Classificação Oficial (Q1, Q2, Q3)
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-emerald-400 block text-[11px]">DOMINGO:</span>
                  Grande Prêmio (Corrida Principal de ~300 km)
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-cyan-400 block text-[11px]">SEXTA-FEIRA:</span>
                  TL1 Único & Classificação Sprint (Shootout)
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-amber-400 block text-[11px]">SÁBADO:</span>
                  Corrida Sprint (100 km) & Classificação do GP
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                  <span className="font-black text-emerald-400 block text-[11px]">DOMINGO:</span>
                  Grande Prêmio (Corrida Principal)
                </div>
              </div>
            )}

            <div className="mt-2.5 p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-200 leading-snug">
              A Sprint e o Grande Prêmio são sessões distintas: a Classificação Sprint define o grid da Sprint, e a Classificação do GP define a corrida de domingo.
            </div>
          </div>
        )
      }

      // CENA 2: TREINOS LIVRES: A PREPARAÇÃO
      if (currentScene.visualEffectType === "mod3_practice_analysis") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Exemplo Ilustrativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">TREINOS LIVRES</span>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2.5 leading-snug">
              Qual das sessões abaixo é mais útil para avaliar o ritmo consistente de corrida de domingo?
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => setM3PracticePicked("A")}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all cursor-pointer",
                  m3PracticePicked === "A" ? "bg-amber-600/30 border-amber-500 ring-1 ring-amber-400" : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <span className="text-[10px] font-black text-amber-300 block mb-0.5 uppercase">Sessão A (Volta Única)</span>
                <span className="text-[10px] text-zinc-300 block">Pneu Macio • Tanque vazio</span>
                <span className="text-[11px] font-mono font-bold text-white block mt-1">1:18.250 (1 volta)</span>
              </button>

              <button
                type="button"
                onClick={() => setM3PracticePicked("B")}
                className={cn(
                  "p-2 rounded-lg border text-left transition-all cursor-pointer",
                  m3PracticePicked === "B" ? "bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-400" : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <span className="text-[10px] font-black text-emerald-300 block mb-0.5 uppercase">Sessão B (Long Run)</span>
                <span className="text-[10px] text-zinc-300 block">Pneu Médio • Tanque 100kg</span>
                <span className="text-[11px] font-mono font-bold text-white block mt-1">15 voltas em 1:21.8</span>
              </button>
            </div>

            {m3PracticePicked && (
              <div className={cn(
                "p-2.5 rounded-lg border text-[11px] leading-snug",
                m3PracticePicked === "B" ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200" : "bg-amber-950/60 border-amber-500/40 text-amber-200"
              )}>
                {m3PracticePicked === "B"
                  ? "Exatamente! A Sessão B simula o peso real da largada e a degradação dos pneus ao longo das voltas, revelando a verdadeira velocidade de corrida."
                  : "Atenção: A Sessão A mostra apenas a velocidade máxima instantânea de classificação. Sem sequências longas, é impossível prever o ritmo de domingo."}
              </div>
            )}
          </div>
        )
      }

      // CENA 3: CLASSIFICAÇÃO E GRID DE LARGADA
      if (currentScene.visualEffectType === "mod3_qualifying_grid") {
        const drivers = [
          { letter: "C", time: "1:15.120", gap: "LÍDER", team: "Velocity F1", pole: true },
          { letter: "A", time: "1:15.280", gap: "+0.160s", team: "Titan Grand Prix", pole: false },
          { letter: "F", time: "1:15.410", gap: "+0.290s", team: "Dynamo Racing", pole: false },
          { letter: "B", time: "1:15.650", gap: "+0.530s", team: "Apex Motorsport", pole: false },
          { letter: "E", time: "1:15.890", gap: "+0.770s", team: "Zenith Sport", pole: false },
          { letter: "D", time: "1:16.100", gap: "+0.980s", team: "Vortex Racing", pole: false },
        ]

        const displayDrivers = m3GridSorted
          ? drivers
          : [drivers[1], drivers[3], drivers[0], drivers[5], drivers[4], drivers[2]]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">FASE Q3 (POLE)</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {displayDrivers.map((d, idx) => (
                <div key={d.letter} className="flex items-center justify-between py-1 px-2 rounded bg-white/5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-black w-5", m3GridSorted && idx === 0 ? "text-amber-400" : "text-zinc-400")}>
                      {m3GridSorted ? `P${idx + 1}` : `—`}
                    </span>
                    <span className="font-bold text-white">Piloto {d.letter}</span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline">({d.team})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-bold">{d.time}</span>
                    {m3GridSorted && <span className="text-[10px] text-zinc-400">{d.gap}</span>}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setM3GridSorted(!m3GridSorted)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center mb-2"
            >
              {m3GridSorted ? "Restaurar Ordem de Pista" : "Ordenar Grid por Tempo (Menor ➔ Maior)"}
            </button>

            {m3GridSorted && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 leading-tight">
                Piloto C conquistou a <strong>Pole Position</strong> por cravar o menor tempo de volta (1:15.120).
              </div>
            )}
          </div>
        )
      }

      // CENA 4: A LARGADA: CINCO LUZES
      if (currentScene.visualEffectType === "mod3_start_sequence") {
        const handleStartSequence = () => {
          setM3StartStep(1)
          setTimeout(() => setM3StartStep(2), 700)
          setTimeout(() => setM3StartStep(3), 1400)
          setTimeout(() => setM3StartStep(4), 2100)
          setTimeout(() => setM3StartStep(5), 2800)
          setTimeout(() => setM3StartStep(6), 4200)
        }

        return (
          <>
            {/* Pórtico de Largada com 5 Luzes */}
            <div className="absolute top-4 inset-x-0 z-20 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-3 rounded-2xl bg-black/95 border border-white/25 shadow-2xl backdrop-blur-md">
                {[1, 2, 3, 4, 5].map((light) => {
                  const isRed = m3StartStep >= light && m3StartStep < 6
                  return (
                    <div
                      key={light}
                      className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all",
                        isRed
                          ? "bg-[#E10600] border-red-400 shadow-[0_0_20px_#E10600]"
                          : "bg-zinc-900 border-zinc-700 opacity-60"
                      )}
                    />
                  )
                })}
              </div>

              {m3StartStep === 6 && (
                <div className="mt-2 px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-xs font-black uppercase tracking-widest shadow-[0_0_25px_#10B981] animate-bounce">
                  🟢 LUZES APAGADAS • LARGADA DADA!
                </div>
              )}
            </div>

            {/* Painel de Interação de Largada */}
            <div className="absolute bottom-3 inset-x-3 sm:bottom-5 sm:right-5 sm:left-auto sm:w-84 z-20 bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">LARGADA</span>
              </div>

              <button
                type="button"
                onClick={handleStartSequence}
                className="w-full py-2 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all cursor-pointer mb-2.5 text-center"
              >
                {m3StartStep === 0 ? "Preparar Largada" : "Repetir Sequência de Luzes"}
              </button>

              <p className="text-[11px] text-zinc-300 font-bold mb-1.5">
                Em que momento a largada acontece no procedimento normal?
              </p>

              <div className="space-y-1">
                {[
                  { id: 1, text: "Quando a 1ª luz acende" },
                  { id: 2, text: "Quando todas as 5 luzes vermelhas se apagam" },
                  { id: 3, text: "Exatamente 10 segundos após o sinal" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setM3StartAnswer(opt.id)}
                    className={cn(
                      "w-full text-left py-1 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                      m3StartAnswer === opt.id
                        ? opt.id === 2 ? "bg-emerald-600 text-white font-bold" : "bg-red-900/80 text-white"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {m3StartAnswer && (
                <div className="mt-2 text-[10px] text-zinc-300 bg-white/5 p-1.5 rounded border border-white/10 leading-tight">
                  {m3StartAnswer === 2
                    ? "Correto! As luzes acendem uma a uma e, ao se apagarem juntas após um tempo variável, a prova começa."
                    : "Incorreto. A largada só é autorizada no instante em que todas as luzes vermelhas se apagam simultaneamente."}
                </div>
              )}
            </div>
          </>
        )
      }

      // CENA 5: A CORRIDA: TORRE, GAP E INT
      if (currentScene.visualEffectType === "mod3_race_tower") {
        const driversTower = [
          { code: "VER", pos: 1, team: "LBR", gap: "—", int: "—", diff: 0, desc: "Líder da corrida. Dita o ritmo e administra o desgaste de borracha." },
          { code: "NOR", pos: 2, team: "PAP", gap: "+1.850s", int: "+1.850s", diff: 0, desc: "Persegue o líder tentando reduzir a distância para menos de 1 segundo." },
          { code: "LEC", pos: 3, team: "SFM", gap: "+2.450s", int: "+0.600s", diff: 1, desc: "A 0.6s de NOR! Na zona de detecção do DRS, com grande chance de ultrapassagem." },
          { code: "HAM", pos: 4, team: "MER", gap: "+5.120s", int: "+2.670s", diff: -1, desc: "Isolado em 4º lugar, gerenciando o motor e preparando uma parada antecipada." },
        ]

        const activeCar = driversTower.find((d) => d.code === m3TowerSelected) || driversTower[2]

        return (
          <>
            {/* Torre Vertical de Classificação de Transmissão */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 w-52 sm:w-60 bg-black/92 border border-white/20 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/15">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Classificação F1</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#E10600] text-white font-bold">VOLTA 34/57</span>
              </div>

              <div className="space-y-1">
                {driversTower.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => setM3TowerSelected(d.code as any)}
                    className={cn(
                      "w-full flex items-center justify-between py-1 px-1.5 rounded text-[11px] font-mono transition-all cursor-pointer text-left",
                      m3TowerSelected === d.code
                        ? "bg-[#E10600] text-white ring-1 ring-white"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-black w-3 text-center">{d.pos}</span>
                      <span className="font-black text-white">{d.code}</span>
                      <span className="text-[9px] text-zinc-400">({d.team})</span>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="font-bold">{d.int}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex justify-between text-[9px] font-mono text-zinc-400">
                <span>GAP: Dif. pro Líder</span>
                <span>INT: Dif. pro da Frente</span>
              </div>
            </div>

            {/* Painel Explicativo do Piloto Selecionado */}
            <div className="absolute bottom-3 inset-x-3 sm:bottom-5 sm:right-5 sm:left-auto sm:w-80 z-20 bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Telemetria Selecionada</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">
                  P{activeCar.pos} • {activeCar.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-white/5 p-2 rounded-lg border border-white/10 mb-2 text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase">GAP (Líder):</span>
                  <span className="font-bold text-white">{activeCar.gap}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase">INT (Carro da Frente):</span>
                  <span className="font-bold text-cyan-300">{activeCar.int}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-200 leading-snug">{activeCar.desc}</p>
            </div>
          </>
        )
      }

      // CENA 6: PIT STOPS E ESTRATÉGIA
      if (currentScene.visualEffectType === "mod3_pitstop_strategy") {
        const strats = {
          undercut: {
            title: "Undercut (Parar Antes)",
            pros: "Aproveita pneus novos imediatos para fazer a volta de saída ultra-rápida e passar o rival nos boxes.",
            risk: "Risco de voltar preso no tráfego de carros mais lentos no meio do pelotão.",
          },
          overcut: {
            title: "Overcut (Ficar na Pista)",
            pros: "Usa ar limpo sem carros à frente para estender o stint e se beneficiar de um possível Safety Car.",
            risk: "Risco dos pneus velhos degradarem demais e perder 2 segundos por volta em relação ao rival.",
          },
          traffic: {
            title: "Avaliar Tráfego e Dados",
            pros: "Espera abrir uma janela livre de tráfego antes de chamar o piloto para o pit lane.",
            risk: "Pode perder o timing ideal da parada se o rival já tiver acionado o undercut com sucesso.",
          },
        }

        const currentS = strats[m3StrategyPicked]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Cenário Ilustrativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">ESTRATÉGIA</span>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 leading-snug">
              Piloto B está a 1.2s do líder na volta 22. Os pneus começam a perder aderência. O que a equipe decide?
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {(["undercut", "overcut", "traffic"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setM3StrategyPicked(s)}
                  className={cn(
                    "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                    m3StrategyPicked === s ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                  )}
                >
                  {s === "undercut" ? "Undercut" : s === "overcut" ? "Overcut" : "Tráfego"}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs text-zinc-200 mb-2 space-y-1">
              <span className="font-bold text-amber-300 block">{currentS.title}</span>
              <p className="text-[11px] text-emerald-300">✅ {currentS.pros}</p>
              <p className="text-[11px] text-rose-300">⚠️ {currentS.risk}</p>
            </div>

            <div className="text-[10px] font-mono text-zinc-400 text-center">
              A decisão ideal depende de pista livre, temperatura e tráfego.
            </div>
          </div>
        )
      }

      // CENA 7: BANDEIRAS E SAFETY CAR
      if (currentScene.visualEffectType === "mod3_flags_safety_car") {
        const scenarios = [
          {
            id: 1 as const,
            title: "1. Carro na brita em curva perigosa",
            procedure: "Bandeira Amarela / Virtual Safety Car (VSC)",
            rule: "Pilotos devem reduzir velocidade respeitando o tempo delta. Ultrapassagens são terminantemente proibidas.",
          },
          {
            id: 2 as const,
            title: "2. Chuva torrencial e barreira quebrada",
            procedure: "Bandeira Vermelha (Sessão Suspensa)",
            rule: "Todos os carros entram em baixa velocidade no pit lane e aguardam em segurança o reparo da pista.",
          },
          {
            id: 3 as const,
            title: "3. Toque lateral na disputa de curva",
            procedure: "Investigação dos Comissários da FIA",
            rule: "Os comissários analisam telemetria e vídeos. Podem aplicar 5s/10s de punição ou declarar incidente de corrida.",
          },
        ]

        const scn = scenarios.find((s) => s.id === m3IncidentScenario) || scenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Direção de Prova</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-black">SEGURANÇA</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM3IncidentScenario(s.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m3IncidentScenario === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs text-zinc-200">
              <span className="text-[10px] font-mono uppercase text-amber-400 block mb-0.5">Procedimento Aplicado:</span>
              <span className="font-black text-white block mb-1">{scn.procedure}</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{scn.rule}</p>
            </div>
          </div>
        )
      }

      // CENA 8: BANDEIRADA, RESULTADO E PONTOS
      if (currentScene.visualEffectType === "mod3_finish_championship") {
        const results = [
          { pos: 1, driver: "Piloto A", team: "Alfa Tech", gap: "VENCEDOR", pts: "25 pts" },
          { pos: 2, driver: "Piloto B", team: "Beta GP", gap: "+2.340s", pts: "18 pts" },
          { pos: 3, driver: "Piloto C", team: "Gama Racing", gap: "+5.110s", pts: "15 pts" },
          { pos: 4, driver: "Piloto D", team: "Delta Sport", gap: "+12.450s", pts: "12 pts" },
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Resultado Ilustrativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">CHEGADA</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {results.map((r) => (
                <div key={r.pos} className="flex items-center justify-between py-1 px-2 rounded bg-white/5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-black w-4", r.pos === 1 ? "text-amber-400" : "text-zinc-400")}>
                      P{r.pos}
                    </span>
                    <span className="font-bold text-white">{r.driver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-300">{r.gap}</span>
                    <span className="text-[10px] font-black text-emerald-400">{r.pts}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline de Resumo da Corrida */}
            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-300 text-center uppercase tracking-wide mb-3">
              GRID ➔ LARGADA ➔ DISPUTA ➔ ESTRATÉGIA ➔ BANDEIRADA
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
    // ------------------------------------------------------------------------
    // MÓDULO 4: A MENTE POR TRÁS DA CORRIDA: ESTRATÉGIA, PNEUS E BOXES
    // ------------------------------------------------------------------------
    if (activeModuleId === 4) {
      // CENA 1: A ESTRATÉGIA COMEÇA ANTES DA LARGADA
      if (currentScene.visualEffectType === "mod4_roles_strategy") {
        const roles = [
          { id: "pilot", title: "Piloto", desc: "Sente o comportamento do carro, a aderência na pista e relata o desgaste da borracha curva a curva.", role: "Condução e Feedback" },
          { id: "engineer", title: "Engenheiro de Corrida", desc: "A voz no rádio. Traduz os pedidos do piloto e transmite as ordens técnicas e deltas de tempo.", role: "Comunicação e Operação" },
          { id: "strategist", title: "Estrategistas", desc: "Ficam no muro dos boxes e na fábrica. Simulam cenários matemáticos, paradas e o momento ideal do pit stop.", role: "Decisão e Modelagem" },
          { id: "pitcrew", title: "Equipe dos Boxes", desc: "Mais de 20 mecânicos sincronizados trocam 4 pneus em menos de 2,5 segundos sob pressão extrema.", role: "Execução do Pit Stop" },
        ]

        const currentRole = roles.find((r) => r.id === m4Role) || roles[2]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Quem Faz o Quê?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">PIT WALL</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setM4Role(r.id as any)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-left transition-all cursor-pointer",
                    m4Role === r.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {r.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 mb-2.5 text-xs">
              <span className="font-bold text-cyan-400 block mb-0.5">{currentRole.role}:</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{currentRole.desc}</p>
            </div>

            {/* Pergunta de Fixação */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] font-bold text-amber-300 mb-1.5">
                Quem avalia os cenários de parada e compara diferentes planos de corrida?
              </p>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                {[
                  { id: "pilot", text: "Piloto" },
                  { id: "strategist", text: "Estrategistas" },
                  { id: "pitcrew", text: "Equipe dos Boxes" },
                  { id: "engineer", text: "Engenheiro" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setM4RoleQuestionAnswer(opt.id)}
                    className={cn(
                      "py-1 px-1.5 rounded text-[10px] font-mono transition-all cursor-pointer text-center",
                      m4RoleQuestionAnswer === opt.id
                        ? opt.id === "strategist"
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-red-900/80 text-white"
                        : "bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {m4RoleQuestionAnswer && (
                <div className="text-[10px] text-zinc-300 bg-white/5 p-1.5 rounded border border-white/10 leading-tight">
                  {m4RoleQuestionAnswer === "strategist"
                    ? "Correto! Os estrategistas comparam modelos de ritmo, tráfego e degrau de pneus para definir o plano ideal."
                    : "Quase lá. O piloto e o engenheiro fornecem dados em tempo real, mas a modelagem dos planos cabe aos estrategistas."}
                </div>
              )}
            </div>
          </div>
        )
      }

      // CENA 2: PNEUS: TEMPO GANHO E PERDIDO
      if (currentScene.visualEffectType === "mod4_tire_choice_sim") {
        const scenarios = [
          {
            id: 1 as const,
            title: "1. Poucas Voltas Restantes (Buscar Desempenho)",
            recom: "Macio (Soft)",
            logic: "Máxima aderência imediata para atacar nas voltas finais.",
            advantage: "Ganha até 1 segundo por volta em relação a pneus velhos.",
            risk: "Superaquecimento rápido se pressionar demais em ar turbulento.",
            extra: "Estrategista verifica se haverá voltas suficientes para ultrapassar antes de degradar.",
            bars: { grip: 95, deg: 85, life: 30 },
          },
          {
            id: 2 as const,
            title: "2. Longo Trecho pela Frente (Foco em Durabilidade)",
            recom: "Duro (Hard)",
            logic: "Construção de borracha rígida para resistir a mais de 35 voltas.",
            advantage: "Ritmo constante com degradação muito baixa.",
            risk: "Demora mais voltas para atingir a temperatura ideal de funcionamento.",
            extra: "Estrategista monitora se o asfalto está quente o bastante para dar aderência ao composto duro.",
            bars: { grip: 70, deg: 30, life: 95 },
          },
          {
            id: 3 as const,
            title: "3. Pista com Chuva e Baixa Aderência",
            recom: "Intermediário / Chuva Extrema",
            logic: "Compostos com sulcos para evacuar água e evitar aquaplanagem.",
            advantage: "Permite tracionar e frear em segurança no asfalto molhado.",
            risk: "Se a pista secar rápido, o pneu superaquece e se desfaz em poucas voltas.",
            extra: "Estrategista vigia o radar meteorológico para antecipar o crossover.",
            bars: { grip: 60, deg: 50, life: 60 },
          },
        ]

        const scn = scenarios.find((s) => s.id === m4TireScenario) || scenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Qual Pneu Escolher?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">COMPOSTOS</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM4TireScenario(s.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m4TireScenario === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Barras Didáticas Qualitativas */}
            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 mb-2 space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Aderência Inicial:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${scn.bars.grip}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sensibilidade ao Desgaste:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${scn.bars.deg}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Durabilidade em Voltas:</span>
                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${scn.bars.life}%` }} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 space-y-1 bg-white/5 p-2 rounded-lg border border-white/10 leading-snug">
              <span className="font-bold text-amber-300 block">Composto Recomendado: {scn.recom}</span>
              <p><strong className="text-emerald-400">Vantagem:</strong> {scn.advantage}</p>
              <p><strong className="text-rose-400">Risco:</strong> {scn.risk}</p>
            </div>
          </div>
        )
      }

      // CENA 3: PIT STOP: QUANDO É A HORA DE PARAR?
      if (currentScene.visualEffectType === "mod4_pitstop_timing_calc") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">PIT STOP</span>
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-xs text-zinc-200 mb-2.5 space-y-0.5 font-mono">
              <div className="flex justify-between"><span>Posição Atual:</span><strong className="text-white">P4</strong></div>
              <div className="flex justify-between"><span>Rival à Frente:</span><strong className="text-amber-400">P3 (+1.4s)</strong></div>
              <div className="flex justify-between"><span>Voltas Restantes:</span><strong className="text-white">20 voltas</strong></div>
              <div className="flex justify-between"><span>Perda Total no Pit:</span><strong className="text-rose-400">~22.0 segundos</strong></div>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              Seus pneus perdem ritmo e o rival não parou. Qual decisão tomar?
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM4PitChoice("now")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "now" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Parar Agora (Undercut)
              </button>
              <button
                type="button"
                onClick={() => setM4PitChoice("stay3")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "stay3" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Ficar +3 Voltas
              </button>
              <button
                type="button"
                onClick={() => setM4PitChoice("wait_info")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4PitChoice === "wait_info" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Aguardar Dados
              </button>
            </div>

            {m4PitChoice && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug mb-2">
                {m4PitChoice === "now" && (
                  <>
                    <span className="font-bold text-emerald-400 block mb-0.5">Tentativa de Undercut:</span>
                    Você coloca pneus novos e vira 1,5s mais rápido. Se sair livre de tráfego, assume o P3 quando o rival parar!
                  </>
                )}
                {m4PitChoice === "stay3" && (
                  <>
                    <span className="font-bold text-amber-400 block mb-0.5">Aposta no Overcut:</span>
                    Seus pneus continuam degradando, mas você torce por um Safety Car oportuno para economizar 10s no pit stop.
                  </>
                )}
                {m4PitChoice === "wait_info" && (
                  <>
                    <span className="font-bold text-cyan-400 block mb-0.5">Cautela Tática:</span>
                    A equipe monitora se outros carros que já pararam pegaram tráfego no pelotão intermediário antes de decidir.
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setM4PitChoice(null)}
              className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer block text-center w-full"
            >
              Reiniciar Cenário
            </button>
          </div>
        )
      }

      // CENA 4: SAFETY CAR, VSC E BANDEIRAS
      if (currentScene.visualEffectType === "mod4_safety_car_rain") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Imprevisto na Pista</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-black">A CHUVA CHEGOU!</span>
            </div>

            {/* Linha do Tempo Didática */}
            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-300 text-center uppercase tracking-wide mb-2.5">
              Plano Inicial ➔ Chuva na Curva 4 ➔ Nova Avaliação ➔ Decisão
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 leading-snug">
              Pingos de chuva no setor 2, mas a reta ainda está seca. Alguns rivais continuam de slick. O que fazer?
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM4RainChoice("slick")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "slick" ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Manter Slick
              </button>
              <button
                type="button"
                onClick={() => setM4RainChoice("inter")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "inter" ? "bg-emerald-600 text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Colocar Inter
              </button>
              <button
                type="button"
                onClick={() => setM4RainChoice("wait")}
                className={cn(
                  "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                  m4RainChoice === "wait" ? "bg-amber-600 text-white" : "bg-white/10 text-zinc-300"
                )}
              >
                Aguardar Radar
              </button>
            </div>

            {m4RainChoice && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug">
                {m4RainChoice === "slick" && (
                  <p>Vantagem se a chuva parar rápido; mas alto risco de rodar se o asfalto encharcar.</p>
                )}
                {m4RainChoice === "inter" && (
                  <p>Segurança total na chuva; mas se o sol abrir, os intermediários superaquecem e derretem em 3 voltas.</p>
                )}
                {m4RainChoice === "wait" && (
                  <p>A equipe consulta a telemetria do radar de tempestade para não parar uma volta antes da hora.</p>
                )}
              </div>
            )}
          </div>
        )
      }

      // CENA 5: RÁDIO, TELEMETRIA E O QUE OS DADOS REVELAM
      if (currentScene.visualEffectType === "mod4_telemetry_radio_data") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Exemplo Ilustrativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">TELEMETRIA</span>
            </div>

            <table className="w-full text-[11px] font-mono mb-2.5">
              <thead>
                <tr className="border-b border-white/15 text-zinc-400 text-[10px]">
                  <th className="text-left pb-1">Indicador</th>
                  <th className="text-right pb-1 text-white">Piloto A</th>
                  <th className="text-right pb-1 text-cyan-300">Piloto B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-200">
                <tr><td className="py-1">Volta anterior</td><td className="text-right">1:32.400</td><td className="text-right">1:32.700</td></tr>
                <tr><td className="py-1">Volta atual</td><td className="text-right text-rose-400">1:33.100</td><td className="text-right text-emerald-400">1:32.800</td></tr>
                <tr><td className="py-1">Idade pneus</td><td className="text-right">18 voltas</td><td className="text-right">8 voltas</td></tr>
                <tr><td className="py-1">Posição</td><td className="text-right font-black">P4</td><td className="text-right font-black">P5</td></tr>
              </tbody>
            </table>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              O que você conclui com esses dados?
            </p>

            <button
              type="button"
              onClick={() => setM4ShowDataAnalysis(!m4ShowDataAnalysis)}
              className="w-full py-1.5 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center mb-2"
            >
              {m4ShowDataAnalysis ? "Ocultar Análise" : "Mostrar Análise dos Estrategistas"}
            </button>

            {m4ShowDataAnalysis && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 space-y-1 leading-snug">
                <p>• <strong>Piloto A perdeu 0,700s</strong> na volta atual, indicando provável queda no rendimento dos pneus de 18 voltas.</p>
                <p>• <strong>Piloto B foi 0,300s mais rápido</strong> (1:32.800 vs 1:33.100) na volta atual, diminuindo a distância.</p>
                <p className="text-amber-300 font-bold">• Mas atenção: uma única volta não prova tudo! É preciso avaliar mais setores para confirmar a tendência.</p>
              </div>
            )}
          </div>
        )
      }

      // CENA 6: COMUNICAÇÃO, ERROS E PLANOS ALTERNATIVOS
      if (currentScene.visualEffectType === "mod4_alternate_plans") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Plano A ou Plano B?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">CONTINGÊNCIA</span>
            </div>

            <p className="text-[11px] text-zinc-300 mb-2.5 leading-snug">
              Seu plano era parar na volta 30. Mas seu rival direto parou na volta 25 e está voando baixo com pneus novos.
            </p>

            <div className="space-y-1 mb-2.5">
              {[
                { id: "anticipate", title: "1. Antecipar a Parada Agora", desc: "Limita o dano do undercut do rival chamando o piloto imediatamente." },
                { id: "stay", title: "2. Ficar na Pista e Acelerar", desc: "Tenta acumular ar limpo e parar no fim da prova com pneus bem mais novos." },
                { id: "more_data", title: "3. Pedir Mais Dados de Rádio", desc: "Checa se o rival pegou tráfego antes de queimar o plano A." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM4AlternatePlan(opt.id as any)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m4AlternatePlan === opt.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span className="block font-black">{opt.title}</span>
                  <span className="block text-[9px] font-normal text-zinc-300">{opt.desc}</span>
                </button>
              ))}
            </div>

            {m4AlternatePlan && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug mb-1">
                <span className="font-bold text-amber-300 block mb-0.5">Avaliação da Escolha:</span>
                Toda decisão envolve risco. Antecipar reduz a perda direta, mas encurta a vida dos pneus no último trecho. Ficar na pista exige ar livre absoluto.
              </div>
            )}
          </div>
        )
      }

      // CENA 7: DESAFIO DO ESTRATEGISTA: SUA DECISÃO PODE MUDAR A CORRIDA
      if (currentScene.visualEffectType === "mod4_strategist_challenge") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Desafio Interativo</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">
                ETAPA {m4ChallengeStep} DE 4
              </span>
            </div>

            {/* ETAPA 1: ESCOLHA INICIAL */}
            {m4ChallengeStep === 1 && (
              <div className="space-y-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] font-mono">
                  <div>• 10 voltas restantes | Seu piloto em P3</div>
                  <div>• Rival em P4 a 2,4s acabou de colocar pneus novos</div>
                  <div>• Seu piloto está com Médios de 15 voltas perdendo ritmo</div>
                </div>

                <p className="text-[11px] text-white font-bold">Qual deve ser a prioridade da equipe?</p>

                <div className="space-y-1">
                  {[
                    { id: "stop", label: "Parar imediatamente para defender" },
                    { id: "stay", label: "Permanecer na pista e administrar o ritmo" },
                    { id: "evaluate", label: "Avaliar o ritmo do rival antes de confirmar" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setM4ChallengeP1(opt.id as any)}
                      className={cn(
                        "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                        m4ChallengeP1 === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {m4ChallengeP1 && (
                  <button
                    type="button"
                    onClick={() => setM4ChallengeStep(2)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Confirmar e Ver Próxima Volta ➔
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 2: NOVO ACONTECIMENTO */}
            {m4ChallengeStep === 2 && (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200">
                  <span className="font-bold block text-amber-300 mb-0.5">⚠️ Volta 50/57: O Rival Atacou!</span>
                  O rival fez a volta mais rápida da prova e a diferença caiu de 2,4s para 1,1s! Seus pneus traseiros começam a deslizar na curva 9.
                </div>

                <p className="text-[11px] text-white font-bold">A situação mudou. Como você reage?</p>

                <button
                  type="button"
                  onClick={() => setM4ChallengeStep(3)}
                  className="w-full py-1.5 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Tomar Decisão Final de Corrida ➔
                </button>
              </div>
            )}

            {/* ETAPA 3: DECISÃO FINAL */}
            {m4ChallengeStep === 3 && (
              <div className="space-y-2">
                <p className="text-[11px] text-white font-bold">Escolha sua ação com a justificativa:</p>

                <div className="space-y-1">
                  {[
                    { id: "protect", label: "“Quero proteger a posição na pista até o final.”" },
                    { id: "attack", label: "“Quero buscar uma oportunidade de parada estratégica.”" },
                    { id: "data", label: "“Preciso de mais dados de rádio antes de arriscar.”" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setM4ChallengeP2(opt.id as any)}
                      className={cn(
                        "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                        m4ChallengeP2 === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {m4ChallengeP2 && (
                  <button
                    type="button"
                    onClick={() => setM4ChallengeStep(4)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Gerar Relatório de Estratégia 📊
                  </button>
                )}
              </div>
            )}

            {/* ETAPA 4: RELATÓRIO DO ESTRATEGISTA */}
            {m4ChallengeStep === 4 && (
              <div className="space-y-2">
                <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[10px] space-y-1 leading-snug">
                  <div className="font-black text-cyan-300 uppercase">Relatório de Decisão do Estrategista</div>
                  <div>• <strong>Ação:</strong> {m4ChallengeP2 === "protect" ? "Defesa de Posição na Pista" : m4ChallengeP2 === "attack" ? "Parada Agressiva de Pneus Novos" : "Gestão Baseada em Dados"}</div>
                  <div>• <strong>Vantagem:</strong> Evita a perda garantida de 22s no pit lane mantendo o carro na frente na pista.</div>
                  <div>• <strong>Risco:</strong> Vulnerabilidade contra o DRS do adversário na volta final.</div>
                  <div>• <strong>Lição:</strong> Não existe resposta mágica; toda decisão em F1 gerencia probabilidades e riscos.</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setM4ChallengeStep(1)
                    setM4ChallengeP1(null)
                    setM4ChallengeP2(null)
      setM5StraightPoint(1)
      setM5AttackCard("aero")
      setM5DefenseScenario(1)
      setM5SideScenario("inside")
      setM5TrackLimitScenario(1)
      setM5AnalystAction(null)
      setM5ChallengeStep(1)
      setM5ChallengeAnswers({})
      setM5ShowSummaryReview(false)
      setM6Timeline1950Open(false)
      setM6ReflectionAnswered(false)
      setM6BrazilianDriverDetail(null)
      setM7SelectedRadioSim(1)
      setM7TeammateDecision(null)
      setM7ChallengeStep(1)
      setM7ChallengeAnswers({})
      setM7PitStopStep(1)
      setM7TelemetryPoint(1)
                  }}
                  className="w-full py-1 text-[10px] text-zinc-400 hover:text-white underline cursor-pointer text-center block"
                >
                  Recomeçar Desafio
                </button>
              </div>
            )}
          </div>
        )
      }

      // CENA 8: RESUMO: PENSE COMO UM ESTRATEGISTA
      if (currentScene.visualEffectType === "mod4_strategic_thinking_summary") {
        const pillars = [
          "1. A estratégia é uma decisão coletiva de equipe.",
          "2. Pneus influenciam ritmo, aderência e durabilidade.",
          "3. Pit stops envolvem custo total, tráfego e posição.",
          "4. Dados e rádio ajudam a interpretar tendências.",
          "5. Um bom plano precisa se adaptar aos imprevistos.",
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Cinco Pilares Fundamentais</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">SÍNTESE</span>
            </div>

            <div className="space-y-1.5 mb-3">
              {pillars.map((p, idx) => (
                <div key={idx} className="bg-white/5 py-1 px-2 rounded border border-white/10 text-[10px] text-zinc-200">
                  {p}
                </div>
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
              Fazer o Quiz Final (10 Perguntas)
            </button>
          </div>
        )
      }
    }
    // ------------------------------------------------------------------------
    // MÓDULO 5: A ARTE DE ULTRAPASSAR: ATAQUE, DEFESA E REGRAS
    // ------------------------------------------------------------------------
    if (activeModuleId === 5) {
      // CENA 1: COMO NASCE UMA ULTRAPASSAGEM
      if (currentScene.visualEffectType === "mod5_overtaking_anatomy") {
        const straightPhases = [
          {
            id: 1 as const,
            title: "1. Início da Reta (Vácuo)",
            desc: "O perseguidor entra no fluxo de ar de baixa resistência do líder (vácuo/slipstream), ganhando velocidade para emparelhar.",
          },
          {
            id: 2 as const,
            title: "2. Aproximação da Frenagem",
            desc: "O atacante escolhe a linha interna ou externa e define a referência visual exata para aplicar mais de 100 kg no freio.",
          },
          {
            id: 3 as const,
            title: "3. Entrada e Apex da Curva",
            desc: "Controla o carro em desaceleração profunda para buscar a tangência interna sem travar rodas ou empurrar o adversário.",
          },
        ]

        const currentPhase = straightPhases.find((p) => p.id === m5StraightPoint) || straightPhases[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Anatomia da Manobra</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">ULTRAPASSAGEM</span>
            </div>

            {/* Linha Visual das Fases */}
            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-300 text-center uppercase tracking-wide mb-2.5">
              Preparação ➔ Aproximação ➔ Ataque ➔ Frenagem ➔ Saída
            </div>

            <p className="text-[11px] text-zinc-300 mb-2 font-bold">
              Selecione o ponto da manobra para entender o que o piloto faz:
            </p>

            <div className="space-y-1 mb-2.5">
              {straightPhases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setM5StraightPoint(p.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5StraightPoint === p.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[11px] text-zinc-200 leading-snug">
              <span className="font-bold text-amber-300 block mb-0.5">{currentPhase.title}:</span>
              {currentPhase.desc}
            </div>
          </div>
        )
      }

      // CENA 2: O ATAQUE EM 2026: AERODINÂMICA ATIVA E OVERTAKE MODE
      if (currentScene.visualEffectType === "mod5_attack_tech_2026") {
        const cards = [
          {
            id: "aero" as const,
            title: "Aerodinâmica Ativa (2026)",
            role: "Corner Mode vs Straight Mode",
            desc: "As asas dianteira e traseira ajustam seus ângulos: máxima sustentação nas curvas (Corner Mode) e baixíssimo arrasto nas retas autorizadas (Straight Mode).",
          },
          {
            id: "overtake" as const,
            title: "Overtake Mode (2026)",
            role: "Potência Elétrica Extra",
            desc: "Disparo adicional de energia da bateria disponível sob requisitos regulamentares para auxiliar na aceleração durante a manobra.",
          },
          {
            id: "drs" as const,
            title: "DRS Tradicional (Histórico 2011–2025)",
            role: "Contexto de Transmissões Antigas",
            desc: "Abria fisicamente um flap da asa traseira a menos de 1 segundo do líder. Não é o sistema padrão de 2026, servindo como referência histórica.",
          },
        ]

        const currentC = cards.find((c) => c.id === m5AttackCard) || cards[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Recursos Técnicos de 2026</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">AERO & ENERGIA</span>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setM5AttackCard(c.id)}
                  className={cn(
                    "py-1.5 px-1 rounded text-[9px] font-black uppercase text-center transition-all cursor-pointer",
                    m5AttackCard === c.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                  )}
                >
                  {c.id === "aero" ? "Aero Ativa" : c.id === "overtake" ? "Overtake" : "Antigo DRS"}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2.5 rounded-lg border border-white/10 text-xs text-zinc-200 space-y-1 leading-snug">
              <span className="font-bold text-amber-300 block">{currentC.title}</span>
              <span className="text-[10px] font-mono text-cyan-300 block mb-1">Função: {currentC.role}</span>
              <p className="text-[11px] text-zinc-300">{currentC.desc}</p>
            </div>

            <div className="mt-2 text-[10px] text-zinc-400 text-center font-mono">
              Overtake Mode cria oportunidade, mas a ultrapassagem exige perícia na freada.
            </div>
          </div>
        )
      }

      // CENA 3: COMO DEFENDER UMA POSIÇÃO
      if (currentScene.visualEffectType === "mod5_defense_limits") {
        const defenseScenarios = [
          {
            id: 1 as const,
            title: "1. Defesa Firme e Limpa",
            badge: "PERMITIDO",
            color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
            desc: "O piloto se posiciona previamente na linha interna com clareza antes do ponto de frenagem, forçando o rival a contornar por fora.",
          },
          {
            id: 2 as const,
            title: "2. Mudança Perigosa na Freada",
            badge: "PROIBIDO (Moving Under Braking)",
            color: "text-rose-400 border-rose-500/40 bg-rose-950/40",
            desc: "Mudar de direção já em processo de frenagem desestabiliza o adversário a mais de 300 km/h e causa colisões graves.",
          },
          {
            id: 3 as const,
            title: "3. Espalhar Sem Deixar Espaço",
            badge: "SOB INVESTIGAÇÃO",
            color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
            desc: "Se o adversário já estiver emparelhado lado a lado, empurrá-lo para fora da zebra além dos limites da pista pode gerar penalidade.",
          },
        ]

        const currentDef = defenseScenarios.find((d) => d.id === m5DefenseScenario) || defenseScenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Defesa Inteligente ou Arriscada?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-white font-black">DEFESA</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {defenseScenarios.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setM5DefenseScenario(d.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5DefenseScenario === d.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {d.title}
                </button>
              ))}
            </div>

            <div className={cn("p-2 rounded-lg border text-xs leading-snug", currentDef.color)}>
              <span className="font-mono font-black block text-[10px] uppercase mb-0.5">{currentDef.badge}</span>
              <p className="text-[11px] text-zinc-200">{currentDef.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 4: RODA A RODA: QUEM TEM DIREITO AO ESPAÇO?
      if (currentScene.visualEffectType === "mod5_side_by_side_rules") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Diretrizes da FIA</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">RODA A RODA</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => setM5SideScenario("inside")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m5SideScenario === "inside" ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Ataque por Dentro
              </button>
              <button
                type="button"
                onClick={() => setM5SideScenario("outside")}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                  m5SideScenario === "outside" ? "bg-cyan-600 text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                )}
              >
                Ataque por Fora
              </button>
            </div>

            {/* Painel Informativo: O que os comissários observam? */}
            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-[10px] space-y-1 mb-2 leading-snug">
              <div className="font-bold text-amber-300 uppercase">O que os comissários observam no Apex?</div>
              <div>• <strong>Posicionamento relativo:</strong> eixo dianteiro alinhado com o retrovisor/eixo do rival.</div>
              <div>• <strong>Controle do carro:</strong> capacidade real de fazer a curva sem travar rodas.</div>
              <div>• <strong>Limites de pista:</strong> manter pelo menos uma roda dentro da linha branca.</div>
            </div>

            <div className="text-[11px] text-zinc-300 bg-white/5 p-2 rounded-lg border border-white/10 leading-snug">
              {m5SideScenario === "inside" ? (
                <>
                  <strong className="text-white block mb-0.5">Por Dentro:</strong>
                  Estar por dentro não dá direito de espalhar na saída e empurrar o rival para fora. É preciso deixar espaço de corrida.
                </>
              ) : (
                <>
                  <strong className="text-cyan-300 block mb-0.5">Por Fora:</strong>
                  Se o atacante estiver emparelhado no apex sob controle, ele não perde o direito ao espaço e não pode ser empurrado para a grama.
                </>
              )}
            </div>
          </div>
        )
      }

      // CENA 5: LIMITES DE PISTA, REJUNTES E REENTRADAS
      if (currentScene.visualEffectType === "mod5_track_limits_runoff") {
        const scenarios = [
          {
            id: 1 as const,
            title: "1. Manobra Dentro das Linhas",
            status: "VÁLIDA 🟢",
            desc: "Pelo menos parte de uma das quatro rodas permaneceu sobre a linha branca ou zebra em toda a curva.",
          },
          {
            id: 2 as const,
            title: "2. Ultrapassou Fora da Pista",
            status: "VANTAGEM INDEVIDA 🔴",
            desc: "Completou a manobra com as 4 rodas além da linha branca. Deve devolver a posição imediatamente ou sofrerá punição de tempo.",
          },
          {
            id: 3 as const,
            title: "3. Saiu para Evitar Colisão",
            status: "ANALISADO PELOS COMISSÁRIOS 🟡",
            desc: "Espalhou para a área de escape para não bater no rival que perdeu o ponto de frenagem e reentrou em segurança sem acelerar no tráfego.",
          },
        ]

        const scn = scenarios.find((s) => s.id === m5TrackLimitScenario) || scenarios[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">A Ultrapassagem Valeu?</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">LIMITES</span>
            </div>

            <div className="space-y-1 mb-2.5">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM5TrackLimitScenario(s.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                    m5TrackLimitScenario === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="bg-white/5 p-2 rounded-lg border border-white/10 text-xs text-zinc-200">
              <span className="font-mono font-bold text-amber-300 block text-[10px] mb-0.5">{scn.status}</span>
              <p className="text-[11px] text-zinc-300 leading-snug">{scn.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 6: INVESTIGAÇÕES, BANDEIRAS E PENALIDADES
      if (currentScene.visualEffectType === "mod5_stewards_investigations") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Comissários da FIA</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-black">INVESTIGAÇÃO</span>
            </div>

            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-zinc-200 mb-2 leading-snug">
              <strong>Incidente Curva 1:</strong> Toque de rodas na entrada do apex. Ambos os carros continuam na prova sem danos estruturais.
            </div>

            <p className="text-[11px] text-white font-bold mb-2">Você é o analista da corrida. Qual a ação mais coerente?</p>

            <div className="space-y-1 mb-2.5">
              {[
                { id: "investigate", label: "Abrir Investigação Formal dos Comissários" },
                { id: "monitor", label: "Continuar Acompanhando Sem Concluir Prematuramente" },
                { id: "incident", label: "Encerrar Imediatamente Sem Penalidade" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM5AnalystAction(opt.id as any)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                    m5AnalystAction === opt.id ? "bg-[#E10600] text-white font-bold" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {m5AnalystAction && (
              <div className="text-[10px] text-zinc-300 bg-white/5 p-2 rounded border border-white/10 leading-tight">
                {m5AnalystAction === "monitor" || m5AnalystAction === "investigate"
                  ? "Excelente! Um incidente nunca deve ser julgado por apenas um ângulo de câmera. Os comissários cruzam telemetria de freio, esterço e onboard antes de decidir."
                  : "Cuidado: Decidir sem avaliar telemetria ou se um piloto freou tarde demais é precipitado. É essencial analisar todos os ângulos."}
              </div>
            )}
          </div>
        )
      }

      // CENA 7: DESAFIO INTERATIVO: VOCÊ DECIDE A DISPUTA
      if (currentScene.visualEffectType === "mod5_overtaking_challenges") {
        const challenges = [
          {
            step: 1 as const,
            title: "Desafio 1 — Ataque na Reta",
            question: "Dois carros se aproximam da curva a 320 km/h. O que o piloto deve avaliar antes da manobra?",
            options: [
              { id: "correct", text: "Distância, velocidade relativa, frenagem, trajetória e espaço disponível.", correct: true },
              { id: "tires", text: "Apenas a cor dos pneus.", correct: false },
              { id: "pos", text: "Apenas a posição atual na classificação.", correct: false },
            ],
            fb: "Correto! A velocidade relativa e o posicionamento são fundamentais, mas a frenagem e o espaço disponível decidem o sucesso da manobra.",
          },
          {
            step: 2 as const,
            title: "Desafio 2 — Disputa por Dentro",
            question: "É possível afirmar automaticamente que o piloto por dentro sempre tem prioridade absoluta?",
            options: [
              { id: "yes", text: "Sim, quem está por dentro nunca precisa dar espaço.", correct: false },
              { id: "correct", text: "Não. É necessário analisar posicionamento, controle, trajetória e limites de pista.", correct: true },
              { id: "speed", text: "Sim, desde que esteja mais rápido.", correct: false },
            ],
            fb: "Exato! Ter a linha interna não dá passe livre para empurrar o concorrente para a brita. Ambos precisam de espaço de corrida.",
          },
          {
            step: 3 as const,
            title: "Desafio 3 — Disputa por Fora",
            question: "O piloto que tenta ultrapassar por fora perde automaticamente o direito ao espaço?",
            options: [
              { id: "yes", text: "Sim, quem está por fora assume todo o risco.", correct: false },
              { id: "correct", text: "Não. Se estiver emparelhado no apex com o carro sob controle, tem direito legítimo ao espaço.", correct: true },
              { id: "never", text: "Sim, porque ultrapassar por fora é proibido pela FIA.", correct: false },
            ],
            fb: "Perfeito! As diretrizes da FIA protegem o piloto por fora quando há sobreposição significativa de eixos no apex.",
          },
          {
            step: 4 as const,
            title: "Desafio 4 — Recursos de 2026",
            question: "O Overtake Mode garante uma ultrapassagem automática?",
            options: [
              { id: "yes", text: "Sim, o carro ultrapassa sem qualquer chance de defesa.", correct: false },
              { id: "correct", text: "Não. Ele fornece potência elétrica extra, mas a manobra depende da execução do piloto na frenagem.", correct: true },
              { id: "drs", text: "Sim, porque funciona exatamente igual ao antigo DRS.", correct: false },
            ],
            fb: "Isso mesmo! O Overtake Mode é uma ferramenta de apoio elétrico, mas não substitui a precisão cirúrgica na freada.",
          },
        ]

        const currentCh = challenges.find((c) => c.step === m5ChallengeStep) || challenges[0]
        const currentAns = m5ChallengeAnswers[m5ChallengeStep]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Simulação Didática</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">
                DESAFIO {m5ChallengeStep} DE 4
              </span>
            </div>

            <p className="text-[11px] font-bold text-white mb-2">{currentCh.question}</p>

            <div className="space-y-1 mb-2.5">
              {currentCh.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM5ChallengeAnswers((prev) => ({ ...prev, [m5ChallengeStep]: opt.id }))}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded text-[10px] font-mono transition-all cursor-pointer",
                    currentAns === opt.id
                      ? opt.correct
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-red-900/80 text-white"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            {currentAns && (
              <div className="text-[10px] text-zinc-300 bg-white/5 p-2 rounded border border-white/10 mb-2 leading-tight">
                {currentCh.fb}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              {m5ChallengeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setM5ChallengeStep((prev) => (prev - 1) as any)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-zinc-300 cursor-pointer"
                >
                  Anterior
                </button>
              )}
              {m5ChallengeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setM5ChallengeStep((prev) => (prev + 1) as any)}
                  disabled={!currentAns}
                  className="ml-auto px-3 py-1 rounded bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 text-xs font-black uppercase text-white cursor-pointer"
                >
                  Próximo Desafio ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setM5ShowSummaryReview(true)}
                  className="ml-auto px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase text-white cursor-pointer"
                >
                  Revisar o que Aprendi
                </button>
              )}
            </div>

            {m5ShowSummaryReview && (
              <div className="mt-2 p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-200 space-y-1">
                <span className="font-bold block text-cyan-300">Resumo da Análise Especializada:</span>
                <div>• Ultrapassar exige gestão de energia de 2026 e controle absoluto.</div>
                <div>• Nem a linha interna nem a externa dão direitos incondicionais.</div>
                <div>• Comissários julgam por telemetria, não por impressões isoladas.</div>
              </div>
            )}
          </div>
        )
      }

      // CENA 8: RESUMO: ENTENDA A DISPUTA ANTES DE JULGÁ-LA
      if (currentScene.visualEffectType === "mod5_overtaking_summary") {
        const principles = [
          "1. Uma ultrapassagem exige preparação, vácuo e controle.",
          "2. A defesa deve respeitar as regras e a segurança dos rivais.",
          "3. Os recursos de 2026 (Aero Ativa + Overtake) substituem o DRS.",
          "4. A posição relativa dos carros no apex decide o direito ao espaço.",
          "5. Incidentes devem ser avaliados com evidências e telemetria.",
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-84 max-w-[88vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Cinco Princípios Fundamentais</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-black">SÍNTESE</span>
            </div>

            <div className="space-y-1.5 mb-3">
              {principles.map((p, idx) => (
                <div key={idx} className="bg-white/5 py-1 px-2 rounded border border-white/10 text-[10px] text-zinc-200">
                  {p}
                </div>
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
              Iniciar Quiz (10 Perguntas)
            </button>
          </div>
        )
      }
    }





    // ------------------------------------------------------------------------
    // MÓDULO 6: A HISTÓRIA DA FÓRMULA 1 (75 ANOS DE EVOLUÇÃO)
    // ------------------------------------------------------------------------
    if (activeModuleId === 6) {
      // CENA 1: O NASCIMENTO DA FÓRMULA 1 (1950)
      if (currentScene.visualEffectType === "mod6_birth_of_f1") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Marco Inaugural</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">13 DE MAIO DE 1950</span>
            </div>

            <div className="p-2 rounded-lg bg-white/5 border border-white/10 mb-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                <span>Silverstone • GP da Grã-Bretanha</span>
                <span className="text-amber-400">21 Carros</span>
              </div>
              <p className="text-[10px] text-zinc-300 leading-snug">
                Vencedor: <strong className="text-white">Giuseppe Farina</strong> (Alfa Romeo 158 'Alfetta'). O italiano tornou-se o primeiro campeão mundial da história da F1.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setM6Timeline1950Open(!m6Timeline1950Open)}
              className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-zinc-200 transition-all cursor-pointer flex items-center justify-between mb-2"
            >
              <span>O que significa a palavra &quot;Fórmula&quot;?</span>
              <span className="text-[#E10600] font-black">{m6Timeline1950Open ? "▲" : "▼"}</span>
            </button>

            {m6Timeline1950Open && (
              <div className="p-2 rounded-lg bg-[#E10600]/10 border border-[#E10600]/30 text-[10px] text-zinc-300 leading-relaxed mb-2">
                Uma <strong>Fórmula</strong> é um conjunto unificado de regras técnicas (dimensões, motores) e desportivas (pontuação, largada) estabelecido pela FIA para padronizar e nivelar a disputa.
              </div>
            )}

            <div className="p-2 rounded-lg bg-zinc-900/90 border border-white/10">
              <p className="text-[10px] font-bold text-zinc-300 mb-1">Pergunta de Reflexão:</p>
              <p className="text-[10px] text-zinc-400 italic mb-2">
                &quot;O que faz uma competição continuar reconhecível mesmo quando seus carros e regras mudam tanto?&quot;
              </p>
              <button
                type="button"
                onClick={() => setM6ReflectionAnswered(!m6ReflectionAnswered)}
                className="w-full py-1 px-2 rounded bg-[#E10600]/20 hover:bg-[#E10600]/30 text-[#E10600] text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                {m6ReflectionAnswered ? "Ocultar Reflexão" : "Ver Reflexão Pedagógica"}
              </button>
              {m6ReflectionAnswered && (
                <p className="mt-2 text-[9px] text-zinc-300 leading-relaxed border-t border-white/10 pt-1.5">
                  A essência que transcende os 75 anos é o <strong>espírito humano de superação</strong>: pilotos desafiando os limites físicos em máquinas no estado da arte da engenharia.
                </p>
              )}
            </div>
          </div>
        )
      }

      // CENA 2: A REVOLUÇÃO DOS CARROS (LINHA DO TEMPO EM DÉCADAS)
      if (currentScene.visualEffectType === "mod6_cars_evolution") {
        const decades = [
          {
            id: "50s" as const,
            label: "1950s",
            name: "Motor Dianteiro",
            tech: "Chassis tubular e motor à frente do piloto",
            desc: "Carros estreitos, mecânica clássica, ausência de asas e freios a tambor. Velocidade vinha da pura potência bruta.",
          },
          {
            id: "60s" as const,
            label: "1960s",
            name: "Motor Traseiro",
            tech: "Revolução da Cooper e Lotus (monocoque)",
            desc: "O motor passou para trás do piloto, rebaixando o centro de gravidade e multiplicando a agilidade nas curvas.",
          },
          {
            id: "70s_80s" as const,
            label: "70s/80s",
            name: "Asas & Turbo",
            tech: "Efeito solo e motores turbo (+1000 cv)",
            desc: "Colin Chapman introduziu o efeito solo com assoalhos em asa invertida. A era turbo explodiu com potências insanas.",
          },
          {
            id: "90s_00s" as const,
            label: "90s/00s",
            name: "Eletrônica & V10",
            tech: "Fibra de carbono, telemetria e motores V10",
            desc: "Suspensão ativa, câmbio semi-automático e motores V10 a 20.000 rpm. A F1 tornou-se ultratecnológica.",
          },
          {
            id: "10s" as const,
            label: "2010s",
            name: "Era Híbrida",
            tech: "V6 turbo 1.6L com MGU-K e MGU-H",
            desc: "Em 2014, a introdução das unidades híbridas elevou a eficiência térmica para mais de 50%. Em 2018, veio o Halo.",
          },
          {
            id: "20s" as const,
            label: "2020s",
            name: "Efeito Solo",
            tech: "Túneis Venturi e rodas aro 18 polegadas",
            desc: "Revolução de 2022 para permitir perseguições coladas sem perda excessiva de downforce pelo ar turbulento.",
          },
          {
            id: "2026" as const,
            label: "2026",
            name: "Aero Ativa",
            tech: "Corner/Straight Mode e 50% Elétrico",
            desc: "Asas móveis na dianteira e traseira substituem o DRS. Combustíveis 100% sustentáveis e motor elétrico de 350 kW.",
          },
        ]

        const activeDecade = decades.find((d) => d.id === m6SelectedDecade) || decades[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Evolução Técnica</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">75 ANOS DE MÁQUINAS</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-2 font-bold">
              Selecione uma era para ver a transformação:
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 mb-3">
              {decades.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setM6SelectedDecade(d.id)}
                  className={cn(
                    "py-1 px-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer text-center",
                    m6SelectedDecade === d.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-white">{activeDecade.name}</span>
                <span className="text-[9px] font-mono text-[#E10600] font-bold">{activeDecade.tech}</span>
              </div>
              <p className="text-[10px] text-zinc-300 leading-relaxed mb-2">
                {activeDecade.desc}
              </p>
              <div className="p-1.5 rounded bg-black/50 text-[9px] text-zinc-400 border border-white/5">
                💡 <em>Uma inovação regulamentar pode zerar vantagens e consagrar uma nova equipe campeã.</em>
              </div>
            </div>
          </div>
        )
      }

      // CENA 3: OS PILOTOS QUE MARCARAM ÉPOCA
      if (currentScene.visualEffectType === "mod6_legendary_drivers") {
        const drivers = [
          {
            id: "fangio" as const,
            name: "Juan Manuel Fangio",
            period: "1950 – 1958",
            teams: "Alfa Romeo, Maserati, Mercedes, Ferrari",
            titles: 5,
            wins: "24 vitórias (47% de aproveitamento)",
            trait: "Precisão mecânica e respeito entre rivais",
            fact: "Conquistou 5 títulos mundiais por 4 construtores diferentes, recorde que permanece até hoje.",
          },
          {
            id: "clark" as const,
            name: "Jim Clark",
            period: "1960 – 1968",
            teams: "Lotus",
            titles: 2,
            wins: "25 vitórias",
            trait: "Suavidade incomparável na pilotagem",
            fact: "Detém o recorde de 8 Grand Chelems (pole, vitória de ponta a ponta e volta mais rápida).",
          },
          {
            id: "stewart" as const,
            name: "Jackie Stewart",
            period: "1965 – 1973",
            teams: "BRM, Matra, Tyrrell",
            titles: 3,
            wins: "27 vitórias",
            trait: "Visão pioneira de sobrevivência e segurança",
            fact: "Liderou a revolução por barreiras de proteção, macacões antichama e hospitais móveis nos autódromos.",
          },
          {
            id: "lauda" as const,
            name: "Niki Lauda",
            period: "1971 – 1985",
            teams: "March, BRM, Ferrari, Brabham, McLaren",
            titles: 3,
            wins: "25 vitórias",
            trait: "Determinação sobre-humana e raciocínio técnico",
            fact: "Retornou às pistas apenas 42 dias após sofrer queimaduras graves em Nürburgring 1976.",
          },
          {
            id: "prost" as const,
            name: "Alain Prost",
            period: "1980 – 1993",
            teams: "Renault, McLaren, Ferrari, Williams",
            titles: 4,
            wins: "51 vitórias",
            trait: "O Professor: cálculo tático e economia mecânica",
            fact: "Venceu corridas administrando freios e combustível com precisão cirúrgica antes da era dos computadores modernos.",
          },
          {
            id: "senna" as const,
            name: "Ayrton Senna",
            period: "1984 – 1994",
            teams: "Toleman, Lotus, McLaren, Williams",
            titles: 3,
            wins: "41 vitórias, 65 poles",
            trait: "Velocidade visceral em qualificação e maestria na chuva",
            fact: "Dominou 6 vitórias históricas no estreito circuito de rua de Mônaco, 5 delas consecutivas.",
          },
          {
            id: "schumacher" as const,
            name: "Michael Schumacher",
            period: "1991 – 2012",
            teams: "Jordan, Benetton, Ferrari, Mercedes",
            titles: 7,
            wins: "91 vitórias, 68 poles",
            trait: "Condicionamento físico implacável e liderança técnica",
            fact: "Conquistou 5 títulos mundiais consecutivos pela Scuderia Ferrari (2000 a 2004).",
          },
          {
            id: "hamilton" as const,
            name: "Lewis Hamilton",
            period: "2007 – presente",
            teams: "McLaren, Mercedes",
            titles: 7,
            wins: "105+ vitórias, 104+ poles",
            trait: "Consistência extraordinária e combate roda a roda limpo",
            fact: "Maior vencedor da história da F1 em número absoluto de vitórias e pole positions.",
          },
        ]

        const currentDriver = drivers.find((d) => d.id === m6SelectedDriver) || drivers[5]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Galeria de Lendas</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">CAMPEÕES MARCANTES</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Clique em um piloto para ver sua ficha histórica:
            </p>

            <div className="grid grid-cols-4 gap-1 mb-2.5">
              {drivers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setM6SelectedDriver(d.id)}
                  className={cn(
                    "py-1 px-1 rounded text-[9px] font-bold truncate transition-all cursor-pointer text-center",
                    m6SelectedDriver === d.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {d.name.split(" ").pop()}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-white">{currentDriver.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#E10600] text-white font-black text-[9px]">
                  {currentDriver.titles} {currentDriver.titles === 1 ? "TÍTULO" : "TÍTULOS"}
                </span>
              </div>
              <p className="text-zinc-400 font-mono text-[9px] mb-1">
                {currentDriver.period} • {currentDriver.teams}
              </p>
              <p className="text-zinc-300 font-bold mb-1">
                📊 {currentDriver.wins}
              </p>
              <p className="text-zinc-300 leading-snug mb-1.5">
                <strong>Estilo:</strong> {currentDriver.trait}
              </p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-300">
                ⭐ <strong>Fato Histórico:</strong> {currentDriver.fact}
              </div>
            </div>

            <p className="text-[9px] text-zinc-500 mt-2 italic text-center">
              * Comparar pilotos exige contexto: carros, calendários e confiabilidade variaram enormemente.
            </p>
          </div>
        )
      }

      // CENA 4: RIVALIDADES QUE DEFINIRAM GERAÇÕES
      if (currentScene.visualEffectType === "mod6_rivalries") {
        const rivalries = [
          {
            id: "hunt_lauda" as const,
            title: "Hunt vs Lauda (1976)",
            context: "Carisma impulsivo contra disciplina calculada",
            desc: "A temporada de 1976 levou o automobilismo às manchetes globais. Após o grave acidente de Lauda em Nürburgring e seu retorno heroico 42 dias depois, o campeonato foi decidido sob chuva torrencial em Fuji.",
            dynamic: "Respeito mútuo entre dois estilos de vida e pilotagem opostos.",
          },
          {
            id: "senna_prost" as const,
            title: "Senna vs Prost (1988–1993)",
            context: "A rivalidade mais icônica da história da F1",
            desc: "Companheiros na McLaren com carros dominantes (MP4/4 venceu 15 de 16 GPs em 1988). A busca por cada milímetro gerou colisões célebres no GP do Japão em 1989 e 1990 que definiram títulos mundiais.",
            dynamic: "Intensidade visceral e velocidade pura contra cálculo estratégico e consistência.",
          },
          {
            id: "schumi_rivals" as const,
            title: "Schumacher vs Grandes Rivais (1994–2006)",
            context: "Batalhas com Hill, Villeneuve e Häkkinen",
            desc: "Michael Schumacher enfrentou Damon Hill e Jacques Villeneuve nos anos 90, e travou duelos memoráveis de cavalheirismo e precisão milimétrica contra Mika Häkkinen entre 1998 e 2000.",
            dynamic: "Consistência de ferro e liderança da reconstrução histórica da Ferrari.",
          },
          {
            id: "hamilton_rivals" as const,
            title: "Hamilton vs Rosberg & Verstappen (2014–2021)",
            context: "A era de ouro da rivalidade moderna",
            desc: "Hamilton e Rosberg travaram uma guerra psicológica interna na Mercedes até 2016. Em 2021, Hamilton e Max Verstappen disputaram o título mais tenso e equilibrado do século 21 até a volta final em Abu Dhabi.",
            dynamic: "Equipes no ápice da engenharia com margens de vitória de centésimos de segundo.",
          },
        ]

        const activeRivalry = rivalries.find((r) => r.id === m6SelectedRivalry) || rivalries[1]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Duelos Históricos</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">RIVALIDADES</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-2 font-bold">
              Selecione um embate que marcou época:
            </p>

            <div className="space-y-1 mb-2.5">
              {rivalries.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setM6SelectedRivalry(r.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between",
                    m6SelectedRivalry === r.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span>{r.title}</span>
                  <span className="text-[9px] opacity-70">➔</span>
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <p className="text-white font-black mb-1">{activeRivalry.title}</p>
              <p className="text-[#E10600] font-mono text-[9px] mb-1.5">{activeRivalry.context}</p>
              <p className="text-zinc-300 leading-relaxed mb-2">{activeRivalry.desc}</p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-400">
                🔍 <strong>Fato vs Mídia:</strong> {activeRivalry.dynamic}
              </div>
            </div>
          </div>
        )
      }

      // CENA 5: A SEGURANÇA: LIÇÕES VITAIS
      if (currentScene.visualEffectType === "mod6_safety_evolution") {
        const safetyElements = [
          {
            id: "capacete" as const,
            title: "Capacete Balístico",
            desc: "Evoluiu de toucas de couro e tecido para cascos de fibra de carbono e zylon capazes de repelir projéteis a 250 km/h.",
          },
          {
            id: "monocoque" as const,
            title: "Célula de Sobrevivência",
            desc: "Introduzida pela McLaren em 1981 em fibra de carbono. Uma concha ultrarresistente projetada para manter o cockpit intacto.",
          },
          {
            id: "cintos" as const,
            title: "Cinto de 6 Pontos",
            desc: "Mantém o piloto completamente integrado à estrutura do carro, com sistema de destravamento em menos de 1 segundo.",
          },
          {
            id: "hans" as const,
            title: "Dispositivo HANS (2003)",
            desc: "Fixado aos ombros e conectado ao capacete, impede a flexão violenta da cabeça e previne fraturas na base do crânio.",
          },
          {
            id: "halo" as const,
            title: "Halo de Titânio (2018)",
            desc: "Estrutura curva de 7 kg que suporta 12 toneladas (o peso de dois ônibus londrinos) contra detritos e capotamentos.",
          },
        ]

        const activeItem = safetyElements.find((e) => e.id === m6SelectedSafetyPoint) || safetyElements[4]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Proteção de Vidas</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">SEGURANÇA CONTÍNUA</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Clique nos dispositivos de sobrevivência:
            </p>

            <div className="flex flex-wrap gap-1 mb-2.5">
              {safetyElements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setM6SelectedSafetyPoint(item.id)}
                  className={cn(
                    "py-1 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                    m6SelectedSafetyPoint === item.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 mb-2">
              <span className="text-xs font-black text-white block mb-1">{activeItem.title}</span>
              <p className="text-[10px] text-zinc-300 leading-relaxed">{activeItem.desc}</p>
            </div>

            <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[9px] text-zinc-300">
              <strong className="text-white">O Marco de Imola 1994:</strong> As perdas de Roland Ratzenberger e Ayrton Senna catalisaram reformas médicas lideradas pelo Prof. Sid Watkins e novos testes de impacto que salvaram dezenas de vidas nos anos seguintes.
            </div>
          </div>
        )
      }

      // CENA 6: AYRTON SENNA E O LEGADO BRASILEIRO
      if (currentScene.visualEffectType === "mod6_senna_brazil_legacy") {
        const milestones = [
          {
            step: 1,
            year: "1984",
            team: "Toleman",
            desc: "Estreia impressionante e o lendário 2º lugar no GP de Mônaco debaixo de chuva torrencial.",
          },
          {
            step: 2,
            year: "1985–87",
            team: "Lotus",
            desc: "Primeira vitória em Estoril na chuva e consagração definitiva como o 'Rei das Pole Positions'.",
          },
          {
            step: 3,
            year: "1988",
            team: "McLaren",
            desc: "Primeiro campeonato mundial com 8 vitórias históricas e a épica recuperação em Suzuka.",
          },
          {
            step: 4,
            year: "1990–91",
            team: "McLaren",
            desc: "Bicampeão e tricampeão mundial; a inesquecível vitória em Interlagos 1991 travado em 6ª marcha.",
          },
          {
            step: 5,
            year: "1994",
            team: "Williams",
            desc: "Início de temporada em Imola e a despedida precoce que comoveu o planeta e transformou o automobilismo.",
          },
          {
            step: 6,
            year: "Legado",
            team: "Instituto Ayrton Senna",
            desc: "Mais de 35 milhões de estudantes brasileiros beneficiados em programas de educação pública de qualidade.",
          },
        ]

        const activeMilestone = milestones.find((m) => m.step === m6SelectedSennaMilestone) || milestones[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Trajetória e Memória</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">LEGADO BRASILEIRO</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Marcos da carreira de Ayrton Senna:
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {milestones.map((m) => (
                <button
                  key={m.step}
                  type="button"
                  onClick={() => setM6SelectedSennaMilestone(m.step)}
                  className={cn(
                    "py-1 px-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center truncate",
                    m6SelectedSennaMilestone === m.step ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {m.year}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-white">{activeMilestone.year}</span>
                <span className="text-[#E10600] font-mono text-[9px]">{activeMilestone.team}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{activeMilestone.desc}</p>
            </div>

            {/* Linhagem de Ouro Brasileira */}
            <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[9px]">
              <span className="text-zinc-400 block font-bold mb-1">Outros Pilotos Brasileiros Históricos (clique para ver):</span>
              <div className="grid grid-cols-4 gap-1 text-zinc-300 mb-1.5">
                <button
                  type="button"
                  onClick={() => setM6BrazilianDriverDetail(m6BrazilianDriverDetail === "fittipaldi" ? null : "fittipaldi")}
                  className={cn("py-0.5 px-1 rounded truncate cursor-pointer transition-all", m6BrazilianDriverDetail === "fittipaldi" ? "bg-[#E10600] text-white" : "bg-white/5 hover:bg-white/10")}
                >
                  Fittipaldi (2x 🏆)
                </button>
                <button
                  type="button"
                  onClick={() => setM6BrazilianDriverDetail(m6BrazilianDriverDetail === "piquet" ? null : "piquet")}
                  className={cn("py-0.5 px-1 rounded truncate cursor-pointer transition-all", m6BrazilianDriverDetail === "piquet" ? "bg-[#E10600] text-white" : "bg-white/5 hover:bg-white/10")}
                >
                  Piquet (3x 🏆)
                </button>
                <button
                  type="button"
                  onClick={() => setM6BrazilianDriverDetail(m6BrazilianDriverDetail === "barrichello" ? null : "barrichello")}
                  className={cn("py-0.5 px-1 rounded truncate cursor-pointer transition-all", m6BrazilianDriverDetail === "barrichello" ? "bg-[#E10600] text-white" : "bg-white/5 hover:bg-white/10")}
                >
                  Barrichello
                </button>
                <button
                  type="button"
                  onClick={() => setM6BrazilianDriverDetail(m6BrazilianDriverDetail === "massa" ? null : "massa")}
                  className={cn("py-0.5 px-1 rounded truncate cursor-pointer transition-all", m6BrazilianDriverDetail === "massa" ? "bg-[#E10600] text-white" : "bg-white/5 hover:bg-white/10")}
                >
                  Massa
                </button>
              </div>

              {m6BrazilianDriverDetail === "fittipaldi" && (
                <p className="text-zinc-300 border-t border-white/10 pt-1">
                  <strong>Emerson Fittipaldi:</strong> Campeão em 1972 (Lotus) e 1974 (McLaren), 14 vitórias e pioneiro que abriu as portas da F1 para o Brasil.
                </p>
              )}
              {m6BrazilianDriverDetail === "piquet" && (
                <p className="text-zinc-300 border-t border-white/10 pt-1">
                  <strong>Nelson Piquet:</strong> Tricampeão mundial (1981, 1983 pela Brabham e 1987 pela Williams), 23 vitórias e mestre do desenvolvimento técnico.
                </p>
              )}
              {m6BrazilianDriverDetail === "barrichello" && (
                <p className="text-zinc-300 border-t border-white/10 pt-1">
                  <strong>Rubens Barrichello:</strong> 11 vitórias na F1, 68 pódios, vice-campeão em 2002 e 2004 e um dos pilotos com maior longevidade da história (322 largadas).
                </p>
              )}
              {m6BrazilianDriverDetail === "massa" && (
                <p className="text-zinc-300 border-t border-white/10 pt-1">
                  <strong>Felipe Massa:</strong> 11 vitórias pela Ferrari, 41 pódios, vice-campeão mundial em 2008 e símbolo de resiliência e velocidade.
                </p>
              )}
            </div>
          </div>
        )
      }

      // CENA 7: A F1 MODERNA E A REVOLUÇÃO DE 2026
      if (currentScene.visualEffectType === "mod6_modern_f1_2026") {
        const comparisons = [
          {
            era: "1950" as const,
            title: "1950 • Origem Mecânica",
            power: "~350 cv • Motor Dianteiro puro a combustão",
            aero: "Sem asas aerodinâmicas • Arrasto elevado",
            energy: "Combustível convencional com chumbo",
            overtake: "Puro vácuo mecânico e frenagem direta",
          },
          {
            era: "2014" as const,
            title: "2014 • Era Híbrida Turbo",
            power: "~1000 cv • V6 turbo 1.6L + MGU-K + MGU-H",
            aero: "Asas fixas + abertura móvel do flap DRS",
            energy: "Gasolina E10 comercial com eficiência de 50%",
            overtake: "Zona de DRS a menos de 1s do rival",
          },
          {
            era: "2026" as const,
            title: "2026 • Nova Geração Ativa",
            power: "~1000 cv • Divisão 50% térmica e 50% elétrica (350 kW)",
            aero: "Aerodinâmica Ativa: Corner Mode e Straight Mode",
            energy: "Combustíveis avançados 100% sustentáveis",
            overtake: "Overtake Mode elétrico + Boost direto",
          },
        ]

        const activeCompare = comparisons.find((c) => c.era === m6SelectedEraCompare) || comparisons[2]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Salto Tecnológico</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">COMPARAÇÃO DE ERAS</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Selecione uma era para comparar os pilares técnicos:
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {comparisons.map((c) => (
                <button
                  key={c.era}
                  type="button"
                  onClick={() => setM6SelectedEraCompare(c.era)}
                  className={cn(
                    "py-1.5 px-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer text-center",
                    m6SelectedEraCompare === c.era ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {c.era}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] space-y-1.5 mb-2">
              <span className="font-black text-white text-xs block mb-1">{activeCompare.title}</span>
              <div>
                <span className="text-zinc-400 block text-[9px] font-mono uppercase">⚡ Potência:</span>
                <span className="text-zinc-200">{activeCompare.power}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] font-mono uppercase">🏎️ Aerodinâmica:</span>
                <span className="text-zinc-200">{activeCompare.aero}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] font-mono uppercase">🌱 Combustível:</span>
                <span className="text-zinc-200">{activeCompare.energy}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] font-mono uppercase">🏁 Ultrapassagem:</span>
                <span className="text-zinc-200">{activeCompare.overtake}</span>
              </div>
            </div>
          </div>
        )
      }

      // CENA 8: O QUE A HISTÓRIA NOS ENSINA (SÍNTESE E TRANSIÇÃO PARA QUIZ)
      if (currentScene.visualEffectType === "mod6_history_summary") {
        const favoriteOptions = [
          { id: "50s", label: "Anos 50 (Pioneiros)" },
          { id: "70s", label: "Anos 70/80 (Asas & Turbo)" },
          { id: "senna_prost", label: "Era Senna vs Prost" },
          { id: "v10", label: "Anos 2000 (Motores V10)" },
          { id: "2026", label: "Nova Era de 2026" },
        ]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Síntese dos 75 Anos</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">CONCLUSÃO</span>
            </div>

            <div className="space-y-1 mb-2.5 text-[10px] text-zinc-300">
              <div className="flex items-center gap-1.5 p-1 rounded bg-white/5">
                <span className="text-amber-400 font-bold">1.</span>
                <span>Regulamentos técnicos moldam as dinastias e o equilíbrio.</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-white/5">
                <span className="text-amber-400 font-bold">2.</span>
                <span>Grandes pilotos devem ser avaliados no contexto de sua época.</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-white/5">
                <span className="text-amber-400 font-bold">3.</span>
                <span>A segurança evolui pelo aprendizado contínuo para salvar vidas.</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-300 font-bold mb-1.5">
              Se você pudesse visitar uma era da F1, qual escolheria?
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {favoriteOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM6FavoriteEra(opt.id)}
                  className={cn(
                    "py-1 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                    m6FavoriteEra === opt.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {m6FavoriteEra && (
              <p className="text-[9px] text-emerald-400 mb-2.5 leading-snug">
                Excelente escolha! Cada período tem histórias incríveis de coragem e engenharia que tornam a F1 um patrimônio esportivo imortal.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                stopAllAudio()
                setViewStage("quiz")
              }}
              className="w-full py-2 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.6)] transition-all cursor-pointer text-center"
            >
              Iniciar Questionário (10 Perguntas)
            </button>
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 7: POR TRÁS DA EQUIPE: ENGENHEIROS, ESTRATÉGIA E DADOS
    // ------------------------------------------------------------------------
    if (activeModuleId === 7) {
      // CENA 1: UMA EQUIPE É MUITO MAIS DO QUE UM CARRO
      if (currentScene.visualEffectType === "mod7_team_roles") {
        const roles = [
          {
            id: "tp" as const,
            title: "Team Principal",
            loc: "Paddock / Pit Wall",
            desc: "Líder supremo e porta-voz da equipe. Define o orçamento, contrata pilotos, gerencia conflitos e responde diretamente aos acionistas e à FIA.",
          },
          {
            id: "race_eng" as const,
            title: "Engenheiro de Corrida",
            loc: "Pit Wall / Rádio",
            desc: "A voz exclusiva do piloto no rádio. Traduz telemetria em orientações precisas sobre ritmo, botões do volante e mudanças de estratégia.",
          },
          {
            id: "perf_eng" as const,
            title: "Engenheiro de Desempenho",
            loc: "Garagem / Boxes",
            desc: "Mergulha nos dados de suspensão, cambagem, pressão de freios e pneus para encontrar décimos de segundo no acerto do monoposto.",
          },
          {
            id: "strategist" as const,
            title: "Estrategistas de Prova",
            loc: "Pit Wall / Mission Control",
            desc: "Calculam probabilidades matemáticas em supercomputadores: janelas de pit stop, ritmo relativo, tempo perdido em tráfego e janelas de Safety Car.",
          },
          {
            id: "mechanic" as const,
            title: "Mecânicos e Pit Crew",
            loc: "Boxes / Pit Lane",
            desc: "Atletas da precisão mecânica: executam a troca de pneus em 2 segundos e montam o carro peça por peça entre as sessões.",
          },
          {
            id: "aero" as const,
            title: "Departamento Aerodinâmico",
            loc: "Fábrica / Túnel de Vento",
            desc: "Centenas de engenheiros que projetam asas, difusores e assoalhos em CFD (dinâmica dos fluidos) para maximizar o downforce.",
          },
          {
            id: "data" as const,
            title: "Analistas e Mission Control",
            loc: "Sala de Operações Remota",
            desc: "Operam na sede da equipe a milhares de quilômetros da pista, processando gigabytes de telemetria ao vivo durante o GP.",
          },
        ]

        const activeRole = roles.find((r) => r.id === m7SelectedRole) || roles[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Organograma da Escuderia</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">BASTIDORES</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Selecione uma função para ver o que ela faz:
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setM7SelectedRole(r.id)}
                  className={cn(
                    "py-1 px-1 rounded text-[9px] font-bold truncate transition-all cursor-pointer text-center",
                    m7SelectedRole === r.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {r.title}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-white">{activeRole.title}</span>
                <span className="text-[9px] font-mono text-cyan-400 font-bold">{activeRole.loc}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-2">{activeRole.desc}</p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-400">
                ⭐ <em>Mais de 80% da equipe trabalha longe dos holofotes, nas fábricas e centros de dados.</em>
              </div>
            </div>
          </div>
        )
      }

      // CENA 2: O ENGENHEIRO DE CORRIDA E A COMUNICAÇÃO
      if (currentScene.visualEffectType === "mod7_radio_communication") {
        const radioMessages = [
          {
            id: 1 as const,
            raw: "“Box, box, box! Confirme delta de entrada positivo.”",
            context: "Chamada Imediata para Parada nos Boxes",
            meaning: "A equipe convoca o piloto para o pit stop. Ele deve confirmar e respeitar a velocidade limite no pit lane sem tomar punição.",
            why: "A comunicação rápida impede que o piloto passe da entrada dos boxes sem trocar os pneus desgastados.",
          },
          {
            id: 2 as const,
            raw: "“Estamos vendo subesterço na curva 4. Sugerimos flap dianteiro +2 cliques na parada.”",
            context: "Correção de Equilíbrio Aerodinâmico",
            meaning: "O piloto sentiu o carro espalhar de frente. A telemetria confirmou a perda de rotação dianteira e a equipe já programou o ajuste dos mecânicos na asa.",
            why: "Ajustar o ângulo da asa dianteira aumenta a aderência da frente e devolve o equilíbrio nas curvas rápidas.",
          },
          {
            id: 3 as const,
            raw: "“Modo de motor Strat 2 disponível por 2 voltas para tentar o undercut.”",
            context: "Liberação de Potência Máxima",
            meaning: "Autorização para utilizar o mapa de motor mais agressivo e consumir a reserva de energia elétrica da bateria para fazer a volta de classificação na corrida.",
            why: "Garante a velocidade necessária para superar o rival direto no momento em que ele fizer sua parada.",
          },
        ]

        const activeMsg = radioMessages.find((m) => m.id === m7SelectedRadioSim) || radioMessages[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Comunicação no Cockpit</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">RÁDIO AO VIVO</span>
            </div>

            <div className="p-1 rounded bg-[#E10600]/10 border border-[#E10600]/30 text-[9px] font-mono text-center text-[#E10600] font-bold uppercase mb-2">
              SIMULAÇÃO DIDÁTICA — MENSAGENS CODIFICADAS
            </div>

            <div className="space-y-1 mb-2.5">
              {radioMessages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setM7SelectedRadioSim(m.id)}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between",
                    m7SelectedRadioSim === m.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span className="truncate">{m.context}</span>
                  <span className="text-[9px] opacity-70">➔</span>
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <p className="text-amber-400 font-mono italic mb-1.5 text-xs">{activeMsg.raw}</p>
              <p className="text-zinc-200 mb-1 leading-snug">
                <strong>O que significa:</strong> {activeMsg.meaning}
              </p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-400 mt-1.5">
                💡 <strong>Por que importa:</strong> {activeMsg.why}
              </div>
            </div>
          </div>
        )
      }

      // CENA 3: O PIT WALL: O CENTRO DE DECISÕES
      if (currentScene.visualEffectType === "mod7_pitwall_command") {
        const metrics = [
          {
            id: "gap" as const,
            label: "Intervalos (Gaps)",
            val: "+2.4s Frente / +1.2s Trás",
            desc: "Permite calcular se a janela para o undercut está aberta ou se o piloto corre risco de ser atacado com DRS.",
          },
          {
            id: "tire" as const,
            label: "Vida dos Pneus",
            val: "Médio C3 (24 voltas)",
            desc: "Monitora a perda de tempo por volta em relação ao pneu novo. Quando a perda passa de 0.8s, a parada se torna urgente.",
          },
          {
            id: "traffic" as const,
            label: "Janela de Tráfego",
            val: "Pista Livre após Parada (P7)",
            desc: "Avalia onde o carro retornará caso pare imediatamente. Parar e voltar preso atrás de carros mais lentos arruína o ritmo.",
          },
          {
            id: "weather" as const,
            label: "Radar Meteorológico",
            val: "Chuva Leve em 8 min",
            desc: "Determina se vale a pena estender o pneu slick para trocar diretamente pelo intermediário quando a chuva cair.",
          },
        ]

        const activeMetric = metrics.find((m) => m.id === m7SelectedPitWallMetric) || metrics[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Painel do Pit Wall</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">MONITOR AO VIVO</span>
            </div>

            <div className="p-1.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-zinc-400 text-center uppercase mb-2">
              EXEMPLO ILUSTRATIVO — CORRIDA FICTÍCIA
            </div>

            {/* Status Bar Fictícia do Carro */}
            <div className="grid grid-cols-3 gap-1 p-2 rounded-lg bg-zinc-900 border border-white/10 text-center mb-2.5 text-[9px] font-mono">
              <div>
                <span className="text-zinc-500 block">POSIÇÃO</span>
                <span className="text-white font-black text-sm">P3</span>
              </div>
              <div>
                <span className="text-zinc-500 block">PNEU</span>
                <span className="text-amber-400 font-black text-sm">MÉDIO</span>
              </div>
              <div>
                <span className="text-zinc-500 block">VOLTAS</span>
                <span className="text-cyan-400 font-black text-sm">18 REST.</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Clique em um indicador para ver a decisão estratégica:
            </p>

            <div className="grid grid-cols-2 gap-1 mb-2.5">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setM7SelectedPitWallMetric(m.id)}
                  className={cn(
                    "py-1 px-1.5 rounded text-[9px] font-bold truncate transition-all cursor-pointer text-center",
                    m7SelectedPitWallMetric === m.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-white">{activeMetric.label}</span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">{activeMetric.val}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{activeMetric.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 4: MECÂNICOS E PIT STOPS
      if (currentScene.visualEffectType === "mod7_pitstop_anatomy") {
        const steps = [
          {
            id: 1 as const,
            title: "1. Entrada no Pit Lane",
            time: "0.0s",
            desc: "O piloto aciona o limitador de velocidade de 80 km/h e alinha o carro na faixa de rolagem dos boxes.",
          },
          {
            id: 2 as const,
            title: "2. Parada na Marca Exata",
            time: "0.0s - 0.2s",
            desc: "O carro para exatamente sobre as marcas pintadas no chão. Os macacos dianteiro e traseiro levantam o carro instantaneamente.",
          },
          {
            id: 3 as const,
            title: "3. Troca dos 4 Pneus",
            time: "0.2s - 1.8s",
            desc: "Três mecânicos por roda: um opera a pistola pneumática, um retira a roda gasta e o terceiro encaixa o composto novo.",
          },
          {
            id: 4 as const,
            title: "4. Validação de Torque",
            time: "1.8s - 2.1s",
            desc: "Sensores nas pistolas enviam sinal eletrônico confirmando que as quatro porcas centrais estão travadas com torque seguro.",
          },
          {
            id: 5 as const,
            title: "5. Liberação com Luz Verde",
            time: "2.2s",
            desc: "O sistema baixa os macacos e acende o farol verde sobre o cockpit. O piloto arranca com liberação segura para a pista.",
          },
        ]

        const activeStep = steps.find((s) => s.id === m7PitStopStep) || steps[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Anatomia do Pit Stop</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">2.2 SEGUNDOS</span>
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Explore o passo a passo da coreografia nos boxes:
            </p>

            <div className="grid grid-cols-5 gap-1 mb-2.5">
              {steps.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setM7PitStopStep(s.id)}
                  className={cn(
                    "py-1.5 px-1 rounded text-[9px] font-mono font-bold transition-all cursor-pointer text-center",
                    m7PitStopStep === s.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  Passo {s.id}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-white">{activeStep.title}</span>
                <span className="text-[9px] font-mono text-[#E10600] font-bold">{activeStep.time}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-2">{activeStep.desc}</p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-400">
                ⚠️ <em>A segurança é prioritária: uma porca mal encaixada pode causar abandono ou penalidade severa.</em>
              </div>
            </div>
          </div>
        )
      }

      // CENA 5: TELEMETRIA E DADOS
      if (currentScene.visualEffectType === "mod7_telemetry_analysis") {
        const points = [
          {
            id: 1 as const,
            title: "1. Ponto de Frenagem (Fim de Reta)",
            valA: "Freio aos 115m (105 bar de pressão)",
            valB: "Freio antecipado aos 132m (85 bar)",
            diff: "Ganho de +0.18s na Volta A",
            desc: "A telemetria mostra que na Volta A o piloto teve mais confiança, freou mais tarde e aplicou pressão máxima no pedal sem travar rodas.",
          },
          {
            id: 2 as const,
            title: "2. Velocidade Mínima no Ápice (Apex)",
            valA: "142 km/h contínuos",
            valB: "135 km/h com correção de volante",
            diff: "Ganho de +0.12s na Volta A",
            desc: "Na Volta A o equilíbrio aerodinâmico permitiu carregar 7 km/h a mais no meio da curva sem sofrer com saída de frente.",
          },
          {
            id: 3 as const,
            title: "3. Retomada de Aceleração (Saída)",
            valA: "100% acelerador 0.25s antes",
            valB: "Hesitação com patinagem de traseira",
            diff: "Ganho de +0.15s na reta seguinte",
            desc: "Tracionar mais cedo transfere velocidade para toda a reta. Décimos ganhos no ápice multiplicam-se na velocidade final.",
          },
        ]

        const activePt = points.find((p) => p.id === m7TelemetryPoint) || points[0]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Telemetria Comparativa</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">300+ SENSORES</span>
            </div>

            <div className="p-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-center text-zinc-400 uppercase mb-2">
              DADOS FICTÍCIOS PARA APRENDIZAGEM
            </div>

            {/* Comparação Gráfica Didática */}
            <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[9px] font-mono mb-2">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-amber-400 font-bold">● Volta A (Rápida): 1:18.240</span>
                <span className="text-cyan-400 font-bold">● Volta B: 1:18.690</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-amber-400 h-full w-[65%]" />
                <div className="bg-cyan-400 h-full w-[35%]" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 mb-2">
              {points.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setM7TelemetryPoint(p.id)}
                  className={cn(
                    "py-1 px-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center truncate",
                    m7TelemetryPoint === p.id ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  Ponto {p.id}
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
              <span className="text-xs font-black text-white block mb-1">{activePt.title}</span>
              <p className="text-zinc-300 leading-relaxed mb-2">{activePt.desc}</p>
              <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-emerald-400 font-mono">
                ✓ {activePt.diff}
              </div>
            </div>
          </div>
        )
      }

      // CENA 6: DOIS PILOTOS, UMA EQUIPE
      if (currentScene.visualEffectType === "mod7_two_drivers_one_team") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Dilema de Companheiros</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">ESTRATÉGIA</span>
            </div>

            <div className="p-1 rounded bg-[#E10600]/10 border border-[#E10600]/30 text-[9px] font-mono text-center text-[#E10600] font-bold uppercase mb-2">
              SIMULAÇÃO DIDÁTICA — FINAL DE GP
            </div>

            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] mb-2.5">
              <strong className="text-white block mb-1">Cenário na Pista:</strong>
              <p className="text-zinc-300 leading-snug">
                Restam 8 voltas. <strong>Piloto 1 (P3)</strong> está com pneus desgastados. <strong>Piloto 2 (P4)</strong> vem 0.8s mais rápido por volta com pneus médios novos. O P2 rival está a apenas 2.5s à frente.
              </p>
            </div>

            <p className="text-[10px] text-zinc-300 font-bold mb-1.5">
              Como você coordenaria os dois pilotos?
            </p>

            <div className="space-y-1 mb-2.5">
              <button
                type="button"
                onClick={() => setM7TeammateDecision("swap")}
                className={cn(
                  "w-full text-left py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                  m7TeammateDecision === "swap" ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                1. Inversão Tática: Deixar P2 atacar o rival (devolver se não passar)
              </button>
              <button
                type="button"
                onClick={() => setM7TeammateDecision("free")}
                className={cn(
                  "w-full text-left py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                  m7TeammateDecision === "free" ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                2. Disputa Livre: Permitir duelo na pista sem ordens de equipe
              </button>
              <button
                type="button"
                onClick={() => setM7TeammateDecision("hold")}
                className={cn(
                  "w-full text-left py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                  m7TeammateDecision === "hold" ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                3. Manter Posições: Congelar P3 e P4 para garantir os pontos da equipe
              </button>
            </div>

            {m7TeammateDecision && (
              <div className="p-2 rounded-lg bg-black/70 border border-white/10 text-[9px] text-zinc-300 leading-relaxed">
                {m7TeammateDecision === "swap" && (
                  <span>
                    ✅ <strong>Estratégia mais eficiente:</strong> Maximiza as chances da equipe conquistar um P2 no Mundial de Construtores com compromisso ético entre os dois pilotos.
                  </span>
                )}
                {m7TeammateDecision === "free" && (
                  <span>
                    ⚠️ <strong>Alto risco esportivo:</strong> Duelo direto pode superaquecer os freios, gastar os pneus restantes e abrir espaço para o carro que vem em P5 se aproximar.
                  </span>
                )}
                {m7TeammateDecision === "hold" && (
                  <span>
                    🛡️ <strong>Abordagem conservadora:</strong> Garante pontos seguros no Construtores, mas impede a equipe de disputar o segundo lugar com pneus mais novos.
                  </span>
                )}
              </div>
            )}
          </div>
        )
      }

      // CENA 7: DINHEIRO, DESENVOLVIMENTO E LIMITE DE CUSTOS
      if (currentScene.visualEffectType === "mod7_cost_cap_development") {
        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Desafio de Alocação</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">COST CAP FIA</span>
            </div>

            <div className="p-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-center text-zinc-400 uppercase mb-2">
              ORÇAMENTO DIDÁTICO: 100 UNIDADES
            </div>

            <p className="text-[10px] text-zinc-300 mb-1.5 font-bold">
              Escolha uma estratégia de desenvolvimento:
            </p>

            <div className="grid grid-cols-3 gap-1 mb-2.5">
              <button
                type="button"
                onClick={() => {
                  setM7BudgetAero(55)
                  setM7BudgetReliability(25)
                  setM7BudgetSimulation(20)
                }}
                className={cn(
                  "py-1 px-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center",
                  m7BudgetAero === 55 ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                Foco Aerodinâmico
              </button>
              <button
                type="button"
                onClick={() => {
                  setM7BudgetAero(30)
                  setM7BudgetReliability(50)
                  setM7BudgetSimulation(20)
                }}
                className={cn(
                  "py-1 px-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center",
                  m7BudgetReliability === 50 ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                Foco Confiabilidade
              </button>
              <button
                type="button"
                onClick={() => {
                  setM7BudgetAero(35)
                  setM7BudgetReliability(35)
                  setM7BudgetSimulation(30)
                }}
                className={cn(
                  "py-1 px-1 rounded text-[9px] font-bold transition-all cursor-pointer text-center",
                  m7BudgetSimulation === 30 ? "bg-[#E10600] text-white shadow-md" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                )}
              >
                Equilíbrio Total
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[10px] space-y-1.5 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">🏎️ Aerodinâmica (Assoalho e Asas):</span>
                <span className="font-mono text-white font-bold">{m7BudgetAero} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">🔧 Confiabilidade (Câmbio e Motor):</span>
                <span className="font-mono text-white font-bold">{m7BudgetReliability} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">💻 Simulação e CFD (Mission Control):</span>
                <span className="font-mono text-white font-bold">{m7BudgetSimulation} pts</span>
              </div>
            </div>

            <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[9px] text-zinc-300 leading-snug">
              💡 <em>O Cost Cap impede despesas infinitas. Gastar muito em asas pode deixar o carro frágil; focar apenas em confiabilidade pode deixá-lo lento.</em>
            </div>
          </div>
        )
      }

      // CENA 8: DESAFIO FINAL: VOCÊ É O CHEFE DA EQUIPE
      if (currentScene.visualEffectType === "mod7_team_principal_challenge") {
        const challenges = [
          {
            step: 1 as const,
            title: "Decisão 1 — O piloto relata perda de aderência",
            options: [
              { id: "A", text: "Ignorar e mandar acelerar sem avaliação." },
              { id: "B", text: "Comparar relato com telemetria e avaliar pneus." },
              { id: "C", text: "Trocar o piloto imediatamente pelo reserva." },
            ],
            best: "B",
            exp: "Correto! A telemetria térmica revela se o pneu está superaquecido ou no fim da vida útil, permitindo uma decisão fundamentada.",
          },
          {
            step: 2 as const,
            title: "Decisão 2 — Aumenta a chance de chuva leve",
            options: [
              { id: "A", text: "Trocar para pneus de chuva extrema agora mesmo." },
              { id: "B", text: "Avaliar evolução meteorológica, tráfego e custo da parada." },
              { id: "C", text: "Desligar o radar meteorológico da equipe." },
            ],
            best: "B",
            exp: "Perfeito! Parar cedo demais para pneu de chuva destrói a borracha no asfalto ainda seco; esperar o ponto de crossover é vital.",
          },
          {
            step: 3 as const,
            title: "Decisão 3 — Carro da frente começa a perder ritmo",
            options: [
              { id: "A", text: "Considerar intervalo, pneus e planejar ataque seguro." },
              { id: "B", text: "Mandar o piloto jogar o adversário para fora." },
              { id: "C", text: "Desistir de competir e recolher para a garagem." },
            ],
            best: "A",
            exp: "Excelente liderança! Avaliar o delta de ritmo e preparar a manobra com uso de energia garante o melhor resultado.",
          },
        ]

        const currentCh = challenges.find((c) => c.step === m7ChallengeStep) || challenges[0]
        const hasAnswered = !!m7ChallengeAnswers[m7ChallengeStep]

        return (
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-88 max-w-[90vw] bg-black/90 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Comando do Team Principal</span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">ETAPA {m7ChallengeStep} DE 3</span>
            </div>

            <div className="p-1 rounded bg-[#E10600]/10 border border-[#E10600]/30 text-[9px] font-mono text-center text-[#E10600] font-bold uppercase mb-2">
              SIMULAÇÃO DIDÁTICA — NÃO É UMA CORRIDA REAL
            </div>

            <p className="text-[10px] font-bold text-white mb-2">{currentCh.title}</p>

            <div className="space-y-1 mb-2.5">
              {currentCh.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setM7ChallengeAnswers({ ...m7ChallengeAnswers, [m7ChallengeStep]: opt.id })}
                  className={cn(
                    "w-full text-left py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    m7ChallengeAnswers[m7ChallengeStep] === opt.id
                      ? opt.id === currentCh.best
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-red-600/80 text-white shadow-md"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <span className="font-mono font-black">{opt.id})</span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>

            {hasAnswered && (
              <div className="p-2 rounded-lg bg-black/70 border border-white/10 text-[9px] text-zinc-300 mb-2.5">
                {m7ChallengeAnswers[m7ChallengeStep] === currentCh.best ? (
                  <span className="text-emerald-400 font-bold block mb-0.5">✓ {currentCh.exp}</span>
                ) : (
                  <span className="text-amber-400 font-bold block mb-0.5">⚠️ Abordagem arriscada! O ideal é: {currentCh.exp}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {m7ChallengeStep < 3 ? (
                <button
                  type="button"
                  disabled={!hasAnswered}
                  onClick={() => setM7ChallengeStep((prev) => ((prev + 1) as 1 | 2 | 3))}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-md"
                >
                  Próxima Decisão
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!hasAnswered}
                  onClick={() => {
                    stopAllAudio()
                    setViewStage("quiz")
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-[0_0_20px_rgba(225,6,0,0.6)]"
                >
                  Fazer o Quiz (10 Questões)
                </button>
              )}
            </div>
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
              src={activeModuleId === 1 ? "/backgrounds/bg-ferrari.webp" : activeModuleId === 2 ? "/backgrounds/bg-default.webp" : activeModuleId === 3 ? "/backgrounds/bg-mclaren.webp" : activeModuleId === 4 ? "/backgrounds/bg-redbull.webp" : activeModuleId === 5 ? "/backgrounds/bg-redbull.webp" : activeModuleId === 6 ? "/novatos/modulo1/cena02_1950.jpg" : "/backgrounds/bg-mercedes.webp"}
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
            <button
              type="button"
              onClick={() => handleSelectModule(3)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 3 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              3. Dentro da Corrida
            </button>
            <button
              type="button"
              onClick={() => handleSelectModule(4)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 4 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              4. A Mente por Trás da Corrida
            </button>
            <button
              type="button"
              onClick={() => handleSelectModule(5)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 5 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              5. Ultrapassagens
            </button>
            <button
              type="button"
              onClick={() => handleSelectModule(6)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 6 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              6. História da F1
            </button>
            <button
              type="button"
              onClick={() => handleSelectModule(7)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all cursor-pointer",
                activeModuleId === 7 ? "bg-[#E10600] text-white shadow-lg" : "text-zinc-400 hover:text-white"
              )}
            >
              7. Bastidores da Equipe
            </button>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono uppercase tracking-widest text-zinc-300 mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
              <span>
                {activeModuleId === 1
                  ? "MÓDULO 1 • O QUE É A FÓRMULA 1?"
                  : activeModuleId === 2
                  ? "MÓDULO 2 • A MÁQUINA: COMO FUNCIONA O CARRO"
                  : activeModuleId === 3
                  ? "MÓDULO 3 • DENTRO DA CORRIDA: APRENDA A ACOMPANHAR A TRANSMISSÃO"
                  : activeModuleId === 4
                  ? "MÓDULO 4 • A MENTE POR TRÁS DA CORRIDA: ESTRATÉGIA E PNEUS"
                  : activeModuleId === 5
                  ? "MÓDULO 5 • A ARTE DE ULTRAPASSAR: REGRAS E DISPUTAS"
                  : activeModuleId === 6
                  ? "MÓDULO 6 • A HISTÓRIA DA FÓRMULA 1: 75 ANOS DE EVOLUÇÃO"
                  : "MÓDULO 7 • POR TRÁS DA EQUIPE: ENGENHEIROS, ESTRATÉGIA E DADOS"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-3 drop-shadow-md">
              Novatos na <span className="text-[#E10600]">F1</span>
            </h1>

            <p className="text-sm sm:text-lg font-bold uppercase tracking-wider text-zinc-300 mb-4">
              {activeModuleId === 1
                ? "Aprenda a entender cada corrida, curva por curva"
                : activeModuleId === 2
                ? "MÓDULO 2 — A MÁQUINA"
                : activeModuleId === 3
                ? "MÓDULO 3 — DENTRO DA CORRIDA"
                : activeModuleId === 4
                ? "MÓDULO 4 — A MENTE POR TRÁS DA CORRIDA"
                : activeModuleId === 5
                ? "MÓDULO 5 — A ARTE DE ULTRAPASSAR"
                : activeModuleId === 6
                ? "MÓDULO 6 — A HISTÓRIA DA FÓRMULA 1"
                : "MÓDULO 7 — POR TRÁS DA EQUIPE"}
            </p>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mb-8">
              {activeModuleId === 1
                ? "Você não precisa entender de automobilismo para começar. Nós explicamos as regras, estratégias, equipes e o caminho até a bandeirada final."
                : activeModuleId === 2
                ? "“Um carro de Fórmula 1 não é apenas rápido. Cada peça, cada ajuste e cada decisão ajudam a transformar potência em desempenho.”"
                : activeModuleId === 3
                ? "“Os carros estão no grid. Os pilotos estão preparados. Mas você sabe interpretar tudo o que está prestes a acontecer?”"
                : activeModuleId === 4
                ? "“Na Fórmula 1, velocidade é fundamental. Mas saber quando atacar, economizar pneus ou parar nos boxes pode mudar o resultado de uma corrida.”"
                : activeModuleId === 5
                ? "“Na Fórmula 1, ultrapassar não é apenas acelerar. É escolher o momento certo, entender o adversário e disputar cada centímetro dentro das regras.”"
                : activeModuleId === 6
                ? "“75 anos de velocidade, coragem e evolução: das pioneiras máquinas de Silverstone à revolução técnica de 2026.”"
                : "“O piloto está na pista. Centenas de decisões acontecem nos bastidores.”"}
            </p>

            {/* Botão de Ação CTA */}
            <button
              type="button"
              onClick={handleStartExperience}
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-sm sm:text-base font-black uppercase tracking-wider shadow-[0_0_30px_rgba(225,6,0,0.65)] hover:shadow-[0_0_40px_rgba(225,6,0,0.85)] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{activeModuleId === 1 ? "COMEÇAR DO ZERO" : activeModuleId === 2 ? "INICIAR EXPERIÊNCIA" : activeModuleId === 3 ? "INICIAR TRANSMISSÃO" : activeModuleId === 6 ? "INICIAR EXPERIÊNCIA" : "INICIAR TRANSMISSÃO"}</span>
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
                {activeModuleId === 1 ? "MÓDULO 1 CONCLUÍDO" : activeModuleId === 2 ? "MÓDULO 2 CONCLUÍDO" : activeModuleId === 3 ? "MÓDULO 3 CONCLUÍDO" : activeModuleId === 4 ? "MÓDULO 4 CONCLUÍDO" : activeModuleId === 5 ? "MÓDULO 5 CONCLUÍDO" : activeModuleId === 6 ? "MÓDULO 6 CONCLUÍDO" : "MÓDULO 7 CONCLUÍDO"}
              </h2>

              <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
                Você acertou {quizScore} de {currentQuizQuestions.length} perguntas ({Math.round(((quizScore || 0) / currentQuizQuestions.length) * 100)}%)
              </p>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto mb-6">
                {activeModuleId === 1
                  ? "Parabéns! Você já compreende as regras fundamentais, a história, o campeonato e os elementos de uma corrida de F1."
                  : activeModuleId === 2
                  ? "“Você já conhece os principais sistemas de um carro de Fórmula 1 e entende melhor como engenharia, piloto e equipe trabalham juntos.”"
                  : activeModuleId === 3
                  ? "“Você já conhece os principais momentos de uma corrida de Fórmula 1 e está mais preparado para acompanhar uma transmissão e entender o que acontece na pista.”"
                  : activeModuleId === 4
                  ? (quizScore ?? 0) >= 9
                    ? "“Excelente! Você já consegue interpretar vários dos principais elementos da estratégia de corrida.”"
                    : (quizScore ?? 0) >= 7
                    ? "“Muito bem! Você compreendeu os conceitos principais. Revise os detalhes que ainda geraram dúvidas.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Bom começo! Refaça as cenas sobre pneus, pit stops e decisões estratégicas para consolidar o conhecimento.”"
                    : "“Toda grande estratégia começa com aprendizado. Reveja as cenas e tente novamente.”"
                  : activeModuleId === 5
                  ? (quizScore ?? 0) >= 9
                    ? "“Excelente! Você já consegue interpretar os principais elementos de uma disputa de F1.”"
                    : (quizScore ?? 0) >= 7
                    ? "“Muito bem! Você entendeu os fundamentos. Revise os detalhes regulamentares para melhorar ainda mais.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Bom começo! Reveja as cenas sobre defesa, ataque e disputas roda a roda.”"
                    : "“Toda boa leitura de corrida começa com aprendizado. Reveja as cenas e tente novamente.”"
                  : activeModuleId === 6
                  ? (quizScore ?? 0) >= 9
                    ? "“Excelente! Você compreende com maestria os 75 anos de história, as eras técnicas e o legado que moldou a Fórmula 1 moderna.”"
                    : (quizScore ?? 0) >= 7
                    ? "“Muito bem! Você conhece os marcos essenciais da história do automobilismo. Revise as cenas para fixar os detalhes.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Bom começo! Reveja os períodos técnicos, a trajetória de Ayrton Senna e as inovações de segurança.”"
                    : "“Toda grande jornada histórica começa com o primeiro passo. Reveja as cenas da linha do tempo e tente novamente.”"
                  : (quizScore ?? 0) >= 9
                  ? "“Excelente! Você tem visão de Team Principal: domina a sinergia entre engenharia, mecânica, dados e liderança estratégica.”"
                  : (quizScore ?? 0) >= 7
                  ? "“Muito bem! Você compreende o trabalho nos bastidores da equipe. Revise os detalhes técnicos para refinar suas decisões.”"
                  : (quizScore ?? 0) >= 5
                  ? "“Bom começo! Reveja as cenas sobre telemetria, limite de custos e estratégia de pit wall.”"
                  : "“Liderar uma equipe exige aprendizado constante. Reveja as cenas do módulo e tente novamente.”"}
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

                {activeModuleId === 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      goToScene(0)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E10600]/20 hover:bg-[#E10600]/30 text-white text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-[#E10600]/40"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#E10600]" />
                    <span>Revisar Linha do Tempo</span>
                  </button>
                )}

                {activeModuleId === 7 && (
                  <button
                    type="button"
                    onClick={() => {
                      goToScene(7)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E10600]/20 hover:bg-[#E10600]/30 text-white text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-[#E10600]/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
                    <span>Rever o Desafio do Chefe</span>
                  </button>
                )}

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
                src={viewStage === "opening" ? (activeModuleId === 1 ? "/backgrounds/bg-ferrari.webp" : activeModuleId === 2 ? "/backgrounds/bg-default.webp" : activeModuleId === 3 ? "/backgrounds/bg-mclaren.webp" : "/backgrounds/bg-redbull.webp") : currentScene.imageUrl}
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
