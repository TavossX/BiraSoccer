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
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCheck,
  FiCopy,
  FiRefreshCw,
  FiSlash,
  FiTarget
} from 'react-icons/fi';
import { IoFlame } from 'react-icons/io5';
import { supabase } from '../lib/supabase';
import {
  CS2_ACTIVE_DUTY_MAPS,
  FormatoVeto,
  gerarPassosVeto,
  MapaFinalJogo,
  MapVetoStatusInfo
} from '../types/cs2Veto';

interface MapVetoLobbyProps {
  vetoId?: string;
  nomeTimeA?: string;
  nomeTimeB?: string;
  capitaoIdA?: string | null;
  capitaoIdB?: string | null;
  formatoInicial?: FormatoVeto;
  isReadOnly?: boolean;
}

export function MapVetoLobby({
  vetoId = 'lobby-cs2-demo',
  nomeTimeA = 'Team Alpha (CT)',
  nomeTimeB = 'Team Bravo (T)',
  capitaoIdA = null,
  capitaoIdB = null,
  formatoInicial = 'BO3',
  isReadOnly = false,
}: MapVetoLobbyProps) {
  const toast = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formato, setFormato] = useState<FormatoVeto>(formatoInicial);
  const [passoAtual, setPassoAtual] = useState<number>(0);
  const [mapasStatus, setMapasStatus] = useState<Record<string, MapVetoStatusInfo>>({});
  const [mapasFinais, setMapasFinais] = useState<MapaFinalJogo[]>([]);
  const [isConcluido, setIsConcluido] = useState<boolean>(false);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const channelRef = useRef<any>(null);

  // Cores do Design System
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const overlayBg = useColorModeValue('rgba(255,255,255,0.92)', 'rgba(11, 15, 25, 0.94)');

  const highlightA = '#F94A29'; // Brand Orange / Team A
  const highlightB = '#00B4D8'; // Cyan / Team B
  const colorDecider = '#FDBB00'; // Gold / Decider

  // Carrega Usuário Atual do Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        if (!hostUserId) setHostUserId(user.id);
      }
    };
    fetchUser();
  }, [hostUserId]);

  const isHost = Boolean(currentUserId && hostUserId && currentUserId === hostUserId);

  // Gera os passos de veto conforme o formato atual
  const passos = useMemo(() => {
    return gerarPassosVeto(formato, nomeTimeA, nomeTimeB);
  }, [formato, nomeTimeA, nomeTimeB]);

  const passoAtualInfo = passos[passoAtual] || null;

  // Verifica permissão para interagir
  const isTimeATurn = passoAtualInfo?.time === 'A';
  const isTimeBTurn = passoAtualInfo?.time === 'B';

  const isMyTurn = Boolean(
    (!isConcluido &&
      passoAtualInfo &&
      ((isTimeATurn && currentUserId && capitaoIdA && currentUserId === capitaoIdA) ||
        (isTimeBTurn && currentUserId && capitaoIdB && currentUserId === capitaoIdB)))
  );

  // Host override: pode agir se for o Host ou se os capitães não estiverem vinculados
  const canActNow =
    !isReadOnly &&
    !isConcluido &&
    (isMyTurn || isHost || (!capitaoIdA && !capitaoIdB));

  // ── Sincronização Realtime via WebSockets (Supabase Broadcast) ──────────
  useEffect(() => {
    if (!vetoId) return;

    const channel = supabase.channel(`cs2_veto_${vetoId}`, {
      config: { broadcast: { ack: true } },
    });

    // 1. Escuta sincronização do estado oficial disparada pelo Host
    channel.on('broadcast', { event: 'sync_veto_state' }, ({ payload }: { payload: any }) => {
      if (payload) {
        setFormato(payload.formato);
        setPassoAtual(payload.passoAtual);
        setMapasStatus(payload.mapasStatus || {});
        setMapasFinais(payload.mapasFinais || []);
        setIsConcluido(payload.concluido);
        if (payload.hostUserId) setHostUserId(payload.hostUserId);
        setIsSubmitting(false);
      }
    });

    // 2. Escuta ação submetida por um capitão remoto
    channel.on('broadcast', { event: 'submit_veto_action' }, async ({ payload }: { payload: any }) => {
      if (isHost && payload && payload.mapaId) {
        await processarAcaoVeto(payload.mapaId);
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
  }, [vetoId, isHost, passoAtual, formato, mapasStatus, mapasFinais, isConcluido]);

  // Função central de avanço do estado de veto
  const processarAcaoVeto = useCallback(
    async (mapaId: string) => {
      if (isConcluido || !passoAtualInfo) return;

      const mapObj = CS2_ACTIVE_DUTY_MAPS.find((m) => m.id === mapaId);
      if (!mapObj) return;

      // Verifica se o mapa já foi banido ou escolhido
      if (mapasStatus[mapaId] && mapasStatus[mapaId].status !== 'disponivel') {
        return;
      }

      setIsSubmitting(true);

      const novoStatus = { ...mapasStatus };
      const timeAtual = passoAtualInfo.time;
      const acaoAtual = passoAtualInfo.acao;
      const novosFinais = [...mapasFinais];

      if (acaoAtual === 'BAN') {
        novoStatus[mapaId] = {
          status: 'banido',
          acaoPor: timeAtual,
          passoIndice: passoAtual,
        };
      } else if (acaoAtual === 'PICK') {
        novoStatus[mapaId] = {
          status: 'escolhido',
          acaoPor: timeAtual,
          passoIndice: passoAtual,
          mapaOrdem: passoAtualInfo.mapaOrdem,
        };
        novosFinais.push({
          mapaId,
          mapaNome: mapObj.nome,
          ordem: passoAtualInfo.mapaOrdem || novosFinais.length + 1,
          escolhidoPor: timeAtual,
          tipo: 'PICK',
        });
      }

      const proximoPasso = passoAtual + 1;

      // Verifica se chegamos ao fim dos passos manuais
      if (proximoPasso >= passos.length) {
        // Encontra o 7º mapa restante (Decider)
        const mapasNaoDefinidos = CS2_ACTIVE_DUTY_MAPS.filter(
          (m) => !novoStatus[m.id] || novoStatus[m.id].status === 'disponivel'
        );

        if (mapasNaoDefinidos.length > 0) {
          const deciderMap = mapasNaoDefinidos[0];
          const ordemDecider = formato === 'BO1' ? 1 : 3;

          novoStatus[deciderMap.id] = {
            status: 'decider',
            acaoPor: 'DECIDER',
            passoIndice: proximoPasso,
            mapaOrdem: ordemDecider,
          };

          novosFinais.push({
            mapaId: deciderMap.id,
            mapaNome: deciderMap.nome,
            ordem: ordemDecider,
            escolhidoPor: 'DECIDER',
            tipo: 'DECIDER',
          });
        }

        // Ordena a lista final por ordem (1, 2, 3)
        novosFinais.sort((a, b) => a.ordem - b.ordem);

        setMapasStatus(novoStatus);
        setMapasFinais(novosFinais);
        setPassoAtual(proximoPasso);
        setIsConcluido(true);
        setIsSubmitting(false);

        // Broadcast oficial de conclusão
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'sync_veto_state',
            payload: {
              formato,
              passoAtual: proximoPasso,
              mapasStatus: novoStatus,
              mapasFinais: novosFinais,
              concluido: true,
              hostUserId: currentUserId,
            },
          });
        }
        return;
      }

      // Avança para o próximo passo
      setMapasStatus(novoStatus);
      setMapasFinais(novosFinais);
      setPassoAtual(proximoPasso);
      setIsSubmitting(false);

      // Broadcast oficial de sincronização
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'sync_veto_state',
          payload: {
            formato,
            passoAtual: proximoPasso,
            mapasStatus: novoStatus,
            mapasFinais: novosFinais,
            concluido: false,
            hostUserId: currentUserId,
          },
        });
      }
    },
    [isConcluido, passoAtualInfo, mapasStatus, mapasFinais, passoAtual, passos, formato, currentUserId]
  );

  // Clique no mapa pelo usuário
  const handleMapClick = async (mapaId: string) => {
    if (!canActNow || isSubmitting) return;

    if (isHost || isMyTurn || (!capitaoIdA && !capitaoIdB)) {
      await processarAcaoVeto(mapaId);
    } else if (channelRef.current) {
      setIsSubmitting(true);
      channelRef.current.send({
        type: 'broadcast',
        event: 'submit_veto_action',
        payload: {
          mapaId,
          passoIndice: passoAtual,
          time: passoAtualInfo?.time,
        },
      });
    }
  };

  // Resetar o Lobby de Veto
  const handleReset = () => {
    setPassoAtual(0);
    setMapasStatus({});
    setMapasFinais([]);
    setIsConcluido(false);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync_veto_state',
        payload: {
          formato,
          passoAtual: 0,
          mapasStatus: {},
          mapasFinais: [],
          concluido: false,
          hostUserId: currentUserId,
        },
      });
    }

    toast({
      title: 'Lobby de Veto Reiniciado',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Copiar log de veto formatado
  const handleCopyVetoLog = () => {
    let log = `🎮 VETO DE MAPAS CS2 (${formato})\n`;
    log += `⚔️ ${nomeTimeA} vs ${nomeTimeB}\n\n`;

    passos.forEach((p) => {
      const mapaEntry = Object.entries(mapasStatus).find(
        ([_, info]) => info.passoIndice === p.indice
      );
      if (mapaEntry) {
        const mapInfo = CS2_ACTIVE_DUTY_MAPS.find((m) => m.id === mapaEntry[0]);
        const emoji = p.acao === 'BAN' ? '❌ BAN' : '✅ PICK';
        log += `${emoji} [${p.time === 'A' ? nomeTimeA : nomeTimeB}]: ${mapInfo?.nome}\n`;
      }
    });

    const deciderEntry = Object.entries(mapasStatus).find(([_, info]) => info.status === 'decider');
    if (deciderEntry) {
      const deciderMap = CS2_ACTIVE_DUTY_MAPS.find((m) => m.id === deciderEntry[0]);
      log += `🏆 DECIDER: ${deciderMap?.nome}\n`;
    }

    log += `\n📋 Ordem dos Mapas:\n`;
    mapasFinais.forEach((m) => {
      log += `• Mapa ${m.ordem}: ${m.mapaNome} (${m.tipo === 'DECIDER' ? 'Desempate' : `Pick ${m.escolhidoPor === 'A' ? nomeTimeA : nomeTimeB}`})\n`;
    });

    navigator.clipboard.writeText(log);
    toast({
      title: 'Copiado para a Área de Transferência!',
      description: 'Pronto para colar no Discord ou WhatsApp.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <VStack spacing={6} align="stretch" w="full" maxW="1200px" mx="auto">
      {/* ── HEADER: PLACAR & CONTROLE DE FORMATO ─────────────────────── */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        boxShadow="xl"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="4px"
          bg={`linear-gradient(90deg, ${highlightA} 0%, #FDBB00 50%, ${highlightB} 100%)`}
        />

        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={4}
        >
          {/* Time A */}
          <HStack spacing={4} flex={1} justify={{ base: 'center', md: 'flex-start' }}>
            <Avatar
              size="lg"
              name={nomeTimeA}
              border={`3px solid ${highlightA}`}
              boxShadow={`0 0 14px rgba(249, 74, 41, 0.4)`}
            />
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={0}>
              <Badge colorScheme="orange" fontSize="10px" px={2} py={0.5} borderRadius="full">
                TIME A
              </Badge>
              <Heading fontSize={{ base: '18px', md: '20px' }} color={textPrimary} noOfLines={1}>
                {nomeTimeA}
              </Heading>
              <Text fontSize="11px" color={textSecondary}>
                Capitão: {capitaoIdA ? 'Vinculado' : 'Livre / Host'}
              </Text>
            </VStack>
          </HStack>

          {/* Centro: Formato & VS */}
          <VStack spacing={2} px={4}>
            <Badge
              bg="linear-gradient(135deg, #FDBB00, #F94A29)"
              color="white"
              fontSize="14px"
              fontWeight={900}
              px={4}
              py={1}
              borderRadius="md"
              letterSpacing="1px"
            >
              CS2 MAP VETO ({formato})
            </Badge>

            {/* Alternador de Formato (Host antes de começar) */}
            {passoAtual === 0 && !isConcluido && isHost && (
              <RadioGroup
                onChange={(val: FormatoVeto) => {
                  setFormato(val);
                  handleReset();
                }}
                value={formato}
                size="sm"
              >
                <Stack direction="row" spacing={4}>
                  <Radio value="BO1" colorScheme="orange">
                    <Text fontSize="12px" fontWeight={700}>BO1 (Único)</Text>
                  </Radio>
                  <Radio value="BO3" colorScheme="orange">
                    <Text fontSize="12px" fontWeight={700}>BO3 (Série)</Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            )}
          </VStack>

          {/* Time B */}
          <HStack spacing={4} flex={1} justify={{ base: 'center', md: 'flex-end' }}>
            <VStack align={{ base: 'center', md: 'flex-end' }} spacing={0} order={{ base: 2, md: 1 }}>
              <Badge colorScheme="cyan" fontSize="10px" px={2} py={0.5} borderRadius="full">
                TIME B
              </Badge>
              <Heading fontSize={{ base: '18px', md: '20px' }} color={textPrimary} noOfLines={1}>
                {nomeTimeB}
              </Heading>
              <Text fontSize="11px" color={textSecondary}>
                Capitão: {capitaoIdB ? 'Vinculado' : 'Livre / Host'}
              </Text>
            </VStack>
            <Avatar
              order={{ base: 1, md: 2 }}
              size="lg"
              name={nomeTimeB}
              border={`3px solid ${highlightB}`}
              boxShadow={`0 0 14px rgba(0, 180, 216, 0.4)`}
            />
          </HStack>
        </Flex>

        {/* Banner da Vez Ativa */}
        <Box
          mt={5}
          p={3}
          borderRadius="xl"
          bg={
            isConcluido
              ? useColorModeValue('yellow.50', 'rgba(253, 187, 0, 0.12)')
              : isTimeATurn
              ? useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.12)')
              : useColorModeValue('cyan.50', 'rgba(0, 180, 216, 0.12)')
          }
          border="1px solid"
          borderColor={
            isConcluido
              ? '#FDBB00'
              : isTimeATurn
              ? highlightA
              : highlightB
          }
          textAlign="center"
        >
          {isConcluido ? (
            <HStack justify="center" spacing={2}>
              <Icon as={FiCheck} color="#FDBB00" boxSize={5} />
              <Text fontSize="14px" fontWeight={800} color={textPrimary}>
                VETO CONCLUÍDO COM SUCESSO!
              </Text>
            </HStack>
          ) : (
            <HStack justify="center" spacing={2} flexWrap="wrap">
              <Icon
                as={passoAtualInfo?.acao === 'BAN' ? FiSlash : FiTarget}
                color={isTimeATurn ? highlightA : highlightB}
                boxSize={5}
              />
              <Text fontSize="14px" fontWeight={800} color={textPrimary}>
                {passoAtualInfo?.descricao.toUpperCase()}
              </Text>
              {canActNow && (
                <Badge colorScheme="green" variant="solid" fontSize="10px" px={2} borderRadius="full">
                  SUA VEZ DE AGIR
                </Badge>
              )}
            </HStack>
          )}
        </Box>
      </Box>

      {/* ── GRID DOS 7 MAPAS DA ROTAÇÃO ATIVA ────────────────────────── */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
        {CS2_ACTIVE_DUTY_MAPS.map((mapa) => {
          const statusInfo = mapasStatus[mapa.id];
          const isBanido = statusInfo?.status === 'banido';
          const isEscolhido = statusInfo?.status === 'escolhido';
          const isDecider = statusInfo?.status === 'decider';
          const isDisponivel = !statusInfo || statusInfo.status === 'disponivel';

          return (
            <Box
              key={mapa.id}
              position="relative"
              h="210px"
              borderRadius="2xl"
              overflow="hidden"
              border="2px solid"
              borderColor={
                isDecider
                  ? colorDecider
                  : isEscolhido
                  ? statusInfo?.acaoPor === 'A'
                    ? highlightA
                    : highlightB
                  : isBanido
                  ? 'red.600'
                  : cardBorder
              }
              boxShadow={
                isDecider
                  ? '0 0 20px rgba(253, 187, 0, 0.45)'
                  : isEscolhido
                  ? `0 0 16px ${statusInfo?.acaoPor === 'A' ? 'rgba(249, 74, 41, 0.4)' : 'rgba(0, 180, 216, 0.4)'}`
                  : 'md'
              }
              transition="all 0.25s ease-in-out"
              _hover={
                isDisponivel && canActNow
                  ? { transform: 'scale(1.03)', borderColor: 'brand.500', cursor: 'pointer' }
                  : {}
              }
              onClick={() => isDisponivel && handleMapClick(mapa.id)}
            >
              {/* Imagem de Fundo do Mapa */}
              <Image
                src={mapa.imagem}
                alt={mapa.nome}
                w="full"
                h="full"
                objectFit="cover"
                filter={isBanido ? 'grayscale(90%) brightness(35%)' : 'brightness(75%)'}
                transition="filter 0.3s"
              />

              {/* Degradê Inferior para Legibilidade */}
              <Box
                position="absolute"
                inset={0}
                bg="linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)"
              />

              {/* Header do Card (Código do Mapa & Local) */}
              <Flex position="absolute" top={3} left={3} right={3} justify="space-between" align="center">
                <Badge bg="rgba(0,0,0,0.65)" color="white" fontSize="10px" px={2} borderRadius="md">
                  {mapa.nomeCodigo}
                </Badge>
                <Text fontSize="10px" color="gray.300" fontWeight={600}>
                  {mapa.localizacao}
                </Text>
              </Flex>

              {/* Nome do Mapa e Descrição no Rodapé */}
              <Box position="absolute" bottom={3} left={3} right={3}>
                <Heading fontSize="22px" color="white" fontWeight={900} textShadow="0 2px 4px rgba(0,0,0,0.8)">
                  {mapa.nome}
                </Heading>
                <Text fontSize="10px" color="gray.300" noOfLines={1} mt={0.5}>
                  {mapa.descricao}
                </Text>
              </Box>

              {/* ── OVERLAY: MAPA BANIDO (Corte Diagonal) ─────────────── */}
              {isBanido && (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="rgba(155, 20, 20, 0.45)"
                  backdropFilter="blur(2px)"
                >
                  <VStack spacing={1}>
                    <Icon as={FiSlash} color="red.400" boxSize={10} />
                    <Badge colorScheme="red" variant="solid" fontSize="12px" px={3} py={1} borderRadius="full">
                      BANIDO ({statusInfo?.acaoPor === 'A' ? nomeTimeA : nomeTimeB})
                    </Badge>
                  </VStack>
                </Flex>
              )}

              {/* ── OVERLAY: MAPA ESCOLHIDO (PICK) ────────────────────── */}
              {isEscolhido && (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg={
                    statusInfo?.acaoPor === 'A'
                      ? 'rgba(249, 74, 41, 0.35)'
                      : 'rgba(0, 180, 216, 0.35)'
                  }
                  backdropFilter="blur(1px)"
                >
                  <VStack spacing={1}>
                    <Icon as={FiTarget} color="white" boxSize={8} />
                    <Badge
                      colorScheme={statusInfo?.acaoPor === 'A' ? 'orange' : 'cyan'}
                      variant="solid"
                      fontSize="13px"
                      fontWeight={900}
                      px={3}
                      py={1}
                      borderRadius="full"
                      boxShadow="lg"
                    >
                      MAPA {statusInfo?.mapaOrdem} (PICK {statusInfo?.acaoPor === 'A' ? nomeTimeA : nomeTimeB})
                    </Badge>
                  </VStack>
                </Flex>
              )}

              {/* ── OVERLAY: MAPA DECIDER ──────────────────────────────── */}
              {isDecider && (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="rgba(253, 187, 0, 0.35)"
                  backdropFilter="blur(1px)"
                >
                  <VStack spacing={1}>
                    <Icon as={IoFlame} color="#FDBB00" boxSize={10} />
                    <Badge
                      bg="#FDBB00"
                      color="gray.900"
                      fontSize="13px"
                      fontWeight={900}
                      px={3}
                      py={1}
                      borderRadius="full"
                      boxShadow="0 0 12px rgba(253, 187, 0, 0.8)"
                    >
                      MAPA {statusInfo?.mapaOrdem} (DECIDER)
                    </Badge>
                  </VStack>
                </Flex>
              )}

              {/* Botão de Ação Hover quando disponível */}
              {isDisponivel && canActNow && (
                <Box
                  position="absolute"
                  inset={0}
                  bg="rgba(0,0,0,0.55)"
                  opacity={0}
                  _hover={{ opacity: 1 }}
                  transition="opacity 0.2s"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Button
                    size="sm"
                    colorScheme={passoAtualInfo?.acao === 'BAN' ? 'red' : 'green'}
                    leftIcon={passoAtualInfo?.acao === 'BAN' ? <FiSlash /> : <FiTarget />}
                    fontWeight={800}
                  >
                    {passoAtualInfo?.acao === 'BAN' ? 'BANIR MAPA' : 'ESCOLHER (PICK)'}
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </SimpleGrid>

      {/* ── BARRA DE PROGRESSO DOS PASSOS ─────────────────────────────── */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={4}
        boxShadow="sm"
      >
        <Text fontSize="12px" fontWeight={800} color={textSecondary} textTransform="uppercase" mb={3}>
          Sequência de Vetos ({passoAtual}/{passos.length})
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={2}>
          {passos.map((p, idx) => {
            const isFeito = idx < passoAtual;
            const isAtual = idx === passoAtual && !isConcluido;

            return (
              <Box
                key={idx}
                p={2}
                borderRadius="lg"
                bg={
                  isAtual
                    ? useColorModeValue('orange.100', 'rgba(249, 74, 41, 0.2)')
                    : isFeito
                    ? useColorModeValue('gray.100', 'gray.750')
                    : 'transparent'
                }
                border="1px solid"
                borderColor={isAtual ? highlightA : isFeito ? cardBorder : 'transparent'}
                textAlign="center"
              >
                <Badge
                  colorScheme={p.time === 'A' ? 'orange' : 'cyan'}
                  fontSize="9px"
                  mb={1}
                >
                  {p.time === 'A' ? 'TIME A' : 'TIME B'}
                </Badge>
                <Text fontSize="11px" fontWeight={800} color={textPrimary} noOfLines={1}>
                  {p.acao} {p.mapaOrdem ? `(M${p.mapaOrdem})` : ''}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* ── PAINEL DE CONCLUSÃO / ORDEM FINAL DOS JOGOS ──────────────── */}
      {isConcluido && (
        <Box
          bg={cardBg}
          border="2px solid"
          borderColor="#FDBB00"
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
          boxShadow="xl"
        >
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            gap={4}
            mb={4}
          >
            <VStack align="flex-start" spacing={0}>
              <Heading fontSize="18px" color="#FDBB00">
                🏆 Ordem Oficial dos Mapas da Partida
              </Heading>
              <Text fontSize="12px" color={textSecondary}>
                Configuração pronta para o servidor e transmissão ao vivo.
              </Text>
            </VStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="orange"
                leftIcon={<FiCopy />}
                onClick={handleCopyVetoLog}
                fontWeight={700}
              >
                Copiar Log do Veto
              </Button>
              {isHost && (
                <IconButton
                  aria-label="Reiniciar Veto"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="outline"
                  colorScheme="gray"
                  onClick={handleReset}
                />
              )}
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: formato === 'BO1' ? 1 : 3 }} spacing={4}>
            {mapasFinais.map((mapa) => (
              <Box
                key={mapa.mapaId}
                bg={useColorModeValue('gray.50', 'gray.750')}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="xl"
                p={4}
                textAlign="center"
              >
                <Badge
                  colorScheme={
                    mapa.tipo === 'DECIDER'
                      ? 'yellow'
                      : mapa.escolhidoPor === 'A'
                      ? 'orange'
                      : 'cyan'
                  }
                  fontSize="11px"
                  px={3}
                  py={0.5}
                  borderRadius="full"
                  mb={2}
                >
                  MAPA {mapa.ordem} • {mapa.tipo === 'DECIDER' ? 'DESEMPATE' : `PICK ${mapa.escolhidoPor === 'A' ? nomeTimeA : nomeTimeB}`}
                </Badge>
                <Heading fontSize="20px" color={textPrimary}>
                  {mapa.mapaNome}
                </Heading>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
}
