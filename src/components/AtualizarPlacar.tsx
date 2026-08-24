import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Heading,
  FormErrorMessage,
  useToast,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const placarSchema = z.object({
  jogoId: z.string().min(1, 'Selecione um jogo válido'),
  pontos: z.number().min(1, 'A pontuação deve ser maior que zero'),
});

type PlacarData = z.infer<typeof placarSchema>;

const jogos = [
  { id: 'jogo1', label: 'Time A vs Time B', status: 'ao vivo' },
  { id: 'jogo2', label: 'Time C vs Time D', status: 'agendado' },
  { id: 'jogo3', label: 'Time E vs Time F', status: 'encerrado' },
];

export function AtualizarPlacar() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlacarData>({
    resolver: zodResolver(placarSchema),
    defaultValues: { pontos: 1 },
  });

  const onSubmit = async (data: PlacarData) => {
    await new Promise((r) => setTimeout(r, 800)); // simula chamada async
    toast({
      title: 'Placar atualizado!',
      description: `Jogo ${data.jogoId} — ${data.pontos} ponto(s)`,
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
    reset({ jogoId: '', pontos: 1 });
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
        <HStack w="full" justify="space-between" align="center">
          <Heading size="md" bgGradient="linear(to-r, green.300, teal.300)" bgClip="text">
            Atualizar Placar
          </Heading>
          <Badge colorScheme="green" variant="subtle" fontSize="xs" px={2} py={1} borderRadius="full">
            AO VIVO
          </Badge>
        </HStack>

        <FormControl isInvalid={!!errors.jogoId}>
          <FormLabel color="whiteAlpha.800" fontSize="sm">Selecione o Jogo</FormLabel>
          <Select
            placeholder="Escolha uma partida..."
            {...register('jogoId')}
            bg="gray.700"
            borderColor="whiteAlpha.300"
            _hover={{ borderColor: 'green.400' }}
            _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px var(--chakra-colors-green-400)' }}
          >
            {jogos.map((j) => (
              <option key={j.id} value={j.id} style={{ background: '#2d3748' }}>
                {j.label} ({j.status})
              </option>
            ))}
          </Select>
          {errors.jogoId && <FormErrorMessage>{errors.jogoId.message}</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={!!errors.pontos}>
          <FormLabel color="whiteAlpha.800" fontSize="sm">Pontuação</FormLabel>
          <Controller
            control={control}
            name="pontos"
            render={({ field }) => (
              <NumberInput
                min={0}
                max={99}
                onChange={(val) => field.onChange(Number(val))}
                value={field.value}
                bg="gray.700"
                borderRadius="md"
              >
                <NumberInputField
                  borderColor="whiteAlpha.300"
                  _hover={{ borderColor: 'green.400' }}
                  _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px var(--chakra-colors-green-400)' }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.700" />
                  <NumberDecrementStepper borderColor="whiteAlpha.200" color="whiteAlpha.700" />
                </NumberInputStepper>
              </NumberInput>
            )}
          />
          {errors.pontos && <FormErrorMessage>{errors.pontos.message}</FormErrorMessage>}
        </FormControl>

        <Button
          type="submit"
          width="full"
          isLoading={isSubmitting}
          loadingText="Atualizando..."
          bgGradient="linear(to-r, green.500, teal.500)"
          _hover={{ bgGradient: 'linear(to-r, green.400, teal.400)', transform: 'translateY(-1px)', boxShadow: 'lg' }}
          _active={{ transform: 'translateY(0)' }}
          transition="all 0.2s"
          color="white"
        >
          Confirmar Placar
        </Button>
      </VStack>
    </Box>
  );
}
