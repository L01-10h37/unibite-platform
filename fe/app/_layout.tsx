import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Text, TextInput } from 'react-native';
import 'react-native-reanimated';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });
  const hasAppliedFontDefaultsRef = useRef(false);

  useEffect(() => {
    if (!fontsLoaded || hasAppliedFontDefaultsRef.current) {
      return;
    }

    const TextWithDefaultProps = Text as typeof Text & {
      defaultProps?: { style?: unknown };
    };
    const TextInputWithDefaultProps = TextInput as typeof TextInput & {
      defaultProps?: { style?: unknown };
    };

    const existingTextStyle = TextWithDefaultProps.defaultProps?.style;
    const existingTextInputStyle = TextInputWithDefaultProps.defaultProps?.style;

    TextWithDefaultProps.defaultProps = {
      ...TextWithDefaultProps.defaultProps,
      style: [{ fontFamily: 'Montserrat-Regular' }, existingTextStyle],
    };

    TextInputWithDefaultProps.defaultProps = {
      ...TextInputWithDefaultProps.defaultProps,
      style: [{ fontFamily: 'Montserrat-Regular' }, existingTextInputStyle],
    };

    hasAppliedFontDefaultsRef.current = true;
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
