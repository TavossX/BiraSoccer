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
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiRepeat,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiCrosshair,
  FiCheckCircle,
} from 'react-icons/fi';
import { IoFootball } from 'react-icons/io5';
import { calcularH2HDeTorneios, calcularHistoricoRivalidade } from '../store/torneioStore';
import type { EstatisticasH2H, GrupoMembro } from '../types/social';

interface RivalidadeH2HProps {
  grupoId: string;
  membros: GrupoMembro[];
  torneiosPreCarregados?: any[];
}

export function RivalidadeH2H({
  grupoId,
  membros,
  torneiosPreCarregados,
}: RivalidadeH2HProps) {
  // Lista de membros válidos com ID
  const membrosValidos = useMemo(
    () => membros.filter((m) => Boolean(m.usuario_id)),
    [membros]
  );

  // Estados dos dois jogadores selecionados
  const [jogadorAId, setJogadorAId] = useState<string>(
    membrosValidos[0]?.usuario_id || ''
  );
  const [jogadorBId, setJogadorBId] = useState<string>(
    membrosValidos[1]?.usuario_id || membrosValidos[0]?.usuario_id || ''
  );

  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState<EstatisticasH2H | null>(null);

  // Cores do Design System
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBgAlt = useColorModeValue('gray.50', 'gray.750');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const vsBoxBg = useColorModeValue('gray.100', 'gray.900');
  const highlightA = '#F94A29'; // Brand Orange
  const highlightB = '#00B4D8'; // Cyan e-Sports

  // Inicializa jogadores se a lista de membros carregar depois
  useEffect(() => {
    if (!jogadorAId && membrosValidos[0]) {
      setJogadorAId(membrosValidos[0].usuario_id);
    }
    if ((!jogadorBId || jogadorBId === jogadorAId) && membrosValidos[1]) {
      setJogadorBId(membrosValidos[1].usuario_id);
    }
  }, [membrosValidos, jogadorAId, jogadorBId]);

  // Recalcula o H2H quando os jogadores mudam
  useEffect(() => {
    const carregarH2H = async () => {
      if (!jogadorAId || !jogadorBId || jogadorAId === jogadorBId) {
        setEstatisticas(null);
        return;
      }

      setLoading(true);

      if (torneiosPreCarregados && torneiosPreCarregados.length > 0) {
        // Usa torneios já carregados em memória
        const stats = calcularH2HDeTorneios(
          jogadorAId,
          jogadorBId,
          torneiosPreCarregados
        );
        setEstatisticas(stats);
      } else {
        // Consulta no Supabase
        const stats = await calcularHistoricoRivalidade(
          jogadorAId,
          jogadorBId,
          grupoId
        );
        setEstatisticas(stats);
      }

      setLoading(false);
    };

    carregarH2H();
  }, [jogadorAId, jogadorBId, grupoId, torneiosPreCarregados]);

  // Inverter jogadores (Swap sides)
  const handleInverterJogadores = () => {
    const temp = jogadorAId;
    setJogadorAId(jogadorBId);
    setJogadorBId(temp);
  };

  const membroA = membrosValidos.find((m) => m.usuario_id === jogadorAId);
  const membroB = membrosValidos.find((m) => m.usuario_id === jogadorBId);

  // Cálculos de proporção para barras visuais
  const totalJogos = estatisticas?.totalJogos || 0;
  const vitoriasA = estatisticas?.vitoriasA || 0;
  const vitoriasB = estatisticas?.vitoriasB || 0;
  const empates = estatisticas?.empates || 0;
  const golsA = estatisticas?.golsA || 0;
  const golsB = estatisticas?.golsB || 0;
  const totalGols = golsA + golsB;

  const pctVitA = totalJogos > 0 ? (vitoriasA / totalJogos) * 100 : 0;
  const pctVitB = totalJogos > 0 ? (vitoriasB / totalJogos) * 100 : 0;
  const pctEmp = totalJogos > 0 ? (empates / totalJogos) * 100 : 0;

  const pctGolsA = totalGols > 0 ? (golsA / totalGols) * 100 : 50;
  const pctGolsB = totalGols > 0 ? (golsB / totalGols) * 100 : 50;

  const mediaGolsA = totalJogos > 0 ? (golsA / totalJogos).toFixed(1) : '0.0';
  const mediaGolsB = totalJogos > 0 ? (golsB / totalJogos).toFixed(1) : '0.0';

  // Mensagem de Status da Rivalidade
  const statusRivalidade = useMemo(() => {
    if (totalJogos === 0) return 'Nenhum confronto disputado';
    if (vitoriasA > vitoriasB) {
      const diff = vitoriasA - vitoriasB;
      return `👑 ${membroA?.perfil?.nome || 'Jogador 1'} lidera com +${diff} vitória${diff > 1 ? 's' : ''}`;
    }
    if (vitoriasB > vitoriasA) {
      const diff = vitoriasB - vitoriasA;
      return `👑 ${membroB?.perfil?.nome || 'Jogador 2'} lidera com +${diff} vitória${diff > 1 ? 's' : ''}`;
    }
    return '⚔️ Duelo Totalmente Equilibrado!';
  }, [totalJogos, vitoriasA, vitoriasB, membroA, membroB]);

  if (membrosValidos.length < 2) {
    return (
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={8}
        textAlign="center"
      >
        <Icon as={FiUsers} boxSize={10} color="orange.400" mb={3} />
        <Heading fontSize="18px" color={textPrimary} mb={2}>
          Membros Insuficientes
        </Heading>
        <Text fontSize="13px" color={textSecondary}>
          O grupo precisa ter pelo menos 2 membros cadastrados para comparar o
          histórico de confrontos diretos (H2H).
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* ── SELETOR DE RIVALIDADE ─────────────────────────────────────── */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={cardBorder}
        borderRadius="2xl"
        p={5}
        boxShadow="sm"
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={4}
        >
          {/* Seletor Jogador A */}
          <Box flex={1} w="full">
            <Text
              fontSize="11px"
              fontWeight={800}
              color={highlightA}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Jogador 1 (Lado Laranja)
            </Text>
            <HStack spacing={3}>
              <Avatar
                size="md"
                name={membroA?.perfil?.nome || 'Jogador 1'}
                src={membroA?.perfil?.foto_base64 || undefined}
                border={`2px solid ${highlightA}`}
              />
              <Select
                value={jogadorAId}
                onChange={(e) => setJogadorAId(e.target.value)}
                fontWeight={700}
                borderRadius="xl"
                focusBorderColor="brand.500"
              >
                {membrosValidos.map((m) => (
                  <option
                    key={m.usuario_id}
                    value={m.usuario_id}
                    disabled={m.usuario_id === jogadorBId}
                  >
                    {m.perfil?.nome || 'Membro'} {m.usuario_id === jogadorBId ? '(Selecionado)' : ''}
                  </option>
                ))}
              </Select>
            </HStack>
          </Box>

          {/* Botão Swap */}
          <Tooltip label="Inverter Lados" hasArrow>
            <IconButton
              aria-label="Inverter Jogadores"
              icon={<FiRepeat />}
              onClick={handleInverterJogadores}
              colorScheme="orange"
              variant="ghost"
              borderRadius="full"
              size="lg"
            />
          </Tooltip>

          {/* Seletor Jogador B */}
          <Box flex={1} w="full">
            <Text
              fontSize="11px"
              fontWeight={800}
              color={highlightB}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
              textAlign={{ base: 'left', md: 'right' }}
            >
              Jogador 2 (Lado Ciano)
            </Text>
            <HStack spacing={3} justify={{ base: 'flex-start', md: 'flex-end' }}>
              <Select
                value={jogadorBId}
                onChange={(e) => setJogadorBId(e.target.value)}
                fontWeight={700}
                borderRadius="xl"
                focusBorderColor="cyan.400"
              >
                {membrosValidos.map((m) => (
                  <option
                    key={m.usuario_id}
                    value={m.usuario_id}
                    disabled={m.usuario_id === jogadorAId}
                  >
                    {m.perfil?.nome || 'Membro'} {m.usuario_id === jogadorAId ? '(Selecionado)' : ''}
                  </option>
                ))}
              </Select>
              <Avatar
                size="md"
                name={membroB?.perfil?.nome || 'Jogador 2'}
                src={membroB?.perfil?.foto_base64 || undefined}
                border={`2px solid ${highlightB}`}
              />
            </HStack>
          </Box>
        </Flex>
      </Box>

      {/* ── CARD PRINCIPAL E-SPORTS: HEAD TO HEAD ────────────────────── */}
      {loading ? (
        <Flex
          minH="240px"
          align="center"
          justify="center"
          bg={cardBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={cardBorder}
        >
          <VStack spacing={3}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text fontSize="13px" color={textSecondary} fontWeight={600}>
              Calculando histórico de confrontos...
            </Text>
          </VStack>
        </Flex>
      ) : jogadorAId === jogadorBId ? (
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px solid"
          borderColor={cardBorder}
          p={8}
          textAlign="center"
        >
          <Text fontSize="14px" color={textSecondary}>
            Selecione dois jogadores diferentes para comparar a rivalidade.
          </Text>
        </Box>
      ) : (
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
          boxShadow="lg"
          position="relative"
          overflow="hidden"
        >
          {/* Faixa decorativa no topo */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="4px"
            bg={`linear-gradient(90deg, ${highlightA} 0%, #FDBB00 50%, ${highlightB} 100%)`}
          />

          {/* Banner VS de Topo */}
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            justify="space-between"
            gap={4}
            py={4}
            borderBottom="1px solid"
            borderColor={cardBorder}
          >
            {/* Lado Jogador A */}
            <HStack spacing={4} align="center" flex={1} justify={{ base: 'center', sm: 'flex-start' }}>
              <Avatar
                size={{ base: 'lg', md: 'xl' }}
                name={membroA?.perfil?.nome || 'Jogador 1'}
                src={membroA?.perfil?.foto_base64 || undefined}
                border={`3px solid ${highlightA}`}
                boxShadow={`0 0 16px rgba(249, 74, 41, 0.35)`}
              />
              <VStack align={{ base: 'center', sm: 'flex-start' }} spacing={1}>
                <Badge colorScheme="orange" variant="solid" fontSize="10px" px={2} borderRadius="full">
                  {vitoriasA} VITÓRIA{vitoriasA !== 1 ? 'S' : ''}
                </Badge>
                <Heading fontSize={{ base: '18px', md: '22px' }} color={textPrimary} noOfLines={1}>
                  {membroA?.perfil?.nome || 'Jogador 1'}
                </Heading>
                {membroA?.perfil?.steam_id && (
                  <Text fontSize="11px" color={textSecondary}>
                    {membroA.perfil.steam_id}
                  </Text>
                )}
              </VStack>
            </HStack>

            {/* Centro: VS e Total */}
            <VStack spacing={1} px={4} py={2} bg={vsBoxBg} borderRadius="xl" border="1px solid" borderColor={cardBorder} my={{ base: 2, sm: 0 }}>
              <Badge
                bg="linear-gradient(135deg, #FDBB00, #F94A29)"
                color="white"
                fontSize="14px"
                fontWeight={900}
                px={3}
                py={0.5}
                borderRadius="md"
                letterSpacing="1px"
              >
                VS
              </Badge>
              <Text fontSize="12px" fontWeight={800} color={textPrimary}>
                {totalJogos} JOGO{totalJogos !== 1 ? 'S' : ''}
              </Text>
              <Text fontSize="11px" color={textSecondary}>
                {empates} Empate{empates !== 1 ? 's' : ''}
              </Text>
            </VStack>

            {/* Lado Jogador B */}
            <HStack spacing={4} align="center" flex={1} justify={{ base: 'center', sm: 'flex-end' }}>
              <VStack align={{ base: 'center', sm: 'flex-end' }} spacing={1} order={{ base: 2, sm: 1 }}>
                <Badge colorScheme="cyan" variant="solid" fontSize="10px" px={2} borderRadius="full">
                  {vitoriasB} VITÓRIA{vitoriasB !== 1 ? 'S' : ''}
                </Badge>
                <Heading fontSize={{ base: '18px', md: '22px' }} color={textPrimary} noOfLines={1}>
                  {membroB?.perfil?.nome || 'Jogador 2'}
                </Heading>
                {membroB?.perfil?.steam_id && (
                  <Text fontSize="11px" color={textSecondary}>
                    {membroB.perfil.steam_id}
                  </Text>
                )}
              </VStack>
              <Avatar
                order={{ base: 1, sm: 2 }}
                size={{ base: 'lg', md: 'xl' }}
                name={membroB?.perfil?.nome || 'Jogador 2'}
                src={membroB?.perfil?.foto_base64 || undefined}
                border={`3px solid ${highlightB}`}
                boxShadow={`0 0 16px rgba(0, 180, 216, 0.35)`}
              />
            </HStack>
          </Flex>

          {/* Status Bar: Hegemonia */}
          <Box py={3} textAlign="center">
            <Badge
              fontSize="12px"
              fontWeight={800}
              px={3}
              py={1}
              borderRadius="full"
              variant="subtle"
              colorScheme={
                vitoriasA > vitoriasB
                  ? 'orange'
                  : vitoriasB > vitoriasA
                  ? 'cyan'
                  : 'gray'
              }
            >
              {statusRivalidade}
            </Badge>
          </Box>

          {/* ── BARRAS DE COMPARAÇÃO RELATIVA ───────────────────────────── */}
          <VStack spacing={5} mt={4} align="stretch">
            {/* 1. Proporção de Vitórias */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="12px" fontWeight={800} color={highlightA}>
                  {vitoriasA} ({Math.round(pctVitA)}%)
                </Text>
                <Text fontSize="11px" fontWeight={800} color={textSecondary} textTransform="uppercase">
                  Vitórias & Empates
                </Text>
                <Text fontSize="12px" fontWeight={800} color={highlightB}>
                  {vitoriasB} ({Math.round(pctVitB)}%)
                </Text>
              </Flex>
              <Flex h="10px" borderRadius="full" overflow="hidden" bg={useColorModeValue('gray.200', 'gray.700')}>
                <Box w={`${pctVitA}%`} bg={highlightA} transition="width 0.4s" />
                <Box w={`${pctEmp}%`} bg={useColorModeValue('gray.400', 'gray.500')} title={`${empates} Empates`} transition="width 0.4s" />
                <Box w={`${pctVitB}%`} bg={highlightB} transition="width 0.4s" />
              </Flex>
            </Box>

            {/* 2. Gols Marcados */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="12px" fontWeight={800} color={highlightA}>
                  {golsA} gols
                </Text>
                <Text fontSize="11px" fontWeight={800} color={textSecondary} textTransform="uppercase">
                  Gols Pró (Total)
                </Text>
                <Text fontSize="12px" fontWeight={800} color={highlightB}>
                  {golsB} gols
                </Text>
              </Flex>
              <Flex h="10px" borderRadius="full" overflow="hidden" bg={useColorModeValue('gray.200', 'gray.700')}>
                <Box w={`${pctGolsA}%`} bg={highlightA} transition="width 0.4s" />
                <Box w={`${pctGolsB}%`} bg={highlightB} transition="width 0.4s" />
              </Flex>
            </Box>

            {/* 3. Grid de Métricas Lado a Lado */}
            <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} pt={2}>
              {/* Média de Gols */}
              <Box bg={cardBgAlt} p={3} borderRadius="xl" textAlign="center" border="1px solid" borderColor={cardBorder}>
                <Text fontSize="10px" color={textSecondary} fontWeight={700} textTransform="uppercase" mb={1}>
                  Média Gols / Jogo
                </Text>
                <HStack justify="center" spacing={2}>
                  <Text fontSize="14px" fontWeight={800} color={highlightA}>
                    {mediaGolsA}
                  </Text>
                  <Text fontSize="11px" color={textSecondary}>x</Text>
                  <Text fontSize="14px" fontWeight={800} color={highlightB}>
                    {mediaGolsB}
                  </Text>
                </HStack>
              </Box>

              {/* Saldo de Gols */}
              <Box bg={cardBgAlt} p={3} borderRadius="xl" textAlign="center" border="1px solid" borderColor={cardBorder}>
                <Text fontSize="10px" color={textSecondary} fontWeight={700} textTransform="uppercase" mb={1}>
                  Saldo de Gols
                </Text>
                <HStack justify="center" spacing={2}>
                  <Text fontSize="14px" fontWeight={800} color={highlightA}>
                    {estatisticas?.saldoA && estatisticas.saldoA > 0 ? `+${estatisticas.saldoA}` : estatisticas?.saldoA ?? 0}
                  </Text>
                  <Text fontSize="11px" color={textSecondary}>x</Text>
                  <Text fontSize="14px" fontWeight={800} color={highlightB}>
                    {estatisticas?.saldoB && estatisticas.saldoB > 0 ? `+${estatisticas.saldoB}` : estatisticas?.saldoB ?? 0}
                  </Text>
                </HStack>
              </Box>

              {/* Aproveitamento */}
              <Box bg={cardBgAlt} p={3} borderRadius="xl" textAlign="center" border="1px solid" borderColor={cardBorder}>
                <Text fontSize="10px" color={textSecondary} fontWeight={700} textTransform="uppercase" mb={1}>
                  Aproveitamento
                </Text>
                <HStack justify="center" spacing={2}>
                  <Text fontSize="14px" fontWeight={800} color={highlightA}>
                    {estatisticas?.aproveitamentoA || 0}%
                  </Text>
                  <Text fontSize="11px" color={textSecondary}>x</Text>
                  <Text fontSize="14px" fontWeight={800} color={highlightB}>
                    {estatisticas?.aproveitamentoB || 0}%
                  </Text>
                </HStack>
              </Box>

              {/* Total de Gols no Duelo */}
              <Box bg={cardBgAlt} p={3} borderRadius="xl" textAlign="center" border="1px solid" borderColor={cardBorder}>
                <Text fontSize="10px" color={textSecondary} fontWeight={700} textTransform="uppercase" mb={1}>
                  Gols no Duelo
                </Text>
                <Text fontSize="14px" fontWeight={800} color={textPrimary}>
                  {totalGols} gols
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>

          {/* ── TIMELINE / HISTÓRICO DE PARTIDAS RECENTES ───────────────── */}
          <Box mt={8} pt={6} borderTop="1px solid" borderColor={cardBorder}>
            <HStack justify="space-between" mb={4}>
              <HStack spacing={2}>
                <Icon as={IoFootball} color="brand.500" />
                <Heading fontSize="16px" color={textPrimary}>
                  Confrontos Diretos Disputados ({estatisticas?.partidas.length || 0})
                </Heading>
              </HStack>
            </HStack>

            {(!estatisticas?.partidas || estatisticas.partidas.length === 0) ? (
              <Box bg={cardBgAlt} p={6} borderRadius="xl" textAlign="center">
                <Text fontSize="13px" color={textSecondary}>
                  Nenhum jogo finalizado entre <strong>{membroA?.perfil?.nome}</strong> e <strong>{membroB?.perfil?.nome}</strong> nos torneios deste grupo.
                </Text>
              </Box>
            ) : (
              <VStack spacing={3} align="stretch">
                {estatisticas.partidas.map((match) => {
                  const venceuA = match.vencedorUsuarioId === jogadorAId;
                  const venceuB = match.vencedorUsuarioId === jogadorBId;
                  const isEmpate = !match.vencedorUsuarioId;

                  return (
                    <Box
                      key={match.partidaId}
                      bg={cardBgAlt}
                      border="1px solid"
                      borderColor={cardBorder}
                      borderRadius="xl"
                      p={4}
                      transition="all 0.2s"
                      _hover={{ borderColor: 'brand.500' }}
                    >
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        align={{ base: 'flex-start', md: 'center' }}
                        justify="space-between"
                        gap={3}
                      >
                        {/* Metadados da Partida */}
                        <VStack align="flex-start" spacing={0} minW="160px">
                          <Text fontSize="12px" fontWeight={700} color={textPrimary} noOfLines={1}>
                            {match.torneioNome}
                          </Text>
                          <HStack spacing={2}>
                            {match.fase && (
                              <Badge fontSize="9px" colorScheme="purple">
                                {match.fase.toUpperCase()}
                              </Badge>
                            )}
                            <Text fontSize="10px" color={textSecondary}>
                              {new Date(match.data).toLocaleDateString()}
                            </Text>
                          </HStack>
                        </VStack>

                        {/* Placar e Clubes */}
                        <Flex
                          align="center"
                          justify="center"
                          flex={1}
                          w="full"
                          gap={{ base: 2, sm: 4 }}
                        >
                          {/* Time A */}
                          <HStack flex={1} justify="flex-end" spacing={2}>
                            <Text
                              fontSize="13px"
                              fontWeight={venceuA ? 800 : 500}
                              color={venceuA ? highlightA : textPrimary}
                              textAlign="right"
                              noOfLines={1}
                            >
                              {match.timeA}
                            </Text>
                            {match.logoTimeA && (
                              <Image src={match.logoTimeA} boxSize="20px" objectFit="contain" />
                            )}
                          </HStack>

                          {/* Placar Central */}
                          <HStack
                            spacing={2}
                            px={3}
                            py={1}
                            bg={useColorModeValue('white', 'gray.800')}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={cardBorder}
                          >
                            <Text fontSize="16px" fontWeight={900} color={venceuA ? highlightA : textPrimary}>
                              {match.placarA}
                            </Text>
                            <Text fontSize="12px" color={textSecondary}>x</Text>
                            <Text fontSize="16px" fontWeight={900} color={venceuB ? highlightB : textPrimary}>
                              {match.placarB}
                            </Text>
                          </HStack>

                          {/* Time B */}
                          <HStack flex={1} justify="flex-start" spacing={2}>
                            {match.logoTimeB && (
                              <Image src={match.logoTimeB} boxSize="20px" objectFit="contain" />
                            )}
                            <Text
                              fontSize="13px"
                              fontWeight={venceuB ? 800 : 500}
                              color={venceuB ? highlightB : textPrimary}
                              textAlign="left"
                              noOfLines={1}
                            >
                              {match.timeB}
                            </Text>
                          </HStack>
                        </Flex>

                        {/* Vencedor / Pênaltis */}
                        <Box minW="110px" textAlign={{ base: 'left', md: 'right' }}>
                          {venceuA && (
                            <Badge colorScheme="orange" fontSize="10px" px={2} py={0.5} borderRadius="full">
                              Vitória {membroA?.perfil?.nome || 'J1'}
                            </Badge>
                          )}
                          {venceuB && (
                            <Badge colorScheme="cyan" fontSize="10px" px={2} py={0.5} borderRadius="full">
                              Vitória {membroB?.perfil?.nome || 'J2'}
                            </Badge>
                          )}
                          {isEmpate && (
                            <Badge colorScheme="gray" fontSize="10px" px={2} py={0.5} borderRadius="full">
                              Empate
                            </Badge>
                          )}
                          {match.penaltisA !== null && match.penaltisA !== undefined && (
                            <Text fontSize="10px" color={textSecondary} mt={0.5}>
                              ({match.penaltisA} x {match.penaltisB} pen.)
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </Box>
      )}
    </VStack>
  );
}
