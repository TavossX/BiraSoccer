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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LogoBola from '../assets/logos/LogoBola.png';
import { Chaveamento } from '../components/Chaveamento';
import { TabelaClassificacao } from '../components/TabelaClassificacao';
import { supabase } from '../lib/supabase';
import { useTorneioStore } from '../store/torneioStore';
import { FiRefreshCw as RefreshIcon } from 'react-icons/fi';

// ─── Ícones SVG ───────────────────────────────────────────────────────────────


// ─── Página ───────────────────────────────────────────────────────────────────
export function Convite() {
  const { campeonatoId } = useParams<{ campeonatoId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { torneio, participantes, carregarTorneioPublico } = useTorneioStore();
  const partidas = useTorneioStore((s) => s.partidas);

  const [status, setStatus] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [atualizando, setAtualizando] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Progresso calculado reativamente (antes dos returns condicionais)
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
        title: result ? '✅ Dados atualizados!' : '⛔ Erro ao atualizar',
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

    // Limpeza: remove o timer ao sair
    return () => clearInterval(interval);
  }, [campeonatoId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'carregando') {
    return (
      <Flex minH="100vh"  align="center" justify="center" direction="column" gap={4}>
        <Spinner size="xl"  thickness="4px" speed="0.8s" />
        <Text fontSize="12px" >CARREGANDO TORNEIO...</Text>
      </Flex>
    );
  }

  // ── Erro ───────────────────────────────────────────────────────────────────
  if (status === 'erro' || !torneio) {
    return (
      <Flex minH="100vh"  align="center" justify="center" px={4}>
        <Box
          maxW="400px" w="full" 
           
          boxShadow="md"
          p={8} textAlign="center"
        >
          <Heading fontFamily="heading" fontSize="20px"  mb={3}>Torneio não encontrado</Heading>
          <Text fontSize="12px"  mb={6} lineHeight="1.8">
            Este link pode estar incorreto ou o torneio ainda não foi publicado.
          </Text>
          <VStack spacing={3}>
            <Button w="full" onClick={() => carregar()} variant="arcade" fontSize="11px">
              ▶ TENTAR NOVAMENTE
            </Button>
            <Button w="full" variant="outline" fontSize="10px"
              onClick={() => navigate('/torneio/configurar')}>
              CRIAR MEU TORNEIO
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  // ── Torneio carregado ─────────────────────────────────────────────────────

  return (
    <Box minH="100vh" >
      {/* Header somente leitura */}
      <Box
        
        borderBottom="3px solid"
        bg="#171923"
        boxShadow="md"
        position="sticky" top={0} zIndex={100}
      >
        <Flex
          maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="EAFC26 Cup" h="32px"  />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '15px', md: '19px' }}  lineHeight="1.1">{torneio.nome}</Heading>
              <HStack spacing={2}>
                <Badge
                   color="#000"
                  border="1px solid #C3c3c3"
                  fontSize="10px" px={2}
                >
                  {torneio.formato === 'liga' ? 'LIGA' : torneio.formato === 'liga_com_playoffs' ? 'LIGA + PLAYOFFS' : 'MATA-MATA'}
                </Badge>
                {isReadOnly && (
                  <Badge bg="transparent" border="1px solid"   fontSize="10px" px={2}>
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
              variant="ghost"
              
              _hover={{ color: 'white', bg: 'brand.cardBg' }}
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
            <Text fontSize="12px" >
              PROGRESSO DO TORNEIO
            </Text>
            <Text fontSize="12px"  fontWeight={700}>
              {totalFinalizados}/{totalPartidas} ({progresso}%)
            </Text>
          </HStack>
          <Box w="full" h="8px"  border="1px solid"  overflow="hidden">
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
           
          boxShadow="md"
          p={4}
        >
          <Text fontSize="12px"  fontWeight={700}
            textTransform="uppercase" letterSpacing="wide" mb={3}>
            {participantes.length} PARTICIPANTES
          </Text>
          <Flex flexWrap="wrap" gap={2}>
            {participantes.map((p) => (
              <HStack
                key={p.id}
                
                border="1px solid" 
                px={3} py={1}
                spacing={2}
              >
                <Text fontFamily="heading" fontSize="12px" >{p.nomeAmigo}</Text>
                <Badge bg="transparent" border="1px solid"   fontSize="10px" px={2}>
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
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={5}>Classificação</Heading>
            <TabelaClassificacao />
          </Box>
        ) : torneio.formato === 'liga_com_playoffs' ? (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={5}>Classificação</Heading>
            <TabelaClassificacao />

            {torneio.playoffsGerados && (
              <Box mt={10}>
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>Playoffs</Heading>
                <Chaveamento isReadOnly={isReadOnly} />
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={2}>Chaveamento</Heading>
            <Text fontSize="12px"  mb={5}>
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
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>
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
                      mb={3}
                      overflow="hidden"
                      boxShadow="md"
                    >
                      <AccordionButton
                        _hover={{ bg: 'brand.red' }}
                        _expanded={{ bg: 'brand.red', borderBottom: '1px solid #C3c3c3', borderColor: 'brand.mustard' }}
                        py={3} px={4}
                      >
                        <HStack flex={1} spacing={3}>
                          <Text fontFamily="heading" fontSize={{ base: '14px', md: '16px' }} >
                            RODADA {rodada}
                          </Text>
                          <Badge
                            bg="transparent"
                            border="1px solid"
                            fontSize="10px"
                            color="gray.700"
                            borderRadius="5px"
                            px={2}
                          >
                            {torneio.idaEVolta ? (isVolta ? 'VOLTA' : 'IDA') : `RD${rodada}`}
                          </Badge>
                          <Badge
                            bg={rodadaCompleta ? 'brand.cardBgAlt' : 'brand.orange'}
                            color={rodadaCompleta ? 'brand.textMutedToken' : 'white'}
                            border="1px solid #C3c3c3"
                            fontSize="10px"
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
                                borderColor={jogo.finalizada ? 'brand.cardBgAlt' : 'brand.mustard'}
                                boxShadow="md"
                                border="1px solid #C3c3c3"
                                borderRadius="md"
                                overflow="hidden"
                              >
                                {/* Player A */}
                                <Flex px={3} py={2} justify="space-between" align="center"
                                  bg={aVenceu ? 'rgba(253,187,0,0.12)' : 'transparent'}
                                  borderBottom="1px solid"
                                >
                                  <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                                    <Text
                                      fontFamily="heading"
                                      fontWeight={aVenceu ? 900 : (bVenceu ? 500 : 700)}
                                      fontSize={{ base: '13px', md: '14px' }}
                                      color={aVenceu ? '#F94A29' : (bVenceu ? 'gray.500' : 'brand.textMain')}
                                      noOfLines={1}
                                    >
                                      {pA?.nomeAmigo ?? '?'}
                                    </Text>
                                    <HStack spacing={1}>
                                      {pA?.logoTime && <Image src={pA.logoTime} boxSize="10px" objectFit="contain" opacity={bVenceu ? 0.35 : 1} />}
                                      <Text fontSize="xs" color={aVenceu ? 'gray.600' : (bVenceu ? 'gray.400' : 'gray.500')} noOfLines={1}>
                                        {pA?.timeSorteado ?? '—'}
                                      </Text>
                                    </HStack>
                                  </VStack>
                                  <Text
                                    fontFamily="heading"
                                    fontWeight={aVenceu ? 900 : (bVenceu ? 500 : 700)}
                                    fontSize={{ base: '20px', md: '22px' }}
                                    color={aVenceu ? '#F94A29' : (bVenceu ? 'gray.500' : 'brand.textMain')}
                                  >
                                    {jogo.placarA ?? '—'}
                                  </Text>
                                </Flex>

                                {/* Player B */}
                                <Flex px={3} py={2} justify="space-between" align="center"
                                  bg={bVenceu ? 'rgba(253,187,0,0.12)' : 'transparent'}
                                >
                                  <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                                    <Text
                                      fontFamily="heading"
                                      fontWeight={bVenceu ? 900 : (aVenceu ? 500 : 700)}
                                      fontSize={{ base: '13px', md: '14px' }}
                                      color={bVenceu ? '#F94A29' : (aVenceu ? 'gray.500' : 'brand.textMain')}
                                      noOfLines={1}
                                    >
                                      {pB?.nomeAmigo ?? '?'}
                                    </Text>
                                    <HStack spacing={1}>
                                      {pB?.logoTime && <Image src={pB.logoTime} boxSize="10px" objectFit="contain" opacity={aVenceu ? 0.35 : 1} />}
                                      <Text fontSize="xs" color={bVenceu ? 'gray.600' : (aVenceu ? 'gray.400' : 'gray.500')} noOfLines={1}>
                                        {pB?.timeSorteado ?? '—'}
                                      </Text>
                                    </HStack>
                                  </VStack>
                                  <Text
                                    fontFamily="heading"
                                    fontWeight={bVenceu ? 900 : (aVenceu ? 500 : 700)}
                                    fontSize={{ base: '20px', md: '22px' }}
                                    color={bVenceu ? '#F94A29' : (aVenceu ? 'gray.500' : 'brand.textMain')}
                                  >
                                    {jogo.placarB ?? '—'}
                                  </Text>
                                </Flex>

                                {/* Status da partida */}
                                {jogo.finalizada ? (
                                  <Flex
                                    borderTop="1px solid #C3c3c3"
                                    px={3} py={1}
                                    justify="center"
                                  >
                                    <Text fontSize="11px" color="gray.400" fontWeight={600} textTransform="uppercase">
                                      FINALIZADA
                                    </Text>
                                  </Flex>
                                ) : (
                                  <Flex
                                    borderTop="1px solid #C3c3c3"
                                    px={3} py={1}
                                    justify="center"
                                  >
                                    <Text fontSize="11px" color="brand.orange" fontWeight={600} textTransform="uppercase">
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
        <Box mt={10} pt={6} borderTop="1px solid #C3c3c3"  textAlign="center">
          <Text fontSize="12px" >
            EAFC26 CUP — ID: {torneio.id}
          </Text>
          <Button
            mt={3} size="sm" variant="arcade" fontSize="10px"
            onClick={() => navigate('/torneio/configurar')}
          >
            ▶ CRIAR MEU TORNEIO
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
