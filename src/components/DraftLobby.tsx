import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiLock,
  FiMenu,
  FiShare2,
  FiShield,
  FiShuffle,
  FiSlash,
  FiZap,
} from 'react-icons/fi';
import AsyncSelect from 'react-select/async';
import { supabase } from '../lib/supabase';
import { searchTeams, TimeFutebol } from '../services/apiFutebol';
import { listarMeusTimes, TimeCustomizado } from '../services/timesCustomizadosService';
import { useTorneioStore } from '../store/torneioStore';
import { ThemeToggle } from './ThemeToggle';

interface DraftLobbyProps {
  torneioId?: string;
  isReadOnly?: boolean;
}

export function DraftLobby({ torneioId: propTorneioId, isReadOnly }: DraftLobbyProps) {
  const toast = useToast();

  const torneio = useTorneioStore((s) => s.torneio);
  const participantes = useTorneioStore((s) => s.participantes);
  const sortearOrdemDraft = useTorneioStore((s) => s.sortearOrdemDraft);
  const reordenarParticipantesDraft = useTorneioStore((s) => s.reordenarParticipantesDraft);
  const confirmarPickBanParticipante = useTorneioStore((s) => s.confirmarPickBanParticipante);
  const finalizarDraftEIniciarTorneio = useTorneioStore((s) => s.finalizarDraftEIniciarTorneio);
  const atualizarDadosEmTempoReal = useTorneioStore((s) => s.atualizarDadosEmTempoReal);
  const carregarTorneioPublico = useTorneioStore((s) => s.carregarTorneioPublico);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [customTeams, setCustomTeams] = useState<TimeCustomizado[]>([]);
  const [selectedPick, setSelectedPick] = useState<TimeFutebol | null>(null);
  const [selectedBan, setSelectedBan] = useState<TimeFutebol | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const channelRef = useRef<any>(null);

  // ── Cores do Design System e Contraste ────────────────────────────────────
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBgAlt = useColorModeValue('gray.50', 'gray.750');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'gray.100');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const activeTurnBg = useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.12)');
  const activeTurnBorder = useColorModeValue('brand.500', 'brand.400');

  const selectBg = useColorModeValue('#FFFFFF', '#1A202C');
  const selectMenuBg = useColorModeValue('#FFFFFF', '#1A202C');
  const selectOptionHoverBg = useColorModeValue('#F7FAFC', '#2D3748');
  const selectBorderColor = useColorModeValue('#CBD5E0', '#4A5568');
  const selectTextColor = useColorModeValue('#1A202C', '#F7FAFC');
  const selectPlaceholderColor = useColorModeValue('#A0AEC0', '#718096');

  const idDoTorneio = propTorneioId || torneio?.id;

  // ── Carrega Usuário Atual e Times Customizados ───────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const ct = await listarMeusTimes(user.id);
        setCustomTeams(ct);
      }
    };
    fetchUser();
  }, []);

  // ── Se torneio não estiver carregado na store, carrega do Supabase ───────
  useEffect(() => {
    if (idDoTorneio && (!torneio || torneio.id !== idDoTorneio)) {
      carregarTorneioPublico(idDoTorneio).then((res) => {
        if (res?.user_id) {
          setHostUserId(res.user_id);
        }
      });
    }
  }, [idDoTorneio, torneio, carregarTorneioPublico]);

  const effectiveHostId = torneio?.userId || hostUserId;
  const isHost = Boolean(currentUserId && effectiveHostId && currentUserId === effectiveHostId);

  // ── Sincronização em Tempo Real (Supabase Realtime + Broadcast) ──────────
  useEffect(() => {
    if (!idDoTorneio) return;

    const channelName = `torneio_draft_${idDoTorneio}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    });

    // 1. Escuta alterações no banco de dados (postgres_changes)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'torneios_publicos',
        filter: `id=eq.${idDoTorneio}`,
      },
      (payload: any) => {
        if (payload.new && payload.new.dados) {
          atualizarDadosEmTempoReal(payload.new.dados);
          if (payload.new.user_id) {
            setHostUserId(payload.new.user_id);
          }
          setIsSubmitting(false);
        }
      }
    );

    // 2. Escuta broadcast de Pick/Ban enviado por jogadores não-host
    channel.on('broadcast', { event: 'submit_pick' }, async ({ payload }: any) => {
      // Apenas o cliente do Host processa o broadcast e atualiza o Supabase (RLS bypass oficial)
      if (isHost && payload) {
        const { participanteId, pick, ban } = payload;
        if (participanteId && pick) {
          await confirmarPickBanParticipante(participanteId, pick, ban);
        }
      }
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channelRef.current = channel;
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [idDoTorneio, isHost, atualizarDadosEmTempoReal, confirmarPickBanParticipante]);

  // ── Cálculos de Turno e Permissões ───────────────────────────────────────
  const turnoAtual = torneio?.turnoDraftAtual ?? 0;
  const participanteAtivo = participantes[turnoAtual] || null;
  const allPicksConfirmed =
    participantes.length > 0 && participantes.every((p) => p.pickConfirmado);

  const isMyTurn = Boolean(
    participanteAtivo &&
      currentUserId &&
      participanteAtivo.usuarioId === currentUserId &&
      !participanteAtivo.pickConfirmado
  );

  const isHostOverrideTurn = Boolean(
    isHost &&
      participanteAtivo &&
      !participanteAtivo.pickConfirmado &&
      (participanteAtivo.isConvidado ||
        !participanteAtivo.usuarioId ||
        participanteAtivo.usuarioId === currentUserId)
  );

  const canActNow = !isReadOnly && (isMyTurn || isHostOverrideTurn);

  // ── Limpa seleções ao mudar de turno ────────────────────────────────────
  useEffect(() => {
    setSelectedPick(null);
    setSelectedBan(null);
  }, [turnoAtual]);

  // ── Lista de Times Já Utilizados (Exclusão Mútua) ────────────────────────
  const usedTeamNames = useMemo(() => {
    const set = new Set<string>();
    participantes.forEach((p) => {
      if (p.timeSorteado) set.add(p.timeSorteado.trim().toLowerCase());
      if (p.timeBanido) set.add(p.timeBanido.trim().toLowerCase());
    });
    return set;
  }, [participantes]);

  const bannedTeamNames = useMemo(() => {
    const set = new Set<string>();
    participantes.forEach((p) => {
      if (p.timeBanido) set.add(p.timeBanido.trim().toLowerCase());
    });
    return set;
  }, [participantes]);

  const pickedTeamNames = useMemo(() => {
    const set = new Set<string>();
    participantes.forEach((p) => {
      if (p.timeSorteado) set.add(p.timeSorteado.trim().toLowerCase());
    });
    return set;
  }, [participantes]);

  // ── Busca de Times para Pick / Ban ───────────────────────────────────────
  const loadPickOptions = useCallback(
    async (inputValue: string) => {
      if (!inputValue || inputValue.length < 4) return [];
      const term = inputValue.trim().toLowerCase();

      // 1. Custom teams do usuário
      const customMatches: TimeFutebol[] = customTeams
        .filter((t) => t.nome.toLowerCase().includes(term))
        .map((t) => ({ id: Number(t.id) || 999999, nome: t.nome, logo: t.escudo_base64 }));

      // 2. Times da API
      const apiMatches = await searchTeams(inputValue);
      const combined = [...customMatches, ...apiMatches];

      // Remove duplicados de nomes
      const seen = new Set<string>();
      const unique = combined.filter((t) => {
        const key = t.nome.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filtra times já banidos ou já escolhidos
      return unique
        .filter((t) => !usedTeamNames.has(t.nome.trim().toLowerCase()))
        .map((t) => ({
          value: t,
          label: t.nome,
        }));
    },
    [customTeams, usedTeamNames]
  );

  const loadBanOptions = useCallback(
    async (inputValue: string) => {
      if (!inputValue || inputValue.length < 4) return [];
      const term = inputValue.trim().toLowerCase();

      const customMatches: TimeFutebol[] = customTeams
        .filter((t) => t.nome.toLowerCase().includes(term))
        .map((t) => ({ id: Number(t.id) || 999999, nome: t.nome, logo: t.escudo_base64 }));

      const apiMatches = await searchTeams(inputValue);
      const combined = [...customMatches, ...apiMatches];

      const seen = new Set<string>();
      const unique = combined.filter((t) => {
        const key = t.nome.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filtra times já banidos ou já escolhidos
      return unique
        .filter((t) => !usedTeamNames.has(t.nome.trim().toLowerCase()))
        .map((t) => ({
          value: t,
          label: t.nome,
        }));
    },
    [customTeams, usedTeamNames]
  );

  // ── Manipuladores de Ação ────────────────────────────────────────────────
  const handleSortearOrdem = async () => {
    if (!isHost) return;
    setIsShuffling(true);
    try {
      await sortearOrdemDraft();
      toast({
        title: 'Ordem Sorteada!',
        description: 'A ordem dos jogadores foi reembaralhada com sucesso.',
        status: 'info',
        duration: 3000,
        position: 'top-right',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao sortear ordem',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsShuffling(false);
    }
  };

  // ── Drag & Drop e Reordenação Manual dos Jogadores ───────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isHost || participantes.some((p) => p.pickConfirmado)) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isHost || participantes.some((p) => p.pickConfirmado)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isHost || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...participantes];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    await reordenarParticipantesDraft(items);
    toast({
      title: 'Ordem Atualizada!',
      description: 'A posição dos jogadores foi reordenada.',
      status: 'info',
      duration: 2000,
      position: 'top-right',
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveItem = async (fromIndex: number, direction: 'up' | 'down') => {
    if (!isHost || participantes.some((p) => p.pickConfirmado)) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= participantes.length) return;

    const items = [...participantes];
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);

    await reordenarParticipantesDraft(items);
  };

  const handleConfirmarEscolha = async () => {
    if (!participanteAtivo || !selectedPick) {
      toast({
        title: 'Selecione seu time',
        description: 'Você precisa selecionar um time para confirmar seu Pick.',
        status: 'warning',
        duration: 3000,
        position: 'top',
      });
      return;
    }

    if (selectedBan && selectedBan.nome === selectedPick.nome) {
      toast({
        title: 'Escolha inválida',
        description: 'Você não pode banir e escolher o mesmo time!',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
      return;
    }

    setIsSubmitting(true);

    const pickData = { nome: selectedPick.nome, logo: selectedPick.logo };
    const banData = selectedBan ? { nome: selectedBan.nome, logo: selectedBan.logo } : undefined;

    try {
      if (isHost) {
        // Se eu sou o Host, executo o update diretamente
        await confirmarPickBanParticipante(participanteAtivo.id, pickData, banData);
        toast({
          title: 'Pick & Ban Confirmado!',
          description: `${participanteAtivo.nomeAmigo} escolheu ${pickData.nome}.`,
          status: 'success',
          duration: 3000,
          position: 'top-right',
        });
      } else {
        // Se sou participante comum, emito o evento Broadcast para o Host aplicar (RLS Safe)
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'submit_pick',
            payload: {
              participanteId: participanteAtivo.id,
              pick: pickData,
              ban: banData,
            },
          });

          toast({
            title: 'Escolha Enviada!',
            description: 'Sua escolha foi transmitida e está sendo gravada na sala.',
            status: 'info',
            duration: 3000,
            position: 'top-right',
          });
        } else {
          throw new Error('Conexão em tempo real não estabelecida.');
        }
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar escolha',
        description: err.message || 'Tente novamente.',
        status: 'error',
        duration: 4000,
      });
      setIsSubmitting(false);
    }
  };

  const handleIniciarTorneio = async () => {
    if (!isHost) return;
    setIsStarting(true);
    try {
      await finalizarDraftEIniciarTorneio();
      toast({
        title: 'Chaveamento Gerado com Sucesso!',
        description: 'O torneio começou oficialmente!',
        status: 'success',
        duration: 4000,
        position: 'top',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao iniciar torneio',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
      setIsStarting(false);
    }
  };

  const handleCopiarLink = () => {
    const inviteUrl = `${window.location.origin}/convite/${idDoTorneio}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link da Sala Copiado!',
      description: 'Envie para seus amigos entrarem e fazerem seus picks!',
      status: 'success',
      duration: 4000,
      position: 'top-right',
    });
  };

  // ── Estilização dos Selects ──────────────────────────────────────────────
  const selectStyles = useMemo(
    () => ({
      control: (base: any, state: any) => ({
        ...base,
        borderRadius: '8px',
        minHeight: '44px',
        backgroundColor: selectBg,
        borderColor: state.isFocused ? '#F94A29' : selectBorderColor,
        boxShadow: state.isFocused ? '0 0 0 1px #F94A29' : 'none',
        '&:hover': { borderColor: '#F94A29' },
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: selectMenuBg,
        borderRadius: '10px',
        zIndex: 99999,
        border: `1px solid ${selectBorderColor}`,
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }),
      menuList: (base: any) => ({
        ...base,
        backgroundColor: selectMenuBg,
        padding: '6px',
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 99999,
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#F94A29'
          : state.isFocused
          ? selectOptionHoverBg
          : selectMenuBg,
        color: state.isSelected ? '#FFFFFF' : selectTextColor,
        borderRadius: '6px',
        margin: '2px 0',
        cursor: 'pointer',
      }),
      singleValue: (base: any) => ({
        ...base,
        color: selectTextColor,
        fontWeight: 600,
      }),
      input: (base: any) => ({
        ...base,
        color: selectTextColor,
      }),
      placeholder: (base: any) => ({
        ...base,
        color: selectPlaceholderColor,
        fontSize: '14px',
      }),
    }),
    [selectBg, selectMenuBg, selectOptionHoverBg, selectBorderColor, selectTextColor, selectPlaceholderColor]
  );

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={8}>
      <Box maxW="1100px" mx="auto">
        {/* ── Header da Sala de Draft ────────────────────────────────────── */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4} mb={6}>
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={3}>
              <Badge colorScheme="purple" variant="solid" fontSize="11px" px={3} py={1} borderRadius="full">
                MULTIPLAYER REALTIME
              </Badge>
              <Badge colorScheme="orange" variant="subtle" fontSize="11px" px={3} py={1} borderRadius="full">
                MODO PICK & BAN
              </Badge>
            </HStack>
            <Heading fontSize={{ base: '24px', md: '34px' }} color={textColor} fontWeight={900}>
              {torneio?.nome || 'Sala de Draft'}
            </Heading>
            <Text fontSize="sm" color={textColorMuted}>
              Cada jogador bane um time e escolhe o seu em turnos alternados.
            </Text>
          </VStack>

          <HStack spacing={3}>
            <ThemeToggle />
            <Button
              size="sm"
              variant="outline"
              colorScheme="orange"
              leftIcon={<FiShare2 />}
              onClick={handleCopiarLink}
            >
              Convidar Amigos
            </Button>
            {isHost && !allPicksConfirmed && (
              <Button
                size="sm"
                variant="solid"
                colorScheme="gray"
                leftIcon={<FiShuffle />}
                onClick={handleSortearOrdem}
                isLoading={isShuffling}
                isDisabled={participantes.some((p) => p.pickConfirmado)}
              >
                Sortear Ordem
              </Button>
            )}
          </HStack>
        </Flex>

        {/* ── Banner de Status do Turno ───────────────────────────────────── */}
        <Box
          bg={allPicksConfirmed ? 'green.500' : isMyTurn ? 'brand.500' : activeTurnBg}
          color={allPicksConfirmed || isMyTurn ? 'white' : textColor}
          border="1px solid"
          borderColor={allPicksConfirmed ? 'green.600' : activeTurnBorder}
          borderRadius="xl"
          p={5}
          mb={8}
          boxShadow="md"
          transition="all 0.3s ease"
        >
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Box
                p={3}
                borderRadius="full"
                bg={allPicksConfirmed || isMyTurn ? 'rgba(255,255,255,0.2)' : 'rgba(249,74,41,0.15)'}
              >
                <Icon
                  as={allPicksConfirmed ? FiCheck : isMyTurn ? FiZap : FiShield}
                  boxSize={6}
                  color={allPicksConfirmed || isMyTurn ? 'white' : 'brand.500'}
                />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Text
                  fontSize="12px"
                  fontWeight={800}
                  textTransform="uppercase"
                  letterSpacing="wide"
                  opacity={0.9}
                >
                  {allPicksConfirmed
                    ? 'DRAFT FINALIZADO'
                    : isMyTurn
                    ? 'SUA VEZ DE ESCOLHER!'
                    : `TURNO ${turnoAtual + 1} DE ${participantes.length}`}
                </Text>
                <Heading fontSize={{ base: '18px', md: '22px' }} fontWeight={800}>
                  {allPicksConfirmed
                    ? 'Todos os times foram definidos!'
                    : isMyTurn
                    ? 'Faça seu Ban e escolha seu Time agora!'
                    : participanteAtivo
                    ? `Aguardando escolha de: ${participanteAtivo.nomeAmigo}`
                    : 'Aguardando início do draft...'}
                </Heading>
              </VStack>
            </HStack>

            {allPicksConfirmed && isHost && (
              <Button
                colorScheme="whiteAlpha"
                bg="white"
                color="green.700"
                _hover={{ bg: 'gray.100' }}
                size="lg"
                fontWeight={800}
                leftIcon={<FiZap />}
                onClick={handleIniciarTorneio}
                isLoading={isStarting}
              >
                GERAR CHAVEAMENTO OFICIAL
              </Button>
            )}
          </Flex>
        </Box>

        {/* ── Formulário Ativo de Pick & Ban (Quando for a vez do usuário/Host) ── */}
        {canActNow && participanteAtivo && !allPicksConfirmed && (
          <Box
            bg={cardBg}
            border="2px solid"
            borderColor="brand.500"
            borderRadius="xl"
            p={6}
            mb={8}
            boxShadow="xl"
          >
            <VStack spacing={5} align="stretch">
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <HStack spacing={3}>
                  <Avatar
                    size="md"
                    name={participanteAtivo.nomeAmigo}
                    src={participanteAtivo.fotoUsuario || undefined}
                    border="2px solid #F94A29"
                  />
                  <VStack align="flex-start" spacing={0}>
                    <Text fontSize="12px" color="brand.500" fontWeight={700} textTransform="uppercase">
                      {isMyTurn ? 'Você está escolhendo' : `Host Override: Escolhendo por ${participanteAtivo.nomeAmigo}`}
                    </Text>
                    <Heading fontSize="20px" color={textColor}>
                      {participanteAtivo.nomeAmigo}
                    </Heading>
                  </VStack>
                </HStack>

                <Badge colorScheme="red" variant="subtle" fontSize="12px" px={3} py={1} borderRadius="md">
                  Exclusão Mútua Ativa (Sem times repetidos)
                </Badge>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Campo de BAN */}
                <Box
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('red.200', 'red.900')}
                  bg={useColorModeValue('red.50', 'rgba(245, 101, 101, 0.05)')}
                >
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiSlash} color="red.500" />
                    <Text fontSize="13px" fontWeight={800} color="red.500" textTransform="uppercase">
                      1. Banir um Time (Opcional)
                    </Text>
                  </HStack>
                  <Text fontSize="12px" color={textColorMuted} mb={3}>
                    Ninguém na copa poderá jogar com o time banido.
                  </Text>
                  <AsyncSelect
                    placeholder="Digite o time de ban..."
                    cacheOptions
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    loadOptions={loadBanOptions}
                    value={
                      selectedBan
                        ? {
                            value: selectedBan,
                            label: selectedBan.nome,
                          }
                        : null
                    }
                    onChange={(opt: any) => setSelectedBan(opt ? opt.value : null)}
                    isClearable
                    styles={selectStyles}
                    formatOptionLabel={(opt: any) => {
                      const team = opt?.value || opt;
                      const nome = team?.nome || opt?.label || '';
                      const logo = team?.logo;
                      return (
                        <HStack spacing={2}>
                          {logo && (
                            <Image src={logo} alt={nome} boxSize="20px" objectFit="contain" />
                          )}
                          <Text fontSize="14px" fontWeight={600}>
                            {nome}
                          </Text>
                        </HStack>
                      );
                    }}
                  />
                </Box>

                {/* Campo de PICK */}
                <Box
                  p={4}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('teal.200', 'teal.900')}
                  bg={useColorModeValue('teal.50', 'rgba(56, 178, 172, 0.05)')}
                >
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiShield} color="teal.500" />
                    <Text fontSize="13px" fontWeight={800} color="teal.500" textTransform="uppercase">
                      2. Escolher seu Time (Pick Obrigatório)
                    </Text>
                  </HStack>
                  <Text fontSize="12px" color={textColorMuted} mb={3}>
                    O time que você vai comandar durante todo o campeonato.
                  </Text>
                  <AsyncSelect
                    placeholder="Digite o time de pick..."
                    cacheOptions
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    loadOptions={loadPickOptions}
                    value={
                      selectedPick
                        ? {
                            value: selectedPick,
                            label: selectedPick.nome,
                          }
                        : null
                    }
                    onChange={(opt: any) => setSelectedPick(opt ? opt.value : null)}
                    isClearable
                    styles={selectStyles}
                    formatOptionLabel={(opt: any) => {
                      const team = opt?.value || opt;
                      const nome = team?.nome || opt?.label || '';
                      const logo = team?.logo;
                      return (
                        <HStack spacing={2}>
                          {logo && (
                            <Image src={logo} alt={nome} boxSize="20px" objectFit="contain" />
                          )}
                          <Text fontSize="14px" fontWeight={600}>
                            {nome}
                          </Text>
                        </HStack>
                      );
                    }}
                  />
                </Box>
              </SimpleGrid>

              <Button
                colorScheme="orange"
                size="lg"
                h="50px"
                fontWeight={800}
                leftIcon={<FiCheck />}
                onClick={handleConfirmarEscolha}
                isLoading={isSubmitting}
                isDisabled={!selectedPick}
              >
                CONFIRMAR ESCOLHA (FINALIZAR TURNO)
              </Button>
            </VStack>
          </Box>
        )}

        {/* ── Lista de Participantes e Slots do Draft ──────────────────────── */}
        {/* ── Lista de Participantes e Slots do Draft ──────────────────────── */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2} mb={4}>
          <Heading fontSize="20px" color={textColor} fontWeight={800}>
            Ordem do Draft ({participantes.length} Jogadores)
          </Heading>
          {isHost && !participantes.some((p) => p.pickConfirmado) && (
            <Badge colorScheme="orange" variant="subtle" fontSize="11px" px={2.5} py={1} borderRadius="md">
              Arraste os cards ou use as setas para reordenar
            </Badge>
          )}
        </Flex>

        <VStack spacing={3} align="stretch" mb={8}>
          {participantes.map((p, index) => {
            const isTurnoDestePlayer = index === turnoAtual && !p.pickConfirmado;
            const isMe = currentUserId && p.usuarioId === currentUserId;
            const canReorder = isHost && !participantes.some((part) => part.pickConfirmado);
            const isBeingDragged = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <Box
                key={p.id}
                bg={isTurnoDestePlayer ? activeTurnBg : cardBg}
                border="1px solid"
                borderColor={
                  isDragOver
                    ? 'brand.500'
                    : isTurnoDestePlayer
                    ? activeTurnBorder
                    : borderColor
                }
                borderTop={isDragOver ? '3px solid #F94A29' : undefined}
                borderRadius="xl"
                p={4}
                boxShadow={isTurnoDestePlayer ? 'md' : 'sm'}
                opacity={isBeingDragged ? 0.4 : 1}
                cursor={canReorder ? 'grab' : 'default'}
                _active={{ cursor: canReorder ? 'grabbing' : 'default' }}
                transition="all 0.2s"
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <HStack spacing={3}>
                    {/* Controles de Reordenação para o Host */}
                    {canReorder && (
                      <HStack spacing={1}>
                        <Tooltip label="Arraste para reposicionar">
                          <Box p={1} color={textColorMuted} _hover={{ color: 'brand.500' }} cursor="grab">
                            <Icon as={FiMenu} boxSize={4} />
                          </Box>
                        </Tooltip>
                        <VStack spacing={0}>
                          <IconButton
                            aria-label="Mover para cima"
                            icon={<FiChevronUp />}
                            size="xs"
                            variant="ghost"
                            h="16px"
                            minW="20px"
                            isDisabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                          />
                          <IconButton
                            aria-label="Mover para baixo"
                            icon={<FiChevronDown />}
                            size="xs"
                            variant="ghost"
                            h="16px"
                            minW="20px"
                            isDisabled={index === participantes.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                          />
                        </VStack>
                      </HStack>
                    )}

                    <Flex
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      bg={p.pickConfirmado ? 'green.500' : isTurnoDestePlayer ? 'brand.500' : cardBgAlt}
                      color={p.pickConfirmado || isTurnoDestePlayer ? 'white' : textColorMuted}
                      align="center"
                      justify="center"
                      fontWeight={800}
                      fontSize="13px"
                    >
                      {index + 1}º
                    </Flex>

                    <Avatar size="sm" name={p.nomeAmigo} src={p.fotoUsuario || undefined} />

                    <VStack align="flex-start" spacing={0}>
                      <HStack spacing={2}>
                        <Text fontWeight={800} fontSize="15px" color={textColor}>
                          {p.nomeAmigo}
                        </Text>
                        {isMe && (
                          <Badge colorScheme="blue" fontSize="10px">
                            VOCÊ
                          </Badge>
                        )}
                        {p.isConvidado && (
                          <Badge colorScheme="gray" fontSize="10px">
                            CONVIDADO
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="11px" color={textColorMuted}>
                        {p.pickConfirmado
                          ? 'Escolha realizada'
                          : isTurnoDestePlayer
                          ? 'Escolhendo agora...'
                          : 'Na fila de espera'}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Resultados do Pick e Ban deste jogador */}
                  <HStack spacing={3}>
                    {p.pickConfirmado ? (
                      <HStack spacing={3}>
                        {p.timeBanido && (
                          <HStack
                            bg={useColorModeValue('red.50', 'rgba(245, 101, 101, 0.1)')}
                            border="1px solid"
                            borderColor={useColorModeValue('red.200', 'red.800')}
                            px={3}
                            py={1.5}
                            borderRadius="md"
                            spacing={2}
                          >
                            <Icon as={FiSlash} color="red.500" boxSize={3.5} />
                            {p.logoTimeBanido && (
                              <Image src={p.logoTimeBanido} alt={p.timeBanido} boxSize="18px" objectFit="contain" />
                            )}
                            <Text fontSize="12px" fontWeight={700} color="red.500" noOfLines={1}>
                              {p.timeBanido}
                            </Text>
                          </HStack>
                        )}

                        <HStack
                          bg={useColorModeValue('teal.50', 'rgba(56, 178, 172, 0.1)')}
                          border="1px solid"
                          borderColor={useColorModeValue('teal.200', 'teal.800')}
                          px={3}
                          py={1.5}
                          borderRadius="md"
                          spacing={2}
                        >
                          <Icon as={FiShield} color="teal.500" boxSize={3.5} />
                          {p.logoTime && (
                            <Image src={p.logoTime} alt={p.timeSorteado} boxSize="18px" objectFit="contain" />
                          )}
                          <Text fontSize="13px" fontWeight={800} color="teal.600" _dark={{ color: 'teal.300' }} noOfLines={1}>
                            {p.timeSorteado}
                          </Text>
                        </HStack>
                      </HStack>
                    ) : isTurnoDestePlayer ? (
                      <HStack spacing={2}>
                        <Spinner size="xs" color="brand.500" />
                        <Badge colorScheme="orange" variant="solid" fontSize="11px" px={2} py={1}>
                          SUA VEZ
                        </Badge>
                      </HStack>
                    ) : (
                      <Badge colorScheme="gray" variant="subtle" fontSize="11px" px={2} py={1}>
                        <Icon as={FiLock} mr={1} /> AGUARDANDO
                      </Badge>
                    )}
                  </HStack>
                </Flex>
              </Box>
            );
          })}
        </VStack>

        {/* ── Resumo Geral de Bans e Picks ─────────────────────────────────── */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
            <HStack spacing={2} mb={3}>
              <Icon as={FiSlash} color="red.500" />
              <Heading fontSize="14px" color={textColor}>
                Times Banidos ({bannedTeamNames.size})
              </Heading>
            </HStack>
            {bannedTeamNames.size === 0 ? (
              <Text fontSize="12px" color={textColorMuted}>
                Nenhum time banido até o momento.
              </Text>
            ) : (
              <Flex wrap="wrap" gap={2}>
                {participantes
                  .filter((p) => p.timeBanido)
                  .map((p) => (
                    <Badge key={p.id} colorScheme="red" variant="subtle" fontSize="11px" px={2} py={1}>
                      <HStack spacing={1}>
                        <Icon as={FiSlash} />
                        <Text>{p.timeBanido}</Text>
                      </HStack>
                    </Badge>
                  ))}
              </Flex>
            )}
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={4}>
            <HStack spacing={2} mb={3}>
              <Icon as={FiShield} color="teal.500" />
              <Heading fontSize="14px" color={textColor}>
                Times Escolhidos ({pickedTeamNames.size})
              </Heading>
            </HStack>
            {pickedTeamNames.size === 0 ? (
              <Text fontSize="12px" color={textColorMuted}>
                Nenhum time escolhido até o momento.
              </Text>
            ) : (
              <Flex wrap="wrap" gap={2}>
                {participantes
                  .filter((p) => p.timeSorteado)
                  .map((p) => (
                    <Badge key={p.id} colorScheme="teal" variant="subtle" fontSize="11px" px={2} py={1}>
                      <HStack spacing={1}>
                        <Icon as={FiShield} />
                        <Text>{p.timeSorteado} ({p.nomeAmigo})</Text>
                      </HStack>
                    </Badge>
                  ))}
              </Flex>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
