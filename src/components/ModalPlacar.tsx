import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiPieChart,
  FiTarget,
} from 'react-icons/fi';
import LogoBola from '../assets/logos/LogoBola.png';
import { useTorneioStore } from '../store/torneioStore';
import type { EstatisticasAvancadasPartida, Partida } from '../types/torneio';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ModalPlacarProps {
  isOpen: boolean;
  onClose: () => void;
  partida: Partida;
  modo: 'liga' | 'matamata';
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function ModalPlacar({ isOpen, onClose, partida, modo }: ModalPlacarProps) {
  const { participantes, partidas, registrarPlacarLiga, registrarPlacarMataMata } =
    useTorneioStore();

  const [golsA, setGolsA] = useState(0);
  const [golsB, setGolsB] = useState(0);
  const [penaltisA, setPenaltisA] = useState(0);
  const [penaltisB, setPenaltisB] = useState(0);
  const [loading, setLoading] = useState(false);

  // Estatísticas Avançadas Opcionais
  const [posseBolaA, setPosseBolaA] = useState<number | string>('');
  const [posseBolaB, setPosseBolaB] = useState<number | string>('');
  const [chutesA, setChutesA] = useState<number | string>('');
  const [chutesB, setChutesB] = useState<number | string>('');
  const [amarelosA, setAmarelosA] = useState<number | string>('');
  const [amarelosB, setAmarelosB] = useState<number | string>('');
  const [vermelhosA, setVermelhosA] = useState<number | string>('');
  const [vermelhosB, setVermelhosB] = useState<number | string>('');

  const modalBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const inputBg = useColorModeValue('gray.50', 'gray.900');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.750');

  useEffect(() => {
    if (isOpen) {
      setGolsA(partida.placarA ?? 0);
      setGolsB(partida.placarB ?? 0);
      setPenaltisA(partida.penaltisA ?? 0);
      setPenaltisB(partida.penaltisB ?? 0);

      // Preenchimento de estatísticas avançadas
      setPosseBolaA(partida.posseBolaA ?? '');
      setPosseBolaB(partida.posseBolaB ?? '');
      setChutesA(partida.chutesA ?? '');
      setChutesB(partida.chutesB ?? '');
      setAmarelosA(partida.amarelosA ?? '');
      setAmarelosB(partida.amarelosB ?? '');
      setVermelhosA(partida.vermelhosA ?? '');
      setVermelhosB(partida.vermelhosB ?? '');
    }
  }, [isOpen, partida]);

  const pA = participantes.find((p) => p.id === partida.participanteAId);
  const pB = participantes.find((p) => p.id === partida.participanteBId);

  // Auto-balanceamento de Posse de Bola
  const handlePosseBolaAChange = (valStr: string) => {
    if (valStr === '') {
      setPosseBolaA('');
      return;
    }
    const val = Math.min(100, Math.max(0, Number(valStr)));
    setPosseBolaA(val);
    setPosseBolaB(100 - val);
  };

  const handlePosseBolaBChange = (valStr: string) => {
    if (valStr === '') {
      setPosseBolaB('');
      return;
    }
    const val = Math.min(100, Math.max(0, Number(valStr)));
    setPosseBolaB(val);
    setPosseBolaA(100 - val);
  };

  // Mata-mata ida e volta
  const idaPartida = useMemo(() => {
    if (partida.jogo !== 'volta' || !partida.confrontoId) return null;
    return (
      partidas.find(
        (p) => p.confrontoId === partida.confrontoId && p.jogo === 'ida' && p.finalizada
      ) ?? null
    );
  }, [partida, partidas]);

  // Agregado parcial em tempo real
  const agregadoAtual = useMemo(() => {
    if (!idaPartida) return null;
    const golsA_total = (idaPartida.placarA ?? 0) + golsB; // B joga fora na volta
    const golsB_total = (idaPartida.placarB ?? 0) + golsA;
    return { golsA_total, golsB_total };
  }, [idaPartida, golsA, golsB]);

  // Exigir pênaltis?
  const mostrarPenaltis = useMemo(() => {
    if (modo === 'liga') return false;
    if (partida.jogo === null) {
      return golsA === golsB; // jogo único mata-mata empatado
    }
    if (partida.jogo === 'volta' && agregadoAtual) {
      return agregadoAtual.golsA_total === agregadoAtual.golsB_total;
    }
    return false; // ida nunca tem pênaltis
  }, [modo, partida.jogo, golsA, golsB, agregadoAtual]);

  const penaltisEmpatados = mostrarPenaltis && penaltisA === penaltisB;
  const podeConfirmar = !mostrarPenaltis || !penaltisEmpatados;

  const handleConfirmar = () => {
    if (!podeConfirmar) return;
    setLoading(true);

    const temStats =
      posseBolaA !== '' ||
      posseBolaB !== '' ||
      chutesA !== '' ||
      chutesB !== '' ||
      amarelosA !== '' ||
      amarelosB !== '' ||
      vermelhosA !== '' ||
      vermelhosB !== '';

    const estatisticas: EstatisticasAvancadasPartida | undefined = temStats
      ? {
          posseBolaA: posseBolaA !== '' ? Number(posseBolaA) : null,
          posseBolaB: posseBolaB !== '' ? Number(posseBolaB) : null,
          chutesA: chutesA !== '' ? Number(chutesA) : null,
          chutesB: chutesB !== '' ? Number(chutesB) : null,
          amarelosA: amarelosA !== '' ? Number(amarelosA) : null,
          amarelosB: amarelosB !== '' ? Number(amarelosB) : null,
          vermelhosA: vermelhosA !== '' ? Number(vermelhosA) : null,
          vermelhosB: vermelhosB !== '' ? Number(vermelhosB) : null,
        }
      : undefined;

    if (modo === 'liga') {
      registrarPlacarLiga(partida.id, golsA, golsB, estatisticas);
    } else {
      registrarPlacarMataMata(
        partida.id,
        golsA,
        golsB,
        mostrarPenaltis ? penaltisA : undefined,
        mostrarPenaltis ? penaltisB : undefined,
        estatisticas
      );
    }

    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={modalBg}
        border="1px solid"
        borderColor={cardBorder}
        boxShadow="2xl"
        borderRadius="2xl"
        overflow="hidden"
        mx={4}
        maxH="90vh"
      >
        {/* Tarja topo degradê */}
        <Box h="6px" bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00)" />

        <ModalHeader pt={4} pb={3} borderBottom="1px solid" borderColor={cardBorder}>
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" boxSize="28px" />
            <VStack align="flex-start" spacing={0}>
              <Text fontFamily="heading" fontSize="18px" fontWeight="extrabold" color={textPrimary}>
                LANÇAR PLACAR
              </Text>
              <HStack spacing={2}>
                <Badge
                  colorScheme="orange"
                  variant="subtle"
                  fontSize="10px"
                  borderRadius="md"
                  px={2}
                >
                  {modo === 'liga'
                    ? 'LIGA'
                    : `MATA-MATA — ${
                        partida.jogo === 'ida'
                          ? 'IDA'
                          : partida.jogo === 'volta'
                          ? 'VOLTA'
                          : 'ÚNICO'
                      }`}
                </Badge>
                {partida.rodada > 0 && modo === 'liga' && (
                  <Badge colorScheme="blue" variant="subtle" fontSize="10px" borderRadius="md" px={2}>
                    RD {partida.rodada}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          top={4}
          right={4}
          color={textSecondary}
          borderRadius="md"
          _hover={{ bg: 'red.500', color: 'white' }}
        />

        <ModalBody pb={4} pt={5} overflowY="auto">
          <VStack spacing={5}>
            {/* Placar principal */}
            <Flex w="full" align="center" gap={4}>
              {/* Player A */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" color={textPrimary} noOfLines={1}>
                    {pA?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px" fontWeight={500} color={textSecondary} noOfLines={1}>
                    {pA?.timeSorteado ?? '—'}
                  </Text>
                </VStack>
                <NumberInput
                  min={0}
                  max={99}
                  value={golsA}
                  onChange={(v) => setGolsA(Number(v))}
                  size="lg"
                  w="full"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="3xl"
                    fontWeight={900}
                    fontFamily="heading"
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    color={textPrimary}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #f94a29' }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                    <NumberDecrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                  </NumberInputStepper>
                </NumberInput>
              </VStack>

              {/* Separador */}
              <Text fontFamily="heading" fontSize="3xl" fontWeight={900} color={textSecondary} mt={6}>
                ×
              </Text>

              {/* Player B */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" color={textPrimary} noOfLines={1}>
                    {pB?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px" fontWeight={500} color={textSecondary} noOfLines={1}>
                    {pB?.timeSorteado ?? '—'}
                  </Text>
                </VStack>
                <NumberInput
                  min={0}
                  max={99}
                  value={golsB}
                  onChange={(v) => setGolsB(Number(v))}
                  size="lg"
                  w="full"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="3xl"
                    fontWeight={900}
                    fontFamily="heading"
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                    color={textPrimary}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #f94a29' }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                    <NumberDecrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                  </NumberInputStepper>
                </NumberInput>
              </VStack>
            </Flex>

            {/* Agregado parcial */}
            {agregadoAtual && idaPartida && (
              <>
                <Box w="full" h="1px" bg={cardBorder} />
                <Box w="full" bg={sectionBg} border="1px solid" borderColor={cardBorder} borderRadius="lg" p={3}>
                  <Text
                    fontSize="11px"
                    fontWeight={700}
                    color={textSecondary}
                    textAlign="center"
                    mb={2}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Placar Agregado (tempo real)
                  </Text>
                  <HStack justify="center" spacing={6}>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px" fontWeight={600} color={textPrimary} noOfLines={1}>
                        {pA?.nomeAmigo}
                      </Text>
                      <Text
                        fontFamily="heading"
                        fontSize="3xl"
                        fontWeight={900}
                        color={agregadoAtual.golsA_total > agregadoAtual.golsB_total ? 'brand.500' : textPrimary}
                      >
                        {agregadoAtual.golsA_total}
                      </Text>
                    </VStack>
                    <Text fontFamily="heading" fontSize="xl" color={textSecondary}>
                      —
                    </Text>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px" fontWeight={600} color={textPrimary} noOfLines={1}>
                        {pB?.nomeAmigo}
                      </Text>
                      <Text
                        fontFamily="heading"
                        fontSize="3xl"
                        fontWeight={900}
                        color={agregadoAtual.golsB_total > agregadoAtual.golsA_total ? 'brand.500' : textPrimary}
                      >
                        {agregadoAtual.golsB_total}
                      </Text>
                    </VStack>
                  </HStack>
                  {agregadoAtual.golsA_total === agregadoAtual.golsB_total && (
                    <HStack justify="center" spacing={1.5} mt={2}>
                      <FiAlertCircle color="#DD6B20" size={14} />
                      <Text fontSize="12px" color="orange.500" fontWeight={700}>
                        Empate no agregado — pênaltis necessários
                      </Text>
                    </HStack>
                  )}
                </Box>
              </>
            )}

            {/* Campo de pênaltis */}
            {mostrarPenaltis && (
              <>
                <Box w="full" h="1px" bg={cardBorder} />
                <VStack w="full" spacing={3}>
                  <Alert status="warning" borderRadius="lg" py={2}>
                    <AlertIcon />
                    <AlertDescription fontSize="12px" fontWeight={600}>
                      DISPUTA DE PÊNALTIS — informe o placar.
                    </AlertDescription>
                  </Alert>

                  <Flex w="full" align="center" gap={4}>
                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" fontWeight={600} color={textPrimary}>
                        {pA?.nomeAmigo ?? '?'}
                      </Text>
                      <NumberInput
                        min={0}
                        max={30}
                        value={penaltisA}
                        onChange={(v) => setPenaltisA(Number(v))}
                        w="full"
                      >
                        <NumberInputField
                          textAlign="center"
                          bg={inputBg}
                          border="1px solid"
                          borderColor={inputBorder}
                          color={textPrimary}
                          fontFamily="heading"
                          fontWeight={900}
                          fontSize="2xl"
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #f94a29' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                          <NumberDecrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                        </NumberInputStepper>
                      </NumberInput>
                    </VStack>

                    <Text fontFamily="heading" fontSize="xl" color={textSecondary} mt={5}>
                      ×
                    </Text>

                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" fontWeight={600} color={textPrimary}>
                        {pB?.nomeAmigo ?? '?'}
                      </Text>
                      <NumberInput
                        min={0}
                        max={30}
                        value={penaltisB}
                        onChange={(v) => setPenaltisB(Number(v))}
                        w="full"
                      >
                        <NumberInputField
                          textAlign="center"
                          bg={inputBg}
                          border="1px solid"
                          borderColor={inputBorder}
                          color={textPrimary}
                          fontFamily="heading"
                          fontWeight={900}
                          fontSize="2xl"
                          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #f94a29' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                          <NumberDecrementStepper color={textPrimary} _hover={{ bg: 'brand.500', color: 'white' }} />
                        </NumberInputStepper>
                      </NumberInput>
                    </VStack>
                  </Flex>

                  {penaltisEmpatados && (
                    <HStack justify="center" spacing={1.5}>
                      <FiAlertCircle color="#E53E3E" size={14} />
                      <Text fontSize="12px" color="red.500" fontWeight={700}>
                        Pênaltis empatados — defina um vencedor.
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </>
            )}

            {/* ── ACCORDION: ESTATÍSTICAS AVANÇADAS OPCIONAIS ──────────────── */}
            <Box w="full" pt={1}>
              <Accordion allowToggle borderRadius="xl">
                <AccordionItem border="1px solid" borderColor={cardBorder} borderRadius="xl">
                  <h2>
                    <AccordionButton
                      _expanded={{ bg: sectionBg, color: 'brand.500' }}
                      borderRadius="xl"
                      py={3}
                    >
                      <HStack flex="1" textAlign="left" spacing={2}>
                        <Icon as={FiBarChart2} color="brand.500" />
                        <Text fontSize="13px" fontWeight={700}>
                          Estatísticas Avançadas (Opcional)
                        </Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} bg={sectionBg} borderBottomRadius="xl">
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="11px" color={textSecondary}>
                        Preencha métricas adicionais para desbloquear conquistas como <strong>Retranqueiro</strong>, <strong>Açougueiro</strong> e <strong>Atirador de Elite</strong>.
                      </Text>

                      {/* 1. Posse de Bola (%) */}
                      <Box bg={modalBg} p={3} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                        <HStack justify="space-between" mb={2}>
                          <HStack spacing={1.5}>
                            <Icon as={FiPieChart} color="blue.400" />
                            <Text fontSize="12px" fontWeight={700} color={textPrimary}>
                              Posse de Bola (%)
                            </Text>
                          </HStack>
                          <Badge fontSize="10px" colorScheme="blue">
                            Total: {(Number(posseBolaA) || 0) + (Number(posseBolaB) || 0)}%
                          </Badge>
                        </HStack>
                        <Flex gap={3} align="center">
                          <NumberInput
                            min={0}
                            max={100}
                            value={posseBolaA}
                            onChange={(v) => handlePosseBolaAChange(v)}
                            flex={1}
                            size="sm"
                          >
                            <NumberInputField
                              textAlign="center"
                              placeholder="ex: 45%"
                              bg={inputBg}
                              fontWeight={700}
                            />
                          </NumberInput>
                          <Text fontSize="12px" color={textSecondary}>
                            x
                          </Text>
                          <NumberInput
                            min={0}
                            max={100}
                            value={posseBolaB}
                            onChange={(v) => handlePosseBolaBChange(v)}
                            flex={1}
                            size="sm"
                          >
                            <NumberInputField
                              textAlign="center"
                              placeholder="ex: 55%"
                              bg={inputBg}
                              fontWeight={700}
                            />
                          </NumberInput>
                        </Flex>
                      </Box>

                      {/* 2. Chutes ao Gol */}
                      <Box bg={modalBg} p={3} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                        <HStack spacing={1.5} mb={2}>
                          <Icon as={FiTarget} color="green.400" />
                          <Text fontSize="12px" fontWeight={700} color={textPrimary}>
                            Chutes ao Gol
                          </Text>
                        </HStack>
                        <Flex gap={3} align="center">
                          <NumberInput
                            min={0}
                            max={99}
                            value={chutesA}
                            onChange={(v) => setChutesA(v)}
                            flex={1}
                            size="sm"
                          >
                            <NumberInputField
                              textAlign="center"
                              placeholder="Chutes J1"
                              bg={inputBg}
                              fontWeight={700}
                            />
                          </NumberInput>
                          <Text fontSize="12px" color={textSecondary}>
                            x
                          </Text>
                          <NumberInput
                            min={0}
                            max={99}
                            value={chutesB}
                            onChange={(v) => setChutesB(v)}
                            flex={1}
                            size="sm"
                          >
                            <NumberInputField
                              textAlign="center"
                              placeholder="Chutes J2"
                              bg={inputBg}
                              fontWeight={700}
                            />
                          </NumberInput>
                        </Flex>
                      </Box>

                      {/* 3. Cartões Amarelos & Vermelhos */}
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        {/* Cartões Amarelos */}
                        <Box bg={modalBg} p={3} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                          <Text fontSize="12px" fontWeight={700} color={textPrimary} mb={2}>
                            🟨 Cartões Amarelos
                          </Text>
                          <Flex gap={2} align="center">
                            <NumberInput
                              min={0}
                              max={20}
                              value={amarelosA}
                              onChange={(v) => setAmarelosA(v)}
                              flex={1}
                              size="sm"
                            >
                              <NumberInputField textAlign="center" placeholder="J1" bg={inputBg} fontWeight={700} />
                            </NumberInput>
                            <Text fontSize="11px" color={textSecondary}>x</Text>
                            <NumberInput
                              min={0}
                              max={20}
                              value={amarelosB}
                              onChange={(v) => setAmarelosB(v)}
                              flex={1}
                              size="sm"
                            >
                              <NumberInputField textAlign="center" placeholder="J2" bg={inputBg} fontWeight={700} />
                            </NumberInput>
                          </Flex>
                        </Box>

                        {/* Cartões Vermelhos */}
                        <Box bg={modalBg} p={3} borderRadius="lg" border="1px solid" borderColor={cardBorder}>
                          <Text fontSize="12px" fontWeight={700} color={textPrimary} mb={2}>
                            🟥 Cartões Vermelhos
                          </Text>
                          <Flex gap={2} align="center">
                            <NumberInput
                              min={0}
                              max={10}
                              value={vermelhosA}
                              onChange={(v) => setVermelhosA(v)}
                              flex={1}
                              size="sm"
                            >
                              <NumberInputField textAlign="center" placeholder="J1" bg={inputBg} fontWeight={700} />
                            </NumberInput>
                            <Text fontSize="11px" color={textSecondary}>x</Text>
                            <NumberInput
                              min={0}
                              max={10}
                              value={vermelhosB}
                              onChange={(v) => setVermelhosB(v)}
                              flex={1}
                              size="sm"
                            >
                              <NumberInputField textAlign="center" placeholder="J2" bg={inputBg} fontWeight={700} />
                            </NumberInput>
                          </Flex>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter pt={3} pb={4} gap={3} borderTop="1px solid" borderColor={cardBorder}>
          <Button onClick={onClose} flex={1} variant="outline" colorScheme="gray">
            CANCELAR
          </Button>
          <Button
            id="btn-confirmar-placar"
            flex={2}
            onClick={handleConfirmar}
            isLoading={loading}
            loadingText="CONFIRMANDO..."
            isDisabled={!podeConfirmar}
            colorScheme="brand"
          >
            CONFIRMAR PLACAR
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
