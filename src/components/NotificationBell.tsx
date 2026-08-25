import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  excluirNotificacao,
} from '../services/notificacaoService';
import type { Notificacao, TipoNotificacao } from '../types/gamificacao';
import {
  FiBell,
  FiAward,
  FiActivity,
  FiInfo,
  FiCheck,
  FiTrash2,
  FiCheckCircle,
} from 'react-icons/fi';

interface NotificationBellProps {
  userId?: string | null;
}

function formatarTempoRelativo(dataIso: string): string {
  const agora = new Date();
  const data = new Date(dataIso);
  const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000);

  if (diffSegundos < 60) return 'Agora';
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `há ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `há ${diffDias}d`;
  return data.toLocaleDateString();
}

function getIconeETipoConfig(tipo: TipoNotificacao) {
  switch (tipo) {
    case 'conquista':
      return {
        icon: FiAward,
        color: 'yellow.400',
        bg: 'rgba(236, 201, 75, 0.15)',
        badgeText: 'CONQUISTA',
        badgeColor: 'yellow',
      };
    case 'partida':
      return {
        icon: FiActivity,
        color: 'brand.500',
        bg: 'rgba(249, 74, 41, 0.15)',
        badgeText: 'PARTIDA',
        badgeColor: 'orange',
      };
    case 'torneio':
      return {
        icon: FiAward,
        color: 'purple.400',
        bg: 'rgba(159, 122, 234, 0.15)',
        badgeText: 'TORNEIO',
        badgeColor: 'purple',
      };
    case 'sistema':
    default:
      return {
        icon: FiInfo,
        color: 'blue.400',
        bg: 'rgba(99, 179, 237, 0.15)',
        badgeText: 'AVISO',
        badgeColor: 'blue',
      };
  }
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);

  const popoverBg = useColorModeValue('white', 'gray.850');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const unreadBg = useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.1)');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const playChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Falha silenciosa de áudio
    }
  };

  useEffect(() => {
    if (!userId) return;

    // 1. Carregar lista inicial
    const carregar = async () => {
      setLoading(true);
      const lista = await listarNotificacoes(userId, 30);
      setNotificacoes(lista);
      setLoading(false);
    };
    carregar();

    // 2. Assinar canal Supabase Realtime
    const channel = supabase
      .channel(`notificacoes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const nova = payload.new as Notificacao;
          setNotificacoes((prev) => [nova, ...prev.filter((n) => n.id !== nova.id)]);
          playChime();

          toast({
            title: nova.titulo,
            description: nova.mensagem,
            status: nova.tipo === 'conquista' ? 'warning' : 'info',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const atualizada = payload.new as Notificacao;
          setNotificacoes((prev) =>
            prev.map((n) => (n.id === atualizada.id ? atualizada : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notificacoes',
        },
        (payload) => {
          const deletada = payload.old as { id?: string };
          if (deletada.id) {
            setNotificacoes((prev) => prev.filter((n) => n.id !== deletada.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const handleMarcarTodasLidas = async () => {
    if (!userId) return;
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await marcarTodasComoLidas(userId);
  };

  const handleClicarNotificacao = async (item: Notificacao) => {
    if (!item.lida) {
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, lida: true } : n))
      );
      await marcarComoLida(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  const handleExcluir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
    await excluirNotificacao(id);
  };

  if (!userId) return null;

  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            aria-label="Notificações"
            icon={<Icon as={FiBell} boxSize={5} />}
            variant="ghost"
            size="sm"
            borderRadius="full"
            _hover={{ bg: hoverBg }}
          />
          {naoLidas > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              bg="red.500"
              color="white"
              borderRadius="full"
              fontSize="10px"
              fontWeight={800}
              px={1.5}
              py={0.2}
              boxShadow="0 0 0 2px var(--chakra-colors-chakra-body-bg)"
              animation="pulse 2s infinite"
            >
              {naoLidas > 99 ? '99+' : naoLidas}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        bg={popoverBg}
        borderColor={borderColor}
        boxShadow="2xl"
        borderRadius="xl"
        width={{ base: '320px', sm: '380px' }}
        maxW="95vw"
        _focus={{ outline: 'none' }}
        overflow="hidden"
        zIndex={1400}
      >
        <PopoverArrow bg={popoverBg} />
        <PopoverCloseButton size="sm" top={3} right={3} />

        <PopoverHeader
          borderBottom="1px solid"
          borderColor={borderColor}
          py={3}
          px={4}
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <HStack justify="space-between" align="center" pr={6}>
            <HStack spacing={2}>
              <Icon as={FiBell} color="brand.500" />
              <Text fontSize="sm" fontWeight={800} color={textPrimary}>
                Notificações
              </Text>
              {naoLidas > 0 && (
                <Badge colorScheme="red" variant="solid" borderRadius="full" fontSize="10px">
                  {naoLidas} novas
                </Badge>
              )}
            </HStack>

            {naoLidas > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="orange"
                leftIcon={<FiCheck />}
                onClick={handleMarcarTodasLidas}
                fontWeight={700}
              >
                Ler todas
              </Button>
            )}
          </HStack>
        </PopoverHeader>

        <PopoverBody maxH="400px" overflowY="auto" p={2}>
          {loading ? (
            <Flex justify="center" align="center" py={8}>
              <VStack spacing={2}>
                <Spinner size="md" color="brand.500" thickness="3px" />
                <Text fontSize="xs" color={textSecondary}>Carregando avisos...</Text>
              </VStack>
            </Flex>
          ) : notificacoes.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={10} px={4} textAlign="center">
              <Icon as={FiCheckCircle} boxSize={10} color="green.400" mb={3} opacity={0.8} />
              <Text fontSize="sm" fontWeight={700} color={textPrimary} mb={1}>
                Tudo em dia!
              </Text>
              <Text fontSize="xs" color={textSecondary}>
                Você não possui notificações pendentes no momento.
              </Text>
            </Flex>
          ) : (
            <VStack spacing={1.5} align="stretch">
              {notificacoes.map((item) => {
                const config = getIconeETipoConfig(item.tipo);
                return (
                  <Box
                    key={item.id}
                    p={3}
                    borderRadius="lg"
                    cursor="pointer"
                    bg={item.lida ? 'transparent' : unreadBg}
                    border="1px solid"
                    borderColor={item.lida ? 'transparent' : 'orange.200'}
                    _hover={{ bg: hoverBg, transform: 'translateX(2px)' }}
                    transition="all 0.15s ease"
                    onClick={() => handleClicarNotificacao(item)}
                    position="relative"
                  >
                    <HStack align="flex-start" spacing={3}>
                      {/* Ícone estilizado do tipo */}
                      <Flex
                        boxSize="34px"
                        borderRadius="md"
                        bg={config.bg}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Icon as={config.icon} color={config.color} boxSize={4} />
                      </Flex>

                      {/* Conteúdo textual */}
                      <Box flex={1} minW={0}>
                        <HStack justify="space-between" align="center" mb={1}>
                          <Badge
                            colorScheme={config.badgeColor}
                            variant="subtle"
                            fontSize="9px"
                            borderRadius="sm"
                          >
                            {config.badgeText}
                          </Badge>
                          <Text fontSize="10px" color={textSecondary}>
                            {formatarTempoRelativo(item.created_at)}
                          </Text>
                        </HStack>

                        <Text
                          fontSize="13px"
                          fontWeight={item.lida ? 600 : 800}
                          color={textPrimary}
                          lineHeight="short"
                          mb={1}
                        >
                          {item.titulo}
                        </Text>
                        <Text fontSize="12px" color={textSecondary} lineHeight="1.3" noOfLines={2}>
                          {item.mensagem}
                        </Text>
                      </Box>

                      {/* Botão para deletar notificação individual */}
                      <IconButton
                        aria-label="Excluir notificação"
                        icon={<FiTrash2 size={12} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="gray"
                        opacity={0.5}
                        _hover={{ opacity: 1, color: 'red.400' }}
                        onClick={(e) => handleExcluir(e, item.id)}
                      />
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
