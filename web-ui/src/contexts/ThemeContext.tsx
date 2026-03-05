'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ThemeMode,
  Theme,
  getEffectiveTheme,
  applyTheme,
  getSystemTheme,
  lightTheme,
  darkTheme,
} from '@/styles/theme';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 服务端与首屏水合使用一致初始值，避免 SVG/主题 水合不匹配
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<Theme>(() => lightTheme);

  // 仅在客户端挂载后从 localStorage 恢复主题偏好
  useEffect(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      setModeState(stored);
    }
  }, []);

  // 应用主题
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(mode);
    const newTheme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

    setTheme(newTheme);
    applyTheme(newTheme);
  }, [mode]);

  // 监听系统主题变化
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const effectiveTheme = getEffectiveTheme('system');
      const newTheme = effectiveTheme === 'dark' ? darkTheme : lightTheme;
      setTheme(newTheme);
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // 保存主题模式到localStorage
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  }, []);

  // 切换主题（light <-> dark）
  const toggleTheme = useCallback(() => {
    const currentEffective = getEffectiveTheme(mode);
    const newMode = currentEffective === 'dark' ? 'light' : 'dark';
    setMode(newMode);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
