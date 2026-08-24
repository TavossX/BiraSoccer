import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { obterPerfil } from '../services/perfisService';
import type { Perfil } from '../types/social';
import LogoCompleta from '../assets/logos/LogoCompleta.png';
import { ThemeToggle } from './ThemeToggle';
import { ModalEditarPerfil } from './ModalEditarPerfil';
import {
  FiAward,
  FiEdit2,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiShield,
  FiTag,
  FiUsers,
} from 'react-icons/fi';

interface NavbarProps {
  tituloCustom?: string;
  mostrarVoltar?: boolean;
  onVoltar?: () => void;
  childrenAcoes?: React.ReactNode;
}

export function Navbar({
  mostrarVoltar = false,
  onVoltar,
  childrenAcoes,
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditProfileOpen,
    onOpen: onOpenEditProfile,
    onClose: onCloseEditProfile,
  } = useDisclosure();

  const [userId, setUserId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  const navBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerBg = useColorModeValue('white', 'gray.850');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const activeBg = useColorModeValue('orange.50', 'rgba(249, 74, 41, 0.15)');
  const hoverBg = useColorModeValue('gray.100', 'gray.800');

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const p = await obterPerfil(user.id);
        setPerfil(p);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: 'Desconectado com sucesso',
        status: 'info',
        duration: 2000,
        position: 'top-right',
      });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navLinks = [
    { label: 'Painel Principal', path: '/dashboard', icon: FiHome },
    { label: 'Grupos de Amigos', path: '/grupos', icon: FiUsers },
    { label: 'Meus Times Customizados', path: '/meus-times', icon: FiShield },
    { label: 'Criar Torneio', path: '/torneio/configurar', icon: FiPlus, highlight: true },
    ...(userId ? [{ label: 'Meu Hub & Estatísticas', path: `/perfil/${userId}`, icon: FiAward }] : []),
  ];

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <Box
        as="header"
        bg={navBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={100}
        px={{ base: 3, md: 8 }}
        py={3}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
          {/* Logo e Botão Voltar (se aplicável) */}
          <HStack spacing={3}>
            {mostrarVoltar && (
              <IconButton
                aria-label="Voltar"
                icon={<Icon as={FiHome} />}
                size="sm"
                variant="ghost"
                onClick={onVoltar || (() => navigate('/dashboard'))}
              />
            )}
            <Image
              src={LogoCompleta}
              alt="BiraSoccer"
              h={{ base: '32px', md: '40px' }}
              cursor="pointer"
              onClick={() => navigate('/dashboard')}
            />
          </HStack>

          {/* Ações Customizadas passadas por páginas (ex: configurações do torneio) */}
          {childrenAcoes && (
            <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
              {childrenAcoes}
            </HStack>
          )}

          {/* ── Navegação Desktop (Telas Médias e Grandes) ─────────────── */}
          <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/grupos')}
              leftIcon={<FiUsers />}
              fontWeight={600}
            >
              Grupos
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/meus-times')}
              leftIcon={<FiShield />}
              fontWeight={600}
            >
              Meus Times
            </Button>
            <Button
              id="btn-nav-criar-torneio"
              size="sm"
              colorScheme="orange"
              onClick={() => navigate('/torneio/configurar')}
              leftIcon={<FiPlus />}
              fontWeight={800}
            >
              Criar Torneio
            </Button>

            <Divider orientation="vertical" h="20px" borderColor={borderColor} />

            <ThemeToggle />

            {userId && (
              <Tooltip label="Meu Perfil" placement="bottom">
                <Avatar
                  size="sm"
                  name={perfil?.nome || 'Perfil'}
                  src={perfil?.foto_base64 || undefined}
                  cursor="pointer"
                  onClick={() => navigate(`/perfil/${userId}`)}
                  border="2px solid"
                  borderColor="brand.500"
                  _hover={{ opacity: 0.85, transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                />
              </Tooltip>
            )}

            <IconButton
              aria-label="Logout"
              icon={<FiLogOut />}
              size="sm"
              onClick={handleLogout}
              colorScheme="red"
              variant="ghost"
              title="Sair da Conta"
            />
          </HStack>

          {/* ── Botões Mobile (Hambúrguer + ThemeToggle) ───────────────── */}
          <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
            {childrenAcoes}
            <ThemeToggle />
            <IconButton
              aria-label="Abrir Menu de Navegação"
              icon={<FiMenu size={22} />}
              size="md"
              variant="outline"
              borderColor={borderColor}
              onClick={onOpen}
              colorScheme="orange"
            />
          </HStack>
        </Flex>
      </Box>

      {/* ── Drawer Lateral de Navegação Mobile ─────────────────────────────── */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <DrawerContent bg={drawerBg} borderLeft="1px solid" borderColor={borderColor}>
          <DrawerCloseButton mt={2} />

          <DrawerHeader borderBottom="1px solid" borderColor={borderColor} py={4}>
            <Image src={LogoCompleta} alt="BiraSoccer" h="32px" />
          </DrawerHeader>

          <DrawerBody px={4} py={6}>
            <VStack spacing={6} align="stretch">
              {/* Card do Usuário Logado */}
              {userId && perfil ? (
                <Box
                  p={4}
                  borderRadius="xl"
                  bg={activeBg}
                  border="1px solid"
                  borderColor="brand.300"
                  _dark={{ borderColor: 'brand.800' }}
                >
                  <Flex align="center" gap={3} mb={3}>
                    <Avatar
                      size="md"
                      name={perfil.nome || 'Jogador'}
                      src={perfil.foto_base64 || undefined}
                      border="2px solid"
                      borderColor="brand.500"
                      cursor="pointer"
                      onClick={() => handleNavigate(`/perfil/${userId}`)}
                    />
                    <VStack align="flex-start" spacing={0} flex={1} overflow="hidden">
                      <Text fontSize="15px" fontWeight={800} color={textPrimary} noOfLines={1}>
                        {perfil.nome}
                      </Text>
                      {perfil.steam_id ? (
                        <HStack spacing={1} color={textSecondary} fontSize="11px">
                          <FiTag size={10} />
                          <Text noOfLines={1}>{perfil.steam_id}</Text>
                        </HStack>
                      ) : (
                        <Text fontSize="11px" color={textSecondary}>
                          Jogador BiraSoccer
                        </Text>
                      )}
                    </VStack>
                  </Flex>

                  <Button
                    size="xs"
                    w="full"
                    variant="outline"
                    colorScheme="orange"
                    leftIcon={<FiEdit2 />}
                    onClick={() => {
                      onClose();
                      onOpenEditProfile();
                    }}
                    fontWeight={700}
                  >
                    Editar Meu Perfil
                  </Button>
                </Box>
              ) : null}

              {/* Lista de Links de Navegação */}
              <VStack spacing={2} align="stretch">
                <Text
                  fontSize="11px"
                  fontWeight={800}
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  px={2}
                >
                  Navegação
                </Text>

                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Button
                      key={link.path}
                      variant="ghost"
                      justifyContent="flex-start"
                      h="48px"
                      px={3}
                      borderRadius="lg"
                      bg={isActive ? activeBg : link.highlight ? 'rgba(249, 74, 41, 0.08)' : 'transparent'}
                      color={isActive ? 'brand.500' : link.highlight ? 'brand.500' : textPrimary}
                      fontWeight={isActive || link.highlight ? 800 : 600}
                      leftIcon={<Icon as={link.icon} boxSize={5} color={isActive || link.highlight ? 'brand.500' : textSecondary} />}
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleNavigate(link.path)}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </VStack>
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTop="1px solid" borderColor={borderColor} py={4}>
            <VStack w="full" spacing={3}>
              <Button
                w="full"
                variant="outline"
                colorScheme="red"
                leftIcon={<FiLogOut />}
                onClick={handleLogout}
                fontWeight={700}
                size="md"
              >
                Sair da Conta
              </Button>
              <Text fontSize="10px" color={textSecondary} textAlign="center">
                BiraSoccer © 2026 • EA Sports FC Cup
              </Text>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal de Edição de Perfil acionado via Drawer */}
      {perfil && (
        <ModalEditarPerfil
          isOpen={isEditProfileOpen}
          onClose={onCloseEditProfile}
          perfil={perfil}
          onPerfilAtualizado={(novo) => setPerfil(novo)}
        />
      )}
    </>
  );
}
