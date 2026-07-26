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
    mustard: '#FDBB00',
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
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.600',
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
      outline: {
        field: {
          borderRadius: 'md',
        },
      },
    },
  },
  NumberInput: {
    variants: {
      outline: {
        field: {
          borderRadius: 'md',
        },
        stepper: {
          borderRadius: 'md',
        },
      },
    },
  },
  Select: {
    variants: {
      outline: {
        field: {
          borderRadius: 'md',
        },
      },
    },
  },
  Card: {
    baseStyle: (props: any) => ({
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      }
    })
  },
  Modal: {
    baseStyle: (props: any) => ({
      dialog: {
        borderRadius: 'lg',
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      }
    })
  }
};

export const theme = extendTheme({ config, colors, fonts, styles, components });
