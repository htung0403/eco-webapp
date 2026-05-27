import { createContext } from 'react';
import type { Theme } from './theme-options';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  font: string;
  setFont: (font: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
