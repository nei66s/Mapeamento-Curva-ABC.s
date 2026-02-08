'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { AiConnectionIndicator } from '@/components/layout/ai-connection-indicator';
import { useCurrentUser } from '@/hooks/use-current-user';

const readThemePreference = () => {
  if (typeof window === 'undefined') {
    return 'light' as const;
  }
  return ((localStorage.getItem('theme') as 'light' | 'dark') || 'light');
};

export function ThemeToggle() {
  const { user } = useCurrentUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setTheme(readThemePreference());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
      // Also write a cookie so the theme can be read early by the inline script
      try {
        document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (e) {
        // ignore cookie write errors
      }
    } catch (err) {
      // ignore storage issues
    }
  }, [theme]);

  const persistThemePreference = async (newTheme: 'light' | 'dark') => {
    if (!user?.id) return;
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, theme: newTheme }),
      });
    } catch (err) {
      console.warn('Failed to persist theme preference', err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    void persistThemePreference(nextTheme);
  };

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
        setTheme(event.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Alternar tema claro/escuro">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Alternar tema</span>
      </Button>
      <AiConnectionIndicator />
    </div>
  );
}
