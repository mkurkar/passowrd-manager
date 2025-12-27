import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createThemedStyles, getThemeColors, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbase';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createThemedStyles(isDark);
  const colors = getThemeColors(isDark);
  const { user, lock, logout } = useAuth();

  const handleLock = () => {
    Alert.alert(
      'Lock Vault',
      'Are you sure you want to lock the vault? You will need to enter your master password to unlock.',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'LOCK', onPress: lock },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear all local data.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'LOGOUT',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://github.com/your-repo/securevault');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* User Info Section */}
          <View style={[styles.card, { marginBottom: spacing[4] }]}>
            <View style={styles.cardContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={28} color={colors.primaryForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heading2, { marginBottom: spacing[1] }]}>
                    {user?.name || 'USER'}
                  </Text>
                  <Text style={styles.bodyText}>{user?.email}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Security Section */}
          <Text style={[styles.label, { marginBottom: spacing[2], marginLeft: spacing[1] }]}>
            SECURITY
          </Text>
          <View style={[styles.card, { marginBottom: spacing[4] }]}>
            <TouchableOpacity
              style={[
                styles.cardContent,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={handleLock}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                <Text style={[styles.bodyText, { color: colors.foreground }]}>LOCK VAULT</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cardContent,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
              onPress={handleLogout}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Ionicons name="log-out" size={20} color={colors.destructive} />
                <Text style={[styles.bodyText, { color: colors.destructive }]}>LOGOUT</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Server Info Section */}
          <Text style={[styles.label, { marginBottom: spacing[2], marginLeft: spacing[1] }]}>
            SERVER
          </Text>
          <View style={[styles.card, { marginBottom: spacing[4] }]}>
            <View style={styles.cardContent}>
              <Text style={styles.label}>CONNECTED TO</Text>
              <Text style={[styles.monoText, { fontSize: 12 }]}>{pb.baseUrl}</Text>
            </View>
          </View>

          {/* About Section */}
          <Text style={[styles.label, { marginBottom: spacing[2], marginLeft: spacing[1] }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { marginBottom: spacing[4] }]}>
            <View
              style={[
                styles.cardContent,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={styles.label}>VERSION</Text>
              <Text style={styles.bodyText}>1.0.0</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.cardContent,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
              onPress={handleOpenDocs}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                <Ionicons name="document-text" size={20} color={colors.mutedForeground} />
                <Text style={[styles.bodyText, { color: colors.foreground }]}>DOCUMENTATION</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: `${colors.primary}10`,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.bodyText,
                      { color: colors.primary, fontWeight: '700', marginBottom: spacing[1] },
                    ]}
                  >
                    END-TO-END ENCRYPTED
                  </Text>
                  <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
                    All your data is encrypted on your device before being stored. Only you can
                    access your passwords and secrets with your master password.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: spacing[8], marginBottom: spacing[4] }}>
            <Text style={[styles.bodyText, { fontSize: 10, textTransform: 'uppercase' }]}>
              SECUREVAULT
            </Text>
            <Text style={[styles.bodyText, { fontSize: 10, marginTop: spacing[1] }]}>
              Built with security in mind
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
