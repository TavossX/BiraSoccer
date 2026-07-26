import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { supabase } from '../lib/supabase';
import { useTorneioStore } from '../store/torneioStore';
import { FaRegTrashAlt } from "react-icons/fa";
import { IoIosLink } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { FiChevronDown as ChevronDownIcon, FiLogOut as LogoutIcon, FiLink as LinkIcon, FiTrash2 as TrashIcon } from 'react-icons/fi';
/* ── Página ─────────────────────────────────────────────────── */
export function Dashboard() {
  const toast = useToast();
  const navigate = useNavigate();

  const [torneios, setTorneios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { carregarTorneioPublico } = useTorneioStore();

  const fetchTorneios = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('torneios_publicos')
        .select('id, nome, formato, status, atualizado_em')
        .eq('user_id', user.id)
        .order('atualizado_em', { ascending: false });
      if (!error && data) setTorneios(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTorneios(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleGenerateLink = (id: string) => {
    const url = `${window.location.origin}/convite/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: '🔗 Link copiado!',
      description: url,
      status: 'success',
      duration: 4000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const handleAcessar = async (torneio: any) => {
    const ok = await carregarTorneioPublico(torneio.id);
    if (ok) {
      if (torneio.formato === 'liga') navigate('/torneio/liga');
      else navigate('/torneio/matamata');
    } else {
      toast({ title: 'Erro ao carregar torneio', status: 'error' });
    }
  };

  const handleExcluir = async (id: string) => {
    const confirm = window.confirm('Tem certeza que deseja excluir este torneio?');
    if (!confirm) return;
    const { error } = await supabase.from('torneios_publicos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', status: 'error' });
    } else {
      toast({ title: 'Torneio excluído', status: 'success' });
      setTorneios(torneios.filter((t) => t.id !== id));
    }
  };

  return (
    <Box minH="100vh" >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box
        as="header"
        bg="white"
        _dark={{ bg: 'gray.900' }}
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
          {/* Logo */}
          <HStack spacing={3}>
            <Image
              src={LogoCompleta}
              alt="EAFC26 Cup"
              h={{ base: '36px', md: '48px' }}
            />
          </HStack>

          {/* Ações */}
          <HStack spacing={2} flexShrink={0}>
            <Button
              id="btn-novo-torneio"
              size="sm"
              onClick={() => navigate('/torneio/configurar')}
              colorScheme="brand"
              leftIcon={<IoMdAdd  /> as any}
            >
              Criar Torneio
            </Button>
            <Button
              id="btn-logout"
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
          boxShadow="md"
          px={6} py={4}
          mb={8}
          border="1px solid"
          borderRadius="5px"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} >
            <VStack align="flex-start" spacing={0}>
              <Heading fontFamily="heading" fontSize={{ base: '22px', md: '30px' }}  >
                Bem-vindo de volta
              </Heading>
              <Text fontSize="12px"  mt={1}>
                Gerencie seus campeonatos, jogadores e placares.
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Stat card */}
        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4} mb={8}>
          <Box
            border="1px solid"
            borderRadius="5px"
            boxShadow="md"
            p={5}
          >
            <Stat>
              <StatLabel fontSize="12px" fontWeight={700} textTransform="uppercase" letterSpacing="wide" >
                Meus Campeonatos
              </StatLabel>
              <StatNumber
                fontFamily="heading"
                fontSize="3xl"
                fontWeight={700}
                
                lineHeight="1.2"
              >
                {torneios.length}
              </StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Divisória estilo 16-bit */}
        <Box
          h="4px"
          bg="linear-gradient(90deg, #C80000, #F94A29, #FDBB00, #F94A29, #C80000)"
          mb={8}
        />

        {/* Heading de seção */}
        <Box mb={5}>
          <Heading
            fontFamily="heading"
            fontSize={{ base: '20px', md: '26px' }}
            
            mb={1}
          >
            Meus Torneios
          </Heading>
          <Text fontSize="12px" >
            Gerencie os campeonatos que você criou.
          </Text>
        </Box>

        {/* Grid de torneios */}
        {loading ? (
          <Flex justify="center" py={10}>
            <VStack spacing={3}>
              <Spinner  size="xl" thickness="4px" />
              <Text fontSize="12px" >CARREGANDO...</Text>
            </VStack>
          </Flex>
        ) : torneios.length === 0 ? (
          <Box
            boxShadow="md"
            p={10}
            textAlign="center"
          >
            <Text fontSize="10px"  mb={4}>
              Você ainda não possui nenhum torneio.
            </Text>
            <Button
              onClick={() => navigate('/torneio/configurar')}
              colorScheme="brand"
            >
              CRIAR PRIMEIRO TORNEIO
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {torneios.map((t) => (
              <Box
                key={t.id}
                
                
                
                boxShadow="md"
                display="flex"
                flexDirection="column"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              >
                {/* Barra topo colorida */}
                <Box
                  h="6px"
                  bg={t.formato === 'liga' ? 'linear-gradient(90deg,#F94A29,#FDBB00)' : 'linear-gradient(90deg,#C80000,#F94A29)'}
                />
                <Box p={5} flex={1} display="flex" flexDirection="column" border="1px solid" borderColor="body.color" borderBottomRadius="10px">
                  <HStack justify="space-between" mb={3} align="flex-start">
                    <Heading
                      fontFamily="heading"
                      fontSize={{ base: '16px', md: '18px' }}
                      
                      noOfLines={2}
                      flex={1}
                      mr={2}
                    >
                      {t.nome}
                    </Heading>
                    <Badge
                      colorScheme={t.formato === 'liga' ? 'brand' : 'red'}
                      px={2} py={1}
                      borderRadius="md"
                      flexShrink={0}
                    >
                      {t.formato === 'liga' ? 'LIGA' : 'MATA-MATA'}
                    </Badge>
                  </HStack>
                  <Text fontSize="12px"  mb={5}>
                    Atualizado em {new Date(t.atualizado_em).toLocaleDateString()}
                  </Text>

                  <Box
                    mt="auto"
                    pt={4}
                    borderTop="1px solid #C3c3c3"
                    
                  >
                    <HStack spacing={2}>
                      <Button
                        flex={1}
                        size="md"
                        colorScheme="brand"
                        onClick={() => handleAcessar(t)}
                      >
                        Acessar Torneio
                      </Button>
                      <Tooltip label="Copiar Link" placement="top">
                        <IconButton
                          aria-label="Copiar link"
                          icon={<IoIosLink size={"20px"} color="green" /> as any}
                          size="md"
                          variant="outline"
                          borderColor="green"
                          onClick={() => handleGenerateLink(t.id)}
                        />
                      </Tooltip>
                      <Tooltip label="Excluir" placement="top">
                        <IconButton
                          aria-label="Excluir torneio"
                          icon={<FaRegTrashAlt size={"15px"} color="red" /> as any}
                          size="md"
                          variant="outline"
                          borderColor="red"
                          _hover={{ bg: 'brand.red', color: 'white' }}
                          onClick={() => handleExcluir(t.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Box>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}
