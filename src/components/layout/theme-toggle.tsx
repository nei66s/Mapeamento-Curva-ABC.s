
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Palette } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Azul', swatch: 'hsl(215 36% 45%)' },
  { id: 'green', label: 'Verde', swatch: 'hsl(150 32% 42%)' },
  { id: 'purple', label: 'Roxo', swatch: 'hsl(260 30% 46%)' },
  { id: 'orange', label: 'Laranja', swatch: 'hsl(28 48% 48%)' },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeColor, setThemeColor] = useState<string>('blue');
  const [tone, setTone] = useState<'soft' | 'vivid'>('soft');

  useEffect(() => {
    const storedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    let storedColorRaw = localStorage.getItem('themeColor') || 'blue';
    let storedTone: 'soft' | 'vivid' = (localStorage.getItem('themeTone') as 'soft' | 'vivid') || 'soft';
    // Backwards-compat: older values might include the -vivid suffix
    if (storedColorRaw.endsWith('-vivid')) {
      storedTone = 'vivid';
      storedColorRaw = storedColorRaw.replace(/-vivid$/, '');
    }
    setTheme(storedTheme);
    setThemeColor(storedColorRaw);
    setTone(storedTone);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    try {
      const themeId = storedTone === 'vivid' ? `${storedColorRaw}-vivid` : storedColorRaw;
      document.documentElement.setAttribute('data-theme', themeId);
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const applyColor = (colorId: string) => {
    setThemeColor(colorId);
    localStorage.setItem('themeColor', colorId);
    localStorage.setItem('themeTone', tone);
    const themeId = tone === 'vivid' ? `${colorId}-vivid` : colorId;
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const applyTone = (newTone: 'soft' | 'vivid') => {
    setTone(newTone);
    localStorage.setItem('themeTone', newTone);
    const themeId = newTone === 'vivid' ? `${themeColor}-vivid` : themeColor;
    try {
      document.documentElement.setAttribute('data-theme', themeId);
    } catch (e) {}
  };

  const activeSwatch = COLOR_OPTIONS.find(c => c.id === themeColor)?.swatch;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={toggleTheme}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Escolher cor do tema">
            <span className="sr-only">Escolher cor do tema</span>
            <Palette className="h-4 w-4" />
            <span aria-hidden className={`ml-1 h-3 w-3 rounded-full swatch-${themeColor}-${tone} border border-border`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              className={`px-2 py-1 rounded-md text-sm ${tone === 'soft' ? 'bg-muted/20' : ''}`}
              onClick={() => applyTone('soft')}
                aria-pressed={tone === 'soft'}
            >
              Suave
            </button>
            <button
              className={`px-2 py-1 rounded-md text-sm ${tone === 'vivid' ? 'bg-muted/20' : ''}`}
            onClick={() => applyTone('vivid')}
              aria-pressed={tone === 'vivid'}
            >
              Antigo
            </button>
          </div>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => applyColor(opt.id)}
                title={opt.label}
                aria-label={opt.label}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 theme-swatch-btn ${
                  themeColor === opt.id ? 'active' : ''
                } swatch-${opt.id}-${tone}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
