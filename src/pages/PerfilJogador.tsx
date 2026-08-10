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
import { FiArrowLeft, FiAward, FiShield, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';

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

  useEffect(() => {
    const calcularEstatisticas = async () => {
      if (!id) return;
      setLoading(true);

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
            participantes: Participante[];
            partidas: Partida[];
          };

          if (!dados || !dados.participantes || !dados.partidas) return;

          // Encontra se este jogador participou deste torneio
          const partDoJogador = dados.participantes.find(
            (pt) => pt.usuarioId === id
          );

          if (partDoJogador) {
            tJogados++;

            // Contabilizar gols e estatísticas da liga se existirem
            golsTotal += partDoJogador.golsPro || 0;

            // Calcular vitórias em partidas
            dados.partidas.forEach((p) => {
              if (p.finalizada && p.vencedorId === partDoJogador.id) {
                vitoriasTotal++;
              }
            });

            // Se o torneio possui partidas de fase final/mata-mata ou liga calculada
            const finalMatch = dados.partidas.find(
              (p) => p.fase === 'final' && p.finalizada
            );
            const terceiroMatch = dados.partidas.find(
              (p) => p.fase === 'terceiro_lugar' && p.finalizada
            );

            if (finalMatch) {
              if (finalMatch.vencedorId === partDoJogador.id) {
                ouro++;
              } else if (finalMatch.perdedorId === partDoJogador.id) {
                prata++;
              }
            }

            if (terceiroMatch && terceiroMatch.vencedorId === partDoJogador.id) {
              bronze++;
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
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!perfil && !id) {
    return (
      <Box minH="100vh" p={10} textAlign="center">
        <Text>Perfil não encontrado.</Text>
        <Button mt={4} onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={10}>
      <Box maxW="1000px" mx="auto">
        <HStack justify="space-between" mb={8} align="flex-start">
          <VStack spacing={2} align="flex-start">
            <Button
              size="xs"
              variant="ghost"
              mb={2}
              onClick={() => navigate('/dashboard')}
              px={0}
              leftIcon={<FiArrowLeft />}
            >
              Voltar
            </Button>
            <Heading fontSize={{ base: '24px', md: '32px' }} color="brand.500">
              Hub do Jogador
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Perfil do participante, estatísticas globais e troféus conquistados.
            </Text>
          </VStack>
          <ThemeToggle />
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
            gap={6}
          >
            <Avatar
              size="2xl"
              name={perfil?.nome || 'Jogador'}
              src={perfil?.foto_base64 || undefined}
              border="4px solid"
              borderColor="brand.500"
            />
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2} flex={1}>
              <Heading fontSize="26px">{perfil?.nome || 'Jogador'}</Heading>
              {perfil?.steam_id && (
                <Badge colorScheme="orange" fontSize="13px" px={3} py={1} borderRadius="md">
                  🎮 {perfil.steam_id}
                </Badge>
              )}
              <Text fontSize="12px" color="gray.500" mt={1}>
                Membro desde{' '}
                {perfil?.criado_em ? new Date(perfil.criado_em).toLocaleDateString() : '2026'}
              </Text>
            </VStack>
          </Flex>
        </Box>

        {/* Estatísticas Globais */}
        <Heading fontSize="20px" mb={4}>
          Estatísticas Globais
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color="gray.500">
                TORNEIOS DISPUTADOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="brand.500" fontWeight={800}>
                {stats.torneiosJogados}
              </StatNumber>
            </Stat>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color="gray.500">
                VITÓRIAS EM JOGOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="green.500" fontWeight={800}>
                {stats.vitorias}
              </StatNumber>
            </Stat>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={5} boxShadow="sm">
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} color="gray.500">
                GOLS MARCADOS
              </StatLabel>
              <StatNumber fontSize="3xl" color="blue.500" fontWeight={800}>
                {stats.golsMarcados}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Galeria de Troféus */}
        <Heading fontSize="20px" mb={4}>
          Galeria de Troféus 🏆
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Text fontSize="40px" mb={2}>
              🥇
            </Text>
            <Heading fontSize="20px" color="#FDBB00">
              {stats.ouroCount}x Campeão
            </Heading>
            <Text fontSize="12px" color="gray.500" mt={1}>
              Primeiro Lugar
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Text fontSize="40px" mb={2}>
              🥈
            </Text>
            <Heading fontSize="20px" color="gray.400">
              {stats.prataCount}x Vice-Campeão
            </Heading>
            <Text fontSize="12px" color="gray.500" mt={1}>
              Segundo Lugar
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl" p={6} textAlign="center" boxShadow="sm">
            <Text fontSize="40px" mb={2}>
              🥉
            </Text>
            <Heading fontSize="20px" color="#CD7F32">
              {stats.bronzeCount}x 3º Lugar
            </Heading>
            <Text fontSize="12px" color="gray.500" mt={1}>
              Terceiro Lugar
            </Text>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
