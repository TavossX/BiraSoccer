import { IconButton, useColorMode } from '@chakra-ui/react';
import { FiSun as SunIcon, FiMoon as MoonIcon } from 'react-icons/fi';





export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <IconButton
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
      color={isDark ? 'yellow.400' : 'gray.600'}
      _hover={{
        bg: isDark ? 'whiteAlpha.200' : 'blackAlpha.100',
        color: isDark ? 'yellow.300' : 'brand.500',
      }}
    />
  );
}
