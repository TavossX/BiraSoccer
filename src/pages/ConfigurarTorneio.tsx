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
  Select as ChakraSelect,
  Avatar,
  Checkbox,
  Tooltip,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import type { FormatoTorneio } from '../types/torneio';
import type { Grupo, ParticipanteTorneioSelecao } from '../types/social';
import { ThemeToggle } from '../components/ThemeToggle';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import { searchTeams, TimeFutebol } from '../services/apiFutebol';
import { IoShuffle } from 'react-icons/io5';
import {
  FiPlus as PlusIcon,
  FiTrash2 as TrashIcon,
  FiRefreshCw as ResetIcon,
  FiZap as BoltIcon,
  FiShield,
  FiUsers,
  FiUserCheck,
} from 'react-icons/fi';
import { listarMeusTimes } from '../services/timesCustomizadosService';
import type { TimeCustomizado } from '../services/timesCustomizadosService';
import { ModalCriarTime } from '../components/ModalCriarTime';
import { ModalPickBan } from '../components/ModalPickBan';
import { listarMeusGrupos, obterGrupo } from '../services/gruposService';
import { supabase } from '../lib/supabase';

// Schema
const schema = z.object({
  nomeTorneio: z.string().min(3, 'Nome muito curto'),
});
type FormData = z.infer<typeof schema>;

export function ConfigurarTorneio() {
  const [searchParams] = useSearchParams();
  const grupoParamId = searchParams.get('grupoId');

  const [formato, setFormato] = useState<FormatoTorneio>('liga');
  const [idaEVolta, setIdaEVolta] = useState(false);

  // Grupos e Participantes
  const [meusGrupos, setMeusGrupos] = useState<Grupo[]>([]);
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string>('');
  const [participantes, setParticipantes] = useState<ParticipanteTorneioSelecao[]>([]);
  const [novoConvidadoNome, setNovoConvidadoNome] = useState('');

  // Times
  const [times, setTimes] = useState<TimeFutebol[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Draft Interativo
  const [participantesPendentes, setParticipantesPendentes] = useState<ParticipanteTorneioSelecao[]>([]);
  const [timesDisponiveis, setTimesDisponiveis] = useState<TimeFutebol[]>([]);
  const [participanteSorteado, setParticipanteSorteado] = useState<ParticipanteTorneioSelecao | null>(null);
  const [timeSelecionado, setTimeSelecionado] = useState<TimeFutebol | null>(null);
  const [duplas, setDuplas] = useState<
    { amigo: string; time: string; logoTime?: string; usuarioId?: string | null; fotoUsuario?: string | null }[]
  >([]);

  const toast = useToast();
  const navigate = useNavigate();
  const criarTorneio = useTorneioStore((s) => s.criarTorneio);

  // Times Customizados
  const { isOpen: isModalTimeOpen, onOpen: onOpenModalTime, onClose: onCloseModalTime } = useDisclosure();
  const { isOpen: isPickBanOpen, onOpen: onOpenPickBan, onClose: onClosePickBan } = useDisclosure();
  const [meusTimesCustom, setMeusTimesCustom] = useState<TimeCustomizado[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const customData = await listarMeusTimes(user.id);
        setMeusTimesCustom(customData);

        const gruposData = await listarMeusGrupos(user.id);
        setMeusGrupos(gruposData);

        // Se veio grupoId via URL ou se possui grupos
        const grupoAlvo = grupoParamId || (gruposData.length > 0 ? gruposData[0].id : '');
        if (grupoAlvo) {
          setGrupoSelecionadoId(grupoAlvo);
          carregarMembrosDoGrupo(grupoAlvo);
        }
      }
    };

    init();
  }, [grupoParamId]);

  const carregarMembrosDoGrupo = async (grupoId: string) => {
    if (!grupoId) {
      setParticipantes([]);
      return;
    }

    const { membros } = await obterGrupo(grupoId);
    const listaSelecao: ParticipanteTorneioSelecao[] = membros.map((m) => ({
      id: m.usuario_id,
      usuario_id: m.usuario_id,
      nome: m.perfil?.nome || 'Jogador',
      foto_base64: m.perfil?.foto_base64 || null,
      isConvidado: false,
    }));

    setParticipantes(listaSelecao);
  };

  const handleMudarGrupo = (grupoId: string) => {
    setGrupoSelecionadoId(grupoId);
    carregarMembrosDoGrupo(grupoId);
  };

  // Adicionar Convidado Local
  const adicionarConvidado = () => {
    const val = novoConvidadoNome.trim();
    if (!val) return;
    if (participantes.some((p) => p.nome.toLowerCase() === val.toLowerCase())) {
      toast({ title: 'Participante já adicionado.', status: 'warning', duration: 2000, position: 'top' });
      return;
    }

    const novoConvidado: ParticipanteTorneioSelecao = {
      id: 'guest-' + Date.now(),
      usuario_id: null,
      nome: val,
      foto_base64: null,
      isConvidado: true,
    };

    setParticipantes((prev) => [...prev, novoConvidado]);
    setNovoConvidadoNome('');
  };

  const removerParticipante = (id: string) => {
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  };

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const participantesValidos = participantes;
  const timesValidos = times;

  const validarEtapa1 = (): boolean => {
    if (participantesValidos.length < 2) {
      toast({ title: 'Selecione pelo menos 2 participantes', status: 'error', duration: 3000, position: 'top' });
      return false;
    }
    if (formato === 'liga_com_playoffs' && participantesValidos.length < 4) {
      toast({
        title: 'Liga + Playoffs exige pelo menos 4 participantes',
        description: 'O Top 4 precisa de ao menos 4 classificados.',
        status: 'error',
        duration: 4000,
        position: 'top',
      });
      return false;
    }
    if (timesValidos.length < participantesValidos.length) {
      toast({
        title: `Você precisa de pelo menos ${participantesValidos.length} times`,
        description: `Faltam ${participantesValidos.length - timesValidos.length} time(s)`,
        status: 'error',
        duration: 4000,
        position: 'top',
      });
      return false;
    }
    return true;
  };

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
    return results.map((team) => ({
      value: team,
      label: team.nome,
    }));
  };

  // Etapa 1 -> Etapa 2 (Sorteio Interativo)
  const iniciarSorteio = handleSubmit(() => {
    if (!validarEtapa1()) return;
    setParticipantesPendentes(participantesValidos);
    setTimesDisponiveis(timesValidos);
    setDuplas([]);
    setParticipanteSorteado(null);
    setTimeSelecionado(null);
    setStep(2);
  });

  // Sorteio Rapido
  const sortearRapido = handleSubmit(() => {
    if (!validarEtapa1()) return;

    // Fisher-Yates shuffle
    const pEmbaralhados = [...participantesValidos].sort(() => Math.random() - 0.5);
    const tEmbaralhados = [...timesValidos].sort(() => Math.random() - 0.5);

    const duplasGeradas = pEmbaralhados.map((p, i) => ({
      amigo: p.nome,
      time: tEmbaralhados[i]?.nome || '',
      logoTime: tEmbaralhados[i]?.logo,
      usuarioId: p.usuario_id,
      fotoUsuario: p.foto_base64,
    }));

    criarTorneio({
      nome: getValues('nomeTorneio'),
      formato,
      idaEVolta,
      duplas: duplasGeradas,
    });

    toast({
      title: 'Sorteio automático concluído!',
      description: 'Times embaralhados e confrontos gerados.',
      status: 'success',
      duration: 3000,
      position: 'top',
    });
    navigate(formato === 'matamata' ? '/torneio/matamata' : '/torneio/liga');
  });

  // Draft (Etapa 2)
  const sortearParticipante = () => {
    if (participantesPendentes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * participantesPendentes.length);
    setParticipanteSorteado(participantesPendentes[randomIndex]);
    setTimeSelecionado(null);
  };

  const confirmarEVincular = () => {
    if (!participanteSorteado || !timeSelecionado) return;
    setDuplas((prev) => [
      ...prev,
      {
        amigo: participanteSorteado.nome,
        time: timeSelecionado.nome,
        logoTime: timeSelecionado.logo,
        usuarioId: participanteSorteado.usuario_id,
        fotoUsuario: participanteSorteado.foto_base64,
      },
    ]);
    setParticipantesPendentes((prev) => prev.filter((p) => p.id !== participanteSorteado.id));
    setTimesDisponiveis((prev) => prev.filter((t) => t.id !== timeSelecionado.id));
    setParticipanteSorteado(null);
    setTimeSelecionado(null);
  };

  useEffect(() => {
    if (step === 2 && participantesPendentes.length === 0 && duplas.length > 0 && !participanteSorteado) {
      setStep(3);
    }
  }, [step, participantesPendentes, duplas, participanteSorteado]);

  // Etapa 3
  const onGerarCampeonato = () => {
    criarTorneio({ nome: getValues('nomeTorneio'), formato, idaEVolta, duplas });
    toast({ title: 'Torneio gerado com sucesso!', status: 'success', duration: 3000, position: 'top' });
    navigate(formato === 'matamata' ? '/torneio/matamata' : '/torneio/liga');
  };

  const idaEVoltaDesc =
    formato === 'matamata'
      ? 'Cada confronto terá dois jogos -- decide-se pelo placar agregado.'
      : formato === 'liga_com_playoffs'
      ? 'Liga em turno duplo + playoffs com ida e volta.'
      : 'Gera um segundo turno espelhado (volta em casa).';

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={10}>
      <Box maxW="760px" mx="auto">
        <HStack justify="space-between" mb={8} align="flex-start">
          <VStack spacing={2} align="flex-start">
            <Button
              size="xs"
              variant="ghost"
              mb={2}
              onClick={() => navigate('/')}
              px={0}
              _hover={{ color: 'brand.orange' }}
              leftIcon={<ResetIcon />}
            >
              ← Voltar para o Dashboard
            </Button>
            <Heading fontSize={{ base: '24px', md: '32px' }} color="brand.500">
              Configurar campeonato
            </Heading>
            <Text fontSize="sm" color="body.color">
              Selecione o Grupo de Amigos, escolha os participantes e realize o Sorteio.
            </Text>
          </VStack>
          <ThemeToggle />
        </HStack>

        <HStack spacing={0} mb={8}>
          {[1, 2, 3].map((s) => (
            <HStack key={s} spacing={0} flex={1}>
              <Flex
                w={8}
                h={8}
                align="center"
                justify="center"
                fontSize="sm"
                fontWeight={700}
                flexShrink={0}
                borderRadius="5px"
                bg={step >= s ? 'brand.mustard' : 'brand.cardBg'}
                borderColor={step >= s ? 'brand.mustard' : 'brand.cardBgAlt'}
                color={step >= s ? '#000' : 'brand.textMutedToken'}
                transition="all 0.2s"
              >
                {s}
              </Flex>
              <Text
                ml={2}
                fontSize="12px"
                fontWeight={600}
                display={{ base: 'none', sm: 'block' }}
                color="body.color"
                opacity={step >= s ? 1 : 0.5}
                transition="color 0.3s"
              >
                {s === 1 ? 'DEFINIÇÃO' : s === 2 ? 'DRAFT' : 'RESUMO'}
              </Text>
              {s < 3 && (
                <Box
                  flex={1}
                  h="2px"
                  bg={step > s ? 'brand.mustard' : 'brand.cardBgAlt'}
                  mx={2}
                  transition="all 0.3s"
                />
              )}
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
                        { val: 'matamata', titulo: 'Mata-mata', desc: 'Chaveamento. Pênaltis no desempate.' },
                        { val: 'liga_com_playoffs', titulo: 'Liga + Playoffs', desc: 'Pontos corridos + Top 4 se enfrentam.' },
                      ].map(({ val, titulo, desc }) => (
                        <Box
                          key={val}
                          as="label"
                          cursor="pointer"
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={formato === val ? 'brand.500' : 'gray.200'}
                          _dark={{ borderColor: formato === val ? 'brand.500' : 'gray.700' }}
                          bg={useColorModeValue('white', 'gray.800')}
                          boxShadow="sm"
                          p={4}
                          transition="all 0.15s"
                          _hover={{ borderColor: 'brand.500' }}
                        >
                          <Radio value={val} display="none" />
                          <VStack align="flex-start" spacing={1}>
                            <Text fontWeight={600} fontSize="md">
                              {titulo}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {desc}
                            </Text>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </RadioGroup>
                </FormControl>

                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={idaEVolta ? 'brand.500' : 'gray.200'}
                  _dark={{ borderColor: idaEVolta ? 'brand.500' : 'gray.700' }}
                  p={4}
                  transition="all 0.2s"
                  bg={useColorModeValue('white', 'gray.800')}
                  boxShadow="sm"
                >
                  <Flex justify="space-between" align="center">
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight={600} fontSize="md">
                        Partidas de ida e volta
                      </Text>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        {idaEVoltaDesc}
                      </Text>
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

              <Box h="2px" opacity={0.3} />

              {/* ── Seleção por Grupo de Amigos + Convidados Locais ── */}
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading fontFamily="heading" fontSize="16px">
                    Grupo de Amigos & Participantes
                  </Heading>
                  <Badge colorScheme="orange" variant="outline" borderRadius="2px" px={2}>
                    {participantesValidos.length} selecionado(s)
                  </Badge>
                </HStack>

                {/* Seleção do Grupo */}
                {meusGrupos.length > 0 && (
                  <FormControl>
                    <FormLabel fontSize="12px" color="gray.500" fontWeight={600}>
                      SELECIONE UM GRUPO DE AMIGOS
                    </FormLabel>
                    <ChakraSelect
                      value={grupoSelecionadoId}
                      onChange={(e) => handleMudarGrupo(e.target.value)}
                    >
                      <option value="">(Nenhum grupo selecionado)</option>
                      {meusGrupos.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome}
                        </option>
                      ))}
                    </ChakraSelect>
                  </FormControl>
                )}

                {/* Lista de Membros do Grupo / Participantes Selecionados */}
                <VStack spacing={2} align="stretch">
                  {participantes.map((p) => (
                    <Flex
                      key={p.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={borderColor}
                      bg={bgColor}
                      justify="space-between"
                      align="center"
                    >
                      <HStack spacing={3}>
                        <Avatar size="sm" name={p.nome} src={p.foto_base64 || undefined} />
                        <VStack spacing={0} align="flex-start">
                          <Text fontSize="14px" fontWeight={600}>
                            {p.nome}
                          </Text>
                          {p.isConvidado && (
                            <Badge colorScheme="gray" fontSize="9px">
                              Convidado Local
                            </Badge>
                          )}
                        </VStack>
                      </HStack>
                      <IconButton
                        aria-label="Remover"
                        icon={<TrashIcon />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removerParticipante(p.id)}
                      />
                    </Flex>
                  ))}
                </VStack>

                {/* Adicionar Convidado Local */}
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  borderStyle="dashed"
                  borderColor={borderColor}
                >
                  <Text fontSize="12px" fontWeight={600} mb={2} color="gray.500">
                    OU ADICIONE UM CONVIDADO LOCAL (SEM PERFIL)
                  </Text>
                  <HStack>
                    <Input
                      value={novoConvidadoNome}
                      onChange={(e) => setNovoConvidadoNome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarConvidado())}
                      placeholder="Nome do Convidado..."
                      variant="outline"
                      size="sm"
                    />
                    <Button
                      size="sm"
                      colorScheme="orange"
                      variant="outline"
                      leftIcon={<PlusIcon />}
                      onClick={adicionarConvidado}
                    >
                      Convidado
                    </Button>
                  </HStack>
                </Box>
              </VStack>

              <Box h="2px" opacity={0.3} />

              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading fontFamily="heading" fontSize="16px">
                    Times disponíveis
                  </Heading>
                  <Badge
                    colorScheme={timesValidos.length >= participantesValidos.length ? 'green' : 'red'}
                    variant="outline"
                    borderRadius="2px"
                    px={2}
                  >
                    {timesValidos.length}/{participantesValidos.length} mínimo
                  </Badge>
                </HStack>

                {/* ── Meus Times Customizados ── */}
                <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} p={4} bg={bgColor} boxShadow="sm">
                  <HStack justify="space-between" mb={3}>
                    <HStack spacing={2}>
                      <Box as={FiShield} boxSize="16px" color="brand.500" />
                      <Text fontWeight={600} fontSize="sm">
                        Meus Times Personalizados
                      </Text>
                    </HStack>
                    <Button
                      size="xs"
                      colorScheme="orange"
                      variant="outline"
                      leftIcon={<PlusIcon />}
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
                          const apiTimes = times.filter((t: any) => !t._custom);
                          const newCustomTimes = selected ? selected.map((s: any) => s.value) : [];
                          setTimes([...apiTimes, ...newCustomTimes]);
                        }}
                        options={meusTimesCustom.map((tc) => ({
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

                {/* ── Busca API ── */}
                <FormControl>
                  <Text fontSize="xs" color="gray.500" mb={2} fontWeight={500}>
                    Ou pesquise na base global:
                  </Text>
                  <AsyncSelect
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadOptions}
                    value={times.filter((t: any) => !t._custom).map((t) => ({ value: t, label: t.nome }))}
                    onChange={(selected: any) => {
                      const customTimes = times.filter((t: any) => t._custom);
                      const newApiTimes = selected ? selected.map((s: any) => s.value) : [];
                      setTimes([...customTimes, ...newApiTimes]);
                    }}
                    placeholder="Pesquisar time (ex: Real Madrid)..."
                    noOptionsMessage={() => 'Digite para buscar na API'}
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
                  leftIcon={<IoShuffle size={20} />}
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
                  leftIcon={<BoltIcon />}
                  fontSize="16px"
                >
                  Sorteio automático
                </Button>
                <Text fontSize="10px" textAlign="center">
                  O Sorteio Rápido gera tanto as partidas quantos os times automaticamente.
                </Text>

                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} my={1} />

                <Button
                  id="btn-pick-ban"
                  onClick={() => {
                    if (participantesValidos.length < 2) {
                      toast({ title: 'Adicione pelo menos 2 participantes', status: 'error', duration: 3000, position: 'top' });
                      return;
                    }
                    if (formato === 'liga_com_playoffs' && participantesValidos.length < 4) {
                      toast({
                        title: 'Liga + Playoffs exige pelo menos 4 participantes',
                        description: 'O Top 4 precisa de ao menos 4 classificados.',
                        status: 'error',
                        duration: 4000,
                        position: 'top',
                      });
                      return;
                    }
                    const nomeTorneio = getValues('nomeTorneio');
                    if (!nomeTorneio || nomeTorneio.trim().length < 3) {
                      toast({ title: 'Dê um nome ao torneio (mínimo 3 caracteres)', status: 'error', duration: 3000, position: 'top' });
                      return;
                    }
                    onOpenPickBan();
                  }}
                  variant="outline"
                  size="lg"
                  leftIcon={<FiShield />}
                  fontSize="16px"
                  h="52px"
                  borderWidth="2px"
                  borderColor="brand.500"
                  color="brand.500"
                  _hover={{
                    bg: 'rgba(249, 74, 41, 0.08)',
                    borderColor: 'brand.600',
                    transform: 'translateY(-1px)',
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                >
                  Modo Pick & Ban
                </Button>
                <Text fontSize="10px" textAlign="center" color="gray.500">
                  Cada jogador escolhe e bloqueia um time. Sem sorteio!
                </Text>
              </VStack>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={8} align="stretch">
              <VStack spacing={1} textAlign="center">
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}>
                  Draft de Times
                </Heading>
                <Text fontSize="12px">
                  Chegou a hora da verdade! Revele o próximo jogador e vincule o escudo que ele vai defender na copa.
                </Text>
              </VStack>
              <HStack justify="center" spacing={4}>
                <Badge variant="outline" borderRadius="5px" px={5} py={1} textTransform="capitalize">
                  {participantesPendentes.length} Pendentes
                </Badge>
                <Badge variant="outline" colorScheme="orange" borderRadius="5px" px={5} py={1} textTransform="capitalize">
                  {duplas.length} Confirmados
                </Badge>
              </HStack>
              <Box p={6} textAlign="center" minH="180px" display="flex" flexDirection="column" justifyContent="center">
                {!participanteSorteado ? (
                  <VStack spacing={4}>
                    <Text fontSize="sm" opacity={0.6}>
                      Quem será o próximo a entrar em campo?
                    </Text>
                    <Button onClick={sortearParticipante} colorScheme="brand" w="320px" h="52px" fontSize="16px">
                      REVELAR PARTICIPANTE
                    </Button>
                  </VStack>
                ) : (
                  <VStack spacing={6}>
                    <VStack spacing={2}>
                      <Text fontSize="xs" textTransform="uppercase" letterSpacing="widest" opacity={0.6}>
                        Participante Sorteado
                      </Text>
                      <HStack spacing={3} justify="center">
                        <Avatar size="md" name={participanteSorteado.nome} src={participanteSorteado.foto_base64 || undefined} />
                        <Heading fontFamily="heading" fontSize={{ base: '24px', md: '32px' }}>
                          {participanteSorteado.nome}
                        </Heading>
                      </HStack>
                    </VStack>
                    <FormControl w="100%" maxW="300px" mx="auto">
                      <Select
                        placeholder="Escolha o time..."
                        value={timeSelecionado ? { value: timeSelecionado, label: timeSelecionado.nome } : null}
                        onChange={(selected: any) => setTimeSelecionado(selected ? selected.value : null)}
                        options={timesDisponiveis.map((t) => ({ value: t, label: t.nome }))}
                        styles={customSelectStyles}
                        formatOptionLabel={(data: any) => (
                          <HStack>
                            <Image src={data.value.logo} boxSize="20px" objectFit="contain" />
                            <Text>{data.label}</Text>
                          </HStack>
                        )}
                      />
                    </FormControl>
                    <Button
                      onClick={confirmarEVincular}
                      colorScheme="brand"
                      size="md"
                      w="100%"
                      maxW="300px"
                      isDisabled={!timeSelecionado}
                    >
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
                <Heading fontFamily="heading" fontSize={{ base: '20px', md: '26px' }}>
                  Resumo do torneio
                </Heading>
                <Text fontSize="12px">Todos os times foram vinculados. Bora começar?</Text>
              </VStack>
              <Box boxShadow="md" overflow="hidden">
                {duplas.map((d, i) => (
                  <Flex
                    key={i}
                    p={3}
                    borderBottom={i < duplas.length - 1 ? '1px solid' : 'none'}
                    justify="space-between"
                    align="center"
                    bg={i % 2 === 0 ? 'rgba(253,187,0,0.05)' : 'transparent'}
                  >
                    <HStack spacing={3}>
                      <Avatar size="xs" name={d.amigo} src={d.fotoUsuario || undefined} />
                      <Text fontFamily="heading" fontWeight={700} fontSize="13px">
                        {d.amigo}
                      </Text>
                    </HStack>
                    <HStack>
                      {d.logoTime && <Image src={d.logoTime} boxSize="20px" objectFit="contain" />}
                      <Badge border="1px solid" fontSize="12px" px={2}>
                        {d.time}
                      </Badge>
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
          setMeusTimesCustom((prev) => [novoTime, ...prev]);
          const timeConvertido: TimeFutebol & { _custom?: boolean } = {
            id: novoTime.id as any,
            nome: novoTime.nome,
            logo: novoTime.escudo_base64,
            _custom: true,
          } as any;
          setTimes((prev) => [...prev, timeConvertido]);
        }}
      />

      {/* Modal Pick & Ban (Esports Draft) */}
      <ModalPickBan
        isOpen={isPickBanOpen}
        onClose={onClosePickBan}
        jogadores={participantesValidos}
        formato={formato}
        idaEVolta={idaEVolta}
        nomeTorneio={getValues('nomeTorneio') || ''}
      />
    </Box>
  );
}