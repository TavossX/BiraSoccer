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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiChevronUp,
  FiHelpCircle,
  FiInfo,
  FiRefreshCw,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { obterEloTier, obterRankingGrupo, DEFAULT_ELO } from '../services/eloService';
import type { EloTierInfo, GrupoMembro } from '../types/social';

interface RankingGlobalProps {
  grupoId: string;
  membrosIniciais?: GrupoMembro[];
}

export function RankingGlobal({ grupoId, membrosIniciais = [] }: RankingGlobalProps) {
  const navigate = useNavigate();
  const { isOpen: isInfoOpen, onOpen: onOpenInfo, onClose: onCloseInfo } = useDisclosure();

  const [membros, setMembros] = useState<GrupoMembro[]>(membrosIniciais);
  const [loading, setLoading] = useState(false);

  // Cores do Design System
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBgAlt = useColorModeValue('gray.50', 'gray.750');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const podiumTopBg = useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.08)');

  const carregarRanking = async () => {
    if (!grupoId) return;
    setLoading(true);
    const lista = await obterRankingGrupo(grupoId);
    if (lista.length > 0) {
      setMembros(lista);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarRanking();
  }, [grupoId]);

  // Lista ordenada por Elo (descendente)
  const rankingOrdenado = useMemo(() => {
    return [...membros].sort((a, b) => {
      const eloA = a.elo_rating ?? DEFAULT_ELO;
      const eloB = b.elo_rating ?? DEFAULT_ELO;
      return eloB - eloA;
    });
  }, [membros]);

  const top1 = rankingOrdenado[0];
  const top2 = rankingOrdenado[1];
  const top3 = rankingOrdenado[2];

  // Cálculo da barra de progresso até o próximo nível de Tier
  const calcularProgressoTier = (elo: number, tier: EloTierInfo) => {
    if (!tier.maxElo) return 100; // Tier máximo (Elite)
    const range = tier.maxElo - tier.minElo;
    const atual = elo - tier.minElo;
    return Math.min(100, Math.max(0, Math.round((atual / range) * 100)));
  };

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* ── BANNER DO LEADERBOARD & REGRAS ────────────────────────────── */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={{ base: 4, md: 6 }}
        boxShadow="sm"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="4px"
          bg="linear-gradient(90deg, #F94A29 0%, #FDBB00 50%, #805AD5 100%)"
        />

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'flex-start', sm: 'center' }}
          justify="space-between"
          gap={4}
        >
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={2}>
              <Icon as={FiAward} color="brand.500" boxSize={6} />
              <Heading fontSize={{ base: '20px', md: '24px' }} color="brand.500">
                Ranking Elo da Temporada
              </Heading>
            </HStack>
            <Text fontSize="13px" color={textSecondary}>
              Classificação contínua calculada dinamicamente após cada confronto oficial do grupo.
            </Text>
          </VStack>

          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="orange"
              leftIcon={<FiHelpCircle />}
              onClick={onOpenInfo}
              fontWeight={700}
            >
              Regras & Tiers
            </Button>
            <Tooltip label="Atualizar Ranking" hasArrow>
              <IconButton
                aria-label="Atualizar Ranking"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                colorScheme="orange"
                onClick={carregarRanking}
                isLoading={loading}
              />
            </Tooltip>
          </HStack>
        </Flex>
      </Box>

      {/* ── PÓDIO TOP 3 ───────────────────────────────────────────────── */}
      {rankingOrdenado.length >= 2 && (
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          {/* 🥈 2º Lugar */}
          {top2 && (
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="2xl"
              p={5}
              textAlign="center"
              boxShadow="sm"
              order={{ base: 2, sm: 1 }}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)' }}
              cursor="pointer"
              onClick={() => navigate(`/perfil/${top2.usuario_id}`)}
            >
              <Badge colorScheme="gray" variant="solid" fontSize="11px" px={3} py={0.5} borderRadius="full" mb={3}>
                🥈 2º LUGAR
              </Badge>
              <Avatar
                size="lg"
                mx="auto"
                mb={2}
                name={top2.perfil?.nome || 'Membro'}
                src={top2.perfil?.foto_base64 || undefined}
                border="3px solid #A0AEC0"
              />
              <Text fontWeight={800} fontSize="16px" color={textPrimary} noOfLines={1}>
                {top2.perfil?.nome || 'Jogador'}
              </Text>
              <Text fontSize="20px" fontWeight={900} color="gray.400" mt={1}>
                {top2.elo_rating ?? DEFAULT_ELO} <Text as="span" fontSize="12px">PTS</Text>
              </Text>
              {(() => {
                const tier = obterEloTier(top2.elo_rating ?? DEFAULT_ELO);
                return (
                  <Badge colorScheme={tier.colorScheme} mt={2} fontSize="11px" px={2} py={0.5}>
                    {tier.badge} {tier.nome}
                  </Badge>
                );
              })()}
            </Box>
          )}

          {/* 🥇 1º Lugar (Campeão / Líder) */}
          {top1 && (
            <Box
              bg={podiumTopBg}
              border="2px solid"
              borderColor="#FDBB00"
              borderRadius="2xl"
              p={6}
              textAlign="center"
              boxShadow="lg"
              order={{ base: 1, sm: 2 }}
              transform={{ base: 'none', sm: 'scale(1.04)' }}
              transition="all 0.2s"
              _hover={{ transform: { base: 'none', sm: 'scale(1.06)' } }}
              cursor="pointer"
              onClick={() => navigate(`/perfil/${top1.usuario_id}`)}
            >
              <Badge
                bg="linear-gradient(135deg, #FDBB00, #F94A29)"
                color="white"
                fontSize="12px"
                fontWeight={900}
                px={4}
                py={1}
                borderRadius="full"
                mb={3}
                boxShadow="0 0 12px rgba(253, 187, 0, 0.4)"
              >
                👑 LÍDER DA TEMPORADA
              </Badge>
              <Avatar
                size="xl"
                mx="auto"
                mb={2}
                name={top1.perfil?.nome || 'Líder'}
                src={top1.perfil?.foto_base64 || undefined}
                border="3px solid #FDBB00"
                boxShadow="0 0 16px rgba(253, 187, 0, 0.5)"
              />
              <Text fontWeight={900} fontSize="18px" color={textPrimary} noOfLines={1}>
                {top1.perfil?.nome || 'Campeão'}
              </Text>
              <Text fontSize="24px" fontWeight={900} color="brand.500" mt={1}>
                {top1.elo_rating ?? DEFAULT_ELO} <Text as="span" fontSize="13px">PTS</Text>
              </Text>
              {(() => {
                const tier = obterEloTier(top1.elo_rating ?? DEFAULT_ELO);
                return (
                  <Badge colorScheme={tier.colorScheme} mt={2} fontSize="12px" px={3} py={1} borderRadius="full">
                    {tier.badge} {tier.nome}
                  </Badge>
                );
              })()}
            </Box>
          )}

          {/* 🥉 3º Lugar */}
          {top3 && (
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="2xl"
              p={5}
              textAlign="center"
              boxShadow="sm"
              order={{ base: 3, sm: 3 }}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)' }}
              cursor="pointer"
              onClick={() => navigate(`/perfil/${top3.usuario_id}`)}
            >
              <Badge colorScheme="orange" variant="solid" bg="#CD7F32" color="white" fontSize="11px" px={3} py={0.5} borderRadius="full" mb={3}>
                🥉 3º LUGAR
              </Badge>
              <Avatar
                size="lg"
                mx="auto"
                mb={2}
                name={top3.perfil?.nome || 'Membro'}
                src={top3.perfil?.foto_base64 || undefined}
                border="3px solid #CD7F32"
              />
              <Text fontWeight={800} fontSize="16px" color={textPrimary} noOfLines={1}>
                {top3.perfil?.nome || 'Jogador'}
              </Text>
              <Text fontSize="20px" fontWeight={900} color="#CD7F32" mt={1}>
                {top3.elo_rating ?? DEFAULT_ELO} <Text as="span" fontSize="12px">PTS</Text>
              </Text>
              {(() => {
                const tier = obterEloTier(top3.elo_rating ?? DEFAULT_ELO);
                return (
                  <Badge colorScheme={tier.colorScheme} mt={2} fontSize="11px" px={2} py={0.5}>
                    {tier.badge} {tier.nome}
                  </Badge>
                );
              })()}
            </Box>
          )}
        </SimpleGrid>
      )}

      {/* ── TABELA GERAL DE CLASSIFICAÇÃO ELO ─────────────────────────── */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={{ base: 3, md: 6 }}
        boxShadow="sm"
        overflowX="auto"
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th w="60px" textAlign="center"># Pos</Th>
              <Th>Jogador</Th>
              <Th textAlign="center">Divisão / Tier</Th>
              <Th textAlign="right">Pontuação Elo</Th>
              <Th display={{ base: 'none', md: 'table-cell' }} w="180px">Progresso</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rankingOrdenado.map((membro, index) => {
              const elo = membro.elo_rating ?? DEFAULT_ELO;
              const tier = obterEloTier(elo);
              const progresso = calcularProgressoTier(elo, tier);
              const pos = index + 1;

              return (
                <Tr
                  key={membro.id}
                  transition="all 0.15s"
                  _hover={{ bg: cardBgAlt }}
                  cursor="pointer"
                  onClick={() => navigate(`/perfil/${membro.usuario_id}`)}
                >
                  {/* Posição */}
                  <Td textAlign="center" fontWeight={900}>
                    {pos === 1 ? (
                      <Badge bg="#FDBB00" color="white" borderRadius="full" px={2.5} py={0.5} fontSize="12px">
                        1º
                      </Badge>
                    ) : pos === 2 ? (
                      <Badge bg="gray.400" color="white" borderRadius="full" px={2.5} py={0.5} fontSize="12px">
                        2º
                      </Badge>
                    ) : pos === 3 ? (
                      <Badge bg="#CD7F32" color="white" borderRadius="full" px={2.5} py={0.5} fontSize="12px">
                        3º
                      </Badge>
                    ) : (
                      <Text color={textSecondary} fontSize="13px">
                        {pos}º
                      </Text>
                    )}
                  </Td>

                  {/* Jogador */}
                  <Td>
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={membro.perfil?.nome || 'Membro'}
                        src={membro.perfil?.foto_base64 || undefined}
                        border={pos <= 3 ? '2px solid' : 'none'}
                        borderColor={pos === 1 ? '#FDBB00' : pos === 2 ? 'gray.400' : '#CD7F32'}
                      />
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight={700} fontSize="14px" color={textPrimary} noOfLines={1}>
                          {membro.perfil?.nome || 'Jogador'}
                        </Text>
                        {membro.perfil?.steam_id && (
                          <Text fontSize="11px" color={textSecondary} noOfLines={1}>
                            {membro.perfil.steam_id}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Td>

                  {/* Divisão / Tier */}
                  <Td textAlign="center">
                    <Badge
                      colorScheme={tier.colorScheme}
                      fontSize="11px"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      fontWeight={800}
                    >
                      {tier.badge} {tier.nome}
                    </Badge>
                  </Td>

                  {/* Elo Rating */}
                  <Td textAlign="right">
                    <Text fontWeight={900} fontSize="16px" color={tier.cor}>
                      {elo}
                      <Text as="span" fontSize="11px" color={textSecondary} ml={1}>
                        pts
                      </Text>
                    </Text>
                  </Td>

                  {/* Progresso até o Próximo Tier */}
                  <Td display={{ base: 'none', md: 'table-cell' }}>
                    <VStack spacing={1} align="stretch">
                      <Flex justify="space-between" fontSize="10px" color={textSecondary}>
                        <Text>{tier.nome}</Text>
                        <Text>{tier.maxElo ? `${elo}/${tier.maxElo + 1}` : 'Nível Máximo'}</Text>
                      </Flex>
                      <Progress
                        value={progresso}
                        size="xs"
                        colorScheme={tier.colorScheme}
                        borderRadius="full"
                      />
                    </VStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* ── MODAL EXPLICATIVO: SISTEMA ELO & TIERS ───────────────────── */}
      <Modal isOpen={isInfoOpen} onClose={onCloseInfo} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder}>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FiAward} color="brand.500" />
              <Text fontSize="18px" fontWeight={800}>
                Como Funciona o Ranking Elo
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="13px" color={textSecondary}>
                O sistema **Elo Rating** mede a habilidade relativa dos jogadores com base no histórico de confrontos. A pontuação é dinâmica e recalcula automaticamente após cada partida jogada nos torneios do grupo.
              </Text>

              {/* Destaque das Regras */}
              <Box bg={cardBgAlt} p={4} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
                <VStack spacing={2} align="flex-start" fontSize="12px">
                  <HStack align="flex-start">
                    <Text color="brand.500" fontWeight={800}>•</Text>
                    <Text><strong>Pontuação Inicial:</strong> Todo novo membro inicia com <strong>1200 pontos</strong>.</Text>
                  </HStack>
                  <HStack align="flex-start">
                    <Text color="brand.500" fontWeight={800}>•</Text>
                    <Text><strong>Zebra / Underdog:</strong> Se um jogador de Elo baixo vence um de Elo alto, ele conquista muito mais pontos.</Text>
                  </HStack>
                  <HStack align="flex-start">
                    <Text color="brand.500" fontWeight={800}>•</Text>
                    <Text><strong>Favorito:</strong> Se o jogador de Elo superior vence, recebe um ganho moderado correspondente à expectativa.</Text>
                  </HStack>
                  <HStack align="flex-start">
                    <Text color="brand.500" fontWeight={800}>•</Text>
                    <Text><strong>Empates:</strong> Pontos são transferidos levemente do jogador de maior Elo para o de menor Elo.</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Tabela de Tiers */}
              <Heading fontSize="14px" color={textPrimary} mt={2}>
                Divisões e Tiers da Temporada:
              </Heading>

              <SimpleGrid columns={1} spacing={2}>
                <Flex justify="space-between" align="center" p={2.5} borderRadius="lg" bg={useColorModeValue('purple.50', 'rgba(128, 90, 213, 0.12)')}>
                  <HStack>
                    <Text fontSize="16px">👑</Text>
                    <Text fontWeight={800} fontSize="13px" color="purple.400">Elite</Text>
                  </HStack>
                  <Badge colorScheme="purple" fontSize="11px">1700+ pts</Badge>
                </Flex>

                <Flex justify="space-between" align="center" p={2.5} borderRadius="lg" bg={useColorModeValue('cyan.50', 'rgba(0, 180, 216, 0.12)')}>
                  <HStack>
                    <Text fontSize="16px">💎</Text>
                    <Text fontWeight={800} fontSize="13px" color="cyan.400">Diamante</Text>
                  </HStack>
                  <Badge colorScheme="cyan" fontSize="11px">1500 - 1699 pts</Badge>
                </Flex>

                <Flex justify="space-between" align="center" p={2.5} borderRadius="lg" bg={useColorModeValue('yellow.50', 'rgba(253, 187, 0, 0.12)')}>
                  <HStack>
                    <Text fontSize="16px">🥇</Text>
                    <Text fontWeight={800} fontSize="13px" color="yellow.500">Ouro</Text>
                  </HStack>
                  <Badge colorScheme="yellow" fontSize="11px">1300 - 1499 pts</Badge>
                </Flex>

                <Flex justify="space-between" align="center" p={2.5} borderRadius="lg" bg={useColorModeValue('gray.100', 'gray.700')}>
                  <HStack>
                    <Text fontSize="16px">🥈</Text>
                    <Text fontWeight={800} fontSize="13px" color="gray.300">Prata</Text>
                  </HStack>
                  <Badge colorScheme="gray" fontSize="11px">1100 - 1299 pts</Badge>
                </Flex>

                <Flex justify="space-between" align="center" p={2.5} borderRadius="lg" bg={useColorModeValue('orange.50', 'rgba(205, 127, 50, 0.12)')}>
                  <HStack>
                    <Text fontSize="16px">🥉</Text>
                    <Text fontWeight={800} fontSize="13px" color="#CD7F32">Bronze</Text>
                  </HStack>
                  <Badge colorScheme="orange" fontSize="11px">&lt; 1100 pts</Badge>
                </Flex>
              </SimpleGrid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
