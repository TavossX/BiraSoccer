import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
  VStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { gerarConviteGrupo, obterGrupo } from '../services/gruposService';
import { useTorneioStore, obterPodioTorneio } from '../store/torneioStore';
import type { Grupo, GrupoMembro } from '../types/social';
import type { Torneio, Participante, Partida } from '../types/torneio';
import {
  FiArrowLeft,
  FiLink,
  FiShield,
  FiUsers,
  FiAward,
  FiPlay,
  FiPlus,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';
import { Navbar } from '../components/Navbar';

interface TorneioGrupoItem {
  id: string;
  nome: string;
  formato: string;
  status: string;
  user_id: string;
  co_admins?: string[];
  grupo_id?: string | null;
  dados: {
    torneio: Torneio;
    participantes: Participante[];
    partidas: Partida[];
  };
  atualizado_em: string;
}

export function DetalhesGrupo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const carregarTorneioPublico = useTorneioStore((s) => s.carregarTorneioPublico);

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [membros, setMembros] = useState<GrupoMembro[]>([]);
  const [torneiosAtivos, setTorneiosAtivos] = useState<TorneioGrupoItem[]>([]);
  const [torneiosFinalizados, setTorneiosFinalizados] = useState<TorneioGrupoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserId(user.id);

      // 1. Grupo e Membros
      const res = await obterGrupo(id);
      setGrupo(res.grupo);
      setMembros(res.membros);

      // 2. Torneios vinculados a este grupo
      const { data: torneiosData } = await supabase
        .from('torneios_publicos')
        .select('id, nome, formato, status, user_id, co_admins, grupo_id, dados, atualizado_em')
        .eq('grupo_id', id)
        .order('atualizado_em', { ascending: false });

      if (torneiosData) {
        const ativos = torneiosData.filter((t) => t.status !== 'finalizado');
        const finalizados = torneiosData.filter((t) => t.status === 'finalizado');
        setTorneiosAtivos(ativos as any);
        setTorneiosFinalizados(finalizados as any);
      }

      setLoading(false);
    };

    carregar();
  }, [id]);

  const handleGerarLinkConvite = async () => {
    if (!id) return;

    setGeneratingLink(true);
    try {
      const convite = await gerarConviteGrupo(id);
      const fullUrl = `${window.location.origin}/convite-grupo/${convite.token}`;
      navigator.clipboard.writeText(fullUrl);

      toast({
        title: 'Link de convite copiado!',
        description: fullUrl,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar link',
        description: err?.message || 'Tente novamente.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleAcessarTorneio = async (torneio: TorneioGrupoItem) => {
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

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!grupo) {
    return (
      <Box minH="100vh" p={10} textAlign="center">
        <Text color={textPrimary}>Grupo não encontrado.</Text>
        <Button mt={4} onClick={() => navigate('/grupos')}>
          Voltar aos Grupos
        </Button>
      </Box>
    );
  }

  const isGestor = grupo.criador_id === userId;

  return (
    <Box minH="100vh">
      <Navbar />

      <Box maxW="1000px" mx="auto" px={{ base: 3, md: 8 }} py={{ base: 4, md: 8 }}>
        {/* Header do Grupo */}
        <HStack justify="space-between" mb={6} align="center" flexWrap="wrap" gap={3}>
          <VStack spacing={1} align="flex-start">
            <HStack spacing={3}>
              <Heading fontSize={{ base: '20px', md: '28px' }} color="brand.500">
                {grupo.nome}
              </Heading>
              {isGestor && (
                <Badge colorScheme="orange" variant="subtle" fontSize="11px" px={2} py={0.5}>
                  SOU GESTOR
                </Badge>
              )}
            </HStack>
            <Text fontSize="13px" color={textColorMuted}>
              {membros.length} participante(s) registrado(s) neste grupo.
            </Text>
          </VStack>
          <HStack spacing={2}>
            {isGestor && (
              <Button
                colorScheme="orange"
                variant="solid"
                size="sm"
                leftIcon={<FiLink />}
                onClick={handleGerarLinkConvite}
                isLoading={generatingLink}
                fontWeight={700}
              >
                Link de Convite
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Card do Gestor e Ação Rápida */}
        <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" p={6} mb={8} boxShadow="sm">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Avatar
                size="md"
                name={grupo.criador?.nome || 'Gestor'}
                src={grupo.criador?.foto_base64 || undefined}
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="12px" color={textColorMuted} textTransform="uppercase" fontWeight={700}>
                  Gestor do Grupo
                </Text>
                <Text fontSize="16px" color={textPrimary} fontWeight={700}>
                  {grupo.criador?.nome || 'Amigo'}
                </Text>
              </VStack>
            </HStack>

            <Button
              size="sm"
              colorScheme="orange"
              variant="outline"
              leftIcon={<FiPlus />}
              onClick={() => navigate(`/torneio/configurar?grupoId=${grupo.id}`)}
              fontWeight={700}
            >
              Criar Torneio com este Grupo
            </Button>
          </Flex>
        </Box>

        {/* ── Abas de Conteúdo do Grupo ─────────────────────────── */}
        <Tabs variant="soft-rounded" colorScheme="orange">
          <TabList mb={6} gap={2} flexWrap="wrap">
            <Tab fontSize="14px" fontWeight={700}>
              <HStack spacing={2}>
                <FiUsers />
                <Text>Membros ({membros.length})</Text>
              </HStack>
            </Tab>
            <Tab fontSize="14px" fontWeight={700}>
              <HStack spacing={2}>
                <FiPlay />
                <Text>Torneios Ativos ({torneiosAtivos.length})</Text>
              </HStack>
            </Tab>
            <Tab fontSize="14px" fontWeight={700}>
              <HStack spacing={2}>
                <FiAward />
                <Text>Histórico / Campeões ({torneiosFinalizados.length})</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* ── Aba 1: Membros ──────────────────────────────────── */}
            <TabPanel px={0} py={2}>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                {membros.map((m) => {
                  const perfil = m.perfil;
                  const isCriadorDoGrupo = m.usuario_id === grupo.criador_id;

                  return (
                    <Box
                      key={m.id}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="xl"
                      p={4}
                      boxShadow="sm"
                      transition="all 0.2s"
                      _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)' }}
                      cursor="pointer"
                      onClick={() => navigate(`/perfil/${m.usuario_id}`)}
                    >
                      <HStack spacing={3}>
                        <Avatar
                          size="md"
                          name={perfil?.nome || 'Membro'}
                          src={perfil?.foto_base64 || undefined}
                        />
                        <VStack align="flex-start" spacing={0} flex={1}>
                          <HStack justify="space-between" w="full">
                            <Text fontWeight={700} fontSize="14px" color={textPrimary} noOfLines={1}>
                              {perfil?.nome || 'Membro do Grupo'}
                            </Text>
                            {isCriadorDoGrupo && (
                              <Badge colorScheme="orange" fontSize="9px">
                                Gestor
                              </Badge>
                            )}
                          </HStack>
                          {perfil?.steam_id && (
                            <Text fontSize="11px" color={textColorMuted} noOfLines={1}>
                              {perfil.steam_id}
                            </Text>
                          )}
                          <Text fontSize="10px" color={textColorMuted} mt={1}>
                            Entrou em {new Date(m.data_entrada).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </TabPanel>

            {/* ── Aba 2: Torneios Ativos ──────────────────────────── */}
            <TabPanel px={0} py={2}>
              {torneiosAtivos.length === 0 ? (
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" p={8} textAlign="center">
                  <Text fontSize="14px" color={textColorMuted} mb={4}>
                    Nenhum campeonato em andamento vinculado a este grupo.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    leftIcon={<FiPlus />}
                    onClick={() => navigate(`/torneio/configurar?grupoId=${grupo.id}`)}
                  >
                    Iniciar Torneio
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {torneiosAtivos.map((t) => (
                    <Box
                      key={t.id}
                      bg={cardBg}
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="xl"
                      p={5}
                      boxShadow="sm"
                      _hover={{ borderColor: 'brand.500' }}
                    >
                      <HStack justify="space-between" mb={2}>
                        <Heading fontSize="16px" color={textPrimary}>
                          {t.nome}
                        </Heading>
                        <Badge
                          colorScheme={t.status === 'aguardando_draft' ? 'blue' : 'orange'}
                          fontSize="10px"
                        >
                          {t.status === 'aguardando_draft' ? 'DRAFT' : 'EM ANDAMENTO'}
                        </Badge>
                      </HStack>
                      <Text fontSize="12px" color={textColorMuted} mb={4}>
                        Formato: {t.formato.toUpperCase()} • Atualizado em {new Date(t.atualizado_em).toLocaleDateString()}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        leftIcon={<FiPlay />}
                        onClick={() => handleAcessarTorneio(t)}
                        w="full"
                        fontWeight={700}
                      >
                        Acessar Torneio
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* ── Aba 3: Histórico e Campeões ─────────────────────── */}
            <TabPanel px={0} py={2}>
              {torneiosFinalizados.length === 0 ? (
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" p={8} textAlign="center">
                  <Text fontSize="14px" color={textColorMuted}>
                    Ainda não há campeonatos finalizados neste grupo.
                  </Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {torneiosFinalizados.map((t) => {
                    const podio = obterPodioTorneio(
                      t.dados?.torneio,
                      t.dados?.participantes || [],
                      t.dados?.partidas || []
                    );

                    return (
                      <Box
                        key={t.id}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="xl"
                        p={5}
                        boxShadow="sm"
                      >
                        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2} mb={4}>
                          <VStack align="flex-start" spacing={0}>
                            <Heading fontSize="17px" color={textPrimary}>
                              {t.nome}
                            </Heading>
                            <Text fontSize="11px" color={textColorMuted}>
                              Finalizado em {new Date(t.atualizado_em).toLocaleDateString()} • {t.formato.toUpperCase()}
                            </Text>
                          </VStack>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="orange"
                            onClick={() => handleAcessarTorneio(t)}
                          >
                            Ver Chaveamento
                          </Button>
                        </Flex>

                        {/* Pódio dos Campeões */}
                        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                          {/* Campeão */}
                          <Box
                            p={3}
                            borderRadius="lg"
                            bg={useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.08)')}
                            border="1px solid"
                            borderColor={useColorModeValue('orange.200', 'orange.800')}
                          >
                            <HStack spacing={2} mb={1}>
                              <Icon as={FiAward} color="#FDBB00" boxSize={4} />
                              <Text fontSize="11px" fontWeight={800} color="#FDBB00" textTransform="uppercase">
                                1º Lugar (Campeão)
                              </Text>
                            </HStack>
                            <Text fontSize="14px" fontWeight={800} color={textPrimary} noOfLines={1}>
                              {podio.campeao?.nomeAmigo || '—'}
                            </Text>
                            <Text fontSize="11px" color={textColorMuted} noOfLines={1}>
                              {podio.campeao?.timeSorteado || ''}
                            </Text>
                          </Box>

                          {/* Vice */}
                          <Box
                            p={3}
                            borderRadius="lg"
                            bg={useColorModeValue('gray.100', 'gray.750')}
                            border="1px solid"
                            borderColor={cardBorder}
                          >
                            <HStack spacing={2} mb={1}>
                              <Icon as={FiAward} color={useColorModeValue('gray.500', 'gray.300')} boxSize={4} />
                              <Text fontSize="11px" fontWeight={800} color={textColorMuted} textTransform="uppercase">
                                2º Lugar (Vice)
                              </Text>
                            </HStack>
                            <Text fontSize="14px" fontWeight={800} color={textPrimary} noOfLines={1}>
                              {podio.vice?.nomeAmigo || '—'}
                            </Text>
                            <Text fontSize="11px" color={textColorMuted} noOfLines={1}>
                              {podio.vice?.timeSorteado || ''}
                            </Text>
                          </Box>

                          {/* 3º Lugar */}
                          <Box
                            p={3}
                            borderRadius="lg"
                            bg={useColorModeValue('orange.50', 'rgba(205, 127, 50, 0.08)')}
                            border="1px solid"
                            borderColor={useColorModeValue('orange.200', 'rgba(205, 127, 50, 0.3)')}
                          >
                            <HStack spacing={2} mb={1}>
                              <Icon as={FiAward} color="#CD7F32" boxSize={4} />
                              <Text fontSize="11px" fontWeight={800} color="#CD7F32" textTransform="uppercase">
                                3º Lugar
                              </Text>
                            </HStack>
                            <Text fontSize="14px" fontWeight={800} color={textPrimary} noOfLines={1}>
                              {podio.terceiro?.nomeAmigo || '—'}
                            </Text>
                            <Text fontSize="11px" color={textColorMuted} noOfLines={1}>
                              {podio.terceiro?.timeSorteado || ''}
                            </Text>
                          </Box>
                        </SimpleGrid>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}
