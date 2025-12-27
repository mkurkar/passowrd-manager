import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { getThemeColors } from '@/lib/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="unlock" 
        options={{ 
          title: 'Unlock Vault',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
