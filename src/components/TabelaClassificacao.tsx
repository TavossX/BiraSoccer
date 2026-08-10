import {
  Box,
  Flex,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  Tooltip,
  VStack,
  Image,
  Avatar,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTorneioStore } from '../store/torneioStore';
import type { Participante } from '../types/torneio';

// ─── Ordenação ────────────────────────────────────────────────────────────────
function ordenarParticipantes(
  lista: Participante[],
  partidas: ReturnType<typeof useTorneioStore.getState>['partidas']
): Participante[] {
  return [...lista].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    const sgA = a.golsPro - a.golsContra;
    const sgB = b.golsPro - b.golsContra;
    if (sgB !== sgA) return sgB - sgA;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    const confrontos = partidas.filter(
      (p) => p.finalizada &&
        ((p.participanteAId === a.id && p.participanteBId === b.id) ||
         (p.participanteAId === b.id && p.participanteBId === a.id))
    );
    let pontosA = 0, pontosB = 0;
    confrontos.forEach((p) => {
      const aJogouComoA = p.participanteAId === a.id;
      const ga = aJogouComoA ? (p.placarA ?? 0) : (p.placarB ?? 0);
      const gb = aJogouComoA ? (p.placarB ?? 0) : (p.placarA ?? 0);
      if (ga > gb) pontosA += 3;
      else if (ga < gb) pontosB += 3;
      else { pontosA += 1; pontosB += 1; }
    });
    return pontosB - pontosA;
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function TabelaClassificacao({ highlightTop4 = false }: { highlightTop4?: boolean }) {
  const navigate = useNavigate();
  const { participantes, partidas } = useTorneioStore();

  const classificacao = useMemo(
    () => ordenarParticipantes(participantes, partidas),
    [participantes, partidas]
  );

  const totalJogos    = partidas.filter((p) => p.finalizada).length;
  const totalPartidas = partidas.length;

  if (classificacao.length === 0) {
    return (
      <Flex h="200px" align="center" justify="center">
        <Text fontSize="12px" >Nenhum participante cadastrado.</Text>
      </Flex>
    );
  }

  return (
    <Box>
      {/* Progresso */}
      <HStack mb={4} justify="space-between">
        <Text fontSize="12px" >
          Progresso:{' '}
          <Text as="span" fontWeight={700} >
            {totalJogos}/{totalPartidas}
          </Text>{' '}
          partidas
        </Text>
        <Badge
          bg={totalJogos === totalPartidas ? 'brand.cardBgAlt' : 'brand.orange'}
          color={totalJogos === totalPartidas ? 'brand.textMutedToken' : 'black'}
          border="1px solid #C3c3c3"
          borderRadius="5px"
          boxShadow="md"
          px={3} py={1}
          fontSize="12px"
        >
          {totalJogos === totalPartidas ? 'FINALIZADO' : 'EM ANDAMENTO'}
        </Badge>
      </HStack>

      {/* Tabela */}
      <Box
        
        
        boxShadow="md"
        overflowX="auto"
      >
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr
              
              borderBottom="1px solid #C3c3c3"
              
            >
              {['#', 'Participante', 'P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'].map((col) => (
                <Th
                  key={col}
                  fontFamily="heading"
                  fontSize={{ base: '13px', md: '15px' }}
                  fontWeight={700}
                  textTransform="uppercase"
                  letterSpacing="wider"
                  
                  py={3}
                  px={col === '#' || col === 'P' ? 4 : 3}
                  textAlign={col === 'Participante' ? 'left' : 'center'}
                >
                  <Tooltip
                    label={
                      col === 'P' ? 'Pontos' : col === 'J' ? 'Jogos' :
                      col === 'V' ? 'Vitórias' : col === 'E' ? 'Empates' :
                      col === 'D' ? 'Derrotas' : col === 'GP' ? 'Gols Pró' :
                      col === 'GC' ? 'Gols Contra' : col === 'SG' ? 'Saldo de Gols' : col
                    }
                    placement="top"
                    hasArrow
                  >
                    <span style={{ cursor: 'default' }}>{col}</span>
                  </Tooltip>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {classificacao.map((p, idx) => {
              const pos = idx + 1;
              const sg  = p.golsPro - p.golsContra;
              const isTop4  = highlightTop4 && pos <= 4;
              const isLast2 = !highlightTop4 && pos > classificacao.length - 2 && classificacao.length > 3;
              const isFirst = pos === 1;

              const rowBg = isTop4
                ? (pos === 1 ? 'rgba(253,187,0,0.15)' : 'rgba(253,187,0,0.07)')
                : (isFirst ? 'rgba(249,74,41,0.1)' : isLast2 ? 'rgba(200,0,0,0.1)' : 'transparent');

              const leftBorderColor = isTop4
                ? '#FDBB00'
                : isFirst ? '#F94A29' : isLast2 ? '#C80000' : 'transparent';

              return (
                <Tr
                  key={p.id}
                  bg={rowBg}
                  borderBottom="1px solid"
                  
                  position="relative"
                  transition="background 0.1s"
                  _hover={{ bg: 'rgba(253,187,0,0.05)' }}
                >
                  {/* Posição com borda esquerda */}
                  <Td position="relative" px={4} py={3} textAlign="center" w="44px">
                    <Box
                      position="absolute"
                      left={0} top={0} bottom={0}
                      w="4px"
                      bg={leftBorderColor}
                    />
                    <Text
                      fontFamily="heading"
                      fontWeight={900}
                      fontSize={{ base: '14px', md: '16px' }}
                      color={isTop4 ? 'brand.mustard' : isFirst ? 'brand.orange' : 'brand.textMain'}
                    >
                      {pos}º
                    </Text>
                  </Td>

                  {/* Nome e Time */}
                  <Td py={3} px={3}>
                    <HStack spacing={2}>
                      <Avatar
                        size="xs"
                        name={p.nomeAmigo}
                        src={p.fotoUsuario || undefined}
                        cursor={p.usuarioId ? 'pointer' : 'default'}
                        onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                      />
                      <VStack
                        align="flex-start"
                        spacing={0}
                        cursor={p.usuarioId ? 'pointer' : 'default'}
                        onClick={() => p.usuarioId && navigate(`/perfil/${p.usuarioId}`)}
                        _hover={p.usuarioId ? { opacity: 0.8 } : undefined}
                      >
                        <Text
                          fontFamily="heading"
                          fontWeight={700}
                          fontSize={{ base: '13px', md: '15px' }}
                        >
                          {p.nomeAmigo}
                        </Text>
                        <HStack spacing={1}>
                          {p.logoTime && <Image src={p.logoTime} boxSize="12px" objectFit="contain" />}
                          <Text fontSize="12px">{p.timeSorteado}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Td>

                  {/* Pontos (destaque) */}
                  <Td py={3} px={4} textAlign="center">
                    <Text
                      fontFamily="heading"
                      fontWeight={900}
                      fontSize={{ base: '16px', md: '18px' }}
                      
                    >
                      {p.pontos}
                    </Text>
                  </Td>

                  {/* J V E D */}
                  {[p.jogos, p.vitorias, p.empates, p.derrotas].map((val, i) => (
                    <Td key={i} py={3} px={3} textAlign="center">
                      <Text fontFamily="heading" fontSize="12px" >{val}</Text>
                    </Td>
                  ))}

                  {/* GP */}
                  <Td py={3} px={3} textAlign="center">
                    <Text fontFamily="heading" fontSize="12px" >{p.golsPro}</Text>
                  </Td>

                  {/* GC */}
                  <Td py={3} px={3} textAlign="center">
                    <Text fontFamily="heading" fontSize="12px" >{p.golsContra}</Text>
                  </Td>

                  {/* SG */}
                  <Td py={3} px={3} textAlign="center">
                    <Text
                      fontFamily="heading"
                      fontSize="12px"
                      fontWeight={700}
                      color={sg > 0 ? 'brand.mustard' : sg < 0 ? 'brand.orange' : 'brand.textMutedToken'}
                    >
                      {sg > 0 ? `+${sg}` : sg}
                    </Text>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* Legenda */}
      <HStack spacing={4} mt={4} flexWrap="wrap">
        {highlightTop4 ? (
          <HStack spacing={2}>
            <Box w="4px" h="16px" bg="#FDBB00" borderRadius="2px" />
            <Text fontSize="12px" >Top 4 — Classificados para Playoffs</Text>
          </HStack>
        ) : (
          <>
            <HStack spacing={2}>
              <Box w="4px" h="16px" bg="#F94A29" borderRadius="2px" />
              <Text fontSize="12px" >Campeão / Promoção</Text>
            </HStack>
            <HStack spacing={2}>
              <Box w="4px" h="16px" bg="#C80000" borderRadius="2px" />
              <Text fontSize="12px" >Zona de Rebaixamento</Text>
            </HStack>
          </>
        )}
        <Text fontSize="12px" >
          Critérios: Pts → Saldo → GP → Confronto Direto
        </Text>
      </HStack>
    </Box>
  );
}
