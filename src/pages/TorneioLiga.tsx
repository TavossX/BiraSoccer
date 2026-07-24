import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  useDisclosure,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Image,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import LogoBola from '../assets/logos/LogoBola.png';
import { supabase } from '../lib/supabase';
import { TabelaClassificacao } from '../components/TabelaClassificacao';
import { ModalPlacar } from '../components/ModalPlacar';
import { ModalCompartilhar } from '../components/ModalCompartilhar';
import { Chaveamento } from '../components/Chaveamento';
import type { Partida } from '../types/torneio';

const ResetIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const ShareIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

export function TorneioLiga() {
  const { torneio, partidas, participantes, resetarTorneio, gerarPlayoffs } = useTorneioStore();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);
  const compartilharDisclosure = useDisclosure();

  if (!torneio) {
    return (
      <Flex minH="100vh"  align="center" justify="center">
        <VStack spacing={4}>
          <Text fontSize="10px" >Nenhum torneio configurado.</Text>
          <Button onClick={() => navigate('/torneio/configurar')} variant="arcade">
            ▶ CRIAR TORNEIO
          </Button>
        </VStack>
      </Flex>
    );
  }

  const abrirModal = (partida: Partida) => {
    setPartidaSelecionada(partida);
    onOpen();
  };

  const handleReset = () => {
    if (window.confirm('Resetar todos os dados deste torneio?')) resetarTorneio();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const partidasLiga = partidas.filter((p) => p.fase === null);
  const rodasUnicas  = Array.from(new Set(partidasLiga.map((p) => p.rodada))).sort((a, b) => a - b);
  const totalFinalizadas = partidas.filter((p) => p.finalizada).length;

  const isHibrido   = torneio.formato === 'liga_com_playoffs';
  const ligaCompleta = isHibrido && partidasLiga.length > 0 && partidasLiga.every((p) => p.finalizada);

  return (
    <Box minH="100vh" >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        
        borderBottom="3px solid"
        
        boxShadow="0 4px 0 #000"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex
          maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" h="32px"  />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '16px', md: '20px' }} >
                {torneio.nome}
              </Heading>
              <Text fontSize="8px"  opacity={0.8}>
                {torneio.formato === 'liga_com_playoffs'
                  ? `LIGA + PLAYOFFS — ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`
                  : `PONTOS CORRIDOS — ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`
                }
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2} flexWrap="wrap" justify="flex-end">
            <Badge
              
              color="#000"
              border="2px solid #000"
              boxShadow="md"
              px={3} py={1}
              fontSize="9px"
              display={{ base: 'none', sm: 'flex' }}
            >
              {totalFinalizadas}/{partidas.length} JOGOS
            </Badge>
            <Button
              id="btn-compartilhar-liga"
              size="sm"
              colorScheme="blue"
              leftIcon={<ShareIcon /> as any}
              onClick={compartilharDisclosure.onOpen}
              display={{ base: 'none', sm: 'flex' }}
            >
              COMPARTILHAR
            </Button>
            <Button
              leftIcon={<ResetIcon /> as any}
              size="sm"
              colorScheme="red"
              onClick={handleReset}
            >
              RESETAR
            </Button>
            <Button
              size="sm"
              colorScheme="gray"
              onClick={() => navigate('/')}
            >
              ← DASHBOARD
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={handleLogout}
              leftIcon={<LogoutIcon /> as any}
            >
              SAIR
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={8}>

          {/* Tabela de classificação */}
          <Box>
            <HStack mb={4} spacing={3}>
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} >
                CLASSIFICAÇÃO
              </Heading>
              <Badge
                
                
                
                
                boxShadow="md"
                px={3} py={1}
                fontSize="9px"
              >
                {participantes.length} PARTICIPANTES
              </Badge>
            </HStack>
            <TabelaClassificacao highlightTop4={isHibrido} />
          </Box>

          {/* Banner Iniciar Playoffs */}
          {isHibrido && ligaCompleta && !torneio.playoffsGerados && (
            <Box
              
              
              boxShadow="md"
              
              p={6}
              textAlign="center"
            >
              {/* Faixa topo */}
              <Box
                bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00)"
                h="4px"
                mx={-6}
                mt={-6}
                mb={5}
              />
              <VStack spacing={4}>
                <Badge  color="white" border="2px solid #000" boxShadow="md" px={3} py={1} fontSize="9px">
                  FASE DE LIGA ENCERRADA
                </Badge>
                <Heading fontFamily="heading" fontSize={{ base: '22px', md: '28px' }} >
                  PLAYOFFS — TOP 4
                </Heading>
                <Text fontSize="9px" >
                  1º × 4º &nbsp;•&nbsp; 2º × 3º
                </Text>
                <Button
                  id="btn-iniciar-playoffs"
                  mt={2}
                  variant="arcade"
                  size="lg"
                  onClick={gerarPlayoffs}
                  fontSize="14px"
                  h="52px"
                  px={8}
                >
                  ▶ INICIAR PLAYOFFS
                </Button>
              </VStack>
            </Box>
          )}

          {/* Chaveamento de playoffs */}
          {isHibrido && torneio.playoffsGerados && (
            <Box>
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>
                PLAYOFFS
              </Heading>
              <Chaveamento />
            </Box>
          )}

          {/* Divisória */}
          <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" />

          {/* Rodadas */}
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>
              RODADAS
            </Heading>

            <Accordion allowMultiple defaultIndex={[0]}>
              {rodasUnicas.map((rodada) => {
                const jogosRodada     = partidasLiga.filter((p) => p.rodada === rodada);
                const finalizadosRodada = jogosRodada.filter((p) => p.finalizada).length;
                const rodadaCompleta  = finalizadosRodada === jogosRodada.length;
                const isVolta         = rodada > rodasUnicas.length / 2;

                return (
                  <AccordionItem
                    key={rodada}
                    
                    
                    mb={3}
                    overflow="hidden"
                    boxShadow="md"
                  >
                    <AccordionButton
                      
                      _hover={{ bg: 'brand.red' }}
                      _expanded={{ bg: 'brand.red', borderBottom: '2px solid', borderColor: 'brand.mustard' }}
                      py={3} px={4}
                    >
                      <HStack flex={1} spacing={3}>
                        <Text fontFamily="heading" fontSize={{ base: '14px', md: '16px' }} >
                          RODADA {rodada}
                        </Text>
                        <Badge
                          bg="transparent"
                          
                          border="1px solid"
                          
                          fontSize="7px"
                          px={2}
                        >
                          {torneio.idaEVolta ? (isVolta ? 'VOLTA' : 'IDA') : `RD${rodada}`}
                        </Badge>
                        <Badge
                          bg={rodadaCompleta ? 'brand.cardBgAlt' : 'brand.orange'}
                          color={rodadaCompleta ? 'brand.textMutedToken' : 'white'}
                          border="1px solid #000"
                          fontSize="7px"
                          px={2}
                        >
                          {finalizadosRodada}/{jogosRodada.length}
                        </Badge>
                      </HStack>
                      <AccordionIcon  />
                    </AccordionButton>

                    <AccordionPanel  p={4}>
                      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
                        {jogosRodada.map((jogo) => {
                          const pA = participantes.find((p) => p.id === jogo.participanteAId);
                          const pB = participantes.find((p) => p.id === jogo.participanteBId);
                          const aVenceu = jogo.vencedorId === jogo.participanteAId;
                          const bVenceu = jogo.vencedorId === jogo.participanteBId;
                          const canClick = !jogo.finalizada;

                          return (
                            <Box
                              key={jogo.id}
                              
                              borderColor={jogo.finalizada ? 'brand.cardBgAlt' : 'brand.mustard'}
                              
                              boxShadow={canClick ? '4px 4px 0 #000' : '2px 2px 0 #000'}
                              cursor={canClick ? 'pointer' : 'default'}
                              onClick={() => canClick && abrirModal(jogo)}
                              transition="all 0.08s ease"
                              _hover={canClick ? {
                                borderColor: 'brand.orange',
                                transform: 'translate(-2px,-2px)',
                                boxShadow: '6px 6px 0 #000',
                              } : {}}
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
                                    fontWeight={aVenceu ? 700 : 500}
                                    opacity={bVenceu ? 0.35 : 1}
                                    fontSize={{ base: '13px', md: '14px' }}
                                    color={aVenceu ? 'brand.mustard' : 'brand.textMain'}
                                    noOfLines={1}
                                  >
                                    {pA?.nomeAmigo ?? '?'}
                                  </Text>
                                  <HStack spacing={1}>
                                    {pA?.logoTime && <Image src={pA.logoTime} boxSize="10px" objectFit="contain" opacity={bVenceu ? 0.35 : 1} />}
                                    <Text fontSize="7px"  noOfLines={1}>
                                      {pA?.timeSorteado ?? '—'}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <Text
                                  fontFamily="heading"
                                  fontWeight={900}
                                  fontSize={{ base: '20px', md: '22px' }}
                                  opacity={bVenceu ? 0.35 : 1}
                                  color={aVenceu ? 'brand.mustard' : 'brand.textMain'}
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
                                    fontWeight={bVenceu ? 700 : 500}
                                    opacity={aVenceu ? 0.35 : 1}
                                    fontSize={{ base: '13px', md: '14px' }}
                                    color={bVenceu ? 'brand.mustard' : 'brand.textMain'}
                                    noOfLines={1}
                                  >
                                    {pB?.nomeAmigo ?? '?'}
                                  </Text>
                                  <HStack spacing={1}>
                                    {pB?.logoTime && <Image src={pB.logoTime} boxSize="10px" objectFit="contain" opacity={aVenceu ? 0.35 : 1} />}
                                    <Text fontSize="7px"  noOfLines={1}>
                                      {pB?.timeSorteado ?? '—'}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <Text
                                  fontFamily="heading"
                                  fontWeight={900}
                                  fontSize={{ base: '20px', md: '22px' }}
                                  opacity={aVenceu ? 0.35 : 1}
                                  color={bVenceu ? 'brand.mustard' : 'brand.textMain'}
                                >
                                  {jogo.placarB ?? '—'}
                                </Text>
                              </Flex>

                              {/* CTA lançar placar */}
                              {!jogo.finalizada && (
                                <Flex
                                  
                                  borderTop="2px solid"
                                  
                                  px={3} py={1}
                                  justify="center"
                                >
                                  <Text fontSize="8px"  fontWeight={600} textTransform="uppercase">
                                    ▶ LANÇAR PLACAR
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
        </SimpleGrid>
      </Box>

      {/* Modal placar */}
      {partidaSelecionada && (
        <ModalPlacar
          isOpen={isOpen}
          onClose={onClose}
          partida={partidaSelecionada}
          modo="liga"
        />
      )}

      {/* Modal compartilhar */}
      <ModalCompartilhar
        isOpen={compartilharDisclosure.isOpen}
        onClose={compartilharDisclosure.onClose}
      />
    </Box>
  );
}
