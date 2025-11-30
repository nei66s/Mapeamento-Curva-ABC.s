
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { AiConnectionIndicator } from '@/components/layout/ai-connection-indicator';

import { updateThemeColor, ThemeTone, SEASONAL_THEME_ID } from '@/lib/theme-manager';
import { COLOR_OPTIONS } from '@/lib/theme-options';
import { useCurrentUser } from '@/hooks/use-current-user';

const readThemePreference = () => {
  if (typeof window === 'undefined') {
    return {
      theme: 'light' as const,
      themeColor: 'orange',
      tone: 'soft' as ThemeTone,
    };
  }

  const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  let storedColorRaw = localStorage.getItem('themeColor') || 'orange';
  let storedTone: ThemeTone = (localStorage.getItem('themeTone') as ThemeTone) || 'soft';
  if (storedColorRaw.endsWith('-vivid')) {
    storedTone = 'vivid';
    storedColorRaw = storedColorRaw.replace(/-vivid$/, '');
  }

  return {
    theme: storedTheme,
    themeColor: storedColorRaw,
    tone: storedTone,
  };
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeColor, setThemeColor] = useState<string>('orange');
  const [tone, setTone] = useState<ThemeTone>('soft');
  const { user } = useCurrentUser();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const pref = readThemePreference();
      setTheme(pref.theme);
      setThemeColor(pref.themeColor);
      setTone(pref.tone);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    try {
      updateThemeColor(themeColor, tone);
    } catch (e) {
      // ignore
    }
  }, [themeColor, tone]);

  const persistThemePreference = async (changes: Partial<{ theme: 'light' | 'dark'; themeColor: string; themeTone: ThemeTone }>) => {
    if (!user?.id) return;
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...changes }),
      });
    } catch (err) {
      console.warn('Failed to persist theme preference', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    void persistThemePreference({ theme: newTheme, themeColor, themeTone: tone });
  };

  const handleColorSelection = (colorId: string) => {
    setThemeColor(colorId);
    updateThemeColor(colorId, tone);
    void persistThemePreference({ themeColor: colorId, themeTone: tone, theme });
  };

  const applyTone = (newTone: ThemeTone) => {
    setTone(newTone);
    updateThemeColor(themeColor, newTone);
    void persistThemePreference({ themeColor, themeTone: newTone, theme });
  };

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'theme') {
        const value = (event.newValue as 'light' | 'dark') || 'light';
        setTheme(value);
      }
      if (event.key === 'themeColor' && event.newValue) {
        const colorId = event.newValue;
        setThemeColor(colorId);
      }
      if (event.key === 'themeTone' && (event.newValue === 'soft' || event.newValue === 'vivid')) {
        const newTone = event.newValue as ThemeTone;
        setTone(newTone);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={toggleTheme}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <AiConnectionIndicator />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Escolher cor do tema">
            <span className="sr-only">Escolher cor do tema</span>
            <Palette className="h-4 w-4" />
            <span
              aria-hidden
              className={`ml-1 h-3 w-3 rounded-full border border-border ${
                themeColor === SEASONAL_THEME_ID ? `swatch-${SEASONAL_THEME_ID}-${tone}` : `swatch-${themeColor}-${tone}`
              }`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={tone === 'soft' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => applyTone('soft')}
              aria-pressed={tone === 'soft'}
            >
              Suave
            </Button>
            <Button
              variant={tone === 'vivid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => applyTone('vivid')}
              aria-pressed={tone === 'vivid'}
            >
              Antigo
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleColorSelection(opt.id)}
                title={opt.label}
                aria-label={opt.label}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 theme-swatch-btn ${
                  themeColor === opt.id ? 'active' : ''
                } ${opt.seasonal ? `swatch-${SEASONAL_THEME_ID}-${tone}` : `swatch-${opt.id}-${tone}`}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
