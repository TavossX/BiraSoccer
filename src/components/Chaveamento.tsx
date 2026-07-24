import {
  Badge,
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  useDisclosure,
  Image,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTorneioStore } from '../store/torneioStore';
import type { FaseMataMata, Partida } from '../types/torneio';
import { ModalPlacar } from './ModalPlacar';

// ─── Constantes ─────────────────────────────────────────────────────────────
const FASES_LABEL: Record<FaseMataMata, string> = {
  oitavas:        'Oitavas',
  quartas:        'Quartas',
  semifinal:      'Semifinal',
  final:          'Final',
  terceiro_lugar: '3º Lugar',
};

const ORDEM_FASES: FaseMataMata[] = ['oitavas', 'quartas', 'semifinal', 'final'];

// ─── Card de partida ──────────────────────────────────────────────────────────
function CardPartida({
  partida,
  onAbrir,
  isReadOnly,
}: {
  partida: Partida;
  onAbrir: (partida: Partida) => void;
  isReadOnly?: boolean;
}) {
  const { participantes } = useTorneioStore();

  const pA    = participantes.find((p) => p.id === partida.participanteAId);
  const pB    = participantes.find((p) => p.id === partida.participanteBId);
  const isBye = partida.participanteBId === 'BYE';
  const aVenceu = partida.vencedorId === partida.participanteAId;
  const bVenceu = partida.vencedorId === partida.participanteBId;

  const canClick = !isReadOnly && !partida.finalizada && !isBye;

  return (
    <Box
      
      borderColor={partida.finalizada ? 'brand.cardBgAlt' : 'brand.mustard'}
      
      boxShadow={canClick ? '4px 4px 0 #000' : '2px 2px 0 #000'}
      p={0}
      overflow="hidden"
      cursor={canClick ? 'pointer' : 'default'}
      onClick={() => canClick && onAbrir(partida)}
      transition="all 0.08s ease"
      _hover={canClick ? {
        borderColor: 'brand.orange',
        transform: 'translate(-2px,-2px)',
        boxShadow: '6px 6px 0 #000',
      } : {}}
      minW="180px"
      w="full"
    >
      {/* Rótulo topo */}
      <Flex
        bg={partida.finalizada ? 'brand.cardBgAlt' : 'brand.red'}
        borderBottom="2px solid"
        
        px={3} py={1}
        justify="space-between"
        align="center"
      >
        <Text fontSize="8px"  fontWeight={700} textTransform="uppercase" fontFamily="body">
          {partida.jogo === 'ida' ? 'Jogo de Ida' : partida.jogo === 'volta' ? 'Jogo de Volta' : 'Jogo Único'}
        </Text>
        {partida.finalizada ? (
          <Badge   border="1px solid"  fontSize="7px">FIM</Badge>
        ) : !isReadOnly ? (
          <Badge  color="#000" border="1px solid #000" fontSize="7px">LANÇAR</Badge>
        ) : null}
      </Flex>

      {/* Participante A */}
      <Flex
        px={3} py={2}
        justify="space-between"
        align="center"
        bg={aVenceu ? 'rgba(253,187,0,0.12)' : 'transparent'}
        borderBottom="1px solid"
        
      >
        <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
          <Text
            fontFamily="heading"
            fontSize={{ base: '13px', md: '14px' }}
            fontWeight={aVenceu ? 700 : 500}
            opacity={bVenceu ? 0.35 : 1}
            color={aVenceu ? 'brand.mustard' : 'brand.textMain'}
            noOfLines={1}
          >
            {pA?.nomeAmigo ?? '?'}
          </Text>
          <HStack spacing={1}>
            {pA?.logoTime && <Image src={pA.logoTime} boxSize="10px" objectFit="contain" opacity={bVenceu ? 0.35 : 1} />}
            <Text fontSize="7px" >{pA?.timeSorteado ?? '—'}</Text>
          </HStack>
        </VStack>
        <Text
          fontFamily="heading"
          fontWeight={900}
          fontSize={{ base: '20px', md: '22px' }}
          opacity={bVenceu ? 0.35 : 1}
          color={aVenceu ? 'brand.mustard' : 'brand.textMain'}
          minW="28px"
          textAlign="right"
        >
          {partida.placarA ?? '—'}
        </Text>
      </Flex>

      {/* Participante B */}
      <Flex
        px={3} py={2}
        justify="space-between"
        align="center"
        bg={bVenceu ? 'rgba(253,187,0,0.12)' : 'transparent'}
      >
        <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
          <Text
            fontFamily="heading"
            fontSize={{ base: '13px', md: '14px' }}
            fontWeight={bVenceu ? 700 : 500}
            opacity={aVenceu ? 0.35 : 1}
            color={bVenceu ? 'brand.mustard' : 'brand.textMain'}
            noOfLines={1}
          >
            {isBye ? 'BYE (Avanço automático)' : (pB?.nomeAmigo ?? '?')}
          </Text>
          <HStack spacing={1}>
            {pB?.logoTime && <Image src={pB.logoTime} boxSize="10px" objectFit="contain" opacity={aVenceu ? 0.35 : 1} />}
            <Text fontSize="7px" >{pB?.timeSorteado ?? '—'}</Text>
          </HStack>
        </VStack>
        <Text
          fontFamily="heading"
          fontWeight={900}
          fontSize={{ base: '20px', md: '22px' }}
          opacity={aVenceu ? 0.35 : 1}
          color={bVenceu ? 'brand.mustard' : 'brand.textMain'}
          minW="28px"
          textAlign="right"
        >
          {isBye ? '—' : (partida.placarB ?? '—')}
        </Text>
      </Flex>

      {/* Pênaltis */}
      {partida.penaltisA !== null && partida.penaltisB !== null && (
        <Flex  px={3} py={1} justify="center" align="center" gap={2} borderTop="2px solid" >
          <Text fontSize="9px"  fontWeight={700}>
            PEN: {partida.penaltisA} × {partida.penaltisB}
          </Text>
        </Flex>
      )}
    </Box>
  );
}

// ─── Bloco de confronto (ida + volta) ────────────────────────────────────────
function BlocoConfronto({
  confrontoId,
  partidas,
  onAbrir,
  isReadOnly,
}: {
  confrontoId: string;
  partidas: Partida[];
  onAbrir: (partida: Partida) => void;
  isReadOnly?: boolean;
}) {
  const { participantes } = useTorneioStore();
  const jogos = partidas.filter((p) => p.confrontoId === confrontoId)
    .sort((a) => (a.jogo === 'ida' ? -1 : 1));

  if (jogos.length === 0) return null;

  const ida   = jogos.find((j) => j.jogo === 'ida');
  const volta = jogos.find((j) => j.jogo === 'volta');
  const vencedorId = volta?.vencedorId ?? ida?.vencedorId;
  const vencedor   = participantes.find((p) => p.id === vencedorId);

  const golsA_total = (ida?.placarA ?? 0) + (volta?.placarB ?? 0);
  const golsB_total = (ida?.placarB ?? 0) + (volta?.placarA ?? 0);
  const idaFinalizada  = ida?.finalizada;
  const voltaFinalizada = volta?.finalizada;

  return (
    <Box
      
      
      borderColor={vencedorId ? 'brand.mustard' : 'brand.cardBgAlt'}
      boxShadow="md"
      overflow="hidden"
      minW={{ base: '100%', md: '200px' }}
      maxW={{ base: '100%', md: '220px' }}
    >
      {/* Header do confronto */}
      <Flex
        
        borderBottom="2px solid"
        
        px={3} py={2}
        justify="space-between"
        align="center"
      >
        <Text fontSize="8px"  fontWeight={700} textTransform="uppercase">CONFRONTO</Text>
        {idaFinalizada && voltaFinalizada && (
          <Text fontSize="8px" >
            Agr: {golsA_total}×{golsB_total}
          </Text>
        )}
      </Flex>

      <VStack spacing={2} p={2}>
        {jogos.map((jogo) => (
          <CardPartida key={jogo.id} partida={jogo} onAbrir={onAbrir} isReadOnly={isReadOnly} />
        ))}
      </VStack>

      {/* Vencedor */}
      {vencedor && (
        <Flex
          bg="linear-gradient(90deg, #F94A29, #C80000)"
          px={3} py={2}
          align="center"
          gap={2}
          borderTop="2px solid"
          
        >
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="9px"  fontWeight={700} textTransform="uppercase">
              ▶ {vencedor.nomeAmigo} avança
            </Text>
            <HStack spacing={1}>
              {vencedor.logoTime && <Image src={vencedor.logoTime} boxSize="10px" objectFit="contain" />}
              <Text fontSize="7px"  opacity={0.8}>{vencedor.timeSorteado}</Text>
            </HStack>
          </VStack>
        </Flex>
      )}
    </Box>
  );
}

// ─── Bloco jogo único ────────────────────────────────────────────────────────
function BlocoJogoUnico({ partida, onAbrir, isReadOnly }: { partida: Partida; onAbrir: (p: Partida) => void; isReadOnly?: boolean }) {
  const { participantes } = useTorneioStore();
  const vencedor = participantes.find((p) => p.id === partida.vencedorId);

  return (
    <Box
      
      
      borderColor={partida.vencedorId ? 'brand.mustard' : 'brand.cardBgAlt'}
      boxShadow="md"
      overflow="hidden"
      minW={{ base: '100%', md: '200px' }}
      maxW={{ base: '100%', md: '220px' }}
    >
      <CardPartida partida={partida} onAbrir={onAbrir} isReadOnly={isReadOnly} />
      {vencedor && (
        <Flex
          bg="linear-gradient(90deg, #F94A29, #C80000)"
          px={3} py={2}
          align="center"
          gap={2}
          borderTop="2px solid"
          
        >
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="9px"  fontWeight={700} textTransform="uppercase">
              ▶ {vencedor.nomeAmigo} avança
            </Text>
            <HStack spacing={1}>
              {vencedor.logoTime && <Image src={vencedor.logoTime} boxSize="10px" objectFit="contain" />}
              <Text fontSize="7px"  opacity={0.8}>{vencedor.timeSorteado}</Text>
            </HStack>
          </VStack>
        </Flex>
      )}
    </Box>
  );
}

// ─── Bloco 3º lugar ──────────────────────────────────────────────────────────
function BlocoJogo3oLugar({ partida, onAbrir, isReadOnly }: { partida: Partida; onAbrir: (p: Partida) => void; isReadOnly?: boolean }) {
  const { participantes } = useTorneioStore();
  const pA      = participantes.find((p) => p.id === partida.participanteAId);
  const pB      = participantes.find((p) => p.id === partida.participanteBId);
  const vencedor = participantes.find((p) => p.id === partida.vencedorId);

  return (
    <Box
      
      
      boxShadow="md"
      overflow="hidden"
      maxW="300px"
      
    >
      {/* Header */}
      <Flex
        
        px={3} py={2}
        borderBottom="2px solid"
        
        align="center"
        justify="space-between"
      >
        <Text fontSize="8px"  fontWeight={700} textTransform="uppercase">DISPUTA DE 3º LUGAR</Text>
        {partida.finalizada
          ? <Badge   fontSize="7px" border="1px solid" >FIM</Badge>
          : !isReadOnly ? <Badge  color="#000" border="1px solid #000" fontSize="7px">LANÇAR</Badge> : null
        }
      </Flex>

      {/* Jogador A */}
      <Flex px={3} py={2} justify="space-between" align="center"
        bg={partida.vencedorId === partida.participanteAId ? 'rgba(253,187,0,0.1)' : 'transparent'}
        borderBottom="1px solid" 
      >
        <VStack align="flex-start" spacing={0}>
          <Text fontFamily="heading" fontWeight={700} fontSize="14px" >{pA?.nomeAmigo ?? '?'}</Text>
          <HStack spacing={1}>
            {pA?.logoTime && <Image src={pA.logoTime} boxSize="10px" objectFit="contain" />}
            <Text fontSize="7px" >{pA?.timeSorteado ?? '—'}</Text>
          </HStack>
        </VStack>
        <Text fontFamily="heading" fontWeight={900} fontSize="22px" >{partida.placarA ?? '—'}</Text>
      </Flex>

      {/* Jogador B */}
      <Flex px={3} py={2} justify="space-between" align="center"
        bg={partida.vencedorId === partida.participanteBId ? 'rgba(253,187,0,0.1)' : 'transparent'}
      >
        <VStack align="flex-start" spacing={0}>
          <Text fontFamily="heading" fontWeight={700} fontSize="14px" >{pB?.nomeAmigo ?? '?'}</Text>
          <HStack spacing={1}>
            {pB?.logoTime && <Image src={pB.logoTime} boxSize="10px" objectFit="contain" />}
            <Text fontSize="7px" >{pB?.timeSorteado ?? '—'}</Text>
          </HStack>
        </VStack>
        <Text fontFamily="heading" fontWeight={900} fontSize="22px" >{partida.placarB ?? '—'}</Text>
      </Flex>

      {/* Vencedor */}
      {vencedor && (
        <Flex
          
          borderTop="2px solid"
          
          px={3} py={2}
        >
          <Text fontSize="9px" fontFamily="heading" >
            🥉 {vencedor.nomeAmigo} — 3º Lugar
          </Text>
        </Flex>
      )}

      {/* Botão registrar */}
      {!isReadOnly && !partida.finalizada && (
        <Box px={3} pb={3} pt={1}>
          <Badge
            cursor="pointer"
            
            color="#000"
            border="2px solid #000"
            boxShadow="md"
            w="full"
            textAlign="center"
            py={2}
            fontSize="9px"
            onClick={() => !partida.finalizada && onAbrir(partida)}
            _hover={{ bg: 'brand.orange', color: 'white' }}
          >
            ▶ REGISTRAR PLACAR
          </Badge>
        </Box>
      )}
    </Box>
  );
}

// ─── Chaveamento principal ────────────────────────────────────────────────────
export function Chaveamento({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const { partidas } = useTorneioStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);

  const abrirModal = (partida: Partida) => {
    setPartidaSelecionada(partida);
    onOpen();
  };

  const fasesPresentesSet = new Set(partidas.map((p) => p.fase).filter(Boolean));
  const fasesPresentes = ORDEM_FASES.filter((f) => fasesPresentesSet.has(f));
  const partidasTerceiroLugar = partidas.filter((p) => p.fase === 'terceiro_lugar');

  function confrontosDaFase(fase: FaseMataMata) {
    const confrontosSet = new Set<string>();
    partidas.filter((p) => p.fase === fase && p.confrontoId).forEach((p) => {
      confrontosSet.add(p.confrontoId!);
    });
    return Array.from(confrontosSet);
  }

  function jogoUnicoDaFase(fase: FaseMataMata): Partida[] {
    return partidas.filter((p) => p.fase === fase && p.jogo === null && !p.confrontoId);
  }

  if (fasesPresentes.length === 0 && partidasTerceiroLugar.length === 0) {
    return (
      <Flex h="200px" align="center" justify="center">
        <Text fontSize="9px" >Nenhuma chave gerada.</Text>
      </Flex>
    );
  }

  const fasesAntesFinal = fasesPresentes.filter((f) => f !== 'final' && f !== 'terceiro_lugar');
  const hasFinal = fasesPresentes.includes('final');

  const getBlocosFase = (fase: FaseMataMata) => [
    ...confrontosDaFase(fase).map((cId) => (
      <BlocoConfronto key={cId} confrontoId={cId} partidas={partidas} onAbrir={abrirModal} isReadOnly={isReadOnly} />
    )),
    ...jogoUnicoDaFase(fase).map((p) => (
      <BlocoJogoUnico key={p.id} partida={p} onAbrir={abrirModal} isReadOnly={isReadOnly} />
    )),
  ];

  const columns: {
    fase: FaseMataMata;
    blocos: any[];
    direction: 'left-to-right' | 'right-to-left' | 'center';
    isLast: boolean;
  }[] = [];

  fasesAntesFinal.forEach((fase, idx) => {
    const blocos = getBlocosFase(fase);
    const metade = Math.ceil(blocos.length / 2);
    columns.push({
      fase,
      blocos: blocos.slice(0, metade),
      direction: 'left-to-right',
      isLast: idx === fasesAntesFinal.length - 1 && !hasFinal,
    });
  });

  if (hasFinal) {
    columns.push({
      fase: 'final',
      blocos: getBlocosFase('final'),
      direction: 'center',
      isLast: true,
    });
  }

  [...fasesAntesFinal].reverse().forEach((fase, idx) => {
    const blocos = getBlocosFase(fase);
    const metade = Math.ceil(blocos.length / 2);
    columns.push({
      fase,
      blocos: blocos.slice(metade),
      direction: 'right-to-left',
      isLast: idx === 0 && !hasFinal,
    });
  });

  return (
    <>
      {/* Bracket */}
      <Box overflowX="auto" pb={4} pt={10}>
        <HStack spacing="40px" align="stretch" h="full" minH="300px">
          {columns.map((col, colIdx) => {
            const pairs = [];
            for (let i = 0; i < col.blocos.length; i += 2) {
              pairs.push(col.blocos.slice(i, i + 2));
            }

            return (
              <Flex
                key={`${col.fase}-${col.direction}-${colIdx}`}
                direction="column"
                justify="space-around"
                align="center"
                position="relative"
                minW="240px"
              >
                {/* Label da fase */}
                <Box position="absolute" top="-40px" w="full" textAlign="center">
                  <Badge
                    
                    
                    
                    
                    boxShadow="md"
                    px={4} py={1}
                    fontSize="9px"
                    fontWeight={700}
                    textTransform="uppercase"
                    fontFamily="heading"
                    letterSpacing="wide"
                  >
                    {FASES_LABEL[col.fase]}{' '}
                    {col.direction === 'right-to-left' ? '(B)' : col.direction === 'left-to-right' ? '(A)' : ''}
                  </Badge>
                </Box>

                <Flex direction="column" justify="space-around" flex={1} w="full">
                  {pairs.map((pair, idx) => (
                    <Flex key={idx} direction="column" justify="space-around" flex={1} position="relative">
                      {pair.map((bloco: any, bIdx: number) => (
                        <Flex key={bIdx} align="center" justify="center" position="relative" zIndex={2} my={4}>
                          {bloco}
                        </Flex>
                      ))}

                      {/* Conector C-shape — linha mustarda 2px */}
                      {!col.isLast && col.direction !== 'center' && pair.length === 2 && (
                        <Box
                          position="absolute"
                          top="25%" bottom="25%"
                          {...(col.direction === 'left-to-right'
                            ? { right: '-20px', borderRightWidth: '2px' }
                            : { left: '-20px', borderLeftWidth: '2px' })}
                          borderTopWidth="2px"
                          borderBottomWidth="2px"
                          
                          borderStyle="solid"
                          w="20px"
                          zIndex={1}
                        />
                      )}

                      {/* Linha horizontal para próxima fase */}
                      {!col.isLast && col.direction !== 'center' && pair.length === 2 && (
                        <Box
                          position="absolute"
                          top="50%"
                          {...(col.direction === 'left-to-right' ? { right: '-40px' } : { left: '-40px' })}
                          w="20px"
                          h="2px"
                          
                          zIndex={1}
                        />
                      )}

                      {/* Linha reta se só 1 item */}
                      {!col.isLast && col.direction !== 'center' && pair.length === 1 && (
                        <Box
                          position="absolute"
                          top="50%"
                          {...(col.direction === 'left-to-right' ? { right: '-40px' } : { left: '-40px' })}
                          w="40px"
                          h="2px"
                          
                          zIndex={1}
                        />
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            );
          })}
        </HStack>
      </Box>

      {/* 3º Lugar */}
      {partidasTerceiroLugar.length > 0 && (
        <Box mt={6}>
          <Box h="2px"  mb={5} />
          <Text
            fontSize="9px"
            fontFamily="heading"
            
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
          >
            CONSOLAÇÃO
          </Text>
          <HStack spacing={4} flexWrap="wrap">
            {partidasTerceiroLugar.map((p) => (
              <BlocoJogo3oLugar key={p.id} partida={p} onAbrir={abrirModal} isReadOnly={isReadOnly} />
            ))}
          </HStack>
        </Box>
      )}

      {/* Modal de placar */}
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
