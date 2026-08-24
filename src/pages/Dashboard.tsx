import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useToast,
  VStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTorneioStore } from '../store/torneioStore';
import { listarMeusTimes } from '../services/timesCustomizadosService';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import type { Perfil } from '../types/social';
import {
  FiUsers,
  FiShield,
  FiPlus,
  FiLogOut,
  FiLink,
  FiTrash2,
  FiPlay,
  FiAward,
  FiClock,
  FiUserCheck,
  FiCheckCircle,
} from 'react-icons/fi';

interface TorneioItem {
  id: string;
  nome: string;
  formato: string;
  status: string;
  user_id: string;
  co_admins?: string[];
  grupo_id?: string | null;
  dados: any;
  atualizado_em: string;
}

export function Dashboard() {
  const [meusTorneios, setMeusTorneios] = useState<TorneioItem[]>([]);
  const [torneiosParticipo, setTorneiosParticipo] = useState<TorneioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [perfilUsuario, setPerfilUsuario] = useState<Perfil | null>(null);
  const [totalMeusTimes, setTotalMeusTimes] = useState(0);

  const navigate = useNavigate();
  const toast = useToast();
  const carregarTorneioPublico = useTorneioStore((s) => s.carregarTorneioPublico);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('white', 'gray.900');

  const fetchTorneios = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

      const { data: perf } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setPerfilUsuario(perf);

      const { data, error } = await supabase
        .from('torneios_publicos')
        .select('id, nome, formato, status, user_id, co_admins, grupo_id, dados, atualizado_em')
        .order('atualizado_em', { ascending: false });

      if (!error && data) {
        // Meus Torneios: Criados por mim OU onde sou Co-Admin
        const criadosOuAdmin = data.filter(
          (t) => t.user_id === user.id || (t.co_admins && t.co_admins.includes(user.id))
        );
        setMeusTorneios(criadosOuAdmin);

        // Torneios que Participo: Onde meu usuarioId está nos participantes e eu não sou o criador
        const participando = data.filter((t) => {
          const participantes = t.dados?.participantes || [];
          const isParticipant = participantes.some((p: any) => p.usuarioId === user.id);
          return isParticipant && t.user_id !== user.id;
        });
        setTorneiosParticipo(participando);
      }

      // Contar times customizados
      const meusTimesData = await listarMeusTimes(user.id);
      setTotalMeusTimes(meusTimesData.length);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTorneios();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleGenerateLink = (id: string) => {
    const url = `${window.location.origin}/convite/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: url,
      status: 'success',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleAcessar = async (torneio: TorneioItem) => {
    const ok = await carregarTorneioPublico(torneio.id);
    if (ok) {
      if (torneio.formato === 'liga' || torneio.formato === 'liga_com_playoffs') {
        navigate(`/torneio/liga/${torneio.id}`);
      } else {
        navigate(`/torneio/matamata/${torneio.id}`);
      }
    } else {
      toast({ title: 'Erro ao carregar torneio', status: 'error' });
    }
  };

  const handleExcluir = async (id: string) => {
    const confirm = window.confirm('Tem certeza que deseja excluir este torneio?');
    if (!confirm) return;
    const { error } = await supabase.from('torneios_publicos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', status: 'error' });
    } else {
      toast({ title: 'Torneio excluído com sucesso', status: 'success' });
      setMeusTorneios((prev) => prev.filter((t) => t.id !== id));
      setTorneiosParticipo((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'aguardando_draft':
        return (
          <Badge colorScheme="blue" variant="subtle" fontSize="10px">
            <HStack spacing={1}>
              <Icon as={FiClock} />
              <Text>AGUARDANDO DRAFT</Text>
            </HStack>
          </Badge>
        );
      case 'finalizado':
        return (
          <Badge colorScheme="green" variant="solid" fontSize="10px">
            <HStack spacing={1}>
              <Icon as={FiCheckCircle} />
              <Text>FINALIZADO</Text>
            </HStack>
          </Badge>
        );
      case 'em_andamento':
      default:
        return (
          <Badge colorScheme="orange" variant="subtle" fontSize="10px">
            <HStack spacing={1}>
              <Icon as={FiPlay} />
              <Text>EM ANDAMENTO</Text>
            </HStack>
          </Badge>
        );
    }
  };

  const renderTorneioCard = (t: TorneioItem, isParticipanteTab = false) => {
    const isCriador = Boolean(userId && t.user_id === userId);
    const isCoAdmin = Boolean(userId && t.co_admins?.includes(userId) && !isCriador);

    // Encontrar meu time neste torneio (se eu sou participante)
    const meuParticipante = userId
      ? t.dados?.participantes?.find((p: any) => p.usuarioId === userId)
      : null;

    return (
      <Box
        key={t.id}
        bg={cardBg}
        borderRadius="xl"
        boxShadow="sm"
        display="flex"
        flexDirection="column"
        transition="all 0.2s"
        overflow="hidden"
        border="1px solid"
        borderColor={cardBorder}
        _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', borderColor: 'brand.500' }}
      >
        {/* Barra topo colorida */}
        <Box
          h="5px"
          bg={
            t.formato === 'liga'
              ? 'linear-gradient(90deg,#F94A29,#FDBB00)'
              : 'linear-gradient(90deg,#C80000,#F94A29)'
          }
        />

        <Box p={5} flex={1} display="flex" flexDirection="column">
          {/* Header do Card */}
          <HStack justify="space-between" mb={2} align="flex-start">
            <Heading
              fontFamily="heading"
              fontSize={{ base: '16px', md: '18px' }}
              color={textPrimary}
              noOfLines={2}
              flex={1}
              mr={2}
            >
              {t.nome}
            </Heading>
            <Badge
              colorScheme={t.formato === 'liga' ? 'orange' : 'purple'}
              px={2}
              py={0.5}
              borderRadius="md"
              fontSize="11px"
              fontWeight="bold"
              flexShrink={0}
            >
              {t.formato === 'liga'
                ? 'LIGA'
                : t.formato === 'liga_com_playoffs'
                ? 'LIGA + PLAYOFFS'
                : 'MATA-MATA'}
            </Badge>
          </HStack>

          {/* Badges de Status e Papel */}
          <HStack spacing={2} mb={3} flexWrap="wrap">
            {renderStatusBadge(t.status)}
            {isCriador && (
              <Badge colorScheme="orange" variant="solid" fontSize="10px">
                CRIADOR
              </Badge>
            )}
            {isCoAdmin && (
              <Badge colorScheme="teal" variant="solid" fontSize="10px">
                CO-ADMIN
              </Badge>
            )}
          </HStack>

          {/* Time do Jogador Participante */}
          {meuParticipante && (
            <Box
              p={2.5}
              borderRadius="lg"
              bg={useColorModeValue('gray.50', 'gray.750')}
              border="1px solid"
              borderColor={cardBorder}
              mb={3}
            >
              <Text fontSize="10px" color={textSecondary} textTransform="uppercase" fontWeight={700} mb={1}>
                Meu Time
              </Text>
              <HStack spacing={2}>
                {meuParticipante.logoTime ? (
                  <Image src={meuParticipante.logoTime} alt={meuParticipante.timeSorteado} boxSize="18px" objectFit="contain" />
                ) : (
                  <Icon as={FiShield} color="brand.500" />
                )}
                <Text fontSize="13px" fontWeight={800} color={textPrimary} noOfLines={1}>
                  {meuParticipante.timeSorteado || 'Não definido (Draft)'}
                </Text>
              </HStack>
            </Box>
          )}

          <Text fontSize="11px" color={textSecondary} mt="auto" mb={4}>
            Atualizado em {new Date(t.atualizado_em).toLocaleDateString()}
          </Text>

          {/* Ações */}
          <Box pt={3} borderTop="1px solid" borderColor={cardBorder}>
            <HStack spacing={2}>
              <Button
                flex={1}
                size="sm"
                colorScheme="orange"
                onClick={() => handleAcessar(t)}
                leftIcon={<FiPlay />}
                fontWeight={700}
              >
                Acessar
              </Button>
              <Tooltip label="Copiar Link" placement="top">
                <IconButton
                  aria-label="Copiar link"
                  icon={<FiLink />}
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  onClick={() => handleGenerateLink(t.id)}
                />
              </Tooltip>
              {isCriador && (
                <Tooltip label="Excluir Torneio" placement="top">
                  <IconButton
                    aria-label="Excluir torneio"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => handleExcluir(t.id)}
                  />
                </Tooltip>
              )}
            </HStack>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box minH="100vh">
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box as="header" bg={headerBg} boxShadow="sm" position="sticky" top={0} zIndex={100}>
        <Flex
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={3}
          align="center"
          justify="space-between"
          gap={3}
        >
          {/* Logo */}
          <HStack spacing={3}>
            <Image src={LogoCompleta} alt="BiraSoccer" h={{ base: '36px', md: '46px' }} />
          </HStack>

          {/* Ações */}
          <HStack spacing={2} flexShrink={0}>
            <Button
              id="btn-meus-grupos"
              size="sm"
              onClick={() => navigate('/grupos')}
              variant="outline"
              colorScheme="orange"
              leftIcon={<FiUsers />}
            >
              Meus Grupos
            </Button>
            <Button
              id="btn-meus-times"
              size="sm"
              onClick={() => navigate('/meus-times')}
              variant="outline"
              colorScheme="orange"
              leftIcon={<FiShield />}
            >
              Meus Times
            </Button>
            <Button
              id="btn-novo-torneio"
              size="sm"
              onClick={() => navigate('/torneio/configurar')}
              colorScheme="orange"
              leftIcon={<FiPlus />}
              fontWeight={800}
            >
              Criar Torneio
            </Button>
            {userId && (
              <Tooltip label="Meu Perfil" placement="top">
                <Avatar
                  size="sm"
                  name={perfilUsuario?.nome || 'Perfil'}
                  src={perfilUsuario?.foto_base64 || undefined}
                  cursor="pointer"
                  onClick={() => navigate(`/perfil/${userId}`)}
                  border="2px solid"
                  borderColor="brand.500"
                />
              </Tooltip>
            )}
            <IconButton
              aria-label="Logout"
              icon={<FiLogOut />}
              size="sm"
              onClick={handleLogout}
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </Flex>
      </Box>

      {/* ── Conteúdo Principal ───────────────────────────────────── */}
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        {/* Saudação */}
        <Box
          bg={cardBg}
          boxShadow="sm"
          px={6}
          py={5}
          mb={8}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={1}>
              <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} color={textPrimary}>
                Olá, {perfilUsuario?.nome || 'Jogador'}
              </Heading>
              <Text fontSize="13px" color={textSecondary}>
                Acompanhe seus campeonatos, grupos e estatísticas de jogo.
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
          <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm" p={5}>
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textSecondary} textTransform="uppercase" letterSpacing="wide">
                Meus Torneios (Host / Co-Admin)
              </StatLabel>
              <StatNumber fontFamily="heading" fontSize="3xl" fontWeight={900} color={textPrimary} lineHeight="1.2">
                {meusTorneios.length}
              </StatNumber>
            </Stat>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm" p={5}>
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textSecondary} textTransform="uppercase" letterSpacing="wide">
                Torneios que Participo
              </StatLabel>
              <StatNumber fontFamily="heading" fontSize="3xl" fontWeight={900} color="brand.500" lineHeight="1.2">
                {torneiosParticipo.length}
              </StatNumber>
            </Stat>
          </Box>

          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            boxShadow="sm"
            p={5}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', borderColor: 'brand.500' }}
            onClick={() => navigate('/meus-times')}
          >
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textSecondary} textTransform="uppercase" letterSpacing="wide">
                Meus Times Customizados
              </StatLabel>
              <StatNumber fontFamily="heading" fontSize="3xl" fontWeight={900} color={textPrimary} lineHeight="1.2">
                {totalMeusTimes}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Divisória degradê */}
        <Box h="3px" bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00, #F94A29, #C80000)" mb={8} borderRadius="full" />

        {/* ── Abas de Torneios (Hub do Jogador) ───────────────────── */}
        <Tabs variant="soft-rounded" colorScheme="orange">
          <TabList mb={6} gap={2} flexWrap="wrap">
            <Tab fontSize="14px" fontWeight={700}>
              <HStack spacing={2}>
                <FiAward />
                <Text>Meus Torneios ({meusTorneios.length})</Text>
              </HStack>
            </Tab>
            <Tab fontSize="14px" fontWeight={700}>
              <HStack spacing={2}>
                <FiUserCheck />
                <Text>Torneios que Participo ({torneiosParticipo.length})</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* ── Painel 1: Meus Torneios ─────────────────────────── */}
            <TabPanel px={0} py={2}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <VStack spacing={3}>
                    <Spinner size="xl" thickness="4px" color="brand.500" />
                    <Text fontSize="12px" color={textSecondary}>Carregando torneios...</Text>
                  </VStack>
                </Flex>
              ) : meusTorneios.length === 0 ? (
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm" p={10} textAlign="center">
                  <Text fontSize="14px" color={textSecondary} mb={4}>
                    Você ainda não criou nenhum campeonato.
                  </Text>
                  <Button onClick={() => navigate('/torneio/configurar')} colorScheme="orange" leftIcon={<FiPlus />}>
                    Criar Primeiro Torneio
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {meusTorneios.map((t) => renderTorneioCard(t, false))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* ── Painel 2: Torneios que Participo ─────────────────── */}
            <TabPanel px={0} py={2}>
              {loading ? (
                <Flex justify="center" py={10}>
                  <VStack spacing={3}>
                    <Spinner size="xl" thickness="4px" color="brand.500" />
                    <Text fontSize="12px" color={textSecondary}>Carregando torneios...</Text>
                  </VStack>
                </Flex>
              ) : torneiosParticipo.length === 0 ? (
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="sm" p={10} textAlign="center">
                  <Text fontSize="14px" color={textSecondary} mb={2}>
                    Você ainda não está participando de nenhum torneio de amigos.
                  </Text>
                  <Text fontSize="12px" color={textSecondary}>
                    Quando um amigo adicionar sua conta em um campeonato, ele aparecerá automaticamente aqui.
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {torneiosParticipo.map((t) => renderTorneioCard(t, true))}
                </SimpleGrid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}
