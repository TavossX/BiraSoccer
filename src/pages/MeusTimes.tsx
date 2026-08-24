import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { supabase } from '../lib/supabase';
import { listarMeusTimes, excluirTime } from '../services/timesCustomizadosService';
import type { TimeCustomizado } from '../services/timesCustomizadosService';
import { ModalCriarTime } from '../components/ModalCriarTime';
import { IoMdAdd } from 'react-icons/io';
import { FiEdit2, FiTrash2, FiArrowLeft, FiShield } from 'react-icons/fi';

export function MeusTimes() {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [times, setTimes] = useState<TimeCustomizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [timeParaEditar, setTimeParaEditar] = useState<TimeCustomizado | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const hoverShadow = useColorModeValue('lg', 'dark-lg');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const headerBg = useColorModeValue('white', 'gray.900');

  const fetchTimes = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const data = await listarMeusTimes(user.id);
      setTimes(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTimes();
  }, [fetchTimes]);

  const handleExcluir = async (id: string, nome: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir "${nome}"?`);
    if (!confirm) return;

    const ok = await excluirTime(id);
    if (ok) {
      toast({ title: 'Time excluído!', status: 'success', duration: 3000, position: 'top' });
      setTimes((prev) => prev.filter((t) => t.id !== id));
    } else {
      toast({ title: 'Erro ao excluir time.', status: 'error', duration: 3000 });
    }
  };

  const handleEditar = (time: TimeCustomizado) => {
    setTimeParaEditar(time);
    onOpen();
  };

  const handleCriarNovo = () => {
    setTimeParaEditar(null);
    onOpen();
  };

  const handleTimeSalvo = (time: TimeCustomizado) => {
    setTimes((prev) => {
      const exists = prev.find((t) => t.id === time.id);
      if (exists) {
        return prev.map((t) => (t.id === time.id ? time : t));
      }
      return [time, ...prev];
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Box minH="100vh">
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        as="header"
        bg={headerBg}
        boxShadow="lg"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex
          maxW="1200px"
          mx="auto"
          px={{ base: 4, md: 8 }}
          py={3}
          align="center"
          justify="space-between"
          gap={3}
        >
          <HStack spacing={3}>
            <Image
              src={LogoCompleta}
              alt="EAFC26 Cup"
              h={{ base: '36px', md: '48px' }}
              cursor="pointer"
              onClick={() => navigate('/dashboard')}
            />
          </HStack>

          <HStack spacing={2} flexShrink={0}>
            <Button
              size="sm"
              onClick={() => navigate('/dashboard')}
              variant="outline"
              leftIcon={<FiArrowLeft /> as any}
            >
              Dashboard
            </Button>
            <Button
              size="sm"
              onClick={handleLogout}
              colorScheme="red"
              variant="outline"
            >
              Logout
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* ── Conteúdo ─────────────────────────────────────────────── */}
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        {/* Saudação */}
        <Box
          bg={cardBg}
          boxShadow="sm"
          px={6}
          py={4}
          mb={8}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="lg"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={0}>
              <HStack spacing={2} align="center">
                <Box as={FiShield} size="24px" color="brand.500" />
                <Heading fontFamily="heading" fontSize={{ base: '22px', md: '30px' }} color={textPrimary}>
                  Meus Times
                </Heading>
              </HStack>
              <Text fontSize="13px" color={textColorMuted} mt={1}>
                Gerencie seus times personalizados com escudos customizados.
              </Text>
            </VStack>
            <Button
              colorScheme="brand"
              leftIcon={<IoMdAdd /> as any}
              onClick={handleCriarNovo}
              size="sm"
            >
              Criar Novo Time
            </Button>
          </HStack>
        </Box>

        {/* Stat card */}
        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4} mb={8}>
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="lg"
            boxShadow="sm"
            p={5}
          >
            <Stat>
              <StatLabel
                fontSize="12px"
                fontWeight={700}
                color={textColorMuted}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Total de Times
              </StatLabel>
              <StatNumber
                fontFamily="heading"
                fontSize="3xl"
                fontWeight={900}
                color={textPrimary}
                lineHeight="1.2"
              >
                {times.length}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Divisória */}
        <Box
          h="4px"
          bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00, #F94A29, #C80000)"
          mb={8}
          borderRadius="full"
        />

        {/* Grid de times */}
        {loading ? (
          <Flex justify="center" py={10}>
            <VStack spacing={3}>
              <Spinner size="xl" thickness="4px" color="brand.500" />
              <Text fontSize="12px" color={textColorMuted}>CARREGANDO...</Text>
            </VStack>
          </Flex>
        ) : times.length === 0 ? (
          <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg" boxShadow="sm" p={10} textAlign="center">
            <VStack spacing={4}>
              <Box as={FiShield} size="48px" color="gray.400" />
              <Text fontSize="md" fontWeight={700} color={textPrimary}>
                Você ainda não possui nenhum time personalizado.
              </Text>
              <Text fontSize="13px" color={textColorMuted}>
                Crie seu primeiro time com escudo customizado!
              </Text>
              <Button
                onClick={handleCriarNovo}
                colorScheme="brand"
                leftIcon={<IoMdAdd /> as any}
              >
                Criar Primeiro Time
              </Button>
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={6}>
            {times.map((time) => (
              <Box
                key={time.id}
                bg={cardBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
                transition="all 0.25s ease"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: hoverShadow,
                  borderColor: 'brand.500',
                }}
              >
                {/* Barra decorativa topo */}
                <Box
                  h="4px"
                  bg="linear-gradient(90deg, #F94A29, #FDBB00)"
                />

                {/* Conteúdo do card */}
                <VStack p={4} spacing={3}>
                  {/* Escudo */}
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    boxShadow="sm"
                    border="1px solid"
                    borderColor={cardBorder}
                    p={1}
                  >
                    <Image
                      src={time.escudo_base64}
                      alt={time.nome}
                      boxSize="80px"
                      objectFit="cover"
                      borderRadius="sm"
                    />
                  </Box>

                  {/* Nome */}
                  <Text
                    fontFamily="heading"
                    fontWeight={700}
                    fontSize="sm"
                    color={textPrimary}
                    textAlign="center"
                    noOfLines={2}
                  >
                    {time.nome}
                  </Text>

                  {/* Data de criação */}
                  <Text fontSize="xs" color={textColorMuted}>
                    {new Date(time.created_at).toLocaleDateString()}
                  </Text>

                  {/* Ações */}
                  <HStack spacing={2} w="100%">
                    <Tooltip label="Editar" placement="top">
                      <IconButton
                        aria-label="Editar time"
                        icon={<FiEdit2 /> as any}
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        flex={1}
                        onClick={() => handleEditar(time)}
                      />
                    </Tooltip>
                    <Tooltip label="Excluir" placement="top">
                      <IconButton
                        aria-label="Excluir time"
                        icon={<FiTrash2 /> as any}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        flex={1}
                        onClick={() => handleExcluir(time.id, time.nome)}
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Modal Criar / Editar Time */}
      <ModalCriarTime
        isOpen={isOpen}
        onClose={() => {
          setTimeParaEditar(null);
          onClose();
        }}
        timeParaEditar={timeParaEditar}
        onTimeSalvo={handleTimeSalvo}
        userId={userId}
      />
    </Box>
  );
}
