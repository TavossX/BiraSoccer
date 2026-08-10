import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react';
import { SVGViewer, SingleEliminationBracket } from '@g-loot/react-tournament-brackets';
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
};

const ORDEM_FASES: FaseMataMata[] = ['oitavas', 'quartas', 'semifinal', 'final'];

// -- COMPONENTE CUSTOM MATCH PARA O BRACKET --
function CustomMatchComponent({ match }: any) {
  const { realMatches, isIdaEVolta, onAbrir, isReadOnly, participantes } = match.customData;
  const partidaBase = realMatches && realMatches.length > 0 ? realMatches[0] : null;
  const partidaVolta = isIdaEVolta && realMatches && realMatches.length > 1 ? realMatches[1] : null;

  const canClick = !isReadOnly && partidaBase && !partidaBase.finalizada && partidaBase.participanteBId !== 'BYE';

  // Se nao existe partidaBase, é um slot vazio (A DEFINIR)
  if (!partidaBase) {
    return (
      <Box
        borderRadius="lg"
        boxShadow="sm"
        bg="white"
        p={2}
        w="220px"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack spacing={2} align="stretch">
          <Flex justify="space-between" align="center" px={2} py={1}>
            <Text fontSize="12px" fontWeight="bold" color="gray.400">A Definir</Text>
            <Text fontSize="12px" color="gray.400">—</Text>
          </Flex>
          <Box h="1px" bg="gray.100" />
          <Flex justify="space-between" align="center" px={2} py={1}>
            <Text fontSize="12px" fontWeight="bold" color="gray.400">A Definir</Text>
            <Text fontSize="12px" color="gray.400">—</Text>
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
      bg="white"
      w="240px"
      border="1px solid"
      borderColor={canClick ? "gray.300" : "gray.200"}
      cursor={canClick ? "pointer" : "default"}
      onClick={() => canClick && onAbrir(partidaBase)}
      transition="all 0.1s"
      _hover={canClick ? { borderColor: "#F94A29", boxShadow: "lg" } : {}}
      overflow="hidden"
    >
      <Box bg="gray.50" px={2} py={1} borderBottom="1px solid" borderColor="gray.100" display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="10px" fontWeight="bold" color="gray.500" textTransform="uppercase">
          {FASES_LABEL[partidaBase.fase as FaseMataMata] ?? 'Fase'}
          {isIdaEVolta ? (partidaBase.finalizada && !partidaVolta?.finalizada ? ' (Volta pend.)' : '') : ''}
        </Text>
        {isFinalizada ? (
          <Badge fontSize="9px" border="1px solid" borderColor="gray.200">FIM</Badge>
        ) : !isReadOnly ? (
          <Badge color="#000" border="1px solid #C3c3c3" fontSize="9px">LANÇAR</Badge>
        ) : null}
      </Box>
      <VStack spacing={0} align="stretch">
        {/* Part A */}
        <Flex
          justify="space-between" align="center" px={3} py={2}
          bg={aVenceu ? "orange.50" : "transparent"}
        >
          <HStack spacing={2} overflow="hidden">
            {pA?.logoTime && <Image src={pA.logoTime} boxSize="20px" objectFit="contain" />}
            <VStack align="flex-start" spacing={0} overflow="hidden">
              <Text
                fontSize="13px"
                fontWeight={aVenceu ? "extrabold" : "medium"}
                color={aVenceu ? "#F94A29" : (bVenceu ? "gray.400" : "gray.700")}
                noOfLines={1}
              >
                {pA?.nomeAmigo ?? '?'}
              </Text>
              {pA?.timeSorteado && (
                <Text
                  fontSize="10px"
                  color={aVenceu ? "#F94A29" : (bVenceu ? "gray.300" : "gray.500")}
                  noOfLines={1}
                  opacity={0.9}
                >
                  {pA.timeSorteado}
                </Text>
              )}
            </VStack>
          </HStack>
          <Text
            fontSize="14px"
            fontWeight={aVenceu ? "extrabold" : "medium"}
            color={aVenceu ? "#F94A29" : (bVenceu ? "gray.400" : "gray.700")}
          >
            {partidaBase.placarA !== null ? golsA : '-'}
          </Text>
        </Flex>
        
        <Box h="1px" bg="gray.100" />

        {/* Part B */}
        <Flex
          justify="space-between" align="center" px={3} py={2}
          bg={bVenceu ? "orange.50" : "transparent"}
        >
          <HStack spacing={2} overflow="hidden">
            {pB?.logoTime && <Image src={pB.logoTime} boxSize="20px" objectFit="contain" />}
            <VStack align="flex-start" spacing={0} overflow="hidden">
              <Text
                fontSize="13px"
                fontWeight={bVenceu ? "extrabold" : "medium"}
                color={bVenceu ? "#F94A29" : (aVenceu ? "gray.400" : "gray.700")}
                noOfLines={1}
              >
                {isBye ? "BYE" : (pB?.nomeAmigo ?? '?')}
              </Text>
              {pB?.timeSorteado && !isBye && (
                <Text
                  fontSize="10px"
                  color={bVenceu ? "#F94A29" : (aVenceu ? "gray.300" : "gray.500")}
                  noOfLines={1}
                  opacity={0.9}
                >
                  {pB.timeSorteado}
                </Text>
              )}
            </VStack>
          </HStack>
          <Text
            fontSize="14px"
            fontWeight={bVenceu ? "extrabold" : "medium"}
            color={bVenceu ? "#F94A29" : (aVenceu ? "gray.400" : "gray.700")}
          >
            {isBye ? '-' : (partidaBase.placarB !== null ? golsB : '-')}
          </Text>
        </Flex>
      </VStack>
      {partidaFinal.penaltisA !== null && partidaFinal.penaltisB !== null && (
        <Box bg="gray.50" px={2} py={1} borderTop="1px solid" borderColor="gray.100" textAlign="center">
          <Text fontSize="10px" fontWeight="bold" color="gray.500">
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
  const finalMatch = partidas.filter(p => p.fase === 'final').sort((a,b)=>a.rodada - b.rodada).pop();
  const thirdMatch = partidas.filter(p => p.fase === 'terceiro_lugar').sort((a,b)=>a.rodada - b.rodada).pop();

  const vencedor1 = participantes.find(p => p.id === finalMatch?.vencedorId);
  const perdedor1 = participantes.find(p => p.id === finalMatch?.perdedorId); // 2o lugar
  const vencedor3 = participantes.find(p => p.id === thirdMatch?.vencedorId); // 3o lugar
  const perdedor3 = participantes.find(p => p.id === thirdMatch?.perdedorId); // 4o lugar

  const top4Ids = [vencedor1?.id, perdedor1?.id, vencedor3?.id, perdedor3?.id].filter(Boolean);
  const others = participantes.filter(p => !top4Ids.includes(p.id))
    .sort((a, b) => b.pontos - a.pontos || (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra));

  if(perdedor3) others.unshift(perdedor3);

  const PodiumCard = ({ p, position, height, bg, iconColor, title }: any) => (
    <VStack 
      w={{ base: "130px", md: "170px" }} 
      bg="white" 
      border="1px solid" 
      borderColor="gray.200" 
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
        <Text fontSize="sm" fontWeight="extrabold" textAlign="center" noOfLines={1} color={position === 1 ? "#F94A29" : "gray.700"}>
          {p?.nomeAmigo ?? '???'}
        </Text>
        <HStack spacing={1}>
           {p?.logoTime && <Image src={p.logoTime} boxSize="12px" />}
           <Text fontSize="xs" color="gray.500" noOfLines={1}>{p?.timeSorteado}</Text>
        </HStack>
      </VStack>
      <HStack>
         <Badge colorScheme="green" fontSize="9px">{p?.vitorias || 0}V</Badge>
         <Badge colorScheme="blue" fontSize="9px">{p?.golsPro || 0}GP</Badge>
      </HStack>
      <Text fontSize="xs" fontWeight="bold" color="gray.400">{title}</Text>
    </VStack>
  );

  return (
    <Box pt={10} pb={20}>
      <VStack spacing={2} mb={10}>
         <Text fontSize="2xl" fontWeight="extrabold" color="#F94A29">TORNEIO ENCERRADO</Text>
         <Text color="gray.500">Confira a classificação final</Text>
      </VStack>

      <Flex align="flex-end" justify="center" gap={{ base: 2, md: 6 }} minH="320px" mb={12}>
        <PodiumCard p={vencedor3} position={3} height="250px" bg="#CD7F32" iconColor="white" title="3º LUGAR" />
        <PodiumCard p={vencedor1} position={1} height="270px" bg="#FDBB00" iconColor="white" title="CAMPEÃO" />
        <PodiumCard p={perdedor1} position={2} height="265px" bg="#C0C0C0" iconColor="white" title="VICE" />
      </Flex>

      {others.length > 0 && (
         <Box maxW="600px" mx="auto" bg="white" borderRadius="lg" p={5} boxShadow="sm" border="1px solid" borderColor="gray.200">
            <Text fontWeight="bold" mb={4} color="gray.600">Outras Colocações</Text>
            <VStack spacing={3} align="stretch">
               {others.map((p, i) => (
                  <Flex key={p.id} justify="space-between" align="center" py={2} borderBottom="1px solid" borderColor="gray.100">
                     <HStack spacing={3}>
                        <Text fontWeight="bold" color="gray.400" w="24px">{i + 4}º</Text>
                        <HStack>
                           {p?.logoTime && <Image src={p.logoTime} boxSize="16px" />}
                           <Text fontWeight="medium">{p?.nomeAmigo}</Text>
                           <Text fontSize="xs" color="gray.400">({p?.timeSorteado})</Text>
                        </HStack>
                     </HStack>
                     <HStack>
                        <Badge colorScheme="gray">{p?.vitorias || 0} V</Badge>
                        <Badge colorScheme="gray">{p?.golsPro || 0} GP</Badge>
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
  const hasFinal = mataMataPartidas.some(p => p.fase === 'final');
  // terceiro lugar pode n existir se for so 2 times, entao assumimos true se nao existir, ou false se existir e nao tiver finalizada
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
         {bracketMatches.length > 0 && (
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
         )}
      </Box>

      {terceiroLugarMatches.length > 0 && (
         <Box mt={6} px={4} maxW="1000px">
            <Text
               fontSize="12px"
               fontFamily="heading"
               textTransform="uppercase"
               letterSpacing="wide"
               mb={3}
               color="gray.500"
               fontWeight="bold"
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
