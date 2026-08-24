import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const colors = {
  brand: {
    50: '#fff4e5',
    100: '#ffe0b8',
    200: '#ffcb8a',
    300: '#ffb55c',
    400: '#ff9f2e',
    500: '#f94a29', // Laranja base da logo
    600: '#c73a1e',
    700: '#942a14',
    800: '#621a09',
    900: '#310a01',
    orange: '#f94a29',
    red: '#e53e3e',
    mustard: '#FDBB00',
    cardBg: '#ffffff',
    cardBgAlt: '#f1f5f9',
    textMain: '#1e293b',
    textMuted: '#64748b',
    textMutedToken: '#64748b',
  },
};

const fonts = {
  heading: `'Inter', sans-serif`,
  body:    `'Inter', sans-serif`,
};

const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      borderRadius: 'md',
      fontWeight: '600',
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Input: {
    variants: {
      outline: (props: any) => ({
        field: {
          borderRadius: 'md',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
          _hover: {
            borderColor: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #f94a29',
          },
        },
      }),
    },
  },
  NumberInput: {
    variants: {
      outline: (props: any) => ({
        field: {
          borderRadius: 'md',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #f94a29',
          },
        },
        stepper: {
          borderRadius: 'md',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          color: props.colorMode === 'dark' ? 'gray.200' : 'gray.700',
        },
      }),
    },
  },
  Select: {
    variants: {
      outline: (props: any) => ({
        field: {
          borderRadius: 'md',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #f94a29',
          },
        },
      }),
    },
  },
  Card: {
    baseStyle: (props: any) => ({
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
        borderWidth: '1px',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },
  Modal: {
    baseStyle: (props: any) => ({
      dialog: {
        borderRadius: 'lg',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },
};

export const theme = extendTheme({ config, colors, fonts, styles, components });
