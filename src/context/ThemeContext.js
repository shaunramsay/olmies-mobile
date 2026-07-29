import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightThemeColors, darkThemeColors } from '../utils/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Light is the default; dark stays opt-in via the toggle

  // Optionally, you can sync with system settings later:
  // useEffect(() => { setIsDarkTheme(systemColorScheme === 'dark'); }, [systemColorScheme]);

  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  const colors = isDarkTheme ? darkThemeColors : lightThemeColors;

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
