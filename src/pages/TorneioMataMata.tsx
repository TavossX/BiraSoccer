import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useDisclosure,
  Spinner,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import { Chaveamento } from '../components/Chaveamento';
import { ModalCompartilhar } from '../components/ModalCompartilhar';
import LogoBola from '../assets/logos/LogoBola.png';
import { supabase } from '../lib/supabase';
import { FiRefreshCw as ResetIcon, FiLogOut as LogoutIcon, FiShare2 as ShareIcon } from 'react-icons/fi';
export function TorneioMataMata() {
  const { id } = useParams<{ id?: string }>();
  const { torneio, partidas, participantes, resetarTorneio, carregarTorneioPublico } = useTorneioStore();
  const navigate = useNavigate();
  const compartilharDisclosure = useDisclosure();
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    const carregar = async () => {
      if (id) {
        if (!torneio || torneio.id !== id) {
          setLoading(true);
          await carregarTorneioPublico(id);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    carregar();
  }, [id, carregarTorneioPublico]);

  // Se o torneio carregado for do formato Liga, redireciona para o componente correto
  useEffect(() => {
    if (torneio && (torneio.formato === 'liga' || torneio.formato === 'liga_com_playoffs')) {
      navigate(`/torneio/liga/${torneio.id}`, { replace: true });
    }
  }, [torneio, navigate]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!torneio) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <VStack spacing={4}>
          <Text fontSize="14px">Nenhum torneio configurado.</Text>
          <Button onClick={() => navigate('/torneio/configurar')} colorScheme="brand">
            CRIAR TORNEIO
          </Button>
        </VStack>
      </Flex>
    );
  }




  const handleReset = () => {
    if (window.confirm('Resetar todos os dados deste torneio?')) resetarTorneio();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const confrontoFinal = (() => {
    const bracketReset = partidas.find((p) => p.fase === 'bracket_reset' && p.finalizada && p.vencedorId);
    if (bracketReset) return bracketReset;
    const grandFinal = partidas.find((p) => p.fase === 'grand_final' && p.finalizada && p.vencedorId);
    if (grandFinal) {
      const pendingReset = partidas.find((p) => p.fase === 'bracket_reset' && !p.finalizada);
      if (!pendingReset) return grandFinal;
    }
    const finalMatch = partidas.find((p) => p.fase === 'final' && p.finalizada && p.vencedorId);
    return finalMatch ?? null;
  })();
  const campeao = confrontoFinal
    ? participantes.find((p) => p.id === confrontoFinal.vencedorId)
    : null;

  const totalFinalizados = partidas.filter((p) => p.finalizada).length;
  const progresso = partidas.length > 0 ? (totalFinalizados / partidas.length) * 100 : 0;

  return (
    <Box minH="100vh" >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.900' }}
        
        boxShadow="lg"
        position="sticky"
        top={0}
        zIndex={100}
      >
        <Flex
          maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={3}
          align="center" justify="space-between" gap={3}
        >
          <HStack spacing={3}>
            <Image src={LogoBola} alt="logo" h="32px"  />
            <VStack spacing={0} align="flex-start">
              <Heading fontFamily="heading" fontSize={{ base: '16px', md: '20px' }} >
                {torneio.nome}
              </Heading>
              <Text fontSize="12px"  opacity={0.8}>
                MATA-MATA {torneio.isDoubleElimination ? '— REPESCAGEM (DOUBLE ELIMINATION)' : `— ${torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}`}
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2} flexWrap="wrap" justify="flex-end">
            <Badge
              
              color="#000"
              border="1px solid #C3c3c3"
              boxShadow="md"
              px={3} py={1}
              fontSize="12px"
              display={{ base: 'none', sm: 'flex' }}
            >
              {totalFinalizados}/{partidas.length} JOGOS
            </Badge>
            <Button
              id="btn-compartilhar-matamata"
              size="sm"
              colorScheme="blue"
              leftIcon={<ShareIcon /> as any}
              onClick={compartilharDisclosure.onOpen}
              display={{ base: 'none', sm: 'flex' }}
            >
              COMPARTILHAR
            </Button>
            <Button
              leftIcon={<ResetIcon /> as any}
              size="sm"
              colorScheme="red"
              onClick={handleReset}
            >
              RESETAR
            </Button>
            <Button
              size="sm"
              colorScheme="gray"
              onClick={() => navigate('/')}
            >
              ← DASHBOARD
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={handleLogout}
              leftIcon={<LogoutIcon /> as any}
            >
              SAIR
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        {/* Barra de progresso */}
        <Box mb={6}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="12px" >
              Progresso do torneio
            </Text>
            <Text fontSize="12px"  fontWeight={700}>
              {totalFinalizados}/{partidas.length} ({progresso.toFixed(0)}%)
            </Text>
          </HStack>
          <Box w="full" h="8px"  border="1px solid #C3c3c3"  overflow="hidden">
            <Box
              h="full"
              w={`${progresso}%`}
              bg="linear-gradient(90deg,#F94A29,#FDBB00)"
              transition="width 0.6s ease"
            />
          </Box>
        </Box>


        {/* Banner de campeão */}
        {campeao && (
          <Box
            mb={8}
            
            
            boxShadow="lg"
            overflow="hidden"
          >
            <Box h="6px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" />
            <Box
              bg="linear-gradient(180deg, #F94A29 0%, #C80000 100%)"
              p={8}
              textAlign="center"
            >
              <Text fontSize="10px"  mb={2} textTransform="uppercase" letterSpacing="wide">
                🏆 CAMPEÃO
              </Text>
              <Heading
                fontFamily="heading"
                fontSize={{ base: '28px', md: '40px' }}
                
                textTransform="uppercase"
                letterSpacing="0.05em"
                mb={1}
              >
                {campeao.nomeAmigo}
              </Heading>
              <Text  fontSize="12px" mb={3}>{campeao.timeSorteado}</Text>
              <Badge
                
                
                
                bg="transparent"
                px={4} py={1}
                fontSize="12px"
                letterSpacing="wide"
              >
                CAMPEÃO DA COPA
              </Badge>
            </Box>
          </Box>
        )}

        {/* Lista de participantes */}
        <Box mb={8}>
          <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={4}>
            PARTICIPANTES
          </Heading>
          <Wrap spacing={3}>
            {participantes.map((p) => {
              const isCampeao = p.id === campeao?.id;
              return (
                <WrapItem key={p.id}>
                  <HStack
                    bg={isCampeao ? 'linear-gradient(135deg,#F94A29,#C80000)' : 'brand.cardBg'}
                    
                    borderColor={isCampeao ? 'brand.mustard' : 'brand.cardBgAlt'}
                    boxShadow={isCampeao ? 'lg' : 'md'}
                    px={4} py={2}
                    spacing={3}
                    transition="all 0.1s"
                    _hover={{ borderColor: 'brand.mustard', transform: 'translate(-1px,-1px)', boxShadow: 'md' }}
                  >
                    <VStack spacing={0} align="flex-start">
                      <Text
                        fontFamily="heading"
                        fontWeight={700}
                        color={isCampeao ? 'brand.mustard' : 'brand.textMain'}
                        fontSize={{ base: '13px', md: '15px' }}
                      >
                        {isCampeao && '🏆 '}{p.nomeAmigo}
                      </Text>
                      <Badge
                        bg="transparent"
                        border="1px solid"
                        borderColor={isCampeao ? 'brand.mustard' : 'brand.cardBgAlt'}
                        color={isCampeao ? 'brand.mustard' : 'brand.textMutedToken'}
                        fontSize="10px"
                        px={2}
                      >
                        {p.timeSorteado}
                      </Badge>
                    </VStack>
                  </HStack>
                </WrapItem>
              );
            })}
          </Wrap>
        </Box>

        {/* Divisória */}
        <Box h="2px" bg="linear-gradient(90deg,#C80000,#F94A29,#FDBB00,#F94A29,#C80000)" mb={8} />

        {/* Chaveamento */}
        <Box>
          <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}  mb={2}>
            CHAVEAMENTO
          </Heading>
          <Text fontSize="12px"  mb={5}>
            Clique em uma partida para lançar o placar. O vencedor avança automaticamente.
          </Text>
          <Chaveamento />
        </Box>
      </Box>

      {/* Modal compartilhar */}
      <ModalCompartilhar
        isOpen={compartilharDisclosure.isOpen}
        onClose={compartilharDisclosure.onClose}
      />
    </Box>
  );
}
