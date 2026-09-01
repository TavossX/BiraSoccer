import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { FiCheck, FiCrosshair, FiShield, FiTarget, FiZap } from 'react-icons/fi';
import { IoFootball, IoFlame, IoGameController } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import type { ModalidadeJogo } from '../types/torneio';

interface ModalSelecaoJogoProps {
  isOpen: boolean;
  onClose: () => void;
  grupoId?: string | null;
}

export function ModalSelecaoJogo({ isOpen, onClose, grupoId }: ModalSelecaoJogoProps) {
  const navigate = useNavigate();

  const modalBg = useColorModeValue('white', 'gray.850');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const itemBg = useColorModeValue('gray.50', 'gray.800');

  const handleSelect = (modalidade: ModalidadeJogo) => {
    onClose();
    const query = grupoId ? `?grupoId=${grupoId}` : '';
    navigate(`/torneio/configurar${query}`, {
      state: { modalidade },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="2xl">
      <ModalOverlay bg="rgba(0, 0, 0, 0.8)" backdropFilter="blur(5px)" />
      <ModalContent
        bg={modalBg}
        border="1px solid"
        borderColor={cardBorder}
        boxShadow="2xl"
        borderRadius="2xl"
        overflow="hidden"
        mx={4}
      >
        {/* Tarja topo degradê */}
        <Box h="6px" bg="linear-gradient(90deg, #F94A29 0%, #FDBB00 50%, #00B4D8 100%)" />

        <ModalHeader pt={5} pb={3} textAlign="center">
          <VStack spacing={1}>
            <Heading fontSize={{ base: '20px', md: '24px' }} fontWeight={900} color={textPrimary}>
              ESCOLHA A MODALIDADE
            </Heading>
            <Text fontSize="13px" fontWeight={500} color={textSecondary}>
              Selecione o jogo para carregar as regras, sorteios e placares específicos
            </Text>
          </VStack>
        </ModalHeader>

        <ModalCloseButton
          top={4}
          right={4}
          color={textSecondary}
          borderRadius="md"
          _hover={{ bg: 'red.500', color: 'white' }}
        />

        <ModalBody p={{ base: 4, md: 6 }}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {/* ── CARD 1: EA FC 26 (FUTEBOL VIRTUAL) ──────────────────── */}
            <Box
              as="button"
              textAlign="left"
              p={6}
              borderRadius="2xl"
              bg={itemBg}
              border="2px solid"
              borderColor={cardBorder}
              position="relative"
              overflow="hidden"
              cursor="pointer"
              transition="all 0.25s ease-in-out"
              _hover={{
                transform: 'scale(1.02)',
                borderColor: '#F94A29',
                boxShadow: '0 0 24px rgba(249, 74, 41, 0.35)',
                bg: useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.08)'),
              }}
              _active={{ transform: 'scale(0.99)' }}
              onClick={() => handleSelect('eafc')}
            >
              {/* Badge de Categoria */}
              <Badge
                colorScheme="orange"
                variant="solid"
                fontSize="10px"
                fontWeight={800}
                px={2.5}
                py={0.5}
                borderRadius="full"
                mb={4}
              >
                FUTEBOL VIRTUAL
              </Badge>

              <HStack spacing={3} mb={3}>
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #C80000, #F94A29)"
                  color="white"
                  align="center"
                  justify="center"
                  boxShadow="0 4px 12px rgba(249, 74, 41, 0.4)"
                >
                  <Icon as={IoFootball} boxSize={6} />
                </Flex>
                <VStack align="flex-start" spacing={0}>
                  <Heading fontSize="20px" fontWeight={900} color={textPrimary}>
                    EA FC 26
                  </Heading>
                  <Text fontSize="12px" color={textSecondary}>
                    Futebol Clássico & Ligas
                  </Text>
                </VStack>
              </HStack>

              <Text fontSize="12px" color={textSecondary} mb={4} lineHeight="short">
                Campeonatos com pontos corridos, mata-mata com ida e volta, draft de clubes e estatísticas completas de posse e chutes.
              </Text>

              {/* Recursos Inclusos */}
              <VStack align="flex-start" spacing={1.5} pt={2} borderTop="1px solid" borderColor={cardBorder}>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#F94A29" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Ligas, Mata-Mata e Playoffs
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#F94A29" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Sorteio e Draft Online de Clubes
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#F94A29" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Estatísticas de Posse de Bola e Chutes
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* ── CARD 2: COUNTER-STRIKE 2 (FPS TÁTICO) ───────────────── */}
            <Box
              as="button"
              textAlign="left"
              p={6}
              borderRadius="2xl"
              bg={itemBg}
              border="2px solid"
              borderColor={cardBorder}
              position="relative"
              overflow="hidden"
              cursor="pointer"
              transition="all 0.25s ease-in-out"
              _hover={{
                transform: 'scale(1.02)',
                borderColor: '#FDBB00',
                boxShadow: '0 0 24px rgba(253, 187, 0, 0.4)',
                bg: useColorModeValue('yellow.50', 'rgba(253, 187, 0, 0.08)'),
              }}
              _active={{ transform: 'scale(0.99)' }}
              onClick={() => handleSelect('cs2')}
            >
              {/* Badge de Categoria */}
              <Badge
                bg="#FDBB00"
                color="gray.900"
                fontSize="10px"
                fontWeight={800}
                px={2.5}
                py={0.5}
                borderRadius="full"
                mb={4}
              >
                FPS TÁTICO
              </Badge>

              <HStack spacing={3} mb={3}>
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #FDBB00, #E5A000)"
                  color="gray.900"
                  align="center"
                  justify="center"
                  boxShadow="0 4px 12px rgba(253, 187, 0, 0.4)"
                >
                  <Icon as={IoFlame} boxSize={6} />
                </Flex>
                <VStack align="flex-start" spacing={0}>
                  <Heading fontSize="20px" fontWeight={900} color={textPrimary}>
                    Counter-Strike 2
                  </Heading>
                  <Text fontSize="12px" color={textSecondary}>
                    Competitivo & Veto de Mapas
                  </Text>
                </VStack>
              </HStack>

              <Text fontSize="12px" color={textSecondary} mb={4} lineHeight="short">
                Mata-mata competitivo com sala de Veto de Mapas da Rotação Ativa (BO1/BO3), placares em Halfs (MR12) e Prorrogação (Overtime).
              </Text>

              {/* Recursos Inclusos */}
              <VStack align="flex-start" spacing={1.5} pt={2} borderTop="1px solid" borderColor={cardBorder}>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#FDBB00" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Veto de Mapas (Active Duty BO1 / BO3)
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#FDBB00" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Placar MR12 & Overtime (MR3)
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiCheck} color="#FDBB00" boxSize={3.5} />
                  <Text fontSize="11px" fontWeight={600} color={textPrimary}>
                    Chaves com Fragmentação de Halfs
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
