'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-2 h-9 w-9 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="h-4 w-4 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm transition-all duration-300">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          theme === 'light'
            ? 'bg-indigo-600 text-white shadow-md transform scale-110'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Light Mode"
      >
        <Sun size={18} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-indigo-600 text-white shadow-md transform scale-110'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
        }`}
        title="Dark Mode"
      >
        <Moon size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
