import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select as ChakraSelect,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Box,
  Divider,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  Spinner,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { FiTrash2, FiUserPlus, FiSettings, FiUsers, FiShield } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { listarMeusGrupos } from '../services/gruposService';
import { useTorneioStore } from '../store/torneioStore';
import type { Torneio, Participante } from '../types/torneio';
import type { Grupo, Perfil } from '../types/social';

interface ModalConfiguracoesTorneioProps {
  isOpen: boolean;
  onClose: () => void;
  torneio: Torneio;
  participantes: Participante[];
  currentUserId: string | null;
  onTorneioAtualizado?: () => void;
}

export function ModalConfiguracoesTorneio({
  isOpen,
  onClose,
  torneio,
  participantes,
  currentUserId,
  onTorneioAtualizado,
}: ModalConfiguracoesTorneioProps) {
  const toast = useToast();
  const atualizarConfiguracoesTorneio = useTorneioStore((s) => s.atualizarConfiguracoesTorneio);
  const adicionarCoAdmin = useTorneioStore((s) => s.adicionarCoAdmin);
  const removerCoAdmin = useTorneioStore((s) => s.removerCoAdmin);

  const [nomeTorneio, setNomeTorneio] = useState(torneio.nome);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string>(torneio.grupoId || '');
  const [meusGrupos, setMeusGrupos] = useState<Grupo[]>([]);
  const [coAdminsPerfis, setCoAdminsPerfis] = useState<Perfil[]>([]);
  const [criadorPerfil, setCriadorPerfil] = useState<Perfil | null>(null);
  const [selectedNovoAdminId, setSelectedNovoAdminId] = useState<string>('');
  const [loadingPerfis, setLoadingPerfis] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const isCriador = Boolean(currentUserId && torneio.userId && currentUserId === torneio.userId);
  const isCoAdmin = Boolean(currentUserId && torneio.coAdmins?.includes(currentUserId));
  const hasAdminRights = isCriador || isCoAdmin;

  // Cores
  const modalBg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.750');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    setNomeTorneio(torneio.nome);
    setGrupoSelecionadoId(torneio.grupoId || '');
  }, [torneio]);

  // Carregar grupos do usuário
  useEffect(() => {
    if (currentUserId && isOpen) {
      listarMeusGrupos(currentUserId).then(setMeusGrupos);
    }
  }, [currentUserId, isOpen]);

  // Carregar perfis do criador e dos co-admins
  useEffect(() => {
    const fetchAdmins = async () => {
      if (!isOpen) return;
      setLoadingPerfis(true);

      // 1. Perfil do Criador
      if (torneio.userId) {
        const { data: cData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', torneio.userId)
          .maybeSingle();
        setCriadorPerfil(cData);
      }

      // 2. Perfis dos Co-Admins
      const coAdminsIds = torneio.coAdmins || [];
      if (coAdminsIds.length > 0) {
        const { data: coData } = await supabase
          .from('perfis')
          .select('*')
          .in('id', coAdminsIds);
        setCoAdminsPerfis(coData || []);
      } else {
        setCoAdminsPerfis([]);
      }

      setLoadingPerfis(false);
    };

    fetchAdmins();
  }, [torneio.userId, torneio.coAdmins, isOpen]);

  // Lista de participantes registrados que ainda NÃO são criador nem co-admins
  const candidatosCoAdmins = useMemo(() => {
    const adminIds = new Set<string>();
    if (torneio.userId) adminIds.add(torneio.userId);
    (torneio.coAdmins || []).forEach((id) => adminIds.add(id));

    // Participantes que têm conta no app e não são admins
    const list: { id: string; nome: string; foto?: string | null }[] = [];
    participantes.forEach((p) => {
      if (p.usuarioId && !adminIds.has(p.usuarioId)) {
        if (!list.some((item) => item.id === p.usuarioId)) {
          list.push({
            id: p.usuarioId,
            nome: p.nomeAmigo,
            foto: p.fotoUsuario,
          });
        }
      }
    });

    return list;
  }, [participantes, torneio.userId, torneio.coAdmins]);

  const handleSalvarGeral = async () => {
    if (!nomeTorneio.trim()) {
      toast({ title: 'O nome do torneio não pode ficar vazio.', status: 'warning', duration: 3000 });
      return;
    }

    setSalvando(true);
    try {
      await atualizarConfiguracoesTorneio({
        nome: nomeTorneio.trim(),
        grupoId: grupoSelecionadoId || null,
      });

      toast({
        title: 'Configurações salvas!',
        description: 'As informações do torneio foram atualizadas.',
        status: 'success',
        duration: 3000,
        position: 'top-right',
      });

      if (onTorneioAtualizado) onTorneioAtualizado();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleAdicionarCoAdmin = async () => {
    if (!selectedNovoAdminId) return;

    try {
      await adicionarCoAdmin(selectedNovoAdminId);
      setSelectedNovoAdminId('');

      // Atualiza lista local de perfis
      const { data: newAdminProfile } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', selectedNovoAdminId)
        .maybeSingle();

      if (newAdminProfile) {
        setCoAdminsPerfis((prev) => [...prev, newAdminProfile]);
      }

      toast({
        title: 'Co-Administrador Adicionado!',
        description: 'O usuário agora possui permissão para editar placares e gerenciar o torneio.',
        status: 'success',
        duration: 3000,
        position: 'top-right',
      });

      if (onTorneioAtualizado) onTorneioAtualizado();
    } catch (err: any) {
      toast({
        title: 'Erro ao adicionar co-admin',
        description: err?.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRemoverCoAdmin = async (adminId: string, nomeAdmin: string) => {
    const confirm = window.confirm(`Remover "${nomeAdmin}" dos co-administradores deste torneio?`);
    if (!confirm) return;

    try {
      await removerCoAdmin(adminId);
      setCoAdminsPerfis((prev) => prev.filter((p) => p.id !== adminId));

      toast({
        title: 'Co-Administrador removido',
        status: 'info',
        duration: 3000,
        position: 'top-right',
      });

      if (onTorneioAtualizado) onTorneioAtualizado();
    } catch (err: any) {
      toast({
        title: 'Erro ao remover co-admin',
        description: err?.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg={modalBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow="2xl">
        <ModalHeader borderBottom="1px solid" borderColor={borderColor} py={4}>
          <HStack spacing={3}>
            <Box p={2} borderRadius="lg" bg="rgba(249, 74, 41, 0.12)" color="brand.500">
              <FiSettings size={20} />
            </Box>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="18px" fontWeight={800} color={textPrimary}>
                Configurações do Torneio
              </Text>
              <Text fontSize="12px" color={textSecondary}>
                Gerencie nome, grupo vinculado e co-administradores.
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={6}>
          <Tabs variant="soft-rounded" colorScheme="orange">
            <TabList mb={4} gap={2}>
              <Tab fontSize="13px" fontWeight={700}>
                <HStack spacing={1.5}>
                  <FiSettings />
                  <Text>Geral</Text>
                </HStack>
              </Tab>
              <Tab fontSize="13px" fontWeight={700}>
                <HStack spacing={1.5}>
                  <FiShield />
                  <Text>Co-Admins ({(torneio.coAdmins || []).length})</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* ── Aba 1: Geral ───────────────────────────────────────── */}
              <TabPanel px={0} py={2}>
                <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="13px" fontWeight={700} color={textPrimary}>
                      Nome do Campeonato
                    </FormLabel>
                    <Input
                      value={nomeTorneio}
                      onChange={(e) => setNomeTorneio(e.target.value)}
                      placeholder="Ex: Copa dos Amigos 2026"
                      fontWeight={600}
                      borderRadius="lg"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="13px" fontWeight={700} color={textPrimary}>
                      Vincular a um Grupo de Amigos
                    </FormLabel>
                    <ChakraSelect
                      value={grupoSelecionadoId}
                      onChange={(e) => setGrupoSelecionadoId(e.target.value)}
                      borderRadius="lg"
                      fontWeight={600}
                    >
                      <option value="">Nenhum (Torneio Independente)</option>
                      {meusGrupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome}
                        </option>
                      ))}
                    </ChakraSelect>
                    <Text fontSize="11px" color={textSecondary} mt={1}>
                      Torneios vinculados aparecem no mural e no histórico do grupo.
                    </Text>
                  </FormControl>

                  <Box p={4} borderRadius="lg" bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <Text fontSize="12px" fontWeight={700} color={textSecondary} textTransform="uppercase" mb={2}>
                      Informações Fixas
                    </Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="11px" color={textSecondary}>
                          Formato
                        </Text>
                        <Badge colorScheme="purple" fontSize="11px">
                          {torneio.formato.toUpperCase()}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="11px" color={textSecondary}>
                          Partidas
                        </Text>
                        <Badge colorScheme="blue" fontSize="11px">
                          {torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}
                        </Badge>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <Button
                    colorScheme="orange"
                    size="md"
                    fontWeight={800}
                    onClick={handleSalvarGeral}
                    isLoading={salvando}
                  >
                    Salvar Alterações
                  </Button>
                </VStack>
              </TabPanel>

              {/* ── Aba 2: Co-Administradores ─────────────────────────── */}
              <TabPanel px={0} py={2}>
                <VStack spacing={5} align="stretch">
                  <Box>
                    <Text fontSize="13px" fontWeight={700} color={textPrimary} mb={1}>
                      Administradores com Permissão de Edição
                    </Text>
                    <Text fontSize="12px" color={textSecondary} mb={4}>
                      Co-admins podem lançar placares, avançar fases e gerenciar partidas simultaneamente.
                    </Text>

                    {/* Criador */}
                    <Box
                      p={3}
                      borderRadius="lg"
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      mb={3}
                    >
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={criadorPerfil?.nome || 'Criador'}
                            src={criadorPerfil?.foto_base64 || undefined}
                          />
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="14px" fontWeight={800} color={textPrimary}>
                              {criadorPerfil?.nome || 'Criador do Torneio'}
                            </Text>
                            <Text fontSize="11px" color={textSecondary}>
                              Host Principal
                            </Text>
                          </VStack>
                        </HStack>
                        <Badge colorScheme="orange" variant="solid" fontSize="10px">
                          CRIADOR
                        </Badge>
                      </HStack>
                    </Box>

                    {/* Lista de Co-Admins */}
                    {loadingPerfis ? (
                      <Flex justify="center" py={4}>
                        <Spinner size="sm" color="brand.500" />
                      </Flex>
                    ) : coAdminsPerfis.length === 0 ? (
                      <Text fontSize="12px" color={textSecondary} textAlign="center" py={2}>
                        Nenhum co-administrador adicionado ainda.
                      </Text>
                    ) : (
                      coAdminsPerfis.map((admin) => (
                        <Box
                          key={admin.id}
                          p={3}
                          borderRadius="lg"
                          bg={cardBg}
                          border="1px solid"
                          borderColor={borderColor}
                          mb={2}
                        >
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Avatar size="sm" name={admin.nome} src={admin.foto_base64 || undefined} />
                              <VStack align="flex-start" spacing={0}>
                                <Text fontSize="14px" fontWeight={700} color={textPrimary}>
                                  {admin.nome}
                                </Text>
                                <Text fontSize="11px" color={textSecondary}>
                                  Co-Administrador
                                </Text>
                              </VStack>
                            </HStack>

                            <HStack spacing={2}>
                              <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                                CO-ADMIN
                              </Badge>
                              {isCriador && (
                                <Tooltip label="Remover Co-Admin">
                                  <IconButton
                                    aria-label="Remover"
                                    icon={<FiTrash2 />}
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => handleRemoverCoAdmin(admin.id, admin.nome)}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </HStack>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* Formulário para Adicionar Novo Co-Admin (Apenas Criador) */}
                  {isCriador && (
                    <>
                      <Divider borderColor={borderColor} />
                      <Box>
                        <Text fontSize="13px" fontWeight={700} color={textPrimary} mb={2}>
                          Adicionar Novo Co-Admin
                        </Text>
                        {candidatosCoAdmins.length === 0 ? (
                          <Text fontSize="11px" color={textSecondary}>
                            Todos os participantes com conta no app já são administradores ou não há outros participantes registrados.
                          </Text>
                        ) : (
                          <HStack spacing={2}>
                            <ChakraSelect
                              placeholder="Selecione um participante..."
                              value={selectedNovoAdminId}
                              onChange={(e) => setSelectedNovoAdminId(e.target.value)}
                              borderRadius="lg"
                              size="sm"
                              fontWeight={600}
                              flex={1}
                            >
                              {candidatosCoAdmins.map((cand) => (
                                <option key={cand.id} value={cand.id}>
                                  {cand.nome}
                                </option>
                              ))}
                            </ChakraSelect>
                            <Button
                              colorScheme="teal"
                              size="sm"
                              leftIcon={<FiUserPlus />}
                              onClick={handleAdicionarCoAdmin}
                              isDisabled={!selectedNovoAdminId}
                            >
                              Adicionar
                            </Button>
                          </HStack>
                        )}
                      </Box>
                    </>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
