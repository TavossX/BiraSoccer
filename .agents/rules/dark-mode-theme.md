# Regra de Design System & Dark Mode (BiraSoccer)

## Diretrizes Obrigatórias de Cores e Contraste

1. **Nunca usar tokens de cores inexistentes**:
   - Sempre utilize tokens registrados no `src/theme.ts`.
   - A paleta `gray` suporta: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `750` (superfície interna sólida), `800` (cards), `850` (popovers, drawers e modais), `900` (fundo da página) e `950`.

2. **Opacidade e Backgrounds Sólidos**:
   - Popovers, Menus, Modais e Drawers **nunca** devem ter fundos transparentes ou semi-transparentes que deixem elementos do fundo vazarem.
   - Sempre utilize `bg={useColorModeValue('white', 'gray.850')}` ou `bg={useColorModeValue('white', 'gray.800')}` com borda visível `gray.700` no modo escuro.

3. **Contraste de Texto em Dark Mode**:
   - Títulos e textos principais: `useColorModeValue('gray.900', 'gray.100')` ou `white`.
   - Textos secundários/legendas: `useColorModeValue('gray.600', 'gray.400')`.
   - Destaques coloridos em fundo escuro: priorize `orange.300` ou `yellow.400` para garantir legibilidade e alto contraste WCAG.
