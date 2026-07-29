import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Switch,
  Text,
  VStack,
  useToast,
  Badge,
  Image,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import type { FormatoTorneio } from '../types/torneio';
import { ThemeToggle } from '../components/ThemeToggle';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import { searchTeams, TimeFutebol } from '../services/apiFutebol';
import { IoShuffle } from 'react-icons/io5';
import { FiPlus as PlusIcon, FiTrash2 as TrashIcon, FiShuffle as ShuffleIcon, FiRefreshCw as ResetIcon, FiZap as BoltIcon, FiShield } from 'react-icons/fi';
import { listarMeusTimes } from '../services/timesCustomizadosService';
import type { TimeCustomizado } from '../services/timesCustomizadosService';
import { ModalCriarTime } from '../components/ModalCriarTime';
import { supabase } from '../lib/supabase';
// Tipos para os passos

// Icones SVG






// Schema
const schema = z.object({
  nomeTorneio: z.string().min(3, 'Nome muito curto'),
});
type FormData = z.infer<typeof schema>;

// Componente
export function ConfigurarTorneio() {
  const [formato, setFormato] = useState<FormatoTorneio>('liga');
  const [idaEVolta, setIdaEVolta] = useState(false);
  const [amigos, setAmigos] = useState<string[]>(['', '']);
  const [times, setTimes] = useState<TimeFutebol[]>([]);
  const [novoAmigo, setNovoAmigo] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amigosPendentes, setAmigosPendentes] = useState<string[]>([]);
  const [timesDisponiveis, setTimesDisponiveis] = useState<TimeFutebol[]>([]);
  const [amigoSorteado, setAmigoSorteado] = useState<string | null>(null);
  const [timeSelecionado, setTimeSelecionado] = useState<TimeFutebol | null>(null);
  const [duplas, setDuplas] = useState<{amigo: string; time: string; logoTime?: string}[]>([]);
  
  const toast = useToast();
  const navigate = useNavigate();
  const criarTorneio = useTorneioStore((s) => s.criarTorneio);
  const sortearTudo  = useTorneioStore((s) => s.sortearTudo);

  // ── Times Customizados ──
  const { isOpen: isModalTimeOpen, onOpen: onOpenModalTime, onClose: onCloseModalTime } = useDisclosure();
  const [meusTimesCustom, setMeusTimesCustom] = useState<TimeCustomizado[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchMeusTimes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const data = await listarMeusTimes(user.id);
        setMeusTimesCustom(data);
      }
    };
    fetchMeusTimes();
  }, []);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const amigosValidos = amigos.filter(Boolean);
  const timesValidos  = times;

  const validarEtapa1 = (): boolean => {
    if (amigosValidos.length < 2) {
      toast({ title: 'Adicione pelo menos 2 amigos', status: 'error', duration: 3000, position: 'top' });
      return false;
    }
    if (formato === 'liga_com_playoffs' && amigosValidos.length < 4) {
      toast({
        title: 'Liga + Playoffs exige pelo menos 4 participantes',
        description: 'O Top 4 precisa de ao menos 4 classificados.',
        status: 'error', duration: 4000, position: 'top',
      });
      return false;
    }
    if (timesValidos.length < amigosValidos.length) {
      toast({
        title: `Voce precisa de pelo menos ${amigosValidos.length} times`,
        description: `Faltam ${amigosValidos.length - timesValidos.length} time(s)`,
        status: 'error', duration: 4000, position: 'top',
      });
      return false;
    }
    return true;
  };

  // Amigos
  const adicionarAmigo = () => {
    const val = novoAmigo.trim();
    if (!val) return;
    if (amigos.includes(val)) {
      toast({ title: 'Participante ja adicionado.', status: 'warning', duration: 2000, position: 'top' });
      return;
    }
    setAmigos((prev) => [...prev.filter(Boolean), val]);
    setNovoAmigo('');
  };
  const removerAmigo = (i: number) => setAmigos((prev) => prev.filter((_, idx) => idx !== i));
  const atualizarAmigo = (i: number, val: string) =>
    setAmigos((prev) => prev.map((a, idx) => (idx === i ? val : a)));

  const bgColor = useColorModeValue('#FFF', '#2D3748');
  const borderColor = useColorModeValue('#E2E8F0', '#4A5568');
  const hoverBg = useColorModeValue('#EDF2F7', '#4A5568');
  const textColor = useColorModeValue('#1A202C', '#F7FAFC');
  const brandColor = '#f94a29';

  // Select Styles
  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: state.isFocused ? `0 0 0 1px ${brandColor}` : 'none',
      borderWidth: '1px',
      borderColor: state.isFocused ? brandColor : borderColor,
      backgroundColor: bgColor,
      color: textColor,
      '&:hover': { borderColor: state.isFocused ? brandColor : hoverBg },
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${borderColor}`,
      backgroundColor: bgColor,
      zIndex: 5,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? hoverBg : 'transparent',
      color: textColor,
      cursor: 'pointer',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: brandColor,
      borderRadius: '4px',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#FFF',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#FFF',
      '&:hover': { backgroundColor: '#c73a1e', color: 'white' },
    }),
    input: (base: any) => ({
      ...base,
      color: textColor,
    }),
    placeholder: (base: any) => ({
      ...base,
      color: useColorModeValue('#A0AEC0', '#718096'),
    }),
    singleValue: (base: any) => ({
      ...base,
      color: textColor,
    }),
  };

  const loadOptions = async (inputValue: string) => {
    if (inputValue.length < 2) return [];
    const results = await searchTeams(inputValue);
    return results.map(team => ({
      value: team,
      label: team.nome,
    }));
  };

  // Etapa 1 -> Etapa 2 (Sorteio Interativo)
  const iniciarSorteio = handleSubmit(() => {
    if (!validarEtapa1()) return;
    setAmigosPendentes(amigosValidos);
    setTimesDisponiveis(timesValidos);
    setDuplas([]);
    setAmigoSorteado(null);
    setTimeSelecionado(null);
    setStep(2);
  });

  // Sorteio Rapido
  const sortearRapido = handleSubmit(() => {
    if (!validarEtapa1()) return;
    sortearTudo({
      nome: getValues('nomeTorneio'),
      formato,
      idaEVolta,
      amigos: amigosValidos,
      times: timesValidos,
    });
    toast({
      title: 'Sorteio automatico concluido!',
      description: 'Times embaralhados e confrontos gerados.',
      status: 'success', duration: 3000, position: 'top',
    });
    navigate(formato === 'matamata' ? '/torneio/matamata' : '/torneio/liga');
  });

  // Draft (Etapa 2)
  const sortearParticipante = () => {
    if (amigosPendentes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * amigosPendentes.length);
    setAmigoSorteado(amigosPendentes[randomIndex]);
    setTimeSelecionado(null);
  };

  const confirmarEVincular = () => {
    if (!amigoSorteado || !timeSelecionado) return;
    setDuplas((prev) => [...prev, { amigo: amigoSorteado, time: timeSelecionado.nome, logoTime: timeSelecionado.logo }]);
    setAmigosPendentes((prev) => prev.filter((a) => a !== amigoSorteado));
    setTimesDisponiveis((prev) => prev.filter((t) => t.id !== timeSelecionado.id));
    setAmigoSorteado(null);
    setTimeSelecionado(null);
  };

  useEffect(() => {
    if (step === 2 && amigosPendentes.length === 0 && duplas.length > 0 && !amigoSorteado) {
      setStep(3);
    }
  }, [step, amigosPendentes, duplas, amigoSorteado]);

  // Etapa 3
  const onGerarCampeonato = () => {
    criarTorneio({ nome: getValues('nomeTorneio'), formato, idaEVolta, duplas });
    toast({ title: 'Torneio gerado com sucesso!', status: 'success', duration: 3000, position: 'top' });
    navigate(formato === 'matamata' ? '/torneio/matamata' : '/torneio/liga');
  };

  const idaEVoltaDesc = formato === 'matamata'
    ? 'Cada confronto tera dois jogos -- decide-se pelo placar agregado.'
    : formato === 'liga_com_playoffs'
    ? 'Liga em turno duplo + playoffs com ida e volta.'
    : 'Gera um segundo turno espelhado (volta em casa).';

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={10}>
      <Box maxW="760px" mx="auto">
        <HStack justify="space-between" mb={8} align="flex-start">
          <VStack spacing={2} align="flex-start">
            <Button size="xs" variant="ghost" mb={2} onClick={() => navigate('/')} px={0}
               _hover={{ color: 'brand.orange' }}
              leftIcon={<ResetIcon /> as any}>
              ← Voltar para o Dashboard
            </Button>
            <Heading fontSize={{ base: '24px', md: '32px' }} color="brand.500">
              Configurar campeonato
            </Heading>
            <Text fontSize="sm" color="body.color">Configure os dados e realize o Sorteio Interativo.</Text>
          </VStack>
          <ThemeToggle />
        </HStack>

        <HStack spacing={0} mb={8}>
          {[1, 2, 3].map((s) => (
            <HStack key={s} spacing={0} flex={1}>
              <Flex
                w={8} h={8} align="center" justify="center"
                fontSize="sm" fontWeight={700} flexShrink={0}
                borderRadius="5px"
                bg={step >= s ? 'brand.mustard' : 'brand.cardBg'}
                borderColor={step >= s ? 'brand.mustard' : 'brand.cardBgAlt'}
                color={step >= s ? '#000' : 'brand.textMutedToken'}
                transition="all 0.2s"
              >
                {s}
              </Flex>
              <Text
                ml={2} fontSize="12px" fontWeight={600} display={{ base: 'none', sm: 'block' }}
                color="body.color"
                opacity={step >= s ? 1 : 0.5}
                transition="color 0.3s"
              >
                {s === 1 ? 'DEFINIÇÃO' : s === 2 ? 'DRAFT' : 'RESUMO'}
              </Text>
              {s < 3 && <Box flex={1} h="2px" bg={step > s ? 'brand.mustard' : 'brand.cardBgAlt'} mx={2} transition="all 0.3s" />}
            </HStack>
          ))}
        </HStack>

        <Box p={{ base: 6, md: 8 }}>
          {step === 1 && (
            <VStack spacing={8} align="stretch">
              <VStack spacing={4} align="stretch">
                <Heading fontSize={{ base: '18px', md: '22px' }}>Informações básicas</Heading>
                <FormControl isInvalid={!!errors.nomeTorneio}>
                  <FormLabel>Nome do torneio</FormLabel>
                  <Input {...register('nomeTorneio')} placeholder="Copa de Inverno 2026" />
                  <FormErrorMessage fontSize="12px">{errors.nomeTorneio?.message}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Formato</FormLabel>
                  <RadioGroup value={formato} onChange={(v) => setFormato(v as FormatoTorneio)}>
                    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                      {[
                        { val: 'liga', titulo: 'Todos contra Todos', desc: 'Pontos Corridos.' },
                        { val: 'matamata', titulo: 'Mata-mata', desc: 'Chaveamento. Penaltis no desempate.' },
                        { val: 'liga_com_playoffs', titulo: 'Liga + Playoffs', desc: 'Pontos corridos + Top 4 se enfrentam.' },
                      ].map(({ val, titulo, desc }) => (
                        <Box
                          key={val} as="label" cursor="pointer"
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={formato === val ? 'brand.500' : 'gray.200'} _dark={{ borderColor: formato === val ? 'brand.500' : 'gray.700' }}
                          bg={useColorModeValue('white', 'gray.800')}
                          boxShadow="sm"
                          p={4}
                          transition="all 0.15s"
                          _hover={{ borderColor: 'brand.500' }}
                        >
                          <Radio value={val} display="none" />
                          <VStack align="flex-start" spacing={1}>
                            <Text fontWeight={600} fontSize="md">{titulo}</Text>
                            <Text fontSize="sm" color="gray.500">{desc}</Text>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </RadioGroup>
                </FormControl>

                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={idaEVolta ? 'brand.500' : 'gray.200'} _dark={{ borderColor: idaEVolta ? 'brand.500' : 'gray.700' }}
                  p={4}
                  transition="all 0.2s"
                  bg={useColorModeValue('white', 'gray.800')}
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="center">
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight={600} fontSize="md">Partidas de ida e volta</Text>
                      <Text fontSize="sm" color="gray.500" mt={1}>{idaEVoltaDesc}</Text>
                    </VStack>
                    <Switch
                      id="switch-ida-volta"
                      isChecked={idaEVolta}
                      onChange={(e) => setIdaEVolta(e.target.checked)}
                      colorScheme="orange"
                      size="lg"
                      ml={4}
                    />
                  </Flex>
                  {idaEVolta && (
                    <Badge mt={3} colorScheme="orange" variant="subtle" borderRadius="2px" fontSize="2xs" px={2}>
                      ATIVO -- {formato === 'liga' ? 'Turno duplo' : 'Dois jogos por confronto'}
                    </Badge>
                  )}
                </Box>
              </VStack>

              <Box h="2px"  opacity={0.3} />

              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading fontFamily="heading" fontSize="16px" >Amigos</Heading>
                  <Badge colorScheme="orange" variant="outline" borderRadius="2px" px={2}>
                    {amigosValidos.length} adicionados
                  </Badge>
                </HStack>
                <VStack spacing={2}>
                  {amigos.map((amigo, i) => (
                    <HStack key={`amigo-${i}`} w="full">
                      <Input
                        value={amigo} onChange={(e) => atualizarAmigo(i, e.target.value)}
                        placeholder={`Participante ${i + 1}`} variant="outline" size="sm"
                      />
                      <IconButton
                        aria-label="Remover" icon={<TrashIcon /> as any}
                        size="sm" variant="outline" colorScheme="red" onClick={() => removerAmigo(i)}
                        isDisabled={amigos.length <= 2}
                      />
                    </HStack>
                  ))}
                </VStack>
                <HStack>
                  <Input
                    value={novoAmigo} onChange={(e) => setNovoAmigo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && adicionarAmigo()}
                    placeholder="Adicionar outro..." variant="outline" size="sm"
                  />
                  <IconButton aria-label="Adicionar" icon={<PlusIcon /> as any} size="sm" onClick={adicionarAmigo} />
                </HStack>
              </VStack>

              <Box h="2px"  opacity={0.3} />

              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading fontFamily="heading" fontSize="16px" >Times disponíveis</Heading>
                  <Badge colorScheme={timesValidos.length >= amigosValidos.length ? 'green' : 'red'} variant="outline" borderRadius="2px" px={2}>
                    {timesValidos.length}/{amigosValidos.length} minimo
                  </Badge>
                </HStack>

                {/* ── Meus Times Customizados ── */}
                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  p={4}
                  bg={bgColor}
                  boxShadow="sm"
                >
                  <HStack justify="space-between" mb={3}>
                    <HStack spacing={2}>
                      <Box as={FiShield} size="16px" color="brand.500" />
                      <Text fontWeight={600} fontSize="sm">Meus Times Personalizados</Text>
                    </HStack>
                    <Button
                      size="xs"
                      colorScheme="orange"
                      variant="outline"
                      leftIcon={<PlusIcon /> as any}
                      onClick={onOpenModalTime}
                    >
                      Criar Time
                    </Button>
                  </HStack>

                  {meusTimesCustom.length === 0 ? (
                    <Text fontSize="xs" color="gray.500" textAlign="center" py={2}>
                      Nenhum time customizado ainda. Crie o seu primeiro!
                    </Text>
                  ) : (
                    <FormControl>
                      <Select
                        isMulti
                        placeholder="Selecionar meus times..."
                        value={times
                          .filter((t: any) => t._custom)
                          .map((t: any) => ({ value: t, label: t.nome }))}
                        onChange={(selected: any) => {
                          const customIds = selected.map((s: any) => s.value.id);
                          const apiTimes = times.filter((t: any) => !t._custom);
                          const newCustomTimes = selected.map((s: any) => s.value);
                          setTimes([...apiTimes, ...newCustomTimes]);
                        }}
                        options={meusTimesCustom.map(tc => ({
                          value: {
                            id: tc.id,
                            nome: tc.nome,
                            logo: tc.escudo_base64,
                            _custom: true,
                          } as any,
                          label: tc.nome,
                        }))}
                        formatOptionLabel={(data: any) => (
                          <HStack>
                            <Image src={data.value.logo} boxSize="20px" objectFit="contain" borderRadius="sm" />
                            <Text>{data.label}</Text>
                          </HStack>
                        )}
                        styles={customSelectStyles}
                        noOptionsMessage={() => 'Nenhum time disponível'}
                      />
                    </FormControl>
                  )}
                </Box>

                {/* ── Busca API (mantido original) ── */}
                <FormControl>
                  <Text fontSize="xs" color="gray.500" mb={2} fontWeight={500}>Ou pesquise na base global:</Text>
                  <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadOptions}
                    value={times.filter((t: any) => !t._custom).map(t => ({ value: t, label: t.nome }))}
                    onChange={(selected: any) => {
                      const customTimes = times.filter((t: any) => t._custom);
                      const newApiTimes = selected.map((s: any) => s.value);
                      setTimes([...customTimes, ...newApiTimes]);
                    }}
                    placeholder="Pesquisar time (ex: Real Madrid)..."
                    noOptionsMessage={() => "Digite para buscar na API"}
                    formatOptionLabel={(data: any) => (
                      <HStack>
                        <Image src={data.value.logo} boxSize="20px" objectFit="contain" />
                        <Text>{data.label}</Text>
                      </HStack>
                    )}
                    styles={customSelectStyles}
                  />
                </FormControl>
              </VStack>

              <VStack spacing={3} align="stretch" mt={4}>
                <Button
                  id="btn-sorteio-interativo"
                  onClick={iniciarSorteio}
                  variant="solid"
                  colorScheme="orange"
                  size="lg"
                  leftIcon={<IoShuffle size={20}  /> as any}
                  fontSize="16px"
                  h="52px"
                >
                Sorteio interativo
                </Button>
                <Button
                  id="btn-sorteio-rapido"
                  onClick={sortearRapido}
                  colorScheme="gray"
                  variant="outline"
                  size="lg"
                  leftIcon={<BoltIcon /> as any}
                  fontSize="16px"
                >
                  Sorteio automático
                </Button>
                <Text fontSize="10px"  textAlign="center">
                  O Sorteio Rápido gera tanto as partidas quantos os times automaticamente.  
                </Text>
              </VStack>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={8} align="stretch">
              <VStack spacing={1} textAlign="center">
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} >Draft de Times</Heading>
                <Text fontSize="12px" >Chegou a hora da verdade! Revele o próximo jogador e vincule o escudo que ele vai defender na copa.</Text>
              </VStack>
              <HStack justify="center" spacing={4}>
                <Badge variant="outline" borderRadius="5px" px={5} py={1} textTransform="capitalize">{amigosPendentes.length} Pendentes</Badge>
                <Badge variant="outline" colorScheme="orange" borderRadius="5px" px={5} py={1} textTransform="capitalize">{duplas.length} Confirmados</Badge>
              </HStack>
              <Box
                p={6}
                 
                
                textAlign="center" minH="180px" display="flex" flexDirection="column" justifyContent="center"
              >
                {!amigoSorteado ? (
                  <VStack spacing={4}>
                    <Text fontSize="sm" opacity={0.6}>Quem será o próximo a entrar em campo?</Text>
                    <Button onClick={sortearParticipante} colorScheme="brand" w="320px" h="52px" fontSize="16px">
                      REVELAR PARTICIPANTE
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={6}>
                    <VStack spacing={0}>
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" opacity={0.6} mb={2}>Participante Sorteado</Text>
                      <Heading fontFamily="heading" fontSize={{ base: '24px', md: '32px' }} >{amigoSorteado}</Heading>
                    </VStack>
                    <FormControl w="100%" maxW="300px" mx="auto">
                      <Select
                        placeholder="Escolha o time..."
                        value={timeSelecionado ? { value: timeSelecionado, label: timeSelecionado.nome } : null}
                        onChange={(selected: any) => setTimeSelecionado(selected ? selected.value : null)}
                        options={timesDisponiveis.map(t => ({ value: t, label: t.nome }))}
                        styles={customSelectStyles}
                        formatOptionLabel={(data: any) => (
                          <HStack>
                            <Image src={data.value.logo} boxSize="20px" objectFit="contain" />
                            <Text>{data.label}</Text>
                          </HStack>
                        )}
                      />
                    </FormControl>
                    <Button onClick={confirmarEVincular} colorScheme="brand" size="md" w="100%" maxW="300px" isDisabled={!timeSelecionado}>
                      CONFIRMAR E VINCULAR
                    </Button>
                  </VStack>
                )}
              </Box>
            </VStack>
          )}

          {step === 3 && (
            <VStack spacing={6} align="stretch">
              <VStack spacing={1} textAlign="center">
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }} >Resumo do torneio</Heading>
                <Text fontSize="12px" >Todos os times foram vinculados. Bora começar?</Text>
              </VStack>
              <Box
                 
                boxShadow="md"
                overflow="hidden"
              >
                {duplas.map((d, i) => (
                  <Flex
                    key={i} p={3}
                    borderBottom={i < duplas.length - 1 ? '1px solid' : 'none'}
                     justify="space-between" align="center"
                    bg={i % 2 === 0 ? 'rgba(253,187,0,0.05)' : 'transparent'}
                  >
                    <Text fontFamily="heading" fontWeight={700} fontSize="13px" >{d.amigo}</Text>
                    <HStack>
                      {d.logoTime && <Image src={d.logoTime} boxSize="20px" objectFit="contain" />}
                      <Badge   border="1px solid"  fontSize="12px" px={2}>{d.time}</Badge>
                    </HStack>
                  </Flex>
                ))}
              </Box>
              <Button onClick={onGerarCampeonato} colorScheme="brand" size="lg" mt={4} w="full">
                GERAR CAMPEONATO
              </Button>
            </VStack>
          )}
        </Box>
      </Box>

      {/* Modal Criar Time Personalizado */}
      <ModalCriarTime
        isOpen={isModalTimeOpen}
        onClose={onCloseModalTime}
        userId={userId}
        onTimeSalvo={(novoTime) => {
          setMeusTimesCustom(prev => [novoTime, ...prev]);
          // Adiciona automaticamente à seleção
          const timeConvertido: TimeFutebol & { _custom?: boolean } = {
            id: novoTime.id as any,
            nome: novoTime.nome,
            logo: novoTime.escudo_base64,
            _custom: true,
          } as any;
          setTimes(prev => [...prev, timeConvertido]);
        }}
      />
    </Box>
  );
}