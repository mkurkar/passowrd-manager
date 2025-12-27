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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { createThemedStyles, getThemeColors } from '@/lib/theme';

export default function UnlockScreen() {
  const { unlock, logout, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createThemedStyles(isDark);
  const colors = getThemeColors(isDark);

  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check if this is first time setup by trying to unlock with empty password
  // (which will fail if there's an existing master password)

  const handleUnlock = async () => {
    if (!masterPassword) {
      setError('Please enter your master password');
      return;
    }

    if (isFirstTime && masterPassword !== confirmMasterPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isFirstTime && masterPassword.length < 8) {
      setError('Master password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await unlock(masterPassword);
      if (success) {
        router.replace('/(tabs)/passwords');
      } else {
        setError('Incorrect master password');
      }
    } catch (err) {
      setError('Failed to unlock vault');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
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
            <Ionicons name="lock-closed" size={48} color={colors.primaryForeground} />
          </View>
          <Text style={styles.heading1}>
            {isFirstTime ? 'Set Master Password' : 'Unlock Vault'}
          </Text>
          {user && (
            <Text style={[styles.bodyText, { marginTop: 8, textAlign: 'center' }]}>
              {user.email}
            </Text>
          )}
          <Text style={[styles.bodyText, { marginTop: 8, textAlign: 'center' }]}>
            {isFirstTime
              ? 'Create a master password to encrypt your vault. This password cannot be recovered!'
              : 'Enter your master password to access your encrypted vault'}
          </Text>
        </View>

        {/* First Time Toggle */}
        {!isFirstTime && (
          <TouchableOpacity
            style={{ marginBottom: 16, alignItems: 'center' }}
            onPress={() => setIsFirstTime(true)}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              First time? Set up your master password
            </Text>
          </TouchableOpacity>
        )}

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
            <Text style={styles.label}>
              {isFirstTime ? 'Create Master Password' : 'Master Password'}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={isFirstTime ? 'Create a strong password' : 'Enter master password'}
                placeholderTextColor={colors.mutedForeground}
                value={masterPassword}
                onChangeText={setMasterPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus
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

          {isFirstTime && (
            <View>
              <Text style={styles.label}>Confirm Master Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter master password"
                placeholderTextColor={colors.mutedForeground}
                value={confirmMasterPassword}
                onChangeText={setConfirmMasterPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
            onPress={handleUnlock}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="lock-open-outline" size={20} color={colors.primaryForeground} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Unlocking...' : isFirstTime ? 'Set Password & Unlock' : 'Unlock'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.foreground} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        {isFirstTime && (
          <View
            style={{
              marginTop: 32,
              padding: 16,
              backgroundColor: `${colors.destructive}10`,
              borderWidth: 2,
              borderColor: colors.destructive,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="warning-outline" size={20} color={colors.destructive} />
              <Text
                style={{
                  marginLeft: 8,
                  fontWeight: '700',
                  color: colors.destructive,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Important
              </Text>
            </View>
            <Text style={{ color: colors.destructive, fontSize: 12, lineHeight: 18 }}>
              Your master password is used to encrypt all your data. If you forget it, there is no way to recover your data. Please store it safely.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
