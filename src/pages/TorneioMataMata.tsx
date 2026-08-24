import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useDisclosure,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import { Chaveamento } from '../components/Chaveamento';
import { DraftLobby } from '../components/DraftLobby';
import { ModalCompartilhar } from '../components/ModalCompartilhar';
import { ModalConfiguracoesTorneio } from '../components/ModalConfiguracoesTorneio';
import { ThemeToggle } from '../components/ThemeToggle';
import LogoBola from '../assets/logos/LogoBola.png';
import { supabase } from '../lib/supabase';
import {
  FiRefreshCw as ResetIcon,
  FiLogOut as LogoutIcon,
  FiShare2 as ShareIcon,
  FiSettings,
  FiAward,
  FiMenu,
  FiHome,
} from 'react-icons/fi';

export function TorneioMataMata() {
  const { id } = useParams<{ id?: string }>();
  const { torneio, partidas, participantes, resetarTorneio, carregarTorneioPublico } = useTorneioStore();
  const navigate = useNavigate();
  const compartilharDisclosure = useDisclosure();
  const configModalDisclosure = useDisclosure();
  const [loading, setLoading] = useState(!!id);
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
  }, [id, torneio?.id]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack spacing={3}>
          <Spinner size="xl" thickness="4px" />
          <Text fontSize="12px" color={textSecondary}>CARREGANDO TORNEIO...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!torneio) {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column" gap={4}>
        <Text fontSize="16px" color={textPrimary}>Nenhum torneio ativo.</Text>
        <Button onClick={() => navigate('/torneio/configurar')}>CRIAR TORNEIO</Button>
      </Flex>
    );
  }

  if (torneio.status === 'aguardando_draft') {
    return <DraftLobby torneioId={id || torneio.id} />;
  }

  const isCriador = Boolean(currentUserId && torneio.userId && currentUserId === torneio.userId);
  const isCoAdmin = Boolean(currentUserId && torneio.coAdmins?.includes(currentUserId));
  const hasAdminRights = isCriador || isCoAdmin;

  const handleReset = () => {
    if (window.confirm('Resetar todos os dados deste torneio?')) resetarTorneio();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const confrontoFinal = (() => {
    const bracketReset = partidas.find((p) => p.fase === 'bracket_reset' && p.finalizada && p.vencedorId);
    if (bracketReset) return bracketReset;
    const grandFinal = partidas.find((p) => p.fase === 'grand_final' && p.finalizada && p.vencedorId);
    if (grandFinal) {
      const pendingReset = partidas.find((p) => p.fase === 'bracket_reset' && !p.finalizada);
      if (!pendingReset) return grandFinal;
    }
    const finalMatch = partidas.find((p) => p.fase === 'final' && p.finalizada && p.vencedorId);
    return finalMatch ?? null;
  })();
  const campeao = confrontoFinal
    ? participantes.find((p) => p.id === confrontoFinal.vencedorId)
    : null;

  const totalFinalizados = partidas.filter((p) => p.finalizada).length;
  const progresso = partidas.length > 0 ? (totalFinalizados / partidas.length) * 100 : 0;

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
          maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" h="32px" />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '16px', md: '20px' }} color={textPrimary}>
                {torneio.nome}
              </Heading>
              <Text fontSize="12px" color={textSecondary} fontWeight={500}>
                MATA-MATA {torneio.isDoubleElimination ? '— REPESCAGEM (DOUBLE ELIMINATION)' : `— ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`}
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
              {totalFinalizados}/{partidas.length} Jogos
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
              id="btn-compartilhar-matamata"
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

      <Box maxW="1400px" mx="auto" px={{ base: 3, md: 8 }} py={{ base: 4, md: 8 }}>
        {/* Barra de progresso */}
        <Box mb={6}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="12px" fontWeight={600} color={textSecondary}>
              Progresso do torneio
            </Text>
            <Text fontSize="12px" fontWeight={700} color={textPrimary}>
              {totalFinalizados}/{partidas.length} ({progresso.toFixed(0)}%)
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

        {/* Banner de campeão */}
        {campeao && (
          <Box
            mb={8}
            borderRadius="xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <Box h="6px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" />
            <Box
              bg="linear-gradient(180deg, #F94A29 0%, #C80000 100%)"
              p={8}
              textAlign="center"
              color="white"
            >
              <HStack justify="center" spacing={1.5} mb={2}>
                <FiAward size={16} />
                <Text fontSize="12px" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
                  CAMPEÃO
                </Text>
              </HStack>
              <Heading
                fontFamily="heading"
                fontSize={{ base: '28px', md: '40px' }}
                fontWeight={900}
                textTransform="uppercase"
                letterSpacing="0.05em"
                mb={1}
                color="white"
              >
                {campeao.nomeAmigo}
              </Heading>
              <Text fontSize="14px" fontWeight={600} mb={3} color="orange.100">{campeao.timeSorteado}</Text>
              <Badge
                bg="white"
                color="#C80000"
                px={4} py={1}
                fontSize="12px"
                fontWeight="extrabold"
                borderRadius="full"
                letterSpacing="wide"
              >
                CAMPEÃO DA COPA
              </Badge>
            </Box>
          </Box>
        )}

        {/* Lista de participantes */}
        <Box mb={8}>
          <Heading fontFamily="heading" fontSize={{ base: '18px', md: '22px' }} color={textPrimary} mb={4}>
            PARTICIPANTES
          </Heading>
          <Wrap spacing={3}>
            {participantes.map((p) => {
              const isCampeao = p.id === campeao?.id;
              return (
                <WrapItem key={p.id}>
                  <HStack
                    bg={isCampeao ? 'linear-gradient(135deg,#F94A29,#C80000)' : cardBg}
                    border="1px solid"
                    borderColor={isCampeao ? 'brand.mustard' : cardBorder}
                    borderRadius="lg"
                    boxShadow={isCampeao ? 'lg' : 'sm'}
                    px={4} py={2}
                    spacing={3}
                    transition="all 0.1s"
                    _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)', boxShadow: 'md' }}
                  >
                    <VStack spacing={0} align="flex-start">
                      <HStack spacing={1.5}>
                        {isCampeao && <FiAward size={14} color="white" />}
                        <Text
                          fontFamily="heading"
                          fontWeight={700}
                          color={isCampeao ? 'white' : textPrimary}
                          fontSize={{ base: '13px', md: '15px' }}
                        >
                          {p.nomeAmigo}
                        </Text>
                      </HStack>
                      <Badge
                        bg={isCampeao ? 'whiteAlpha.300' : useColorModeValue('gray.100', 'gray.700')}
                        color={isCampeao ? 'white' : textSecondary}
                        fontSize="10px"
                        fontWeight="bold"
                        borderRadius="md"
                        px={2}
                      >
                        {p.timeSorteado}
                      </Badge>
                    </VStack>
                  </HStack>
                </WrapItem>
              );
            })}
          </Wrap>
        </Box>

        {/* Divisória */}
        <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" mb={8} />

        {/* Chaveamento */}
        <Box>
          <Heading fontFamily="heading" fontSize={{ base: '18px', md: '22px' }} color={textPrimary} mb={2}>
            CHAVEAMENTO
          </Heading>
          <Text fontSize="12px" color={textSecondary} mb={5}>
            Clique em uma partida para lançar o placar. O vencedor avança automaticamente.
          </Text>
          <Chaveamento />
        </Box>
      </Box>

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
