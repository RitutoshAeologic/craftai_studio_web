'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { theme, ThemeColorSchema, ThemePresetName, THEME_PRESETS, applyThemeToCssVariables, subscribeTheme } from '@/lib/theme/themeGuard';

interface ThemeContextValue {
  colors: ThemeColorSchema;
  preset: ThemePresetName;
  setPreset: (preset: ThemePresetName) => void;
  availablePresets: ThemePresetName[];
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: THEME_PRESETS.defaultDark,
  preset: 'defaultDark',
  setPreset: () => {},
  availablePresets: ['obsidian', 'aurora', 'defaultDark', 'cyberpunk'],
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColorSchema>(THEME_PRESETS.defaultDark);
  const [preset, setPresetState] = useState<ThemePresetName>('defaultDark');

  useEffect(() => {
    theme.init();
    setColors({ ...theme.colors });
    setPresetState(theme.preset);

    const unsubscribe = subscribeTheme((updatedColors) => {
      setColors({ ...updatedColors });
      setPresetState(theme.preset);
    });

    return () => unsubscribe();
  }, []);

  const handleSetPreset = (newPreset: ThemePresetName) => {
    theme.setPreset(newPreset);
    setPresetState(newPreset);
    setColors({ ...theme.colors });
  };

  return (
    <ThemeContext.Provider
      value={{
        colors,
        preset,
        setPreset: handleSetPreset,
        availablePresets: ['obsidian', 'aurora', 'defaultDark', 'cyberpunk'],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      colors: theme.colors,
      preset: theme.preset,
      setPreset: theme.setPreset,
      availablePresets: ['obsidian', 'aurora', 'defaultDark', 'cyberpunk'] as ThemePresetName[],
    };
  }
  return context;
}
