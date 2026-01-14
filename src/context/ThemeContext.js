import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [userPreference, setUserPreference] = useState(null);

  // Load user preference from AsyncStorage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem('themePreference');
        if (saved) {
          setUserPreference(saved);
          setIsDarkMode(saved === 'dark');
        } else {
          // Use system preference
          setUserPreference(systemColorScheme);
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Update when system preference changes (if no user preference)
  useEffect(() => {
    if (!userPreference) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, userPreference]);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      setUserPreference(newMode ? 'dark' : 'light');
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Color palette
  const colors = {
    // Light mode
    light: {
      background: '#FFFFFF',
      surfacePrimary: '#F9FAFB',
      surfaceSecondary: '#F3F4F6',
      border: '#E5E7EB',
      text: '#1F2937',
      textSecondary: '#6B7280',
      textTertiary: '#9CA3AF',
      accent: '#6366F1',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },
    // Dark mode
    dark: {
      background: '#0F172A',      // Very dark blue-black
      surfacePrimary: '#1E293B',  // Dark slate
      surfaceSecondary: '#334155', // Medium dark slate
      border: '#475569',          // Medium slate
      text: '#F1F5F9',            // Near white
      textSecondary: '#CBD5E1',   // Light gray
      textTertiary: '#94A3B8',    // Medium gray
      accent: '#818CF8',          // Lighter indigo for dark mode
      success: '#34D399',         // Brighter green
      warning: '#FBBF24',         // Brighter amber
      danger: '#F87171',          // Brighter red
      info: '#60A5FA',            // Brighter blue
    },
  };

  const currentColors = isDarkMode ? colors.dark : colors.light;

  const value = {
    isDarkMode,
    toggleTheme,
    colors: currentColors,
    allColors: colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
