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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
          // Use system preference as default
          const defaultMode = systemColorScheme === 'dark';
          setUserPreference(null);
          setIsDarkMode(defaultMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
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

      // Update state immediately
      setIsDarkMode(newMode);
      setUserPreference(newMode ? 'dark' : 'light');

      // Save to AsyncStorage
      await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Revert on error
      setIsDarkMode(!newMode);
    }
  };

  // Color palette — based on the app icon's deep navy/violet/indigo space theme
  const colors = {
    // Light mode — airy, lavender-tinted, navy text
    light: {
      background: '#FFFFFF',
      backgroundSecondary: '#F8FAFC',
      surfacePrimary: '#F5F5FF',    // Subtle lavender tint
      surfaceSecondary: '#EDEDFF',  // Soft lavender surface
      border: '#D4D4F2',            // Lavender border
      text: '#12124A',              // Deep navy (icon dark tone)
      textSecondary: '#4A4A80',     // Mid navy-purple
      textTertiary: '#8888B0',      // Muted purple-gray
      accent: '#6366F1',            // Indigo — matches icon glow
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      // Card/Container backgrounds
      cardBackground: '#FFFFFF',
      cardBorder: '#E5E7EB',
      // Input backgrounds
      inputBackground: '#F3F4F6',
      inputBorder: '#D1D5DB',
      // Shadow color (adapts with opacity in styles)
      shadowColor: '#000000',
      // Mood backgrounds
      moodBgGood: '#ECFDF5',
      moodBgOkay: '#EFF6FF',
      moodBgLow: '#FFFBEB',
      moodBgStressed: '#FEE2E2',
    },
    // Dark mode — deep space navy/violet, matches icon gradient
    dark: {
      background: '#0D0D2B',        // Deep navy (icon top-left)
      backgroundSecondary: '#1E293B',
      surfacePrimary: '#17173A',    // Slightly lighter navy
      surfaceSecondary: '#22224E',  // Card/surface navy
      border: '#35357A',            // Subtle navy-purple border
      text: '#FFFFFF',              // Pure white
      textSecondary: '#A8B0D8',     // Blue-tinted secondary (dim glow)
      textTertiary: '#6B74A0',      // Muted indigo-gray
      accent: '#7C7FFF',            // Bright indigo-violet (icon glow)
      success: '#30D158',           // iOS green
      warning: '#FF9F0A',           // iOS orange
      danger: '#FF453A',            // iOS red
      info: '#7C7FFF',              // Same as accent
      // Card/Container backgrounds
      cardBackground: '#17173A',
      cardBorder: '#334155',
      // Input backgrounds
      inputBackground: '#0F172A',
      inputBorder: '#475569',
      // Shadow color (adapts with opacity in styles)
      shadowColor: '#000000',
      // Mood backgrounds
      moodBgGood: '#064E3B',
      moodBgOkay: '#0C4A6E',
      moodBgLow: '#422006',
      moodBgStressed: '#7F1D1D',
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
