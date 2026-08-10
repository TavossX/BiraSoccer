import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
  useColorModeValue,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { criarGrupo, listarMeusGrupos } from '../services/gruposService';
import type { Grupo } from '../types/social';
import { FiUsers, FiPlus, FiArrowLeft, FiChevronRight } from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';

export function MeusGrupos() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeNovoGrupo, setNomeNovoGrupo] = useState('');
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const carregarGrupos = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      const data = await listarMeusGrupos(user.id);
      setGrupos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarGrupos();
  }, []);

  const handleCriarGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovoGrupo.trim()) return;

    setCreating(true);
    try {
      const novo = await criarGrupo(nomeNovoGrupo.trim(), userId);
      toast({
        title: 'Grupo criado com sucesso!',
        status: 'success',
        duration: 3000,
        position: 'top',
      });
      setNomeNovoGrupo('');
      onClose();
      carregarGrupos();
      navigate(`/grupos/${novo.id}`);
    } catch (err: any) {
      toast({
        title: 'Erro ao criar grupo',
        description: err.message,
        status: 'error',
        position: 'top',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box minH="100vh" px={{ base: 4, md: 8 }} py={10}>
      <Box maxW="1000px" mx="auto">
        <HStack justify="space-between" mb={8} align="flex-start">
          <VStack spacing={2} align="flex-start">
            <Button
              size="xs"
              variant="ghost"
              mb={2}
              onClick={() => navigate('/dashboard')}
              px={0}
              leftIcon={<FiArrowLeft />}
            >
              Voltar ao Dashboard
            </Button>
            <Heading fontSize={{ base: '24px', md: '32px' }} color="brand.500">
              Meus Grupos de Amigos
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Organize seus amigos em resenhas, panela de FIFA/EAFC ou ligas fixas.
            </Text>
          </VStack>
          <HStack spacing={3}>
            <ThemeToggle />
            <Button
              colorScheme="brand"
              leftIcon={<FiPlus />}
              onClick={onOpen}
              size="md"
            >
              Criar Grupo
            </Button>
          </HStack>
        </HStack>

        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        ) : grupos.length === 0 ? (
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={10}
            textAlign="center"
            boxShadow="sm"
          >
            <Flex justify="center" mb={4}>
              <Flex
                w="60px"
                h="60px"
                borderRadius="full"
                bg="rgba(249, 74, 41, 0.1)"
                align="center"
                justify="center"
              >
                <Icon as={FiUsers} size="28px" color="brand.500" />
              </Flex>
            </Flex>
            <Heading fontSize="18px" mb={2}>
              Você não participa de nenhum grupo ainda
            </Heading>
            <Text fontSize="13px" color="gray.500" maxW="400px" mx="auto" mb={6}>
              Crie o seu primeiro grupo de amigos para organizar campeonatos e importar os membros facilmente!
            </Text>
            <Button colorScheme="brand" leftIcon={<FiPlus />} onClick={onOpen}>
              Criar Primeiro Grupo
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {grupos.map((g) => {
              const isGestor = g.criador_id === userId;

              return (
                <Box
                  key={g.id}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="xl"
                  p={6}
                  boxShadow="sm"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                  cursor="pointer"
                  onClick={() => navigate(`/grupos/${g.id}`)}
                >
                  <HStack justify="space-between" mb={4}>
                    <Flex
                      w="42px"
                      h="42px"
                      borderRadius="10px"
                      bg="rgba(249, 74, 41, 0.1)"
                      align="center"
                      justify="center"
                    >
                      <Icon as={FiUsers} color="brand.500" boxSize="20px" />
                    </Flex>
                    {isGestor && (
                      <Badge colorScheme="orange" variant="subtle" borderRadius="md" px={2}>
                        GESTOR
                      </Badge>
                    )}
                  </HStack>

                  <Heading fontSize="18px" mb={1} noOfLines={1}>
                    {g.nome}
                  </Heading>

                  <HStack spacing={2} mt={3} fontSize="12px" color="gray.500">
                    <Avatar
                      size="xs"
                      name={g.criador?.nome || 'Gestor'}
                      src={g.criador?.foto_base64 || undefined}
                    />
                    <Text noOfLines={1}>Criado por {g.criador?.nome || 'Amigo'}</Text>
                  </HStack>

                  <Flex justify="flex-end" mt={4} align="center" color="brand.500" fontSize="13px" fontWeight={600}>
                    Ver Grupo <Icon as={FiChevronRight} ml={1} />
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {/* Modal Criar Grupo */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" as="form" onSubmit={handleCriarGrupo}>
          <ModalHeader fontSize="18px">Criar Grupo de Amigos</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="13px" color="gray.500" mb={4}>
              Dê um nome para a sua resenha ou liga de amigos. Você poderá convidar os participantes através de um link!
            </Text>
            <Input
              value={nomeNovoGrupo}
              onChange={(e) => setNomeNovoGrupo(e.target.value)}
              placeholder="Ex: Panela EAFC 2026, Liga dos Amigos"
              autoFocus
              required
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100">
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" colorScheme="brand" isLoading={creating}>
              Criar Grupo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
