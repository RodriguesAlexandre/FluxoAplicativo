
import { useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('fluxo-theme') as Theme | null;
        return savedTheme || 'system';
    });

    const prefersDark = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);

    useEffect(() => {
        const applyTheme = (t: Theme) => {
            const root = document.documentElement;
            if (t === 'dark' || (t === 'system' && prefersDark.matches)) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem('fluxo-theme', t);
        };

        applyTheme(theme);

        const handleSystemChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        prefersDark.addEventListener('change', handleSystemChange);
        return () => prefersDark.removeEventListener('change', handleSystemChange);
    }, [theme, prefersDark]);

    return { theme, setTheme };
};