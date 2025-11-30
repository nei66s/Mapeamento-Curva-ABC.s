export type ThemeColorOption = {
  id: string;
  label: string;
  swatch: string;
  seasonal?: boolean;
};

export const COLOR_OPTIONS: ThemeColorOption[] = [
  { id: 'orange', label: 'Laranja', swatch: 'hsl(18 90% 47%)' },
  { id: 'seasonal', label: 'Tema sazonal', swatch: 'seasonal', seasonal: true },
];
