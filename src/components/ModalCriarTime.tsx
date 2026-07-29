import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
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
} from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { criarTime, atualizarTime } from '../services/timesCustomizadosService';
import type { TimeCustomizado } from '../services/timesCustomizadosService';
import { FiUpload, FiCheck, FiCrop } from 'react-icons/fi';

interface ModalCriarTimeProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTimeSalvo: (time: TimeCustomizado) => void;
  timeParaEditar?: TimeCustomizado | null;
}

export function ModalCriarTime({
  isOpen,
  onClose,
  userId,
  onTimeSalvo,
  timeParaEditar,
}: ModalCriarTimeProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(timeParaEditar?.nome ?? '');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(
    timeParaEditar?.escudo_base64 ?? null
  );
  const [saving, setSaving] = useState(false);
  const [cropConfirmed, setCropConfirmed] = useState(!!timeParaEditar);

  const bgModal = useColorModeValue('white', 'gray.800');
  const bgDropzone = useColorModeValue('gray.50', 'gray.700');
  const borderDropzone = useColorModeValue('gray.300', 'gray.600');

  // Reset ao abrir/fechar
  const handleClose = () => {
    setNome('');
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedPreview(null);
    setCropConfirmed(false);
    setSaving(false);
    onClose();
  };

  // Carregar imagem do file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione um arquivo de imagem.', status: 'warning', duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropConfirmed(false);
      setCroppedPreview(null);
    };
    reader.readAsDataURL(file);
  };

  // Callback do cropper
  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Confirmar recorte → gerar Base64 256×256
  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const base64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedPreview(base64);
      setCropConfirmed(true);
      toast({ title: 'Recorte confirmado!', status: 'success', duration: 2000, position: 'top' });
    } catch {
      toast({ title: 'Erro ao recortar imagem.', status: 'error', duration: 3000 });
    }
  };

  // Salvar no Supabase
  const handleSave = async () => {
    if (!nome.trim()) {
      toast({ title: 'Informe o nome do time.', status: 'warning', duration: 3000, position: 'top' });
      return;
    }
    if (!croppedPreview) {
      toast({ title: 'Envie e recorte o escudo do time.', status: 'warning', duration: 3000, position: 'top' });
      return;
    }

    setSaving(true);
    try {
      let result: TimeCustomizado | null;

      if (timeParaEditar) {
        result = await atualizarTime(timeParaEditar.id, {
          nome: nome.trim(),
          escudo_base64: croppedPreview,
        });
      } else {
        result = await criarTime({
          nome: nome.trim(),
          escudo_base64: croppedPreview,
          user_id: userId,
        });
      }

      if (result) {
        toast({
          title: timeParaEditar ? 'Time atualizado!' : 'Time criado com sucesso!',
          status: 'success',
          duration: 3000,
          position: 'top',
        });
        onTimeSalvo(result);
        handleClose();
      } else {
        toast({ title: 'Erro ao salvar o time.', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'Erro inesperado ao salvar.', status: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropConfirmed(false);
      setCroppedPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        bg={bgModal}
        borderRadius="md"
        boxShadow="xl"
        mx={4}
      >
        <ModalHeader
          fontFamily="heading"
          fontSize="xl"
          fontWeight={700}
          borderBottom="1px solid"
          borderColor={borderDropzone}
          pb={3}
        >
          {timeParaEditar ? 'Editar Time' : 'Criar Time Personalizado'}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={5}>
          <VStack spacing={5} align="stretch">
            {/* Nome do Time */}
            <FormControl isRequired>
              <FormLabel fontWeight={600} fontSize="sm">
                Nome do Time
              </FormLabel>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Os Craques FC"
                borderRadius="md"
                size="md"
              />
            </FormControl>

            {/* Upload + Cropper */}
            <FormControl>
              <FormLabel fontWeight={600} fontSize="sm">
                Escudo do Time
              </FormLabel>

              {/* Zona de upload (drag & drop ou botão) */}
              {!imageSrc && !croppedPreview && (
                <Box
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  border="2px dashed"
                  borderColor={borderDropzone}
                  borderRadius="md"
                  bg={bgDropzone}
                  p={8}
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ borderColor: 'brand.500', bg: useColorModeValue('orange.50', 'gray.600') }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <VStack spacing={2}>
                    <Box as={FiUpload} size="28px" color="brand.500" />
                    <Text fontSize="sm" fontWeight={500}>
                      Arraste a imagem aqui ou clique para selecionar
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      PNG, JPG ou WEBP
                    </Text>
                  </VStack>
                </Box>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* Cropper ativo */}
              {imageSrc && !cropConfirmed && (
                <VStack spacing={4}>
                  <Box
                    position="relative"
                    w="100%"
                    h="280px"
                    borderRadius="md"
                    overflow="hidden"
                    bg="black"
                  >
                    <Cropper
                      image={imageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape="rect"
                      showGrid={true}
                    />
                  </Box>

                  {/* Slider de Zoom */}
                  <HStack w="100%" spacing={3}>
                    <Text fontSize="xs" fontWeight={600} whiteSpace="nowrap">
                      Zoom
                    </Text>
                    <Slider
                      aria-label="zoom"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={setZoom}
                      colorScheme="orange"
                      flex={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                  </HStack>

                  <HStack w="100%" spacing={3}>
                    <Button
                      flex={1}
                      colorScheme="orange"
                      leftIcon={<FiCrop /> as any}
                      onClick={handleConfirmCrop}
                    >
                      Confirmar Recorte
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImageSrc(null);
                        setCroppedAreaPixels(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </HStack>
                </VStack>
              )}

              {/* Preview do escudo recortado */}
              {croppedPreview && cropConfirmed && (
                <VStack spacing={3}>
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    boxShadow="md"
                    border="1px solid"
                    borderColor={borderDropzone}
                    p={2}
                    bg={bgDropzone}
                  >
                    <Image
                      src={croppedPreview}
                      alt="Escudo recortado"
                      boxSize="120px"
                      objectFit="cover"
                      borderRadius="md"
                      mx="auto"
                    />
                  </Box>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="orange"
                    onClick={() => {
                      setCropConfirmed(false);
                      setCroppedPreview(null);
                      setImageSrc(null);
                    }}
                  >
                    Alterar imagem
                  </Button>
                </VStack>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor={borderDropzone} pt={4}>
          <HStack spacing={3} w="100%">
            <Button variant="ghost" onClick={handleClose} flex={1}>
              Cancelar
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleSave}
              isLoading={saving}
              loadingText="Salvando..."
              leftIcon={<FiCheck /> as any}
              flex={1}
              isDisabled={!nome.trim() || !croppedPreview}
            >
              {timeParaEditar ? 'Salvar Alterações' : 'Criar Time'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
