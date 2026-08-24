import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
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
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useTorneioStore } from '../store/torneioStore';
import type { Partida } from '../types/torneio';
import LogoBola from '../assets/logos/LogoBola.png';
import { FiAlertCircle } from 'react-icons/fi';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ModalPlacarProps {
  isOpen: boolean;
  onClose: () => void;
  partida: Partida;
  modo: 'liga' | 'matamata';
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function ModalPlacar({ isOpen, onClose, partida, modo }: ModalPlacarProps) {
  const { participantes, partidas, registrarPlacarLiga, registrarPlacarMataMata } = useTorneioStore();

  const [golsA, setGolsA]       = useState(0);
  const [golsB, setGolsB]       = useState(0);
  const [penaltisA, setPenaltisA] = useState(0);
  const [penaltisB, setPenaltisB] = useState(0);
  const [loading, setLoading]   = useState(false);

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
    }
  }, [isOpen, partida]);

  const pA = participantes.find((p) => p.id === partida.participanteAId);
  const pB = participantes.find((p) => p.id === partida.participanteBId);

  // Mata-mata ida e volta
  const idaPartida = useMemo(() => {
    if (partida.jogo !== 'volta' || !partida.confrontoId) return null;
    return partidas.find(
      (p) => p.confrontoId === partida.confrontoId && p.jogo === 'ida' && p.finalizada
    ) ?? null;
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
  const podeConfirmar    = !mostrarPenaltis || !penaltisEmpatados;

  const handleConfirmar = () => {
    if (!podeConfirmar) return;
    setLoading(true);

    if (modo === 'liga') {
      registrarPlacarLiga(partida.id, golsA, golsB);
    } else {
      registrarPlacarMataMata(
        partida.id,
        golsA,
        golsB,
        mostrarPenaltis ? penaltisA : undefined,
        mostrarPenaltis ? penaltisB : undefined
      );
    }

    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(0,0,0,0.75)" backdropFilter="blur(2px)" />
      <ModalContent
        bg={modalBg}
        border="1px solid"
        borderColor={cardBorder}
        boxShadow="xl"
        borderRadius="xl"
        overflow="hidden"
        mx={4}
      >
        {/* Tarja topo degradê */}
        <Box
          h="6px"
          bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00)"
        />

        <ModalHeader
          pt={4} pb={3}
          borderBottom="1px solid"
          borderColor={cardBorder}
        >
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
                  {modo === 'liga' ? 'LIGA' : `MATA-MATA — ${partida.jogo === 'ida' ? 'IDA' : partida.jogo === 'volta' ? 'VOLTA' : 'ÚNICO'}`}
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
          top={4} right={4}
          color={textSecondary}
          borderRadius="md"
          _hover={{ bg: 'red.500', color: 'white' }}
        />

        <ModalBody pb={4} pt={5}>
          <VStack spacing={5}>
            {/* Placar principal */}
            <Flex w="full" align="center" gap={4}>
              {/* Player A */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" color={textPrimary} noOfLines={1}>
                    {pA?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px" fontWeight={500} color={textSecondary} noOfLines={1}>{pA?.timeSorteado ?? '—'}</Text>
                </VStack>
                <NumberInput
                  min={0} max={99}
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
              <Text fontFamily="heading" fontSize="3xl" fontWeight={900} color={textSecondary} mt={6}>×</Text>

              {/* Player B */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" color={textPrimary} noOfLines={1}>
                    {pB?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px" fontWeight={500} color={textSecondary} noOfLines={1}>{pB?.timeSorteado ?? '—'}</Text>
                </VStack>
                <NumberInput
                  min={0} max={99}
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
                <Box
                  w="full"
                  bg={sectionBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="lg"
                  p={3}
                >
                  <Text fontSize="11px" fontWeight={700} color={textSecondary} textAlign="center" mb={2} textTransform="uppercase" letterSpacing="wider">
                    Placar Agregado (tempo real)
                  </Text>
                  <HStack justify="center" spacing={6}>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px" fontWeight={600} color={textPrimary} noOfLines={1}>{pA?.nomeAmigo}</Text>
                      <Text
                        fontFamily="heading"
                        fontSize="3xl"
                        fontWeight={900}
                        color={agregadoAtual.golsA_total > agregadoAtual.golsB_total ? 'brand.500' : textPrimary}
                      >
                        {agregadoAtual.golsA_total}
                      </Text>
                    </VStack>
                    <Text fontFamily="heading" fontSize="xl" color={textSecondary}>—</Text>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px" fontWeight={600} color={textPrimary} noOfLines={1}>{pB?.nomeAmigo}</Text>
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
                  <Alert
                    status="warning"
                    borderRadius="lg"
                    py={2}
                  >
                    <AlertIcon />
                    <AlertDescription fontSize="12px" fontWeight={600}>
                      DISPUTA DE PÊNALTIS — informe o placar.
                    </AlertDescription>
                  </Alert>

                  <Flex w="full" align="center" gap={4}>
                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" fontWeight={600} color={textPrimary}>{pA?.nomeAmigo ?? '?'}</Text>
                      <NumberInput min={0} max={30} value={penaltisA} onChange={(v) => setPenaltisA(Number(v))} w="full">
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

                    <Text fontFamily="heading" fontSize="xl" color={textSecondary} mt={5}>×</Text>

                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" fontWeight={600} color={textPrimary}>{pB?.nomeAmigo ?? '?'}</Text>
                      <NumberInput min={0} max={30} value={penaltisB} onChange={(v) => setPenaltisB(Number(v))} w="full">
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
          </VStack>
        </ModalBody>

        <ModalFooter
          pt={3} pb={4} gap={3}
          borderTop="1px solid"
          borderColor={cardBorder}
        >
          <Button
            onClick={onClose}
            flex={1}
            variant="outline"
            colorScheme="gray"
          >
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
