import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { SVGViewer, SingleEliminationBracket, DoubleEliminationBracket } from '@g-loot/react-tournament-brackets';
import { useMemo, useState } from 'react';
import { FiAward } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import type { FaseMataMata, Participante, Partida } from '../types/torneio';
import { ModalPlacar } from './ModalPlacar';

const FASES_LABEL: Record<FaseMataMata, string> = {
  oitavas:        'Oitavas',
  quartas:        'Quartas',
  semifinal:      'Semifinal',
  final:          'Final',
  terceiro_lugar: '3º Lugar',
  grand_final:    'Grande Final',
  bracket_reset:  'Bracket Reset',
};

const ORDEM_FASES: FaseMataMata[] = ['oitavas', 'quartas', 'semifinal', 'final'];

// -- COMPONENTE CUSTOM MATCH PARA O BRACKET --
function CustomMatchComponent({ match }: any) {
  const { realMatches, isIdaEVolta, onAbrir, isReadOnly, participantes } = match.customData;
  const partidaBase = realMatches && realMatches.length > 0 ? realMatches[0] : null;
  const partidaVolta = isIdaEVolta && realMatches && realMatches.length > 1 ? realMatches[1] : null;

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const headerText = useColorModeValue('gray.700', 'gray.200');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');

  const canClick = !isReadOnly && partidaBase && !partidaBase.finalizada && partidaBase.participanteBId !== 'BYE';

  // Se nao existe partidaBase, é um slot vazio (A DEFINIR)
  if (!partidaBase) {
    return (
      <Box
        borderRadius="lg"
        boxShadow="sm"
        bg={cardBg}
        p={2}
        w="220px"
        border="1px solid"
        borderColor={useColorModeValue('gray.300', 'gray.600')}
      >
        <VStack spacing={2} align="stretch">
          <Flex justify="space-between" align="center" px={2} py={1}>
            <Text fontSize="12px" fontWeight="bold" color={textSecondary}>A Definir</Text>
            <Text fontSize="12px" color={textSecondary}>—</Text>
          </Flex>
          <Box h="1px" bg={dividerColor} />
          <Flex justify="space-between" align="center" px={2} py={1}>
            <Text fontSize="12px" fontWeight="bold" color={textSecondary}>A Definir</Text>
            <Text fontSize="12px" color={textSecondary}>—</Text>
          </Flex>
        </VStack>
      </Box>
    );
  }

  // Agrega dados
  const isBye = partidaBase.participanteBId === 'BYE';
  const aId = partidaBase.participanteAId;
  const bId = partidaBase.participanteBId;
  const pA = participantes.find((p: any) => p.id === aId);
  const pB = participantes.find((p: any) => p.id === bId);

  let golsA = partidaBase.placarA ?? 0;
  let golsB = partidaBase.placarB ?? 0;
  let hasVolta = false;
  
  if (isIdaEVolta && partidaVolta && partidaVolta.finalizada) {
    golsA += partidaVolta.placarB ?? 0;
    golsB += partidaVolta.placarA ?? 0;
    hasVolta = true;
  }

  const partidaFinal = hasVolta ? partidaVolta : partidaBase;
  const isFinalizada = partidaFinal.finalizada || isBye;

  const vencedorId = partidaFinal.vencedorId;
  const aVenceu = vencedorId === aId;
  const bVenceu = vencedorId === bId;

  return (
    <Box
      borderRadius="lg"
      boxShadow={canClick ? "md" : "sm"}
      bg={cardBg}
      w="240px"
      border="1px solid"
      borderColor={canClick ? useColorModeValue('gray.300', 'gray.600') : cardBorder}
      cursor={canClick ? "pointer" : "default"}
      onClick={() => canClick && onAbrir(partidaBase)}
      transition="all 0.1s"
      _hover={canClick ? { borderColor: "#F94A29", boxShadow: "lg" } : {}}
      overflow="hidden"
    >
      <Box bg={headerBg} px={2} py={1} borderBottom="1px solid" borderColor={dividerColor} display="flex" justifyContent="space-between" alignItems="center">
        <HStack spacing={1}>
          <Text fontSize="10px" fontWeight="extrabold" color={headerText} textTransform="uppercase">
            {FASES_LABEL[partidaBase.fase as FaseMataMata] ?? 'Fase'}
          </Text>
          {partidaBase.bracket && (
            <Badge fontSize="8px" colorScheme={partidaBase.bracket === 'UPPER' ? 'blue' : 'purple'} variant="solid">
              {partidaBase.bracket === 'UPPER' ? 'UB' : 'LB'}
            </Badge>
          )}
          {partidaBase.isLuckyLoser && (
            <Badge fontSize="8px" bg="#FEF3C7" color="#92400E" border="1px solid #F59E0B" fontWeight="extrabold">
              LUCKY LOSER
            </Badge>
          )}
          {isIdaEVolta ? (partidaBase.finalizada && !partidaVolta?.finalizada ? <Text fontSize="9px" color={textSecondary} ml={1}>(Volta pend.)</Text> : null) : null}
        </HStack>
        {isFinalizada ? (
          <Badge fontSize="9px" colorScheme="gray" variant="solid">FIM</Badge>
        ) : !isReadOnly ? (
          <Badge colorScheme="orange" variant="solid" fontSize="9px">LANÇAR</Badge>
        ) : null}
      </Box>
      <VStack spacing={0} align="stretch">
        {/* Part A */}
        <Flex
          justify="space-between" align="center" px={3} py={2}
          bg={aVenceu ? useColorModeValue('orange.50', 'rgba(249,74,41,0.15)') : 'transparent'}
        >
          <HStack spacing={2} overflow="hidden">
            {pA?.logoTime && <Image src={pA.logoTime} boxSize="20px" objectFit="contain" />}
            <VStack align="flex-start" spacing={0} overflow="hidden">
              <Text
                fontSize="13px"
                fontWeight={aVenceu ? "extrabold" : "bold"}
                color={aVenceu ? "#F94A29" : textPrimary}
                noOfLines={1}
              >
                {pA?.nomeAmigo ?? '?'}
              </Text>
              {pA?.timeSorteado && (
                <Text
                  fontSize="11px"
                  fontWeight={500}
                  color={aVenceu ? "brand.600" : textSecondary}
                  noOfLines={1}
                >
                  {pA.timeSorteado}
                </Text>
              )}
            </VStack>
          </HStack>
          <Text
            fontSize="15px"
            fontWeight={aVenceu ? "extrabold" : "bold"}
            color={aVenceu ? "#F94A29" : textPrimary}
          >
            {partidaBase.placarA !== null ? golsA : '-'}
          </Text>
        </Flex>
        
        <Box h="1px" bg={dividerColor} />

        {/* Part B */}
        <Flex
          justify="space-between" align="center" px={3} py={2}
          bg={bVenceu ? useColorModeValue('orange.50', 'rgba(249,74,41,0.15)') : 'transparent'}
        >
          <HStack spacing={2} overflow="hidden">
            {pB?.logoTime && <Image src={pB.logoTime} boxSize="20px" objectFit="contain" />}
            <VStack align="flex-start" spacing={0} overflow="hidden">
              <Text
                fontSize="13px"
                fontWeight={bVenceu ? "extrabold" : "bold"}
                color={bVenceu ? "#F94A29" : textPrimary}
                noOfLines={1}
              >
                {isBye ? "BYE" : (pB?.nomeAmigo ?? '?')}
              </Text>
              {pB?.timeSorteado && !isBye && (
                <Text
                  fontSize="11px"
                  fontWeight={500}
                  color={bVenceu ? "brand.600" : textSecondary}
                  noOfLines={1}
                >
                  {pB.timeSorteado}
                </Text>
              )}
            </VStack>
          </HStack>
          <Text
            fontSize="15px"
            fontWeight={bVenceu ? "extrabold" : "bold"}
            color={bVenceu ? "#F94A29" : textPrimary}
          >
            {isBye ? '-' : (partidaBase.placarB !== null ? golsB : '-')}
          </Text>
        </Flex>
      </VStack>
      {partidaFinal.penaltisA !== null && partidaFinal.penaltisB !== null && (
        <Box bg={headerBg} px={2} py={1} borderTop="1px solid" borderColor={dividerColor} textAlign="center">
          <Text fontSize="11px" fontWeight="extrabold" color={headerText}>
            PEN: {partidaFinal.penaltisA} x {partidaFinal.penaltisB}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// -- TELA DE PODIO --
function TelaPodio({ partidas, participantes }: { partidas: Partida[], participantes: Participante[] }) {
  const navigate = useNavigate();
  const finalMatch = (
    partidas.find(p => p.fase === 'bracket_reset' && p.finalizada) ||
    partidas.find(p => p.fase === 'grand_final' && p.finalizada) ||
    partidas.filter(p => p.fase === 'final' && p.finalizada).sort((a, b) => a.rodada - b.rodada).pop()
  );
  const thirdMatch = partidas.filter(p => p.fase === 'terceiro_lugar' && p.finalizada).sort((a, b) => a.rodada - b.rodada).pop();

  const vencedor1 = participantes.find(p => p.id === finalMatch?.vencedorId);
  const perdedor1 = participantes.find(p => p.id === finalMatch?.perdedorId); // 2o lugar
  // Em Double Elimination, se não houver partida de 3º lugar dedicada, o 3º é o perdedor da Lower Final
  const lowerFinal = partidas.filter(p => p.bracket === 'LOWER' && p.finalizada).sort((a, b) => a.rodada - b.rodada).pop();
  const vencedor3 = participantes.find(p => p.id === thirdMatch?.vencedorId) || (lowerFinal ? participantes.find(p => p.id === lowerFinal.perdedorId) : undefined);
  const perdedor3 = participantes.find(p => p.id === thirdMatch?.perdedorId); // 4o lugar

  const top4Ids = [vencedor1?.id, perdedor1?.id, vencedor3?.id, perdedor3?.id].filter(Boolean);
  const others = participantes.filter(p => !top4Ids.includes(p.id))
    .sort((a, b) => b.pontos - a.pontos || (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra));

  if (perdedor3) others.unshift(perdedor3);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const dividerColor = useColorModeValue('gray.100', 'gray.700');

  const PodiumCard = ({ p, position, height, bg, iconColor, title }: any) => (
    <VStack 
      w={{ base: "130px", md: "170px" }} 
      bg={cardBg} 
      border="1px solid" 
      borderColor={cardBorder} 
      borderRadius="lg" 
      boxShadow="md" 
      p={3}
      zIndex={4 - position}
      position="relative"
      spacing={2}
      justify="flex-end"
      h={height}
    >
      <Box position="absolute" top="-20px">
        <Flex bg={bg} w="40px" h="40px" borderRadius="full" align="center" justify="center" boxShadow="md">
           <FiAward color={iconColor} size={20} />
        </Flex>
      </Box>

      {/* Logo grande do time */}
      {p?.logoTime && (
        <Image
          src={p.logoTime}
          boxSize={{ base: "80px", md: "110px" }}
          objectFit="contain"
          mt={4}
          filter="drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
        />
      )}

      <VStack
        spacing={1}
        cursor={p?.usuarioId ? "pointer" : "default"}
        onClick={() => p?.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
        _hover={p?.usuarioId ? { opacity: 0.8 } : undefined}
      >
        <Text fontSize="sm" fontWeight="extrabold" textAlign="center" noOfLines={1} color={position === 1 ? "#F94A29" : textPrimary}>
          {p?.nomeAmigo ?? '???'}
        </Text>
        <HStack spacing={1}>
           {p?.logoTime && <Image src={p.logoTime} boxSize="12px" />}
           <Text fontSize="xs" fontWeight="500" color={textSecondary} noOfLines={1}>{p?.timeSorteado}</Text>
        </HStack>
      </VStack>
      <HStack>
         <Badge colorScheme="green" fontSize="9px">{p?.vitorias || 0}V</Badge>
         <Badge colorScheme="blue" fontSize="9px">{p?.golsPro || 0}GP</Badge>
      </HStack>
      <Text fontSize="xs" fontWeight="extrabold" color={useColorModeValue('gray.700', 'gray.300')}>{title}</Text>
    </VStack>
  );

  return (
    <Box pt={10} pb={20}>
      <VStack spacing={2} mb={10}>
         <Text fontSize="2xl" fontWeight="extrabold" color="#F94A29">TORNEIO ENCERRADO</Text>
         <Text color={textSecondary} fontWeight="500">Confira a classificação final</Text>
      </VStack>

      <Flex align="flex-end" justify="center" gap={{ base: 2, md: 6 }} minH="320px" mb={12}>
        <PodiumCard p={vencedor3} position={3} height="250px" bg="#CD7F32" iconColor="white" title="3º LUGAR" />
        <PodiumCard p={vencedor1} position={1} height="270px" bg="#FDBB00" iconColor="white" title="CAMPEÃO" />
        <PodiumCard p={perdedor1} position={2} height="265px" bg="#C0C0C0" iconColor="white" title="VICE" />
      </Flex>

      {others.length > 0 && (
         <Box maxW="600px" mx="auto" bg={cardBg} borderRadius="lg" p={5} boxShadow="sm" border="1px solid" borderColor={cardBorder}>
            <Text fontWeight="bold" mb={4} color={textPrimary}>Outras Colocações</Text>
            <VStack spacing={3} align="stretch">
               {others.map((p, i) => (
                  <Flex key={p.id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor={dividerColor}>
                     <HStack spacing={3}>
                        <Text fontWeight="bold" color={textSecondary} w="24px">{i + 4}º</Text>
                        <HStack>
                           {p?.logoTime && <Image src={p.logoTime} boxSize="16px" />}
                           <Text fontWeight="bold" color={textPrimary}>{p?.nomeAmigo}</Text>
                           <Text fontSize="xs" color={textSecondary}>({p?.timeSorteado})</Text>
                        </HStack>
                     </HStack>
                     <HStack>
                        <Badge colorScheme="green" variant="subtle">{p?.vitorias || 0} V</Badge>
                        <Badge colorScheme="blue" variant="subtle">{p?.golsPro || 0} GP</Badge>
                     </HStack>
                  </Flex>
               ))}
            </VStack>
         </Box>
      )}
    </Box>
  );
}

export function Chaveamento({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const { partidas, participantes, torneio } = useTorneioStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);

  const isIdaEVolta = torneio?.idaEVolta || false;

  const abrirModal = (partida: Partida) => {
    setPartidaSelecionada(partida);
    onOpen();
  };

  const mataMataPartidas = partidas.filter(p => p.fase !== null);
  
  // Verifica se o torneio acabou (todas as partidas mata-mata finalizadas, e as da final)
  const allMataMataFinished = mataMataPartidas.length > 0 && mataMataPartidas.every(p => p.finalizada);
  const isDoubleElim = torneio?.isDoubleElimination || false;

  // Para Double Elimination: precisa ter grand_final resolvida (e possivelmente bracket_reset)
  const hasGrandFinal = mataMataPartidas.some(p => p.fase === 'grand_final');
  const hasBracketReset = mataMataPartidas.some(p => p.fase === 'bracket_reset');
  const hasFinal = isDoubleElim ? hasGrandFinal : mataMataPartidas.some(p => p.fase === 'final');
  // terceiro lugar pode n existir se for so 2 times
  const isFinished = allMataMataFinished && hasFinal;

  // Mapeamento dinâmico para a biblioteca
  const bracketMatches = useMemo(() => {
    let startingFase = 'final';
    for (const f of ORDEM_FASES) {
      if (partidas.some(p => p.fase === f)) {
        startingFase = f;
        break;
      }
    }

    const startingIndex = ORDEM_FASES.indexOf(startingFase as FaseMataMata);
    if (startingIndex === -1) return [];

    const totalRounds = 4 - startingIndex; 
    const participantsCount = Math.pow(2, totalRounds); 

    const virtualMatches: any[] = [];
    let matchId = 1;
    const matchIdsByRound: number[][] = [];
    
    for (let r = 0; r < totalRounds; r++) {
      const roundMatchesCount = participantsCount / Math.pow(2, r + 1);
      matchIdsByRound[r] = [];
      for (let i = 0; i < roundMatchesCount; i++) {
        matchIdsByRound[r].push(matchId++);
      }
    }

    for (let r = 0; r < totalRounds; r++) {
      const fase = ORDEM_FASES[startingIndex + r];
      const roundMatchesCount = participantsCount / Math.pow(2, r + 1);
      
      const pFase = partidas.filter(p => p.fase === fase);
      const confrontos = isIdaEVolta 
        ? Array.from(new Set(pFase.map(p => p.confrontoId).filter(Boolean)))
        : pFase.filter(p => p.jogo === null).map(p => p.id); 
        
      for (let i = 0; i < roundMatchesCount; i++) {
        const id = matchIdsByRound[r][i];
        let nextMatchId = null;
        if (r < totalRounds - 1) {
          const nextIndex = Math.floor(i / 2);
          nextMatchId = matchIdsByRound[r + 1][nextIndex];
        }

        const refId = confrontos[i] || null;
        const realMatches = refId ? (isIdaEVolta 
          ? pFase.filter(p => p.confrontoId === refId)
          : pFase.filter(p => p.id === refId)) : [];

        virtualMatches.push({
          id,
          nextMatchId,
          tournamentRoundText: String(r + 1),
          startTime: '',
          state: 'SCHEDULED',
          participants: [],
          customData: {
            fase,
            realMatches,
            isIdaEVolta,
            onAbrir: abrirModal,
            isReadOnly,
            participantes
          }
        });
      }
    }

    return virtualMatches;
  }, [partidas, isIdaEVolta, isReadOnly, participantes]);

  const terceiroLugarPartidas = partidas.filter(p => p.fase === 'terceiro_lugar');
  const groupedTerceiroLugar = isIdaEVolta 
      ? Array.from(new Set(terceiroLugarPartidas.map(p => p.confrontoId).filter(Boolean)))
      : terceiroLugarPartidas.filter(p => p.jogo === null).map(p => p.id);
  
  const terceiroLugarMatches = groupedTerceiroLugar.map((refId, i) => {
     const realMatches = refId ? (isIdaEVolta 
          ? terceiroLugarPartidas.filter(p => p.confrontoId === refId)
          : terceiroLugarPartidas.filter(p => p.id === refId)) : [];
     return {
        id: '3rd-' + i,
        nextMatchId: null,
        tournamentRoundText: '',
        startTime: '',
        state: 'SCHEDULED',
        participants: [],
        customData: {
            fase: 'terceiro_lugar',
            realMatches,
            isIdaEVolta,
            onAbrir: abrirModal,
            isReadOnly,
            participantes
        }
     };
  });

  // ── Double Elimination: separar em Upper e Lower para a lib ──
  const doubleElimMatches = useMemo(() => {
    if (!isDoubleElim) return null;

    const upperPartidas = partidas.filter(p => p.bracket === 'UPPER' && p.fase !== 'grand_final' && p.fase !== 'bracket_reset');
    const lowerPartidas = partidas.filter(p => p.bracket === 'LOWER');

    // Converter para formato da lib
    const toLibMatch = (p: Partida, idx: number) => {
      const pA = participantes.find(pp => pp.id === p.participanteAId);
      const pB = participantes.find(pp => pp.id === p.participanteBId);
      const isTBD_A = p.participanteAId === 'TBD';
      const isTBD_B = p.participanteBId === 'TBD';

      return {
        id: idx + 1,
        nextMatchId: null,
        nextLooserMatchId: undefined,
        tournamentRoundText: String(p.rodada + 1),
        startTime: '',
        state: p.finalizada ? 'PLAYED' : 'SCHEDULED',
        participants: [],
        customData: {
          fase: p.fase,
          realMatches: [p],
          isIdaEVolta: false,
          onAbrir: abrirModal,
          isReadOnly,
          participantes,
        }
      };
    };

    const upper = upperPartidas.map((p, i) => toLibMatch(p, i));
    const lower = lowerPartidas.map((p, i) => toLibMatch(p, i + 1000));

    return { upper, lower };
  }, [partidas, isDoubleElim, isReadOnly, participantes]);

  // Grand Final e Bracket Reset (renderizadas como cards independentes)
  const grandFinalMatches = partidas.filter(p => p.fase === 'grand_final' || p.fase === 'bracket_reset');
  const grandFinalCards = grandFinalMatches.map((p, i) => ({
    id: 'gf-' + i,
    nextMatchId: null,
    tournamentRoundText: '',
    startTime: '',
    state: 'SCHEDULED',
    participants: [],
    customData: {
      fase: p.fase,
      realMatches: [p],
      isIdaEVolta: false,
      onAbrir: abrirModal,
      isReadOnly,
      participantes,
    }
  }));

  if (mataMataPartidas.length === 0) {
    return (
      <Flex h="200px" align="center" justify="center">
        <Text fontSize="12px">Nenhuma chave gerada.</Text>
      </Flex>
    );
  }

  if (isFinished) {
     return <TelaPodio partidas={partidas} participantes={participantes} />;
  }

  return (
    <>
      <Box overflowX="auto" pb={4} pt={10} minH="400px" h="fit-content">
         {isDoubleElim && doubleElimMatches ? (
           <>
             {/* Upper Bracket */}
             <Box mb={6}>
               <Text fontSize="12px" fontWeight="bold" color="blue.500" textTransform="uppercase" letterSpacing="wide" mb={2} px={4}>
                 ▲ UPPER BRACKET
               </Text>
               {doubleElimMatches.upper.length > 0 && (
                 <SingleEliminationBracket
                   matches={doubleElimMatches.upper}
                   matchComponent={CustomMatchComponent}
                   svgWrapper={({ children, ...props }: any) => (
                     <SVGViewer width={1000} height={400} {...props}>
                       {children}
                     </SVGViewer>
                   )}
                   options={{
                     style: {
                       connectorColor: '#93C5FD',
                       connectorColorHighlight: '#3B82F6',
                       boxHeight: 130,
                       width: 280
                     }
                   }}
                 />
               )}
             </Box>

             {/* Lower Bracket */}
             <Box mb={6}>
               <Text fontSize="12px" fontWeight="bold" color="purple.500" textTransform="uppercase" letterSpacing="wide" mb={2} px={4}>
                 ▼ LOWER BRACKET
               </Text>
               {doubleElimMatches.lower.length > 0 && (
                 <SingleEliminationBracket
                   matches={doubleElimMatches.lower}
                   matchComponent={CustomMatchComponent}
                   svgWrapper={({ children, ...props }: any) => (
                     <SVGViewer width={1000} height={400} {...props}>
                       {children}
                     </SVGViewer>
                   )}
                   options={{
                     style: {
                       connectorColor: '#C4B5FD',
                       connectorColorHighlight: '#8B5CF6',
                       boxHeight: 130,
                       width: 280
                     }
                   }}
                 />
               )}
             </Box>

             {/* Grand Final + Bracket Reset */}
             {grandFinalCards.length > 0 && (
               <Box mt={6} px={4} maxW="1000px">
                 <Text
                   fontSize="12px"
                   fontFamily="heading"
                   textTransform="uppercase"
                   letterSpacing="wide"
                   mb={3}
                   color="orange.500"
                   fontWeight="bold"
                 >
                   Grande Final
                 </Text>
                 <HStack spacing={6}>
                   {grandFinalCards.map(m => (
                     <CustomMatchComponent key={m.id} match={m} />
                   ))}
                 </HStack>
               </Box>
             )}
           </>
         ) : (
           /* Single Elimination (fluxo original) */
           bracketMatches.length > 0 && (
             <SingleEliminationBracket
                matches={bracketMatches}
                matchComponent={CustomMatchComponent}
                svgWrapper={({ children, ...props }: any) => (
                   <SVGViewer width={1000} height={500} {...props}>
                      {children}
                   </SVGViewer>
                )}
                options={{
                   style: {
                      connectorColor: '#cbd5e1',
                      connectorColorHighlight: '#cbd5e1',
                      boxHeight: 130,
                      width: 280
                   }
                }}
             />
           )
         )}
      </Box>

      {!isDoubleElim && terceiroLugarMatches.length > 0 && (
         <Box mt={6} px={4} maxW="1000px">
            <Text
               fontSize="12px"
               fontFamily="heading"
               textTransform="uppercase"
               letterSpacing="wide"
               mb={3}
               color={useColorModeValue('gray.700', 'gray.300')}
               fontWeight="extrabold"
            >
               Disputa de 3º Lugar
            </Text>
            <HStack spacing={6}>
               {terceiroLugarMatches.map(m => (
                  <CustomMatchComponent key={m.id} match={m} />
               ))}
            </HStack>
         </Box>
      )}

      {partidaSelecionada && (
        <ModalPlacar
          isOpen={isOpen}
          onClose={onClose}
          partida={partidaSelecionada}
          modo="matamata"
        />
      )}
    </>
  );
}
