import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LogoBola from '../assets/logos/LogoBola.png';
import { Chaveamento } from '../components/Chaveamento';
import { TabelaClassificacao } from '../components/TabelaClassificacao';
import { supabase } from '../lib/supabase';
import { useTorneioStore } from '../store/torneioStore';

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
const RefreshIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Página ───────────────────────────────────────────────────────────────────
export function Convite() {
  const { campeonatoId } = useParams<{ campeonatoId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { torneio, participantes, carregarTorneioPublico } = useTorneioStore();
  const partidas = useTorneioStore((s) => s.partidas);

  const [status, setStatus] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  const [atualizando, setAtualizando] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Progresso calculado reativamente (antes dos returns condicionais)
  const totalFinalizados = partidas.filter((p) => p.finalizada).length;
  const totalPartidas    = partidas.length;
  const progresso        = totalPartidas > 0 ? Math.round((totalFinalizados / totalPartidas) * 100) : 0;

  // Carrega o torneio pelo ID da URL
  const carregar = async (showToast = false) => {
    if (!campeonatoId) { setStatus('erro'); return; }
    if (showToast) setAtualizando(true);
    else setStatus('carregando');

    const result = await carregarTorneioPublico(campeonatoId);

    if (result) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && result.user_id === user.id) {
        setIsReadOnly(false);
      } else {
        setIsReadOnly(true);
      }
    }

    if (showToast) {
      setAtualizando(false);
      toast({
        title: result ? '✅ Dados atualizados!' : '⛔ Erro ao atualizar',
        status: result ? 'success' : 'error',
        duration: 2000,
        position: 'top',
        isClosable: true,
      });
    } else {
      setStatus(result ? 'ok' : 'erro');
    }
  };

  useEffect(() => {
    carregar();
    // Limpeza: reseta a store quando sair da página de convite
    // para não contaminar uma sessão de organizador
    return () => { /* não reseta aqui para não atrapalhar refresh */ };
  }, [campeonatoId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'carregando') {
    return (
      <Flex minH="100vh"  align="center" justify="center" direction="column" gap={4}>
        <Spinner size="xl"  thickness="4px" speed="0.8s" />
        <Text fontSize="9px" >CARREGANDO TORNEIO...</Text>
      </Flex>
    );
  }

  // ── Erro ───────────────────────────────────────────────────────────────────
  if (status === 'erro' || !torneio) {
    return (
      <Flex minH="100vh"  align="center" justify="center" px={4}>
        <Box
          maxW="400px" w="full" 
           
          boxShadow="md"
          p={8} textAlign="center"
        >
          <Heading fontFamily="heading" fontSize="20px"  mb={3}>TORNEIO NÃO ENCONTRADO</Heading>
          <Text fontSize="9px"  mb={6} lineHeight="1.8">
            Este link pode estar incorreto ou o torneio ainda não foi publicado.
          </Text>
          <VStack spacing={3}>
            <Button w="full" onClick={() => carregar()} variant="arcade" fontSize="11px">
              ▶ TENTAR NOVAMENTE
            </Button>
            <Button w="full" variant="outline" fontSize="10px"
              onClick={() => navigate('/torneio/configurar')}>
              CRIAR MEU TORNEIO
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  // ── Torneio carregado ─────────────────────────────────────────────────────

  return (
    <Box minH="100vh" >
      {/* Header somente leitura */}
      <Box
        
        borderBottom="3px solid"
        bg="#171923"
        boxShadow="0 4px 0 #000"
        position="sticky" top={0} zIndex={100}
      >
        <Flex
          maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="EAFC26 Cup" h="32px"  />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '15px', md: '19px' }}  lineHeight="1.1">{torneio.nome}</Heading>
              <HStack spacing={2}>
                <Badge
                   color="#000"
                  border="1px solid #000"
                  fontSize="7px" px={2}
                >
                  {torneio.formato === 'liga' ? 'LIGA' : torneio.formato === 'liga_com_playoffs' ? 'LIGA + PLAYOFFS' : 'MATA-MATA'}
                </Badge>
                {isReadOnly && (
                  <Badge bg="transparent" border="1px solid"   fontSize="7px" px={2}>
                    SOMENTE LEITURA
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm" variant="outline"
              onClick={() => navigate('/')}
              fontSize="9px"
            >
              ← DASHBOARD
            </Button>
            <Button
              id="btn-atualizar"
              leftIcon={<RefreshIcon /> as any}
              size="sm"
              variant="ghost"
              
              _hover={{ color: 'white', bg: 'brand.cardBg' }}
              isLoading={atualizando}
              loadingText="ATUALIZANDO..."
              onClick={() => carregar(true)}
              fontSize="9px"
            >
              ATUALIZAR
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Conteúdo */}
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} position="relative">
        {/* Barra de progresso */}
        <Box mb={6}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="9px" >
              PROGRESSO DO TORNEIO
            </Text>
            <Text fontSize="9px"  fontWeight={700}>
              {totalFinalizados}/{totalPartidas} ({progresso}%)
            </Text>
          </HStack>
          <Box w="full" h="8px"  border="1px solid"  overflow="hidden">
            <Box
              h="full"
              w={`${progresso}%`}
              bg="linear-gradient(90deg,#F94A29,#FDBB00)"
              transition="width 0.6s ease"
            />
          </Box>
        </Box>

        {/* Participantes */}
        <Box
          mb={6} 
           
          boxShadow="md"
          p={4}
        >
          <Text fontSize="9px"  fontWeight={700}
            textTransform="uppercase" letterSpacing="wide" mb={3}>
            {participantes.length} PARTICIPANTES
          </Text>
          <Flex flexWrap="wrap" gap={2}>
            {participantes.map((p) => (
              <HStack
                key={p.id}
                
                border="1px solid" 
                px={3} py={1}
                spacing={2}
              >
                <Text fontFamily="heading" fontSize="12px" >{p.nomeAmigo}</Text>
                <Badge bg="transparent" border="1px solid"   fontSize="7px" px={2}>
                  {p.timeSorteado}
                </Badge>
              </HStack>
            ))}
          </Flex>
        </Box>

        <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" mb={6} />

        {/* Conteúdo principal: tabela ou chaveamento */}
        {torneio.formato === 'liga' ? (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={5}>CLASSIFICAÇÃO</Heading>
            <TabelaClassificacao />
          </Box>
        ) : torneio.formato === 'liga_com_playoffs' ? (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={5}>CLASSIFICAÇÃO</Heading>
            <TabelaClassificacao />

            {torneio.playoffsGerados && (
              <Box mt={10}>
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>PLAYOFFS</Heading>
                <Chaveamento isReadOnly={isReadOnly} />
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={2}>CHAVEAMENTO</Heading>
            <Text fontSize="9px"  mb={5}>
              Acompanhe os confrontos e veja quem avança de fase.
            </Text>
            <Chaveamento isReadOnly={isReadOnly} />
          </Box>
        )}

        {/* Rodapé */}
        <Box mt={10} pt={6} borderTop="2px solid"  textAlign="center">
          <Text fontSize="8px" >
            EAFC26 CUP — ID: {torneio.id}
          </Text>
          <Button
            mt={3} size="sm" variant="arcade" fontSize="10px"
            onClick={() => navigate('/torneio/configurar')}
          >
            ▶ CRIAR MEU TORNEIO
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
