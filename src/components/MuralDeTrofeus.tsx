import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { obterMuralConquistas } from '../services/conquistasService';
import type { ConquistaComStatus } from '../types/gamificacao';
import {
  FiAward,
  FiLock,
  FiCheckCircle,
  FiZap,
  FiStar,
  FiShield,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi';

interface MuralDeTrofeusProps {
  userId: string | null;
}

// Mapeamento de ícones gráficos para fallback se não for emoji
function renderIconeConquista(icone: string, desbloqueada: boolean) {
  // Se for emoji
  if (icone && icone.length <= 4) {
    return <Text fontSize="26px">{icone}</Text>;
  }

  // Ícones do react-icons
  let IconComponent = FiAward;
  if (icone === 'FiTarget') IconComponent = FiTarget;
  else if (icone === 'FiZap') IconComponent = FiZap;
  else if (icone === 'FiShield') IconComponent = FiShield;
  else if (icone === 'FiTrendingUp') IconComponent = FiTrendingUp;

  return (
    <Icon
      as={IconComponent}
      boxSize={6}
      color={desbloqueada ? 'yellow.400' : 'gray.400'}
    />
  );
}

export function MuralDeTrofeus({ userId }: MuralDeTrofeusProps) {
  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const unlockedBg = useColorModeValue(
    'linear-gradient(135deg, rgba(254, 235, 200, 0.4) 0%, rgba(255, 255, 255, 0.9) 100%)',
    'linear-gradient(135deg, rgba(183, 121, 31, 0.15) 0%, rgba(26, 32, 44, 0.9) 100%)'
  );
  const lockedBg = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      const lista = await obterMuralConquistas(userId);
      setConquistas(lista);
      setLoading(false);
    };
    carregar();
  }, [userId]);

  const total = conquistas.length;
  const desbloqueadasCount = conquistas.filter((c) => c.desbloqueada).length;
  const porcentagem = total > 0 ? Math.round((desbloqueadasCount / total) * 100) : 0;
  const totalXp = conquistas
    .filter((c) => c.desbloqueada)
    .reduce((acc, curr) => acc + (curr.pontos_xp || 0), 0);

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={cardBorder}
      borderRadius="2xl"
      p={{ base: 5, md: 6 }}
      boxShadow="sm"
      mb={8}
    >
      {/* ── Header do Mural ───────────────────────────────────────── */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={4}
        mb={5}
      >
        <HStack spacing={3}>
          <Flex
            boxSize="44px"
            borderRadius="xl"
            bg="linear-gradient(135deg, #F94A29, #FDBB00)"
            align="center"
            justify="center"
            color="white"
            boxShadow="md"
          >
            <Icon as={FiAward} boxSize={6} />
          </Flex>
          <VStack align="flex-start" spacing={0.5}>
            <HStack spacing={2}>
              <Heading fontFamily="heading" fontSize={{ base: '18px', md: '20px' }} color={textPrimary}>
                Mural de Conquistas & Troféus
              </Heading>
              <Badge colorScheme="orange" variant="subtle" fontSize="11px" borderRadius="full" px={2}>
                {desbloqueadasCount}/{total}
              </Badge>
            </HStack>
            <Text fontSize="13px" color={textSecondary}>
              Desbloqueie troféus exclusivos marcando gols, vencendo torneios e jogando partidas!
            </Text>
          </VStack>
        </HStack>

        {/* Badge de XP Total */}
        <HStack
          bg={useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.15)')}
          px={3.5}
          py={2}
          borderRadius="xl"
          border="1px solid"
          borderColor="brand.500"
          spacing={2}
        >
          <Icon as={FiStar} color="brand.500" />
          <Text fontSize="12px" fontWeight={700} color={textSecondary}>
            XP Acumulado:
          </Text>
          <Text fontSize="15px" fontWeight={900} color="brand.500">
            {totalXp} XP
          </Text>
        </HStack>
      </Flex>

      {/* ── Barra de Progresso Geral ──────────────────────────────── */}
      <Box mb={6}>
        <Flex justify="space-between" align="center" mb={1.5}>
          <Text fontSize="12px" fontWeight={700} color={textSecondary}>
            Progresso das Conquistas
          </Text>
          <Text fontSize="12px" fontWeight={800} color="brand.500">
            {porcentagem}% Concluído
          </Text>
        </Flex>
        <Progress
          value={porcentagem}
          size="sm"
          borderRadius="full"
          colorScheme="orange"
          bg={useColorModeValue('gray.100', 'gray.700')}
          hasStripe
          isAnimated
        />
      </Box>

      {/* ── Grid de Cards de Conquistas ───────────────────────────── */}
      {loading ? (
        <Flex justify="center" py={8}>
          <VStack spacing={2}>
            <Spinner size="md" color="brand.500" thickness="3px" />
            <Text fontSize="xs" color={textSecondary}>Carregando galeria de troféus...</Text>
          </VStack>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {conquistas.map((conquista) => {
            const isDesbloqueada = conquista.desbloqueada;

            return (
              <Box
                key={conquista.id}
                p={4}
                borderRadius="xl"
                bg={isDesbloqueada ? unlockedBg : lockedBg}
                border="1px solid"
                borderColor={
                  isDesbloqueada
                    ? 'yellow.400'
                    : cardBorder
                }
                boxShadow={
                  isDesbloqueada
                    ? '0 0 15px rgba(236, 201, 75, 0.2)'
                    : 'none'
                }
                opacity={isDesbloqueada ? 1 : 0.55}
                filter={isDesbloqueada ? 'none' : 'grayscale(80%)'}
                transition="all 0.25s ease"
                _hover={{
                  transform: isDesbloqueada ? 'translateY(-3px)' : 'none',
                  boxShadow: isDesbloqueada
                    ? '0 6px 20px rgba(236, 201, 75, 0.35)'
                    : 'none',
                  opacity: isDesbloqueada ? 1 : 0.8,
                  filter: isDesbloqueada ? 'none' : 'grayscale(40%)',
                }}
                position="relative"
                overflow="hidden"
              >
                {/* Efeito topo luminoso para desbloqueada */}
                {isDesbloqueada && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="3px"
                    bg="linear-gradient(90deg, #FDBB00, #F94A29, #FDBB00)"
                  />
                )}

                <HStack align="flex-start" spacing={3.5}>
                  {/* Ícone com Moldura */}
                  <Flex
                    boxSize="48px"
                    borderRadius="lg"
                    bg={
                      isDesbloqueada
                        ? 'linear-gradient(135deg, rgba(236, 201, 75, 0.3), rgba(249, 74, 41, 0.2))'
                        : useColorModeValue('gray.200', 'gray.700')
                    }
                    border="1px solid"
                    borderColor={isDesbloqueada ? 'yellow.400' : 'transparent'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                    position="relative"
                  >
                    {renderIconeConquista(conquista.icone, isDesbloqueada)}

                    {/* Selo de Bloqueado/Desbloqueado */}
                    <Box
                      position="absolute"
                      bottom="-4px"
                      right="-4px"
                      bg={isDesbloqueada ? 'yellow.400' : 'gray.600'}
                      color={isDesbloqueada ? 'gray.900' : 'white'}
                      borderRadius="full"
                      p="2px"
                      boxShadow="sm"
                    >
                      <Icon
                        as={isDesbloqueada ? FiCheckCircle : FiLock}
                        boxSize="11px"
                      />
                    </Box>
                  </Flex>

                  {/* Informações da Conquista */}
                  <Box flex={1} minW={0}>
                    <HStack justify="space-between" align="center" mb={1}>
                      <Text
                        fontSize="14px"
                        fontWeight={800}
                        color={textPrimary}
                        noOfLines={1}
                      >
                        {conquista.titulo}
                      </Text>
                      <Badge
                        colorScheme={isDesbloqueada ? 'yellow' : 'gray'}
                        variant={isDesbloqueada ? 'solid' : 'subtle'}
                        fontSize="10px"
                        borderRadius="md"
                        px={1.5}
                      >
                        +{conquista.pontos_xp} XP
                      </Badge>
                    </HStack>

                    <Text
                      fontSize="12px"
                      color={textSecondary}
                      lineHeight="1.3"
                      mb={2}
                    >
                      {conquista.descricao}
                    </Text>

                    {/* Status de Desbloqueio */}
                    {isDesbloqueada ? (
                      <HStack spacing={1}>
                        <Icon as={FiCheckCircle} color="green.400" boxSize={3} />
                        <Text fontSize="10px" color="green.500" fontWeight={700}>
                          Desbloqueado {conquista.desbloqueadaEm ? `em ${new Date(conquista.desbloqueadaEm).toLocaleDateString()}` : ''}
                        </Text>
                      </HStack>
                    ) : (
                      <HStack spacing={1}>
                        <Icon as={FiLock} color="gray.400" boxSize={3} />
                        <Text fontSize="10px" color={textSecondary} fontWeight={600}>
                          Bloqueado
                        </Text>
                      </HStack>
                    )}
                  </Box>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
