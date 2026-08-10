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
  Link,
  Text,
  useToast,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { supabase } from '../lib/supabase';
import { FiMail as EmailIcon, FiLock as LockIcon } from 'react-icons/fi';

/* ── Validação ─────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});
type LoginData = z.infer<typeof loginSchema>;

/* ── Ícones SVG inline ─────────────────────────────────────── */


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

/* ── Página ─────────────────────────────────────────────────── */
export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ email, password }: LoginData) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: '⛔ Falha no login.',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    toast({
      title: '✅ Bem-vindo de volta!',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top',
    });

    const pendingToken = localStorage.getItem('pending_invite_token');
    if (pendingToken) {
      navigate(`/invite/${pendingToken}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      
      bgImage="repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)"
      px={4}
    >
      {/* Card de login */}
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
        <Box
          px={4} py={3}
          textAlign="center"
          mb={8}
        >
          <Heading
            fontSize={{ base: '22px', md: '28px' }}
          >
            ENTRAR
          </Heading>
        </Box>

        <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={5}>
          {/* E-mail */}
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>E-MAIL</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={2}>
                <EmailIcon />
              </InputLeftElement>
              <Input
                {...register('email')}
                id="login-email"
                type="email"
                placeholder="seu@email.com"
              />
            </InputGroup>
            <FormErrorMessage fontSize="12px" >{errors.email?.message}</FormErrorMessage>
          </FormControl>

          {/* Senha */}
          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Senha</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none" h="full" pl={2}>
                <LockIcon />
              </InputLeftElement>
              <Input
                {...register('password')}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
              />
              <InputRightElement h="full">
                <Button
                  id="toggle-password"
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
            <FormErrorMessage fontSize="12px" >{errors.password?.message}</FormErrorMessage>
          </FormControl>

          <Flex w="full" justify="flex-end">
            <Link
              href="#"
              fontSize="12px"
              
              _hover={{ color: 'brand.orange' }}
            >
              Esqueceu a senha?
            </Link>
          </Flex>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            w="full"
            mt={4}
          >
            ENTRAR
          </Button>
        </VStack>

        <Flex justify="center" mt={4}>
          <Text fontSize="sm">
            Sem conta?{' '}
            <Link as={RouterLink} to="/register" color="brand.500" fontWeight="bold">
              Cadastrar-se
            </Link>
          </Text>
        </Flex>
      </Box>
    </Flex>
  );
}
