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
import { StartingGridAnimation } from "@/components/starting-grid-animation"
import { CarMechanicsAnimation } from "@/components/car-mechanics-animation"
import { PitstopAnimation } from "@/components/pitstop-animation"

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
    id: "racing_line",
    term: "Racing line",
    category: "Pista",
    definition: "Trajetória geométrica e dinâmica ideal que aproveita toda a largura da pista para contornar curvas com a maior velocidade média e menor tempo de volta.",
  },
  {
    id: "ponto_frenagem",
    term: "Ponto de frenagem",
    category: "Pista",
    definition: "Referência visual fixa no circuito (placas de metros ou início de zebra) onde o piloto aplica pressão máxima no pedal de freio antes da curva.",
  },
  {
    id: "apice",
    term: "Ápice",
    category: "Pista",
    definition: "Ponto mais interno da trajetória de uma curva (ponto de tangência) onde o carro atinge a rotação máxima e inicia a fase de aceleração de saída.",
  },
  {
    id: "entrada_curva",
    term: "Entrada da curva",
    category: "Pista",
    definition: "Fase de aproximação, frenagem e início de esterço do volante onde o piloto posiciona o carro para apontar na direção do ápice.",
  },
  {
    id: "saida_curva",
    term: "Saída da curva",
    category: "Pista",
    definition: "Fase final da curva em que o piloto desvira o volante em direção à zebra externa e acelera progressivamente rumo à reta seguinte.",
  },
  {
    id: "chicane",
    term: "Chicane",
    category: "Pista",
    definition: "Sequência curta de curvas estreitas e alternadas (ex: esquerda-direita) projetada para desacelerar os carros em trechos de altíssima velocidade.",
  },
  {
    id: "aderencia",
    term: "Aderência",
    category: "Carro",
    definition: "Força de atrito gerada pelo contato entre a borracha dos pneus e o asfalto, responsável por manter o carro estável em frenagens, curvas e acelerações.",
  },
  {
    id: "tracao",
    term: "Tração",
    category: "Carro",
    definition: "Capacidade do conjunto motor e pneus traseiros de transferir torque e acelerar sem destracionar ou patinar a borracha.",
  },
  {
    id: "bloqueio_roda",
    term: "Bloqueio de roda",
    category: "Carro",
    definition: "Situação em que a força de frenagem supera o atrito do pneu com a pista, fazendo a roda parar de girar e gerando fumaça e desgaste plano (flatspot).",
  },
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
    id: "consistencia",
    term: "Consistência",
    category: "Geral",
    definition: "Capacidade de um piloto de repetir tempos de volta precisos e idênticos ao longo de toda uma prova sem cometer erros ou desgastar excessivamente o equipamento.",
  },
  {
    id: "ritmo_corrida",
    term: "Ritmo de corrida",
    category: "Geral",
    definition: "Velocidade média sustentável que um carro e piloto conseguem manter durante múltiplos stints de uma prova com tanque cheio e gerenciamento contínuo de pneus.",
  },
  {
    id: "gestao_pneus",
    term: "Gestão de pneus",
    category: "Carro",
    definition: "Técnica de modulação de aceleração, frenagem e esterço para manter a temperatura do composto na janela ideal, retardando a degradação e o desgaste.",
  },
  {
    id: "leitura_corrida",
    term: "Leitura de corrida",
    category: "Geral",
    definition: "Habilidade de antecipar o comportamento dos rivais, a evolução climática e os momentos estratégicos da prova para agir antes das circunstâncias.",
  },
  {
    id: "racecraft",
    term: "Racecraft",
    category: "Geral",
    definition: "Conjunto refinado de habilidades de disputa direta roda a roda, incluindo posicionamento tático, indução de erros do oponente e defesa legal de linha.",
  },
  {
    id: "pressao_competitiva",
    term: "Pressão competitiva",
    category: "Geral",
    definition: "Carga psicológica suportada pelo piloto sob perseguição intensa ou caça ao líder, exigindo controle emocional para evitar travamentos e saídas de pista.",
  },
  {
    id: "adaptacao",
    term: "Adaptação",
    category: "Carro",
    definition: "Capacidade de modificar o estilo de pilotagem em tempo real conforme o carro fica mais leve, o equilíbrio dinâmico muda ou a pista perde aderência.",
  },
  {
    id: "aerodinamica_2026",
    term: "Aerodinâmica",
    category: "Carro",
    definition: "Estudo de como o ar interage com as superfícies do carro para produzir pressão descendente e controlar a resistência ao avanço.",
  },
  {
    id: "arrasto_aerodinamico",
    term: "Arrasto",
    category: "Carro",
    definition: "Resistência física imposta pelo ar ao deslocamento do veículo para frente, limitando a velocidade máxima nas retas.",
  },
  {
    id: "pressao_aerodinamica",
    term: "Pressão aerodinâmica",
    category: "Carro",
    definition: "Força vertical descendente (downforce) gerada pelo fluxo de ar sobre asas e assoalho que empurra os pneus contra o solo, aumentando a aderência em curvas.",
  },
  {
    id: "aerodinamica_ativa",
    term: "Aerodinâmica ativa",
    category: "Carro",
    definition: "Sistema introduzido em 2026 que altera a geometria das asas dianteira e traseira em tempo real (Straight Mode e Corner Mode) sob condições regulamentadas.",
  },
  {
    id: "unidade_potencia_2026",
    term: "Unidade de potência",
    category: "Carro",
    definition: "Conjunto propulsor integrado composto pelo motor a combustão V6 turbo sustentável e o sistema elétrico de recuperação e entrega de energia.",
  },
  {
    id: "recuperacao_energia_ers",
    term: "Sistema de recuperação de energia",
    category: "Carro",
    definition: "Dispositivos elétricos (MGU-K) que convertem a energia cinética das frenagens em eletricidade utilizável armazenada na bateria.",
  },
  {
    id: "boost_mode_2026",
    term: "Boost Mode",
    category: "Carro",
    definition: "Recurso de entrega de potência máxima controlada pelo piloto para ataque ou defesa, condicionado à carga disponível de bateria e regras vigentes.",
  },
  {
    id: "overtake_mode_2026",
    term: "Overtake Mode",
    category: "Carro",
    definition: "Modo regulamentado da geração 2026 que libera potência elétrica adicional quando o carro persegue um rival a menos de 1 segundo em ponto de detecção.",
  },
  {
    id: "recharge_energia",
    term: "Recharge",
    category: "Carro",
    definition: "Fase operacional ou estratégia de corrida onde a unidade de potência prioriza a recarga das células de bateria aproveitando zonas de frenagem e desaceleração.",
  },
  {
    id: "telemetria_f1",
    term: "Telemetria",
    category: "Geral",
    definition: "Transmissão e análise contínua de centenas de parâmetros dos sensores de bordo (velocidade, freios, aceleração, calor e energia) em tempo real.",
  },
  {
    id: "monocoque_seguranca",
    term: "Monocoque",
    category: "Carro",
    definition: "Célula de sobrevivência central ultrarresistente em fibra de carbono onde o piloto fica alojado, projetada para suportar desacelerações extremas.",
  },
  {
    id: "combustivel_sustentavel_2026",
    term: "Combustível sustentável avançado",
    category: "Carro",
    definition: "Combustível 100% livre de fontes fósseis, sintetizado a partir de captura de carbono ou resíduos biológicos não alimentares conforme as normas da FIA.",
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
    | "mod8_circuit_anatomy"
    | "mod8_racing_line"
    | "mod8_braking_physics"
    | "mod8_corner_categories"
    | "mod8_friction_circle"
    | "mod8_monaco_monza_spa"
    | "mod8_rain_track_limits"
    | "mod8_lap_master_challenge"
    | "mod9_qualities_overview"
    | "mod9_pressure_mindset"
    | "mod9_consistency_pace"
    | "mod9_racecraft_duels"
    | "mod9_tire_intelligence"
    | "mod9_champions_styles"
    | "mod9_adapting_uncertainty"
    | "mod9_champion_mindset_challenge"
    | "mod10_integrated_system"
    | "mod10_aerodynamics_balance"
    | "mod10_active_aero_modes"
    | "mod10_power_unit_hybrid"
    | "mod10_boost_overtake_recharge"
    | "mod10_telemetry_laps"
    | "mod10_materials_safety"
    | "mod10_engineer_challenge"
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

// ============================================================================
// CENAS DO MÓDULO 8 — DOMINANDO OS CIRCUITOS: TRAJETÓRIAS, FRENAGEM E CURVAS
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 9 — A MENTE DOS CAMPEÕES: VELOCIDADE, CONSISTÊNCIA E PSICOLÓGICO
// ============================================================================

// ============================================================================
// CENAS DO MÓDULO 10 — A TECNOLOGIA POR TRÁS DA VELOCIDADE (ENGENHARIA E DADOS)
// ============================================================================
export const MODULE_10_SCENES: ModuleScene[] = [
  {
    id: "m10_c1",
    number: 1,
    title: "O Carro é um Sistema Integrado",
    subtitle: "Engenharia sistêmica: cada componente conectado",
    imageUrl: "/backgrounds/bg-cadillac.webp",
    audioUrl: "/audio/novatos/modulo10/cena01.mp3",
    narrationTranscript:
      "Na Fórmula 1, a velocidade não vem de uma peça milagrosa. Ela nasce de centenas de decisões de engenharia trabalhando em conjunto. O motor, a aerodinâmica, a suspensão, os freios e a eletrônica formam um sistema integrado, onde cada alteração afeta o equilíbrio geral do carro.",
    visualEffectType: "mod10_integrated_system",
  },
  {
    id: "m10_c2",
    number: 2,
    title: "Aerodinâmica: Dominando o Ar",
    subtitle: "Arrasto, pressão aerodinâmica e o compromisso da velocidade",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo10/cena02.mp3",
    narrationTranscript:
      "O ar é ao mesmo tempo o melhor amigo e o maior rival de um carro de corrida. A pressão aerodinâmica empurra o carro contra o asfalto para contornar curvas em alta velocidade, enquanto o arrasto cria resistência nas retas. A engenharia vive na busca pelo compromisso ideal entre velocidade e aderência.",
    visualEffectType: "mod10_aerodynamics_balance",
  },
  {
    id: "m10_c3",
    number: 3,
    title: "Aerodinâmica Ativa: Os Modos de 2026",
    subtitle: "Straight Mode vs Corner Mode: a revolução das asas móveis",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo10/cena03.mp3",
    narrationTranscript:
      "Em 2026, a aerodinâmica dá um salto histórico com os modos ativos. No Straight Mode, os elementos móveis das asas reduzem o arrasto nas retas autorizadas para maximizar a velocidade. Já no Corner Mode, a pressão aerodinâmica é restabelecida para garantir máxima estabilidade e segurança nas curvas.",
    visualEffectType: "mod10_active_aero_modes",
  },
  {
    id: "m10_c4",
    number: 4,
    title: "Unidade de Potência: Combustão e Eletricidade",
    subtitle: "Arquitetura híbrida e combustíveis 100% sustentáveis",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo10/cena04.mp3",
    narrationTranscript:
      "A unidade de potência de 2026 é uma obra de engenharia sustentável e híbrida. Ela une um motor a combustão alimentado por combustíveis cem por cento sustentáveis a um sistema elétrico de altíssima eficiência. Potência é a rapidez com que a força é entregue; energia é o que você tem no tanque e na bateria para gastar com sabedoria ao longo da volta.",
    visualEffectType: "mod10_power_unit_hybrid",
  },
  {
    id: "m10_c5",
    number: 5,
    title: "Boost, Overtake Mode e Recharge",
    subtitle: "Gestão inteligente de watts e quilowatts na pista",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo10/cena05.mp3",
    narrationTranscript:
      "Administrar energia na pista exige inteligência tática. Com o Boost Mode, o piloto solicita potência extra quando as regras e a carga permitem. O Overtake Mode substitui o antigo papel do DRS, oferecendo energia extra em disputas diretas quando colado no rival. E no Recharge, os sistemas recuperam preciosa eletricidade a cada frenagem.",
    visualEffectType: "mod10_boost_overtake_recharge",
  },
  {
    id: "m10_c6",
    number: 6,
    title: "Telemetria: Os Dados que Revelam a Velocidade",
    subtitle: "Comparando voltas: onde os milésimos são ganhos ou perdidos",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo10/cena06.mp3",
    narrationTranscript:
      "A telemetria transforma cada centímetro da pista em dados matemáticos. Sensores registram velocidade, aceleração, frenagem e calor a cada milissegundo. Comparando duas voltas, os engenheiros descobrem exatamente onde o piloto ganhou tempo ou onde o acerto do carro pode ser refinado para a classificação.",
    visualEffectType: "mod10_telemetry_laps",
  },
  {
    id: "m10_c7",
    number: 7,
    title: "Materiais, Estrutura e Segurança",
    subtitle: "Célula de sobrevivência, Halo e compósitos de alta resistência",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo10/cena07.mp3",
    narrationTranscript:
      "A busca pela velocidade só é possível porque a segurança evoluiu na mesma proporção. A célula de sobrevivência em fibra de carbono, o Halo em titânio e as estruturas deformáveis de absorção de energia são projetados para proteger o piloto mesmo nos impactos mais severos, atendendo aos rigorosos testes da FIA.",
    visualEffectType: "mod10_materials_safety",
  },
  {
    id: "m10_c8",
    number: 8,
    title: "Desafio Final: Você É o Engenheiro da Equipe",
    subtitle: "Simulação técnica em 3 decisões estratégicas de engenharia",
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo10/cena08.mp3",
    narrationTranscript:
      "Você viu como a aerodinâmica, a energia híbrida, os dados e a segurança formam a máquina de Fórmula 1. Agora você assume o papel de engenheiro da equipe! Tome as decisões certas na pista e depois teste seus conhecimentos no quiz final da tecnologia!",
    visualEffectType: "mod10_engineer_challenge",
  },
]

export const MODULE_9_SCENES: ModuleScene[] = [
  {
    id: "m9_c1",
    number: 1,
    title: "Velocidade Não É Tudo",
    subtitle: "Os cinco pilares de um piloto campeão",
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo9/cena01.mp3",
    narrationTranscript:
      "Muita gente pensa que ser rápido é o suficiente na Fórmula 1. Mas a velocidade pura só decide quem larga na frente. Na corrida, o que constrói um campeão é a capacidade de repetir voltas perfeitas sem cometer erros, entender o momento certo de arriscar e tomar decisões lúcidas a mais de trezentos por hora.",
    visualEffectType: "mod9_qualities_overview",
  },
  {
    id: "m9_c2",
    number: 2,
    title: "A Mente sob Pressão",
    subtitle: "Erros acontecem: o que importa é a velocidade da recuperação",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo9/cena02.mp3",
    narrationTranscript:
      "Errar na Fórmula 1 custa caro. Uma freada perdida, um toque na zebra ou uma decisão errada podem destruir um fim de semana inteiro. A diferença entre um piloto comum e um fora de série não é nunca errar: é a velocidade com que ele se recupera do erro, ajusta o foco e volta ao ritmo sem deixar o pânico tomar conta.",
    visualEffectType: "mod9_pressure_mindset",
  },
  {
    id: "m9_c3",
    number: 3,
    title: "A Arte da Consistência",
    subtitle: "Piloto A oscilante vs Piloto B regular: por que a regularidade vence",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo9/cena03.mp3",
    narrationTranscript:
      "Olhe para esses dois gráficos. O Piloto A consegue voltas espetaculares, mas oscila a cada passagem. O Piloto B não tem a volta mais rápida da prova, mas mantém o mesmo tempo volta após volta. No fim das cinquenta voltas, a regularidade vence o brilho momentâneo. Consistência é o verdadeiro superpoder na Fórmula 1.",
    visualEffectType: "mod9_consistency_pace",
  },
  {
    id: "m9_c4",
    number: 4,
    title: "Ataque, Defesa e Leitura do Adversário",
    subtitle: "Racecraft: paciência, antecipação e posicionamento cirúrgico",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo9/cena04.mp3",
    narrationTranscript:
      "Ultrapassar não é apenas mergulhar na primeira brecha. É um jogo psicológico de paciência e antecipação. Um campeão estuda o adversário por voltas: descobre onde ele freia, onde tem menos tração e prepara o ataque duas curvas antes. Defender exige a mesma frieza: posicionar o carro no lugar certo sem perder tempo nem cruzar o limite das regras.",
    visualEffectType: "mod9_racecraft_duels",
  },
  {
    id: "m9_c5",
    number: 5,
    title: "Os Pneus Também Exigem Inteligência",
    subtitle: "Degradação térmica vs desgaste mecânico: pilotagem agressiva vs controlada",
    imageUrl: "/backgrounds/bg-mercedes.webp",
    audioUrl: "/audio/novatos/modulo9/cena05.mp3",
    narrationTranscript:
      "Pneus não são infinitos. Cada derrapada, cada travada de roda consome borracha e eleva a temperatura. Pilotos lendários desenvolvem uma sensibilidade quase mágica nas mãos e nos pés: conseguem andar rápido sem agredir o composto, guardando vida útil para o momento decisivo da corrida.",
    visualEffectType: "mod9_tire_intelligence",
  },
  {
    id: "m9_c6",
    number: 6,
    title: "Estilos Diferentes, Campeões Diferentes",
    subtitle: "Senna, Schumacher, Hamilton, Verstappen: diferentes caminhos para a glória",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo9/cena06.mp3",
    narrationTranscript:
      "Não existe uma única forma de ser campeão. Ayrton Senna pilotava no limite do instinto e da intensidade. Michael Schumacher unia disciplina física, método e sincronia com a engenharia. Lewis Hamilton combina sensibilidade técnica com precisão cirúrgica em momentos de pressão. E Max Verstappen compete com agressividade implacável e controle absoluto do carro. Qualidades diferentes, o mesmo resultado: a grandeza.",
    visualEffectType: "mod9_champions_styles",
  },
  {
    id: "m9_c7",
    number: 7,
    title: "Quando o Plano Dá Errado",
    subtitle: "Incerteza, chuva repentina e a simbiose com o pit wall",
    imageUrl: "/backgrounds/bg-audi.webp",
    audioUrl: "/audio/novatos/modulo9/cena07.mp3",
    narrationTranscript:
      "Na Fórmula 1, o plano perfeito dura até a primeira gota de chuva ou o primeiro safety car. Quando as circunstâncias mudam, o piloto não pode paralisar. Ele precisa filtrar o excesso de dados, confiar no instinto, dialogar com o engenheiro pelo rádio e agir rápido. Campeões crescem exatamente quando o caos se instala.",
    visualEffectType: "mod9_adapting_uncertainty",
  },
  {
    id: "m9_c8",
    number: 8,
    title: "Desafio Final: A Mente do Campeão",
    subtitle: "Simulação de corrida em 3 etapas para testar sua leitura tática",
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo9/cena08.mp3",
    narrationTranscript:
      "Você conheceu os pilares que formam uma mente campeã: velocidade, consistência, leitura de corrida, controle sob pressão e capacidade de adaptação. Agora é com você. Mostre no desafio e no quiz final se você aprendeu a enxergar a Fórmula 1 além dos números e da velocidade bruta!",
    visualEffectType: "mod9_champion_mindset_challenge",
  },
]

export const MODULE_8_SCENES: ModuleScene[] = [
  {
    id: "m8_c1",
    number: 1,
    title: "Cada Circuito Conta uma História",
    subtitle: "Antes de entender a velocidade, aprenda a ler a pista",
    imageUrl: "/backgrounds/bg-aston.webp",
    audioUrl: "/audio/novatos/modulo8/cena01.mp3",
    narrationTranscript:
      "Olá! Bem-vindo ao Módulo 8 de Novatos na F1: Dominando os Circuitos! Antes de tentar entender por que um piloto é veloz, precisamos aprender a ler a pista. Cada autódromo do calendário é um desafio único de engenharia e pilotagem. Em um traçado, você encontrará retas longas onde a velocidade final e o vácuo dominam; chicanes apertadas que exigem mudanças bruscas de direção sobre as zebras; curvas lentas que cobram tração perfeita; e sequências de curvas de alta velocidade onde a pressão aerodinâmica cola o carro no asfalto. Pilotar não é apenas seguir uma linha desenhada no chão: é encadear uma sequência matemática de decisões sobre onde frear, como virar o volante e quando acelerar.",
    visualEffectType: "mod8_circuit_anatomy",
  },
  {
    id: "m8_c2",
    number: 2,
    title: "O Segredo da Trajetória Ideal",
    subtitle: "A geometria da racing line: entrada, ápice e saída",
    imageUrl: "/backgrounds/bg-ferrari.webp",
    audioUrl: "/audio/novatos/modulo8/cena02.mp3",
    narrationTranscript:
      "A trajetória ideal, conhecida mundialmente como racing line, é o caminho geométrico mais eficiente para contornar uma curva no menor tempo possível. Ela se divide em três fases essenciais: a entrada, onde o piloto posiciona o carro na parte externa e inicia a desaceleração; o ápice ou ponto de tangência, onde o carro passa o mais rente possível da zebra interna; e a saída, quando o piloto abre o volante em direção à zebra externa para acelerar com potência total. Atenção: a linha mais rápida nem sempre é a menor distância em metros. Muitas vezes, fazer uma curva mais aberta permite reacelerar centenas de metros antes, gerando uma velocidade imensa para a reta seguinte.",
    visualEffectType: "mod8_racing_line",
  },
  {
    id: "m8_c3",
    number: 3,
    title: "Frenar no Momento Certo",
    subtitle: "A desaceleração brutal de 5G e a transferência de peso",
    imageUrl: "/backgrounds/bg-redbull.webp",
    audioUrl: "/audio/novatos/modulo8/cena03.mp3",
    narrationTranscript:
      "Na Fórmula 1, acelerar é instinto, mas frear é uma ciência de precisão cirúrgica. Ao final de uma reta a mais de trezentos quilômetros por hora, o piloto pisa no pedal de freio com uma força superior a cem quilos. Os discos de carbono em brasa geram uma desaceleração brutal de cinco vezes a força da gravidade. Se frear cedo demais, o piloto desperdiça décimos preciosos antes da curva. Se frear tarde demais, corre o risco de travar as rodas, estragar o pneu e espalhar para fora da pista. O segredo de uma volta rápida é encontrar o ponto exato de frenagem e transferir suavemente o peso do carro para manter a frente apontada para a curva.",
    visualEffectType: "mod8_braking_physics",
  },
  {
    id: "m8_c4",
    number: 4,
    title: "Curvas Lentas, Médias e Rápidas",
    subtitle: "Três desafios físicos que exigem técnicas diferentes",
    imageUrl: "/backgrounds/bg-mclaren.webp",
    audioUrl: "/audio/novatos/modulo8/cena04.mp3",
    narrationTranscript:
      "Nem toda curva é igual, e cada tipo exige uma postura diferente do piloto. Nas curvas lentas, abaixo de cem quilômetros por hora, a aderência mecânica e a tração de saída são tudo: quem consegue colocar potência no chão mais cedo leva vantagem por toda a reta. Nas curvas médias, o segredo é o equilíbrio e a fluidez de transição entre freio e volante. Já nas curvas de alta velocidade, a aerodinâmica assume o comando: as asas geram toneladas de downforce que colam os pneus no chão, permitindo contornos a mais de duzentos e cinquenta por hora onde a confiança e a precisão milimétrica não admitem qualquer hesitação.",
    visualEffectType: "mod8_corner_categories",
  },
  {
    id: "m8_c5",
    number: 5,
    title: "O Equilíbrio dos Comandos",
    subtitle: "Acelerador, freio e volante dividem o orçamento de aderência",
    imageUrl: "/backgrounds/bg-alpine.webp",
    audioUrl: "/audio/novatos/modulo8/cena05.mp3",
    narrationTranscript:
      "Para entender o comportamento do carro, imagine que os quatro pneus possuem um orçamento limitado de aderência. Se o piloto usa cem por cento dessa capacidade para frear em linha reta, não sobra aderência para virar o volante. Se ele tentar virar e acelerar ao mesmo tempo de forma brusca, a borracha perde a tração e a traseira escapa. É por isso que os grandes pilotos fazem uma transição suave: à medida que aliviam o freio na entrada da curva, aumentam o esterço do volante; e à medida que desviram o volante na saída, aplicam a aceleração de forma progressiva. O segredo de uma volta perfeita é pilotar na fronteira exata desse limite de aderência.",
    visualEffectType: "mod8_friction_circle",
  },
  {
    id: "m8_c6",
    number: 6,
    title: "Mônaco, Monza e Spa",
    subtitle: "Três templos com personalidades e desafios opostos",
    imageUrl: "/backgrounds/bg-williams.webp",
    audioUrl: "/audio/novatos/modulo8/cena06.mp3",
    narrationTranscript:
      "O calendário da Fórmula 1 reúne pistas com identidades completamente distintas. Mônaco é o teste supremo de precisão: ruas estreitas, curvas travadas, guard-rails colados no cockpit e margem de erro zero. Monza, o lendário Templo da Velocidade, é o oposto: retas intermináveis, asas mínimas com baixíssimo arrasto aerodinâmico e frenagens violentas nas chicanes. Já Spa-Francorchamps, na Bélgica, é a obra-prima das curvas de alta e variações de relevo, como a mítica Eau Rouge e a subida da Raidillon. Cada circuito exige um acerto de suspensão, pressão aerodinâmica e estilo de pilotagem completamente diferente.",
    visualEffectType: "mod8_monaco_monza_spa",
  },
  {
    id: "m8_c7",
    number: 7,
    title: "Quando a Pista Muda",
    subtitle: "Chuva, asfalto escorregadio, zebras e limites de pista",
    imageUrl: "/backgrounds/bg-haas.webp",
    audioUrl: "/audio/novatos/modulo8/cena07.mp3",
    narrationTranscript:
      "A pista nunca é a mesma durante todo o fim de semana. Quando a chuva cai, o asfalto emborrachado da linha seca torna-se extremamente escorregadio, obrigando os pilotos a buscar a chamada linha de chuva por fora do traçado habitual. Além disso, as zebras pintadas perdem aderência quando molhadas e poças d'água podem provocar aquaplanagem instantânea. Ao mesmo tempo, o piloto precisa vigiar rigorosamente os limites de pista: tocar além das quatro rodas fora da faixa branca invalida a volta rápida na classificação e gera advertências na corrida. A excelência de um campeão está na capacidade de adaptar suas referências a cada volta.",
    visualEffectType: "mod8_rain_track_limits",
  },
  {
    id: "m8_c8",
    number: 8,
    title: "Desafio Final: A Volta Perfeita",
    subtitle: "Conecte os setores e construa a volta mais rápida",
    imageUrl: "/backgrounds/bg-default.webp",
    audioUrl: "/audio/novatos/modulo8/cena08.mp3",
    narrationTranscript:
      "Chegou a hora de acelerar na prática! No nosso simulador interativo, você vai guiar um carro de Fórmula 1 por uma volta rápida em um circuito fictício de cinco setores desafiadores. Diante de cada trecho, você precisará tomar a decisão correta de frenagem, posicionamento de curva e adaptação às condições da pista. Lembre-se do que a Mariana ensinou: uma volta perfeita não nasce apenas da coragem de acelerar fundo, mas da consistência em respeitar os limites da física e do traçado. Boa volta e nos vemos no Quiz Final!",
    visualEffectType: "mod8_lap_master_challenge",
  },
]

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

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 8 (10 PERGUNTAS SOBRE CIRCUITOS E VOLTA RÁPIDA)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 9 (10 PERGUNTAS SOBRE A MENTE DOS CAMPEÕES)
// ============================================================================

// ============================================================================
// QUESTIONÁRIO FINAL — MÓDULO 10 (10 PERGUNTAS SOBRE A TECNOLOGIA DA F1)
// ============================================================================
export const MODULE_10_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "PERGUNTA 1 — Qual é a principal função da pressão aerodinâmica?",
    options: [
      { letter: "A", text: "Eliminar o peso do carro." },
      { letter: "B", text: "Ajudar a pressionar o carro contra o solo e contribuir para a aderência." },
      { letter: "C", text: "Recarregar a bateria diretamente." },
      { letter: "D", text: "Substituir os pneus." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! A pressão aerodinâmica (downforce) comprime o carro contra o asfalto, permitindo contornar curvas em alta velocidade com máxima estabilidade.",
  },
  {
    id: 2,
    question: "PERGUNTA 2 — O que é o arrasto aerodinâmico?",
    options: [
      { letter: "A", text: "A resistência do ar ao movimento do carro." },
      { letter: "B", text: "A energia armazenada na bateria." },
      { letter: "C", text: "O desgaste físico dos pneus." },
      { letter: "D", text: "A força produzida exclusivamente pelos freios." },
    ],
    correctLetter: "A",
    feedback:
      "Muito bem! O arrasto é a resistência ao avanço imposta pelo ar, sendo o principal fator limitador da velocidade final nas retas.",
  },
  {
    id: 3,
    question: "PERGUNTA 3 — O que caracteriza a aerodinâmica ativa da geração de 2026?",
    options: [
      { letter: "A", text: "As asas são retiradas durante as retas." },
      { letter: "B", text: "O piloto pode alterar qualquer componente sem restrições." },
      { letter: "C", text: "Elementos aerodinâmicos podem mudar de configuração conforme os modos e as condições regulamentares." },
      { letter: "D", text: "O carro não sofre resistência do ar." },
    ],
    correctLetter: "C",
    feedback:
      "Exato! Elementos móveis ajustam a angulação das asas dianteira e traseira entre Straight Mode (baixo arrasto) e Corner Mode (alta sustentação).",
  },
  {
    id: 4,
    question: "PERGUNTA 4 — Qual afirmação descreve melhor a unidade de potência da F1 em 2026?",
    options: [
      { letter: "A", text: "Ela utiliza exclusivamente um motor elétrico." },
      { letter: "B", text: "Ela utiliza apenas combustível, sem sistema elétrico." },
      { letter: "C", text: "Ela não precisa administrar energia durante a volta." },
      { letter: "D", text: "Ela combina combustão e sistemas elétricos de potência e recuperação de energia." },
    ],
    correctLetter: "D",
    feedback:
      "Perfeito! A unidade propulsora de 2026 é híbrida, unindo motor térmico a combustível 100% sustentável e motores elétricos de altíssima regeneração.",
  },
  {
    id: 5,
    question: "PERGUNTA 5 — Qual é a diferença básica entre potência e energia?",
    options: [
      { letter: "A", text: "São sempre a mesma coisa." },
      { letter: "B", text: "Potência indica a taxa de entrega de energia; energia é a quantidade disponível ou utilizada." },
      { letter: "C", text: "Energia só existe em motores elétricos." },
      { letter: "D", text: "Potência é uma medida exclusiva de velocidade." },
    ],
    correctLetter: "B",
    feedback:
      "Excelente! Potência é o ritmo instantâneo com que a energia é liberada, enquanto energia é o total acumulado que pode ser gerenciado na bateria e tanque.",
  },
  {
    id: 6,
    question: "PERGUNTA 6 — Qual é a melhor descrição do Boost Mode?",
    options: [
      { letter: "A", text: "Um recurso de utilização de potência que o piloto pode acionar conforme o sistema e as condições permitidas." },
      { letter: "B", text: "Um dispositivo que altera a cor do carro." },
      { letter: "C", text: "Um sistema exclusivo de frenagem." },
      { letter: "D", text: "Um mecanismo que garante ultrapassagens." },
    ],
    correctLetter: "A",
    feedback:
      "Correto! O Boost Mode permite que o piloto solicite picos calculados de potência elétrica suplementar, condicionados à energia acumulada e regras esportivas.",
  },
  {
    id: 7,
    question: "PERGUNTA 7 — O que é o Overtake Mode na F1 de 2026?",
    options: [
      { letter: "A", text: "O antigo DRS com outro nome e funcionamento necessariamente idêntico." },
      { letter: "B", text: "Um modo que permite ultrapassar qualquer carro sem restrições." },
      { letter: "C", text: "Um recurso regulamentado de energia adicional associado a condições de proximidade de outro carro." },
      { letter: "D", text: "Um sistema que elimina a necessidade de estratégia." },
    ],
    correctLetter: "C",
    feedback:
      "Muito bem! Substituindo o papel estratégico do DRS, o Overtake Mode concede uma liberação elétrica extra quando o piloto está colado no adversário.",
  },
  {
    id: 8,
    question: "PERGUNTA 8 — Para que serve a telemetria?",
    options: [
      { letter: "A", text: "Apenas para mostrar a classificação na televisão." },
      { letter: "B", text: "Para substituir os engenheiros." },
      { letter: "C", text: "Para garantir que o carro nunca apresente falhas." },
      { letter: "D", text: "Para coletar e analisar dados que ajudam a entender o desempenho e o funcionamento do carro." },
    ],
    correctLetter: "D",
    feedback:
      "Exato! Centenas de sensores mapeiam a dinâmica do carro, permitindo que piloto e engenheiros identifiquem pontos de melhoria a cada curva.",
  },
  {
    id: 9,
    question: "PERGUNTA 9 — Qual é a função da célula de sobrevivência e de outros sistemas de segurança?",
    options: [
      { letter: "A", text: "Tornar o carro indestrutível." },
      { letter: "B", text: "Ajudar a proteger o piloto por meio da estrutura e dos sistemas de segurança projetados para impactos e outros riscos." },
      { letter: "C", text: "Aumentar exclusivamente a velocidade em reta." },
      { letter: "D", text: "Substituir os equipamentos de proteção do piloto." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! O monocoque em compósito de carbono, o Halo em titânio e as estruturas deformáveis absorvem a energia do choque, salvando vidas.",
  },
  {
    id: 10,
    question: "PERGUNTA 10 — Como uma equipe deve investigar uma perda de desempenho?",
    options: [
      { letter: "A", text: "Analisar dados relevantes, identificar possíveis causas e avaliar as mudanças de maneira fundamentada." },
      { letter: "B", text: "Trocar todas as peças ao mesmo tempo." },
      { letter: "C", text: "Presumir que o motor é sempre o problema." },
      { letter: "D", text: "Ignorar as condições da pista." },
    ],
    correctLetter: "A",
    feedback:
      "Parabéns! Na engenharia de ponta, o rigor científico e a leitura meticulosa dos dados isolam as variáveis antes de qualquer ajuste mecânico.",
  },
]

export const MODULE_9_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — Ter a volta mais rápida da classificação garante vitória no domingo?",
    options: [
      { letter: "A", text: "Sim, quem larga na pole sempre tem o melhor ritmo." },
      { letter: "B", text: "Não, a corrida exige consistência, gerenciamento de pneus e leitura estratégica ao longo de várias voltas." },
      { letter: "C", text: "Não, porque o piloto da pole é obrigado a trocar de carro." },
      { letter: "D", text: "Sim, a pontuação da classificação é mais importante que a da corrida." },
    ],
    correctLetter: "B",
    feedback:
      "Exato! Uma volta rápida isolada garante apenas a posição de largada; a vitória depende de regularidade, pneus e decisões durante 300 km.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que caracteriza a resiliência emocional de um piloto de elite após um erro?",
    options: [
      { letter: "A", text: "Discutir imediatamente com a equipe pelo rádio para justificar a falha." },
      { letter: "B", text: "Acelerar sem critério para tentar recuperar o tempo na mesma volta." },
      { letter: "C", text: "Conter a frustração, resetar o foco mental e retomar o ritmo sem cometer novos erros em sequência." },
      { letter: "D", text: "Abandonar a prova por vergonha." },
    ],
    correctLetter: "C",
    feedback:
      "Perfeito! Erros acontecem com todos os pilotos; a velocidade com que se recupera o foco e a estabilidade emocional define os campeões.",
  },
  {
    id: 3,
    question: "Pergunta 3 — Por que a consistência volta a volta é frequentemente mais valiosa que picos isolados de velocidade?",
    options: [
      { letter: "A", text: "Porque reduz a imprevisibilidade para a equipe, preserva os pneus e acumula vantagem no tempo total de corrida." },
      { letter: "B", text: "Porque os comissários punem pilotos com voltas muito velozes." },
      { letter: "C", text: "Porque o carro ganha potência se mantiver o mesmo tempo." },
      { letter: "D", text: "Porque não há diferença de tempo no final da corrida." },
    ],
    correctLetter: "A",
    feedback:
      "Correto! Manter um ritmo estável com variação mínima protege os pneus contra picos térmicos e constrói janelas estratégicas perfeitas para o pit stop.",
  },
  {
    id: 4,
    question: "Pergunta 4 — O que é 'racecraft' na Fórmula 1?",
    options: [
      { letter: "A", text: "A capacidade do mecânico de trocar os pneus em menos de 2 segundos." },
      { letter: "B", text: "O conjunto de inteligência tática, posicionamento do carro, leitura dos rivais e habilidade em disputas roda a roda." },
      { letter: "C", text: "O design gráfico da pintura do carro." },
      { letter: "D", text: "A habilidade de pilotar no simulador sem usar as mãos." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! Racecraft é a arte da disputa: saber quando pressionar, onde colocar as rodas, como ler o adversário e escolher o momento fatal do ataque.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Como um piloto campeão costuma preparar uma ultrapassagem sobre um rival experiente?",
    options: [
      { letter: "A", text: "Mergulha às cegas em qualquer curva logo na primeira oportunidade." },
      { letter: "B", text: "Buzina e espera o adversário abrir espaço." },
      { letter: "C", text: "Observa os pontos fracos do rival por algumas voltas e prepara a manobra sacrificando a entrada de uma curva para ganhar velocidade na saída." },
      { letter: "D", text: "Aguarda obrigatoriamente a bandeira amarela." },
    ],
    correctLetter: "C",
    feedback:
      "Excelente! Manobras inteligentes como a 'tesoura' exigem abrir mão da entrada para ter aceleração máxima e tracionar à frente do rival na saída.",
  },
  {
    id: 6,
    question: "Pergunta 6 — Qual é a diferença fundamental entre desgaste mecânico e degradação térmica dos pneus?",
    options: [
      { letter: "A", text: "O desgaste mecânico é o atrito físico que consome a borracha; a degradação térmica é a perda de aderência causada pelo superaquecimento do composto." },
      { letter: "B", text: "Desgaste acontece apenas na chuva e degradação apenas no calor." },
      { letter: "C", text: "Não há diferença; são nomes idênticos para a mesma coisa." },
      { letter: "D", text: "A degradação térmica só afeta as rodas dianteiras." },
    ],
    correctLetter: "A",
    feedback:
      "Exato! Desgaste físico é o afinamento da banda de rodagem; degradação térmica ocorre quando o calor excessivo altera a química e a aderência da borracha.",
  },
  {
    id: 7,
    question: "Pergunta 7 — Por que comparar campeões como Senna, Schumacher, Hamilton e Verstappen apenas por estatísticas pode ser reducionista?",
    options: [
      { letter: "A", text: "Porque nenhum deles correu na Fórmula 1 moderna." },
      { letter: "B", text: "Porque cada um competiu em eras com regulamentos, tecnologias, níveis de confiabilidade mecânica e durações de calendário totalmente diferentes." },
      { letter: "C", text: "Porque as vitórias antigas não contavam pontos oficiais." },
      { letter: "D", text: "Porque todos tinham carros com motores e chassis idênticos." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! Cada era tem características próprias: número de GPs por ano, auxílios eletrônicos, confiabilidade dos motores e formato dos finais de semana.",
  },
  {
    id: 8,
    question: "Pergunta 8 — Em momentos de mudança climática ou safety car, qual postura mental separa os pilotos extraordinários?",
    options: [
      { letter: "A", text: "Pânico e recusa em falar com o engenheiro." },
      { letter: "B", text: "Capacidade de filtrar dados complexos, manter a calma e tomar decisões ágeis em sintonia com o pit wall." },
      { letter: "C", text: "Acelerar em bandeira vermelha para ganhar tempo." },
      { letter: "D", text: "Parar o carro na pista e esperar o sol voltar." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! No caos da chuva ou incidentes, a comunicação transparente e a leitura tática imediata convertem incerteza em vitórias espetaculares.",
  },
  {
    id: 9,
    question: "Pergunta 9 — O que significa 'fazer a tesoura' (cross-over) em uma disputa de posição?",
    options: [
      { letter: "A", text: "Cortar deliberadamente a asa dianteira do rival." },
      { letter: "B", text: "Deixar o adversário espalhar por dentro na curva para cruzar a linha por trás dele e tracionar melhor na saída." },
      { letter: "C", text: "Pedir autorização aos comissários para trocar de lado." },
      { letter: "D", text: "Ziguezaguear na reta para assustar quem vem atrás." },
    ],
    correctLetter: "B",
    feedback:
      "Excelente! O defensor entra rápido por dentro e perde velocidade no meio da curva; o atacante contorna por fora, cruza por trás e sai acelerando muito antes.",
  },
  {
    id: 10,
    question: "Pergunta 10 — Qual a melhor definição de 'mente de campeão' na Fórmula 1?",
    options: [
      { letter: "A", text: "Acreditar que a vitória depende exclusivamente da velocidade e ignorar a equipe." },
      { letter: "B", text: "A união harmônica entre talento natural, disciplina inabalável, consistência, leitura de contexto e constante adaptação às adversidades." },
      { letter: "C", text: "Nunca admitir erros e culpar o carro por qualquer revés." },
      { letter: "D", text: "Pilotar sempre a 100% do limite sem se preocupar com os pneus ou o motor." },
    ],
    correctLetter: "B",
    feedback:
      "Parabéns! Um campeão completo domina a técnica, o emocional, a simbiose com os engenheiros e a frieza para tomar decisões vencedoras em frações de segundo.",
  },
]

export const MODULE_8_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Pergunta 1 — O que é a racing line?",
    options: [
      { letter: "A", text: "O caminho mais rápido possível em todas as situações, sem exceção." },
      { letter: "B", text: "Uma trajetória escolhida para contornar o circuito com eficiência." },
      { letter: "C", text: "A linha branca que delimita a pista." },
      { letter: "D", text: "O caminho usado exclusivamente durante a chuva." },
    ],
    correctLetter: "B",
    feedback:
      "Correto! A racing line é a trajetória geométrica e dinâmica que maximiza o raio de curva e a velocidade média na volta.",
  },
  {
    id: 2,
    question: "Pergunta 2 — O que é o ápice de uma curva?",
    options: [
      { letter: "A", text: "O ponto mais distante da curva." },
      { letter: "B", text: "O início da reta principal." },
      { letter: "C", text: "A região em que o carro passa próximo à parte interna do traçado." },
      { letter: "D", text: "O ponto em que o piloto sempre precisa frear." },
    ],
    correctLetter: "C",
    feedback:
      "Exato! O ápice (apex ou ponto de tangência) é o ponto interno da curva onde o carro completa a rotação para iniciar a aceleração de saída.",
  },
  {
    id: 3,
    question: "Pergunta 3 — O que significa ponto de frenagem?",
    options: [
      { letter: "A", text: "O local de referência em que o piloto inicia a frenagem para uma curva." },
      { letter: "B", text: "O lugar em que todos os carros precisam parar." },
      { letter: "C", text: "O ponto em que o carro troca de marcha automaticamente." },
      { letter: "D", text: "A área reservada aos mecânicos." },
    ],
    correctLetter: "A",
    feedback:
      "Muito bem! É o ponto de referência visual (como placas de 100m ou marcas de asfalto) onde o piloto aplica pressão máxima no freio.",
  },
  {
    id: 4,
    question: "Pergunta 4 — Por que a saída de uma curva lenta é importante?",
    options: [
      { letter: "A", text: "Porque elimina a necessidade de frear na curva seguinte." },
      { letter: "B", text: "Porque pode influenciar a aceleração e a velocidade na reta seguinte." },
      { letter: "C", text: "Porque sempre permite ultrapassar outro carro." },
      { letter: "D", text: "Porque impede o desgaste dos pneus." },
    ],
    correctLetter: "B",
    feedback:
      "Perfeito! Uma saída eficiente permite acelerar a fundo mais cedo, carregando maior velocidade final por toda a reta seguinte.",
  },
  {
    id: 5,
    question: "Pergunta 5 — Qual afirmação sobre curvas rápidas está correta?",
    options: [
      { letter: "A", text: "Elas não exigem atenção à aderência." },
      { letter: "B", text: "O piloto deve sempre frear no ápice." },
      { letter: "C", text: "A estabilidade e a aderência são importantes para contorná-las." },
      { letter: "D", text: "Elas são iguais em todos os circuitos." },
    ],
    correctLetter: "C",
    feedback:
      "Correto! Em curvas de alta velocidade, a carga aerodinâmica (downforce) e a estabilidade do chassi mantêm o carro colado ao chão.",
  },
  {
    id: 6,
    question: "Pergunta 6 — O que pode acontecer se o piloto acelerar excessivamente na saída de uma curva?",
    options: [
      { letter: "A", text: "O carro necessariamente ganha aderência." },
      { letter: "B", text: "Os pneus deixam de sofrer desgaste." },
      { letter: "C", text: "O carro passa a frear automaticamente." },
      { letter: "D", text: "Pode haver perda de tração e dificuldade para manter o controle." },
    ],
    correctLetter: "D",
    feedback:
      "Exato! Excesso de aceleração com o volante esterçado esgota a aderência dos pneus traseiros, provocando sobresterço ou derrapagem.",
  },
  {
    id: 7,
    question: "Pergunta 7 — A trajetória ideal é sempre a mesma em pista seca e molhada?",
    options: [
      { letter: "A", text: "Sim, sem nenhuma exceção." },
      { letter: "B", text: "Não. A aderência e as condições podem exigir adaptações." },
      { letter: "C", text: "Sim, porque os pneus sempre têm a mesma aderência." },
      { letter: "D", text: "Não, porque a chuva elimina completamente a possibilidade de contornar curvas." },
    ],
    correctLetter: "B",
    feedback:
      "Muito bem! Na chuva, o emborrachamento do traçado seco fica ensaboado, forçando o piloto a contornar por fora, onde há mais atrito.",
  },
  {
    id: 8,
    question: "Pergunta 8 — Qual característica está especialmente associada a Monza?",
    options: [
      { letter: "A", text: "Apenas curvas lentas e barreiras próximas." },
      { letter: "B", text: "Um circuito sem retas longas." },
      { letter: "C", text: "Longas retas e zonas de frenagem importantes." },
      { letter: "D", text: "Uma pista exclusivamente molhada." },
    ],
    correctLetter: "C",
    feedback:
      "Excelente! Monza é o Templo da Velocidade, famoso pelas retas de mais de 340 km/h e fortes desacelerações para chicanes históricas.",
  },
  {
    id: 9,
    question: "Pergunta 9 — Por que é importante respeitar os limites de pista?",
    options: [
      { letter: "A", text: "Porque eles fazem parte das condições de segurança e das regras esportivas." },
      { letter: "B", text: "Porque o carro não consegue andar sobre as zebras em nenhuma situação." },
      { letter: "C", text: "Porque todos os erros de trajetória são automaticamente iguais." },
      { letter: "D", text: "Porque os pilotos precisam permanecer no centro da pista o tempo todo." },
    ],
    correctLetter: "A",
    feedback:
      "Perfeito! Os limites de pista garantem a integridade esportiva e evitam que carros utilizem áreas de escape perigosas para ganhar tempo.",
  },
  {
    id: 10,
    question: "Pergunta 10 — O que mais representa uma volta eficiente?",
    options: [
      { letter: "A", text: "Acelerar ao máximo em todas as curvas." },
      { letter: "B", text: "Utilizar sempre a trajetória mais curta, mesmo perdendo velocidade." },
      { letter: "C", text: "Frear o mais tarde possível em todas as situações." },
      { letter: "D", text: "Combinar trajetória, frenagem, aderência, aceleração e consistência de acordo com as condições." },
    ],
    correctLetter: "D",
    feedback:
      "Parabéns! Uma volta perfeita é o resultado harmonioso entre técnica de pilotagem, respeito à física dos pneus e consistência curva por curva.",
  },
]

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
const STORAGE_MOD8_KEY = "f1_novatos_mod8_state_v1"
const STORAGE_MOD9_KEY = "f1_novatos_mod9_state_v1"
const STORAGE_MOD10_KEY = "f1_novatos_mod10_state_v1"
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



export function getModuleHeroBackground(moduleId: number): string {
  switch (moduleId) {
    case 1:
      return "/backgrounds/bg-ferrari.webp"
    case 2:
      return "/backgrounds/bg-default.webp"
    case 3:
      return "/backgrounds/bg-mclaren.webp"
    case 4:
    case 5:
      return "/backgrounds/bg-redbull.webp"
    case 6:
      return "/novatos/modulo1/cena02_1950.jpg"
    case 7:
      return "/backgrounds/bg-mercedes.webp"
    case 8:
      return "/backgrounds/bg-aston.webp"
    case 9:
      return "/backgrounds/bg-redbull.webp"
    case 10:
    default:
      return "/backgrounds/bg-audi.webp"
  }
}

export function NovatosPage() {
  // ==========================================================================
  // ESTADO DO MÓDULO ATIVO (MÓDULO 1 OU MÓDULO 2)
  // ==========================================================================
  const [activeModuleId, setActiveModuleId] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const modParam = urlParams.get("modulo") || urlParams.get("mod")
      if (modParam === "10") return 10
      if (modParam === "9") return 9
      if (modParam === "8") return 8
      if (modParam === "7") return 7
      if (modParam === "6") return 6
      if (modParam === "5") return 5
      if (modParam === "4") return 4
      if (modParam === "3") return 3
      if (modParam === "2") return 2
      const saved = localStorage.getItem(STORAGE_ACTIVE_MODULE_KEY)
      if (saved === "10") return 10
      if (saved === "9") return 9
      if (saved === "8") return 8
      if (saved === "7") return 7
      if (saved === "6") return 6
      if (saved === "5") return 5
      if (saved === "4") return 4
      if (saved === "3") return 3
      if (saved === "2") return 2
    }
    return 1
  })

  const currentScenes = activeModuleId === 1 ? MODULE_1_SCENES : activeModuleId === 2 ? MODULE_2_SCENES : activeModuleId === 3 ? MODULE_3_SCENES : activeModuleId === 4 ? MODULE_4_SCENES : activeModuleId === 5 ? MODULE_5_SCENES : activeModuleId === 6 ? MODULE_6_SCENES : activeModuleId === 7 ? MODULE_7_SCENES : activeModuleId === 8 ? MODULE_8_SCENES : activeModuleId === 9 ? MODULE_9_SCENES : MODULE_10_SCENES
  const currentQuizQuestions = activeModuleId === 1 ? MODULE_1_QUIZ_QUESTIONS : activeModuleId === 2 ? MODULE_2_QUIZ_QUESTIONS : activeModuleId === 3 ? MODULE_3_QUIZ_QUESTIONS : activeModuleId === 4 ? MODULE_4_QUIZ_QUESTIONS : activeModuleId === 5 ? MODULE_5_QUIZ_QUESTIONS : activeModuleId === 6 ? MODULE_6_QUIZ_QUESTIONS : activeModuleId === 7 ? MODULE_7_QUIZ_QUESTIONS : activeModuleId === 8 ? MODULE_8_QUIZ_QUESTIONS : activeModuleId === 9 ? MODULE_9_QUIZ_QUESTIONS : MODULE_10_QUIZ_QUESTIONS
  const currentStorageKey = activeModuleId === 1 ? STORAGE_MOD1_KEY : activeModuleId === 2 ? STORAGE_MOD2_KEY : activeModuleId === 3 ? STORAGE_MOD3_KEY : activeModuleId === 4 ? STORAGE_MOD4_KEY : activeModuleId === 5 ? STORAGE_MOD5_KEY : activeModuleId === 6 ? STORAGE_MOD6_KEY : activeModuleId === 7 ? STORAGE_MOD7_KEY : activeModuleId === 8 ? STORAGE_MOD8_KEY : activeModuleId === 9 ? STORAGE_MOD9_KEY : STORAGE_MOD10_KEY

  // Stage: "opening" (Hero Landing), "lesson" (Scenes 1-8), "quiz" (Final Test)
  const [viewStage, setViewStage] = useState<"opening" | "lesson" | "quiz">("opening")

  // Scene Navigation
  const [sceneIndex, setSceneIndex] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const modParam = urlParams.get("modulo") || urlParams.get("mod")
      const mod = Number(modParam) || 1
      const key = mod === 1 ? STORAGE_MOD1_KEY : mod === 2 ? STORAGE_MOD2_KEY : mod === 3 ? STORAGE_MOD3_KEY : mod === 4 ? STORAGE_MOD4_KEY : mod === 5 ? STORAGE_MOD5_KEY : mod === 6 ? STORAGE_MOD6_KEY : mod === 7 ? STORAGE_MOD7_KEY : mod === 8 ? STORAGE_MOD8_KEY : mod === 9 ? STORAGE_MOD9_KEY : STORAGE_MOD10_KEY
      const s = loadPersistedState(key)
      if (typeof s.lastSceneIndex === "number" && s.lastSceneIndex >= 0 && s.lastSceneIndex < 8) {
        return s.lastSceneIndex
      }
    }
    return 0
  })
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

  // Accessibility & UI Modals
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [glossarySearch, setGlossarySearch] = useState("")
  const [isTranscriptionOpen, setIsTranscriptionOpen] = useState(false)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Sincronização em Tempo Real com a Narração de Mariana (em segundos)
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0)

  // Quiz State
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({})
  const [quizSelectedOption, setQuizSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [quizShowFeedback, setQuizShowFeedback] = useState(false)

  // Audio References
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const radioAudioRef = useRef<HTMLAudioElement | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoPlayNextSceneRef = useRef<boolean>(false)

  // Web Audio API References
  const audioContextRef = useRef<AudioContext | null>(null)
  const narrationGainRef = useRef<GainNode | null>(null)
  const musicGainRef = useRef<GainNode | null>(null)
  const narrationSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
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



      isAudioContextInitRef.current = true
    } catch (err) {
      console.warn("Web Audio API GainNodes já conectados ou indisponíveis:", err)
    }

    // Aplica volumes imediatamente
    const currentNarrationVol = isMuted ? 0 : narrationVolume
    const currentMusicVol = isMuted || !isMusicActive ? 0 : musicVolume

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


  }, [isMuted, isMusicActive, narrationVolume, musicVolume, activeModuleId])

  // Carrega estado persistido
  useEffect(() => {
    const state = loadPersistedState(currentStorageKey)
    setVisitedScenes(state.visitedScenes)
    setQuizCompleted(state.quizCompleted)
    setQuizScore(state.quizScore)
    const maxLen = currentScenes.length
    if (typeof state.lastSceneIndex === "number" && state.lastSceneIndex >= 0 && state.lastSceneIndex < maxLen) {
      setSceneIndex(state.lastSceneIndex)
    }
  }, [currentStorageKey, currentScenes.length])

  // Troca de módulo (Módulo 1 a 8)
  const handleSelectModule = useCallback(
    (modId: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10) => {
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


      setActiveModuleId(modId)
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_ACTIVE_MODULE_KEY, String(modId))
        const url = new URL(window.location.href)
        url.searchParams.set("modulo", String(modId))
        window.history.replaceState({}, "", url.toString())
      }

      // Carrega estado do novo módulo
      const targetKey = modId === 1 ? STORAGE_MOD1_KEY : modId === 2 ? STORAGE_MOD2_KEY : modId === 3 ? STORAGE_MOD3_KEY : modId === 4 ? STORAGE_MOD4_KEY : modId === 5 ? STORAGE_MOD5_KEY : modId === 6 ? STORAGE_MOD6_KEY : modId === 7 ? STORAGE_MOD7_KEY : modId === 8 ? STORAGE_MOD8_KEY : modId === 9 ? STORAGE_MOD9_KEY : STORAGE_MOD10_KEY
      const maxLen = modId === 1 ? MODULE_1_SCENES.length : modId === 2 ? MODULE_2_SCENES.length : modId === 3 ? MODULE_3_SCENES.length : modId === 4 ? MODULE_4_SCENES.length : modId === 5 ? MODULE_5_SCENES.length : modId === 6 ? MODULE_6_SCENES.length : modId === 7 ? MODULE_7_SCENES.length : modId === 8 ? MODULE_8_SCENES.length : modId === 9 ? MODULE_9_SCENES.length : MODULE_10_SCENES.length
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

    // Quando Mariana fala, a música abaixa para 22%
    if (isPlaying && targetNarration > 0) {
      targetMusic = targetMusic * 0.22
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

    } else {
      if (narrationAudioRef.current) narrationAudioRef.current.volume = targetNarration
      if (musicAudioRef.current) musicAudioRef.current.volume = targetMusic
    }
  }, [isPlaying, isMuted, isMusicActive, narrationVolume, musicVolume, activeModuleId])

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
    autoPlayNextSceneRef.current = false
  }, [clearCountdownTimer])

  // Para todo o áudio da cena
  const stopAllAudio = useCallback(() => {
    clearCountdownTimer()
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
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
      setAudioCurrentTime(0)
      setSceneIndex(index)
      setVisitedScenes((prev) => (prev.includes(index + 1) ? prev : [...prev, index + 1]))
      setViewStage("lesson")
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
        autoPlayNextSceneRef.current = true
        goToScene(sceneIndex + 1)
      } else {
        // Na última cena, preserva a navegação e não força saída automática do módulo
        setIsPlaying(false)
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
      setIsPlaying(false)
    } else {
      if (musicAudioRef.current && isMusicActive && !isMuted) {
        musicAudioRef.current.play().catch(() => {})
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

  }, [initWebAudioContext, clearCountdownTimer, activeModuleId])

  // Reproduz automaticamente a narração da nova cena se acionada por avanço ou início
  useEffect(() => {
    if (viewStage !== "lesson") return

    if (autoPlayNextSceneRef.current) {
      autoPlayNextSceneRef.current = false
      initWebAudioContext()

      // Trilha sonora
      if (musicAudioRef.current && isMusicActive && !isMuted && musicAudioRef.current.paused) {
        musicAudioRef.current.play().catch(() => {})
      }

      // Narração da nova cena
      if (narrationAudioRef.current) {
        narrationAudioRef.current.currentTime = 0
        const playPromise = narrationAudioRef.current.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
            })
            .catch((err) => {
              console.warn("Autoplay da narração bloqueado pelo navegador:", err)
              setIsPlaying(false)
            })
        }
      }
    }
  }, [sceneIndex, viewStage, isMusicActive, isMuted, initWebAudioContext])

  // Iniciar Experiência (Cena 1 começa com narração automática)
  const handleStartExperience = useCallback(() => {
    initWebAudioContext()
    clearCountdownTimer()
    setViewStage("lesson")
    autoPlayNextSceneRef.current = true
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
  // ==========================================================================
  // RENDERIZADOR VISUAL ULTRA-LIMPO E CINEMATOGRÁFICO POR CENA
  // Diretriz: A Mariana explica, a imagem demonstra e o texto apenas destaca o essencial.
  // Centro 100% desobstruído; textos nas extremidades; uma informação por vez.
  // ==========================================================================
  const renderVisualOverlay = () => {
    // Cápsula horizontal flutuante na faixa inferior discreta (sincronizada com Mariana)
    const renderMarianaSyncBadge = (conceptTitle: string, shortDesc?: string) => {
      const cleanT = conceptTitle.replace(/^\d+[.\s-]+/, "").toUpperCase()
      const cleanD = shortDesc ? shortDesc.split(/[.;:]/)[0].trim() : ""

      return (
        <div className="pointer-events-auto w-fit max-w-[92%] sm:max-w-2xl mx-auto mb-2 rounded-full bg-black/75 border border-white/15 px-4 py-1.5 backdrop-blur-md shadow-2xl animate-fade-in flex items-center justify-center gap-2.5 text-center transition-all duration-300">
          <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs font-mono font-black uppercase text-white tracking-wider shrink-0">
            {cleanT}
          </span>
          {cleanD && (
            <>
              <span className="text-zinc-500 text-xs hidden sm:inline">•</span>
              <span className="text-[11px] sm:text-xs text-zinc-300 font-medium truncate max-w-xs sm:max-w-md hidden sm:inline">
                {cleanD}
              </span>
            </>
          )}
        </div>
      )
    }

    // Extremidade superior: Título à esquerda, dado essencial à direita (sem linhas divisórias invasivas)
    const renderTopHUD = (title: string, tag?: string) => (
      <div className="w-full flex items-center justify-between pointer-events-none mb-auto">
        <span className="pointer-events-auto text-[10px] sm:text-[11px] font-mono font-black uppercase text-zinc-200 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-md">
          {title}
        </span>
        {tag && (
          <span className="pointer-events-auto text-[9px] sm:text-[10px] font-mono font-bold uppercase text-cyan-400 bg-black/60 border border-cyan-500/20 px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-md">
            {tag}
          </span>
        )}
      </div>
    )

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 1: rear_shimmer
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "rear_shimmer") {
      const cueIndex = audioCurrentTime < 4.5 ? 1 : audioCurrentTime < 9.5 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("O UNIVERSO DA FÓRMULA 1", "ABERTURA")}
          <div className="flex-1 pointer-events-none relative flex items-center justify-center">
            <div className="pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#E10600]/80 shadow-[0_0_35px_#E10600] animate-pulse" />
          </div>
          {cueIndex === 1 && renderMarianaSyncBadge("O Pináculo da Velocidade", "Engenharia e talento humano no limite absoluto")}
          {cueIndex === 2 && renderMarianaSyncBadge("Os 4 Pilares da F1", "Velocidade, estratégia, talento e trabalho em equipe")}
          {cueIndex === 3 && renderMarianaSyncBadge("Guia do Iniciante", "Conceitos essenciais explicados curva por curva")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 2: vintage_1950
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "vintage_1950") {
      const cueIndex = audioCurrentTime < 7.5 ? 1 : audioCurrentTime < 15.5 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("O NASCIMENTO DA F1 • 1950", "SILVERSTONE")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Origem dos Monopostos", "Carros clássicos sem asas ou eletrônica")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Primeiro Mundial FIA", "13 de maio de 1950 em Silverstone")}
          {cueIndex === 3 && renderMarianaSyncBadge("Evolução Global", "75 anos de coragem e velocidade")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 3: parallax_track
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "parallax_track") {
      const cueIndex = audioCurrentTime < 6.0 ? 1 : audioCurrentTime < 12.0 ? 2 : audioCurrentTime < 18.0 ? 3 : 4
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("O SIGNIFICADO DA F1", "REGULAMENTOS FIA")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A 'Fórmula'", "Regras técnicas e teto orçamentário iguais para todos")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Categoria Rainha", "Monopostos no topo da pirâmide sob forças de até 5G")}
          {cueIndex === 3 && renderMarianaSyncBadge("Bastidores & Pit Stops", "Paradas de 2 segundos conectadas ao pit wall")}
          {cueIndex === 4 && renderMarianaSyncBadge("Dois Campeonatos", "Mundial de Pilotos e Construtores disputados em paralelo")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 4: machine_hotspots
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "machine_hotspots") {
      const cueIndex =
        audioCurrentTime < 4.2 ? 1 :
        audioCurrentTime < 11.2 ? 2 :
        audioCurrentTime < 18.8 ? 3 :
        audioCurrentTime < 26.8 ? 4 : 5
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("A MÁQUINA", "SISTEMAS INTEGRADOS")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Engenharia no Limite", "Monoposto de alta precisão projetado para máxima performance")}
          {cueIndex === 2 && renderMarianaSyncBadge("Aerodinâmica & Downforce", "Pressão do ar empurra o carro contra o solo gerando aderência")}
          {cueIndex === 3 && renderMarianaSyncBadge("Aderência & Frenagem", "Pneus no asfalto e discos de carbono dissipando energia cinética")}
          {cueIndex === 4 && renderMarianaSyncBadge("Unidade de Potência Híbrida", "Motor de combustão V6 Turbo e recuperação de energia elétrica")}
          {cueIndex === 5 && renderMarianaSyncBadge("Integração Total", "Sistemas mecânicos, elétricos e aerodinâmicos em harmonia")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 5: pitstop_team
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "pitstop_team") {
      const cueIndex =
        audioCurrentTime < 4.2 ? 1 :
        audioCurrentTime < 11.0 ? 2 :
        audioCurrentTime < 16.5 ? 3 : 4
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PILOTOS E EQUIPES", audioCurrentTime >= 16.3 ? "SAÍDA LIBERADA" : "PIT STOP EM ANDAMENTO")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Duas Disputas Simultâneas", "Mundial de Pilotos e Construtores em paralelo")}
          {cueIndex === 2 && renderMarianaSyncBadge("Posicionamento no Box", "Piloto freia no colchete demarcado")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pit Stop de 2 Segundos", "Mecânicos erguem o carro e trocam os 4 pneus")}
          {cueIndex === 4 && renderMarianaSyncBadge("Trabalho de Equipe & Saída", "Luz verde ativada e aceleração imediata")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 6: starting_grid
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "starting_grid") {
      const cueIndex = audioCurrentTime < 13.8 ? 1 : audioCurrentTime < 17.6 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PROCEDIMENTO DE LARGADA", audioCurrentTime >= 17.6 ? "LARGADA AUTORIZADA" : "GRID OFICIAL FIA")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Formação do Grid", "Pilotos alinham os carros nos colchetes")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sequência de 5 Luzes", "Acendimento progressivo e expectativa máxima")}
          {cueIndex === 3 && renderMarianaSyncBadge("Luzes Apagadas!", "Arrancada imediata rumo à primeira curva")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 7: telemetry_wall
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "telemetry_wall") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("O QUE OBSERVAR", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("LEITURA DA TORRE DE TEMPOS", "Observe o GAP para saber quem lidera e o INT para an…")}
          {cueIndex === 2 && renderMarianaSyncBadge("PNEUS E RITMO DE CORRIDA", "A degradação dos pneus define a hora exata da parada…")}
          {cueIndex === 3 && renderMarianaSyncBadge("VITÓRIA PELA ESTRATÉGIA", "Muitas posições são ganhas na eficiência do pit stop…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 1 • CENA 8: checkered_finish
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "checkered_finish") {
      const cueIndex = audioCurrentTime < 5.0 ? 1 : 2
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("A BANDEIRADA FINAL", "MÓDULO 01 CONCLUÍDO")}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Linha de Chegada", "A consagração de uma corrida perfeita")}
          {cueIndex === 2 && renderMarianaSyncBadge("Módulo 1 Concluído!", "Você já compreende os fundamentos da F1")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 1: mod2_machine_overview
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_machine_overview") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ANATOMIA E HARMONIA DA MÁQUINA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Sistemas em Harmonia Perfeita", "A velocidade nasce da integração conjunta entre aero…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sensibilidade Extrema de Acerto", "Mudanças mínimas na asa ou na pressão dos pneus tran…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Organismo Único no Limite", "O piloto traduz o comportamento físico do carro para…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 2: mod2_aerodynamics
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_aerodynamics") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("AERODINÂMICA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Aderência em Alta Velocidade", "O ar empurra o carro para baixo, aumentando o atrito…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Barreira Invisível nas Retas", "A resistência do ar freia o monoposto, exigindo comp…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Eficiência Aerodinâmica L/D", "Engenheiros equilibram sustentação negativa e arrast…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 3: mod2_tires
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_tires") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PNEUS PIRELLI 18\"", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Ponto de Contato com a Pista", "Pneus frios não geram atrito químico com o asfalto")}
          {cueIndex === 2 && renderMarianaSyncBadge("Aderência vs Durabilidade", "O pneu mais macio oferece velocidade imediata, mas o…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Drenagem Extrema Contra Aquaplanagem", "Intermediários e pneus de chuva pesada canalizam a á…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 4: mod2_steering_wheel
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_steering_wheel") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("VOLANTE MULTIFUNCIONAL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Mais que um Volante de Direção", "Reúne dezenas de controles de telemetria, regulagens…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Paddles de Marcha e Balanço", "Trocas sequenciais sem tirar as mãos do volante e aj…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Comunicação e Tempos de Volta", "O piloto monitora tempos delta, marcha e rotação enq…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 5: mod2_brakes
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_brakes") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("FREIOS DE CARBONO-CARBONO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Desaceleração a Mais de 1.000°C", "A energia cinética é convertida em calor brutal em p…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Dutos de Resfriamento", "O ar frio é conduzido diretamente aos tambores de ro…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Equilíbrio entre Eixos Dianteiro e Traseiro", "Evita o travamento das rodas traseiras antes do pilo…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 6: mod2_power_unit
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_power_unit") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("UNIDADE DE POTÊNCIA HÍBRIDA 2026", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Motor V6 Turbo 1.6L Eficiente", "Alimentado integralmente por combustíveis 100% suste…")}
          {cueIndex === 2 && renderMarianaSyncBadge("MGU-K Elétrico de 350 kW", "Recupera energia cinética nas frenagens, armazenando…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Potência Instantânea Extra", "Liberação tática de energia para ultrapassagens e re…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 7: mod2_setup_strategy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_setup_strategy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ACERTO MECÂNICO VS ESTRATÉGIA DE CORRIDA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Pistas de Velocidade Pura", "As equipes reduzem as asas para cortar o arrasto e v…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Circuitos Urbanos e Sinuosos", "Aumentam os flaps para garantir aderência em curvas…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Diferença Conceitual", "O acerto prepara a máquina na garagem antes da largada")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2 • CENA 8: mod2_full_integration
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod2_full_integration") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 02 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Harmonia dos Sistemas", "A velocidade é a soma equilibrada de todas as áreas…")}
          {cueIndex === 2 && renderMarianaSyncBadge("No Limite da Física", "Agora que você conhece a máquina, avance para o quiz…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 1: mod3_weekend_format
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_weekend_format") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("O FORMATO DO FIM DE SEMANA DE GP", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("TL1 e TL2 em Pista Aberta", "As equipes rodam centenas de voltas para calibrar al…")}
          {cueIndex === 2 && renderMarianaSyncBadge("TL3 e a Disputa da Classificação", "A pressão sobe no sábado com a busca pela volta perf…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Domingo de Corrida & Formato Sprint", "A prova máxima de 305 km onde estratégia e ritmo de…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 2: mod3_practice_analysis
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_practice_analysis") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TREINOS LIVRES", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Ilusão da Volta Mais Rápida", "Liderar o treino livre nem sempre significa ser o ma…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Simulando as Condições da Corrida", "Equipes rodam com peso elevado para medir a degradaç…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Asas Novas e Mapas de Injeção", "Tinta aerodinâmica (Flow-Vis) e grades pitot analisa…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 3: mod3_qualifying_grid
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_qualifying_grid") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("CLASSIFICAÇÃO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Eliminação dos 5 Últimos", "Todos os 20 carros na pista")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Fronteira do Top 10", "Quinze pilotos disputam dez vagas")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Volta Perfeita", "Dez carros em busca do limite absoluto em busca do p…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 4: mod3_start_sequence
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_start_sequence") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PROCEDIMENTO OFICIAL DE LARGADA FIA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Volta de Apresentação Finalizada", "Os vinte monopostos encaixam-se nos colchetes pintad…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sequência de 1 em 1 Segundo", "Motores em rotação máxima, embreagens acionadas e te…")}
          {cueIndex === 3 && renderMarianaSyncBadge("O Apagamento Simultâneo", "A largada é dada exatamente quando as luzes apagam a…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 5: mod3_race_tower
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_race_tower") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TRANSMISSÃO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Painel de Bordo do Telespectador", "A barra esquerda da transmissão informa posições, tr…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Distância para o Líder da Prova", "Mostra a distância em segundos acumulada entre qualq…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Diferença para o Carro da Frente", "Quando o INT é menor que 1 segundo, o piloto está na…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 6: mod3_pitstop_strategy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_pitstop_strategy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("BOXES", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Troca em Poucos Batimentos", "Uma porca única central e pistolas pneumáticas de al…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Obrigatoriedade de Dois Compostos", "Regra desportiva que força pelo menos uma troca de p…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Janela de Retorno no Tráfego", "A equipe precisa calcular a volta de saída para evit…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 7: mod3_flags_safety_car
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_flags_safety_car") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("SEGURANÇA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Comunicação Visual Imediata", "Amarela exige cautela e proíbe ultrapassagens")}
          {cueIndex === 2 && renderMarianaSyncBadge("Neutralização de Ritmo", "O Safety Car agrupa o pelotão")}
          {cueIndex === 3 && renderMarianaSyncBadge("Interrupção e Retardatários", "Bandeira vermelha recolhe os carros ao pit lane")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 3 • CENA 8: mod3_finish_championship
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod3_finish_championship") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 03 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Chegada Gloriosa", "Agitada na linha de chegada para saudar o vencedor d…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Tabela Oficial da FIA", "25 pontos para a vitória descendo progressivamente a…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pilotos e Construtores", "Cada ponto alimenta a glória individual do piloto e…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 1: mod4_roles_strategy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_roles_strategy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("QUEM DECIDE A ESTRATÉGIA NO PIT WALL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Sensibilidade ao Volante", "O piloto sente a aderência na ponta dos dedos e aler…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Engenheiro de Corrida", "Traduz as angústias do piloto em parâmetros técnicos…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Simulações no Pit Wall e Fábrica", "Supercomputadores calculam a probabilidade de vitóri…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 2: mod4_tire_choice_sim
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_tire_choice_sim") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ESTRATÉGIA DE PNEUS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Escolha de Três Compostos", "A fabricante escolhe três compostos seguidos para ca…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Perda Química de Aderência", "O calor excessivo desestrutura as moléculas da borra…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Queda Abrupta de Performance", "O momento em que os tempos de volta despencam 2 a 3…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 3: mod4_pitstop_timing_calc
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_pitstop_timing_calc") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("JANELA DE BOXES", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Delta Temporal da Parada", "Durante o pit stop, os adversários na pista percorre…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Clean Air para o Pneu Novo", "Em ar limpo, o piloto consegue extrair 100% da aderê…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Box, Box, Box!", "A ordem pelo rádio ocorre no momento exato em que a…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 4: mod4_safety_car_rain
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_safety_car_rain") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("DUELO TÁTICO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Velocidade do Pneu Novo", "Parar antes antecipa o ritmo alto da borracha fresca…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Estender o Stint em Ar Limpo", "Funciona quando o adversário pega carros lentos na s…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Leitura da Pista em Fração de Segundo", "Estrategistas monitoram o cronômetro para antecipar…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 5: mod4_telemetry_radio_data
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_telemetry_radio_data") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("COMUNICAÇÃO DE RÁDIO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Planos A, B e C no Rádio", "As equipes utilizam nomenclaturas codificadas para d…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Gestão Sem Distração a 300 km/h", "O engenheiro fala apenas em trechos de reta para não…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Simbiose que Ganha Provas", "A decisão final é um pacto entre os dados do muro e…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 6: mod4_alternate_plans
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_alternate_plans") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TELEMETRIA DE RITMO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Monitoramento Volta a Volta", "Engenheiros acompanham a curva de tempo em busca dos…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Simulação de Milhões de Cenários", "Modelos matemáticos prevêem em que posição exata o c…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Mudança de Plano Instantânea", "Se a degradação for menor que o esperado, a equipe e…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 7: mod4_strategist_challenge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_strategist_challenge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("IMPREVISTOS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Vantagem do Safety Car", "Trocar pneus durante a neutralização economiza tempo…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Chuva Iminente no Radar", "O radar acusa chuva em cinco voltas")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Decisão de Milissegundos", "Estrategistas campeões destacam-se pela coragem de r…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 4 • CENA 8: mod4_strategic_thinking_summary
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod4_strategic_thinking_summary") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 04 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Estratégia Além da Velocidade Bruta", "A corrida não é vencida apenas pelo carro mais rápid…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Avalie seu Conhecimento Tático", "Avance para o quiz de dez perguntas e teste seu raci…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 1: mod5_overtaking_anatomy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_overtaking_anatomy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ANATOMIA DE UMA ULTRAPASSAGEM", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Manobra Começa Muito Antes", "Observar a distância e aproveitar o vácuo na reta pr…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Linha Interna vs Externa", "A linha interna garante preferência no apex, mas exi…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Velocidade Não Dá Direito Automático", "A manobra precisa acontecer de maneira limpa, contro…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 2: mod5_attack_tech_2026
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_attack_tech_2026") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("VÁCUO (SLIPSTREAM)", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Aproveitando a Menor Resistência", "Andar na esteira do líder reduz a força contrária do…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Defesa Preventiva na Reta", "O líder move-se uma vez para o lado para tirar o adv…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Saindo da Esteira de Turbulência", "No ponto de freada, o piloto sai do vácuo para frear…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 3: mod5_defense_limits
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_defense_limits") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("FRENAGEM & APEX", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Mais Tarde Sem Travar Rodas", "Frear meio metro depois pode garantir a liderança, m…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Direito a Espaço na Curva", "Estando lado a lado no ponto de tangência, o piloto…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Quem Acelera Primeiro Vence", "Ultrapassagens muitas vezes são decididas na retomad…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 4: mod5_side_by_side_rules
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_side_by_side_rules") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("DEFESA DE POSIÇÃO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Proibido Ziguezaguear na Reta", "A FIA permite proteger a linha interna apenas uma vez")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sem Mudar de Direção na Frenagem", "Com as forças de frenagem no ápice, qualquer guinada…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Firmeza com Respeito", "A melhor defesa é o posicionamento prévio correto do…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 5: mod5_track_limits_runoff
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_track_limits_runoff") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TECNOLOGIA 2026", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Aerodinâmica Ativa Integrada", "Em 2026, as asas dianteira e traseira movimentam-se…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Disparo de Energia Elétrica", "O sistema elétrico MGU-K entrega potência suplementa…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Bateria do Líder", "O piloto da frente pode contra-atacar usando sua pró…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 6: mod5_stewards_investigations
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_stewards_investigations") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("LIMITES DE PISTA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Limite Físico e Legal", "Pelo menos uma roda precisa manter contato visual ou…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sair da Pista para Ultrapassar", "Utilizar as áreas de escape para contornar o rival c…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Devolução Imediata", "Ceder a posição de volta antes da intervenção dos co…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 7: mod5_overtaking_challenges
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_overtaking_challenges") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("DIREÇÃO DE PROVA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Alerta Oficial na Tela", "A Direção de Prova envia o caso aos quatro comissári…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Dados Técnicos Incontestáveis", "Comissários analisam se o piloto tentou fazer a curv…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Punições Proporcionais", "Penalidades adicionam tempo ao resultado final ou ex…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 5 • CENA 8: mod5_overtaking_summary
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod5_overtaking_summary") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 05 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Equilíbrio Perfeito", "Ultrapassar na F1 exige a ousadia de mergulhar na fr…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Desafio de Conhecimento", "Avance para as dez perguntas e teste seus reflexos s…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 1: mod6_birth_of_f1
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_birth_of_f1") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("13 DE MAIO DE 1950: O MARCO INAUGURAL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Padronização do Regulamento", "A FIA estabeleceu a Fórmula 1 como o topo das regras…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Silverstone, 13 de Maio de 1950", "Giuseppe Farina e a lendária Alfa Romeo 158 'Alfetta…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pioneirismo Sem Concessões", "Carros com motor dianteiro, pneus estreitos e segura…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 2: mod6_cars_evolution
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_cars_evolution") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("EVOLUÇÃO TÉCNICA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Revolução dos Anos 60", "Colin Chapman e a Lotus provaram que colocar o motor…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Chegada da Aerodinâmica e Cavalos", "Nos anos 70 surgiram os aerofólios e o efeito solo")}
          {cueIndex === 3 && renderMarianaSyncBadge("Eletrônica Fina e Unidades Híbridas", "Da suspensão ativa aos propulsores híbridos modernos…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 3: mod6_legendary_drivers
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_legendary_drivers") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("GIGANTES DO ESPORTE", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Cinco Títulos por Quatro Equipes", "Juan Manuel Fangio dominou a década de 1950 com maes…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Jim Clark e Jackie Stewart", "Clark encantava pela velocidade pura")}
          {cueIndex === 3 && renderMarianaSyncBadge("Superação Sob Humano Limite", "Após o terrível acidente de 1976, Lauda retornou em…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 4: mod6_rivalries
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_rivalries") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("DUELOS HISTÓRICOS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Contraste de Personalidades", "A rivalidade cinematográfica que levou o automobilis…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Ápice do Automobilismo", "Dois gênios no mesmo carro da McLaren, dividindo o p…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Batalha de Gerações (2021)", "Vinte e duas corridas de tirar o fôlego com os dois…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 5: mod6_safety_evolution
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_safety_evolution") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("SEGURANÇA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("McLaren MP4/1 (1981)", "A substituição do alumínio pela fibra de carbono pro…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Cruzada de Sid Watkins", "Sensores biométricos, laterais do cockpit elevadas,…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Homologação FIA 120 kN", "Inicialmente criticado pela estética, o Halo provou…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 6: mod6_senna_brazil_legacy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_senna_brazil_legacy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TRADIÇÃO BRASILEIRA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Fittipaldi e Nelson Piquet", "O Brasil conquistou cinco títulos mundiais antes de…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Mônaco, Donington e Chuva", "A busca intransigente pela perfeição, as voltas mági…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Mais que um Piloto, um Ícone", "O impacto de Senna transcendeu as pistas, tornando-s…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 7: mod6_modern_f1_2026
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_modern_f1_2026") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ERA CONTEMPORÂNEA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Combustíveis Sintéticos Verdes", "A F1 lidera a tecnologia de combustíveis limpos que…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Carros Mais Ágeis e Eficientes", "Monopostos reduzidos em largura e massa, com partici…")}
          {cueIndex === 3 && renderMarianaSyncBadge("O Teto Financeiro (Cost Cap)", "Restrição orçamentária impede que uma única montador…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 6 • CENA 8: mod6_history_summary
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod6_history_summary") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 06 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Memória que Inspira", "Entender a história é essencial para enxergar a alma…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Teste sua Memória", "Avance para as dez questões do quiz e mostre que voc…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 1: mod7_team_roles
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_team_roles") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("AS CENTENAS DE PESSOAS POR TRÁS DO PILOTO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Team Principal", "Coordena as decisões estratégicas, lidera negociaçõe…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Performance e Confiabilidade", "Trabalham colados ao piloto para extrair o último dé…")}
          {cueIndex === 3 && renderMarianaSyncBadge("O Exército de Projetistas", "Centenas de engenheiros de compósitos, aerodinamicis…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 2: mod7_radio_communication
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_radio_communication") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("CANAL DE RÁDIO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Apenas o Engenheiro Fala", "Para evitar confusão, somente o engenheiro de corrid…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Palavras Curtas e Códigos", "Informações precisas de deltas, mapas de freio e pos…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Acalmar os Ânimos sob 5G", "O engenheiro atua como âncora psicológica do piloto…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 3: mod7_pitwall_command
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_pitwall_command") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PIT WALL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Centenas de Monitores no Muro", "O pit wall recebe dados criptografados por telemetri…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Sala de Operações Virtual", "Na Inglaterra ou Itália, dezenas de analistas acompa…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Resposta Rápida", "Chamar o piloto para os boxes no instante de um Safe…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 4: mod7_pitstop_anatomy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_pitstop_anatomy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("COREOGRAFIA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Precisão no Colchete", "O piloto deve parar exatamente na marca")}
          {cueIndex === 2 && renderMarianaSyncBadge("Porca Única Central", "Pistolas de ar comprimido a mais de 10")}
          {cueIndex === 3 && renderMarianaSyncBadge("Luz Verde Sem Hesitação", "O semáforo do pit stop analisa o tráfego no pit lane…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 5: mod7_telemetry_analysis
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_telemetry_analysis") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ANÁLISE DE DADOS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Raio-X da Pilotagem", "Gráficos de acelerador, freio, marcha e velocidade m…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Espelho do Box ao Lado", "Pilotos da mesma equipe analisam a telemetria mútua…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Ajuste de Diferencial e Asas", "Engenheiros refinam a distribuição de torque para me…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 6: mod7_two_drivers_one_team
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_two_drivers_one_team") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("COMPANHEIROS DE EQUIPE", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Mesmo Equipamento Mecânico", "Sem desculpas técnicas")}
          {cueIndex === 2 && renderMarianaSyncBadge("Mundial de Construtores", "Colisões entre companheiros de equipe são a maior pr…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Decisão do Muro", "Trocar posições na pista visa maximizar a pontuação…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 7: mod7_cost_cap_development
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_cost_cap_development") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("FINANÇAS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Financial Regulations da FIA", "Limita os gastos com desenvolvimento do carro para i…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Mais Testes para Quem Está Atrás", "As equipes com pior classificação recebem mais horas…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Arte de Fazer Mais com Menos", "Cada atualização levada para a pista precisa ser val…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 7 • CENA 8: mod7_team_principal_challenge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod7_team_principal_challenge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 07 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Piloto Levanta o Troféu, o Time Vence", "Cada centésimo ganho na pista é fruto do trabalho me…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Avalie seu Conhecimento", "Avance para as dez perguntas e teste seus conhecimen…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 1: mod8_circuit_anatomy
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_circuit_anatomy") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ANATOMIA DO CIRCUITO E TIPOS DE TRECHO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Cada Autódromo é um Desafio Único", "Antes de acelerar, o piloto precisa mapear as zonas…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Ataque às Zebras", "O piloto usa as zebras para esticar o traçado, mas o…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Curvas Rápidas no Limite", "Quanto maior a velocidade de entrada, mais o downfor…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 2: mod8_racing_line
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_racing_line") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TRAJETÓRIA IDEAL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Maximizando o Raio Geométrico", "Quanto mais aberto o carro entra, menor é a inclinaç…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Apex da Curva", "O ponto mais interno onde o carro encosta na zebra a…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pé no Fundo com Volante Reto", "Acelerar com o volante ainda esterçado provoca derra…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 3: mod8_braking_physics
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_braking_physics") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("FRENAGEM", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Precisão Visual a 340 km/h", "Um erro de cinco metros na freada significa perder o…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Peso Avançando", "A dianteira afunda e ganha atrito mecânico enquanto…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Evitando o Travamento de Rodas", "Com menos downforce em baixa velocidade, a pressão d…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 4: mod8_corner_categories
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_corner_categories") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("CATEGORIAS DE CURVA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Aderência Mecânica Pura", "Em curvas lentas (ex")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Teste de Equilíbrio do Chassi", "Trechos como a curva Luffield em Silverstone exigem…")}
          {cueIndex === 3 && renderMarianaSyncBadge("O Poder do Downforce", "Em curvas como Copse ou Pouhon, a velocidade é inacr…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 5: mod8_friction_circle
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_friction_circle") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("DINÂMICA VEICULAR", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Capacidade Finita de Força", "O pneu tem 100% de atrito para dividir entre frear,…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Sair de Frente vs Sair de Traseira", "Understeer ocorre quando as rodas dianteiras perdem…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pilotar na Borda do Círculo", "Os campeões mantêm o pneu exatamente no limiar máxim…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 6: mod8_monaco_monza_spa
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_monaco_monza_spa") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TEMPLOS DO CALENDÁRIO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Precisão de Cirurgião", "Correr a 280 km/h num túnel de concreto sem áreas de…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Arrasto Quase Zero", "Monopostos com asas reduzidas ao mínimo, frenagens b…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Subida da Eau Rouge", "Sete quilômetros de relevo natural, onde um setor po…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 7: mod8_rain_track_limits
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_rain_track_limits") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PISTA MOLHADA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Borracha Molhada Vira Gelo", "Seguir a linha geométrica normal na chuva provoca ro…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Buscando o Asfalto Poroso", "Curvas contornadas por fora, longe das zebras pintad…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pneus Flutuando na Água", "Quando o fluxo de água supera os 85 litros/segundo s…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 8 • CENA 8: mod8_lap_master_challenge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod8_lap_master_challenge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 08 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Perfeição em Cada Metro", "Uma volta mágica não é sorte")}
          {cueIndex === 2 && renderMarianaSyncBadge("Teste seus Conhecimentos de Pista", "Avance para as dez perguntas e prove que você domina…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 1: mod9_qualities_overview
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_qualities_overview") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("OS 5 PILARES DE UM PILOTO CAMPEÃO DO MUNDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Sábado vs Domingo", "Ser o mais veloz em uma volta rápida define a pole,…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Repetição Perfeita", "Campeões mundiais cravam voltas consecutivas com var…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Mente Acima do Físico", "Filtrar ruídos e conversar tranquilamente com o enge…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 2: mod9_pressure_mindset
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_pressure_mindset") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("CONTROLE EMOCIONAL", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Batimentos no Teto Cardíaco", "A exaustão muscular e a respiração pesada tornam qua…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Reação à Falha", "Errar faz parte do automobilismo")}
          {cueIndex === 3 && renderMarianaSyncBadge("Foco no Presente Imediato", "Quem fica remoendo a curva anterior bate o carro na…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 3: mod9_consistency_pace
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_consistency_pace") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("RITMO DE PROVA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Rápido Mas Irregular", "Faz a volta mais rápida da prova, mas destrói os pne…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Força da Repetição Perfeita", "Parece discreto, mas acumula segundos de vantagem se…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Pressão do Ritmo Implacável", "Adversários que perseguem um piloto metrônomo entram…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 4: mod9_racecraft_duels
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_racecraft_duels") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("RACECRAFT", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Presença Intimidadora", "Mostrar o carro nas frenagens desestabiliza emociona…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Paciência e Planejamento", "Ultrapassar não é se atirar no primeiro espaço, mas…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Pontos Garantidos Valem Mais", "Evitar o abandono contra um rival inconsequente gara…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 5: mod9_tire_intelligence
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_tire_intelligence") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("GESTÃO DE BORRACHA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Estoque Finito de Borracha", "O pneu é como uma conta bancária")}
          {cueIndex === 2 && renderMarianaSyncBadge("Evitar o Superaquecimento Interno", "Dirigir rápido sem escorregar a traseira nas reacele…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Recompensa da Paciência", "Quem poupou pneu no início voa baixo no final do sti…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 6: mod9_champions_styles
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_champions_styles") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ESTILOS DE PILOTAGEM", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Devoção Total à Velocidade", "Senna pilotava com a alma, buscando limites que outr…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Disciplina Inovadora", "Transformou a F1 moderna ao introduzir condicionamen…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Precisão Cirúrgica e Fome Voraz", "Dois gigantes contemporâneos provando que maestria t…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 7: mod9_adapting_uncertainty
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_adapting_uncertainty") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ADAPTAÇÃO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Inevitável Incerteza da F1", "Nenhuma simulação de computador prevê uma quebra de…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Confiança no Muro", "O piloto campeão relata a perda de aderência sem dra…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Vencer na Dificuldade", "Quando todos os rivais entram em pânico, o piloto fr…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 9 • CENA 8: mod9_champion_mindset_challenge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod9_champion_mindset_challenge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 09 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Além do Talento Bruto", "A velocidade é apenas o bilhete de entrada")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Quiz dos Campeões", "Avance para as dez perguntas e prove que você compre…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 1: mod10_integrated_system
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_integrated_system") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("ENGENHARIA SISTÊMICA DA FÓRMULA 1", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Vitória é Sistêmica", "A velocidade não vem de uma solução isolada, mas de…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Alterações Mecânicas Conectadas", "Mudar a rigidez da barra estabilizadora afeta a aero…")}
          {cueIndex === 3 && renderMarianaSyncBadge("O Carro como Organismo Único", "Engenheiros buscam a janela em que todos os componen…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 2: mod10_aerodynamics_balance
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_aerodynamics_balance") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("AERODINÂMICA AVANÇADA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Downforce em Curvas Rápidas", "Permite contornar curvas de 250 km/h sem que a inérc…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Resistência nas Retas", "O arrasto excessivo deixa o monoposto vulnerável a u…")}
          {cueIndex === 3 && renderMarianaSyncBadge("A Busca pelo Formato Ideal", "Milhares de horas virtuais calculando o caminho exat…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 3: mod10_active_aero_modes
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_active_aero_modes") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("REGULAMENTO 2026", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Asas Ativas Coordenadas", "Pela primeira vez na história da F1, a asa dianteira…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Mínima Resistência nas Retas", "Reduz o arrasto drasticamente, permitindo velocidade…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Retorno Imediato da Carga", "Na primeira pressão no pedal de freio, os flaps fech…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 4: mod10_power_unit_hybrid
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_power_unit_hybrid") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("PROPULSÃO 2026", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Zero Carbono Fóssil", "A F1 2026 roda com combustíveis sintéticos derivados…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Triplicação da Força Elétrica", "O motor elétrico quase empata com o motor a gasolina…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Gerenciar o Estoque da Bateria", "Potência é a força instantânea")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 5: mod10_boost_overtake_recharge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_boost_overtake_recharge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("GESTÃO ENERGÉTICA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Potência Sob Demanda", "O piloto aperta o botão de boost no volante para que…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Energia do Caçador", "Sistema regulamentar que concede vantagem elétrica p…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Enchendo o Tanque Elétrico", "Nas curvas lentas e frenagens, o MGU-K atua como ger…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 6: mod10_telemetry_laps
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_telemetry_laps") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("TELEMETRIA DE ENGENHARIA", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("A Pista Mapeada", "A cada metro percorrido, dados de carga da suspensão…")}
          {cueIndex === 2 && renderMarianaSyncBadge("A Busca pelo Tempo Perdido", "Engenheiros mostram ao piloto onde ele freou cedo de…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Ajustes Milimétricos", "Alterar meio grau de asa dianteira baseado nos traço…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 7: mod10_materials_safety
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_materials_safety") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("CIÊNCIA DOS MATERIAIS", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("O Casulo de Carbono e Zylon", "O monocoque protege o piloto mantendo o cockpit inta…")}
          {cueIndex === 2 && renderMarianaSyncBadge("Titânio de Grau Aeroespacial", "Testado para suportar o peso de dois ônibus londrino…")}
          {cueIndex === 3 && renderMarianaSyncBadge("Estruturas Deformáveis", "Bicos e laterais esmagam-se progressivamente para qu…")}
        </div>
      )
    }

    // ------------------------------------------------------------------------
    // MÓDULO 10 • CENA 8: mod10_engineer_challenge
    // ------------------------------------------------------------------------
    if (currentScene.visualEffectType === "mod10_engineer_challenge") {
      const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
          {renderTopHUD("MÓDULO 10 CONCLUÍDO", `FASE ${cueIndex} DE 3`)}
          <div className="flex-1 pointer-events-none" />
          {cueIndex === 1 && renderMarianaSyncBadge("Integrar Ciência e Competição", "Agora você é capaz de olhar para um carro de Fórmula…")}
          {cueIndex === 2 && renderMarianaSyncBadge("O Grande Teste", "Avance para as dez perguntas e conquiste o certifica…")}
        </div>
      )
    }

    return null
  }


  // ==========================================================================
  // RENDERIZAÇÃO DA PÁGINA (HERO, LESSON OU QUIZ)
  // ==========================================================================

  // Percentual de progresso
  const progressPercent = Math.round((visitedScenes.length / currentScenes.length) * 100)

  return (
    <div className="novatos-root relative min-h-[calc(100vh-4rem)] bg-[#04060A] text-white flex flex-col justify-between overflow-x-hidden select-none">
      {/* Elementos de Áudio Ocultos com Rastreamento Temporal */}
      <audio
        ref={narrationAudioRef}
        src={currentScene.audioUrl}
        preload="auto"
        onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false)
          // Avanço automático de 5s só ocorre se não for a última cena do módulo
          if (sceneIndex < currentScenes.length - 1) {
            startPostNarrationCountdown()
          }
        }}
      />
      <audio
        ref={musicAudioRef}
        src={CINEMATIC_MUSIC_URL}
        preload="auto"
        loop
      />


      {/* ==================================================================== */}
      {/* TELA DE ABERTURA (HERO LANDING)                                      */}
      {/* ==================================================================== */}
      {viewStage === "opening" && (
        <div className="relative flex-1 flex flex-col items-center justify-center p-2 sm:p-8 min-h-0 sm:min-h-[85vh]">
          {/* Fundo Cinematográfico com Parallax Suave */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              src={getModuleHeroBackground(activeModuleId)}
              alt="Fundo Novatos na F1"
              className={cn(
                "w-full h-full object-cover object-center brightness-40 contrast-125 scale-105",
                !reduceMotion && "f1-scene-motion-1"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04060A] via-black/60 to-black/80" />
          </div>

          {/* Seletor dos 10 Módulos — Layout Adaptativo: Grid Desktop/Tablet + Carrossel Suave no Mobile */}
          <div className="relative z-30 w-full max-w-5xl mx-auto mb-2 sm:mb-6 px-2 sm:px-3">
            <div className="p-2 sm:p-3.5 rounded-2xl bg-black/85 border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse" />
                  <span className="text-[11px] font-mono font-black uppercase text-zinc-200 tracking-wider">
                    Jornada Educacional • 10 Módulos Integrados
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Módulo Ativo: <strong className="text-[#E10600] font-black">M{activeModuleId}</strong>
                </span>
              </div>

              {/* Versão Desktop e Tablet: 2 Linhas Adaptáveis com 5 Módulos Cada (100% Visível) */}
              <div className="hidden sm:grid sm:grid-cols-5 gap-2">
                {[
                  { id: 1 as const, num: "01", name: "O que é a F1?" },
                  { id: 2 as const, num: "02", name: "A Máquina" },
                  { id: 3 as const, num: "03", name: "Dentro da Corrida" },
                  { id: 4 as const, num: "04", name: "A Mente da Corrida" },
                  { id: 5 as const, num: "05", name: "Ultrapassagens" },
                  { id: 6 as const, num: "06", name: "História da F1" },
                  { id: 7 as const, num: "07", name: "Bastidores da Equipe" },
                  { id: 8 as const, num: "08", name: "Dominando Circuitos" },
                  { id: 9 as const, num: "09", name: "Mente dos Campeões" },
                  { id: 10 as const, num: "10", name: "Tecnologia & Dados" },
                ].map((mod) => {
                  const isActive = activeModuleId === mod.id
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleSelectModule(mod.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 sm:p-2.5 rounded-xl text-left transition-all border cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]",
                        isActive
                          ? "bg-[#E10600] text-white border-red-500 shadow-[0_0_20px_rgba(225,6,0,0.5)] scale-[1.02]"
                          : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-95"
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-black shrink-0",
                          isActive ? "bg-black/40 text-white" : "bg-black/60 text-zinc-400"
                        )}
                      >
                        {mod.num}
                      </span>
                      <span className="text-xs font-bold leading-tight truncate">
                        {mod.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Versão Mobile (<640px): Carrossel Horizontal Suave com Snap e Pistas Visuais Laterais */}
              <div className="sm:hidden relative">
                <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
                  {[
                    { id: 1 as const, num: "01", name: "O que é a F1?" },
                    { id: 2 as const, num: "02", name: "A Máquina" },
                    { id: 3 as const, num: "03", name: "Dentro da Corrida" },
                    { id: 4 as const, num: "04", name: "A Mente da Corrida" },
                    { id: 5 as const, num: "05", name: "Ultrapassagens" },
                    { id: 6 as const, num: "06", name: "História da F1" },
                    { id: 7 as const, num: "07", name: "Bastidores da Equipe" },
                    { id: 8 as const, num: "08", name: "Dominando Circuitos" },
                    { id: 9 as const, num: "09", name: "Mente dos Campeões" },
                    { id: 10 as const, num: "10", name: "Tecnologia & Dados" },
                  ].map((mod) => {
                    const isActive = activeModuleId === mod.id
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleSelectModule(mod.id)}
                        className={cn(
                          "shrink-0 snap-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-left transition-all border cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]",
                          isActive
                            ? "bg-[#E10600] text-white border-red-500 shadow-[0_0_15px_rgba(225,6,0,0.5)]"
                            : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
                        )}
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0",
                            isActive ? "bg-black/40 text-white" : "bg-black/60 text-zinc-400"
                          )}
                        >
                          {mod.num}
                        </span>
                        <span className="text-xs font-bold">
                          {mod.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1 pt-1.5">
                  <span>← Arraste para os lados</span>
                  <span>10 Módulos Disponíveis →</span>
                </div>
              </div>
            </div>
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
                  : activeModuleId === 7
                  ? "MÓDULO 7 • POR TRÁS DA EQUIPE: ENGENHEIROS, ESTRATÉGIA E DADOS"
                  : activeModuleId === 8 ? "MÓDULO 8 • DOMINANDO OS CIRCUITOS: TRAJETÓRIAS E VOLTA RÁPIDA" : activeModuleId === 9 ? "MÓDULO 9 • A MENTE DOS CAMPEÕES: O QUE DEFINE UM VENCEDOR" : "MÓDULO 10 • A TECNOLOGIA POR TRÁS DA VELOCIDADE: ENGENHARIA E DADOS"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-2 sm:mb-3 drop-shadow-md">
              Novatos na <span className="text-[#E10600]">F1</span>
            </h1>

            <p className="text-xs sm:text-lg font-bold uppercase tracking-wider text-zinc-300 mb-2 sm:mb-4">
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
                : activeModuleId === 7
                ? "MÓDULO 7 — POR TRÁS DA EQUIPE"
                : activeModuleId === 8 ? "MÓDULO 8 — DOMINANDO OS CIRCUITOS" : activeModuleId === 9 ? "MÓDULO 9 — A MENTE DOS CAMPEÕES" : "MÓDULO 10 — A TECNOLOGIA POR TRÁS DA VELOCIDADE"}
            </p>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mb-3 sm:mb-8">
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
                : activeModuleId === 7
                ? "“O piloto está na pista. Centenas de decisões acontecem nos bastidores.”"
                : "“Uma curva pode decidir uma corrida. Aprenda a enxergar o que os pilotos enxergam.”"}
            </p>

            {/* Botão de Ação CTA */}
            <button
              type="button"
              onClick={handleStartExperience}
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-sm sm:text-base font-black uppercase tracking-wider shadow-[0_0_30px_rgba(225,6,0,0.65)] hover:shadow-[0_0_40px_rgba(225,6,0,0.85)] transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{activeModuleId === 1 ? "COMEÇAR DO ZERO" : activeModuleId === 2 ? "INICIAR EXPERIÊNCIA" : activeModuleId === 3 ? "INICIAR TRANSMISSÃO" : activeModuleId === 6 ? "INICIAR EXPERIÊNCIA" : "INICIAR TRANSMISSÃO"}</span>
            </button>

            {/* Acessos Rápidos no Rodapé da Abertura */}
            <div className="mt-3 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
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
        <div className="novatos-lesson-container flex-1 flex flex-col p-1.5 sm:p-6 max-w-6xl w-full mx-auto justify-between">
          {/* Top Bar da Lição com Seletor Direto de Módulos */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setViewStage("opening")}
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer shrink-0"
                title="Voltar ao início"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Início</span>
              </button>

              {/* Dropdown Rápido de Módulos (1 a 10) na própria aula */}
              <select
                value={activeModuleId}
                onChange={(e) => handleSelectModule(Number(e.target.value) as any)}
                aria-label="Trocar de Módulo"
                className="bg-black/80 border border-white/20 rounded-lg text-xs font-mono font-bold text-white px-2 py-1 cursor-pointer hover:border-[#E10600] focus:outline-none transition-all shrink-0 max-w-[130px] sm:max-w-none truncate"
              >
                <option value={1}>M1: O que é a F1?</option>
                <option value={2}>M2: A Máquina</option>
                <option value={3}>M3: Dentro da Corrida</option>
                <option value={4}>M4: A Mente da Corrida</option>
                <option value={5}>M5: Ultrapassagens</option>
                <option value={6}>M6: História da F1</option>
                <option value={7}>M7: Bastidores da Equipe</option>
                <option value={8}>M8: Dominando Circuitos</option>
                <option value={9}>M9: Mente dos Campeões</option>
                <option value={10}>M10: Tecnologia & Dados</option>
              </select>

              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#E10600] text-white font-mono text-[10px] sm:text-xs font-black uppercase shrink-0">
                CENA 0{currentScene.number}
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white truncate hidden md:inline">
                {currentScene.title}
              </span>
              <span className="hidden lg:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
                {progressPercent}% CONCLUÍDO
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTranscriptionOpen(!isTranscriptionOpen)}
                className={cn(
                  "px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
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
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Tela Cheia</span>
              </button>
            </div>
          </div>

          {/* Palco Principal da Imagem + Efeitos Visuais */}
          <div className="novatos-stage relative flex-1 min-h-[190px] sm:min-h-[460px] rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black flex items-center justify-center">
            {currentScene.visualEffectType === "starting_grid" ? (
              <StartingGridAnimation
                currentTime={audioCurrentTime}
                isPlaying={isPlaying}
                reduceMotion={reduceMotion}
              />
            ) : currentScene.visualEffectType === "machine_hotspots" ? (
              <CarMechanicsAnimation
                currentTime={audioCurrentTime}
                isPlaying={isPlaying}
                reduceMotion={reduceMotion}
              />
            ) : currentScene.visualEffectType === "pitstop_team" ? (
              <PitstopAnimation
                currentTime={audioCurrentTime}
                isPlaying={isPlaying}
                reduceMotion={reduceMotion}
              />
            ) : (
              <>
                <img
                  src={currentScene.imageUrl}
                  alt={currentScene.title}
                  className={cn(
                    "w-full h-full object-cover object-center select-none",
                    !reduceMotion && (activeModuleId === 1 ? `f1-scene-motion-${currentScene.number}` : "f1-scene-motion-1"),
                    currentScene.visualEffectType === "vintage_1950" && "sepia-[0.25] contrast-125 brightness-90"
                  )}
                />

                {/* Gradientes Sutis de Contraste Cinematográfico (sem escurecer excessivamente a imagem) */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
              </>
            )}

            {/* Overlays Interativos por Cena */}
            {renderVisualOverlay()}
          </div>

          {/* Transcrição da Narração Flutuante */}
          {isTranscriptionOpen && (
            <div className="mt-2 sm:mt-3 p-3 sm:p-3.5 rounded-xl bg-black/90 border border-white/20 shadow-xl backdrop-blur-md text-xs sm:text-sm text-zinc-200 leading-relaxed max-h-40 overflow-y-auto">
              <span className="text-[10px] font-mono uppercase text-[#E10600] font-black block mb-1">
                Mariana da Rádio F1 (Transcrição):
              </span>
              {currentScene.narrationTranscript}
            </div>
          )}

          {/* Banner de Contagem Regressiva de 5 Segundos */}
          {countdownSeconds !== null && (
            <div className="mt-2 sm:mt-2.5 p-2 sm:p-2.5 rounded-xl bg-[#E10600]/20 border border-[#E10600]/40 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md shrink-0">
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
                    if (sceneIndex < currentScenes.length - 1) {
                      autoPlayNextSceneRef.current = true
                      goToScene(sceneIndex + 1)
                    }
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
          <div className="novatos-bottom-bar mt-2 sm:mt-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-black/85 border border-white/15 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xl shrink-0">
            {/* Reproduzir / Pausar / Repetir */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleReplayScene}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Repetir cena"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title={isMuted ? "Desmutar" : "Silenciar"}
                aria-label={isMuted ? "Desmutar áudio" : "Silenciar áudio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E10600]" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>

            {/* Controles de Volume Independentes */}
            <div className="flex items-center gap-2.5 sm:gap-4 text-xs font-bold text-zinc-400 shrink-0">
              {/* Volume Mariana */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <label
                  htmlFor="volume-mariana"
                  className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-300 cursor-pointer"
                >
                  Mariana:
                </label>
                <input
                  id="volume-mariana"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : narrationVolume}
                  onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 accent-[#E10600] cursor-pointer"
                  aria-label="Volume da narradora Mariana"
                />
              </div>

              {/* Volume Música */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMusicActive(!isMusicActive)}
                  className="text-[9px] sm:text-[10px] font-mono uppercase text-zinc-300 hover:text-white cursor-pointer underline"
                  title={isMusicActive ? "Desativar música de fundo" : "Ativar música de fundo"}
                  aria-label={isMusicActive ? "Desativar música de fundo" : "Ativar música de fundo"}
                  aria-pressed={isMusicActive}
                >
                  Música:
                </button>
                <input
                  id="volume-musica"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted || !isMusicActive ? 0 : musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 accent-cyan-400 cursor-pointer"
                  aria-label="Volume da trilha sonora"
                />
              </div>
            </div>

            {/* Navegação Entre Cenas: Anterior / Próximo */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => goToScene(sceneIndex - 1)}
                disabled={sceneIndex === 0}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (sceneIndex < currentScenes.length - 1) {
                    if (isPlaying) autoPlayNextSceneRef.current = true
                    goToScene(sceneIndex + 1)
                  } else {
                    stopAllAudio()
                    setViewStage("quiz")
                  }
                }}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0"
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
        <div className="flex-1 flex flex-col p-2 sm:p-8 max-w-2xl w-full mx-auto justify-center min-h-0 sm:min-h-[85vh]">
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
                {activeModuleId === 1 ? "MÓDULO 1 CONCLUÍDO" : activeModuleId === 2 ? "MÓDULO 2 CONCLUÍDO" : activeModuleId === 3 ? "MÓDULO 3 CONCLUÍDO" : activeModuleId === 4 ? "MÓDULO 4 CONCLUÍDO" : activeModuleId === 5 ? "MÓDULO 5 CONCLUÍDO" : activeModuleId === 6 ? "MÓDULO 6 CONCLUÍDO" : activeModuleId === 7 ? "MÓDULO 7 CONCLUÍDO" : activeModuleId === 8 ? "MÓDULO 8 CONCLUÍDO" : activeModuleId === 9 ? "MÓDULO 9 CONCLUÍDO" : "MÓDULO 10 CONCLUÍDO"}
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
                  : activeModuleId === 7
                  ? (quizScore ?? 0) >= 9
                    ? "“Excelente! Você tem visão de Team Principal: domina a sinergia entre engenharia, mecânica, dados e liderança estratégica.”"
                    : (quizScore ?? 0) >= 7
                    ? "“Muito bem! Você compreende o trabalho nos bastidores da equipe. Revise os detalhes técnicos para refinar suas decisões.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Bom começo! Reveja as cenas sobre telemetria, limite de custos e estratégia de pit wall.”"
                    : "“Liderar uma equipe exige aprendizado constante. Reveja as cenas do módulo e tente novamente.”"
                                    : activeModuleId === 10
                  ? (quizScore ?? 0) === 10
                    ? "“Desafio concluído! Você aprendeu os principais conceitos tecnológicos que ajudam a explicar a velocidade na Fórmula 1.”"
                    : (quizScore ?? 0) >= 8
                    ? "“Excelente! Você já consegue relacionar engenharia, energia e desempenho.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Boa evolução! Você já compreende vários fundamentos da tecnologia de um carro de F1.”"
                    : "“A engenharia da F1 é complexa, mas você já começou a descobrir seus segredos. Revise as cenas e tente novamente.”"
                  : activeModuleId === 9
                  ? (quizScore ?? 0) === 10
                    ? "“Perfeito! Mente de Campeão Mundial! Você domina todos os pilares mentais, táticos e técnicos de um piloto extraordinário.”"
                    : (quizScore ?? 0) >= 8
                    ? "“Excelente visão estratégica! Você pensa como os pilotos e estrategistas mais experientes da Fórmula 1.”"
                    : (quizScore ?? 0) >= 5
                    ? "“Boa evolução tática! Você já enxerga a importância da consistência, do foco sob pressão e da preservação de pneus.”"
                    : "“Leitura inicial da mente competitiva. Você começou a entender que a F1 vai muito além do acelerador. Reveja as cenas e tente novamente!”"
                  : (quizScore ?? 0) === 10
                  ? "“Volta perfeita no quiz! Você concluiu o desafio com domínio dos conceitos fundamentais.”"
                  : (quizScore ?? 0) >= 8
                  ? "“Excelente! Você está aprendendo a enxergar a estratégia por trás das curvas.”"
                  : (quizScore ?? 0) >= 5
                  ? "“Boa evolução! Você já reconhece vários elementos importantes de uma volta.”"
                  : "“Você está começando a ler a pista. Revise as cenas e tente novamente.”"}
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

                {activeModuleId === 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      goToScene(7)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E10600]/20 hover:bg-[#E10600]/30 text-white text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-[#E10600]/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
                    <span>Rever o Desafio do Engenheiro</span>
                  </button>
                )}

                {activeModuleId === 9 && (
                  <button
                    type="button"
                    onClick={() => {
                      goToScene(7)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E10600]/20 hover:bg-[#E10600]/30 text-white text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-[#E10600]/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
                    <span>Rever o Desafio do Campeão</span>
                  </button>
                )}

                {activeModuleId === 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      goToScene(7)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E10600]/20 hover:bg-[#E10600]/30 text-white text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 border border-[#E10600]/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E10600]" />
                    <span>Rever o Desafio da Volta</span>
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
                src={viewStage === "opening" ? getModuleHeroBackground(activeModuleId) : currentScene.imageUrl}
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
