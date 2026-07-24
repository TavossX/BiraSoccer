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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import { Chaveamento } from '../components/Chaveamento';
import { ModalCompartilhar } from '../components/ModalCompartilhar';
import LogoBola from '../assets/logos/LogoBola.png';
import { supabase } from '../lib/supabase';

const ResetIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const ShareIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

export function TorneioMataMata() {
  const { torneio, partidas, participantes, resetarTorneio } = useTorneioStore();
  const navigate = useNavigate();
  const compartilharDisclosure = useDisclosure();

  if (!torneio) {
    return (
      <Flex minH="100vh"  align="center" justify="center">
        <VStack spacing={4}>
          <Text fontSize="10px" >Nenhum torneio configurado.</Text>
          <Button onClick={() => navigate('/torneio/configurar')} variant="arcade">
            ▶ CRIAR TORNEIO
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
    const voltaFinal = partidas.find((p) => p.fase === 'final' && p.jogo === 'volta' && p.finalizada && p.vencedorId);
    return voltaFinal ?? null;
  })();
  const campeao = confrontoFinal
    ? participantes.find((p) => p.id === confrontoFinal.vencedorId)
    : null;

  const totalFinalizados = partidas.filter((p) => p.finalizada).length;

  return (
    <Box minH="100vh" >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        
        borderBottom="3px solid"
        
        boxShadow="0 4px 0 #000"
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
              <Text fontSize="8px"  opacity={0.8}>
                MATA-MATA — {torneio.idaEVolta ? 'IDA E VOLTA' : 'JOGO ÚNICO'}
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2} flexWrap="wrap" justify="flex-end">
            <Badge
              
              color="#000"
              border="2px solid #000"
              boxShadow="md"
              px={3} py={1}
              fontSize="9px"
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

        {/* Banner de campeão */}
        {campeao && (
          <Box
            mb={8}
            
            
            boxShadow="8px 8px 0 #000"
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
                fontSize="9px"
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
                    boxShadow={isCampeao ? '4px 4px 0 #000' : '2px 2px 0 #000'}
                    px={4} py={2}
                    spacing={3}
                    transition="all 0.1s"
                    _hover={{ borderColor: 'brand.mustard', transform: 'translate(-1px,-1px)', boxShadow: '3px 3px 0 #000' }}
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
                        fontSize="7px"
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
          <Text fontSize="9px"  mb={5}>
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
