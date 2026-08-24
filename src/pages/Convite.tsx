import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LogoBola from '../assets/logos/LogoBola.png';
import { Chaveamento } from '../components/Chaveamento';
import { TabelaClassificacao } from '../components/TabelaClassificacao';
import { DraftLobby } from '../components/DraftLobby';
import { supabase } from '../lib/supabase';
import { useTorneioStore } from '../store/torneioStore';
import { FiRefreshCw as RefreshIcon } from 'react-icons/fi';

export function Convite() {
  const { campeonatoId } = useParams<{ campeonatoId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { torneio, participantes, carregarTorneioPublico } = useTorneioStore();
  const partidas = useTorneioStore((s) => s.partidas);

  const [status, setStatus] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [atualizando, setAtualizando] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('white', 'gray.900');

  // Progresso calculado reativamente
  const totalFinalizados = partidas.filter((p) => p.finalizada).length;
  const totalPartidas    = partidas.length;
  const progresso        = totalPartidas > 0 ? Math.round((totalFinalizados / totalPartidas) * 100) : 0;

  // Carrega o torneio pelo ID da URL
  const carregar = async (showToast = false, isAutoRefresh = false) => {
    if (!campeonatoId) { setStatus('erro'); return; }
    
    if (showToast) setAtualizando(true);
    else if (!isAutoRefresh) setStatus('carregando');

    const result = await carregarTorneioPublico(campeonatoId);

    if (result) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && result.user_id === user.id) {
        setIsReadOnly(false);
      } else {
        setIsReadOnly(true);
      }
    }

    if (showToast) {
      setAtualizando(false);
      toast({
        title: result ? 'Dados atualizados!' : 'Erro ao atualizar',
        status: result ? 'success' : 'error',
        duration: 2000,
        position: 'top',
        isClosable: true,
      });
    } else if (!isAutoRefresh) {
      setStatus(result ? 'ok' : 'erro');
    }
  };

  useEffect(() => {
    carregar();
    
    // Auto-refresh a cada 10 segundos
    const interval = setInterval(() => {
      carregar(false, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [campeonatoId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'carregando') {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column" gap={4}>
        <Spinner size="xl" color="brand.500" thickness="4px" speed="0.8s" />
        <Text fontSize="12px" color={textSecondary}>CARREGANDO TORNEIO...</Text>
      </Flex>
    );
  }

  // ── Erro ───────────────────────────────────────────────────────────────────
  if (status === 'erro' || !torneio) {
    return (
      <Flex minH="100vh" align="center" justify="center" px={4}>
        <Box
          maxW="400px" w="full" 
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="lg"
          boxShadow="sm"
          p={8} textAlign="center"
        >
          <Heading fontFamily="heading" fontSize="20px" color={textPrimary} mb={3}>Torneio não encontrado</Heading>
          <Text fontSize="12px" color={textSecondary} mb={6} lineHeight="1.8">
            Este link pode estar incorreto ou o torneio ainda não foi publicado.
          </Text>
          <VStack spacing={3}>
            <Button w="full" onClick={() => carregar()} colorScheme="brand" size="md">
              TENTAR NOVAMENTE
            </Button>
            <Button w="full" variant="outline" size="sm"
              onClick={() => navigate('/torneio/configurar')}>
              CRIAR MEU TORNEIO
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  // ── Se o torneio estiver aguardando draft, renderiza a sala de draft em tempo real ─
  if (torneio.status === 'aguardando_draft') {
    return <DraftLobby torneioId={campeonatoId || torneio.id} isReadOnly={false} />;
  }

  // ── Torneio carregado ─────────────────────────────────────────────────────

  return (
    <Box minH="100vh">
      {/* Header */}
      <Box
        bg={headerBg}
        boxShadow="md"
        borderBottom="1px solid"
        borderColor={cardBorder}
        position="sticky" top={0} zIndex={100}
      >
        <Flex
          maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="EAFC26 Cup" h="32px" />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '15px', md: '19px' }} color={textPrimary} lineHeight="1.1">{torneio.nome}</Heading>
              <HStack spacing={2}>
                <Badge
                  colorScheme="orange"
                  variant="subtle"
                  fontSize="10px" px={2}
                >
                  {torneio.formato === 'liga' ? 'LIGA' : torneio.formato === 'liga_com_playoffs' ? 'LIGA + PLAYOFFS' : 'MATA-MATA'}
                </Badge>
                {isReadOnly && (
                  <Badge colorScheme="purple" variant="outline" fontSize="10px" px={2}>
                    SOMENTE LEITURA
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm" variant="outline"
              onClick={() => navigate('/')}
              fontSize="12px"
            >
              ← DASHBOARD
            </Button>
            <Button
              id="btn-atualizar"
              leftIcon={<RefreshIcon /> as any}
              size="sm"
              variant="solid"
              colorScheme="orange"
              isLoading={atualizando}
              loadingText="ATUALIZANDO..."
              onClick={() => carregar(true)}
              fontSize="12px"
            >
              ATUALIZAR
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Conteúdo */}
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} position="relative">
        {/* Barra de progresso */}
        <Box mb={6}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="12px" fontWeight={600} color={textSecondary}>
              PROGRESSO DO TORNEIO
            </Text>
            <Text fontSize="12px" fontWeight={700} color={textPrimary}>
              {totalFinalizados}/{totalPartidas} ({progresso}%)
            </Text>
          </HStack>
          <Box w="full" h="8px" bg={useColorModeValue('gray.200', 'gray.700')} borderRadius="full" overflow="hidden">
            <Box
              h="full"
              w={`${progresso}%`}
              bg="linear-gradient(90deg,#F94A29,#FDBB00)"
              transition="width 0.6s ease"
            />
          </Box>
        </Box>

        {/* Participantes */}
        <Box
          mb={6} 
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="lg"
          boxShadow="sm"
          p={4}
        >
          <Text fontSize="12px" fontWeight={700} color={textSecondary}
            textTransform="uppercase" letterSpacing="wide" mb={3}>
            {participantes.length} PARTICIPANTES
          </Text>
          <Flex flexWrap="wrap" gap={2}>
            {participantes.map((p) => (
              <HStack
                key={p.id}
                bg={useColorModeValue('gray.50', 'gray.750')}
                border="1px solid" 
                borderColor={cardBorder}
                borderRadius="md"
                px={3} py={1}
                spacing={2}
              >
                <Text fontFamily="heading" fontSize="12px" fontWeight={600} color={textPrimary}>{p.nomeAmigo}</Text>
                <Badge bg="transparent" border="1px solid" borderColor={cardBorder} color={textSecondary} fontSize="10px" px={2}>
                  {p.timeSorteado}
                </Badge>
              </HStack>
            ))}
          </Flex>
        </Box>

        <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" mb={6} />

        {/* Conteúdo principal: tabela ou chaveamento */}
        {torneio.formato === 'liga' ? (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={5}>Classificação</Heading>
            <TabelaClassificacao />
          </Box>
        ) : torneio.formato === 'liga_com_playoffs' ? (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={5}>Classificação</Heading>
            <TabelaClassificacao />

            {torneio.playoffsGerados && (
              <Box mt={10}>
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={4}>Playoffs</Heading>
                <Chaveamento isReadOnly={isReadOnly} />
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={2}>Chaveamento</Heading>
            <Text fontSize="12px" color={textSecondary} mb={5}>
              Acompanhe os confrontos e veja quem avança de fase.
            </Text>
            <Chaveamento isReadOnly={isReadOnly} />
          </Box>
        )}

        {/* ── Rodadas (lista de partidas) ─────────────────────────────── */}
        {(torneio.formato === 'liga' || torneio.formato === 'liga_com_playoffs') && (() => {
          const partidasLiga = partidas.filter((p) => p.fase === null);
          const rodasUnicas  = Array.from(new Set(partidasLiga.map((p) => p.rodada))).sort((a, b) => a - b);

          if (partidasLiga.length === 0) return null;

          return (
            <Box mt={8}>
              <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" mb={6} />
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={4}>
                Rodadas
              </Heading>

              <Accordion allowMultiple defaultIndex={[0]}>
                {rodasUnicas.map((rodada) => {
                  const jogosRodada      = partidasLiga.filter((p) => p.rodada === rodada);
                  const finalizadosRodada = jogosRodada.filter((p) => p.finalizada).length;
                  const rodadaCompleta   = finalizadosRodada === jogosRodada.length;
                  const isVolta          = torneio.idaEVolta && rodada > rodasUnicas.length / 2;

                  return (
                    <AccordionItem
                      key={rodada}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="lg"
                      mb={3}
                      overflow="hidden"
                      boxShadow="sm"
                    >
                      <AccordionButton
                        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                        _expanded={{ bg: useColorModeValue('gray.50', 'gray.750'), borderBottomWidth: '1px', borderColor: cardBorder }}
                        py={3} px={4}
                      >
                        <HStack flex={1} spacing={3}>
                          <Text fontFamily="heading" fontSize={{ base: '14px', md: '16px' }} fontWeight="extrabold" color={textPrimary}>
                            RODADA {rodada}
                          </Text>
                          <Badge
                            colorScheme="blue"
                            variant="subtle"
                            fontSize="10px"
                            borderRadius="md"
                            px={2}
                          >
                            {torneio.idaEVolta ? (isVolta ? 'VOLTA' : 'IDA') : `RD${rodada}`}
                          </Badge>
                          <Badge
                            colorScheme={rodadaCompleta ? "green" : "orange"}
                            variant="solid"
                            fontSize="10px"
                            borderRadius="md"
                            px={2}
                          >
                            {finalizadosRodada}/{jogosRodada.length}
                          </Badge>
                        </HStack>
                        <AccordionIcon />
                      </AccordionButton>

                      <AccordionPanel p={4}>
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
                          {jogosRodada.map((jogo) => {
                            const pA = participantes.find((p) => p.id === jogo.participanteAId);
                            const pB = participantes.find((p) => p.id === jogo.participanteBId);
                            const aVenceu = jogo.vencedorId === jogo.participanteAId;
                            const bVenceu = jogo.vencedorId === jogo.participanteBId;

                            return (
                              <Box
                                key={jogo.id}
                                bg={cardBg}
                                border="1px solid"
                                borderColor={cardBorder}
                                boxShadow="sm"
                                borderRadius="md"
                                overflow="hidden"
                              >
                                {/* Player A */}
                                <Flex px={3} py={2} justify="space-between" align="center"
                                  bg={aVenceu ? useColorModeValue('orange.50', 'rgba(249,74,41,0.15)') : 'transparent'}
                                  borderBottom="1px solid"
                                  borderColor={cardBorder}
                                >
                                  <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                                    <Text
                                      fontFamily="heading"
                                      fontWeight={aVenceu ? 900 : (bVenceu ? 500 : 700)}
                                      fontSize={{ base: '13px', md: '14px' }}
                                      color={aVenceu ? '#F94A29' : textPrimary}
                                      noOfLines={1}
                                    >
                                      {pA?.nomeAmigo ?? '?'}
                                    </Text>
                                    <HStack spacing={1}>
                                      {pA?.logoTime && <Image src={pA.logoTime} boxSize="12px" objectFit="contain" opacity={bVenceu ? 0.4 : 1} />}
                                      <Text fontSize="xs" fontWeight={500} color={aVenceu ? 'brand.600' : textSecondary} noOfLines={1}>
                                        {pA?.timeSorteado ?? '—'}
                                      </Text>
                                    </HStack>
                                  </VStack>
                                  <Text
                                    fontFamily="heading"
                                    fontWeight={aVenceu ? 900 : (bVenceu ? 500 : 700)}
                                    fontSize={{ base: '20px', md: '22px' }}
                                    color={aVenceu ? '#F94A29' : textPrimary}
                                  >
                                    {jogo.placarA ?? '—'}
                                  </Text>
                                </Flex>

                                {/* Player B */}
                                <Flex px={3} py={2} justify="space-between" align="center"
                                  bg={bVenceu ? useColorModeValue('orange.50', 'rgba(249,74,41,0.15)') : 'transparent'}
                                >
                                  <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                                    <Text
                                      fontFamily="heading"
                                      fontWeight={bVenceu ? 900 : (aVenceu ? 500 : 700)}
                                      fontSize={{ base: '13px', md: '14px' }}
                                      color={bVenceu ? '#F94A29' : textPrimary}
                                      noOfLines={1}
                                    >
                                      {pB?.nomeAmigo ?? '?'}
                                    </Text>
                                    <HStack spacing={1}>
                                      {pB?.logoTime && <Image src={pB.logoTime} boxSize="12px" objectFit="contain" opacity={aVenceu ? 0.4 : 1} />}
                                      <Text fontSize="xs" fontWeight={500} color={bVenceu ? 'brand.600' : textSecondary} noOfLines={1}>
                                        {pB?.timeSorteado ?? '—'}
                                      </Text>
                                    </HStack>
                                  </VStack>
                                  <Text
                                    fontFamily="heading"
                                    fontWeight={bVenceu ? 900 : (aVenceu ? 500 : 700)}
                                    fontSize={{ base: '20px', md: '22px' }}
                                    color={bVenceu ? '#F94A29' : textPrimary}
                                  >
                                    {jogo.placarB ?? '—'}
                                  </Text>
                                </Flex>

                                {/* Status da partida */}
                                {jogo.finalizada ? (
                                  <Flex
                                    borderTop="1px solid"
                                    borderColor={cardBorder}
                                    bg={useColorModeValue('gray.50', 'gray.750')}
                                    px={3} py={1}
                                    justify="center"
                                  >
                                    <Text fontSize="11px" color={textSecondary} fontWeight={700} textTransform="uppercase">
                                      FINALIZADA
                                    </Text>
                                  </Flex>
                                ) : (
                                  <Flex
                                    borderTop="1px solid"
                                    borderColor={cardBorder}
                                    bg={useColorModeValue('gray.50', 'gray.750')}
                                    px={3} py={1}
                                    justify="center"
                                  >
                                    <Text fontSize="11px" color="orange.500" fontWeight={700} textTransform="uppercase">
                                      PENDENTE
                                    </Text>
                                  </Flex>
                                )}
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </Box>
          );
        })()}

        {/* Rodapé */}
        <Box mt={10} pt={6} borderTop="1px solid" borderColor={cardBorder} textAlign="center">
          <Text fontSize="12px" color={textSecondary}>
            EAFC26 CUP — ID: {torneio.id}
          </Text>
          <Button
            mt={3} size="sm" colorScheme="brand"
            onClick={() => navigate('/torneio/configurar')}
          >
            CRIAR MEU TORNEIO
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
