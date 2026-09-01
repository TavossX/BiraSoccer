import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
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
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiCheck, FiShield, FiTarget, FiZap } from 'react-icons/fi';
import { IoFlame } from 'react-icons/io5';
import LogoBola from '../assets/logos/LogoBola.png';
import { useTorneioStore } from '../store/torneioStore';
import type { Partida } from '../types/torneio';

interface ModalPlacarCSProps {
  isOpen: boolean;
  onClose: () => void;
  partida: Partida;
  modo: 'liga' | 'matamata';
}

export function ModalPlacarCS({ isOpen, onClose, partida, modo }: ModalPlacarCSProps) {
  const { participantes, registrarPlacarLiga, registrarPlacarMataMata } = useTorneioStore();

  const [half1A, setHalf1A] = useState<number>(0);
  const [half1B, setHalf1B] = useState<number>(0);
  const [half2A, setHalf2A] = useState<number>(0);
  const [half2B, setHalf2B] = useState<number>(0);
  const [otA, setOtA] = useState<number>(0);
  const [otB, setOtB] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const modalBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const inputBg = useColorModeValue('gray.50', 'gray.900');
  const inputBorder = useColorModeValue('gray.300', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.750');

  const highlightA = '#F94A29'; // Time A (CT / Laranja)
  const highlightB = '#00B4D8'; // Time B (TR / Ciano)

  // Carrega estado inicial da partida
  useEffect(() => {
    if (isOpen) {
      if (partida.placarCS2) {
        setHalf1A(partida.placarCS2.half1A ?? 0);
        setHalf1B(partida.placarCS2.half1B ?? 0);
        setHalf2A(partida.placarCS2.half2A ?? 0);
        setHalf2B(partida.placarCS2.half2B ?? 0);
        setOtA(partida.placarCS2.otA ?? 0);
        setOtB(partida.placarCS2.otB ?? 0);
      } else {
        // Valores default caso já existisse um placar simples
        const pA = partida.placarA ?? 0;
        const pB = partida.placarB ?? 0;
        if (pA === 0 && pB === 0) {
          setHalf1A(0);
          setHalf1B(0);
          setHalf2A(0);
          setHalf2B(0);
          setOtA(0);
          setOtB(0);
        } else {
          // Aproximação inicial dos halfs
          setHalf1A(Math.min(pA, 6));
          setHalf1B(Math.min(pB, 6));
          setHalf2A(Math.max(0, pA - 6));
          setHalf2B(Math.max(0, pB - 6));
          setOtA(0);
          setOtB(0);
        }
      }
    }
  }, [isOpen, partida]);

  const pA = participantes.find((p) => p.id === partida.participanteAId);
  const pB = participantes.find((p) => p.id === partida.participanteBId);

  // Cálculos de Rounds
  const regA = half1A + half2A;
  const regB = half1B + half2B;
  const isEmpateRegulamentar = regA === 12 && regB === 12;

  const totalA = regA + (isEmpateRegulamentar ? otA : 0);
  const totalB = regB + (isEmpateRegulamentar ? otB : 0);

  // Validação de Vitória Oficial CS2 (MR12 / MR3 OT)
  const statusVitoria = useMemo(() => {
    // 1. Vitória no Tempo Normal (MR12)
    if (!isEmpateRegulamentar) {
      if (regA === 13 && regB <= 11) {
        return {
          valido: true,
          vencedor: 'A' as const,
          mensagem: `${pA?.nomeAmigo ?? 'Time A'} venceu no tempo normal (${regA}x${regB})`,
        };
      }
      if (regB === 13 && regA <= 11) {
        return {
          valido: true,
          vencedor: 'B' as const,
          mensagem: `${pB?.nomeAmigo ?? 'Time B'} venceu no tempo normal (${regB}x${regA})`,
        };
      }
      if (regA < 13 && regB < 13) {
        return {
          valido: false,
          vencedor: null,
          mensagem: 'Partida em andamento (um time precisa atingir 13 rounds)',
        };
      }
    }

    // 2. Overtime (MR3)
    if (isEmpateRegulamentar) {
      if (totalA >= 16 && totalA - totalB >= 2) {
        return {
          valido: true,
          vencedor: 'A' as const,
          mensagem: `${pA?.nomeAmigo ?? 'Time A'} venceu no Overtime (${totalA}x${totalB})`,
        };
      }
      if (totalB >= 16 && totalB - totalA >= 2) {
        return {
          valido: true,
          vencedor: 'B' as const,
          mensagem: `${pB?.nomeAmigo ?? 'Time B'} venceu no Overtime (${totalB}x${totalA})`,
        };
      }
      return {
        valido: false,
        vencedor: null,
        mensagem: 'Overtime em andamento (necessário 16+ rounds com 2 de vantagem)',
      };
    }

    return {
      valido: false,
      vencedor: null,
      mensagem: 'Placar irregular para regras oficiais do CS2',
    };
  }, [regA, regB, isEmpateRegulamentar, totalA, totalB, pA, pB]);

  const podeConfirmar = statusVitoria.valido;

  const handleConfirmar = () => {
    if (!podeConfirmar) return;
    setLoading(true);

    const estatisticas = {
      placarCS2: {
        half1A,
        half1B,
        half2A,
        half2B,
        otA: isEmpateRegulamentar ? otA : null,
        otB: isEmpateRegulamentar ? otB : null,
      },
    };

    if (modo === 'liga') {
      registrarPlacarLiga(partida.id, totalA, totalB, estatisticas);
    } else {
      registrarPlacarMataMata(partida.id, totalA, totalB, undefined, undefined, estatisticas);
    }

    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(0,0,0,0.8)" backdropFilter="blur(3px)" />
      <ModalContent
        bg={modalBg}
        border="1px solid"
        borderColor={cardBorder}
        boxShadow="2xl"
        borderRadius="2xl"
        overflow="hidden"
        mx={4}
      >
        {/* Tarja CS2 Topo */}
        <Box h="6px" bg="linear-gradient(90deg, #F94A29, #FDBB00, #00B4D8)" />

        <ModalHeader pt={4} pb={3} borderBottom="1px solid" borderColor={cardBorder}>
          <HStack spacing={3}>
            <Image src={LogoBola} alt="CS2" boxSize="28px" />
            <VStack align="flex-start" spacing={0}>
              <HStack spacing={2}>
                <Text fontFamily="heading" fontSize="18px" fontWeight="extrabold" color={textPrimary}>
                  PLACAR CS2 (MR12)
                </Text>
                <Badge colorScheme="yellow" fontSize="10px" px={2} borderRadius="md">
                  COMPETITIVO
                </Badge>
              </HStack>
              <Text fontSize="11px" color={textSecondary}>
                Halfs Fragmentados & Prorrogação Automática
              </Text>
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

        <ModalBody pb={4} pt={5}>
          <VStack spacing={5} align="stretch">
            {/* ── PLACAR TOTAL CONSOLIDADO ───────────────────────────── */}
            <Box
              p={4}
              bg={sectionBg}
              borderRadius="xl"
              border="1px solid"
              borderColor={cardBorder}
              textAlign="center"
            >
              <Text fontSize="11px" fontWeight={800} color={textSecondary} textTransform="uppercase" mb={1}>
                Placar Geral do Confronto
              </Text>

              <Flex justify="center" align="center" gap={6}>
                {/* Time A */}
                <VStack spacing={0} flex={1}>
                  <Text fontSize="14px" fontWeight={800} color={highlightA} noOfLines={1}>
                    {pA?.nomeAmigo ?? 'Time A'}
                  </Text>
                  <Text fontSize="11px" color={textSecondary} noOfLines={1}>
                    {pA?.timeSorteado ?? 'CT / TR'}
                  </Text>
                  <Heading fontSize="40px" fontWeight={900} color={textPrimary} mt={1}>
                    {totalA}
                  </Heading>
                </VStack>

                <Text fontSize="28px" fontWeight={900} color={textSecondary}>
                  ×
                </Text>

                {/* Time B */}
                <VStack spacing={0} flex={1}>
                  <Text fontSize="14px" fontWeight={800} color={highlightB} noOfLines={1}>
                    {pB?.nomeAmigo ?? 'Time B'}
                  </Text>
                  <Text fontSize="11px" color={textSecondary} noOfLines={1}>
                    {pB?.timeSorteado ?? 'TR / CT'}
                  </Text>
                  <Heading fontSize="40px" fontWeight={900} color={textPrimary} mt={1}>
                    {totalB}
                  </Heading>
                </VStack>
              </Flex>

              {/* Status da Validação */}
              <Box mt={3} p={2} borderRadius="lg" bg={statusVitoria.valido ? 'green.500' : 'orange.500'} color="white">
                <HStack justify="center" spacing={1.5}>
                  <Icon as={statusVitoria.valido ? FiCheck : FiAlertCircle} />
                  <Text fontSize="12px" fontWeight={700}>
                    {statusVitoria.mensagem}
                  </Text>
                </HStack>
              </Box>
            </Box>

            {/* ── 1º HALF (CT x TR) ──────────────────────────────────── */}
            <Box bg={modalBg} p={3} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={1.5}>
                  <Icon as={FiShield} color="blue.400" />
                  <Text fontSize="12px" fontWeight={800} color={textPrimary}>
                    1º HALF (Lados Iniciais)
                  </Text>
                </HStack>
                <Badge fontSize="10px" colorScheme={half1A + half1B === 12 ? 'green' : 'gray'}>
                  Total: {half1A + half1B}/12 rounds
                </Badge>
              </Flex>

              <Flex gap={3} align="center">
                <NumberInput
                  min={0}
                  max={12}
                  value={half1A}
                  onChange={(v) => setHalf1A(Number(v))}
                  flex={1}
                  size="md"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="xl"
                    fontWeight={800}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>

                <Text fontSize="14px" fontWeight={800} color={textSecondary}>
                  x
                </Text>

                <NumberInput
                  min={0}
                  max={12}
                  value={half1B}
                  onChange={(v) => setHalf1B(Number(v))}
                  flex={1}
                  size="md"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="xl"
                    fontWeight={800}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
            </Box>

            {/* ── 2º HALF (TR x CT) ──────────────────────────────────── */}
            <Box bg={modalBg} p={3} borderRadius="xl" border="1px solid" borderColor={cardBorder}>
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={1.5}>
                  <Icon as={FiTarget} color="orange.400" />
                  <Text fontSize="12px" fontWeight={800} color={textPrimary}>
                    2º HALF (Inversão de Lados)
                  </Text>
                </HStack>
                <Badge fontSize="10px" colorScheme="orange">
                  Regulamentar: {regA} x {regB}
                </Badge>
              </Flex>

              <Flex gap={3} align="center">
                <NumberInput
                  min={0}
                  max={13}
                  value={half2A}
                  onChange={(v) => setHalf2A(Number(v))}
                  flex={1}
                  size="md"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="xl"
                    fontWeight={800}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>

                <Text fontSize="14px" fontWeight={800} color={textSecondary}>
                  x
                </Text>

                <NumberInput
                  min={0}
                  max={13}
                  value={half2B}
                  onChange={(v) => setHalf2B(Number(v))}
                  flex={1}
                  size="md"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="xl"
                    fontWeight={800}
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorder}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Flex>
            </Box>

            {/* ── OVERTIME (MR3) - EXPANSÃO SE EMPATE 12x12 ─────────── */}
            {isEmpateRegulamentar && (
              <Box
                bg={useColorModeValue('yellow.50', 'rgba(253, 187, 0, 0.12)')}
                p={4}
                borderRadius="xl"
                border="2px solid"
                borderColor="#FDBB00"
              >
                <HStack spacing={2} mb={2}>
                  <Icon as={IoFlame} color="#FDBB00" boxSize={5} />
                  <Text fontSize="13px" fontWeight={900} color={textPrimary}>
                    PRORROGAÇÃO / OVERTIME (MR3)
                  </Text>
                  <Badge bg="#FDBB00" color="gray.900" fontSize="10px">
                    12x12
                  </Badge>
                </HStack>
                <Text fontSize="11px" color={textSecondary} mb={3}>
                  Informe os rounds extras conquistados no Overtime (ex: 4x2 = 16x14):
                </Text>

                <Flex gap={3} align="center">
                  <NumberInput min={0} max={30} value={otA} onChange={(v) => setOtA(Number(v))} flex={1} size="md">
                    <NumberInputField
                      textAlign="center"
                      fontSize="xl"
                      fontWeight={900}
                      bg={inputBg}
                      border="1px solid"
                      borderColor="#FDBB00"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>

                  <Text fontSize="14px" fontWeight={800} color={textSecondary}>
                    x
                  </Text>

                  <NumberInput min={0} max={30} value={otB} onChange={(v) => setOtB(Number(v))} flex={1} size="md">
                    <NumberInputField
                      textAlign="center"
                      fontSize="xl"
                      fontWeight={900}
                      bg={inputBg}
                      border="1px solid"
                      borderColor="#FDBB00"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Flex>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter pt={3} pb={4} gap={3} borderTop="1px solid" borderColor={cardBorder}>
          <Button onClick={onClose} flex={1} variant="outline" colorScheme="gray">
            CANCELAR
          </Button>
          <Button
            id="btn-confirmar-placar-cs2"
            flex={2}
            onClick={handleConfirmar}
            isLoading={loading}
            loadingText="CONFIRMANDO..."
            isDisabled={!podeConfirmar}
            colorScheme="brand"
          >
            CONFIRMAR PLACAR CS2
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
