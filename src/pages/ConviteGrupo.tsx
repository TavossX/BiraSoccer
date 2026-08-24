import { Box, Button, Flex, Heading, Image, Spinner, Text, useToast, VStack, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { entrarNoGrupoPorToken, obterConvitePorToken } from '../services/gruposService';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import type { ConviteGrupo as IConviteGrupo } from '../types/social';
import { ThemeToggle } from '../components/ThemeToggle';

export function ConviteGrupo() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [convite, setConvite] = useState<IConviteGrupo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    const processarConvite = async () => {
      if (!token) {
        setErrorMsg('Token de convite não fornecido.');
        setLoading(false);
        return;
      }

      // Valida o convite
      const conv = await obterConvitePorToken(token);
      if (!conv) {
        setErrorMsg('Convite inválido ou expirado.');
        setLoading(false);
        return;
      }

      setConvite(conv);

      // Verifica sessão do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Guarda no localStorage e redireciona para login
        localStorage.setItem('pending_invite_token', token);
        toast({
          title: 'Faça login ou cadastre-se',
          description: `Entre na sua conta para se juntar ao grupo "${conv.grupo?.nome}".`,
          status: 'info',
          duration: 6000,
          position: 'top',
        });
        setLoading(false);
        return;
      }

      // Usuário autenticado -> Entra no grupo
      const res = await entrarNoGrupoPorToken(token, user.id);
      localStorage.removeItem('pending_invite_token');

      if (res.sucesso) {
        toast({
          title: 'Sucesso!',
          description: res.mensagem || 'Você agora é membro do grupo!',
          status: 'success',
          duration: 4000,
          position: 'top',
        });
        if (res.grupoId) {
          navigate(`/grupos/${res.grupoId}`);
        } else {
          navigate('/grupos');
        }
      } else {
        setErrorMsg(res.mensagem || 'Não foi possível entrar no grupo.');
        setLoading(false);
      }
    };

    processarConvite();
  }, [token, navigate, toast]);

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center" direction="column" gap={4}>
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text fontSize="14px" color={textColorMuted}>
          Processando convite de grupo...
        </Text>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" align="center" justify="center" px={4} py={10}>
      <Box w="full" maxW="460px" bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" boxShadow="xl" p={8} textAlign="center">
        <Flex justify="space-between" align="center" mb={6}>
          <Image src={LogoCompleta} alt="EAFC26 Cup" h="44px" objectFit="contain" />
          <ThemeToggle />
        </Flex>

        {errorMsg ? (
          <VStack spacing={4}>
            <Heading fontSize="20px" color="red.500">
              Convite Indisponível
            </Heading>
            <Text fontSize="14px" color={textColorMuted}>
              {errorMsg}
            </Text>
            <Button colorScheme="brand" onClick={() => navigate('/dashboard')}>
              Ir para o Dashboard
            </Button>
          </VStack>
        ) : (
          <VStack spacing={5}>
            <Heading fontSize="20px" color={textPrimary}>Convite de Grupo</Heading>
            <Text fontSize="14px" color={textColorMuted}>
              Você foi convidado para se juntar ao grupo <strong>{convite?.grupo?.nome}</strong>.
            </Text>
            <Button
              colorScheme="brand"
              size="lg"
              w="full"
              onClick={() => {
                if (token) localStorage.setItem('pending_invite_token', token);
                navigate('/login');
              }}
            >
              ENTRAR OU CADASTRAR-SE
            </Button>
          </VStack>
        )}
      </Box>
    </Flex>
  );
}
