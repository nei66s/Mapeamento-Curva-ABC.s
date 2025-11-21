import type { SeasonTheme } from './season';

const VAR_MAP: Record<string, keyof SeasonTheme> = {
  '--primary': 'primary',
  '--primary-foreground': 'primaryForeground',
  '--background': 'background',
  '--foreground': 'foreground',
  '--card': 'card',
  '--card-foreground': 'cardForeground',
  '--muted': 'muted',
  '--muted-foreground': 'mutedForeground',
  '--hero-from': 'heroFrom',
  '--hero-via': 'heroVia',
  '--hero-to': 'heroTo',
  '--border': 'border',
  '--ring': 'ring',
};

const VAR_NAMES = Object.keys(VAR_MAP);

export function applySeasonTheme(theme: SeasonTheme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', 'seasonal');
  VAR_NAMES.forEach(varName => {
    const value = theme[VAR_MAP[varName]];
    if (value) {
      root.style.setProperty(varName, value);
    }
  });
}

export function clearSeasonTheme() {
  const root = document.documentElement;
  VAR_NAMES.forEach(varName => {
    root.style.removeProperty(varName);
  });
}
