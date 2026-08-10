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
  Text,
  useToast,
  VStack,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { gerarConviteGrupo, obterGrupo } from '../services/gruposService';
import type { Grupo, GrupoMembro } from '../types/social';
import { FiArrowLeft, FiLink, FiShield, FiUsers, FiUser, FiCheck } from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';

export function DetalhesGrupo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [membros, setMembros] = useState<GrupoMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserId(user.id);

      const res = await obterGrupo(id);
      setGrupo(res.grupo);
      setMembros(res.membros);
      setLoading(false);
    };

    carregar();
  }, [id]);

  const isGestor = grupo?.criador_id === userId;

  const handleGerarLinkConvite = async () => {
    if (!id) return;
    setGeneratingLink(true);
    try {
      const convite = await gerarConviteGrupo(id);
      const inviteUrl = `${window.location.origin}/invite/${convite.token}`;
      await navigator.clipboard.writeText(inviteUrl);

      toast({
        title: '🔗 Link de Convite Copiado!',
        description: inviteUrl,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar convite',
        description: err.message,
        status: 'error',
        position: 'top',
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!grupo) {
    return (
      <Box minH="100vh" p={10} textAlign="center">
        <Text>Grupo não encontrado.</Text>
        <Button mt={4} onClick={() => navigate('/grupos')}>
          Voltar para Meus Grupos
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
              onClick={() => navigate('/grupos')}
              px={0}
              leftIcon={<FiArrowLeft />}
            >
              ← Voltar aos Grupos
            </Button>
            <HStack spacing={3}>
              <Heading fontSize={{ base: '24px', md: '32px' }} color="brand.500">
                {grupo.nome}
              </Heading>
              {isGestor && (
                <Badge colorScheme="orange" variant="subtle" fontSize="12px" px={2} py={1}>
                  SOU GESTOR
                </Badge>
              )}
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {membros.length} participante(s) registrado(s) neste grupo.
            </Text>
          </VStack>
          <HStack spacing={3}>
            <ThemeToggle />
            {isGestor && (
              <Button
                colorScheme="orange"
                variant="solid"
                leftIcon={<FiLink />}
                onClick={handleGerarLinkConvite}
                isLoading={generatingLink}
              >
                Gerar Link de Convite
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Informações do Grupo */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="xl"
          p={6}
          mb={8}
          boxShadow="sm"
        >
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Avatar
                size="md"
                name={grupo.criador?.nome || 'Gestor'}
                src={grupo.criador?.foto_base64 || undefined}
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="12px" color="gray.500" textTransform="uppercase" fontWeight={700}>
                  Gestor do Grupo
                </Text>
                <Text fontSize="16px" fontWeight={700}>
                  {grupo.criador?.nome || 'Amigo'}
                </Text>
              </VStack>
            </HStack>

            <Button
              size="sm"
              colorScheme="brand"
              variant="outline"
              onClick={() => navigate(`/torneio/configurar?grupoId=${grupo.id}`)}
            >
              Criar Torneio com este Grupo 🏆
            </Button>
          </Flex>
        </Box>

        {/* Membros do Grupo */}
        <Heading fontSize="20px" mb={4}>
          Membros do Grupo ({membros.length})
        </Heading>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {membros.map((m) => {
            const perfil = m.perfil;
            const isCriadorDoGrupo = m.usuario_id === grupo.criador_id;

            return (
              <Box
                key={m.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="xl"
                p={4}
                boxShadow="sm"
                transition="all 0.2s"
                _hover={{ borderColor: 'brand.500', transform: 'translateY(-1px)' }}
                cursor="pointer"
                onClick={() => navigate(`/perfil/${m.usuario_id}`)}
              >
                <HStack spacing={3}>
                  <Avatar
                    size="md"
                    name={perfil?.nome || 'Membro'}
                    src={perfil?.foto_base64 || undefined}
                  />
                  <VStack align="flex-start" spacing={0} flex={1}>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight={700} fontSize="14px" noOfLines={1}>
                        {perfil?.nome || 'Membro do Grupo'}
                      </Text>
                      {isCriadorDoGrupo && (
                        <Badge colorScheme="orange" fontSize="9px">
                          Gestor
                        </Badge>
                      )}
                    </HStack>
                    {perfil?.steam_id && (
                      <Text fontSize="11px" color="gray.500" noOfLines={1}>
                        {perfil.steam_id}
                      </Text>
                    )}
                    <Text fontSize="10px" color="gray.400" mt={1}>
                      Entrou em {new Date(m.data_entrada).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
