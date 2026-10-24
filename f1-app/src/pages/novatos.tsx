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

  // Interactive Scene States — Module 1
  const [m1Scene3Element, setM1Scene3Element] = useState<"formula" | "pilots" | "teams" | "championship">("formula")
  const [m1SelectedPart, setM1SelectedPart] = useState<number>(1)
  const [m1StartStep, setM1StartStep] = useState<"idle" | "light_1" | "light_2" | "light_3" | "light_4" | "all_on" | "lights_out" | "racing">("idle")
  const m1StartTimersRef = useRef<NodeJS.Timeout[]>([])
  const [m1ReviewHotspot, setM1ReviewHotspot] = useState<number>(1)
  const [m1ShowAllSummary, setM1ShowAllSummary] = useState<boolean>(false)

  const clearM1StartTimers = useCallback(() => {
    m1StartTimersRef.current.forEach((t) => clearTimeout(t))
    m1StartTimersRef.current = []
  }, [])

  // Procedimento Oficial de Largada FIA (Semáforo de 5 Etapas sem Luz Verde, com Espera Variável)
  const handleRunStartSequence = useCallback(() => {
    clearM1StartTimers()
    setM1StartStep("idle")

    // Acendimento progressivo de 1 segundo entre cada luz vermelha
    const t1 = setTimeout(() => setM1StartStep("light_1"), 800)
    const t2 = setTimeout(() => setM1StartStep("light_2"), 1800)
    const t3 = setTimeout(() => setM1StartStep("light_3"), 2800)
    const t4 = setTimeout(() => setM1StartStep("light_4"), 3800)
    const t5 = setTimeout(() => setM1StartStep("all_on"), 4800)

    // Intervalo de expectativa imprevisível entre 1,0s e 3,0s (conforme regulamento esportivo da FIA)
    const variableHoldMs = 1000 + Math.floor(Math.random() * 2000)
    const blackoutTime = 4800 + variableHoldMs

    // APAGAMENTO SIMULTÂNEO de todas as 5 luzes vermelhas (Blecaute total no pórtico)
    const t6 = setTimeout(() => setM1StartStep("lights_out"), blackoutTime)

    // Arrancada dos monopostos SOMENTE após o apagamento (tempo de reação de 250ms)
    const t7 = setTimeout(() => setM1StartStep("racing"), blackoutTime + 250)

    m1StartTimersRef.current = [t1, t2, t3, t4, t5, t6, t7]
  }, [clearM1StartTimers])

  const handleResetStartSequence = useCallback(() => {
    clearM1StartTimers()
    setM1StartStep("idle")
  }, [clearM1StartTimers])

  // Interactive Scene States — Module 2
  const [m2Hotspot, setM2Hotspot] = useState<number>(1)
  const [m2AeroZone, setM2AeroZone] = useState<"front_wing" | "floor" | "rear_wing">("front_wing")
  const [m2TireCompound, setM2TireCompound] = useState<"soft" | "medium" | "hard">("soft")

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
      setM1Scene3Element("formula")
      setM1SelectedPart(1)
      clearM1StartTimers()
      setM1StartStep("idle")
      setM1ReviewHotspot(1)
      setM1ShowAllSummary(false)
      setM2Hotspot(1)
      setM2AeroZone("front_wing")
      setM2TireCompound("soft")
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
  const renderVisualOverlay = () => {
    // ----------------------------------------------------------------------
    // BANNER FLUTUANTE DE SINCRONIZAÇÃO EM TEMPO REAL COM A MARIANA
    // Revela o conceito exato que a narradora está explicando naquele instante
    // ----------------------------------------------------------------------
    const renderMarianaSyncBadge = (badgeText: string, conceptTitle: string, shortDesc: string) => (
      <div className="pointer-events-auto max-w-xl mx-auto w-full mb-3 rounded-xl bg-black/85 border border-white/20 p-2.5 sm:p-3 backdrop-blur-md shadow-2xl animate-fade-in text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#E10600] animate-ping" />
          <span className="text-[10px] font-mono font-black uppercase text-[#E10600] tracking-wider">
            {badgeText}
          </span>
        </div>
        <div className="text-xs sm:text-sm font-black text-white uppercase tracking-wide mb-1">
          {conceptTitle}
        </div>
        <p className="text-[11px] sm:text-xs text-zinc-300 leading-snug">
          {shortDesc}
        </p>
      </div>
    )

if (activeModuleId === 1) {
      // ----------------------------------------------------------------------
      // BANNER FLUTUANTE DE SINCRONIZAÇÃO EM TEMPO REAL COM A MARIANA
      // Revela o conceito exato que a narradora está explicando naquele instante
      // ----------------------------------------------------------------------
      // (renderMarianaSyncBadge hoisted globally to renderVisualOverlay)


      // ======================================================================
      // CENA 1: A ABERTURA (16.2s)
      // ======================================================================
      if (currentScene.visualEffectType === "rear_shimmer") {
        // Sincronização temporal por trecho da fala
        const cueIndex = audioCurrentTime < 4.5 ? 1 : audioCurrentTime < 9.5 ? 2 : 3

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            {/* Efeitos de Iluminação Noturna na Traseira */}
            <div className="pointer-events-none absolute bottom-[18%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#E10600]/80 shadow-[0_0_35px_#E10600] animate-pulse" />
            <div className="pointer-events-none absolute bottom-[16%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff] animate-ping opacity-75" />

            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                INTRODUÇÃO AO UNIVERSO DA FÓRMULA 1
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                TRECHO 0{cueIndex} DE 03
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    ENGENHARIA DE PONTA
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase mb-1">
                    O Esporte a Motor Mais Tecnológico do Planeta
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Onde a física aerodinâmica, a ciência dos materiais e a precisão humana operam no limite absoluto.
                  </p>
                </div>
              )}

              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-[#E10600]/40 backdrop-blur-md text-center max-w-lg shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-[#E10600] font-bold uppercase tracking-widest block mb-1">
                    HARMONIA INTEGRADA
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-left mt-2">
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <strong className="text-white block">🏎️ VELOCIDADE</strong>
                      <span className="text-[10px] text-zinc-400">Curvas de alta e retas a mais de 340 km/h.</span>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <strong className="text-white block">📊 ESTRATÉGIA</strong>
                      <span className="text-[10px] text-zinc-400">Paradas de box, pneus e cálculos de ritmo.</span>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <strong className="text-white block">👤 TALENTO</strong>
                      <span className="text-[10px] text-zinc-400">20 pilotos com reflexos de milissegundos.</span>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <strong className="text-white block">👥 EQUIPE</strong>
                      <span className="text-[10px] text-zinc-400">Centenas de especialistas nos bastidores.</span>
                    </div>
                  </div>
                </div>
              )}

              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/75 border border-emerald-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                    COMECE DO ZERO
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase mb-1">
                    Curva por Curva
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Você não precisa de conhecimento prévio. Vamos desvendar cada detalhe técnico com clareza e emoção.
                  </p>
                </div>
              )}
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "O PINÁCULO DA VELOCIDADE", "Acompanhe a narração para compreender como a engenharia e o talento humano constroem as corridas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "OS 4 PILARES DA F1", "Velocidade, estratégia tática, talento de pilotagem e trabalho de equipe nos boxes.")}
            {cueIndex === 3 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "GUIA DO INICIANTE", "Aprenda no seu ritmo: cada cena traz conceitos essenciais para você curtir as transmissões.")}
          </div>
        )
      }

      // ======================================================================
      // CENA 2: COMO TUDO COMEÇOU (28.1s)
      // ======================================================================
      if (currentScene.visualEffectType === "vintage_1950") {
        const cueIndex = audioCurrentTime < 7.5 ? 1 : audioCurrentTime < 15.5 ? 2 : 3

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.65)_100%)] opacity-85" />

            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm relative z-10">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                HISTÓRIA • O NASCIMENTO DA FÓRMULA 1 (1950)
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                TRECHO 0{cueIndex} DE 03
              </span>
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-amber-500/30 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    ERA PIONEIRA
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Monopostos Clássicos
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Carros com motores dianteiros pesados, pneus estreitos e ausência total de asas ou eletrônica embarcada.
                  </p>
                </div>
              )}

              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/85 border border-[#E10600]/40 backdrop-blur-md text-center max-w-lg shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-[#E10600] font-bold uppercase tracking-widest block mb-1">
                    CHANCELA OFICIAL
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    13 de Maio de 1950 • Silverstone (FIA)
                  </h3>
                  <p className="text-xs text-zinc-300">
                    A Federação Internacional do Automóvel oficializou o primeiro Campeonato Mundial de Pilotos da história.
                  </p>
                </div>
              )}

              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    EVOLUÇÃO GLOBAL
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    75 Anos de Coragem e Tecnologia
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Pilotos e equipes desbravando circuitos pelo mundo, transformando a segurança e alcançando a era de 2026.
                  </p>
                </div>
              )}
            </div>

            <div className="relative z-10">
              {cueIndex === 1 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "A ORIGEM DOS MONOPOSTOS", "Carros históricos sem aerodinâmica moderna: a coragem do piloto definia cada volta.")}
              {cueIndex === 2 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "O MUNDIAL ORGANIZADO PELA FIA", "Criação do regulamento oficial unificado em 1950 na pista inglesa de Silverstone.")}
              {cueIndex === 3 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "CIRCUITOS PELO PLANETA", "Das pistas históricas aos circuitos modernos nos 5 continentes.")}
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 3: O SIGNIFICADO DA FÓRMULA 1 (23.5s) — DADOS TÉCNICOS AUDITADOS
      // ======================================================================
      if (currentScene.visualEffectType === "parallax_track") {
        // Sincronização automática com Mariana caso o aluno não tenha clicado manualmente
        const autoMode = audioCurrentTime < 8.0 ? "formula" : audioCurrentTime < 14.5 ? "pilots" : "teams"
        const effectiveMode = isPlaying ? autoMode : m1Scene3Element

        const formulaFocusModes = [
          {
            id: "formula" as const,
            badge: "CONCEITO 1 • REGULAMENTO FIA",
            title: "O que Significa a Palavra 'Fórmula'?",
            subtitle: "Prescrição técnica e esportiva estrita da FIA",
            details: "A 'Fórmula' é o conjunto oficial de regras técnicas da Federação Internacional do Automóvel. Ela estipula limites rigorosos de massa mínima homologada, envelope aerodinâmico, combustíveis 100% sustentáveis e teto orçamentário igual para todos os construtores.",
            highlight: "Não vence quem tem motor livre, mas quem extrai mais rendimento dentro das mesmas regras.",
            hudCoord: "REGULAMENTO FIA • ENVELOPE HOMOLOGADO PARA TODOS",
          },
          {
            id: "pilots" as const,
            badge: "CONCEITO 2 • CATEGORIA RAINHA",
            title: "Por que o Número '1'?",
            subtitle: "A divisão máxima dos monopostos internacionais",
            details: "O número 1 identifica o ápice do automobilismo mundial (com a pirâmide didática de acesso F4 ➔ F3 ➔ F2 ➔ F1). Suas máquinas geram forças de aceleração lateral e frenagem que variam conforme a curva, atingindo picos de 4G a 5G em trechos de alta velocidade.",
            highlight: "Apenas 20 pilotos no planeta ocupam o grid da categoria mais veloz do mundo.",
            hudCoord: "ESCALA DE MONOPOSTOS: F4 ➔ F3 ➔ F2 ➔ F1 (CATEGORIA MÁXIMA)",
          },
          {
            id: "teams" as const,
            badge: "CONCEITO 3 • BASTIDORES & PARADAS",
            title: "Equipes, Pit Wall e Comunicação",
            subtitle: "A vitória construída por centenas de especialistas",
            details: "Atrás de cada piloto operam analistas de telemetria em tempo real e mecânicos de box. Uma parada normal de troca de pneus dura entre 2,0s e 2,5s. O recorde histórico oficial pertence à McLaren (1,80s no GP do Catar 2023), superando a marca da Red Bull de 1,82s (Brasil 2019).",
            highlight: "Dezenas de canais de dados conectam o carro ao pit wall a cada fração de segundo.",
            hudCoord: "TELEMETRIA DE BOXES • RECORDES HISTÓRICOS DE PARADA",
          },
          {
            id: "championship" as const,
            badge: "CONCEITO 4 • O CAMPEONATO MUNDIAL",
            title: "Dois Títulos Globais em Disputa",
            subtitle: "Mundial de Pilotos e Mundial de Construtores",
            details: "Ao longo de mais de 20 Grandes Prêmios, cada corrida distribui pontos oficiais FIA para os 10 primeiros (25, 18, 15, 12, 10, 8, 6, 4, 2, 1). No fim do ano, coroam-se o Campeão Mundial de Pilotos (glória pessoal) e o Campeão de Construtores (premiação financeira e prestígio).",
            highlight: "A soma contínua de pontos ao longo da temporada define quem escreve a história.",
            hudCoord: "PONTUAÇÃO FIA • 25 PTS PARA A VITÓRIA",
          },
        ]

        const activeMode = formulaFocusModes.find((m) => m.id === effectiveMode) || formulaFocusModes[0]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E10600] animate-ping" />
                <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-wider text-white">
                  FIA FORMULA 1 • CONCEITO E ESTRUTURA OFICIAL
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {activeMode.hudCoord}
              </span>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              {effectiveMode === "formula" && (
                <div className="relative w-full max-w-2xl p-4 border border-cyan-500/40 rounded-xl bg-black/75 backdrop-blur-md flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-fade-in text-center">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    DIRETRIZES TÉCNICAS E ESPORTIVAS FIA
                  </span>
                  <div className="text-center font-mono text-cyan-300 text-xs sm:text-sm font-black tracking-widest uppercase bg-cyan-950/40 py-2 px-3 rounded-lg border border-cyan-500/30 inline-block mx-auto mb-2">
                    A "FÓRMULA" = REGRAS TÉCNICAS E ORÇAMENTÁRIAS IDÊNTICAS PARA TODOS
                  </div>
                  <p className="text-xs text-zinc-200">
                    Massa mínima homologada, geometria de segurança, combustíveis sustentáveis e limite de gastos: a vitória depende da inteligência dentro das regras.
                  </p>
                </div>
              )}

              {effectiveMode === "pilots" && (
                <div className="relative w-full max-w-md p-4 rounded-xl border border-[#E10600]/40 bg-black/75 backdrop-blur-md text-center shadow-[0_0_35px_rgba(225,6,0,0.25)] animate-fade-in">
                  <span className="text-amber-400 font-mono text-[10px] font-bold tracking-widest block mb-1">
                    EXIGÊNCIA FÍSICA E FORÇAS G
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider mb-1">
                    4G A 5G <span className="text-sm text-[#E10600] font-sans">EM CURVAS RÁPIDAS</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    A carga gravitacional varia conforme o traçado, o raio e a velocidade de cada curva, exigindo condicionamento extremo no pescoço.
                  </p>
                </div>
              )}

              {effectiveMode === "teams" && (
                <div className="relative w-full max-w-lg p-3.5 rounded-xl border border-emerald-500/40 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 pb-1 mb-2 border-b border-emerald-500/30">
                    <span>PIT WALL & EFICIÊNCIA DE PARADAS</span>
                    <span className="animate-pulse">● LIVE TELEMETRY</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <span className="text-zinc-400 text-[9px] block">PARADA NORMAL</span>
                      <span className="text-white font-black text-sm text-emerald-400">2,0s a 2,5s</span>
                      <span className="text-[8px] text-zinc-500 block">Tempo médio de troca</span>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/10">
                      <span className="text-zinc-400 text-[9px] block">RECORDE HISTÓRICO</span>
                      <span className="text-white font-black text-sm text-amber-400">1,80s (McLaren)</span>
                      <span className="text-[8px] text-zinc-500 block">GP do Catar 2023</span>
                    </div>
                  </div>
                </div>
              )}

              {effectiveMode === "championship" && (
                <div className="relative w-full max-w-md p-3.5 rounded-xl border border-yellow-500/40 bg-black/80 backdrop-blur-md text-center shadow-[0_0_35px_rgba(234,179,8,0.2)] animate-fade-in">
                  <div className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest mb-1">
                    DOIS TÍTULOS PARALELOS OFICIAIS
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left text-xs font-mono mt-2">
                    <div className="p-2 rounded bg-yellow-950/20 border border-yellow-500/20">
                      <span className="text-yellow-300 font-bold text-[11px] block">🏆 MUNDIAL PILOTOS</span>
                      <span className="text-zinc-300 text-[10px]">Glória pessoal do piloto que somar mais pontos.</span>
                    </div>
                    <div className="p-2 rounded bg-yellow-950/20 border border-yellow-500/20">
                      <span className="text-yellow-300 font-bold text-[11px] block">🏆 CONSTRUTORES</span>
                      <span className="text-zinc-300 text-[10px]">Soma dos dois carros; define premiação financeira.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-auto w-full max-w-4xl mx-auto rounded-2xl bg-black/90 border border-white/20 p-3 sm:p-4 backdrop-blur-xl shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                {formulaFocusModes.map((mode) => {
                  const isActive = effectiveMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setM1Scene3Element(mode.id)}
                      className={cn(
                        "p-2 rounded-xl text-left transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]",
                        isActive
                          ? "bg-[#E10600] text-white border-red-500 shadow-lg"
                          : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="text-[9px] font-mono block opacity-80">{mode.badge.split("•")[0]}</span>
                      <span className="text-xs font-black truncate block">{mode.title.split("?")[0]}</span>
                    </button>
                  )
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-white text-sm">{activeMode.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono italic">— {activeMode.subtitle}</span>
                  </div>
                  <p className="text-zinc-200">{activeMode.details}</p>
                </div>
                <div className="sm:max-w-[280px] p-2 rounded-lg bg-black/60 border border-[#E10600]/30 text-[#E10600] font-bold text-[11px] leading-snug">
                  ⚡ {activeMode.highlight}
                </div>
              </div>
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 4: AS PEÇAS DO CARRO (31.8s) — DADOS TÉCNICOS 2026 AUDITADOS
      // ======================================================================
      if (currentScene.visualEffectType === "machine_hotspots") {
        // Seleção sincronizada com a fala de Mariana caso áudio esteja ativo
        const autoPartId =
          audioCurrentTime < 6.0 ? 1 :
          audioCurrentTime < 13.0 ? 2 :
          audioCurrentTime < 18.5 ? 5 :
          audioCurrentTime < 24.5 ? 9 : 3

        const effectivePartId = isPlaying ? autoPartId : m1SelectedPart

        const carComponents = [
          {
            id: 1,
            name: "Asa Dianteira",
            tag: "AERODINÂMICA ATIVA 2026",
            framing: "Enquadramento frontal focado nos elementos aerodinâmicos móveis",
            hudDiagram: "REGULAMENTO 2026 • CORNER MODE (CURVA) & STRAIGHT MODE (RETA)",
            desc: "Na geração técnica de 2026, a asa dianteira atua de forma ativa e coordenada com a asa traseira, ajustando seus flaps para máxima sustentação em curvas e baixo arrasto em retas.",
            importance: "Garante o direcionamento inicial e a estabilidade da frente do carro em alta velocidade.",
            visualType: "front_wing",
          },
          {
            id: 2,
            name: "Assoalho & Difusor",
            tag: "FLUXO & DIFUSOR 2026",
            framing: "Vista técnica da parte inferior e do difusor traseiro",
            hudDiagram: "ASSOALHO PARCIALMENTE PLANO • DIFUSOR DE ALTA EXPANSÃO",
            desc: "A geração de 2026 adota assoalho mais plano e difusor refinado para reduzir o efeito porpoising. A aceleração do ar sob o chassi gera diferença de pressão (princípio de Bernoulli), colando o monoposto ao asfalto.",
            importance: "Produz sustentação negativa sem depender unicamente de asas que prejudicam a velocidade em retas.",
            visualType: "floor_ground_effect",
          },
          {
            id: 3,
            name: "Cockpit & Halo",
            tag: "HOMOLOGAÇÃO FIA",
            framing: "Célula de sobrevivência e estrutura de proteção em titânio",
            hudDiagram: "TITÂNIO GRAU 5 • ENSAIO ESTÁTICO DE 120 kN (PADRÃO FIA 8869-2018)",
            desc: "O cockpit protege o piloto em posição reclinada de alta eficiência biomecânica. Acima da cabeça, o Halo de titânio é submetido em ensaio de homologação da FIA a cargas de 120 kN (aproximadamente 12 toneladas de força).",
            importance: "Proteção vital comprovada contra desacelerações severas e impactos de detritos em pista.",
            visualType: "cockpit_halo",
          },
          {
            id: 4,
            name: "Volante de Corrida",
            tag: "CENTRO DE COMANDOS",
            framing: "Close-up dos seletores rotativos e visor digital ilustrativo",
            hudDiagram: "EXEMPLO ILUSTRATIVO DE SIMULAÇÃO • MARCHA, RPM E DELTA",
            desc: "O volante funciona como o computador de bordo do piloto. Durante a volta, o piloto ajusta o balanço de frenagem entre os eixos dianteiro e traseiro, diferencial de curva e comunicação de rádio.",
            importance: "Permite ao piloto gerenciar o comportamento dinâmico do monoposto a cada curva.",
            visualType: "steering_wheel",
          },
          {
            id: 5,
            name: "Pneus de Competição",
            tag: "CONTATO COM A PISTA",
            framing: "Roda e pneu slick Pirelli deformando sobre o asfalto",
            hudDiagram: "PIRELLI 18 POLEGADAS • COMPOSTOS SLICK, INTERMEDIÁRIO E CHUVA",
            desc: "O único elo entre o monoposto e o solo. Cada composto possui sua janela térmica operacional própria (geralmente entre 85°C e 110°C) e sua taxa de degradação dita as estratégias de parada de box.",
            importance: "Determina a tração na aceleração, estabilidade lateral em curvas e eficiência de frenagem.",
            visualType: "tires_contact",
          },
          {
            id: 6,
            name: "Freios de Carbono",
            tag: "DESACELERAÇÃO EXTREMA",
            framing: "Disco de freio carbono-carbono com dutos de ventilação",
            hudDiagram: "DISCOS VENTILADOS • PICOS DE ATÉ 1.000°C • DESACELERAÇÕES DE ATÉ 5G",
            desc: "Discos ventilados em compósito carbono-carbono operando sob dutos de refrigeração forçada. Em pontos de freada brusca, como a primeira curva de Monza, as desacelerações superam 5G e as temperaturas beiram 1.000°C.",
            importance: "Reduzem a velocidade de 330 para 80 km/h em poucos metros antes do ponto de tangência.",
            visualType: "carbon_brakes",
          },
          {
            id: 7,
            name: "Suspensão",
            tag: "SOLUÇÕES DE PROJETO",
            framing: "Braços triangulares de suspensão e amortecedores internos",
            hudDiagram: "CONFIGURAÇÕES PUSH-ROD OU PULL-ROD • CONTROLE DE MERGULHO",
            desc: "Projetistas escolhem entre as geometrias push-rod e pull-rod de acordo com o empacotamento aerodinâmico e centro de gravidade do chassi, mantendo a plataforma do assoalho estável sobre as zebras.",
            importance: "Mantém a distância do assoalho em relação ao solo milimetricamente controlada.",
            visualType: "suspension",
          },
          {
            id: 8,
            name: "Asa Traseira e Aero Ativa",
            tag: "REVOLUÇÃO 2026",
            framing: "Asa traseira integrada à aerodinâmica ativa e Overtake Mode",
            hudDiagram: "AERODINÂMICA ATIVA + OVERTAKE MODE (SUBSTITUI O DRS TRADICIONAL)",
            desc: "Na era técnica de 2026, o DRS tradicional dá lugar à aerodinâmica ativa coordenada (asas dianteira e traseira alternando entre modos de curva e reta) e ao Overtake Mode para disputas de ultrapassagem.",
            importance: "Equilibra pressão máxima para curvas e velocidade eficiente nas retas de ultrapassagem.",
            visualType: "rear_wing_drs",
          },
          {
            id: 9,
            name: "Unidade de Potência 2026",
            tag: "V6 TURBO + 350 KW MGU-K",
            framing: "Conjunto híbrido térmico e elétrico (sem MGU-H)",
            hudDiagram: "MOTOR V6 TURBO 1.6L + MOTOR ELÉTRICO MGU-K DE 350 KW (SEM MGU-H)",
            desc: "A unidade de potência de 2026 removeu o MGU-H para simplificar os custos e ampliou a entrega do MGU-K elétrico para 350 kW (~470 cv), funcionando com combustíveis 100% sustentáveis em uma divisão ~50/50.",
            importance: "O motor de competição mais eficiente do mundo, com participação elétrica triplicada.",
            visualType: "power_unit",
          },
          {
            id: 10,
            name: "Transmissão & Diferencial",
            tag: "CONJUNTO TRASEIRO",
            framing: "Câmbio sequencial de 8 marchas e rampa do difusor",
            hudDiagram: "CÂMBIO SEAMLESS DE 8 VELOCIDADES • DIFERENCIAL INTEGRADO",
            desc: "Câmbio com carcaça de fibra de carbono que realiza trocas em milissegundos sem interromper a entrega de torque, posicionado logo acima do difusor aerodinâmico traseiro.",
            importance: "Transfere a propulsão híbrida instantaneamente para o eixo traseiro tracionar no asfalto.",
            visualType: "transmission_diffuser",
          },
        ]

        const activeComp = carComponents.find((c) => c.id === effectivePartId) || carComponents[0]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E10600] text-white font-black">
                  PEÇA {activeComp.id}/10
                </span>
                <span className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                  ANATOMIA TÉCNICA 2026 • {activeComp.name}
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 bg-black/60 border border-white/10 px-2 py-0.5 rounded hidden sm:inline">
                {activeComp.hudDiagram}
              </span>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              {activeComp.visualType === "front_wing" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-cyan-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(6,182,212,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    AERODINÂMICA ATIVA INTEGRADA (2026)
                  </span>
                  <div className="py-2 text-base font-mono font-black text-white">
                    CORNER MODE (CURVAS) ⮀ STRAIGHT MODE (RETAS)
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Flaps móveis na asa dianteira reduzem o arrasto em retas de forma coordenada com a asa traseira.
                  </p>
                </div>
              )}

              {activeComp.visualType === "floor_ground_effect" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-blue-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(59,130,246,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block mb-1">
                    ASSOALHO PARCIALMENTE PLANO & DIFUSOR TRASEIRO
                  </span>
                  <div className="py-2 text-base font-mono font-black text-white">
                    SUCÇÃO POR DIFERENÇA DE PRESSÃO (BERNOULLI)
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    O fluxo de ar acelerado sob o assoalho puxa o carro ao solo de forma estável, sem oscilações violentas.
                  </p>
                </div>
              )}

              {activeComp.visualType === "cockpit_halo" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-amber-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(245,158,11,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    ENSAIO REGULAMENTAR FIA STANDARD 8869-2018
                  </span>
                  <div className="py-2 text-2xl font-mono font-black text-white">
                    RESISTÊNCIA ESTÁTICA DE <span className="text-[#E10600]">120 kN</span> (~12 TONELADAS)
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Célula monocoque em fibra de carbono encimada pela estrutura em titânio Grau 5.
                  </p>
                </div>
              )}

              {activeComp.visualType === "steering_wheel" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/85 border border-purple-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(168,85,247,0.2)] animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-2 border-b border-purple-500/20 pb-1">
                    <span>PAINEL DIGITAL (EXEMPLO ILUSTRATIVO)</span>
                    <span>BALANÇO DE FREIO & DIFERENCIAL</span>
                  </div>
                  <div className="py-2 flex items-center justify-center gap-3 text-xs font-mono font-bold text-white">
                    <span className="px-2 py-1 rounded bg-red-600/30 border border-red-500/40">MARCHA: 7</span>
                    <span className="px-2 py-1 rounded bg-purple-600/30 border border-purple-500/40">RPM: 11.850</span>
                    <span className="px-2 py-1 rounded bg-emerald-600/30 border border-emerald-500/40">DELTA: -0.142s</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Seletores dinâmicos permitem ao piloto reconfigurar parâmetros mecânicos em cada trecho do circuito.
                  </p>
                </div>
              )}

              {activeComp.visualType === "tires_contact" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-red-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(225,6,0,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-[#E10600] font-bold uppercase tracking-widest block mb-1">
                    PIRELLI 18 POLEGADAS • DEGRADAÇÃO E ADERÊNCIA
                  </span>
                  <div className="py-2 text-lg font-mono font-black text-white">
                    JANELAS OPERACIONAIS TÍPICAS: <span className="text-amber-400">85°C A 110°C</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    A temperatura ideal varia por composto; manter a borracha na janela térmica correta evita derrapagens.
                  </p>
                </div>
              )}

              {activeComp.visualType === "carbon_brakes" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/80 border border-orange-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(249,115,22,0.25)] animate-fade-in">
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block mb-1">
                    FREIOS CARBONO-CARBONO VENTILADOS
                  </span>
                  <div className="py-2 text-xl font-mono font-black text-orange-300">
                    PICOS DE ATÉ 1.000°C SOB DESACELERAÇÕES DE 5G
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Freadas brutais antes de curvas lentas exigem centenas de quilos de força no pedal para frear em segundos.
                  </p>
                </div>
              )}

              {activeComp.visualType === "suspension" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-emerald-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(16,185,129,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                    GEOMETRIAS PUSH-ROD OU PULL-ROD
                  </span>
                  <div className="py-2 text-base font-mono font-black text-white">
                    ESTABILIDADE DA PLATAFORMA DO ASSOALHO
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    A escolha entre push-rod ou pull-rod depende do projeto de empacotamento aerodinâmico de cada construtor.
                  </p>
                </div>
              )}

              {activeComp.visualType === "rear_wing_drs" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-red-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(225,6,0,0.25)] animate-fade-in">
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block mb-1">
                    AERODINÂMICA ATIVA & OVERTAKE MODE (2026)
                  </span>
                  <div className="py-2 text-base font-mono font-black text-white">
                    SUBSTITUIÇÃO DO DRS TRADICIONAL
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Em vez de flap único de DRS, as asas operam em modo duplo de baixa resistência, com potência elétrica extra para o ataque.
                  </p>
                </div>
              )}

              {activeComp.visualType === "power_unit" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/80 border border-yellow-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(234,179,8,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-widest block mb-1">
                    UNIDADE PROPULSORA 2026 (SEM MGU-H)
                  </span>
                  <div className="py-2 text-xl font-mono font-black text-white">
                    V6 TURBO 1.6L + <span className="text-emerald-400">MGU-K DE 350 KW (~470 CV)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Combustíveis 100% sustentáveis e motor elétrico triplicado, alcançando uma divisão equilibrada de cerca de 50/50.
                  </p>
                </div>
              )}

              {activeComp.visualType === "transmission_diffuser" && (
                <div className="relative w-full max-w-xl p-4 rounded-2xl bg-black/75 border border-cyan-500/40 backdrop-blur-md text-center shadow-[0_0_35px_rgba(6,182,212,0.2)] animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    CÂMBIO SEAMLESS DE 8 MARCHAS & DIFUSOR
                  </span>
                  <div className="py-2 text-base font-mono font-black text-white">
                    TRANSFERÊNCIA INSTANTÂNEA DE TORQUE
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    O câmbio sequencial sem perda de tração trabalha integrado ao difusor traseiro para expulsar o ar do assoalho.
                  </p>
                </div>
              )}
            </div>

            <div className="pointer-events-auto w-full max-w-5xl mx-auto rounded-2xl bg-black/90 border border-white/20 p-2.5 sm:p-3.5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth pb-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:none">
                {carComponents.map((comp) => {
                  const isActive = effectivePartId === comp.id
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setM1SelectedPart(comp.id)}
                      className={cn(
                        "shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]",
                        isActive
                          ? "bg-[#E10600] text-white border-red-500 shadow-md scale-102"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <span className="opacity-70 mr-1 font-mono">{comp.id}.</span>
                      {comp.name}
                    </button>
                  )
                })}
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mt-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-white text-sm">{activeComp.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono italic">({activeComp.framing})</span>
                  </div>
                  <p className="text-zinc-200">{activeComp.desc}</p>
                </div>
                <div className="sm:max-w-[280px] p-2 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] leading-snug">
                  ⚡ <strong>Papel Vital:</strong> {activeComp.importance}
                </div>
              </div>
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 5: PILOTOS E EQUIPES (27.2s)
      // ======================================================================
      if (currentScene.visualEffectType === "pitstop_team") {
        const cueIndex = audioCurrentTime < 8.5 ? 1 : audioCurrentTime < 17.5 ? 2 : 3

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PILOTOS E EQUIPES • TRABALHO COLETIVO E TÍTULOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                TRECHO 0{cueIndex} DE 03
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    DUAS DISPUTAS SIMULTÂNEAS
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Pilotos e Construtores
                  </h3>
                  <p className="text-xs text-zinc-300">
                    O piloto luta pelo campeonato individual de prestígio, enquanto a equipe soma os pontos de seus dois carros para o título de construtores.
                  </p>
                </div>
              )}

              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-amber-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    GESTÃO TÉCNICA
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Além do Pé no Acelerador
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Velocidade pura não é suficiente: o piloto precisa preservar os pneus, administrar o combustível e gerenciar o ritmo de corrida.
                  </p>
                </div>
              )}

              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-emerald-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                    OS BASTIDORES
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Estratégia, Rádio e Mecânicos
                  </h3>
                  <p className="text-xs text-zinc-300">
                    A comunicação contínua entre engenheiro e piloto e trocas de pneus em 2 segundos definem Grandes Prêmios.
                  </p>
                </div>
              )}
            </div>

            <div>
              {cueIndex === 1 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "DOIS CAMPEONATOS AO MESMO TEMPO", "Campeonato de Pilotos e Campeonato de Construtores disputados volta a volta.")}
              {cueIndex === 2 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "O PAPEL DO PILOTO", "Inteligência de corrida, preservação mecânica e paciência tática nas ultrapassagens.")}
              {cueIndex === 3 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "A FORÇA DA EQUIPE", "Estratégia de boxes no pit wall e trabalho cirúrgico dos mecânicos na troca de pneus.")}
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 6: COMO ACONTECE UMA CORRIDA (32.4s) — PÓRTICO FIA SEM LUZ VERDE
      // ======================================================================
      if (currentScene.visualEffectType === "starting_grid") {
        const lightCount =
          m1StartStep === "light_1" ? 1 :
          m1StartStep === "light_2" ? 2 :
          m1StartStep === "light_3" ? 3 :
          m1StartStep === "light_4" ? 4 :
          m1StartStep === "all_on" ? 5 : 0

        const isRacing = m1StartStep === "racing"
        const isSuspense = m1StartStep === "all_on"
        const isLightsOut = m1StartStep === "lights_out"

        // Sincronização automática com Mariana quando áudio estiver tocando
        const cueIndex = audioCurrentTime < 8.5 ? 1 : audioCurrentTime < 14.5 ? 2 : audioCurrentTime < 21.5 ? 3 : 4

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20 overflow-hidden">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E10600] animate-pulse" />
                <span className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                  PROCEDIMENTO OFICIAL DE LARGADA FIA • CIRCUITO PRINCIPAL
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-black/60 border border-white/10 px-2.5 py-0.5 rounded">
                SIMULAÇÃO: {m1StartStep.toUpperCase()} • FASE {cueIndex}/4
              </span>
            </div>

            <div className="relative flex-1 flex flex-col items-center justify-center">
              {/* Estrutura Metálica Superior do Pórtico de Largada */}
              <div className="relative w-full max-w-xl mx-auto flex flex-col items-center">
                <div className="w-full h-3 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700 rounded-t border-t border-white/30 shadow-md" />

                {/* Painel com as 5 Colunas de Luzes FIA (Sem lâmpadas verdes - sinal oficial é o apagamento) */}
                <div className="w-full bg-zinc-950/95 border-x border-b border-white/20 rounded-b-2xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  <div className="text-[10px] font-mono text-center uppercase tracking-widest text-zinc-400 mb-3">
                    PÓRTICO OFICIAL DA DIREÇÃO DE PROVA FIA
                  </div>

                  <div className="grid grid-cols-5 gap-3 sm:gap-6 justify-items-center">
                    {[1, 2, 3, 4, 5].map((idx) => {
                      const isRedOn = lightCount >= idx && !isLightsOut && !isRacing
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <div className="w-9 sm:w-14 h-16 sm:h-22 bg-black rounded-xl border border-zinc-700 p-1 flex flex-col justify-between items-center shadow-inner relative">
                            {/* Lente Superior Vermelha */}
                            <div
                              className={cn(
                                "w-6 h-6 sm:w-9 sm:h-9 rounded-full border transition-all duration-150",
                                isRedOn
                                  ? "bg-[#E10600] border-red-400 shadow-[0_0_30px_#e10600,0_0_60px_rgba(225,6,0,0.8)]"
                                  : "bg-zinc-900 border-zinc-800 opacity-20"
                              )}
                            />
                            {/* Lente Inferior Dupla Vermelha */}
                            <div
                              className={cn(
                                "w-6 h-6 sm:w-9 sm:h-9 rounded-full border transition-all duration-150",
                                isRedOn
                                  ? "bg-[#E10600] border-red-400 shadow-[0_0_30px_#e10600,0_0_60px_rgba(225,6,0,0.8)]"
                                  : "bg-zinc-900 border-zinc-800 opacity-20"
                              )}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 font-bold">LUZ {idx}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Reflexo Vermelho Realista sobre o Asfalto */}
                  {lightCount > 0 && !isLightsOut && !isRacing && (
                    <div className="mt-3 w-full h-8 bg-gradient-to-b from-[#E10600]/30 via-[#E10600]/10 to-transparent blur-md rounded-full transition-all duration-200" />
                  )}
                </div>
              </div>

              {/* Mensagens de Feedback Sincronizadas da Simulação */}
              <div className="relative mt-4 w-full max-w-lg text-center font-mono">
                {isSuspense && (
                  <div className="p-2.5 rounded-xl bg-black/90 border border-red-500 text-[#E10600] font-black text-sm tracking-widest shadow-[0_0_30px_rgba(225,6,0,0.6)] animate-pulse">
                    ⚠️ 5 LUZES ACESAS! MOTORES EM ALTO GIRO! ESPERA IMPREVISÍVEL (1s A 3s)...
                  </div>
                )}
                {isLightsOut && (
                  <div className="p-2.5 rounded-xl bg-black/95 border border-white text-white font-black text-base tracking-widest shadow-2xl animate-ping">
                    ● LUZES APAGADAS! SINAL OFICIAL DA FIA! ●
                  </div>
                )}
                {isRacing && (
                  <div className="p-3 rounded-xl bg-black/90 border border-emerald-500/80 text-white font-black text-sm sm:text-base tracking-wider shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-fade-in">
                    <span className="text-emerald-400 block text-base sm:text-lg mb-1">
                      🏎️💨 LARGADA AUTORIZADA! PÉ NO FUNDO PARA A CURVA 1!
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-normal block">
                      (Simulação educacional da arrancada — O sinal oficial da FIA de largada é o apagamento das 5 luzes)
                    </span>
                  </div>
                )}
                {m1StartStep.startsWith("light_") && (
                  <div className="p-2 rounded-xl bg-black/80 border border-amber-500/50 text-amber-300 text-xs font-bold">
                    Acendendo luzes progressivas ({lightCount}/5 a cada 1 segundo)... Pilotos acionando embreagem!
                  </div>
                )}
                {m1StartStep === "idle" && (
                  <div className="p-2 rounded-xl bg-black/70 border border-white/10 text-zinc-400 text-xs">
                    Monopostos alinhados nos colchetes do grid. Clique abaixo para iniciar a simulação oficial da FIA.
                  </div>
                )}
              </div>
            </div>

            <div className="pointer-events-auto w-full max-w-2xl mx-auto rounded-2xl bg-black/90 border border-white/20 p-3 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3">
              <div className="text-left text-xs font-mono">
                <span className="text-zinc-400 block text-[10px]">DIREÇÃO DE PROVA FIA</span>
                <span className="font-bold text-white">Semáforo de Largada</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunStartSequence}
                  className="px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  {m1StartStep === "idle" ? "Iniciar Luzes da Largada" : "Repetir Procedimento"}
                </button>
                {m1StartStep !== "idle" && (
                  <button
                    type="button"
                    onClick={handleResetStartSequence}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Resetar
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 7: O QUE OBSERVAR DURANTE A PROVA (26.9s)
      // ======================================================================
      if (currentScene.visualEffectType === "telemetry_wall") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                O QUE OBSERVAR • TORRE DE TEMPOS E ESTRATÉGIA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                TRECHO 0{cueIndex} DE 03
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/30 backdrop-blur-md max-w-md w-full shadow-2xl animate-fade-in">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-mono text-xs">
                    <span className="font-bold text-cyan-400">TORRE DE TRANSMISSÃO</span>
                    <span className="text-[10px] text-zinc-400">GAP / INT</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center p-1 rounded bg-white/5">
                      <span className="text-white font-bold">1. VER (Líder)</span>
                      <span className="text-emerald-400 font-bold">LÍDER</span>
                    </div>
                    <div className="flex justify-between items-center p-1 rounded bg-white/5">
                      <span className="text-white font-bold">2. NOR</span>
                      <span className="text-amber-300 font-bold">GAP +2.140s • INT +2.140s</span>
                    </div>
                    <div className="flex justify-between items-center p-1 rounded bg-white/5">
                      <span className="text-white font-bold">3. LEC</span>
                      <span className="text-zinc-300 font-bold">GAP +3.200s • INT +1.060s</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    GAP mede a distância em segundos até o líder; INT mede a distância para o carro à frente.
                  </p>
                </div>
              )}

              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-amber-500/30 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    GESTÃO DE COMPOSTOS
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Pneus e Janelas de Paradas
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Compostos Macios (vermelho) oferecem aderência imediata com maior desgaste; Médios (amarelo) equilibram durabilidade; Duros (branco) suportam longos trechos.
                  </p>
                </div>
              )}

              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-emerald-500/30 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                    ESTRATÉGIA DE PISTA
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white mb-1">
                    Undercut e Overcut
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Parar uma volta antes com pneus novos pode garantir a ultrapassagem na saída dos boxes, sem necessidade de disputa roda a roda na pista.
                  </p>
                </div>
              )}
            </div>

            <div>
              {cueIndex === 1 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "LEITURA DA TORRE DE TEMPOS", "Observe o GAP para saber quem lidera e o INT para antecipar ultrapassagens.")}
              {cueIndex === 2 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "PNEUS E RITMO DE CORRIDA", "A degradação dos pneus define a hora exata da parada nos boxes.")}
              {cueIndex === 3 && renderMarianaSyncBadge("MARIANA DA RÁDIO F1", "VITÓRIA PELA ESTRATÉGIA", "Muitas posições são ganhas na eficiência do pit stop e nas voltas rápidas com pista limpa.")}
            </div>
          </div>
        )
      }

      // ======================================================================
      // CENA 8: VOCÊ ESTÁ PRONTO PARA COMEÇAR (20.2s) — REVISÃO HOLÍSTICA
      // ======================================================================
      if (currentScene.visualEffectType === "checkered_finish") {
        // Revelação progressiva sincronizada com a fala de encerramento
        const autoDomainId = audioCurrentTime < 7.0 ? 1 : audioCurrentTime < 13.5 ? 3 : 5
        const effectiveDomainId = isPlaying ? autoDomainId : m1ReviewHotspot

        const reviewDomains = [
          {
            id: 1,
            title: "Aerodinâmica & Assoalho",
            tag: "DOWNFORCE & BERNOULLI",
            focusArea: "Asas ativas ajustáveis e assoalho parcialmente plano que gera sucção para curvas sem arrasto excessivo.",
            essence: "Aderência gerada pelo fluxo de ar acelerado sob o monoposto.",
          },
          {
            id: 2,
            title: "Pneus & Aderência",
            tag: "CONTATO MECÂNICO",
            focusArea: "Pirelli 18 polegadas operando em janelas térmicas específicas de 85°C a 110°C conforme o composto.",
            essence: "Quatro manchas de contato que determinam tração, frenagem e curvas.",
          },
          {
            id: 3,
            title: "Cockpit & Halo de Titânio",
            tag: "SEGURANÇA REGULAMENTAR",
            focusArea: "Estrutura em titânio Grau 5 homologada para suportar 120 kN de ensaio estático (FIA 8869-2018).",
            essence: "Proteção biomecânica comprovada contra impactos severos.",
          },
          {
            id: 4,
            title: "Unidade Propulsora 2026",
            tag: "HÍBRIDO V6 + 350 KW MGU-K",
            focusArea: "V6 Turbo a combustão sustentável com motor elétrico ampliado para 350 kW e remoção do MGU-H.",
            essence: "Eficiência térmica recorde com divisão de cerca de 50% térmica e 50% elétrica.",
          },
          {
            id: 5,
            title: "Procedimento da Largada",
            tag: "5 LUZES VERMELHAS FIA",
            focusArea: "Alinhamento no grid, 5 luzes acendendo a cada segundo e arrancada autorizada no apagamento simultâneo.",
            essence: "Reação em milissegundos sem semáforo verde: o sinal de partida é o blecaute.",
          },
          {
            id: 6,
            title: "Equipes e os Dois Mundiais",
            tag: "A DISPUTA GLOBAL",
            focusArea: "20 pilotos de elite, paradas de boxes de 2 segundos e pontuação oficial para Pilotos e Construtores.",
            essence: "Engenharia coletiva de alta tecnologia decidida nos milésimos de segundo.",
          },
        ]

        const activeDomain = reviewDomains.find((d) => d.id === effectiveDomainId) || reviewDomains[0]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-mono font-black uppercase text-white tracking-wider">
                  SÍNTESE VISUAL DO APRENDIZADO • MÓDULO 1 CONCLUÍDO
                </span>
              </div>
              <button
                type="button"
                onClick={() => setM1ShowAllSummary(true)}
                className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Ver Dossiê Completo
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-xl p-4 sm:p-5 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-xl text-center shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2 border-b border-white/10 pb-1.5">
                  <span className="text-[#E10600] font-black uppercase tracking-wider">{activeDomain.tag}</span>
                  <span>DOMÍNIO 0{activeDomain.id} DE 06</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mb-2">{activeDomain.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed mb-3">
                  {activeDomain.focusArea}
                </p>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cyan-300 font-mono text-xs font-bold">
                  ⚡ Síntese: {activeDomain.essence}
                </div>
              </div>
            </div>

            <div className="pointer-events-auto w-full max-w-4xl mx-auto rounded-2xl bg-black/90 border border-white/20 p-2.5 sm:p-3.5 backdrop-blur-xl shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
                {reviewDomains.map((dom) => {
                  const isActive = effectiveDomainId === dom.id
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => setM1ReviewHotspot(dom.id)}
                      className={cn(
                        "p-2 rounded-xl text-left transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E10600]",
                        isActive
                          ? "bg-[#E10600] text-white border-red-500 shadow-lg scale-102"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <span className="text-[9px] font-mono block opacity-70">0{dom.id}</span>
                      <span className="text-xs font-black truncate block">{dom.title.split(" ")[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {m1ShowAllSummary && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Dossiê Completo de Revisão do Módulo 1"
                className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
              >
                <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-white/20 p-5 shadow-2xl text-left">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#E10600] font-bold block">
                        Dossiê Educacional F1
                      </span>
                      <h3 className="text-lg font-black text-white">Tudo o Que Você Aprendeu no Módulo 1</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setM1ShowAllSummary(false)}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Fechar
                    </button>
                  </div>

                  <div className="space-y-3 mb-5">
                    {reviewDomains.map((dom) => (
                      <div key={dom.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{dom.title}</span>
                          <span className="text-[9px] font-mono text-cyan-400 uppercase">{dom.tag}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed mb-1">{dom.focusArea}</p>
                        <span className="text-[11px] text-amber-300 italic block">“{dom.essence}”</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setM1ShowAllSummary(false)
                        setViewStage("quiz")
                      }}
                      className="px-4 py-2 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase cursor-pointer shadow-lg"
                    >
                      Pronto para o Questionário! →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
    }

    // ------------------------------------------------------------------------
    // MÓDULO 2: A MÁQUINA (COMO FUNCIONA UM CARRO DE F1)
    // ------------------------------------------------------------------------
    

    // ------------------------------------------------------------------------
    // MÓDULO 2: A MÁQUINA (COMO FUNCIONA UM CARRO DE F1)
    // ------------------------------------------------------------------------
    if (activeModuleId === 2) {
      // CENA 1: A MÁQUINA POR INTEIRO (22.3s)
      if (currentScene.visualEffectType === "mod2_machine_overview") {
        const cueIndex = audioCurrentTime < 7.5 ? 1 : audioCurrentTime < 15.0 ? 2 : 3
        const m2Components = [
          { id: 1, name: "Asa Dianteira", top: "72%", left: "20%", text: "Controla o fluxo inicial de ar e gera carga aerodinâmica frontal.", zone: "AERODINÂMICA" },
          { id: 2, name: "Pneus Pirelli 18\"", top: "66%", left: "34%", text: "Único ponto de contato com o asfalto. Aderência mecânica essencial.", zone: "CONTATO" },
          { id: 3, name: "Cockpit & Volante", top: "46%", left: "52%", text: "Célula de sobrevivência e centro de controle digital do piloto.", zone: "COMANDO" },
          { id: 4, name: "Freios de Carbono", top: "62%", left: "40%", text: "Operam a até 1.000°C sob desacelerações superiores a 5G.", zone: "FRENAGEM" },
          { id: 5, name: "Unidade de Potência 2026", top: "48%", left: "68%", text: "V6 Turbo 1.6L híbrido com MGU-K elétrico de 350 kW.", zone: "PROPULSÃO" },
        ]
        const effectiveId = cueIndex === 2 ? 1 : m2Hotspot
        const activeComp = m2Components.find((c) => c.id === effectiveId) || m2Components[0]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 02 • ANATOMIA E HARMONIA DA MÁQUINA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            {/* Hotspots Interativos com destaque sincronizado */}
            <div className="relative flex-1">
              {m2Components.map((c) => {
                const isAutoHighlighted = (cueIndex === 1) || (cueIndex === 2 && (c.id === 1 || c.id === 2))
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setM2Hotspot(c.id)}
                    style={{ top: c.top, left: c.left }}
                    className={cn(
                      "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all cursor-pointer shadow-xl",
                      m2Hotspot === c.id || isAutoHighlighted
                        ? "bg-[#E10600] text-white ring-2 ring-white scale-110 shadow-[0_0_25px_rgba(225,6,0,0.8)]"
                        : "bg-black/85 text-zinc-300 border border-white/30 hover:border-[#E10600]"
                    )}
                  >
                    <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-black">
                      {c.id}
                    </span>
                    <span className="hidden sm:inline font-bold uppercase">{c.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Mariana Sync Badge */}
            {cueIndex === 1 && renderMarianaSyncBadge("01. VISÃO SISTÊMICA", "Sistemas em Harmonia Perfeita", "A velocidade nasce da integração conjunta entre aerodinâmica, pneus, motor, freios e equilíbrio mecânico.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. AJUSTE MILIMÉTRICO", "Sensibilidade Extrema de Acerto", "Mudanças mínimas na asa ou na pressão dos pneus transformam radicalmente a dirigibilidade do monoposto.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. HOMEM E MÁQUINA", "Organismo Único no Limite", "O piloto traduz o comportamento físico do carro para que a engenharia refine o acerto a cada volta.")}

            {/* Info Card Flutuante */}
            <div className="pointer-events-auto max-w-xl mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
              <div className="text-left text-xs">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">{activeComp.zone}</span>
                <span className="font-bold text-white">{activeComp.id}. {activeComp.name}</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{activeComp.text}</p>
              </div>
              <div className="shrink-0 flex gap-1">
                {m2Components.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setM2Hotspot(c.id)}
                    className={cn(
                      "w-6 h-6 rounded text-[10px] font-mono font-bold transition-all",
                      m2Hotspot === c.id ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      // CENA 2: AERODINÂMICA: DOWNFORCE E ARRASTO (27.8s)
      if (currentScene.visualEffectType === "mod2_aerodynamics") {
        const cueIndex = audioCurrentTime < 9.0 ? 1 : audioCurrentTime < 18.0 ? 2 : 3
        const aeroZones = {
          front_wing: { title: "Asa Dianteira", desc: "Organiza o fluxo de ar inicial e direciona vórtices limpos para o assoalho." },
          floor: { title: "Assoalho & Difusor", desc: "Gera a maior parte da carga aerodinâmica (downforce) sem produzir arrasto excessivo." },
          rear_wing: { title: "Asa Traseira", desc: "Pressiona as rodas traseiras para tração em curvas, mas impõe arrasto em retas." },
        }
        const activeZone = aeroZones[m2AeroZone]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-60 z-10" viewBox="0 0 1000 600" fill="none">
              <path d="M 50,380 Q 250,360 400,320 T 750,260 T 950,220" stroke={cueIndex === 2 ? "#E10600" : "#00E5FF"} strokeWidth="3" strokeDasharray="8 6" className={!reduceMotion ? "animate-pulse" : ""} />
              <path d="M 50,420 Q 300,410 500,400 T 800,380 T 950,370" stroke="#00E5FF" strokeWidth="2" strokeDasharray="10 8" />
              <path d="M 50,450 Q 350,470 650,460 T 950,440" stroke="#E10600" strokeWidth="2" strokeDasharray="6 4" />
            </svg>

            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm z-20">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                AERODINÂMICA • DOWNFORCE VS ARRASTO (DRAG)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    FORÇA VERTICAL DESCENDENTE
                  </span>
                  <div className="text-xl font-mono font-black text-white py-1">
                    DOWNFORCE: PRESSÃO AO SOLO ↓
                  </div>
                  <p className="text-xs text-zinc-300">
                    O ar atua como uma mão invisível empurrando os pneus contra a pista, multiplicando a velocidade nas curvas.
                  </p>
                </div>
              )}
              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-red-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block mb-1">
                    RESISTÊNCIA AO AVANÇO
                  </span>
                  <div className="text-xl font-mono font-black text-white py-1">
                    ARRASTO (DRAG): FORÇA OPOSTA ⮂
                  </div>
                  <p className="text-xs text-zinc-300">
                    Quanto maior a asa, mais aderência nas curvas, porém menor a velocidade máxima atingível nas retas longas.
                  </p>
                </div>
              )}
              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/80 border border-amber-500/40 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    O DILEMA DA ENGENHARIA
                  </span>
                  <div className="text-xl font-mono font-black text-white py-1">
                    EFICIÊNCIA AERODINÂMICA (L/D)
                  </div>
                  <p className="text-xs text-zinc-300">
                    O segredo é encontrar a carga aerodinâmica exata para ganhar tempo nas curvas sem virar presa fácil nas retas.
                  </p>
                </div>
              )}
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. DOWNFORCE", "Aderência em Alta Velocidade", "O ar empurra o carro para baixo, aumentando o atrito dos pneus sem adicionar massa real.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. ARRASTO (DRAG)", "A Barreira Invisível nas Retas", "A resistência do ar freia o monoposto, exigindo compromissos milimétricos de inclinação das asas.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O COMPROMISSO", "Eficiência Aerodinâmica L/D", "Engenheiros equilibram sustentação negativa e arrasto para o tempo de volta ideal.")}

            <div className="pointer-events-auto max-w-md mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Áreas do Fluxo</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-600 text-white font-black">{m2AeroZone.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(["front_wing", "floor", "rear_wing"] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setM2AeroZone(zone)}
                    className={cn(
                      "py-1 rounded text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                      m2AeroZone === zone ? "bg-[#E10600] text-white shadow-md" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                    )}
                  >
                    {zone === "front_wing" ? "Asa Diant." : zone === "floor" ? "Assoalho" : "Asa Tras."}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-300"><strong>{activeZone.title}:</strong> {activeZone.desc}</p>
            </div>
          </div>
        )
      }

      // CENA 3: PNEUS: O CONTATO COM A PISTA (32.6s)
      if (currentScene.visualEffectType === "mod2_tires") {
        const cueIndex = audioCurrentTime < 10.5 ? 1 : audioCurrentTime < 21.0 ? 2 : 3
        const tiresInfo = {
          soft: { name: "Macio (Vermelho)", grip: "Máxima (10/10)", life: "Curta (15-20 voltas)", temp: "85°C - 100°C" },
          medium: { name: "Médio (Amarelo)", grip: "Equilibrada (8/10)", life: "Média (25-35 voltas)", temp: "90°C - 105°C" },
          hard: { name: "Duro (Branco)", grip: "Moderada (6/10)", life: "Longa (40+ voltas)", temp: "95°C - 110°C" },
        }
        const activeTire = tiresInfo[m2TireCompound]

        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PNEUS PIRELLI 18\" • JANELA TÉRMICA & COMPOSTOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {cueIndex === 1 && (
                <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/50 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                    TEMPERATURA OPERACIONAL IDEAL
                  </span>
                  <div className="text-2xl font-mono font-black text-white py-1">
                    85°C A 110°C
                  </div>
                  <p className="text-xs text-zinc-300">
                    Pneus frios escorregam sem aderência mecânica; pneus superaquecidos sofrem bolhas (blistering) e degradação instantânea.
                  </p>
                </div>
              )}
              {cueIndex === 2 && (
                <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md text-center max-w-lg shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                    TRIPLA ESCOLHA DE SLICKS SECOS
                  </span>
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold">
                      🔴 MACIO<br/><span className="text-[10px] text-zinc-400">Grip Rápido</span>
                    </div>
                    <div className="p-2 rounded bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs font-bold">
                      🟡 MÉDIO<br/><span className="text-[10px] text-zinc-400">Versátil</span>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-500/40 text-zinc-300 text-xs font-bold">
                      ⚪ DURO<br/><span className="text-[10px] text-zinc-400">Resistente</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Compostos macios dão volta rápida na classificação; médios e duros constroem o ritmo das corridas de domingo.
                  </p>
                </div>
              )}
              {cueIndex === 3 && (
                <div className="p-4 rounded-2xl bg-black/85 border border-blue-500/50 backdrop-blur-md text-center max-w-md shadow-2xl animate-fade-in">
                  <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block mb-1">
                    CONDIÇÕES DE CHUVA
                  </span>
                  <div className="flex items-center justify-center gap-3 py-1 text-sm font-mono font-bold text-white">
                    <span className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">🟢 INTERMEDIÁRIO (30 L/s)</span>
                    <span className="px-2 py-1 rounded bg-blue-950/60 border border-blue-500/50 text-blue-300">🔵 FULL WET (85 L/s)</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Sulcos profundos na banda de rodagem drenam dezenas de litros de água por segundo para evitar aquaplanagem a 300 km/h.
                  </p>
                </div>
              )}
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. JANELA TÉRMICA", "O Ponto de Contato com a Pista", "Pneus frios não geram atrito químico com o asfalto; superaquecidos desmancham em poucas curvas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MACIO, MÉDIO E DURO", "Aderência vs Durabilidade", "O pneu mais macio oferece velocidade imediata, mas o melhor pneu é aquele que se adapta à estratégia.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. PISTA MOLHADA", "Drenagem Extrema Contra Aquaplanagem", "Intermediários e pneus de chuva pesada canalizam a água e salvam o carro em condições imprevisíveis.")}

            <div className="pointer-events-auto max-w-md mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-1 mb-2">
                {(["soft", "medium", "hard"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setM2TireCompound(c)}
                    className={cn(
                      "flex-1 py-1 rounded text-[10px] font-black uppercase text-center transition-all cursor-pointer",
                      m2TireCompound === c ? "bg-[#E10600] text-white" : "bg-white/10 text-zinc-300 hover:bg-white/20"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-zinc-300 flex justify-between">
                <span><strong>Composto:</strong> {activeTire.name}</span>
                <span><strong>Temp:</strong> {activeTire.temp}</span>
              </div>
            </div>
          </div>
        )
      }

      // CENA 4: COCKPIT E VOLANTE: O CENTRO DE COMANDO (28.4s)
      if (currentScene.visualEffectType === "mod2_steering_wheel") {
        const cueIndex = audioCurrentTime < 9.0 ? 1 : audioCurrentTime < 18.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                VOLANTE MULTIFUNCIONAL • CENTRAL DE COMANDO A 300 KM/H
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-purple-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-[0_0_35px_rgba(168,85,247,0.25)] animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-2 border-b border-purple-500/20 pb-1">
                  <span>TELEMETRIA INTEGRADA</span>
                  <span>SIMULAÇÃO DE PAINEL DIGITAL</span>
                </div>
                <div className="py-2 flex items-center justify-center gap-3 text-xs font-mono font-bold text-white">
                  <span className={cn("px-2.5 py-1 rounded transition-all", cueIndex === 2 ? "bg-red-600 text-white animate-pulse" : "bg-red-600/30 text-zinc-300")}>
                    MARCHA: 7
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-600/30 text-zinc-300">
                    RPM: 11.850
                  </span>
                  <span className={cn("px-2.5 py-1 rounded transition-all", cueIndex === 3 ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-600/30 text-zinc-300")}>
                    DELTA: -0.142s
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-300">
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    BALANÇO DE FREIO: <strong>56.5% F</strong>
                  </div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/10">
                    MAPA ELÉTRICO: <strong>MODE ATTACK</strong>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. COMPUTADOR DE BORDO", "Mais que um Volante de Direção", "Reúne dezenas de controles de telemetria, regulagens de injeção e comunicação constante.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. BORBOLETAS & FREIOS", "Paddles de Marcha e Balanço", "Trocas sequenciais sem tirar as mãos do volante e ajuste fino do equilíbrio de frenagem entre eixos.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. RÁDIO & DISPLAY CENTRAL", "Comunicação e Tempos de Volta", "O piloto monitora tempos delta, marcha e rotação enquanto recebe instruções táticas do engenheiro.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              💡 <em>Exemplo ilustrativo: botões rotativos permitem ao piloto alterar centenas de parâmetros dinâmicos curva por curva.</em>
            </div>
          </div>
        )
      }

      // CENA 5: FREIOS: CONTROLAR A VELOCIDADE (25.8s)
      if (currentScene.visualEffectType === "mod2_brakes") {
        const cueIndex = audioCurrentTime < 8.5 ? 1 : audioCurrentTime < 17.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                FREIOS DE CARBONO-CARBONO • ENERGIA CINÉTICA EM CALOR
              </span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-orange-500/40 backdrop-blur-md max-w-md w-full text-center shadow-[0_0_35px_rgba(249,115,22,0.25)] animate-fade-in">
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block mb-1">
                  PICO TÉRMICO SOB DESACELERAÇÃO
                </span>
                <div className="py-2 text-3xl font-mono font-black text-orange-400">
                  {cueIndex === 1 ? "1.000°C" : cueIndex === 2 ? "FLUXO DE DUTOS" : "ESTABILIDADE > 5G"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "Os discos de fibra de carbono brilham incandescentes ao converter o movimento violento em calor em menos de dois segundos."}
                  {cueIndex === 2 && "Dutos de refrigeração aerodinâmicos canalizam o ar limpo diretamente para as pinças e discos para evitar colapso térmico."}
                  {cueIndex === 3 && "O piloto regula a distribuição de pressão entre as rodas dianteiras e traseiras para manter a trajetória perfeita na entrada da curva."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CALOR INCANDESCENTE", "Desaceleração a Mais de 1.000°C", "A energia cinética é convertida em calor brutal em poucos metros sob forças de até 5G.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. REFRIGERAÇÃO ATIVA", "Dutos de Resfriamento", "O ar frio é conduzido diretamente aos tambores de roda para manter os componentes na faixa ideal.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ESTABILIDADE DE ENTRADA", "Equilíbrio entre Eixos Dianteiro e Traseiro", "Evita o travamento das rodas traseiras antes do piloto apontar para o ápice da curva.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-400">
              Discos em fibra de carbono trabalham na faixa de 300°C a 1.000°C.
            </div>
          </div>
        )
      }

      // CENA 6: UNIDADE DE POTÊNCIA HÍBRIDA 2026 (27.2s)
      if (currentScene.visualEffectType === "mod2_power_unit") {
        const cueIndex = audioCurrentTime < 9.0 ? 1 : audioCurrentTime < 18.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                UNIDADE DE POTÊNCIA HÍBRIDA 2026 • EFICIÊNCIA SUSTENTÁVEL
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-emerald-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-[0_0_35px_rgba(16,185,129,0.25)] animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  CONFIGURAÇÃO OFICIAL 2026 (SEM MGU-H)
                </span>
                <div className="grid grid-cols-2 gap-3 py-2">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/60 border-white/10")}>
                    <span className="text-[10px] font-mono text-zinc-400 block">PARTE TÉRMICA</span>
                    <strong className="text-sm text-white">V6 TURBO 1.6L</strong>
                    <span className="text-[10px] text-emerald-300 block mt-1">100% Combustível Sustentável</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/60 border-white/10")}>
                    <span className="text-[10px] font-mono text-zinc-400 block">PARTE ELÉTRICA</span>
                    <strong className="text-sm text-white">MGU-K 350 KW</strong>
                    <span className="text-[10px] text-cyan-300 block mt-1">~470 cv elétricos instantâneos</span>
                  </div>
                </div>
                <div className="text-xs text-zinc-300 mt-1">
                  Potência combinada superior a 1.000 cv com divisão equilibrada de 50% combustão e 50% energia elétrica.
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. COMBUSTÃO SUSTENTÁVEL", "Motor V6 Turbo 1.6L Eficiente", "Alimentado integralmente por combustíveis 100% sustentáveis e não fósseis.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. RECUPERAÇÃO CINÉTICA", "MGU-K Elétrico de 350 kW", "Recupera energia cinética nas frenagens, armazenando-a em bateria de alto rendimento.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ENTREGA ESTRATÉGICA", "Potência Instantânea Extra", "Liberação tática de energia para ultrapassagens e retomadas violentas nas saídas de curva.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-[10px] font-mono text-zinc-400">
              Regulamento 2026: O sistema MGU-H foi totalmente eliminado, simplificando os custos e amplificando o MGU-K.
            </div>
          </div>
        )
      }

      // CENA 7: ACERTO DO CARRO E ESTRATÉGIA (26.8s)
      if (currentScene.visualEffectType === "mod2_setup_strategy") {
        const cueIndex = audioCurrentTime < 9.0 ? 1 : audioCurrentTime < 17.5 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ACERTO MECÂNICO VS ESTRATÉGIA DE CORRIDA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CONFIGURAÇÕES POR CIRCUITO
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/50 border-red-500 shadow-md" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">RETAS LONGAS (MONZA)</strong>
                    <p className="text-[11px] text-zinc-300 mt-1">Asas baixas, mínimo arrasto, foco em velocidade final superior a 350 km/h.</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 ? "bg-cyan-950/50 border-cyan-500 shadow-md" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">TRAVADO (MÔNACO)</strong>
                    <p className="text-[11px] text-zinc-300 mt-1">Asas altas, máxima sustentação negativa para colar os pneus nas curvas lentas.</p>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. BAIXO ARRASTO", "Pistas de Velocidade Pura", "As equipes reduzem as asas para cortar o arrasto e voar nas retas infinitas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MÁXIMO DOWNFORCE", "Circuitos Urbanos e Sinuosos", "Aumentam os flaps para garantir aderência em curvas apertadas onde a velocidade de ponta é secundária.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ACERTO VS ESTRATÉGIA", "A Diferença Conceitual", "O acerto prepara a máquina na garagem antes da largada; a estratégia decide as paradas e pneus durante a prova.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A engenharia adapta o carro às características topográficas de cada país.
            </div>
          </div>
        )
      }

      // CENA 8: TUDO TRABALHANDO JUNTO (20.5s)
      if (currentScene.visualEffectType === "mod2_full_integration") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 02 CONCLUÍDO • SÍNTESE DA MÁQUINA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  DOMÍNIO COMPLETO
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A MÁQUINA DE FÓRMULA 1
                </div>
                <p className="text-xs text-zinc-300">
                  Você compreendeu como aerodinâmica, pneus, volante, freios, unidade de potência e acerto formam um só organismo veloz no limite da física.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 2 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CONEXÃO TOTAL", "A Harmonia dos Sistemas", "A velocidade é a soma equilibrada de todas as áreas de engenharia trabalhando em sincronia.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. PILOTO E MÁQUINA", "No Limite da Física", "Agora que você conhece a máquina, avance para o quiz e teste seu conhecimento!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 3: DENTRO DA CORRIDA (APRENDA A ACOMPANHAR UMA TRANSMISSÃO)
    // ------------------------------------------------------------------------
    if (activeModuleId === 3) {
      // CENA 1: O FIM DE SEMANA DE F1 (25.0s)
      if (currentScene.visualEffectType === "mod3_weekend_format") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 03 • O FORMATO DO FIM DE SEMANA DE GP
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CRONOGRAMA OFICIAL DA ETAPA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">SEXTA-FEIRA</span>
                    <strong className="text-xs text-white block">TL1 & TL2</strong>
                    <span className="text-[9px] text-zinc-300">Treinos livres de adaptação e acerto</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">SÁBADO</span>
                    <strong className="text-xs text-white block">TL3 & QUALI</strong>
                    <span className="text-[9px] text-zinc-300">Definição do grid de largada oficial</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">DOMINGO</span>
                    <strong className="text-xs text-white block">GRANDE PRÊMIO</strong>
                    <span className="text-[9px] text-zinc-300">A corrida principal valendo 25 pontos</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. SEXTA DE TREINOS", "TL1 e TL2 em Pista Aberta", "As equipes rodam centenas de voltas para calibrar alturas, asas e pressão de pneus.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. SÁBADO DECISIVO", "TL3 e a Disputa da Classificação", "A pressão sobe no sábado com a busca pela volta perfeita na disputa da pole position.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O GRANDE PRÊMIO", "Domingo de Corrida & Formato Sprint", "A prova máxima de 305 km onde estratégia e ritmo de corrida coroam o vencedor.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Alternativa Sprint: TL1 único na sexta, corrida Sprint curta no sábado e GP no domingo.
            </div>
          </div>
        )
      }

      // CENA 2: TREINOS LIVRES: A PREPARAÇÃO (25.0s)
      if (currentScene.visualEffectType === "mod3_practice_analysis") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TREINOS LIVRES • SIMULAÇÃO DE CORRIDA VS CLASSIFICAÇÃO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  COLETA TÉCNICA DE DADOS
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-purple-950/50 border-purple-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">RITMO DE CLASSIFICAÇÃO</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Tanque quase vazio (10 kg), pneus macios novos e potência máxima liberada.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-emerald-950/50 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">LONG RUN (RITMO DE PROVA)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Tanque pesado (100 kg), pneus usados e monitoramento minucioso do desgaste.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O CRONÔMETRO PURO", "A Ilusão da Volta Mais Rápida", "Liderar o treino livre nem sempre significa ser o mais veloz no domingo.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. TANQUE CHEIO (LONG RUN)", "Simulando as Condições da Corrida", "Equipes rodam com peso elevado para medir a degradação dos pneus volta a volta.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. TESTE DE COMPONENTES", "Asas Novas e Mapas de Injeção", "Tinta aerodinâmica (Flow-Vis) e grades pitot analisam o comportamento do fluxo real.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              💡 Os treinos servem para encontrar o balanço mecânico antes do regime de parque fechado.
            </div>
          </div>
        )
      }

      // CENA 3: CLASSIFICAÇÃO E GRID DE LARGADA (25.0s)
      if (currentScene.visualEffectType === "mod3_qualifying_grid") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                CLASSIFICAÇÃO • SISTEMA ELIMINATÓRIO Q1, Q2 E Q3
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ESTRUTURA DA SESSÃO DE SÁBADO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">Q1 (18 MIN)</span>
                    <strong className="text-xs text-white block">20 PILOTOS</strong>
                    <span className="text-[9px] text-zinc-300">Elimina os 5 mais lentos (P16 a P20)</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">Q2 (15 MIN)</span>
                    <strong className="text-xs text-white block">15 PILOTOS</strong>
                    <span className="text-[9px] text-zinc-300">Elimina mais 5 carros (P11 a P15)</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-emerald-400 block font-bold">Q3 (12 MIN)</span>
                    <strong className="text-xs text-white block">TOP 10 FINAL</strong>
                    <span className="text-[9px] text-zinc-300">Batalha decisiva pela Pole Position</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CORTE NO Q1", "Eliminação dos 5 Últimos", "Todos os 20 carros na pista; os cinco tempos mais lentos fecham o fundo do grid.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O FILTRO DO Q2", "A Fronteira do Top 10", "Quinze pilotos disputam dez vagas; quem fica entre P11 e P15 larga no meio do pelotão.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A POLE NO Q3", "A Volta Perfeita", "Dez carros em busca do limite absoluto em busca do primeiro lugar de largada.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Pole Position: Largada na primeira posição da reta com pista limpa à frente.
            </div>
          </div>
        )
      }

      // CENA 4: A LARGADA: CINCO LUZES FIA (25.0s)
      if (currentScene.visualEffectType === "mod3_start_sequence") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PROCEDIMENTO OFICIAL DE LARGADA FIA • APAGAMENTO DAS 5 LUZES
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((light) => {
                    const isOn = cueIndex === 2 || (cueIndex === 1 && light <= 3)
                    return (
                      <div key={light} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-zinc-900 border border-white/10">
                        <div className={cn("w-5 h-5 rounded-full border transition-all duration-300", isOn ? "bg-[#E10600] border-red-500 shadow-[0_0_15px_#E10600]" : "bg-zinc-800 border-zinc-700")} />
                        <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" />
                      </div>
                    )
                  })}
                </div>
                <div className="text-sm font-mono font-bold text-white uppercase">
                  {cueIndex === 1 && "Alinhamento nos Colchetes do Grid"}
                  {cueIndex === 2 && "5 Luzes Vermelhas Acesas — Tensão Máxima!"}
                  {cueIndex === 3 && "● LUZES APAGADAS! LARGADA AUTORIZADA! ●"}
                </div>
                <p className="text-[11px] text-zinc-300 mt-1">
                  O sinal oficial regulamentar da FIA é a extinção simultânea das 5 luzes. Nunca existe luz verde no pórtico de largada da F1.
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. GRID ALINHADO", "Volta de Apresentação Finalizada", "Os vinte monopostos encaixam-se nos colchetes pintados no asfalto com freios e pneus aquecidos.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. AS 5 LUZES ACENDEM", "Sequência de 1 em 1 Segundo", "Motores em rotação máxima, embreagens acionadas e tempo de reação milimétrico prestes a ser testado.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. LIGHTS OUT!", "O Apagamento Simultâneo", "A largada é dada exatamente quando as luzes apagam após um intervalo aleatório de 1 a 3 segundos.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Regulamento Esportivo FIA: Qualquer movimento antes do apagamento é punido por queima de largada (jump start).
            </div>
          </div>
        )
      }

      // CENA 5: A CORRIDA: TORRE, GAP E INT (25.0s)
      if (currentScene.visualEffectType === "mod3_race_tower") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TRANSMISSÃO • TIMING TOWER, COLUNA GAP E COLUNA INT
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <div className="flex justify-between pb-1.5 mb-2 border-b border-white/10 text-[10px] text-zinc-400">
                  <span>POS / PILOTO</span>
                  <span>GAP (LÍDER)</span>
                  <span>INT (FRENTE)</span>
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    <span>1. VER (RED BULL)</span>
                    <span>LÍDER</span>
                    <span>INTERVALO</span>
                  </div>
                  <div className={cn("flex justify-between items-center p-1.5 rounded border transition-all", cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400 text-white font-black scale-102" : "bg-black/40 border-white/5 text-zinc-300")}>
                    <span>2. NOR (MCLAREN)</span>
                    <span className="text-cyan-400">+1.842s</span>
                    <span className="text-cyan-400">+1.842s</span>
                  </div>
                  <div className={cn("flex justify-between items-center p-1.5 rounded border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 text-white font-black scale-102" : "bg-black/40 border-white/5 text-zinc-300")}>
                    <span>3. LEC (FERRARI)</span>
                    <span>+2.410s</span>
                    <span className="text-red-400">+0.568s ⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A TORRE LATERAL", "O Painel de Bordo do Telespectador", "A barra esquerda da transmissão informa posições, trocas de pneus e intervalos em tempo real.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O GAP (DIFERENÇA)", "Distância para o Líder da Prova", "Mostra a distância em segundos acumulada entre qualquer piloto e a primeira colocação.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O INT (INTERVALO)", "Diferença para o Carro da Frente", "Quando o INT é menor que 1 segundo, o piloto está na zona direta de ataque e perseguição.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              INT &lt; 1.0s abre a oportunidade tática de aproximação aerodinâmica e ultrapassagem.
            </div>
          </div>
        )
      }

      // CENA 6: PIT STOPS E ESTRATÉGIA (25.0s)
      if (currentScene.visualEffectType === "mod3_pitstop_strategy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                BOXES • A CIRURGIA DO PIT STOP EM 2 SEGUNDOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  PARADA NOS BOXES
                </span>
                <div className="py-2 text-3xl font-mono font-black text-white">
                  {cueIndex === 1 ? "2.0s A 2.5s" : cueIndex === 2 ? "REGRA DE 2 COMPOSTOS" : "TEMPO DE PIT LANE: ~22s"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "Mais de 20 mecânicos sincronizados trocam os quatro pneus em cerca de dois segundos."}
                  {cueIndex === 2 && "Em corrida com pista seca, todo piloto é obrigado a utilizar pelo menos dois compostos diferentes."}
                  {cueIndex === 3 && "O tempo total perdido percorrendo o pit lane com limitador de velocidade é de 20 a 25 segundos."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. PRECISÃO CIRÚRGICA", "Troca em Poucos Batimentos", "Uma porca única central e pistolas pneumáticas de alta rotação retiram e fixam a roda em instantes.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. REGULAMENTO DE PNEUS", "Obrigatoriedade de Dois Compostos", "Regra desportiva que força pelo menos uma troca de pneus durante o Grande Prêmio.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CUSTO DO PIT LANE", "Janela de Retorno no Tráfego", "A equipe precisa calcular a volta de saída para evitar tráfego de carros mais lentos.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Pit stops vencem corridas: um ganho de 0.5s nos boxes equivale a três voltas de ataque na pista.
            </div>
          </div>
        )
      }

      // CENA 7: BANDEIRAS E SAFETY CAR (25.0s)
      if (currentScene.visualEffectType === "mod3_flags_safety_car") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                SEGURANÇA • SINALIZAÇÃO DE BANDEIRAS & SAFETY CAR
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                  CÓDIGO DE SINALIZAÇÃO DA FIA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-amber-300 block">🟨 AMARELA</strong>
                    <span className="text-[10px] text-zinc-300">Perigo à frente. Proibido ultrapassar e velocidade reduzida.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-orange-950/60 border-orange-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-orange-300 block">🚨 SAFETY CAR</strong>
                    <span className="text-[10px] text-zinc-300">Carro físico lidera o pelotão para neutralizar a prova.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">🟥 VERMELHA</strong>
                    <span className="text-[10px] text-zinc-300">Corrida interrompida por graves riscos climáticos ou acidentes.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. BANDEIRAS AMARELA & VERDE", "Comunicação Visual Imediata", "Amarela exige cautela e proíbe ultrapassagens; verde restabelece corrida livre.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. SC & VIRTUAL SAFETY CAR", "Neutralização de Ritmo", "O Safety Car agrupa o pelotão; o VSC impõe uma velocidade delta controlada pelo volante.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. VERMELHA & AZUL", "Interrupção e Retardatários", "Bandeira vermelha recolhe os carros ao pit lane; azul ordena ceder passagem ao líder.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Painéis luminosos LED instalados ao redor da pista reproduzem as bandeiras eletronicamente.
            </div>
          </div>
        )
      }

      // CENA 8: BANDEIRADA, RESULTADO E PONTOS (25.0s)
      if (currentScene.visualEffectType === "mod3_finish_championship") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 03 CONCLUÍDO • PÓDIO E PONTUAÇÃO OFICIAL FIA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  TABELA OFICIAL DE PONTUAÇÃO FIA
                </span>
                <div className="grid grid-cols-5 gap-1 py-2 font-mono text-[10px] font-bold text-white">
                  <div className="p-1 rounded bg-amber-500/20 border border-amber-400 text-amber-300">1º: 25 pts</div>
                  <div className="p-1 rounded bg-zinc-700/40 border border-zinc-400">2º: 18 pts</div>
                  <div className="p-1 rounded bg-amber-800/40 border border-amber-700">3º: 15 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">4º: 12 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">5º: 10 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">6º: 8 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">7º: 6 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">8º: 4 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">9º: 2 pts</div>
                  <div className="p-1 rounded bg-white/5 border border-white/10">10º: 1 pt</div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 3 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A BANDEIRA QUADRICULADA", "A Chegada Gloriosa", "Agitada na linha de chegada para saudar o vencedor dos mais de 300 km de disputa.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. PONTOS DO 1º AO 10º", "A Tabela Oficial da FIA", "25 pontos para a vitória descendo progressivamente até 1 ponto para o décimo colocado.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. OS DOIS MUNDIAIS", "Pilotos e Construtores", "Cada ponto alimenta a glória individual do piloto e a premiação milionária da sua equipe.")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 4: A MENTE POR TRÁS DA CORRIDA: ESTRATÉGIA, PNEUS E BOXES
    // ------------------------------------------------------------------------
    if (activeModuleId === 4) {
      // CENA 1: A ESTRATÉGIA COMEÇA ANTES DA LARGADA (25.0s)
      if (currentScene.visualEffectType === "mod4_roles_strategy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 04 • QUEM DECIDE A ESTRATÉGIA NO PIT WALL
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  O TRIÂNGULO DA DECISÃO TÁTICA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">O PILOTO</span>
                    <strong className="text-xs text-white block">Sente a Pista</strong>
                    <span className="text-[9px] text-zinc-300">Feedback da aderência da borracha e desgaste curva a curva.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">O ENGENHEIRO</span>
                    <strong className="text-xs text-white block">A Voz no Rádio</strong>
                    <span className="text-[9px] text-zinc-300">Transmite ordens técnicas, deltas de tempo e planos de parada.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-purple-950/60 border-purple-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-purple-400 block font-bold">ESTRATEGISTAS</span>
                    <strong className="text-xs text-white block">Muro e Fábrica</strong>
                    <span className="text-[9px] text-zinc-300">Simulam milhões de variáveis e janelas ideais de pit stop.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O FEEDBACK DO PILOTO", "A Sensibilidade ao Volante", "O piloto sente a aderência na ponta dos dedos e alerta a equipe sobre a perda de rendimento.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. A VOZ NO RÁDIO", "O Engenheiro de Corrida", "Traduz as angústias do piloto em parâmetros técnicos e deltas matemáticos de volta.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. OS ESTRATEGISTAS", "Simulações no Pit Wall e Fábrica", "Supercomputadores calculam a probabilidade de vitória para cada plano de corrida.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O plano mais rápido na teoria pode falhar se o carro cair no tráfego após a parada.
            </div>
          </div>
        )
      }

      // CENA 2: A ESCOLHA DOS PNEUS E DEGRADAÇÃO (25.0s)
      if (currentScene.visualEffectType === "mod4_tire_choice_sim") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ESTRATÉGIA DE PNEUS • DESGASTE MECÂNICO VS DEGRADAÇÃO TÉRMICA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CICLO DE VIDA DA BORRACHA
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/50 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">DESGASTE FÍSICO</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">A perda milimétrica da camada externa de borracha pelo atrito contínuo no asfalto.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-red-950/50 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">DEGRADAÇÃO TÉRMICA</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">O superaquecimento interno da carcaça do pneu causando perda súbita de aderência (The Cliff).</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A GAMA PIRELLI (C1 A C5)", "A Escolha de Três Compostos", "A fabricante escolhe três compostos seguidos para cada GP: duro, médio e macio.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. DESGASTE VS DEGRADAÇÃO", "A Perda Química de Aderência", "O calor excessivo desestrutura as moléculas da borracha muito antes de o pneu ficar liso.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A FALÉSIA (THE CLIFF)", "Queda Abrupta de Performance", "O momento em que os tempos de volta despencam 2 a 3 segundos de uma volta para outra.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              💡 Gerenciar pneus significa poupá-los nos apoios laterais sem abrir mão do ritmo de prova.
            </div>
          </div>
        )
      }

      // CENA 3: A JANELA DO PIT STOP (25.0s)
      if (currentScene.visualEffectType === "mod4_pitstop_timing_calc") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                JANELA DE BOXES • CLEAN AIR (AR LIMPO) VS DIRTY AIR (TRÁFEGO)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CÁLCULO DE REINSERÇÃO NA PISTA
                </span>
                <div className="py-2 text-2xl font-mono font-black text-white">
                  {cueIndex === 1 ? "JANELA DE ~22 SEGUNDOS" : cueIndex === 2 ? "AR LIMPO (CLEAN AIR)" : "ORDEM: BOX, BOX, BOX!"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "Entrar e sair do pit lane consome um tempo fixo de 20 a 25 segundos no cronômetro da corrida."}
                  {cueIndex === 2 && "Parar e retornar atrás de um carro mais lento destrói a vantagem do pneu novo por superaquecimento no ar sujo."}
                  {cueIndex === 3 && "O estrategista só chama o piloto aos boxes quando existe um buraco livre de tráfego para a volta de saída."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O CUSTO DO PIT LANE", "O Delta Temporal da Parada", "Durante o pit stop, os adversários na pista percorrem mais de 1,5 km a velocidade máxima.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O VALOR DO AR LIMPO", "Clean Air para o Pneu Novo", "Em ar limpo, o piloto consegue extrair 100% da aderência sem cozinhar a borracha no vácuo de rivais.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A CHAMADA DECISIVA", "Box, Box, Box!", "A ordem pelo rádio ocorre no momento exato em que a janela de tráfego está perfeitamente limpa.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Tráfego na volta de saída (out-lap) é o maior inimigo de uma boa estratégia de paradas.
            </div>
          </div>
        )
      }

      // CENA 4: UNDERCUT VS OVERCUT (25.0s)
      if (currentScene.visualEffectType === "mod4_safety_car_rain") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                DUELO TÁTICO • UNDERCUT (PARAR ANTES) VS OVERCUT (PARAR DEPOIS)
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  MECÂNICA DA ULTRAPASSAGEM NOS BOXES
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">UNDERCUT (PARAR ANTES)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">O piloto para 1 ou 2 voltas antes do rival. Com pneus novos, crava a volta mais rápida e assume a frente quando o rival para.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">OVERCUT (PARAR DEPOIS)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Fica na pista com pneus velhos em ar limpo enquanto o rival pega tráfego na saída dos boxes ou sofre para aquecer pneus frios.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O UNDERCUT CLÁSSICO", "A Velocidade do Pneu Novo", "Parar antes antecipa o ritmo alto da borracha fresca para ganhar a posição sem briga na pista.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O OVERCUT PACIENTE", "Estender o Stint em Ar Limpo", "Funciona quando o adversário pega carros lentos na saída dos boxes ou em pistas onde o pneu novo demora a aquecer.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A DECISÃO DO MURO", "Leitura da Pista em Fração de Segundo", "Estrategistas monitoram o cronômetro para antecipar ou atrasar a parada conforme os rivais.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O undercut é a manobra de ultrapassagem mais poderosa e frequente na era contemporânea da F1.
            </div>
          </div>
        )
      }

      // CENA 5: COMUNICAÇÃO PELO RÁDIO E PIT WALL (25.0s)
      if (currentScene.visualEffectType === "mod4_telemetry_radio_data") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                COMUNICAÇÃO DE RÁDIO • PLANO A, PLANO B E CÓDIGOS TÁTICOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-purple-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <div className="text-[10px] text-purple-400 uppercase tracking-widest mb-2 border-b border-purple-500/20 pb-1">
                  MENSAGEM DE ÁUDIO NO COCKPIT
                </div>
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-white space-y-1.5 text-left">
                  <div className="text-zinc-400 text-[10px]">ENGENHEIRO (PIT WALL):</div>
                  <div className="text-emerald-400 font-bold">\"Radio check. Mode Push for 2 laps. Plan B is ready.\"</div>
                  <div className="text-zinc-400 text-[10px] pt-1">PILOTO (COCKPIT):</div>
                  <div className="text-amber-300 font-bold">\"Copy that. Front tires feel good. Let\'s extend!\"</div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CÓDIGOS ESTRATÉGICOS", "Planos A, B e C no Rádio", "As equipes utilizam nomenclaturas codificadas para despistar os rivais que escutam a transmissão.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MENSAGENS OBJETIVAS", "Gestão Sem Distração a 300 km/h", "O engenheiro fala apenas em trechos de reta para não perturbar a concentração nas frenagens.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CONFIANÇA MÚTUA", "A Simbiose que Ganha Provas", "A decisão final é um pacto entre os dados do muro e a sensação física de aderência do piloto.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Todas as transmissões de rádio entre equipe e piloto são abertas e monitoradas pela FIA.
            </div>
          </div>
        )
      }

      // CENA 6: TELEMETRIA E DADOS PREDITIVOS (25.0s)
      if (currentScene.visualEffectType === "mod4_alternate_plans") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TELEMETRIA DE RITMO • MODELOS PREDITIVOS EM TEMPO REAL
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CURVA DE DEGRADAÇÃO PREVISTA
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs text-zinc-300">
                    <span>VOLTA 1 A 15 (MACIO):</span>
                    <span className="text-emerald-400 font-bold">1:21.400 (Rápido)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-300">
                    <span>VOLTA 16 A 25 (DEGRADAÇÃO):</span>
                    <span className="text-yellow-400 font-bold">1:22.250 (+0.850s)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-300">
                    <span>VOLTA 26+ (THE CLIFF):</span>
                    <span className="text-red-400 font-bold">1:24.100 (+2.700s) ⚠️</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O RITMO DELTA", "Monitoramento Volta a Volta", "Engenheiros acompanham a curva de tempo em busca dos primeiros sinais de perda de aderência.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MODELAGEM POR IA", "Simulação de Milhões de Cenários", "Modelos matemáticos prevêem em que posição exata o carro retornará à pista após o pit stop.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. REAÇÃO RÁPIDA", "Mudança de Plano Instantânea", "Se a degradação for menor que o esperado, a equipe estende o stint para fazer menos paradas.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A matemática moderna permite antecipar o momento exato em que a borracha deixará de ser competitiva.
            </div>
          </div>
        )
      }

      // CENA 7: QUANDO AS CONDIÇÕES MUDAM (25.0s)
      if (currentScene.visualEffectType === "mod4_strategist_challenge") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                IMPREVISTOS • SAFETY CAR SURPRESA E AMEAÇA DE CHUVA
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                  GESTÃO DE RISCO EM TEMPO REAL
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">PARADA SOB SAFETY CAR</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">O pelotão anda lento, cortando o custo temporal do pit stop pela metade (de 22s para ~11s de perda líquida).</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-blue-950/60 border-blue-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">O DILEMA DA CHUVA</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Trocar para intermediários antes da chuva desmancha os pneus na pista seca; demorar demais causa aquaplanagem fatal.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PIT STOP COM DESCONTO", "A Vantagem do Safety Car", "Trocar pneus durante a neutralização economiza tempo precioso em relação aos rivais.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O DILEMA DOS INTERS", "Chuva Iminente no Radar", "O radar acusa chuva em cinco voltas: estender com slick ou arriscar a troca antecipada?")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. AGILIDADE MENTAL", "A Decisão de Milissegundos", "Estrategistas campeões destacam-se pela coragem de reescrever todo o plano no calor do caos.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              💡 Na Fórmula 1, o plano perfeito dura apenas até a primeira surpresa climática ou bandeira amarela.
            </div>
          </div>
        )
      }

      // CENA 8: PENSAMENTO ESTRATÉGICO FINAL (25.0s)
      if (currentScene.visualEffectType === "mod4_strategic_thinking_summary") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 04 CONCLUÍDO • O XADREZ A MAIS DE 300 KM/H
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  VISÃO COMPLETA DE ESTRATÉGIA
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A MENTE POR TRÁS DA CORRIDA
                </div>
                <p className="text-xs text-zinc-300">
                  Você agora compreende como pilotos, engenheiros e estrategistas utilizam compostos, janelas de pit stop e leituras de ar limpo para vencer corridas nos boxes.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 4 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O XADREZ DA F1", "Estratégia Além da Velocidade Bruta", "A corrida não é vencida apenas pelo carro mais rápido, mas por quem toma as decisões certas no momento crítico.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. HORA DO DESAFIO", "Avalie seu Conhecimento Tático", "Avance para o quiz de dez perguntas e teste seu raciocínio como estrategista de equipe!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 5: A ARTE DE ULTRAPASSAR (DISPUTAS, TRAJETÓRIAS E REGRAS)
    // ------------------------------------------------------------------------
    if (activeModuleId === 5) {
      // CENA 1: COMO NASCE UMA ULTRAPASSAGEM (25.0s)
      if (currentScene.visualEffectType === "mod5_overtaking_anatomy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 05 • ANATOMIA DE UMA ULTRAPASSAGEM
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  AS TRÊS FASES DO ATAQUE
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">1. APROXIMAÇÃO</span>
                    <strong className="text-xs text-white block">Zona de Vácuo</strong>
                    <span className="text-[9px] text-zinc-300">Medição da distância relativa e aceleração precoce na reta.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">2. POSICIONAMENTO</span>
                    <strong className="text-xs text-white block">Linha de Ataque</strong>
                    <span className="text-[9px] text-zinc-300">Escolha cirúrgica entre a linha interna ou externa na freada.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">3. CONTORNO</span>
                    <strong className="text-xs text-white block">Ápice e Saída</strong>
                    <span className="text-[9px] text-zinc-300">Manter o carro controlado sem espalhar para fora da pista.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. LEITURA DE RITMO", "A Manobra Começa Muito Antes", "Observar a distância e aproveitar o vácuo na reta prepara o terreno para a investida.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. ESCOLHA DE TRAJETÓRIA", "Linha Interna vs Externa", "A linha interna garante preferência no apex, mas exige frenagem mais agressiva.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CONTROLE REGULAMENTAR", "Velocidade Não Dá Direito Automático", "A manobra precisa acontecer de maneira limpa, controlada e respeitando os limites da pista.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Estar mais veloz não dá o direito de empurrar o adversário para fora na freada.
            </div>
          </div>
        )
      }

      // CENA 2: O VÁCUO E A PREPARAÇÃO (25.0s)
      if (currentScene.visualEffectType === "mod5_attack_tech_2026") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                VÁCUO (SLIPSTREAM) • O CONE DE BAIXA PRESSÃO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  DINÂMICA DE FLUIDOS NA RETA
                </span>
                <div className="py-2 text-2xl font-mono font-black text-white">
                  {cueIndex === 1 ? "MENOR ARRASTO NO VÁCUO" : cueIndex === 2 ? "A QUEBRA DE VÁCUO" : "O BOTE DE SAÍDA"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "O carro da frente rasga o ar, criando atrás de si um cone de baixa pressão onde o perseguidor atinge maior velocidade final."}
                  {cueIndex === 2 && "O piloto à frente tenta se descolar da linha central para quebrar o vácuo antes da placa de cem metros."}
                  {cueIndex === 3 && "O perseguidor sai do vácuo no instante milimétrico anterior à frenagem para refrigerar o motor e ter visão clara."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O CONE DE VÁCUO", "Aproveitando a Menor Resistência", "Andar na esteira do líder reduz a força contrária do ar e impulsiona o carro perseguidor.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. QUEBRANDO O VÁCUO", "A Defesa Preventiva na Reta", "O líder move-se uma vez para o lado para tirar o adversário da zona de sucção de ar.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O MERGULHO", "Saindo da Esteira de Turbulência", "No ponto de freada, o piloto sai do vácuo para frear com ar limpo na asa dianteira.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              💡 Ar sujo (dirty air) prejudica em curvas, mas na reta o vácuo é a chave da aproximação.
            </div>
          </div>
        )
      }

      // CENA 3: FRENAGEM E DISPUTA LADO A LADO (25.0s)
      if (currentScene.visualEffectType === "mod5_defense_limits") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                FRENAGEM & APEX • TRAIL BRAKING E DIVISÃO DE ESPAÇO
              </span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-orange-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block mb-1">
                  CRITÉRIOS DE DISPUTA CURVA A CURVA
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-orange-950/60 border-orange-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">TRAIL BRAKING</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Aliviar a pressão do freio gradativamente ao apontar o volante, transferindo peso para a frente sem travar as rodas.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">LARGURA DE UM CARRO</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Se os eixos dianteiros estiverem emparelhados no vértice (apex), ambos os pilotos são obrigados a deixar espaço regulamentar na pista.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PONTO DE FRENAGEM", "Mais Tarde Sem Travar Rodas", "Frear meio metro depois pode garantir a liderança, mas travar o pneu dianteiro destrói a curva.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. EMPARELHAMENTO NO APEX", "Direito a Espaço na Curva", "Estando lado a lado no ponto de tangência, o piloto de fora tem direito legal à largura de um carro.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. TRAÇÃO NA SAÍDA", "Quem Acelera Primeiro Vence", "Ultrapassagens muitas vezes são decididas na retomada de aceleração após a curva.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Travar as rodas (lock-up) cria facetas planas na borracha que causam vibrações intoleráveis.
            </div>
          </div>
        )
      }

      // CENA 4: DEFESA DE POSIÇÃO (25.0s)
      if (currentScene.visualEffectType === "mod5_side_by_side_rules") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                DEFESA DE POSIÇÃO • UMA ÚNICA MUDANÇA DE TRAJETÓRIA
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-red-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block mb-1">
                  REGRAS RÍGIDAS DE DEFESA FIA
                </span>
                <div className="py-2 text-2xl font-mono font-black text-white">
                  {cueIndex === 1 ? "APENAS 1 MUDANÇA" : cueIndex === 2 ? "SEM MOVER NA FRENAGEM" : "LINHA INTERNA PROTETORA"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "O piloto à frente só pode escolher uma trajetória para defender sua posição na reta. Ziguezaguear é severamente punido."}
                  {cueIndex === 2 && "É terminantemente proibido mudar de direção dentro da zona de frenagem (moving under braking), evitando colisões letais."}
                  {cueIndex === 3 && "O líder pode ocupar a linha interna da pista, mas deve deixar espaço no contorno se o rival já estiver emparelhado."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. UMA ÚNICA MANOBRA", "Proibido Ziguezaguear na Reta", "A FIA permite proteger a linha interna apenas uma vez; mudar de lado repetidamente gera bandeira preta e branca.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. FREAR EM LINHA RETA", "Sem Mudar de Direção na Frenagem", "Com as forças de frenagem no ápice, qualquer guinada repentina causa acidentes graves.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. DEFESA PROPORCIONAL", "Firmeza com Respeito", "A melhor defesa é o posicionamento prévio correto do carro antes da zona crítica.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Moving under braking é uma das infrações mais graves fiscalizadas pelos comissários.
            </div>
          </div>
        )
      }

      // CENA 5: AERODINÂMICA ATIVA E OVERTAKE MODE 2026 (25.0s)
      if (currentScene.visualEffectType === "mod5_track_limits_runoff") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TECNOLOGIA 2026 • AERODINÂMICA ATIVA & OVERTAKE MODE
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  NOVA ERA DAS ULTRAPASSAGENS (SEM DRS ANTIGO)
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">STRAIGHT MODE (AERO ATIVA)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Flaps móveis dianteiros e traseiros abrem em retas pré-definidas para reduzir o arrasto de ambos os carros.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-purple-950/60 border-purple-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">OVERTAKE MODE (ELÉTRICO)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Injeção elétrica de até 350 kW concedida ao perseguidor que estiver a menos de 1 segundo do rival na detecção.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O FIM DO DRS ISOLADO", "Aerodinâmica Ativa Integrada", "Em 2026, as asas dianteira e traseira movimentam-se coordenadas para diminuir a resistência de todos nas retas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. OVERTAKE MODE (MANUAL OVERRIDE)", "Disparo de Energia Elétrica", "O sistema elétrico MGU-K entrega potência suplementar para o carro perseguidor atacar.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. DEFESA POR GESTÃO", "A Bateria do Líder", "O piloto da frente pode contra-atacar usando sua própria energia armazenada nas frenagens.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A Fórmula 1 de 2026 substitui o DRS puramente aerodinâmico por uma batalha elétrica tática.
            </div>
          </div>
        )
      }

      // CENA 6: LIMITES DE PISTA - TRACK LIMITS (25.0s)
      if (currentScene.visualEffectType === "mod5_stewards_investigations") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                LIMITES DE PISTA • A LINHA BRANCA COMO BORDA OFICIAL
              </span>
              <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/60 border border-yellow-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-yellow-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-widest block mb-1">
                  DELIMITAÇÃO DO ASFALTO
                </span>
                <div className="py-2 text-2xl font-mono font-black text-white">
                  {cueIndex === 1 ? "4 RODAS FORA DA LINHA" : cueIndex === 2 ? "VANTAGEM DURADOURA" : "DEVOLUÇÃO OBRIGATÓRIA"}
                </div>
                <p className="text-xs text-zinc-300">
                  {cueIndex === 1 && "Se as quatro rodas ultrapassarem completamente a linha branca que delimita o circuito, a manobra é julgada fora da pista."}
                  {cueIndex === 2 && "Completar uma ultrapassagem espalhando pelas áreas de escape de asfalto é ilegal segundo o Código Esportivo Internacional."}
                  {cueIndex === 3 && "A equipe deve ordenar imediatamente a devolução da posição para evitar aplicação de penalidade de 5 ou 10 segundos."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A LINHA BRANCA", "O Limite Físico e Legal", "Pelo menos uma roda precisa manter contato visual ou tangência com a linha branca da borda.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. GANHO ILÍCITO", "Sair da Pista para Ultrapassar", "Utilizar as áreas de escape para contornar o rival configura ganho de vantagem duradoura.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. GIVE THE POSITION BACK", "A Devolução Imediata", "Ceder a posição de volta antes da intervenção dos comissários anula o processo punitivo.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Câmeras de alta velocidade e sensores no solo fiscalizam os limites em todas as curvas.
            </div>
          </div>
        )
      }

      // CENA 7: COMISSÁRIOS E INVESTIGAÇÕES (25.0s)
      if (currentScene.visualEffectType === "mod5_overtaking_challenges") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                DIREÇÃO DE PROVA • COMISSÁRIOS DESPORTIVOS DA FIA (STEWARDS)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  PROCEDIMENTO DE JULGAMENTO
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-1.5">
                  <div className="text-amber-400 font-bold">⚠️ INCIDENT UNDER INVESTIGATION</div>
                  <div className="text-zinc-300 text-[11px]">Análise de ângulo de volante, pedal de freio e telemetria de ambos os carros.</div>
                  <div className="text-emerald-400 text-[11px] pt-1">DECISÕES POSSÍVEIS:</div>
                  <div className="text-zinc-400 text-[10px]">• Incidente de corrida (sem punição)</div>
                  <div className="text-zinc-400 text-[10px]">• Penalidade de 5s ou 10s no tempo de prova</div>
                  <div className="text-zinc-400 text-[10px]">• Drive-Through pelo pit lane</div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. INCIDENT UNDER INVESTIGATION", "Alerta Oficial na Tela", "A Direção de Prova envia o caso aos quatro comissários desportivos independentes.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. ANÁLISE DE TELEMETRIA", "Dados Técnicos Incontestáveis", "Comissários analisam se o piloto tentou fazer a curva ou deliberadamente tirou o rival da pista.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. APLICAÇÃO DE PENAS", "Punições Proporcionais", "Penalidades adicionam tempo ao resultado final ou exigem paradas forçadas no pit lane.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O corpo de comissários inclui ex-pilotos de F1 para garantir leitura prática das disputas.
            </div>
          </div>
        )
      }

      // CENA 8: O MESTRE DA ULTRAPASSAGEM (25.0s)
      if (currentScene.visualEffectType === "mod5_overtaking_summary") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 05 CONCLUÍDO • A CORRAGEM COM INTELIGÊNCIA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  DOMÍNIO DA DISPUTA
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A ARTE DE ULTRAPASSAR
                </div>
                <p className="text-xs text-zinc-300">
                  Você dominou os princípios de vácuo, frenagem no apex, regras rígidas de defesa, tecnologia ativa 2026 e o julgamento dos comissários.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 5 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CORAGEM E DISCIPLINA", "O Equilíbrio Perfeito", "Ultrapassar na F1 exige a ousadia de mergulhar na freada e a frieza de respeitar o espaço vital do rival.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. PROVE SEU VALOR", "Desafio de Conhecimento", "Avance para as dez perguntas e teste seus reflexos sobre regras e manobras de pista!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 6: A HISTÓRIA DA FÓRMULA 1 (75 ANOS DE VELOCIDADE E CORAGEM)
    // ------------------------------------------------------------------------
    if (activeModuleId === 6) {
      // CENA 1: O NASCIMENTO DA FÓRMULA 1 (25.0s)
      if (currentScene.visualEffectType === "mod6_birth_of_f1") {
        const cueIndex = audioCurrentTime < 8.5 ? 1 : audioCurrentTime < 17.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 06 • 13 DE MAIO DE 1950: O MARCO INAUGURAL
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                  SILVERSTONE 1950 • GP DA GRÃ-BRETANHA
                </span>
                <div className="py-2 text-xl font-mono font-black text-white">
                  GIUSEPPE FARINA • ALFA ROMEO 158
                </div>
                <div className="grid grid-cols-3 gap-2 py-2 text-left text-xs">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-[11px] text-white block">A FÓRMULA</strong>
                    <span className="text-[10px] text-zinc-300">Regras unificadas pela FIA para nivelar a disputa.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-[11px] text-white block">1º CAMPEÃO</strong>
                    <span className="text-[10px] text-zinc-300">Farina venceu em Silverstone e faturou o título mundial.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-zinc-800 border-white/20" : "bg-black/50 border-white/10")}>
                    <strong className="text-[11px] text-white block">ERA HEROICA</strong>
                    <span className="text-[10px] text-zinc-300">Motores dianteiros, sem asas, capacetes de couro.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O SIGNIFICADO DA FÓRMULA", "A Padronização do Regulamento", "A FIA estabeleceu a Fórmula 1 como o topo das regras técnicas para consagrar o melhor piloto do mundo.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O TRIUNFO DE FARINA", "Silverstone, 13 de Maio de 1950", "Giuseppe Farina e a lendária Alfa Romeo 158 \'Alfetta\' cravaram a primeira vitória oficial da história.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A ERA DA CORAGEM", "Pioneirismo Sem Concessões", "Carros com motor dianteiro, pneus estreitos e segurança mínima em circuitos desenhados em pistas de pouso.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Silverstone era um antigo campo de aviação militar da Segunda Guerra Mundial.
            </div>
          </div>
        )
      }

      // CENA 2: EVOLUÇÃO DOS CARROS: DÉCADA POR DÉCADA (25.0s)
      if (currentScene.visualEffectType === "mod6_cars_evolution") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                EVOLUÇÃO TÉCNICA • 7 DÉCADAS DE TRANSFORMAÇÃO DA MÁQUINA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  A REVOLUÇÃO MECÂNICA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">ANOS 60</span>
                    <strong className="text-xs text-white block">MOTOR TRASEIRO</strong>
                    <span className="text-[9px] text-zinc-300">Cooper e Lotus revolucionam a distribuição de peso.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">ANOS 70/80</span>
                    <strong className="text-xs text-white block">ASAS & TURBO</strong>
                    <span className="text-[9px] text-zinc-300">Efeito solo, downforce massivo e motores de mais de 1.000 cv.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">ANOS 90 A HOJE</span>
                    <strong className="text-xs text-white block">ELETRÔNICA & HÍBRIDO</strong>
                    <span className="text-[9px] text-zinc-300">Telemetria em tempo real e eficiência térmica recorde.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O MOTOR ATRÁS DO PILOTO", "A Revolução dos Anos 60", "Colin Chapman e a Lotus provaram que colocar o motor atrás do cockpit tornava o carro muito mais ágil.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. ASAS E A ERA TURBO", "A Chegada da Aerodinâmica e Cavalos", "Nos anos 70 surgiram os aerofólios e o efeito solo; nos anos 80, motores turbo insanos superavam 1.000 cv.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A REVOLUÇÃO DA EFICIÊNCIA", "Eletrônica Fina e Unidades Híbridas", "Da suspensão ativa aos propulsores híbridos modernos que aproveitam metade de cada gota de energia.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A F1 é o laboratório de testes mais veloz e impiedoso da indústria automobilística.
            </div>
          </div>
        )
      }

      // CENA 3: PILOTOS LENDÁRIOS (25.0s)
      if (currentScene.visualEffectType === "mod6_legendary_drivers") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                GIGANTES DO ESPORTE • AS LENDAS QUE MOLDARAM A CATEGORIA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  IMORTAIS DO AUTOMOBILISMO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">FANGIO (5 TÍTULOS)</strong>
                    <span className="text-[10px] text-zinc-300">O maestro argentino que venceu com Alfa, Ferrari, Mercedes e Maserati.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-blue-950/60 border-blue-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CLARK & STEWART</strong>
                    <span className="text-[10px] text-zinc-300">A precisão escocesa e a luta pioneira pela segurança nos circuitos.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">NIKI LAUDA</strong>
                    <span className="text-[10px] text-zinc-300">Tricampeão, sobrevivente de Nürburgring e mestre da inteligência prática.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O MAESTRO FANGIO", "Cinco Títulos por Quatro Equipes", "Juan Manuel Fangio dominou a década de 1950 com maestria, respeito mútuo e técnica inigualável.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. A ERA ESCOCESA", "Jim Clark e Jackie Stewart", "Clark encantava pela velocidade pura; Stewart liderou a greve por guard-rails e atendimento médico.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O RETORNO DE LAUDA", "Superação Sob Humano Limite", "Após o terrível acidente de 1976, Lauda retornou em seis semanas para disputar o título até a última volta.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Cada lenda contribuiu não só com troféus, mas com a transformação cultural e técnica da F1.
            </div>
          </div>
        )
      }

      // CENA 4: AS GRANDES RIVALIDADES (25.0s)
      if (currentScene.visualEffectType === "mod6_rivalries") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                DUELOS HISTÓRICOS • AS RIVALIDADES QUE ELEVARAM O ESPORTE
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-red-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block mb-1">
                  BATALHAS DECIDIDAS NO LIMITE
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">LAUDA VS HUNT</strong>
                    <span className="text-[9px] text-zinc-300 block mt-0.5">1976: O confronto épico entre método espartano e intrepidez natural.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">SENNA VS PROST</strong>
                    <span className="text-[9px] text-zinc-300 block mt-0.5">1988-1990: A maior rivalidade da história, intensidade contra cálculo puro.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">HAMILTON VS MAX</strong>
                    <span className="text-[9px] text-zinc-300 block mt-0.5">2021: O duelo moderno épico empatado até a última volta em Abu Dhabi.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. LAUDA VS HUNT (1976)", "Contraste de Personalidades", "A rivalidade cinematográfica que levou o automobilismo às capas de todos os jornais do mundo.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. SENNA VS PROST (1988-90)", "O Ápice do Automobilismo", "Dois gênios no mesmo carro da McLaren, dividindo o planeta entre a emoção e a razão matemática.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. HAMILTON VS VERSTAPPEN", "A Batalha de Gerações (2021)", "Vinte e duas corridas de tirar o fôlego com os dois pilotos empatados em pontos no desfecho final.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Grandes rivais forçam um ao outro a superar os próprios limites humanos.
            </div>
          </div>
        )
      }

      // CENA 5: A REVOLUÇÃO DA SEGURANÇA (25.0s)
      if (currentScene.visualEffectType === "mod6_safety_evolution") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                SEGURANÇA • DA MORTE CONSTANTE À SOBREVIVÊNCIA MODERNA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  OS MARCOS DA ENGENHARIA DE VIDA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CHASSI DE CARBONO</strong>
                    <span className="text-[9px] text-zinc-300">John Barnard e McLaren (1981): Célula indeformável de sobrevivência.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">LEGADO DE 1994</strong>
                    <span className="text-[9px] text-zinc-300">Prof. Sid Watkins e FIA reescrevem os testes de impacto e o sistema HANS.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">O HALO (2018)</strong>
                    <span className="text-[9px] text-zinc-300">Titânio Grau 5 resistindo a 120 kN (~12 toneladas) salvando vidas reais.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A CÉLULA DE CARBONO", "McLaren MP4/1 (1981)", "A substituição do alumínio pela fibra de carbono protegeu as pernas e o tronco dos pilotos em batidas extremas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O PROTOCOLO PÓS-1994", "A Cruzada de Sid Watkins", "Sensores biométricos, laterais do cockpit elevadas, zebras redesenhadas e dispositivo HANS no capacete.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O ESCUDO DO HALO", "Homologação FIA 120 kN", "Inicialmente criticado pela estética, o Halo provou seu valor ao salvar pilotos em múltiplos acidentes graves.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A Fórmula 1 tornou-se a referência global em segurança automotiva e resgate médico rápido.
            </div>
          </div>
        )
      }

      // CENA 6: SENNA E O BRASIL NA F1 (25.0s)
      if (currentScene.visualEffectType === "mod6_senna_brazil_legacy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TRADIÇÃO BRASILEIRA • 8 TÍTULOS MUNDIAIS E O MITO SENNA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-emerald-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  HISTÓRIA VERDE E AMARELA NAS PISTAS
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">EMERSON & PIQUET</strong>
                    <span className="text-[9px] text-zinc-300">Fittipaldi (72/74) abriu as portas; Piquet (81/83/87) uniu técnica e títulos.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">AYRTON SENNA</strong>
                    <span className="text-[9px] text-zinc-300">Tricampeão (88/90/91), mestre absoluto na chuva e sinônimo de orgulho nacional.</span>
                  </div>
                  <div className="p-2 rounded-xl border bg-black/50 border-white/10">
                    <strong className="text-xs text-white block">O LEGADO</strong>
                    <span className="text-[9px] text-zinc-300">Interlagos, paixão popular e inspiração para pilotos de todas as gerações.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. OS PIONEIROS", "Fittipaldi e Nelson Piquet", "O Brasil conquistou cinco títulos mundiais antes de Senna, consolidando a nação como potência da F1.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O FENÔMENO SENNA", "Mônaco, Donington e Chuva", "A busca intransigente pela perfeição, as voltas mágicas de classificação e a devoção de um país inteiro.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ETERNA INSPIRAÇÃO", "Mais que um Piloto, um Ícone", "O impacto de Senna transcendeu as pistas, tornando-se símbolo de superação e excelência profissional.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O GP de São Paulo em Interlagos continua sendo uma das etapas mais apaixonadas do calendário mundial.
            </div>
          </div>
        )
      }

      // CENA 7: A F1 MODERNA E O FUTURO 2026 (25.0s)
      if (currentScene.visualEffectType === "mod6_modern_f1_2026") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ERA CONTEMPORÂNEA • SUSTENTABILIDADE E COMPETITIVIDADE EM 2026
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  A FÓRMULA 1 DO FUTURO HOJE
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">COMBUSTÍVEL 100% LIMPO</strong>
                    <span className="text-[9px] text-zinc-300">Combustíveis e-fuels neutros em carbono desenvolvidos para o planeta.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">AERO ATIVA 2026</strong>
                    <span className="text-[9px] text-zinc-300">Carros menores, mais leves e com asas móveis dinâmicas para retas e curvas.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-purple-950/60 border-purple-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">TETO DE GASTOS</strong>
                    <span className="text-[9px] text-zinc-300">Cost Cap nivelando orçamentos para que a criatividade vença os bilhões.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. SUSTENTABILIDADE REAL", "Combustíveis Sintéticos Verdes", "A F1 lidera a tecnologia de combustíveis limpos que abastecerão a frota mundial no futuro.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. REGULAMENTO 2026", "Carros Mais Ágeis e Eficientes", "Monopostos reduzidos em largura e massa, com participação de propulsão elétrica triplicada.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O GRID EQUILIBRADO", "O Teto Financeiro (Cost Cap)", "Restrição orçamentária impede que uma única montadora compre vitórias ilimitadas.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A essência da F1 permanece imutável: o triunfo da engenharia e da bravura humana.
            </div>
          </div>
        )
      }

      // CENA 8: 75 ANOS DE PAIXÃO (25.0s)
      if (currentScene.visualEffectType === "mod6_history_summary") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 06 CONCLUÍDO • 75 ANOS DE LENDA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  HISTÓRIA VIVA
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  75 ANOS DE FÓRMULA 1
                </div>
                <p className="text-xs text-zinc-300">
                  De Silverstone 1950 às feras híbridas de 2026, você viajou por rivalidades inesquecíveis, revoluções na segurança e o legado brasileiro de Senna.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 6 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PASSADO ENCONTRA O FUTURO", "A Memória que Inspira", "Entender a história é essencial para enxergar a alma de cada curva e de cada recorde quebrado hoje.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. DESAFIO HISTÓRICO", "Teste sua Memória", "Avance para as dez questões do quiz e mostre que você domina as eras douradas da F1!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 7: POR TRÁS DA EQUIPE (BASTIDORES, ENGENHARIA E OPERAÇÃO)
    // ------------------------------------------------------------------------
    if (activeModuleId === 7) {
      // CENA 1: UMA EQUIPE É MUITO MAIS DO QUE UM CARRO (25.0s)
      if (currentScene.visualEffectType === "mod7_team_roles") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 07 • AS CENTENAS DE PESSOAS POR TRÁS DO PILOTO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ESTRUTURA HIERÁRQUICA DE UMA ESCUDERIA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-red-400 block font-bold">LIDERANÇA</span>
                    <strong className="text-xs text-white block">TEAM PRINCIPAL</strong>
                    <span className="text-[9px] text-zinc-300">Comandante esportivo, financeiro e político da escuderia.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-cyan-400 block font-bold">ENGENHARIA</span>
                    <strong className="text-xs text-white block">CORRIDA & DADOS</strong>
                    <span className="text-[9px] text-zinc-300">Ajustam suspensões, asas, telemetria e pressão dos pneus.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">FÁBRICA</span>
                    <strong className="text-xs text-white block">+1.000 PESSOAS</strong>
                    <span className="text-[9px] text-zinc-300">CFD, túnel de vento, montagem mecânica e logística global.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O CHEFE DE EQUIPE", "O Team Principal", "Coordena as decisões estratégicas, lidera negociações com a FIA e responde pelos resultados perante os donos.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. OS ENGENHEIROS DE PISTA", "Performance e Confiabilidade", "Trabalham colados ao piloto para extrair o último décimo de segundo do comportamento mecânico.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A FÁBRICA INVISÍVEL", "O Exército de Projetistas", "Centenas de engenheiros de compósitos, aerodinamicistas e técnicos operam 24h na sede da equipe.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O piloto é apenas a ponta do iceberg de uma operação técnica de mais de mil especialistas.
            </div>
          </div>
        )
      }

      // CENA 2: COMUNICAÇÃO PELO RÁDIO (25.0s)
      if (currentScene.visualEffectType === "mod7_radio_communication") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                CANAL DE RÁDIO • A VOZ QUE GUIA O PILOTO A 300 KM/H
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-purple-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest block mb-2 border-b border-purple-500/20 pb-1">
                  PROTOCOLO DE COMUNICAÇÃO DE RÁDIO
                </span>
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-left space-y-1.5">
                  <div className="text-zinc-400 text-[10px]">ENGENHEIRO DE CORRIDA:</div>
                  <div className="text-emerald-400 font-bold">\"Gap behind is 2.1. Traffic is clearing. Strat Mode 6 on straight.\"</div>
                  <div className="text-zinc-400 text-[10px] pt-1">PILOTO NO COCKPIT:</div>
                  <div className="text-white font-bold">\"Copy that. Rear tires starting to slip in turn 4.\"</div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. VOZ ÚNICA NO RÁDIO", "Apenas o Engenheiro Fala", "Para evitar confusão, somente o engenheiro de corrida mantém o canal de áudio com o piloto durante a volta.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. OBJETIVIDADE CRÍTICA", "Palavras Curtas e Códigos", "Informações precisas de deltas, mapas de freio e posições transmitidas sem adjetivos desnecessários.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CONTROLE EMOCIONAL", "Acalmar os Ânimos sob 5G", "O engenheiro atua como âncora psicológica do piloto nos momentos de frustração ou toque de corrida.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O engenheiro de corrida conhece as reações e a entonação do piloto como ninguém.
            </div>
          </div>
        )
      }

      // CENA 3: O MURO DOS BOXES - PIT WALL (25.0s)
      if (currentScene.visualEffectType === "mod7_pitwall_command") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PIT WALL • O CENTRO NERVOSO E OS MONITORES DE CONTROLE
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  PAINÉIS DE MONITORAMENTO DO MURO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">RADAR CLIMÁTICO</strong>
                    <span className="text-[9px] text-zinc-300">Previsão minuto a minuto de frentes de chuva sobre o circuito.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-purple-950/60 border-purple-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">TELEMETRIA AO VIVO</strong>
                    <span className="text-[9px] text-zinc-300">+300 sensores transmitindo temperatura, pressão e rotação em tempo real.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">GPS TRACKER</strong>
                    <span className="text-[9px] text-zinc-300">Posicionamento milimétrico de todos os 20 carros para calcular tráfego.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. DADOS EM TEMPO REAL", "Centenas de Monitores no Muro", "O pit wall recebe dados criptografados por telemetria sem fio a cada curva.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. LIGAÇÃO COM A FÁBRICA", "A Sala de Operações Virtual", "Na Inglaterra ou Itália, dezenas de analistas acompanham a corrida em simuladores paralelos.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. DECISÕES DE FRAÇÃO DE SEGUNDO", "A Resposta Rápida", "Chamar o piloto para os boxes no instante de um Safety Car exige reflexo cirúrgico.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O muro dos boxes é onde a tecnologia se encontra com a velocidade esportiva pura.
            </div>
          </div>
        )
      }

      // CENA 4: A DANÇA DO PIT STOP EM 2 SEGUNDOS (25.0s)
      if (currentScene.visualEffectType === "mod7_pitstop_anatomy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                COREOGRAFIA • 20 MECÂNICOS SINCRONIZADOS EM 2 SEGUNDOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  FUNÇÕES ESPECÍFICAS DA EQUIPE DE BOXES
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "MACACOS DIANT. & TRAS." : cueIndex === 2 ? "3 MECÂNICOS POR RODA" : "SISTEMA LOLLIPOP VERDE"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Dois operadores levantam o carro de 800 kg instantaneamente assim que ele para na marca pintada."}
                  {cueIndex === 2 && "Para cada pneu: um opera a pistola pneumática, um retira a roda gasta e o terceiro encaixa o pneu novo."}
                  {cueIndex === 3 && "Sensores automáticos liberam a luz verde no pórtico suspenso assim que as 4 porcas estão travadas com segurança."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O ENCAIXE NO PONTO", "Precisão no Colchete", "O piloto deve parar exatamente na marca; errar por 10 centímetros atrasa todo o procedimento.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. AS PISTOLAS DE ALTA VELOCIDADE", "Porca Única Central", "Pistolas de ar comprimido a mais de 10.000 RPM desparafusam e prendem a roda em milissegundos.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. LIBERAÇÃO AUTOMÁTICA", "Luz Verde Sem Hesitação", "O semáforo do pit stop analisa o tráfego no pit lane para evitar soltar o carro perigosamente (unsafe release).")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Recorde histórico: 1.80s (McLaren, GP do Catar de 2023).
            </div>
          </div>
        )
      }

      // CENA 5: TELEMETRIA: OS DADOS QUE DECIDEM (25.0s)
      if (currentScene.visualEffectType === "mod7_telemetry_analysis") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ANÁLISE DE DADOS • OS TRAÇOS QUE REVELAM O COMPORTAMENTO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  SOBREPOSIÇÃO DE VOLTAS (PILOTO A VS PILOTO B)
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-cyan-400 font-bold">VELOCIDADE MÁXIMA:</span>
                    <span className="text-white">334 km/h vs 331 km/h</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-bold">PONTO DE FRENAGEM:</span>
                    <span className="text-white">Piloto B freia 8 metros depois</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">RETOMADA DE ACELERADOR:</span>
                    <span className="text-white">Piloto A acelera 0.2s antes na tração</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. TRAÇOS DE TELEMETRIA", "O Raio-X da Pilotagem", "Gráficos de acelerador, freio, marcha e velocidade mostram exatamente onde cada décimo é ganho.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. COMPARATIVO ENTRE COLEGAS", "O Espelho do Box ao Lado", "Pilotos da mesma equipe analisam a telemetria mútua para aprender onde o parceiro foi mais rápido.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ENGENHARIA DE PERFORMANCE", "Ajuste de Diferencial e Asas", "Engenheiros refinam a distribuição de torque para melhorar o contorno de curvas críticas.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Na F1 moderna não há segredos: cada movimento do piloto é registrado numericamente.
            </div>
          </div>
        )
      }

      // CENA 6: DOIS PILOTOS, UMA EQUIPE (25.0s)
      if (currentScene.visualEffectType === "mod7_two_drivers_one_team") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                COMPANHEIROS DE EQUIPE • PRIMEIRO RIVAL VS SOMA DE PONTOS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  A DINÂMICA INTERNA DE UMA GARAGEM
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">O MAIOR COMPARATIVO</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">O companheiro de equipe possui o mesmo carro. Derrotá-lo é o único atestado real do seu valor na pista.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">ORDENS DE EQUIPE</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Quando estratégias divergem ou o campeonato está em jogo, a equipe pode ordenar a inversão de posições.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PRIMEIRO ADVERSÁRIO", "O Mesmo Equipamento Mecânico", "Sem desculpas técnicas: o companheiro de equipe é a métrica mais cruel da categoria.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O BEM DA ESCUDERIA", "Mundial de Construtores", "Colisões entre companheiros de equipe são a maior proibição imposta por qualquer Team Principal.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ORDENS TÁTICAS", "A Decisão do Muro", "Trocar posições na pista visa maximizar a pontuação contra adversários externos.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O Mundial de Construtores distribui as premiações financeiras de fim de ano.
            </div>
          </div>
        )
      }

      // CENA 7: TETO ORÇAMENTÁRIO E DESENVOLVIMENTO (25.0s)
      if (currentScene.visualEffectType === "mod7_cost_cap_development") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                FINANÇAS • COST CAP & ESCADA DE TÚNEL DE VENTO (ATR)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  REGRAS FINANCEIRAS E AERODINÂMICAS
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">COST CAP ANUAL:</span>
                    <span className="text-emerald-400">~$135M TETO RÍGIDO</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-bold">HORAS DE TÚNEL DE VENTO:</span>
                    <span className="text-amber-400">Escala Inversa (ATR)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans pt-1">
                    Quem vence o campeonato recebe menos horas de túnel de vento para a temporada seguinte, equilibrando o pelotão.
                  </p>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O TETO FINANCEIRO", "Financial Regulations da FIA", "Limita os gastos com desenvolvimento do carro para impedir a disparidade entre ricos e médios.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O ATR AERODINÂMICO", "Mais Testes para Quem Está Atrás", "As equipes com pior classificação recebem mais horas de CFD e túnel de vento para se recuperar.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. EFICIÊNCIA DE RECURSOS", "A Arte de Fazer Mais com Menos", "Cada atualização levada para a pista precisa ser validada para não queimar orçamento atoa.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Gastar com inteligência vale mais do que ter orçamentos infinitos na F1 moderna.
            </div>
          </div>
        )
      }

      // CENA 8: O LÍDER DA EQUIPE (25.0s)
      if (currentScene.visualEffectType === "mod7_team_principal_challenge") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 07 CONCLUÍDO • A FORÇA DO COLETIVO
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  GESTÃO ESTRATÉGICA
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  POR TRÁS DA EQUIPE
                </div>
                <p className="text-xs text-zinc-300">
                  Você desvendou como chefes de equipe, engenheiros, mecânicos do pit stop e a fábrica inteira operam como um só exército sincronizado.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 7 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. VITÓRIA COLETIVA", "O Piloto Levanta o Troféu, o Time Vence", "Cada centésimo ganho na pista é fruto do trabalho meticuloso de centenas de mentes dedicadas.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. HORA DO DESAFIO", "Avalie seu Conhecimento", "Avance para as dez perguntas e teste seus conhecimentos sobre a liderança e operação da F1!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 8: DOMINANDO OS CIRCUITOS (TRAÇADOS, FRENAGENS E CURVAS)
    // ------------------------------------------------------------------------
    if (activeModuleId === 8) {
      // CENA 1: CADA CIRCUITO CONTA UMA HISTÓRIA (25.0s)
      if (currentScene.visualEffectType === "mod8_circuit_anatomy") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 08 • ANATOMIA DO CIRCUITO E TIPOS DE TRECHO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ELEMENTOS TOPOGRÁFICOS DE UMA PISTA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">RETAS & VÁCUO</strong>
                    <span className="text-[9px] text-zinc-300">Zonas de velocidade final, aproximação aerodinâmica e ativação de modos.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CHICANES & ZEBRAS</strong>
                    <span className="text-[9px] text-zinc-300">Mudanças bruscas de direção que exigem absorção violenta da suspensão.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CURVAS DE ALTA</strong>
                    <span className="text-[9px] text-zinc-300">Trechos onde a carga aerodinâmica atinge 5G laterais no pescoço do piloto.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A LEITURA DA PISTA", "Cada Autódromo é um Desafio Único", "Antes de acelerar, o piloto precisa mapear as zonas de ultrapassagem e as áreas de frenagem.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. TRANSIÇÃO EM CHICANES", "Ataque às Zebras", "O piloto usa as zebras para esticar o traçado, mas o fundo do carro não pode decolar.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. PRESSÃO AERODINÂMICA", "Curvas Rápidas no Limite", "Quanto maior a velocidade de entrada, mais o downforce empurra o carro ao chão.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Pilotar na F1 é encadear uma sequência matemática perfeita de decisões geométricas.
            </div>
          </div>
        )
      }

      // CENA 2: A TRAJETÓRIA IDEAL - RACING LINE (25.0s)
      if (currentScene.visualEffectType === "mod8_racing_line") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TRAJETÓRIA IDEAL • A GEOMETRIA QUE MAXIMIZA A VELOCIDADE
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  AS TRÊS ETAPAS DE UMA CURVA PERFEITA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">1. ENTRADA (OUT)</strong>
                    <span className="text-[10px] text-zinc-300">Abrir o carro na borda externa para aumentar o raio da curva.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">2. ÁPICE (IN/APEX)</strong>
                    <span className="text-[10px] text-zinc-300">Tangenciar a zebra interna no ponto exato de menor velocidade.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">3. SAÍDA (OUT)</strong>
                    <span className="text-[10px] text-zinc-300">Espalhar até a zebra externa destracionando o volante para acelerar cedo.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. ABRIR A ENTRADA", "Maximizando o Raio Geométrico", "Quanto mais aberto o carro entra, menor é a inclinação necessária de volante para contornar.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O PONTO DE TANGÊNCIA", "O Apex da Curva", "O ponto mais interno onde o carro encosta na zebra antes de iniciar a retomada de tração.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ESPALHAR NA SAÍDA", "Pé no Fundo com Volante Reto", "Acelerar com o volante ainda esterçado provoca derrapagem e superaquecimento da traseira.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A racing line transforma curvas fechadas em arcos o mais abertos possível.
            </div>
          </div>
        )
      }

      // CENA 3: A CIÊNCIA DA FRENAGEM (25.0s)
      if (currentScene.visualEffectType === "mod8_braking_physics") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                FRENAGEM • REFERÊNCIAS VISUAIS E TRANSFERÊNCIA DE PESO
              </span>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-orange-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest block mb-1">
                  MARCOS DE DESACELERAÇÃO
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "PLACAS DE 150m E 100m" : cueIndex === 2 ? "CARGA TOTAL > 5G" : "TRAIL BRAKING NO VÉRTICE"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Pilotos usam placas laterais, marcas no asfalto e sombras como pontos exatos de pisar no freio a 340 km/h."}
                  {cueIndex === 2 && "Na mordida inicial, a carga violenta transfere todo o peso para o eixo dianteiro, colando os pneus no solo."}
                  {cueIndex === 3 && "Conforme a velocidade cai, o piloto precisa aliviar o pedal progressivamente para não travar a dianteira."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. PONTOS DE REFERÊNCIA", "Precisão Visual a 340 km/h", "Um erro de cinco metros na freada significa perder o contorno e espalhar pela brita.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. TRANSFERÊNCIA DE MASSA", "O Peso Avançando", "A dianteira afunda e ganha atrito mecânico enquanto a traseira fica leve e arisca.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ALÍVIO PROGRESSIVO", "Evitando o Travamento de Rodas", "Com menos downforce em baixa velocidade, a pressão do pedal deve diminuir suavemente.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Acelerar é instinto, mas frear na F1 é uma ciência de precisão cirúrgica.
            </div>
          </div>
        )
      }

      // CENA 4: CURVAS LENTAS, MÉDIAS E RÁPIDAS (25.0s)
      if (currentScene.visualEffectType === "mod8_corner_categories") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                CATEGORIAS DE CURVA • VELOCIDADE VS NATUREZA DA ADERÊNCIA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  COMPARAÇÃO DAS VELOCIDADES DE CONTORNO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-amber-300 block">LENTA (&lt; 100 KM/H)</strong>
                    <span className="text-[10px] text-zinc-300">Domínio mecânico: suspensão macia, diferencial e tração dos pneus.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-cyan-300 block">MÉDIA (120-180 KM/H)</strong>
                    <span className="text-[10px] text-zinc-300">Equilíbrio misto entre aderência dos pneus e início da carga aerodinâmica.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">RÁPIDA (&gt; 250 KM/H)</strong>
                    <span className="text-[10px] text-zinc-300">Domínio aerodinâmico total: o downforce cola o carro contra o asfalto.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. CURVAS DE BAIXA", "Aderência Mecânica Pura", "Em curvas lentas (ex.: Loews em Mônaco), as asas não geram ar suficiente; os pneus fazem todo o trabalho.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. CURVAS DE MÉDIA", "O Teste de Equilíbrio do Chassi", "Trechos como a curva Luffield em Silverstone exigem precisão do volante sem sobrecarregar a traseira.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CURVAS DE ALTA", "O Poder do Downforce", "Em curvas como Copse ou Pouhon, a velocidade é inacreditável porque o ar comprime o chassi contra o solo.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Nas curvas de alta velocidade, desacelerar de forma brusca reduz o downforce e faz o carro rodar.
            </div>
          </div>
        )
      }

      // CENA 5: O CÍRCULO DE ATRITO (25.0s)
      if (currentScene.visualEffectType === "mod8_friction_circle") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                DINÂMICA VEICULAR • O CÍRCULO DE ADERÊNCIA DOS PNEUS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ORÇAMENTO DE 100% DE ATRITO
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-400 font-bold">FRENAGEM PURA:</span>
                    <span className="text-white">100% Freio / 0% Curva</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-400 font-bold">CONTORNO (APEX):</span>
                    <span className="text-white">10% Freio / 90% Curva</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-bold">ACELERAÇÃO (SAÍDA):</span>
                    <span className="text-white">80% Tração / 20% Curva</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans pt-1">
                    Exigir 100% de freio e 50% de esterço ao mesmo tempo ultrapassa o círculo de atrito e gera travamento imediato.
                  </p>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O LIMITE DO PNEU", "Capacidade Finita de Força", "O pneu tem 100% de atrito para dividir entre frear, virar e tracionar.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. SUBESTERÇO E SOBRESTERÇO", "Sair de Frente vs Sair de Traseira", "Understeer ocorre quando as rodas dianteiras perdem atrito; oversteer quando a traseira escapa.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. SUAVIDADE AO VOLANTE", "Pilotar na Borda do Círculo", "Os campeões mantêm o pneu exatamente no limiar máximo de atrito sem derrapar.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Derrapar em excesso parece agressivo, mas na F1 custa décimos de segundo preciosos.
            </div>
          </div>
        )
      }

      // CENA 6: TRÊS TEMPLOS: MÔNACO, MONZA E SPA (25.0s)
      if (currentScene.visualEffectType === "mod8_monaco_monza_spa") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TEMPLOS DO CALENDÁRIO • MÔNACO, MONZA E SPA-FRANCORCHAMPS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  PERSONALIDADES EXTREMAS DO CALENDÁRIO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-amber-300 block">MÔNACO</strong>
                    <span className="text-[10px] text-zinc-300">Circuito de rua implacável, sem margem para erro entre os guard-rails.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">MONZA</strong>
                    <span className="text-[10px] text-zinc-300">Templo da Velocidade italiana: asas mínimas e médias acima de 250 km/h.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-emerald-300 block">SPA (BÉLGICA)</strong>
                    <span className="text-[10px] text-zinc-300">Montanha-russa pelas florestas das Ardenas e a mística da Eau Rouge.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. MÔNACO: O TESTE DOS MUROS", "Precisão de Cirurgião", "Correr a 280 km/h num túnel de concreto sem áreas de escape: qualquer toque é abandono imediato.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MONZA: O TEMPLO DA VELOCIDADE", "Arrasto Quase Zero", "Monopostos com asas reduzidas ao mínimo, frenagens brutais de 350 km/h para 70 km/h na Variante del Rettifilo.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. SPA-FRANCORCHAMPS", "A Subida da Eau Rouge", "Sete quilômetros de relevo natural, onde um setor pode estar com sol e outro com tempestade torrencial.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Vencer nos três templos é o selo definitivo de consagração de um piloto de Fórmula 1.
            </div>
          </div>
        )
      }

      // CENA 7: QUANDO A PISTA MUDA (25.0s)
      if (currentScene.visualEffectType === "mod8_rain_track_limits") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PISTA MOLHADA • A TRAJETÓRIA DE CHUVA E O PERIGO DO EMBORRACHAMENTO
              </span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-blue-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest block mb-1">
                  COMPORTAMENTO DO ASFALTO SOB ÁGUA
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "O TRILHO VIRA SABÃO" : cueIndex === 2 ? "A LINHA DE CHUVA (WET LINE)" : "AQUAPLANAGEM TOTAL"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "A borracha acumulada no traçado seco vira uma camada viscosa e escorregadia assim que as primeiras gotas caem."}
                  {cueIndex === 2 && "Pilotos experientes contornam as curvas por fora, buscando o asfalto áspero onde há maior aderência mecânica."}
                  {cueIndex === 3 && "Em poças profundas, a lâmina de água suspende o carro, eliminando qualquer controle de freio ou esterço."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O TRILHO TRAIÇOEIRO", "A Borracha Molhada Vira Gelo", "Seguir a linha geométrica normal na chuva provoca rodadas instantâneas por falta de atrito.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. A WET LINE (LINHA DE CHUVA)", "Buscando o Asfalto Poroso", "Curvas contornadas por fora, longe das zebras pintadas que são lisas como manteiga.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O PESADELO DA AQUAPLANAGEM", "Pneus Flutuando na Água", "Quando o fluxo de água supera os 85 litros/segundo suportados pelos pneus de chuva extrema.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Na chuva, a sensibilidade do piloto vale muito mais do que a potência do motor.
            </div>
          </div>
        )
      }

      // CENA 8: A VOLTA PERFEITA (25.0s)
      if (currentScene.visualEffectType === "mod8_lap_master_challenge") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 08 CONCLUÍDO • O ENCADINHAMENTO DA VOLTA PERFEITA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  DOMÍNIO DOS CIRCUITOS
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A CIÊNCIA DA PISTA
                </div>
                <p className="text-xs text-zinc-300">
                  Você aprendeu a ler traçados, frenagens por referências, curvas de alta contra curvas de baixa, o círculo de atrito e as armadilhas da chuva.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 8 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O ENCAIXE DOS TRÊS SETORES", "A Perfeição em Cada Metro", "Uma volta mágica não é sorte: é a execução geométrica impecável de cada ápice e ponto de frenagem.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. DESAFIO DE PILOTAGEM", "Teste seus Conhecimentos de Pista", "Avance para as dez perguntas e prove que você domina as curvas e os segredos dos circuitos!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 9: A MENTE DOS CAMPEÕES (PSICOLOGIA, CONSISTÊNCIA E PRESSÃO)
    // ------------------------------------------------------------------------
    if (activeModuleId === 9) {
      // CENA 1: VELOCIDADE NÃO É TUDO (25.0s)
      if (currentScene.visualEffectType === "mod9_qualities_overview") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 09 • OS 5 PILARES DE UM PILOTO CAMPEÃO DO MUNDO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ALÉM DO CRONÔMETRO PURO
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">VELOCIDADE PURA</strong>
                    <span className="text-[9px] text-zinc-300">Decide a volta de sábado, mas não garante o troféu do domingo.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CONSISTÊNCIA</strong>
                    <span className="text-[9px] text-zinc-300">Repetir 60 voltas sem errar um único milímetro na trajetória.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">LUCIDEZ SOB 5G</strong>
                    <span className="text-[9px] text-zinc-300">Decisões táticas perfeitas com frequência cardíaca a 180 bpm.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A ILUSÃO DA VELOCIDADE", "Sábado vs Domingo", "Ser o mais veloz em uma volta rápida define a pole, mas a corrida exige ritmo de maratona.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. A REGULARIDADE METRÔNOMA", "A Repetição Perfeita", "Campeões mundiais cravam voltas consecutivas com variações inferiores a um décimo de segundo.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. LUCIDEZ A 300 KM/H", "A Mente Acima do Físico", "Filtrar ruídos e conversar tranquilamente com o engenheiro sob forças violentas de aceleração.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Na Fórmula 1, o talento natural abre portas, mas a disciplina mental constrói os títulos.
            </div>
          </div>
        )
      }

      // CENA 2: A MENTE SOB PRESSÃO (25.0s)
      if (currentScene.visualEffectType === "mod9_pressure_mindset") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                CONTROLE EMOCIONAL • FREQUÊNCIA CARDÍACA E O CUSTO DO ERRO
              </span>
              <span className="text-[10px] font-mono text-red-500 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-red-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block mb-1">
                  BIOMETRIA DO PILOTO NO COCKPIT
                </span>
                <div className="py-2 text-3xl font-black text-white">
                  {cueIndex === 1 ? "170 - 190 BPM" : cueIndex === 2 ? "O CUSTO DO ERRO" : "RESET EM 2 SEGUNDOS"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "O coração bate no limite aeróbico durante duas horas seguidas, suportando 50°C de temperatura dentro do habitáculo."}
                  {cueIndex === 2 && "Perder uma freada ou tocar na zebra destrói a confiança de um piloto mediano, mas um campeão não se desespera."}
                  {cueIndex === 3 && "Pilotos extraordinários apagam o erro da memória instantaneamente para focar com precisão cirúrgica na próxima curva."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O ESTRESSE BIOMÉTRICO", "Batimentos no Teto Cardíaco", "A exaustão muscular e a respiração pesada tornam qualquer raciocínio lógico um desafio hercúleo.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. NÃO PARALISAR NO ERRO", "A Reação à Falha", "Errar faz parte do automobilismo; o que separa o bom piloto do extraordinário é como ele reage.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O RESET MENTAL", "Foco no Presente Imediato", "Quem fica remoendo a curva anterior bate o carro na curva seguinte.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Pilotos de topo treinam técnicas de neurofeedback para manter a serenidade sob pressão extrema.
            </div>
          </div>
        )
      }

      // CENA 3: A ARTE DA CONSISTÊNCIA (25.0s)
      if (currentScene.visualEffectType === "mod9_consistency_pace") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                RITMO DE PROVA • PILOTO INCONSTANTE VS METRÔNOMO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  HISTÓRICO DE VOLTAS CONSECUTIVAS
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/40 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-400 block">PILOTO A (OSCILAÇÃO)</strong>
                    <div className="text-[10px] text-zinc-300 mt-1 space-y-0.5">
                      <div>V1: 1:21.100 (Muito rápido)</div>
                      <div>V2: 1:22.400 (Travou roda)</div>
                      <div>V3: 1:21.800 (Tráfego)</div>
                      <div className="text-red-400 font-bold">V4: 1:23.200 (Pneu cozido)</div>
                    </div>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-emerald-950/40 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-emerald-400 block">PILOTO B (O METRÔNOMO)</strong>
                    <div className="text-[10px] text-zinc-300 mt-1 space-y-0.5">
                      <div>V1: 1:21.500 (Constante)</div>
                      <div>V2: 1:21.540 (Precisão)</div>
                      <div>V3: 1:21.510 (Gestão limpa)</div>
                      <div className="text-emerald-400 font-bold">V4: 1:21.490 (Pneu intacto)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PILOTO DOS PICOS", "Rápido Mas Irregular", "Faz a volta mais rápida da prova, mas destrói os pneus e perde tempo médio na soma da corrida.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O PILOTO METRÔNOMO", "A Força da Repetição Perfeita", "Parece discreto, mas acumula segundos de vantagem sem forçar o motor nem a borracha.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. DESTRUIÇÃO PSICOLÓGICA", "A Pressão do Ritmo Implacável", "Adversários que perseguem um piloto metrônomo entram em desespero e cometem erros forçados.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Prost e Schumacher construíram impérios sendo metrônomos inabaláveis na pista.
            </div>
          </div>
        )
      }

      // CENA 4: ATAQUE, DEFESA E LEITURA (25.0s)
      if (currentScene.visualEffectType === "mod9_racecraft_duels") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                RACECRAFT • PSICOLOGIA DE DUELO E VISÃO DE LONGO PRAZO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ESTRATÉGIA PSICOLÓGICA DE PISTA
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "PRESSÃO NOS RETROVISORES" : cueIndex === 2 ? "ESTUDAR TRÊS VOLTAS ANTES" : "PENSAR NO CAMPEONATO"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Colocar o bico do carro nos retrovisores força o piloto da frente a olhar para trás e perder as referências de freada."}
                  {cueIndex === 2 && "O campeão observa durante três voltas onde o adversário tem pior tração antes de armar o bote fatal."}
                  {cueIndex === 3 && "Saber quando aceitar o segundo lugar em vez de bater o carro é o segredo de quem levanta o troféu mundial em novembro."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. JOGO PSICOLÓGICO", "A Presença Intimidadora", "Mostrar o carro nas frenagens desestabiliza emocionalmente o rival sem tocar nele.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. A ARTE DO BOTE", "Paciência e Planejamento", "Ultrapassar não é se atirar no primeiro espaço, mas esperar a curva onde o sucesso é garantido.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A CONTA DO CAMPEONATO", "Pontos Garantidos Valem Mais", "Evitar o abandono contra um rival inconsequente garante a liderança na tabela de pontos.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Para terminar em primeiro, antes de tudo é preciso terminar a corrida.
            </div>
          </div>
        )
      }

      // CENA 5: OS PNEUS EXIGEM INTELIGÊNCIA (25.0s)
      if (currentScene.visualEffectType === "mod9_tire_intelligence") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                GESTÃO DE BORRACHA • POUPAR PNEUS ANDANDO RÁPIDO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  TÉCNICA DE PILOTAGEM LIMPA
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "SEM TRAVAMENTOS DE RODA" : cueIndex === 2 ? "SUAVIDADE NOS APOIOS" : "PNEUS VIVOS NO FINAL"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Cada travada de roda arranca camadas de borracha e cria pontos planos que desbalanceiam o carro."}
                  {cueIndex === 2 && "Virar o volante com suavidade nas curvas rápidas evita que os ombros do pneu sofram com superaquecimento."}
                  {cueIndex === 3 && "Chegar às últimas dez voltas com pneus saudáveis permite ultrapassar rivais que esgotaram a borracha cedo."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. ADERÊNCIA NÃO É INFINITA", "O Estoque Finito de Borracha", "O pneu é como uma conta bancária: cada excesso de esterço retira saldo de aderência.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. GESTÃO TÉRMICA", "Evitar o Superaquecimento Interno", "Dirigir rápido sem escorregar a traseira nas reacelerações mantém o pneu vivo por 10 voltas a mais.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. O ATAQUE NO FIM DO STINT", "A Recompensa da Paciência", "Quem poupou pneu no início voa baixo no final do stint enquanto os outros despencam.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Gerenciar pneus não é andar devagar, é guiar com eficiência cirúrgica.
            </div>
          </div>
        )
      }

      // CENA 6: ESTILOS DIFERENTES, CAMPEÕES DIFERENTES (25.0s)
      if (currentScene.visualEffectType === "mod9_champions_styles") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ESTILOS DE PILOTAGEM • MÚLTIPLOS CAMINHOS PARA A GRANDEZA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  AS PERSONALIDADES QUE VENCERAM
                </span>
                <div className="grid grid-cols-2 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-amber-300 block">AYRTON SENNA</strong>
                    <span className="text-[10px] text-zinc-300">Intensidade visceral, instinto puro e velocidade transcendental na classificação e chuva.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">MICHAEL SCHUMACHER</strong>
                    <span className="text-[10px] text-zinc-300">Preparação física espartana, método analítico e simetria técnica com a Ferrari.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-cyan-300 block">LEWIS HAMILTON</strong>
                    <span className="text-[10px] text-zinc-300">Precisão cirúrgica sob pressão, suavidade com os pneus e longevidade recorde.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-purple-950/60 border-purple-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-purple-300 block">MAX VERSTAPPEN</strong>
                    <span className="text-[10px] text-zinc-300">Agressividade implacável, controle reflexivo absurdo do carro e consistência demolidora.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O INSTINTO DE SENNA", "A Devoção Total à Velocidade", "Senna pilotava com a alma, buscando limites que outros pilotos julgavam fisicamente impossíveis.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O MÉTODO DE SCHUMACHER", "A Disciplina Inovadora", "Transformou a F1 moderna ao introduzir condicionamento atlético total e liderança dentro da fábrica.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. HAMILTON E VERSTAPPEN", "Precisão Cirúrgica e Fome Voraz", "Dois gigantes contemporâneos provando que maestria técnica e agressividade controlada constroem eras.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Não existe um único estilo correto: a grandeza se adapta à personalidade de cada gênio.
            </div>
          </div>
        )
      }

      // CENA 7: QUANDO O PLANO DÁ ERRADO (25.0s)
      if (currentScene.visualEffectType === "mod9_adapting_uncertainty") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                ADAPTAÇÃO • CRESCER EXATAMENTE QUANDO O CAOS SE INSTALA
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                  IMPREVISTOS NA PISTA
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "O PLANO QUEBROU" : cueIndex === 2 ? "FILTRAR O RUÍDO" : "CRESCER NO CAOS"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Uma asa dianteira danificada, chuva repentina ou um Safety Car inesperado jogam fora todo o plano pré-corrida."}
                  {cueIndex === 2 && "Em vez de lamentar pelo rádio, o piloto campeão ajusta a distribuição de freios e muda seu estilo de guiar."}
                  {cueIndex === 3 && "É nas corridas caóticas e imprevisíveis que os verdadeiros campeões mundiais constroem suas lendas."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PLANO QUE DESMORONA", "A Inevitável Incerteza da F1", "Nenhuma simulação de computador prevê uma quebra de asa ou óleo na pista na volta 30.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. DIÁLOGO CALMO NO CAOS", "A Confiança no Muro", "O piloto campeão relata a perda de aderência sem drama e pede opções táticas imediatamente.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. A OPORTUNIDADE OCULTA", "Vencer na Dificuldade", "Quando todos os rivais entram em pânico, o piloto frio enxerga a rota mais rápida para a vitória.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O piloto comum precisa que tudo esteja perfeito; o campeão vence mesmo quando tudo dá errado.
            </div>
          </div>
        )
      }

      // CENA 8: A MENTE DO CAMPEÃO (25.0s)
      if (currentScene.visualEffectType === "mod9_champion_mindset_challenge") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 09 CONCLUÍDO • O FATOR HUMANO NA FÓRMULA 1
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  PSICOLOGIA DE ELITE
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A MENTE DOS CAMPEÕES
                </div>
                <p className="text-xs text-zinc-300">
                  Você desvendou os pilares mentais: velocidade, consistência milimétrica, controle emocional sob 180 bpm, respeito aos pneus e a capacidade de brilhar no caos.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 9 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A SOMA DAS HABILIDADES", "Além do Talento Bruto", "A velocidade é apenas o bilhete de entrada; o que ergue o troféu é o autocontrole e a inteligência.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MOSTRE SUA MENTE", "O Quiz dos Campeões", "Avance para as dez perguntas e prove que você compreende a psicologia de quem vence na F1!")}

            <div className="h-4" />
          </div>
        )
      }
    }


    // ------------------------------------------------------------------------
    // MÓDULO 10: A TECNOLOGIA POR TRÁS DA VELOCIDADE (ENGENHARIA E DADOS)
    // ------------------------------------------------------------------------
    if (activeModuleId === 10) {
      // CENA 1: O CARRO É UM SISTEMA INTEGRADO (25.0s)
      if (currentScene.visualEffectType === "mod10_integrated_system") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 10 • ENGENHARIA SISTÊMICA DA FÓRMULA 1
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  TODOS OS SISTEMAS CONECTADOS
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">AERO & CHASSI</strong>
                    <span className="text-[9px] text-zinc-300">Assoalho gerando pressão negativa em conjunto com a rigidez torsional.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-emerald-950/60 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">PROPULSÃO HÍBRIDA</strong>
                    <span className="text-[9px] text-zinc-300">Entrega linear de torque combinando motor térmico e MGU-K elétrico.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-purple-950/60 border-purple-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">DADOS & SENSORES</strong>
                    <span className="text-[9px] text-zinc-300">+300 sensores registrando pressões e temperaturas para a central eletrônica.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. SEM PEÇA MILAGROSA", "A Vitória é Sistêmica", "A velocidade não vem de uma solução isolada, mas de centenas de parâmetros conversando harmoniosamente.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O EFEITO DOMINÓ", "Alterações Mecânicas Conectadas", "Mudar a rigidez da barra estabilizadora afeta a aerodinâmica e o aquecimento dos pneus.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. EQUILÍBRIO GLOBAL", "O Carro como Organismo Único", "Engenheiros buscam a janela em que todos os componentes operam no pico de eficiência conjunta.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A Fórmula 1 é o ápice da engenharia mecatrônica contemporânea.
            </div>
          </div>
        )
      }

      // CENA 2: AERODINÂMICA: DOMINANDO O AR (25.0s)
      if (currentScene.visualEffectType === "mod10_aerodynamics_balance") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                AERODINÂMICA AVANÇADA • PRESSÃO AERODINÂMICA VS ARRASTO
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  A FÍSICA DO FLUXO DE AR
                </span>
                <div className="py-2 text-2xl font-black text-white">
                  {cueIndex === 1 ? "PRESSÃO VERTICAL DESCENDENTE" : cueIndex === 2 ? "A PENALIDADE DO ARRASTO" : "COMPROMISSO EM CFD"}
                </div>
                <p className="text-xs text-zinc-300 font-sans">
                  {cueIndex === 1 && "Diferenças de pressão entre a parte superior e inferior do carro criam sucção potente que o cola no solo."}
                  {cueIndex === 2 && "Toda asa que gera sustentação negativa também cria resistência frontal ao ar (drag), reduzindo velocidade máxima."}
                  {cueIndex === 3 && "Modelos matemáticos em supercomputadores de CFD encontram o ponto de maior velocidade na soma da volta inteira."}
                </p>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O AR COMO ALIADO", "Downforce em Curvas Rápidas", "Permite contornar curvas de 250 km/h sem que a inércia jogue o carro para fora da pista.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O AR COMO INIMIGO", "A Resistência nas Retas", "O arrasto excessivo deixa o monoposto vulnerável a ultrapassagens fáceis dos concorrentes.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. TÚNEL DE VENTO & CFD", "A Busca pelo Formato Ideal", "Milhares de horas virtuais calculando o caminho exato de cada molécula de ar sobre o chassi.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O design aerodinâmico define mais de 60% do desempenho total de um carro de Fórmula 1.
            </div>
          </div>
        )
      }

      // CENA 3: AERODINÂMICA ATIVA: OS MODOS DE 2026 (25.0s)
      if (currentScene.visualEffectType === "mod10_active_aero_modes") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                REGULAMENTO 2026 • AERODINÂMICA ATIVA: STRAIGHT & CORNER MODES
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CONFIGURAÇÃO DINÂMICA DAS ASAS EM TEMPO REAL
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 || cueIndex === 2 ? "bg-cyan-950/60 border-cyan-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-cyan-300 block">STRAIGHT MODE (RETAS)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Flaps móveis das asas dianteira e traseira abrem em conjunto nas zonas autorizadas, minimizando o arrasto para máxima velocidade.</span>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 3 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">CORNER MODE (CURVAS)</strong>
                    <span className="text-[11px] text-zinc-300 mt-1 block">Asas fecham instantaneamente na freada, restabelecendo a pressão aerodinâmica máxima para total estabilidade e frenagem segura.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O SALTO DE 2026", "Asas Ativas Coordenadas", "Pela primeira vez na história da F1, a asa dianteira e a traseira movem-se juntas para controlar o fluxo.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. STRAIGHT MODE", "Mínima Resistência nas Retas", "Reduz o arrasto drasticamente, permitindo velocidades extremas com menor consumo de combustível e bateria.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. CORNER MODE", "Retorno Imediato da Carga", "Na primeira pressão no pedal de freio, os flaps fecham para colar os pneus no asfalto.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A aerodinâmica ativa de 2026 elimina a dependência do DRS tradicional da era anterior.
            </div>
          </div>
        )
      }

      // CENA 4: UNIDADE DE POTÊNCIA 2026 (25.0s)
      if (currentScene.visualEffectType === "mod10_power_unit_hybrid") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                PROPULSÃO 2026 • 50% TÉRMICA & 50% ELÉTRICA (SEM MGU-H)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-emerald-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  ARQUITETURA DA UNIDADE HÍBRIDA 2026
                </span>
                <div className="grid grid-cols-2 gap-3 py-2 text-left">
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 1 ? "bg-emerald-950/60 border-emerald-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-emerald-300 block">MOTOR TÉRMICO V6 1.6L</strong>
                    <div className="text-[10px] text-zinc-300 mt-1 space-y-0.5">
                      <div>• ~400 kW (~530 cv) de combustão</div>
                      <div>• 100% biocombustível sustentável</div>
                      <div>• Redução do fluxo de combustível</div>
                    </div>
                  </div>
                  <div className={cn("p-2.5 rounded-xl border transition-all", cueIndex === 2 || cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-cyan-300 block">SISTEMA ELÉTRICO MGU-K</strong>
                    <div className="text-[10px] text-zinc-300 mt-1 space-y-0.5">
                      <div>• 350 kW (~470 cv elétricos)</div>
                      <div>• Potência elétrica triplicada</div>
                      <div>• MGU-H 100% ELIMINADO</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. COMBUSTÍVEL SUSTENTÁVEL", "Zero Carbono Fóssil", "A F1 2026 roda com combustíveis sintéticos derivados de captura de carbono e resíduos biológicos.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. MGU-K DE 350 KW", "Triplicação da Força Elétrica", "O motor elétrico quase empata com o motor a gasolina em potência de pico gerada.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. POTÊNCIA VS ENERGIA", "Gerenciar o Estoque da Bateria", "Potência é a força instantânea; energia é a reserva que deve ser recarregada a cada frenagem.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              O fim do complexo MGU-H atraiu novas montadoras como Audi e Ford para a Fórmula 1.
            </div>
          </div>
        )
      }

      // CENA 5: BOOST, OVERTAKE MODE E RECHARGE (25.0s)
      if (currentScene.visualEffectType === "mod10_boost_overtake_recharge") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                GESTÃO ENERGÉTICA • BOOST, OVERTAKE MODE E RECARGA TÁTICA
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  ESTADOS DE FLUXO DA BATERIA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-red-950/60 border-red-500 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-red-300 block">BOOST MODE</strong>
                    <span className="text-[9px] text-zinc-300">Pico máximo de 350 kW para saídas de curva e defesas agressivas.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-purple-950/60 border-purple-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-purple-300 block">OVERTAKE MODE</strong>
                    <span className="text-[9px] text-zinc-300">Substituto do DRS: injeção extra de eletricidade quando colado no rival.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-emerald-950/60 border-emerald-400 scale-102" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-emerald-300 block">RECHARGE (RECUPERAÇÃO)</strong>
                    <span className="text-[9px] text-zinc-300">Freios regenerativos recarregam a bateria em desacelerações intensas.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. DISPARO DE BOOST", "Potência Sob Demanda", "O piloto aperta o botão de boost no volante para queimar eletricidade e defender a posição.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. OVERTAKE MODE (2026)", "A Energia do Caçador", "Sistema regulamentar que concede vantagem elétrica para quem persegue colado no adversário.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. MODO RECHARGE", "Enchendo o Tanque Elétrico", "Nas curvas lentas e frenagens, o MGU-K atua como gerador brutal recompondo a carga da bateria.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Desperdiçar energia no início da reta provoca derating (corte elétrico) antes da frenagem.
            </div>
          </div>
        )
      }

      // CENA 6: TELEMETRIA E DADOS (25.0s)
      if (currentScene.visualEffectType === "mod10_telemetry_laps") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                TELEMETRIA DE ENGENHARIA • A FÓRMULA 1 TRANSFORMADA EM NÚMEROS
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
                  CANAIS DE TELEMETRIA POR MILISSEGUNDO
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left space-y-1.5">
                  <div className="text-cyan-400 font-bold">CANAL 1: SPEED (VELOCIDADE)</div>
                  <div className="text-zinc-300 text-[10px]">Picos de reta, velocidade mínima de contorno e desaceleração.</div>
                  <div className="text-emerald-400 font-bold pt-1">CANAL 2: THROTTLE & BRAKE</div>
                  <div className="text-zinc-300 text-[10px]">Porcentagem de acelerador e pressão hidráulica no circuito de freio.</div>
                  <div className="text-amber-400 font-bold pt-1">CANAL 3: TYRE CARCASS TEMP</div>
                  <div className="text-zinc-300 text-[10px]">Sensores ópticos medindo a temperatura interna da carcaça do pneu.</div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. TREZENTOS SENSORES", "A Pista Mapeada", "A cada metro percorrido, dados de carga da suspensão e calor são enviados ao box sem fio.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. COMPARATIVO DE VOLTAS", "A Busca pelo Tempo Perdido", "Engenheiros mostram ao piloto onde ele freou cedo demais ou destracionou tarde na curva.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. REFINAMENTO DE CLASSIFICAÇÃO", "Ajustes Milimétricos", "Alterar meio grau de asa dianteira baseado nos traços de telemetria garante a pole position.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              Na F1 moderna, a intuição do piloto é validada pela ciência incontestável dos dados.
            </div>
          </div>
        )
      }

      // CENA 7: MATERIAIS, ESTRUTURA E SEGURANÇA (25.0s)
      if (currentScene.visualEffectType === "mod10_materials_safety") {
        const cueIndex = audioCurrentTime < 8.0 ? 1 : audioCurrentTime < 16.0 ? 2 : 3
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                CIÊNCIA DOS MATERIAIS • MONOCOQUE DE CARBONO E O HALO DE TITÂNIO
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                FASE {cueIndex} DE 3
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md max-w-lg w-full text-center shadow-2xl animate-fade-in font-mono text-xs">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest block mb-1">
                  HOMOLOGAÇÃO DE SOBREVIVÊNCIA DA FIA
                </span>
                <div className="grid grid-cols-3 gap-2 py-2 text-left">
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 1 ? "bg-amber-950/60 border-amber-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CÉLULA DE CARBONO</strong>
                    <span className="text-[9px] text-zinc-300">Fibra de carbono tecida com camadas de Zylon anti-penetração de destroços.</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 2 ? "bg-red-950/60 border-red-500" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">HALO DE TITÂNIO</strong>
                    <span className="text-[9px] text-zinc-300">Norma FIA 8869-2018: suporta carga estática de 120 kN (~12 toneladas).</span>
                  </div>
                  <div className={cn("p-2 rounded-xl border transition-all", cueIndex === 3 ? "bg-cyan-950/60 border-cyan-400" : "bg-black/50 border-white/10")}>
                    <strong className="text-xs text-white block">CRASH STRUCTURES</strong>
                    <span className="text-[9px] text-zinc-300">Cones deformáveis de impacto que absorvem energia desacelerando o corpo.</span>
                  </div>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. A CÉLULA INDEFORMÁVEL", "O Casulo de Carbono e Zylon", "O monocoque protege o piloto mantendo o cockpit intacto mesmo em batidas violentas a mais de 250 km/h.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. O HALO DE 120 KN", "Titânio de Grau Aeroespacial", "Testado para suportar o peso de dois ônibus londrinos empilhados sobre a cabeça do piloto.")}
            {cueIndex === 3 && renderMarianaSyncBadge("03. ABSORÇÃO DE ENERGIA", "Estruturas Deformáveis", "Bicos e laterais esmagam-se progressivamente para que a desaceleração sofrida pelos órgãos seja sobrevivível.")}

            <div className="pointer-events-auto max-w-sm mx-auto w-full bg-black/90 border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-center text-xs text-zinc-300">
              A evolução dos materiais garante que os pilotos saiam caminhando dos acidentes mais brutais.
            </div>
          </div>
        )
      }

      // CENA 8: DESAFIO FINAL: O ENGENHEIRO DE EQUIPE (25.0s)
      if (currentScene.visualEffectType === "mod10_engineer_challenge") {
        const cueIndex = audioCurrentTime < 10.0 ? 1 : 2
        return (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-6 z-20">
            <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 backdrop-blur-sm">
              <span className="text-xs font-mono font-black uppercase text-white tracking-wider">
                MÓDULO 10 CONCLUÍDO • O ENGENHEIRO DA FÓRMULA 1
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                PARABÉNS!
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-black/90 border border-emerald-500/50 backdrop-blur-md max-w-md w-full text-center shadow-2xl animate-fade-in">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
                  FORMAÇÃO COMPLETA
                </span>
                <div className="text-xl font-mono font-black text-white py-1">
                  A TECNOLOGIA DA VELOCIDADE
                </div>
                <p className="text-xs text-zinc-300">
                  Você dominou a aerodinâmica ativa de 2026, as unidades de potência híbridas com combustíveis limpos, a telemetria ao vivo e as estruturas de segurança da FIA.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setViewStage("quiz")}
                    className="pointer-events-auto w-full py-2.5 px-4 rounded-xl bg-[#E10600] hover:bg-[#ff1a14] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Fazer o Quiz do Módulo 10 (10 Perguntas)
                  </button>
                </div>
              </div>
            </div>

            {cueIndex === 1 && renderMarianaSyncBadge("01. O PAPEL DO ENGENHEIRO", "Integrar Ciência e Competição", "Agora você é capaz de olhar para um carro de Fórmula 1 e enxergar a física e a engenharia por trás de cada curva.")}
            {cueIndex === 2 && renderMarianaSyncBadge("02. DESAFIO TÉCNICO FINAL", "O Grande Teste", "Avance para as dez perguntas e conquiste o certificado final de tecnologia da Fórmula 1!")}

            <div className="h-4" />
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
        <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[85vh]">
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
          <div className="relative z-30 w-full max-w-5xl mx-auto mb-6 px-3">
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
                : activeModuleId === 7
                ? "MÓDULO 7 — POR TRÁS DA EQUIPE"
                : activeModuleId === 8 ? "MÓDULO 8 — DOMINANDO OS CIRCUITOS" : activeModuleId === 9 ? "MÓDULO 9 — A MENTE DOS CAMPEÕES" : "MÓDULO 10 — A TECNOLOGIA POR TRÁS DA VELOCIDADE"}
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
                : activeModuleId === 7
                ? "“O piloto está na pista. Centenas de decisões acontecem nos bastidores.”"
                : "“Uma curva pode decidir uma corrida. Aprenda a enxergar o que os pilotos enxergam.”"}
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
          {/* Top Bar da Lição com Seletor Direto de Módulos */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setViewStage("opening")}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer shrink-0"
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
                className="bg-black/80 border border-white/20 rounded-lg text-xs font-mono font-bold text-white px-2 py-1 cursor-pointer hover:border-[#E10600] focus:outline-none transition-all shrink-0"
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

              <span className="px-2 py-0.5 rounded bg-[#E10600] text-white font-mono text-[10px] sm:text-xs font-black uppercase shrink-0">
                CENA 0{currentScene.number}
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white truncate hidden md:inline">
                {currentScene.title}
              </span>
              <span className="hidden lg:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300 font-bold">
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
                  if (sceneIndex < currentScenes.length - 1) {
                    if (isPlaying) autoPlayNextSceneRef.current = true
                    goToScene(sceneIndex + 1)
                  } else {
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
