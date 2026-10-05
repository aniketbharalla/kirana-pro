import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeFirebase } from '@kirana-pro/shared';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#10B981',
    secondary: '#059669',
    background: '#F8FAFC',
    surface: '#FFFFFF',
  },
};

export default function App() {
  useEffect(() => {
    try {
      initializeFirebase();
    } catch (e) {
      console.warn('Firebase init warning:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
