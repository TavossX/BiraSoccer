import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
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
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import LogoBola from '../assets/logos/LogoBola.png';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { IoMdAdd } from "react-icons/io";
import { supabase } from '../lib/supabase';
import { TabelaClassificacao } from '../components/TabelaClassificacao';
import { ModalPlacar } from '../components/ModalPlacar';
import { ModalCompartilhar } from '../components/ModalCompartilhar';
import { ModalConfiguracoesTorneio } from '../components/ModalConfiguracoesTorneio';
import { Chaveamento } from '../components/Chaveamento';
import { DraftLobby } from '../components/DraftLobby';
import { ThemeToggle } from '../components/ThemeToggle';
import type { Partida } from '../types/torneio';
import {
  FiRefreshCw as ResetIcon,
  FiLogOut as LogoutIcon,
  FiShare2 as ShareIcon,
  FiSettings,
  FiMenu,
  FiHome,
} from 'react-icons/fi';

export function TorneioLiga() {
  const { id } = useParams<{ id?: string }>();
  const { torneio, partidas, participantes, resetarTorneio, gerarPlayoffs, carregarTorneioPublico } = useTorneioStore();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);
  const [loading, setLoading] = useState(!!id);
  const compartilharDisclosure = useDisclosure();
  const configModalDisclosure = useDisclosure();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('white', 'gray.900');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const carregar = async () => {
      if (id) {
        if (!torneio || torneio.id !== id) {
          setLoading(true);
          await carregarTorneioPublico(id);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    carregar();
  }, [id, carregarTorneioPublico]);

  // Se o torneio carregado for do formato Mata-mata, redireciona para o componente correto
  useEffect(() => {
    if (torneio && torneio.formato === 'matamata') {
      navigate(`/torneio/matamata/${torneio.id}`, { replace: true });
    }
  }, [torneio, navigate]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!torneio) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack spacing={6}>
          <img src={LogoCompleta} alt="logo" width={"450px"} />
          <Text fontSize="20px" color={textSecondary}>Crie sua primeira liga, adicione a galera e comece o draft.</Text>
          <Button onClick={() => navigate('/torneio/configurar')} variant="solid" size="lg" w="300px" rightIcon={<IoMdAdd />}>
            CRIAR TORNEIO
          </Button>
        </VStack>
      </Flex>
    );
  }

  if (torneio.status === 'aguardando_draft') {
    return <DraftLobby torneioId={id || torneio.id} />;
  }

  const isCriador = Boolean(currentUserId && torneio.userId && currentUserId === torneio.userId);
  const isCoAdmin = Boolean(currentUserId && torneio.coAdmins?.includes(currentUserId));
  const hasAdminRights = isCriador || isCoAdmin;

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
  const progresso = partidas.length > 0 ? (totalFinalizadas / partidas.length) * 100 : 0;

  const isHibrido   = torneio.formato === 'liga_com_playoffs';
  const ligaCompleta = isHibrido && partidasLiga.length > 0 && partidasLiga.every((p) => p.finalizada);

  return (
    <Box minH="100vh">
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        bg={headerBg}
        boxShadow="lg"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex
          maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" h="32px" />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '16px', md: '20px' }} color={textPrimary}>
                {torneio.nome}
              </Heading>
              <Text fontSize="12px" color={textSecondary} fontWeight={500}>
                {torneio.formato === 'liga_com_playoffs'
                  ? `LIGA + PLAYOFFS — ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`
                  : `PONTOS CORRIDOS — ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`
                }
              </Text>
            </VStack>
          </HStack>

          {/* ── Ações Desktop ────────────────────────────────────────── */}
          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            <Badge
              colorScheme="orange"
              variant="subtle"
              px={3}
              py={1}
              fontSize="12px"
              fontWeight="bold"
            >
              {totalFinalizadas}/{partidas.length} Jogos
            </Badge>

            {hasAdminRights && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                leftIcon={<FiSettings />}
                onClick={configModalDisclosure.onOpen}
              >
                Configurações
              </Button>
            )}

            <Button
              id="btn-compartilhar-liga"
              size="sm"
              colorScheme="blue"
              leftIcon={<ShareIcon />}
              onClick={compartilharDisclosure.onOpen}
            >
              Compartilhar
            </Button>

            {hasAdminRights && (
              <Button
                leftIcon={<ResetIcon />}
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={handleReset}
              >
                Resetar
              </Button>
            )}

            <ThemeToggle />

            <Button
              size="sm"
              colorScheme="gray"
              variant="ghost"
              leftIcon={<FiHome />}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </HStack>

          {/* ── Ações Mobile (Menu Hambúrguer de Ações) ─────────────────── */}
          <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
            <ThemeToggle />

            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMenu size={20} />}
                size="sm"
                variant="outline"
                colorScheme="orange"
                aria-label="Menu do Torneio"
              />
              <MenuList bg={useColorModeValue('white', 'gray.800')} borderColor={useColorModeValue('gray.200', 'gray.700')} zIndex={100}>
                {hasAdminRights && (
                  <MenuItem icon={<FiSettings />} onClick={configModalDisclosure.onOpen}>
                    Configurações do Torneio
                  </MenuItem>
                )}
                <MenuItem icon={<ShareIcon />} onClick={compartilharDisclosure.onOpen}>
                  Compartilhar Torneio
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FiHome />} onClick={() => navigate('/dashboard')}>
                  Ir ao Dashboard
                </MenuItem>
                {hasAdminRights && (
                  <>
                    <MenuDivider />
                    <MenuItem icon={<ResetIcon />} color="red.500" onClick={handleReset}>
                      Resetar Torneio
                    </MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1200px" mx="auto" px={{ base: 3, md: 8 }} py={{ base: 4, md: 8 }}>
        {/* Barra de progresso */}
        <Box mb={6}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="12px" fontWeight={600} color={textSecondary}>
              Progresso do torneio
            </Text>
            <Text fontSize="12px" fontWeight={700} color={textPrimary}>
              {totalFinalizadas}/{partidas.length} ({progresso.toFixed(0)}%)
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

        <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={8}>

          {/* Tabela de classificação */}
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={4}>
              Classificação
            </Heading>
            <TabelaClassificacao highlightTop4={isHibrido} />
          </Box>

          {/* Banner Iniciar Playoffs */}
          {isHibrido && ligaCompleta && !torneio.playoffsGerados && (
            <Box
              bg={cardBg}
              boxShadow="md"
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="lg"
              p={6}
              textAlign="center"
              overflow="hidden"
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
                <Badge colorScheme="green" px={3} py={1} fontSize="12px" borderRadius="md">
                  FASE DE LIGA ENCERRADA
                </Badge>
                <Heading fontFamily="heading" fontSize={{ base: '22px', md: '28px' }} color={textPrimary}>
                  PLAYOFFS — TOP 4
                </Heading>
                <Text fontSize="14px" color={textSecondary}>
                  1º × 4º &nbsp;•&nbsp; 2º × 3º
                </Text>
                <Button
                  id="btn-iniciar-playoffs"
                  mt={2}
                  colorScheme="brand"
                  size="lg"
                  onClick={gerarPlayoffs}
                  fontSize="14px"
                  h="52px"
                  px={8}
                >
                  INICIAR PLAYOFFS
                </Button>
              </VStack>
            </Box>
          )}

          {/* Chaveamento de playoffs */}
          {isHibrido && torneio.playoffsGerados && (
            <Box>
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={4}>
                PLAYOFFS
              </Heading>
              <Chaveamento />
            </Box>
          )}

          {/* Divisória */}
          <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" />

          {/* Rodadas */}
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary} mb={4}>
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
                          const canClick = !jogo.finalizada;

                          return (
                            <Box
                              key={jogo.id}
                              bg={cardBg}
                              border="1px solid"
                              borderColor={jogo.finalizada ? cardBorder : useColorModeValue('brand.400', 'brand.500')}
                              boxShadow="sm"
                              borderRadius="md"
                              cursor={canClick ? 'pointer' : 'default'}
                              onClick={() => canClick && abrirModal(jogo)}
                              transition="all 0.08s ease"
                              _hover={canClick ? {
                                transform: 'translate(-0.5px,-0.5px)',
                                boxShadow: 'md',
                                borderColor: 'brand.500',
                              } : {}}
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

                              {/* CTA lançar placar */}
                              {!jogo.finalizada && (
                                <Flex
                                  bg={useColorModeValue('gray.50', 'gray.750')}
                                  borderTop="1px solid"
                                  borderColor={cardBorder}
                                  px={3} py={1.5}
                                  justify="center"
                                >
                                  <Text fontSize="11px" fontWeight={700} color="brand.500" textTransform="uppercase" letterSpacing="wider">
                                    Lançar Placar
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

      {/* Modal Configurações do Torneio */}
      <ModalConfiguracoesTorneio
        isOpen={configModalDisclosure.isOpen}
        onClose={configModalDisclosure.onClose}
        torneio={torneio}
        participantes={participantes}
        currentUserId={currentUserId}
      />
    </Box>
  );
}
