import { getSeasonSnapshot } from './season';
import { applySeasonTheme, clearSeasonTheme } from './season-theme-utils';

export type ThemeTone = 'soft' | 'vivid';
export const SEASONAL_THEME_ID = 'seasonal';

export function updateThemeColor(colorId: string, tone: ThemeTone) {
  const root = document.documentElement;
  const themeId =
    colorId === SEASONAL_THEME_ID
      ? SEASONAL_THEME_ID
      : tone === 'vivid'
        ? `${colorId}-vivid`
        : colorId;
  localStorage.setItem('themeColor', colorId);
  localStorage.setItem('themeTone', tone);
  root.setAttribute('data-theme', themeId);
  if (colorId === SEASONAL_THEME_ID) {
    applySeasonTheme(getSeasonSnapshot().theme);
  } else {
    clearSeasonTheme();
  }
}
