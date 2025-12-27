import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { usePasswords } from '@/hooks/usePasswords';
import { generatePassword } from '@/lib/encryption';
import { generateTOTPCode, getTOTPRemainingTime } from '@/lib/totp';
import { createThemedStyles, getThemeColors, spacing } from '@/lib/theme';
import type { Password, PasswordForm } from '@/types';

export default function PasswordsScreen() {
  const { passwords, isLoading, addPassword, updatePassword, deletePassword } = usePasswords();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createThemedStyles(isDark);
  const colors = getThemeColors(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [totpCodes, setTotpCodes] = useState<{ [key: string]: string }>({});
  const [totpTime, setTotpTime] = useState(30);

  // Form state
  const [formData, setFormData] = useState<PasswordForm>({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '',
    totpSecret: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update TOTP codes every second
  useEffect(() => {
    const updateTotpCodes = () => {
      const codes: { [key: string]: string } = {};
      passwords.forEach((p) => {
        if (p.totpSecret) {
          codes[p.id] = generateTOTPCode(p.totpSecret);
        }
      });
      setTotpCodes(codes);
      setTotpTime(getTOTPRemainingTime());
    };

    updateTotpCodes();
    const interval = setInterval(updateTotpCodes, 1000);
    return () => clearInterval(interval);
  }, [passwords]);

  const filteredPasswords = passwords.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (text: string, fieldId: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openModal = (password?: Password) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        name: password.name,
        username: password.username,
        password: password.password,
        url: password.url || '',
        notes: password.notes || '',
        category: password.category || '',
        totpSecret: password.totpSecret || '',
      });
    } else {
      setEditingPassword(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: '',
        totpSecret: '',
      });
    }
    setFormError('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      setFormError('Name, username, and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPassword) {
        await updatePassword(editingPassword.id, formData);
      } else {
        await addPassword(formData);
      }
      setModalVisible(false);
    } catch (err) {
      setFormError('Failed to save password');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePassword(id),
        },
      ]
    );
  };

  const handleOpenUrl = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl);
  };

  const renderPasswordItem = ({ item }: { item: Password }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={[styles.row, styles.spaceBetween, { marginBottom: spacing[2] }]}>
          <View style={styles.flex1}>
            <View style={[styles.row, { gap: spacing[2], flexWrap: 'wrap' }]}>
              <Text style={styles.heading2}>{item.name}</Text>
              {item.category && (
                <View style={[styles.badge, styles.badgeNeutral]}>
                  <Text style={[styles.badgeText, styles.badgeNeutralText]}>{item.category}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.bodyText, { marginTop: 4 }]}>{item.username}</Text>
            {item.url && (
              <TouchableOpacity onPress={() => handleOpenUrl(item.url!)}>
                <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}>
                  {item.url} <Ionicons name="open-outline" size={10} />
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.row, { gap: spacing[1] }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openModal(item)}>
              <Ionicons name="pencil-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Row */}
        <View style={[styles.passwordContainer, { marginTop: spacing[2] }]}>
          <Text style={styles.passwordText}>
            {showPasswords[item.id] ? item.password : '••••••••••••'}
          </Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowPasswords((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
          >
            <Ionicons
              name={showPasswords[item.id] ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleCopy(item.password, `pwd-${item.id}`)}
          >
            <Ionicons
              name={copiedField === `pwd-${item.id}` ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copiedField === `pwd-${item.id}` ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* TOTP Row */}
        {item.totpSecret && totpCodes[item.id] && (
          <View style={[styles.totpContainer, { marginTop: spacing[2] }]}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
            <Text style={styles.totpCode}>{totpCodes[item.id]}</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleCopy(totpCodes[item.id], `totp-${item.id}`)}
            >
              <Ionicons
                name={copiedField === `totp-${item.id}` ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copiedField === `totp-${item.id}` ? colors.primary : colors.primary}
              />
            </TouchableOpacity>
            <View style={styles.totpProgress}>
              <View style={[styles.totpProgressFill, { width: `${(totpTime / 30) * 100}%` }]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={[styles.content, { paddingBottom: 0 }]}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => openModal()}>
          <Ionicons name="add" size={20} color={colors.primaryForeground} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Add Password</Text>
        </TouchableOpacity>

        {/* Search */}
        <View style={[styles.searchContainer, { marginTop: spacing[4] }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search passwords..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Password List */}
      {filteredPasswords.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="key-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyStateTitle}>No Passwords Yet</Text>
          <Text style={styles.emptyStateDescription}>
            Add your first password to start securely managing your credentials
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openModal()}>
            <Ionicons name="add" size={20} color={colors.primaryForeground} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Add Password</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPasswords}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing[4] }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Modal Header */}
          <View
            style={[
              styles.row,
              styles.spaceBetween,
              { padding: spacing[6], borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View>
              <Text style={styles.heading2}>
                {editingPassword ? 'Edit Password' : 'Add Password'}
              </Text>
              <Text style={styles.bodyText}>
                {editingPassword ? 'Update the details below' : 'Fill in the password details'}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing[6] }}>
            {formError ? (
              <View style={[styles.errorContainer, { marginBottom: spacing[4] }]}>
                <View style={{ width: 8, height: 8, backgroundColor: colors.destructive }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={{ gap: spacing[5] }}>
              <View>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., GitHub"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                />
              </View>

              <View>
                <Text style={styles.label}>Username / Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.username}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, username: text }))}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View>
                <Text style={styles.label}>Password *</Text>
                <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor={colors.mutedForeground}
                    value={formData.password}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
                  />
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                      setFormData((prev) => ({ ...prev, password: generatePassword(20) }))
                    }
                  >
                    <Ionicons name="refresh-outline" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text style={styles.label}>Website URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.url}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, url: text }))}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Work, Personal"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.category}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, category: text }))}
                />
              </View>

              <View>
                <Text style={styles.label}>TOTP Secret (for 2FA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter TOTP secret key"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.totpSecret}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, totpSecret: text }))}
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Additional notes..."
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.notes}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View
            style={[
              styles.row,
              { padding: spacing[6], gap: spacing[3], borderTopWidth: 1, borderTopColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.primaryForeground} style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Saving...' : editingPassword ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
