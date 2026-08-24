import {
  Box,
  Flex,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  Tooltip,
  VStack,
  Image,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import type { Participante } from '../types/torneio';

// ─── Ordenação ────────────────────────────────────────────────────────────────
function ordenarParticipantes(
  lista: Participante[],
  partidas: ReturnType<typeof useTorneioStore.getState>['partidas']
): Participante[] {
  return [...lista].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    const sgA = a.golsPro - a.golsContra;
    const sgB = b.golsPro - b.golsContra;
    if (sgB !== sgA) return sgB - sgA;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    const confrontos = partidas.filter(
      (p) => p.finalizada &&
        ((p.participanteAId === a.id && p.participanteBId === b.id) ||
         (p.participanteAId === b.id && p.participanteBId === a.id))
    );
    let pontosA = 0, pontosB = 0;
    confrontos.forEach((p) => {
      const aJogouComoA = p.participanteAId === a.id;
      const ga = aJogouComoA ? (p.placarA ?? 0) : (p.placarB ?? 0);
      const gb = aJogouComoA ? (p.placarB ?? 0) : (p.placarA ?? 0);
      if (ga > gb) pontosA += 3;
      else if (ga < gb) pontosB += 3;
      else { pontosA += 1; pontosB += 1; }
    });
    return pontosB - pontosA;
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function TabelaClassificacao({ highlightTop4 = false }: { highlightTop4?: boolean }) {
  const navigate = useNavigate();
  const { participantes, partidas } = useTorneioStore();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const theadBg = useColorModeValue('gray.50', 'gray.750');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');

  const classificacao = useMemo(
    () => ordenarParticipantes(participantes, partidas),
    [participantes, partidas]
  );

  const totalJogos    = partidas.filter((p) => p.finalizada).length;
  const totalPartidas = partidas.length;

  if (classificacao.length === 0) {
    return (
      <Flex h="200px" align="center" justify="center">
        <Text fontSize="12px" color={textSecondary}>Nenhum participante cadastrado.</Text>
      </Flex>
    );
  }

  return (
    <Box>
      {/* Progresso */}
      <HStack mb={4} justify="space-between">
        <Text fontSize="12px" color={textSecondary} fontWeight={500}>
          Progresso:{' '}
          <Text as="span" fontWeight={700} color={textPrimary}>
            {totalJogos}/{totalPartidas}
          </Text>{' '}
          partidas
        </Text>
        <Badge
          colorScheme={totalJogos === totalPartidas ? "green" : "orange"}
          variant="solid"
          borderRadius="md"
          boxShadow="sm"
          px={3} py={1}
          fontSize="12px"
        >
          {totalJogos === totalPartidas ? 'FINALIZADO' : 'EM ANDAMENTO'}
        </Badge>
      </HStack>

      {/* ── Visualização Desktop (Tabela Completa) ────────────────── */}
      <Box
        display={{ base: 'none', md: 'block' }}
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="lg"
        boxShadow="sm"
        overflowX="auto"
      >
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr
              bg={theadBg}
              borderBottom="1px solid"
              borderColor={dividerColor}
            >
              {['#', 'Participante', 'P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'].map((col) => (
                <Th
                  key={col}
                  fontFamily="heading"
                  fontSize="13px"
                  fontWeight={800}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={textSecondary}
                  py={3}
                  px={col === '#' || col === 'P' ? 4 : 3}
                  textAlign={col === 'Participante' ? 'left' : 'center'}
                >
                  <Tooltip
                    label={
                      col === 'P' ? 'Pontos' : col === 'J' ? 'Jogos' :
                      col === 'V' ? 'Vitórias' : col === 'E' ? 'Empates' :
                      col === 'D' ? 'Derrotas' : col === 'GP' ? 'Gols Pró' :
                      col === 'GC' ? 'Gols Contra' : col === 'SG' ? 'Saldo de Gols' : col
                    }
                    placement="top"
                    hasArrow
                  >
                    <span style={{ cursor: 'default' }}>{col}</span>
                  </Tooltip>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {classificacao.map((p, idx) => {
              const pos = idx + 1;
              const sg  = p.golsPro - p.golsContra;
              const isTop4  = highlightTop4 && pos <= 4;
              const isLast2 = !highlightTop4 && pos > classificacao.length - 2 && classificacao.length > 3;
              const isFirst = pos === 1;

              const rowBg = isTop4
                ? (pos === 1 ? 'rgba(253,187,0,0.15)' : 'rgba(253,187,0,0.07)')
                : (isFirst ? 'rgba(249,74,41,0.1)' : isLast2 ? 'rgba(200,0,0,0.1)' : 'transparent');

              const leftBorderColor = isTop4
                ? '#FDBB00'
                : isFirst ? '#F94A29' : isLast2 ? '#C80000' : 'transparent';

              return (
                <Tr
                  key={p.id}
                  bg={rowBg}
                  borderBottom="1px solid"
                  borderColor={dividerColor}
                  position="relative"
                  transition="background 0.1s"
                  _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                >
                  {/* Posição com borda esquerda */}
                  <Td position="relative" px={4} py={3} textAlign="center" w="44px">
                    <Box
                      position="absolute"
                      left={0} top={0} bottom={0}
                      w="4px"
                      bg={leftBorderColor}
                    />
                    <Text
                      fontFamily="heading"
                      fontWeight={900}
                      fontSize="16px"
                      color={isTop4 ? 'brand.mustard' : isFirst ? '#F94A29' : textPrimary}
                    >
                      {pos}º
                    </Text>
                  </Td>

                  {/* Nome e Time */}
                  <Td py={3} px={3}>
                    <HStack spacing={2}>
                      <Avatar
                        size="xs"
                        name={p.nomeAmigo}
                        src={p.fotoUsuario || undefined}
                        cursor={p.usuarioId ? 'pointer' : 'default'}
                        onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                      />
                      <VStack
                        align="flex-start"
                        spacing={0}
                        cursor={p.usuarioId ? 'pointer' : 'default'}
                        onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                        _hover={p.usuarioId ? { opacity: 0.8 } : undefined}
                      >
                        <Text
                          fontFamily="heading"
                          fontWeight={700}
                          fontSize="15px"
                          color={textPrimary}
                        >
                          {p.nomeAmigo}
                        </Text>
                        <HStack spacing={1}>
                          {p.logoTime && <Image src={p.logoTime} boxSize="12px" objectFit="contain" />}
                          <Text fontSize="12px" fontWeight={500} color={textSecondary}>{p.timeSorteado}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Td>

                  {/* Pontos (destaque) */}
                  <Td py={3} px={4} textAlign="center">
                    <Text
                      fontFamily="heading"
                      fontWeight={900}
                      fontSize="18px"
                      color={textPrimary}
                    >
                      {p.pontos}
                    </Text>
                  </Td>

                  {/* J V E D */}
                  {[p.jogos, p.vitorias, p.empates, p.derrotas].map((val, i) => (
                    <Td key={i} py={3} px={3} textAlign="center">
                      <Text fontFamily="heading" fontSize="12px" fontWeight={600} color={textPrimary}>{val}</Text>
                    </Td>
                  ))}

                  {/* GP */}
                  <Td py={3} px={3} textAlign="center">
                    <Text fontFamily="heading" fontSize="12px" fontWeight={600} color={textPrimary}>{p.golsPro}</Text>
                  </Td>

                  {/* GC */}
                  <Td py={3} px={3} textAlign="center">
                    <Text fontFamily="heading" fontSize="12px" fontWeight={600} color={textPrimary}>{p.golsContra}</Text>
                  </Td>

                  {/* SG */}
                  <Td py={3} px={3} textAlign="center">
                    <Text
                      fontFamily="heading"
                      fontSize="12px"
                      fontWeight={700}
                      color={sg > 0 ? 'green.500' : sg < 0 ? 'red.500' : textSecondary}
                    >
                      {sg > 0 ? `+${sg}` : sg}
                    </Text>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* ── Visualização Mobile (Cards Verticais Empilhados) ─────────── */}
      <VStack display={{ base: 'flex', md: 'none' }} spacing={3} align="stretch">
        {classificacao.map((p, idx) => {
          const pos = idx + 1;
          const sg  = p.golsPro - p.golsContra;
          const isTop4  = highlightTop4 && pos <= 4;
          const isLast2 = !highlightTop4 && pos > classificacao.length - 2 && classificacao.length > 3;
          const isFirst = pos === 1;

          const cardBorderColor = isTop4
            ? '#FDBB00'
            : isFirst
            ? '#F94A29'
            : isLast2
            ? '#C80000'
            : cardBorder;

          const itemBg = isTop4
            ? (pos === 1 ? 'rgba(253,187,0,0.12)' : 'rgba(253,187,0,0.05)')
            : (isFirst ? 'rgba(249,74,41,0.08)' : cardBg);

          return (
            <Box
              key={p.id}
              bg={itemBg}
              border="1px solid"
              borderColor={cardBorderColor}
              borderRadius="xl"
              p={3.5}
              boxShadow="sm"
              position="relative"
              overflow="hidden"
            >
              {/* Borda de Destaque Esquerda */}
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                w="5px"
                bg={cardBorderColor}
              />

              <Flex justify="space-between" align="center" mb={2.5}>
                <HStack spacing={3} pl={1}>
                  <Flex
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg={isTop4 ? '#FDBB00' : isFirst ? '#F94A29' : useColorModeValue('gray.100', 'gray.700')}
                    color={isTop4 || isFirst ? 'white' : textPrimary}
                    align="center"
                    justify="center"
                    fontWeight={900}
                    fontSize="13px"
                  >
                    {pos}º
                  </Flex>

                  <Avatar
                    size="sm"
                    name={p.nomeAmigo}
                    src={p.fotoUsuario || undefined}
                    cursor={p.usuarioId ? 'pointer' : 'default'}
                    onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                  />

                  <VStack
                    align="flex-start"
                    spacing={0}
                    cursor={p.usuarioId ? 'pointer' : 'default'}
                    onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                  >
                    <Text fontWeight={800} fontSize="14px" color={textPrimary} noOfLines={1}>
                      {p.nomeAmigo}
                    </Text>
                    <HStack spacing={1}>
                      {p.logoTime && <Image src={p.logoTime} boxSize="13px" objectFit="contain" />}
                      <Text fontSize="11px" fontWeight={600} color={textSecondary} noOfLines={1}>
                        {p.timeSorteado}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                {/* Pontos em Destaque */}
                <VStack spacing={0} align="flex-end">
                  <Badge colorScheme="orange" variant="solid" fontSize="13px" px={2.5} py={0.5} borderRadius="md">
                    {p.pontos} PTS
                  </Badge>
                </VStack>
              </Flex>

              {/* Grid de Estatísticas Rápidas */}
              <Flex
                bg={useColorModeValue('whiteAlpha.700', 'blackAlpha.300')}
                borderRadius="lg"
                p={2}
                justify="space-around"
                align="center"
                border="1px solid"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
              >
                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    Jogos
                  </Text>
                  <Text fontSize="12px" fontWeight={800} color={textPrimary}>
                    {p.jogos}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    Vitórias
                  </Text>
                  <Text fontSize="12px" fontWeight={800} color="green.500">
                    {p.vitorias}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    Empates
                  </Text>
                  <Text fontSize="12px" fontWeight={800} color={textSecondary}>
                    {p.empates}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    Derrotas
                  </Text>
                  <Text fontSize="12px" fontWeight={800} color="red.500">
                    {p.derrotas}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    GP / GC
                  </Text>
                  <Text fontSize="12px" fontWeight={800} color={textPrimary}>
                    {p.golsPro}/{p.golsContra}
                  </Text>
                </VStack>

                <VStack spacing={0}>
                  <Text fontSize="9px" fontWeight={700} color={textSecondary} textTransform="uppercase">
                    Saldo
                  </Text>
                  <Text
                    fontSize="12px"
                    fontWeight={800}
                    color={sg > 0 ? 'green.500' : sg < 0 ? 'red.500' : textSecondary}
                  >
                    {sg > 0 ? `+${sg}` : sg}
                  </Text>
                </VStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {/* Legenda */}
      <HStack spacing={4} mt={4} flexWrap="wrap">
        {highlightTop4 ? (
          <HStack spacing={2}>
            <Box w="4px" h="16px" bg="#FDBB00" borderRadius="2px" />
            <Text fontSize="12px" fontWeight={500} color={textSecondary}>Top 4 — Classificados para Playoffs</Text>
          </HStack>
        ) : (
          <>
            <HStack spacing={2}>
              <Box w="4px" h="16px" bg="#F94A29" borderRadius="2px" />
              <Text fontSize="12px" fontWeight={500} color={textSecondary}>Campeão / Promoção</Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="4px" h="16px" bg="#C80000" borderRadius="2px" />
              <Text fontSize="12px" fontWeight={500} color={textSecondary}>Zona de Rebaixamento</Text>
            </HStack>
          </>
        )}
        <Text fontSize="12px" color={textSecondary}>
          Critérios: Pts → Saldo → GP → Confronto Direto
        </Text>
      </HStack>
    </Box>
  );
}
