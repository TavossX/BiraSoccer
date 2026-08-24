import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { FiCheck, FiCrop, FiEdit2, FiTrash2, FiUpload, FiUser } from 'react-icons/fi';
import { atualizarPerfil } from '../services/perfisService';
import type { Perfil } from '../types/social';
import getCroppedImg from '../utils/cropImage';

interface ModalEditarPerfilProps {
  isOpen: boolean;
  onClose: () => void;
  perfil: Perfil;
  onPerfilAtualizado?: (novoPerfil: Perfil) => void;
}

export function ModalEditarPerfil({
  isOpen,
  onClose,
  perfil,
  onPerfilAtualizado,
}: ModalEditarPerfilProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(perfil.nome || '');
  const [steamId, setSteamId] = useState(perfil.steam_id || '');
  const [fotoBase64, setFotoBase64] = useState<string | null>(perfil.foto_base64 || null);

  // Crop modal states
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && perfil) {
      setNome(perfil.nome || '');
      setSteamId(perfil.steam_id || '');
      setFotoBase64(perfil.foto_base64 || null);
    }
  }, [isOpen, perfil]);

  const modalBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.900', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const inputBg = useColorModeValue('white', 'gray.900');

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

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.trim().length < 2) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um apelido ou nome com ao menos 2 letras.',
        status: 'warning',
        position: 'top',
      });
      return;
    }

    setSaving(true);
    try {
      const atualizado = await atualizarPerfil(perfil.id, {
        nome: nome.trim(),
        steam_id: steamId.trim() || null,
        foto_base64: fotoBase64,
        onboarding_completo: true,
      });

      if (atualizado) {
        if (onPerfilAtualizado) onPerfilAtualizado(atualizado);
        toast({
          title: 'Perfil atualizado!',
          description: 'Suas alterações foram salvas com sucesso.',
          status: 'success',
          duration: 3000,
          position: 'top-right',
        });
        onClose();
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: err.message || 'Tente novamente.',
        status: 'error',
        duration: 4000,
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
        <ModalContent
          as="form"
          onSubmit={handleSalvar}
          bg={modalBg}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="2xl"
        >
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} py={4}>
            <HStack spacing={3}>
              <Box p={2} borderRadius="lg" bg="rgba(249, 74, 41, 0.12)" color="brand.500">
                <FiEdit2 size={20} />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="18px" fontWeight={800} color={textPrimary}>
                  Editar Perfil
                </Text>
                <Text fontSize="12px" color={textSecondary}>
                  Altere sua foto, nome de exibição e ID da Steam.
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={6}>
            <VStack spacing={5} align="stretch">
              {/* Foto de Perfil */}
              <FormControl>
                <FormLabel fontSize="13px" fontWeight={700} color={textPrimary}>
                  Foto de Perfil
                </FormLabel>
                <HStack spacing={4} align="center">
                  <Avatar
                    size="xl"
                    name={nome || 'Jogador'}
                    src={fotoBase64 || undefined}
                    border="3px solid"
                    borderColor="brand.500"
                  />
                  <VStack align="flex-start" spacing={2}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleSelectFile}
                      style={{ display: 'none' }}
                    />
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        leftIcon={<FiUpload />}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Trocar Foto
                      </Button>
                      {fotoBase64 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          leftIcon={<FiTrash2 />}
                          onClick={() => setFotoBase64(null)}
                        >
                          Remover
                        </Button>
                      )}
                    </HStack>
                    <Text fontSize="11px" color={textSecondary}>
                      Formatos JPG, PNG ou WEBP.
                    </Text>
                  </VStack>
                </HStack>
              </FormControl>

              {/* Nome / Nick */}
              <FormControl isRequired>
                <FormLabel fontSize="13px" fontWeight={700} color={textPrimary}>
                  Nome ou Nickname
                </FormLabel>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cristiano Ronaldo"
                  bg={inputBg}
                  fontWeight={600}
                  borderRadius="lg"
                />
              </FormControl>

              {/* Steam ID */}
              <FormControl>
                <FormLabel fontSize="13px" fontWeight={700} color={textPrimary}>
                  ID da Steam (Opcional)
                </FormLabel>
                <Input
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  placeholder="Ex: 76561198000000000 ou seu nickname na Steam"
                  bg={inputBg}
                  fontWeight={500}
                  borderRadius="lg"
                />
                <Text fontSize="11px" color={textSecondary} mt={1}>
                  Ajuda seus amigos a encontrarem você para jogarem partidas no EA FC 26.
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor} py={3}>
            <HStack spacing={3}>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="orange"
                size="sm"
                fontWeight={700}
                leftIcon={<FiCheck />}
                isLoading={saving}
              >
                Salvar Alterações
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Recorte de Imagem (Crop) */}
      <Modal isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg={modalBg} borderRadius="xl" overflow="hidden">
          <ModalHeader fontSize="16px" color={textPrimary} borderBottom="1px solid" borderColor={borderColor}>
            <HStack spacing={2}>
              <FiCrop />
              <Text>Ajustar Foto de Perfil</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody p={0}>
            <Box position="relative" w="full" h="300px" bg="black">
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
            <Box px={6} py={4}>
              <Text fontSize="xs" color={textSecondary} mb={2}>
                Zoom
              </Text>
              <Slider
                aria-label="zoom-slider"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(val) => setZoom(val)}
                colorScheme="orange"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor} py={3}>
            <HStack spacing={3}>
              <Button variant="ghost" size="sm" onClick={() => setIsCropOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme="orange" size="sm" onClick={handleConfirmCrop} leftIcon={<FiCheck />}>
                Confirmar Recorte
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
