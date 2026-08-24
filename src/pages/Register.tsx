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
  useColorModeValue,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { FiUser as PersonIcon, FiMail as EmailIcon, FiLock as LockIcon } from 'react-icons/fi';

/* ── Validação ─────────────────────────────────────────────── */
const registerSchema = z
  .object({
    nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterData = z.infer<typeof registerSchema>;

/* ── Ícones SVG ─────────────────────────────────────────────── */



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
export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ email, password, nome }: RegisterData) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });

    if (error) {
      toast({
        title: 'Erro ao criar conta.',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    toast({
      title: 'Conta criada!',
      description: 'Verifique seu e-mail para confirmar o cadastro.',
      status: 'success',
      duration: 6000,
      isClosable: true,
      position: 'top',
    });
    navigate('/login');
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      
      bgImage="repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)"
      px={4}
      py={10}
    >
      <Box
        w="full"
        maxW="460px"
        bg={useColorModeValue('white', 'gray.800')}
        borderRadius="xl"
        boxShadow="xl"
      >
        <Box p={{ base: 7, md: 10 }}>
          {/* Logo */}
          <Flex justify="center" mb={5}>
            <Image
              src={LogoCompleta}
              alt="EAFC26 Cup"
              w={{ base: '180px', md: '220px' }}
              
            />
          </Flex>

          {/* Título */}
          <Box
            px={4} py={3}
            textAlign="center"
            mb={7}
          >
            <Heading
              fontSize={{ base: '20px', md: '26px' }}
            >
              CADASTRAR
            </Heading>
          </Box>

          <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={4}>
            {/* Nome */}
            <FormControl isInvalid={!!errors.nome}>
              <FormLabel>Nome</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full" pl={2}>
                  <PersonIcon />
                </InputLeftElement>
                <Input
                  {...register('nome')}
                  id="register-nome"
                  placeholder="Seu nome completo"
                />
              </InputGroup>
              <FormErrorMessage fontSize="12px" >{errors.nome?.message}</FormErrorMessage>
            </FormControl>

            {/* E-mail */}
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>E-MAIL</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full" pl={2}>
                  <EmailIcon />
                </InputLeftElement>
                <Input
                  {...register('email')}
                  id="register-email"
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
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 6 caracteres"
                />
                <InputRightElement h="full">
                  <Button variant="ghost" size="sm" p={1} minW="auto"
                    onClick={() => setShowPassword((p) => !p)}>
                    <EyeIcon open={showPassword} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage fontSize="12px" >{errors.password?.message}</FormErrorMessage>
            </FormControl>

            {/* Confirmar senha */}
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirmar senha</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full" pl={2}>
                  <LockIcon />
                </InputLeftElement>
                <Input
                  {...register('confirmPassword')}
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita sua senha"
                />
                <InputRightElement h="full">
                  <Button variant="ghost" size="sm" p={1} minW="auto"
                    onClick={() => setShowConfirm((p) => !p)}>
                    <EyeIcon open={showConfirm} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage fontSize="12px" >{errors.confirmPassword?.message}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isSubmitting}
              w="full"
              mt={2}
            >
              CADASTRAR
            </Button>
          </VStack>

          <Flex justify="center" mt={5}>
            <Text fontSize="sm">
              Já possui conta?{' '}
              <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
                Entrar
              </Link>
            </Text>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}
