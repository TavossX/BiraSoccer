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
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useTorneioStore } from '../store/torneioStore';
import type { Partida } from '../types/torneio';
import LogoBola from '../assets/logos/LogoBola.png';

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

  useEffect(() => {
    if (isOpen) {
      setGolsA(0);
      setGolsB(0);
      setPenaltisA(0);
      setPenaltisB(0);
    }
  }, [isOpen, partida.id]);

  const pA = participantes.find((p) => p.id === partida.participanteAId);
  const pB = participantes.find((p) => p.id === partida.participanteBId);

  const idaPartida = useMemo(() => {
    if (modo !== 'matamata' || partida.jogo !== 'volta' || !partida.confrontoId) return null;
    return partidas.find(
      (p) => p.confrontoId === partida.confrontoId && p.jogo === 'ida'
    ) ?? null;
  }, [partidas, partida, modo]);

  const agregadoAtual = useMemo(() => {
    if (!idaPartida?.finalizada) return null;
    const golsA_total = (idaPartida.placarB ?? 0) + golsA;
    const golsB_total = (idaPartida.placarA ?? 0) + golsB;
    return { golsA_total, golsB_total };
  }, [idaPartida, golsA, golsB]);

  const mostrarPenaltisVolta =
    modo === 'matamata' &&
    partida.jogo === 'volta' &&
    idaPartida?.finalizada === true &&
    agregadoAtual !== null &&
    agregadoAtual.golsA_total === agregadoAtual.golsB_total;

  const mostrarPenaltisJogoUnico =
    modo === 'matamata' &&
    partida.jogo === null &&
    golsA === golsB;

  const mostrarPenaltis = mostrarPenaltisVolta || mostrarPenaltisJogoUnico;
  const penaltisEmpatados = mostrarPenaltis && penaltisA === penaltisB;
  const podeConfirmar = !penaltisEmpatados;

  const handleConfirmar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));

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
      <ModalOverlay bg="rgba(0,0,0,0.88)" />
      <ModalContent
        
        
        
        boxShadow="lg"
        borderRadius="md"
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
          borderBottom="1px solid #C3c3c3"
          
          
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" boxSize="28px" />
            <VStack align="flex-start" spacing={0}>
              <Text fontFamily="heading" fontSize="18px" >
                LANÇAR PLACAR
              </Text>
              <HStack spacing={2}>
                <Badge
                  
                  color="#000"
                  border="1px solid #C3c3c3"
                  fontSize="10px"
                  px={2}
                >
                  {modo === 'liga' ? 'LIGA' : `MATA-MATA — ${partida.jogo === 'ida' ? 'IDA' : partida.jogo === 'volta' ? 'VOLTA' : 'ÚNICO'}`}
                </Badge>
                {partida.rodada > 0 && modo === 'liga' && (
                  <Badge border="1px solid"   bg="transparent" fontSize="10px" px={2}>
                    RD {partida.rodada}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          top={4} right={4}
          
          
          
          borderRadius="md"
          _hover={{ bg: 'brand.red' }}
        />

        <ModalBody pb={4}>
          <VStack spacing={5}>
            {/* Placar principal */}
            <Flex w="full" align="center" gap={4}>
              {/* Player A */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" noOfLines={1} >
                    {pA?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px"  noOfLines={1}>{pA?.timeSorteado ?? '—'}</Text>
                </VStack>
                <NumberInput
                  min={0} max={99}
                  value={golsA}
                  onChange={(v) => setGolsA(Number(v))}
                  size="lg"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="3xl"
                    fontWeight={900}
                    fontFamily="heading"
                    
                    
                    
                    
                    _focus={{ borderColor: 'brand.orange', boxShadow: 'none' }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper
                      
                      
                      
                      _hover={{ bg: 'brand.red' }}
                    />
                    <NumberDecrementStepper
                      
                      
                      
                      _hover={{ bg: 'brand.red' }}
                    />
                  </NumberInputStepper>
                </NumberInput>
              </VStack>

              {/* Separador */}
              <Text fontFamily="heading" fontSize="3xl"  mt={6} opacity={0.8}>×</Text>

              {/* Player B */}
              <VStack flex={1} spacing={2}>
                <VStack spacing={0} textAlign="center">
                  <Text fontFamily="heading" fontWeight={700} fontSize="15px" noOfLines={1} >
                    {pB?.nomeAmigo ?? '?'}
                  </Text>
                  <Text fontSize="12px"  noOfLines={1}>{pB?.timeSorteado ?? '—'}</Text>
                </VStack>
                <NumberInput
                  min={0} max={99}
                  value={golsB}
                  onChange={(v) => setGolsB(Number(v))}
                  size="lg"
                >
                  <NumberInputField
                    textAlign="center"
                    fontSize="3xl"
                    fontWeight={900}
                    fontFamily="heading"
                    
                    
                    
                    
                    _focus={{ borderColor: 'brand.orange', boxShadow: 'none' }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper
                      
                      
                      
                      _hover={{ bg: 'brand.red' }}
                    />
                    <NumberDecrementStepper
                      
                      
                      
                      _hover={{ bg: 'brand.red' }}
                    />
                  </NumberInputStepper>
                </NumberInput>
              </VStack>
            </Flex>

            {/* Agregado parcial */}
            {agregadoAtual && idaPartida && (
              <>
                <Box w="full" h="2px"  />
                <Box
                  w="full"
                  
                  
                  
                  p={3}
                >
                  <Text fontSize="12px"  textAlign="center" mb={2} textTransform="uppercase" letterSpacing="wide">
                    Placar Agregado (tempo real)
                  </Text>
                  <HStack justify="center" spacing={6}>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px"  noOfLines={1}>{pA?.nomeAmigo}</Text>
                      <Text
                        fontFamily="heading"
                        fontSize="3xl"
                        fontWeight={900}
                        color={agregadoAtual.golsA_total > agregadoAtual.golsB_total ? 'brand.mustard' : 'brand.textMain'}
                      >
                        {agregadoAtual.golsA_total}
                      </Text>
                    </VStack>
                    <Text  fontFamily="heading" fontSize="xl">—</Text>
                    <VStack spacing={0} textAlign="center">
                      <Text fontSize="12px"  noOfLines={1}>{pB?.nomeAmigo}</Text>
                      <Text
                        fontFamily="heading"
                        fontSize="3xl"
                        fontWeight={900}
                        color={agregadoAtual.golsB_total > agregadoAtual.golsA_total ? 'brand.mustard' : 'brand.textMain'}
                      >
                        {agregadoAtual.golsB_total}
                      </Text>
                    </VStack>
                  </HStack>
                  {agregadoAtual.golsA_total === agregadoAtual.golsB_total && (
                    <Text fontSize="12px"  textAlign="center" mt={2} fontWeight={600}>
                      ⚠ Empate no agregado — pênaltis necessários
                    </Text>
                  )}
                </Box>
              </>
            )}

            {/* Campo de pênaltis */}
            {mostrarPenaltis && (
              <>
                <Box w="full" h="2px"  />
                <VStack w="full" spacing={3}>
                  <Alert
                    status="warning"
                    
                    
                    
                    py={2}
                  >
                    <AlertIcon  />
                    <AlertDescription fontSize="12px" >
                      DISPUTA DE PÊNALTIS — informe o placar.
                    </AlertDescription>
                  </Alert>

                  <Flex w="full" align="center" gap={4}>
                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" >{pA?.nomeAmigo ?? '?'}</Text>
                      <NumberInput min={0} max={30} value={penaltisA} onChange={(v) => setPenaltisA(Number(v))}>
                        <NumberInputField
                          textAlign="center"
                          
                          
                          
                          fontFamily="heading"
                          fontWeight={900}
                          fontSize="2xl"
                          _focus={{ borderColor: 'brand.orange', boxShadow: 'none' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper    _hover={{ bg: 'brand.red' }} />
                          <NumberDecrementStepper    _hover={{ bg: 'brand.red' }} />
                        </NumberInputStepper>
                      </NumberInput>
                    </VStack>

                    <Text  fontFamily="heading" fontSize="xl" mt={5}>×</Text>

                    <VStack flex={1} spacing={1}>
                      <Text fontSize="12px" >{pB?.nomeAmigo ?? '?'}</Text>
                      <NumberInput min={0} max={30} value={penaltisB} onChange={(v) => setPenaltisB(Number(v))}>
                        <NumberInputField
                          textAlign="center"
                          
                          
                          
                          fontFamily="heading"
                          fontWeight={900}
                          fontSize="2xl"
                          _focus={{ borderColor: 'brand.orange', boxShadow: 'none' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper    _hover={{ bg: 'brand.red' }} />
                          <NumberDecrementStepper    _hover={{ bg: 'brand.red' }} />
                        </NumberInputStepper>
                      </NumberInput>
                    </VStack>
                  </Flex>

                  {penaltisEmpatados && (
                    <Text fontSize="12px"  textAlign="center">
                      ⛔ Pênaltis empatados — defina um vencedor.
                    </Text>
                  )}
                </VStack>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter
          pt={2} pb={5} gap={3}
          borderTop="1px solid #C3c3c3"
          
        >
          <Button
            onClick={onClose}
            flex={1}
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
