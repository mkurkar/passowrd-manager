import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { createThemedStyles, getThemeColors } from '@/lib/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createThemedStyles(isDark);
  const colors = getThemeColors(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/(auth)/unlock');
    } catch (err) {
      setError('Invalid email or password');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Header */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Ionicons name="shield-checkmark" size={48} color={colors.primaryForeground} />
          </View>
          <Text style={styles.heading1}>SecureVault</Text>
          <Text style={[styles.bodyText, { marginTop: 8, textAlign: 'center' }]}>
            Sign in to access your encrypted vault
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={[styles.errorContainer, { marginBottom: 16 }]}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.destructive }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={{ gap: 20 }}>
          <View>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text style={styles.label}>Password</Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.secondaryButton, { marginLeft: 8 }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={styles.bodyText}>Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={{ marginTop: 8 }}>
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
