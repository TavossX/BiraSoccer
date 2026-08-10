import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Box,
  Button,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Image,
  useToast,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import { searchTeams, TimeFutebol } from '../services/apiFutebol';
import { useTorneioStore } from '../store/torneioStore';
import type { FormatoTorneio } from '../types/torneio';
import type { ParticipanteTorneioSelecao } from '../types/social';
import { FiShield, FiSlash, FiCheck, FiZap } from 'react-icons/fi';
import { Avatar } from '@chakra-ui/react';

// ─── Props ──────────────────────────────────────────────────────────────────────

interface ModalPickBanProps {
  isOpen: boolean;
  onClose: () => void;
  jogadores: ParticipanteTorneioSelecao[];
  formato: FormatoTorneio;
  idaEVolta: boolean;
  nomeTorneio: string;
}

// ─── Animações ──────────────────────────────────────────────────────────────────

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(249, 74, 41, 0.3); }
  50% { box-shadow: 0 0 20px rgba(249, 74, 41, 0.6); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Fisher-Yates Shuffle ───────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Componente ─────────────────────────────────────────────────────────────────

export function ModalPickBan({
  isOpen,
  onClose,
  jogadores,
  formato,
  idaEVolta,
  nomeTorneio,
}: ModalPickBanProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const criarTorneio = useTorneioStore((s) => s.criarTorneio);

  // ── Estado de Picks & Bans ──────────────────────────────────────────────────
  const [picks, setPicks] = useState<Record<number, TimeFutebol>>({});
  const [bans, setBans] = useState<Record<number, TimeFutebol>>({});

  // ── Set de IDs já utilizados (exclusão mútua) ──────────────────────────────
  const usedTeamIds = useMemo(() => {
    const ids = new Set<number>();
    Object.values(picks).forEach((t) => ids.add(t.id));
    Object.values(bans).forEach((t) => ids.add(t.id));
    return ids;
  }, [picks, bans]);

  // ── Contagem de picks feitos ───────────────────────────────────────────────
  const picksCount = Object.keys(picks).length;
  const allPicked = picksCount === jogadores.length;

  // ── Cores adaptativas (light / dark) ──────────────────────────────────────
  const modalBg = useColorModeValue('white', '#1a1a2e');
  const cardBg = useColorModeValue('gray.50', '#16213e');
  const cardBorder = useColorModeValue('gray.200', '#1a1a3e');
  const textPrimary = useColorModeValue('gray.800', '#F7FAFC');
  const textMuted = useColorModeValue('gray.500', '#A0AEC0');
  const textSubtle = useColorModeValue('gray.400', 'rgba(160,174,192,0.6)');
  const pickAccent = '#38B2AC';
  const banAccent = '#F56565';
  const brandOrange = '#f94a29';

  // Cores para selects
  const selectBg = useColorModeValue('white', 'rgba(56, 178, 172, 0.08)');
  const selectBorderIdle = useColorModeValue('gray.200', 'rgba(56, 178, 172, 0.3)');
  const selectMenuBg = useColorModeValue('white', '#1a1a2e');
  const selectOptionHoverBg = useColorModeValue('rgba(56, 178, 172, 0.08)', 'rgba(56, 178, 172, 0.15)');
  const selectBanBg = useColorModeValue('white', 'rgba(245, 101, 101, 0.08)');
  const selectBanBorderIdle = useColorModeValue('gray.200', 'rgba(245, 101, 101, 0.3)');
  const selectBanOptionHoverBg = useColorModeValue('rgba(245, 101, 101, 0.06)', 'rgba(245, 101, 101, 0.15)');
  const selectDisabledBg = useColorModeValue('gray.50', 'rgba(255,255,255,0.03)');
  const selectDisabledColor = useColorModeValue('gray.400', '#4A5568');
  const selectPlaceholderColor = useColorModeValue('#A0AEC0', '#718096');
  const selectClearColor = useColorModeValue('#A0AEC0', '#718096');

  // Cores de overlay / decoração
  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, rgba(249,74,41,0.08) 0%, rgba(253,187,0,0.04) 100%)',
    'linear-gradient(135deg, rgba(249,74,41,0.15) 0%, rgba(253,187,0,0.08) 100%)'
  );
  const headerBorder = useColorModeValue('rgba(249, 74, 41, 0.1)', 'rgba(249, 74, 41, 0.15)');
  const modalBorderColor = useColorModeValue('gray.200', 'rgba(249, 74, 41, 0.2)');
  const footerBg = useColorModeValue('gray.50', 'rgba(0,0,0,0.2)');
  const footerBorder = useColorModeValue('gray.100', 'rgba(249, 74, 41, 0.1)');

  // Cores de número/badge do player
  const numberBg = useColorModeValue('gray.100', 'rgba(255,255,255,0.05)');
  const numberBorder = useColorModeValue('gray.200', 'rgba(255,255,255,0.1)');
  const pickedBg = useColorModeValue('rgba(56, 178, 172, 0.08)', 'rgba(56, 178, 172, 0.15)');
  const pickedBorder = useColorModeValue('rgba(56, 178, 172, 0.2)', 'rgba(56, 178, 172, 0.3)');
  const cardHoverBorder = useColorModeValue('rgba(249, 74, 41, 0.2)', 'rgba(249, 74, 41, 0.3)');
  const cardPickedHoverBorder = useColorModeValue('rgba(56, 178, 172, 0.4)', 'rgba(56, 178, 172, 0.5)');
  const cardPickedBorder = useColorModeValue('rgba(56, 178, 172, 0.2)', 'rgba(56, 178, 172, 0.3)');

  const btnDisabledBg = useColorModeValue('gray.100', 'rgba(255,255,255,0.1)');
  const btnDisabledHoverBg = useColorModeValue('gray.100', 'rgba(255,255,255,0.1)');

  // ── Select Styles (Pick) ──────────────────────────────────────────────────
  const pickSelectStyles = useMemo(() => ({
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: '8px',
      minHeight: '38px',
      backgroundColor: selectBg,
      borderColor: state.isFocused ? pickAccent : selectBorderIdle,
      boxShadow: state.isFocused ? `0 0 0 1px ${pickAccent}` : 'none',
      color: textPrimary,
      '&:hover': { borderColor: pickAccent },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: selectMenuBg,
      border: `1px solid ${selectBorderIdle}`,
      borderRadius: '8px',
      zIndex: 20,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isDisabled
        ? selectDisabledBg
        : state.isFocused
        ? selectOptionHoverBg
        : 'transparent',
      color: state.isDisabled ? selectDisabledColor : textPrimary,
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.5 : 1,
    }),
    singleValue: (base: any) => ({ ...base, color: textPrimary }),
    input: (base: any) => ({ ...base, color: textPrimary }),
    placeholder: (base: any) => ({ ...base, color: selectPlaceholderColor, fontSize: '13px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({ ...base, color: pickAccent, padding: '4px 6px' }),
    clearIndicator: (base: any) => ({ ...base, color: selectClearColor, '&:hover': { color: textPrimary } }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  }), [selectBg, selectBorderIdle, selectMenuBg, selectOptionHoverBg, selectDisabledBg, selectDisabledColor, textPrimary, selectPlaceholderColor, selectClearColor]);

  // ── Select Styles (Ban) ───────────────────────────────────────────────────
  const banSelectStyles = useMemo(() => ({
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: '8px',
      minHeight: '38px',
      backgroundColor: selectBanBg,
      borderColor: state.isFocused ? banAccent : selectBanBorderIdle,
      boxShadow: state.isFocused ? `0 0 0 1px ${banAccent}` : 'none',
      color: textPrimary,
      '&:hover': { borderColor: banAccent },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: selectMenuBg,
      border: `1px solid ${selectBanBorderIdle}`,
      borderRadius: '8px',
      zIndex: 20,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isDisabled
        ? selectDisabledBg
        : state.isFocused
        ? selectBanOptionHoverBg
        : 'transparent',
      color: state.isDisabled ? selectDisabledColor : textPrimary,
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.5 : 1,
    }),
    singleValue: (base: any) => ({ ...base, color: textPrimary }),
    input: (base: any) => ({ ...base, color: textPrimary }),
    placeholder: (base: any) => ({ ...base, color: selectPlaceholderColor, fontSize: '13px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base: any) => ({ ...base, color: banAccent, padding: '4px 6px' }),
    clearIndicator: (base: any) => ({ ...base, color: selectClearColor, '&:hover': { color: textPrimary } }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  }), [selectBanBg, selectBanBorderIdle, selectMenuBg, selectBanOptionHoverBg, selectDisabledBg, selectDisabledColor, textPrimary, selectPlaceholderColor, selectClearColor]);

  // ── Load Options com exclusão mútua ───────────────────────────────────────
  const createLoadOptions = useCallback(
    (playerIdx: number, type: 'pick' | 'ban') => {
      return async (inputValue: string) => {
        if (inputValue.length < 2) return [];
        const results = await searchTeams(inputValue);

        // ID do time atualmente selecionado por ESTE jogador neste slot
        const ownSelection = type === 'pick' ? picks[playerIdx] : bans[playerIdx];
        const ownId = ownSelection?.id;

        return results.map((team) => {
          const isUsed = usedTeamIds.has(team.id) && team.id !== ownId;
          return {
            value: team,
            label: team.nome,
            isDisabled: isUsed,
          };
        });
      };
    },
    [picks, bans, usedTeamIds]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePick = (idx: number, selected: any) => {
    if (!selected) {
      setPicks((prev) => {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      });
    } else {
      setPicks((prev) => ({ ...prev, [idx]: selected.value }));
    }
  };

  const handleBan = (idx: number, selected: any) => {
    if (!selected) {
      setBans((prev) => {
        const copy = { ...prev };
        delete copy[idx];
        return copy;
      });
    } else {
      setBans((prev) => ({ ...prev, [idx]: selected.value }));
    }
  };

  // ── Gerar Campeonato ──────────────────────────────────────────────────────
  const handleGerarChaveamento = () => {
    if (!allPicked) return;

    const duplas = jogadores.map((j, i) => ({
      amigo: j.nome,
      time: picks[i].nome,
      logoTime: picks[i].logo,
      usuarioId: j.usuario_id || null,
      fotoUsuario: j.foto_base64 || null,
    }));

    const duplasEmbaralhadas = shuffle(duplas);

    criarTorneio({
      nome: nomeTorneio,
      formato,
      idaEVolta,
      duplas: duplasEmbaralhadas,
    });

    toast({
      title: 'Draft concluído!',
      description: 'Picks confirmados. Campeonato gerado com sucesso.',
      status: 'success',
      duration: 3000,
      position: 'top',
    });

    onClose();
    navigate(formato === 'matamata' ? '/torneio/matamata' : '/torneio/liga');
  };

  // ── Format Option Label (com logo) ────────────────────────────────────────
  const formatOptionLabel = (data: any) => (
    <HStack spacing={2} opacity={data.isDisabled ? 0.4 : 1}>
      <Image
        src={data.value.logo}
        boxSize="22px"
        objectFit="contain"
        borderRadius="sm"
        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'/%3E%3C/svg%3E"
      />
      <Text fontSize="13px" color={data.isDisabled ? selectDisabledColor : textPrimary}>
        {data.label}
      </Text>
      {data.isDisabled && (
        <Badge fontSize="9px" colorScheme="red" variant="subtle" borderRadius="2px">
          INDISPONÍVEL
        </Badge>
      )}
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
      <ModalContent
        bg={modalBg}
        border="1px solid"
        borderColor={modalBorderColor}
        borderRadius="16px"
        overflow="hidden"
        maxH="90vh"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <ModalHeader
          bg={headerGradient}
          borderBottom="1px solid"
          borderBottomColor={headerBorder}
          pb={4}
          pt={5}
          pr={14}
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Flex
                w="44px"
                h="44px"
                align="center"
                justify="center"
                bg="rgba(249, 74, 41, 0.12)"
                borderRadius="12px"
                border="1px solid rgba(249, 74, 41, 0.25)"
                animation={`${pulseGlow} 3s ease-in-out infinite`}
              >
                <Box as={FiShield} size="22px" color={brandOrange} />
              </Flex>
              <VStack spacing={0} align="flex-start">
                <Text
                  fontSize="18px"
                  fontWeight={800}
                  color={textPrimary}
                  letterSpacing="0.5px"
                  fontFamily="heading"
                >
                  PICK & BAN DRAFT
                </Text>
                <Text fontSize="11px" color={textMuted} fontWeight={500}>
                  Escolha seu time. Bloqueie o adversário.
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Badge
                bg={allPicked ? 'rgba(56, 178, 172, 0.12)' : 'rgba(249, 74, 41, 0.12)'}
                color={allPicked ? pickAccent : brandOrange}
                border="1px solid"
                borderColor={allPicked ? 'rgba(56, 178, 172, 0.25)' : 'rgba(249, 74, 41, 0.25)'}
                borderRadius="6px"
                px={3}
                py={1}
                fontSize="12px"
                fontWeight={700}
              >
                {allPicked ? '✓ ' : ''}{picksCount}/{jogadores.length} PICKS
              </Badge>
            </HStack>
          </Flex>
        </ModalHeader>
        <ModalCloseButton color={textMuted} _hover={{ color: textPrimary }} top={4} />

        {/* ── Body ────────────────────────────────────────────────── */}
        <ModalBody py={5} px={{ base: 4, md: 6 }}>
          <VStack spacing={3} align="stretch">
            {jogadores.map((jogador, idx) => {
              const hasPick = !!picks[idx];
              const hasBan = !!bans[idx];

              return (
                <Box
                  key={`player-${idx}`}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={hasPick ? cardPickedBorder : cardBorder}
                  borderRadius="12px"
                  p={{ base: 3, md: 4 }}
                  transition="all 0.25s ease"
                  animation={`${slideIn} 0.3s ease ${idx * 0.06}s both`}
                  _hover={{
                    borderColor: hasPick ? cardPickedHoverBorder : cardHoverBorder,
                    transform: 'translateY(-1px)',
                  }}
                >
                  <Flex
                    direction={{ base: 'column', md: 'row' }}
                    align={{ base: 'stretch', md: 'center' }}
                    gap={{ base: 3, md: 4 }}
                  >
                    {/* Nome do Jogador */}
                    <Flex
                      align="center"
                      minW={{ base: 'auto', md: '160px' }}
                      gap={2}
                      flexShrink={0}
                    >
                      <Flex
                        w="30px"
                        h="30px"
                        align="center"
                        justify="center"
                        borderRadius="8px"
                        bg={hasPick ? pickedBg : numberBg}
                        border="1px solid"
                        borderColor={hasPick ? pickedBorder : numberBorder}
                        flexShrink={0}
                        transition="all 0.2s"
                      >
                        {hasPick ? (
                          <Box as={FiCheck} size="14px" color={pickAccent} />
                        ) : (
                          <Text fontSize="12px" fontWeight={700} color={textMuted}>
                            {idx + 1}
                          </Text>
                        )}
                      </Flex>
                      <Avatar
                        size="xs"
                        name={jogador.nome}
                        src={jogador.foto_base64 || undefined}
                      />
                      <VStack spacing={0} align="flex-start">
                        <Text
                          fontSize="14px"
                          fontWeight={700}
                          color={textPrimary}
                          fontFamily="heading"
                          lineHeight="1.2"
                        >
                          {jogador.nome}
                          {jogador.isConvidado && (
                            <Text as="span" fontSize="10px" color="gray.400" ml={1}>
                              (Convidado)
                            </Text>
                          )}
                        </Text>
                        <Text fontSize="10px" color={textMuted}>
                          {hasPick && hasBan
                            ? 'Pick & Ban ✓'
                            : hasPick
                            ? 'Pick ✓'
                            : 'Aguardando...'}
                        </Text>
                      </VStack>
                    </Flex>

                    {/* PICK Select */}
                    <Box flex={1}>
                      <HStack spacing={1} mb={1}>
                        <Box as={FiShield} size="11px" color={pickAccent} />
                        <Text
                          fontSize="10px"
                          fontWeight={700}
                          color={pickAccent}
                          textTransform="uppercase"
                          letterSpacing="0.5px"
                        >
                          Pick
                        </Text>
                      </HStack>
                      <AsyncSelect
                        key={`pick-${idx}-${usedTeamIds.size}`}
                        cacheOptions
                        loadOptions={createLoadOptions(idx, 'pick')}
                        value={
                          picks[idx]
                            ? { value: picks[idx], label: picks[idx].nome, isDisabled: false }
                            : null
                        }
                        onChange={(selected: any) => handlePick(idx, selected)}
                        placeholder="Buscar time..."
                        isClearable
                        noOptionsMessage={({ inputValue }) =>
                          inputValue.length < 2
                            ? 'Digite ao menos 2 letras...'
                            : 'Nenhum time encontrado'
                        }
                        formatOptionLabel={formatOptionLabel}
                        isOptionDisabled={(option: any) => option.isDisabled}
                        styles={pickSelectStyles}
                        menuPortalTarget={document.body}
                      />
                    </Box>

                    {/* BAN Select */}
                    <Box flex={1}>
                      <HStack spacing={1} mb={1}>
                        <Box as={FiSlash} size="11px" color={banAccent} />
                        <Text
                          fontSize="10px"
                          fontWeight={700}
                          color={banAccent}
                          textTransform="uppercase"
                          letterSpacing="0.5px"
                        >
                          Ban
                          <Text as="span" fontWeight={400} color={textMuted} ml={1}>
                            (opcional)
                          </Text>
                        </Text>
                      </HStack>
                      <AsyncSelect
                        key={`ban-${idx}-${usedTeamIds.size}`}
                        cacheOptions
                        loadOptions={createLoadOptions(idx, 'ban')}
                        value={
                          bans[idx]
                            ? { value: bans[idx], label: bans[idx].nome, isDisabled: false }
                            : null
                        }
                        onChange={(selected: any) => handleBan(idx, selected)}
                        placeholder="Bloquear time..."
                        isClearable
                        noOptionsMessage={({ inputValue }) =>
                          inputValue.length < 2
                            ? 'Digite ao menos 2 letras...'
                            : 'Nenhum time encontrado'
                        }
                        formatOptionLabel={formatOptionLabel}
                        isOptionDisabled={(option: any) => option.isDisabled}
                        styles={banSelectStyles}
                        menuPortalTarget={document.body}
                      />
                    </Box>
                  </Flex>

                  {/* Badges visuais dos times selecionados */}
                  {(hasPick || hasBan) && (
                    <Flex mt={2} gap={2} flexWrap="wrap">
                      {hasPick && (
                        <Tooltip label={`Pick: ${picks[idx].nome}`}>
                          <HStack
                            spacing={1}
                            bg="rgba(56, 178, 172, 0.1)"
                            border="1px solid rgba(56, 178, 172, 0.2)"
                            borderRadius="6px"
                            px={2}
                            py={1}
                          >
                            <Image
                              src={picks[idx].logo}
                              boxSize="16px"
                              objectFit="contain"
                              borderRadius="sm"
                            />
                            <Text fontSize="11px" color={pickAccent} fontWeight={600}>
                              {picks[idx].nome}
                            </Text>
                          </HStack>
                        </Tooltip>
                      )}
                      {hasBan && (
                        <Tooltip label={`Ban: ${bans[idx].nome}`}>
                          <HStack
                            spacing={1}
                            bg="rgba(245, 101, 101, 0.1)"
                            border="1px solid rgba(245, 101, 101, 0.2)"
                            borderRadius="6px"
                            px={2}
                            py={1}
                          >
                            <Image
                              src={bans[idx].logo}
                              boxSize="16px"
                              objectFit="contain"
                              borderRadius="sm"
                              opacity={0.6}
                            />
                            <Text
                              fontSize="11px"
                              color={banAccent}
                              fontWeight={600}
                              textDecoration="line-through"
                            >
                              {bans[idx].nome}
                            </Text>
                          </HStack>
                        </Tooltip>
                      )}
                    </Flex>
                  )}
                </Box>
              );
            })}
          </VStack>
        </ModalBody>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <ModalFooter
          bg={footerBg}
          borderTop="1px solid"
          borderTopColor={footerBorder}
          py={4}
          px={6}
        >
          <Flex w="full" justify="space-between" align="center">
            <VStack spacing={0} align="flex-start">
              <Text fontSize="11px" color={textMuted}>
                {allPicked
                  ? '✅ Todos os picks confirmados!'
                  : `⏳ Faltam ${jogadores.length - picksCount} pick(s)`}
              </Text>
              <Text fontSize="10px" color={textSubtle}>
                A ordem dos confrontos será sorteada automaticamente.
              </Text>
            </VStack>
            <Button
              onClick={handleGerarChaveamento}
              isDisabled={!allPicked}
              bg={allPicked ? brandOrange : btnDisabledBg}
              color="white"
              size="lg"
              px={8}
              fontSize="14px"
              fontWeight={700}
              borderRadius="10px"
              leftIcon={<FiZap />}
              _hover={{
                bg: allPicked ? '#c73a1e' : btnDisabledHoverBg,
                transform: allPicked ? 'translateY(-1px)' : 'none',
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
              animation={allPicked ? `${pulseGlow} 2s ease-in-out infinite` : undefined}
            >
              GERAR CHAVEAMENTO
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
