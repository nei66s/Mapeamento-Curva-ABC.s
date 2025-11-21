export type ThemeColorOption = {
  id: string;
  label: string;
  swatch: string;
  seasonal?: boolean;
};

export const COLOR_OPTIONS: ThemeColorOption[] = [
  { id: 'blue', label: 'Azul', swatch: 'hsl(215 36% 45%)' },
  { id: 'green', label: 'Verde', swatch: 'hsl(150 32% 42%)' },
  { id: 'purple', label: 'Roxo', swatch: 'hsl(260 30% 46%)' },
  { id: 'orange', label: 'Laranja', swatch: 'hsl(28 48% 48%)' },
  { id: 'seasonal', label: 'Tema sazonal', swatch: 'seasonal', seasonal: true },
];
