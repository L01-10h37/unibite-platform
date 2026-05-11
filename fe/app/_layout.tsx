import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Text, TextInput } from 'react-native';
import 'react-native-reanimated';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  // 1. Tất cả các Hook khai báo ở trên cùng
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-ExtraBold': Montserrat_800ExtraBold,
  });

  const hasAppliedFontDefaultsRef = useRef(false);

  // Hook xử lý Font
  useEffect(() => {
    if (!fontsLoaded || hasAppliedFontDefaultsRef.current) {
      return;
    }

    const TextWithDefaultProps = Text as typeof Text & { defaultProps?: { style?: unknown } };
    const TextInputWithDefaultProps = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };

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

  // Hook xử lý Auth
  useEffect(() => {
    const checkAuth = async () => {
      const tokens = await SecureStore.getItemAsync('tokens');
      if (tokens) {
        router.replace('/(tabs)');
      }
    };
    
    // Chỉ check auth khi font đã sẵn sàng để tránh tranh chấp render
    if (fontsLoaded) {
      checkAuth();
    }
  }, [fontsLoaded, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="signin" options={{ presentation: 'modal', headerShown: false, title: 'Sign In' }} />
        <Stack.Screen name="signup" options={{ presentation: 'modal', headerShown: false, title: 'Sign Up' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false, title: 'Thông tin' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
