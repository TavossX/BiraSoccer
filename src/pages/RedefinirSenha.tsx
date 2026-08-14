import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  useToast,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { supabase } from '../lib/supabase';
import { FiLock as LockIcon } from 'react-icons/fi';

/* ── Validação ─────────────────────────────────────────────── */
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua nova senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

/* ── Ícone Olho ─────────────────────────────────────────────── */
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#FDBB00">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#FDBB00">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

export function RedefinirSenha() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecoveryValid, setIsRecoveryValid] = useState<boolean | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Monitora evento de autenticação ou sessão ativa de recuperação
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsRecoveryValid(true);
      } else {
        // Aguarda evento de auth change se o Supabase ainda estiver processando a hash do e-mail
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || session) {
            setIsRecoveryValid(true);
          }
        });
        
        // Timeout de fallback para indicar se o link for inválido ou expirado
        const timer = setTimeout(() => {
          setIsRecoveryValid((prev) => (prev === null ? false : prev));
        }, 2000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      }
    };

    checkSession();
  }, []);

  const onSubmit = async ({ password }: ResetPasswordData) => {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: '⛔ Erro ao redefinir senha.',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    toast({
      title: '✅ Senha redefinida com sucesso!',
      description: 'Você já pode fazer login com sua nova senha.',
      status: 'success',
      duration: 4000,
      isClosable: true,
      position: 'top',
    });

    // Fazer logout para garantir que o usuário faça o login formal com a nova senha
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgImage="repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)"
      px={4}
    >
      <Box
        w="full"
        maxW="440px"
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="xl"
        boxShadow="xl"
        p={{ base: 7, md: 10 }}
      >
        {/* Logo */}
        <Flex justify="center" mb={6}>
          <Image
            src={LogoCompleta}
            alt="EAFC26 Cup"
            w={{ base: '200px', md: '260px' }}
          />
        </Flex>

        {/* Título */}
        <Box textAlign="center" mb={6}>
          <Heading fontSize={{ base: '20px', md: '24px' }}>
            CRIAR NOVA SENHA
          </Heading>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mt={2}>
            Digite a sua nova senha para acessar sua conta.
          </Text>
        </Box>

        {isRecoveryValid === false && (
          <Box mb={4} p={3} bg="red.500" color="white" borderRadius="md" textAlign="center" fontSize="sm">
            O link de redefinição pode ter expirado ou ser inválido. Tente solicitar uma nova redefinição na tela de login.
          </Box>
        )}

        <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={5}>
          {/* Nova Senha */}
          <FormControl isInvalid={!!errors.password}>
            <FormLabel fontSize="sm">NOVA SENHA</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={2}>
                <LockIcon />
              </InputLeftElement>
              <Input
                {...register('password')}
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
              />
              <InputRightElement h="full">
                <Button
                  id="toggle-new-password"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword((p) => !p)}
                  p={1}
                  minW="auto"
                >
                  <EyeIcon open={showPassword} />
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage fontSize="12px">{errors.password?.message}</FormErrorMessage>
          </FormControl>

          {/* Confirmar Nova Senha */}
          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel fontSize="sm">CONFIRMAR NOVA SENHA</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={2}>
                <LockIcon />
              </InputLeftElement>
              <Input
                {...register('confirmPassword')}
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
              />
              <InputRightElement h="full">
                <Button
                  id="toggle-confirm-password"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  p={1}
                  minW="auto"
                >
                  <EyeIcon open={showConfirmPassword} />
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage fontSize="12px">{errors.confirmPassword?.message}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            w="full"
            mt={4}
          >
            SALVAR NOVA SENHA
          </Button>

          <Button
            variant="ghost"
            size="sm"
            w="full"
            onClick={() => navigate('/login')}
          >
            Voltar para o Login
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
