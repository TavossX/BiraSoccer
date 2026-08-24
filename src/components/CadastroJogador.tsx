import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';

const cadastroSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  posicao: z.string().min(2, 'Informe uma posição válida'),
});

type CadastroData = z.infer<typeof cadastroSchema>;

export function CadastroJogador() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CadastroData>({ resolver: zodResolver(cadastroSchema) });

  const onSubmit = async (data: CadastroData) => {
    const { error } = await supabase.from('jogadores').insert([data]);
    if (error) {
      toast({
        title: 'Erro ao cadastrar jogador.',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    toast({
      title: 'Jogador cadastrado com sucesso!',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    reset();
  };

  return (
    <Box
      borderRadius="xl"
      borderWidth={1}
      borderColor="whiteAlpha.200"
      boxShadow="0 4px 24px rgba(0,0,0,0.4)"
      bg="gray.800"
      p={6}
      w="full"
    >
      <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={5}>
        <Heading size="md" w="full" bgGradient="linear(to-r, brand.300, purple.300)" bgClip="text">
          Novo Jogador
        </Heading>

        <FormControl isInvalid={!!errors.nome}>
          <FormLabel color="whiteAlpha.800" fontSize="sm">Nome Completo</FormLabel>
          <Input
            {...register('nome')}
            placeholder="Ex: Cristiano Ronaldo"
            bg="gray.700"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: 'brand.400' }}
            _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
          />
          {errors.nome && <FormErrorMessage>{errors.nome.message}</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={!!errors.posicao}>
          <FormLabel color="whiteAlpha.800" fontSize="sm">Posição</FormLabel>
          <Input
            {...register('posicao')}
            placeholder="Ex: Atacante"
            bg="gray.700"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: 'brand.400' }}
            _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
          />
          {errors.posicao && <FormErrorMessage>{errors.posicao.message}</FormErrorMessage>}
        </FormControl>

        <Button
          type="submit"
          width="full"
          isLoading={isSubmitting}
          loadingText="Cadastrando..."
          bgGradient="linear(to-r, brand.500, purple.500)"
          _hover={{ bgGradient: 'linear(to-r, brand.400, purple.400)', transform: 'translateY(-1px)', boxShadow: 'lg' }}
          _active={{ transform: 'translateY(0)' }}
          transition="all 0.2s"
          color="white"
        >
          Cadastrar Jogador
        </Button>
      </VStack>
    </Box>
  );
}
