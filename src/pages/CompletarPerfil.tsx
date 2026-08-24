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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useToast,
  VStack,
  useColorModeValue,
  HStack,
  Avatar,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { useNavigate } from 'react-router-dom';
import getCroppedImg from '../utils/cropImage';
import { supabase } from '../lib/supabase';
import { atualizarPerfil, obterPerfil } from '../services/perfisService';
import { FiUpload, FiCheck, FiCrop, FiUser } from 'react-icons/fi';
import { ThemeToggle } from '../components/ThemeToggle';
import LogoCompleta from '../assets/logos/LogoCompleta.png';

export function CompletarPerfil() {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usuarioId, setUsuarioId] = useState<string>('');
  const [nome, setNome] = useState('');
  const [steamId, setSteamId] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  // Estados do Modal de Crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const textColorMuted = useColorModeValue('gray.600', 'gray.400');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');

  useEffect(() => {
    const carregarUsuario = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setUsuarioId(user.id);

      // Tenta buscar o perfil se já existir parcial
      const perf = await obterPerfil(user.id);
      if (perf) {
        if (perf.nome) setNome(perf.nome);
        if (perf.steam_id) setSteamId(perf.steam_id);
        if (perf.foto_base64) setFotoBase64(perf.foto_base64);
      } else if (user.user_metadata?.nome) {
        setNome(user.user_metadata.nome);
      }
    };

    carregarUsuario();
  }, [navigate]);

  // Upload de Imagem
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
        setIsCropOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      setFotoBase64(croppedBase64);
      setIsCropOpen(false);
      setImageSrc(null);
    } catch (e: any) {
      toast({
        title: 'Erro ao cortar imagem',
        description: e.message,
        status: 'error',
      });
    }
  };

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || nome.trim().length < 2) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome ou apelido válido.',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    setSaving(true);
    try {
      await atualizarPerfil(usuarioId, {
        nome: nome.trim(),
        steam_id: steamId.trim() || null,
        foto_base64: fotoBase64,
        onboarding_completo: true,
      });

      toast({
        title: 'Perfil atualizado!',
        status: 'success',
        duration: 3000,
        position: 'top',
      });

      // Se houver um convite pendente, redireciona para ele
      const pendingInvite = localStorage.getItem('pending_invite_token');
      if (pendingInvite) {
        navigate(`/invite/${pendingInvite}`);
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: err.message,
        status: 'error',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" px={4} py={10}>
      <Box w="full" maxW="500px" bg={cardBg} borderRadius="xl" boxShadow="2xl" p={{ base: 6, md: 8 }}>
        <Flex justify="space-between" align="center" mb={6}>
          <Image src={LogoCompleta} alt="EAFC26 Cup" h="44px" objectFit="contain" />
          <ThemeToggle />
        </Flex>

        <VStack spacing={2} textAlign="center" mb={6}>
          <Heading fontSize={{ base: '20px', md: '24px' }} color={textPrimary}>Completar Seu Perfil</Heading>
          <Text fontSize="13px" color={textColorMuted}>
            Configure seu apelido e foto para que seus amigos te identifiquem nos campeonatos.
          </Text>
        </VStack>

        <VStack as="form" onSubmit={handleSubmit} spacing={5} align="stretch">
          {/* Avatar / Crop */}
          <Flex justify="center">
            <VStack spacing={2}>
              <Avatar
                size="2xl"
                name={nome || 'Jogador'}
                src={fotoBase64 || undefined}
                border="3px solid"
                borderColor="brand.500"
              />
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                leftIcon={<FiUpload />}
                onClick={() => fileInputRef.current?.click()}
              >
                {fotoBase64 ? 'Alterar Foto' : 'Enviar Foto'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleSelectFile}
                style={{ display: 'none' }}
              />
            </VStack>
          </Flex>

          {/* Nome / Nickname */}
          <FormControl isRequired>
            <FormLabel fontSize="13px" fontWeight={700}>
              NOME OU NICKNAME
            </FormLabel>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Gabriel, Otavio, Will"
            />
          </FormControl>

          {/* Steam ID / Gamertag */}
          <FormControl>
            <FormLabel fontSize="13px" fontWeight={700}>
              STEAM ID / GAMERTAG (OPCIONAL)
            </FormLabel>
            <Input
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Ex: SteamID64 ou PSN/Xbox ID"
            />
          </FormControl>

          <Button type="submit" colorScheme="brand" size="lg" isLoading={saving} h="50px" mt={2}>
            SALVAR E CONTINUAR
          </Button>
        </VStack>
      </Box>

      {/* Modal de Cortar Imagem (Crop) */}
      <Modal isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="16px">Ajustar Foto de Perfil</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box position="relative" w="full" h="280px" borderRadius="lg" overflow="hidden" bg="black">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </Box>
            <Box mt={4}>
              <Text fontSize="12px" color={textColorMuted} fontWeight={600} mb={1}>
                Zoom
              </Text>
              <Slider value={zoom} min={1} max={3} step={0.1} onChange={(v) => setZoom(v)}>
                <SliderTrack>
                  <SliderFilledTrack bg="brand.500" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100">
            <Button variant="ghost" mr={3} onClick={() => setIsCropOpen(false)}>
              Cancelar
            </Button>
            <Button colorScheme="brand" leftIcon={<FiCheck />} onClick={handleConfirmCrop}>
              Confirmar Foto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
