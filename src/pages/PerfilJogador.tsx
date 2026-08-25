import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { obterPerfil } from '../services/perfisService';
import type { Perfil } from '../types/social';
import type { Partida, Participante, Torneio } from '../types/torneio';
import { FiArrowLeft, FiAward, FiEdit2, FiShield, FiTag, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';
import { ModalEditarPerfil } from '../components/ModalEditarPerfil';
import { Navbar } from '../components/Navbar';
import { MuralDeTrofeus } from '../components/MuralDeTrofeus';

interface EstatisticasJogador {
  torneiosJogados: number;
  vitorias: number;
  golsMarcados: number;
  ouroCount: number; // 1º lugar
  prataCount: number; // 2º lugar
  bronzeCount: number; // 3º lugar
}

export function PerfilJogador() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [stats, setStats] = useState<EstatisticasJogador>({
    torneiosJogados: 0,
    vitorias: 0,
    golsMarcados: 0,
    ouroCount: 0,
    prataCount: 0,
    bronzeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    const calcularEstatisticas = async () => {
      if (!id) return;
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Buscar Perfil
      const pData = await obterPerfil(id);
      setPerfil(pData);

      // Buscar todos os torneios públicos do banco
      const { data: torneiosData, error } = await supabase
        .from('torneios_publicos')
        .select('dados');

      if (!error && torneiosData) {
        let tJogados = 0;
        let vitoriasTotal = 0;
        let golsTotal = 0;
        let ouro = 0;
        let prata = 0;
        let bronze = 0;

        torneiosData.forEach((row) => {
          const dados = row.dados as {
            torneio: Torneio;
            partidas: Partida[];
            participantes: Participante[];
          };
          if (!dados || !dados.participantes || !dados.partidas) return;

          // Verificar se o jogador participou deste torneio
          const part = dados.participantes.find(
            (p) => p.usuarioId === id || (p.nomeAmigo && p.nomeAmigo === pData?.nome)
          );

          if (part) {
            tJogados++;
            vitoriasTotal += part.vitorias || 0;
            golsTotal += part.golsPro || 0;

            // Calcular pódio se o torneio estiver finalizado
            const finalizadas = dados.partidas.filter((p) => p.finalizada).length;
            if (finalizadas === dados.partidas.length && dados.partidas.length > 0) {
              if (dados.torneio.formato === 'matamata') {
                const finalMatch = dados.partidas.find(
                  (p) => p.fase === 'final' && p.finalizada
                );
                const thirdMatch = dados.partidas.find(
                  (p) => p.fase === 'terceiro_lugar' && p.finalizada
                );

                if (finalMatch?.vencedorId === part.id) ouro++;
                else if (finalMatch?.perdedorId === part.id) prata++;
                else if (thirdMatch?.vencedorId === part.id) bronze++;
              } else {
                // Liga / Pontos Corridos: 1º, 2º e 3º por pontos
                const sorted = [...dados.participantes].sort(
                  (a, b) => b.pontos - a.pontos || b.golsPro - b.golsContra - (a.golsPro - a.golsContra)
                );
                if (sorted[0]?.id === part.id) ouro++;
                else if (sorted[1]?.id === part.id) prata++;
                else if (sorted[2]?.id === part.id) bronze++;
              }
            }
          }
        });

        setStats({
          torneiosJogados: tJogados,
          vitorias: vitoriasTotal,
          golsMarcados: golsTotal,
          ouroCount: ouro,
          prataCount: prata,
          bronzeCount: bronze,
        });
      }

      setLoading(false);
    };

    calcularEstatisticas();
  }, [id]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="12px" color={textColorMuted}>CARREGANDO PERFIL...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!perfil && !id) {
    return (
      <Box minH="100vh" p={10} textAlign="center">
        <Text color={textPrimary}>Perfil não encontrado.</Text>
        <Button mt={4} onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      <Navbar />

      <Box maxW="1000px" mx="auto" px={{ base: 3, md: 8 }} py={{ base: 4, md: 8 }}>
        <HStack justify="space-between" mb={6} align="center" flexWrap="wrap" gap={3}>
          <VStack spacing={1} align="flex-start">
            <Heading fontSize={{ base: '20px', md: '28px' }} color="brand.500">
              Hub do Jogador
            </Heading>
            <Text fontSize="13px" color={textColorMuted}>
              Perfil do participante, estatísticas globais e troféus conquistados.
            </Text>
          </VStack>
        </HStack>

        {/* Card do Perfil */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          p={{ base: 6, md: 8 }}
          mb={8}
          boxShadow="md"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'center', md: 'flex-start' }}
            justify="space-between"
            gap={6}
          >
            <HStack spacing={6} align={{ base: 'center', md: 'flex-start' }} flexWrap={{ base: 'wrap', md: 'nowrap' }} justify={{ base: 'center', md: 'flex-start' }}>
              <Avatar
                size="2xl"
                name={perfil?.nome || 'Jogador'}
                src={perfil?.foto_base64 || undefined}
                border="4px solid"
                borderColor="brand.500"
              />
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2} flex={1}>
                <Heading fontSize="26px" color={textPrimary}>{perfil?.nome || 'Jogador'}</Heading>
                {perfil?.steam_id && (
                  <Badge colorScheme="orange" fontSize="13px" px={3} py={1} borderRadius="md">
                    <HStack spacing={1.5}>
                      <FiTag size={12} />
                      <Text>{perfil.steam_id}</Text>
                    </HStack>
                  </Badge>
                )}
                <Text fontSize="12px" color={textColorMuted} mt={1}>
                  Membro desde{' '}
                  {perfil?.criado_em ? new Date(perfil.criado_em).toLocaleDateString() : '2026'}
                </Text>
              </VStack>
            </HStack>

            {/* Botão de Editar Perfil (se for o próprio usuário) */}
            {currentUserId && perfil && currentUserId === perfil.id && (
              <Button
                size="sm"
                colorScheme="orange"
                variant="outline"
                leftIcon={<FiEdit2 />}
                onClick={() => setIsEditOpen(true)}
                fontWeight={700}
              >
                Editar Perfil
              </Button>
            )}
          </Flex>
        </Box>

        {/* Modal de Edição de Perfil */}
        {perfil && (
          <ModalEditarPerfil
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            perfil={perfil}
            onPerfilAtualizado={(novoPerfil) => setPerfil(novoPerfil)}
          />
        )}

        {/* Estatísticas Globais */}
        <Heading fontSize="20px" color={textPrimary} mb={4}>
          Estatísticas Globais
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textColorMuted}>
                TORNEIOS DISPUTADOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="brand.500" fontWeight={800}>
                {stats.torneiosJogados}
              </StatNumber>
            </Stat>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textColorMuted}>
                VITÓRIAS EM JOGOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="green.500" fontWeight={800}>
                {stats.vitorias}
              </StatNumber>
            </Stat>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color={textColorMuted}>
                GOLS MARCADOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="blue.500" fontWeight={800}>
                {stats.golsMarcados}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Títulos e Pódios */}
        <Heading fontSize="20px" color={textPrimary} mb={4}>
          Títulos & Pódios
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Flex justify="center" mb={3}>
              <Box p={3} borderRadius="full" bg="rgba(253, 187, 0, 0.15)">
                <FiAward size={32} color="#FDBB00" />
              </Box>
            </Flex>
            <Heading fontSize="20px" color="#FDBB00">
              {stats.ouroCount}x Campeão
            </Heading>
            <Text fontSize="12px" color={textColorMuted} mt={1}>
              Primeiro Lugar
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Flex justify="center" mb={3}>
              <Box p={3} borderRadius="full" bg="rgba(192, 192, 192, 0.2)">
                <FiAward size={32} color={useColorModeValue('#718096', '#CBD5E0')} />
              </Box>
            </Flex>
            <Heading fontSize="20px" color={useColorModeValue('gray.600', 'gray.300')}>
              {stats.prataCount}x Vice-Campeão
            </Heading>
            <Text fontSize="12px" color={textColorMuted} mt={1}>
              Segundo Lugar
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Flex justify="center" mb={3}>
              <Box p={3} borderRadius="full" bg="rgba(205, 127, 50, 0.15)">
                <FiAward size={32} color="#CD7F32" />
              </Box>
            </Flex>
            <Heading fontSize="20px" color="#CD7F32">
              {stats.bronzeCount}x 3º Lugar
            </Heading>
            <Text fontSize="12px" color={textColorMuted} mt={1}>
              Terceiro Lugar
            </Text>
          </Box>
        </SimpleGrid>

        {/* Mural de Troféus do Jogador */}
        <MuralDeTrofeus userId={id || currentUserId} />
      </Box>
    </Box>
  );
}
