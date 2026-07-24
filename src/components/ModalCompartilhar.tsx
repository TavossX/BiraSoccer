import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useClipboard,
  useToast,
  VStack,
  List, ListItem,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTorneioStore } from '../store/torneioStore';

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────
interface ModalCompartilharProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function ModalCompartilhar({ isOpen, onClose }: ModalCompartilharProps) {
  const { torneio, publicarTorneio } = useTorneioStore();
  const toast = useToast();

  const [link, setLink] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { onCopy, hasCopied } = useClipboard(link ?? '');

  // Publica automaticamente ao abrir o modal
  useEffect(() => {
    if (!isOpen || !torneio) return;
    setErro(null);

    const publicar = async () => {
      setPublicando(true);
      const url = await publicarTorneio();
      setPublicando(false);

      if (url) {
        setLink(url);
      } else {
        setErro('Não foi possível publicar o torneio. Verifique sua conexão e as credenciais do Supabase.');
      }
    };

    publicar();
  }, [isOpen, torneio?.id]);

  const handleCopiar = () => {
    onCopy();
    toast({
      title: '🔗 Link copiado!',
      description: 'Agora é só colar e enviar para seus amigos.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  };

  const handleCompartilharWhatsApp = () => {
    if (!link || !torneio) return;
    const texto = encodeURIComponent(
      `🏆 *${torneio.nome}* — Copa de Amigos EA FC 26\n\nAcompanhe os resultados em tempo real:\n${link}`
    );
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
      <ModalContent
        
        borderRadius="4px"
        borderWidth={1}
         _dark={{ bg: 'brand.surfaceDark', borderColor: 'whiteAlpha.300' }}
        overflow="hidden"
        mx={4}
      >
        {/* Tarja superior */}
        <Box h="4px"  />

        <ModalHeader pt={5} pb={2}>
          <HStack spacing={3}>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="md" fontWeight={700} fontFamily="heading">Compartilhar Torneio</Text>
              <Text fontSize="xs" opacity={0.6} noOfLines={1}>
                {torneio?.nome}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody pb={6}>
          <VStack spacing={5} align="stretch">
            {/* Estado: publicando */}
            {publicando && (
              <Flex
                direction="column" align="center" justify="center"
                py={8} gap={3}
              >
                <Spinner size="lg" color="brand.400" thickness="3px" speed="0.8s" />
                <Text fontSize="sm" color="whiteAlpha.600">
                  Publicando torneio no Supabase…
                </Text>
              </Flex>
            )}

            {/* Estado: erro */}
            {!publicando && erro && (
              <Box
                bg="red.900" borderRadius="2px" borderWidth={1} borderColor="red.700"
                p={4}
              >
                <Text fontSize="sm" color="red.300" fontWeight={600} mb={1}>
                  Erro ao publicar
                </Text>
                <Text fontSize="xs" color="red.400">{erro}</Text>
                <Text fontSize="xs" color="red.600" mt={2}>
                  Certifique-se de criar a tabela <code>torneios_publicos</code> no Supabase (ver SQL abaixo).
                </Text>
              </Box>
            )}

            {/* Estado: link gerado */}
            {!publicando && link && (
              <>
                {/* Indicador de publicado */}
                <HStack
                  bg="green.900" borderRadius="2px" borderWidth={1} borderColor="green.700"
                  px={4} py={2} spacing={2}
                >
                  <Box color="green.400"><CheckIcon /></Box>
                  <Text fontSize="xs" color="green.300" fontWeight={600}>
                    Torneio publicado — atualiza automaticamente a cada placar.
                  </Text>
                </HStack>

                {/* Campo do link */}
                <Box>
                  <Text fontSize="xs" opacity={0.6} mb={2} fontWeight={600}
                    textTransform="uppercase" letterSpacing="wide">
                    Link de convite
                  </Text>
                  <InputGroup>
                    <Input
                      value={link}
                      readOnly
                      variant="outline"
                      fontSize="sm"
                      fontFamily="mono"
                      pr="80px"
                    />
                    <InputRightElement w="80px" h="full">
                      <Button
                        id="btn-copiar-link"
                        size="xs"
                        onClick={handleCopiar}
                        variant="solid"
                        mr={1}
                        leftIcon={hasCopied ? <CheckIcon /> as any : <CopyIcon /> as any}
                      >
                        {hasCopied ? 'Copiado' : 'Copiar'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </Box>

                <Divider  _dark={{ borderColor: 'whiteAlpha.300' }} />

                {/* O que o amigo vê */}
                <Box>
                  <Text fontSize="xs" opacity={0.6} mb={2} fontWeight={600}
                    textTransform="uppercase" letterSpacing="wide">
                    O que seus amigos verão
                  </Text>
                  <List spacing={2}>
                    {[
                      torneio?.formato === 'liga'
                        ? 'Tabela de classificação em tempo real'
                        : 'Chaveamento e resultado dos confrontos',
                      'Times sorteados de cada participante',
                      'Todos os placares já inseridos',
                      'Quem está na liderança ou avançou de fase',
                    ].map((item) => (
                      <ListItem key={item}>
                        <HStack spacing={2} align="flex-start">
                          <Box  flexShrink={0} mt="1px">
                            <CheckIcon />
                          </Box>
                          <Text fontSize="xs" opacity={0.7}>{item}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider  _dark={{ borderColor: 'whiteAlpha.300' }} />

                {/* Botões de compartilhamento */}
                <VStack spacing={3}>
                  {/* WhatsApp */}
                  <Button
                    id="btn-whatsapp"
                    w="full"
                    onClick={handleCompartilharWhatsApp}
                    bg="#25D366"
                    _hover={{ bg: '#1ebe5d' }}
                    color="white"
                    fontWeight={700}
                    fontSize="sm"
                    borderRadius="4px"
                    leftIcon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg> as any
                    }
                  >
                    Compartilhar no WhatsApp
                  </Button>

                  {/* Copiar link */}
                  <Button
                    id="btn-copiar-link-grande"
                    w="full"
                    onClick={handleCopiar}
                    variant="solid"
                    borderRadius="4px"
                    fontWeight={600}
                    fontSize="sm"
                    leftIcon={hasCopied ? <CheckIcon /> as any : <CopyIcon /> as any}
                  >
                    {hasCopied ? '✓ Link copiado!' : 'Copiar link'}
                  </Button>
                </VStack>

                {/* Nota de atualização */}
                <HStack
                   borderRadius="2px" p={3} spacing={2}
                  borderWidth={1}  _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.100' }}
                >
                  <Box  flexShrink={0}><GlobeIcon /></Box>
                  <Text fontSize="2xs" opacity={0.6} lineHeight="1.5">
                    O link permanece ativo. Sempre que você lançar um placar e recompartilhar,
                    o torneio é re-publicado com os dados mais recentes.
                  </Text>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
