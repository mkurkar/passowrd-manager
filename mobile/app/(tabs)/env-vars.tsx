import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEnvVars } from '@/hooks/useEnvVars';
import { createThemedStyles, getThemeColors, spacing } from '@/lib/theme';
import type { EnvironmentVariable, EnvVarForm, EnvironmentType } from '@/types';
import { ENVIRONMENT_OPTIONS } from '@/types';

export default function EnvVarsScreen() {
  const { envVars, isLoading, addEnvVar, updateEnvVar, deleteEnvVar, getEnvVarsByProject } = useEnvVars();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createThemedStyles(isDark);
  const colors = getThemeColors(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnvVar, setEditingEnvVar] = useState<EnvironmentVariable | null>(null);
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
  const [filterEnvironment, setFilterEnvironment] = useState<EnvironmentType | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState<EnvVarForm>({
    name: '',
    value: '',
    environment: 'development',
    project: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedEnvVars = getEnvVarsByProject();
  
  const filteredEnvVars = envVars.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.project?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnvironment === 'all' || v.environment === filterEnvironment;
    return matchesSearch && matchesEnv;
  });

  const handleCopy = async (text: string, fieldId: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openModal = (envVar?: EnvironmentVariable) => {
    if (envVar) {
      setEditingEnvVar(envVar);
      setFormData({
        name: envVar.name,
        value: envVar.value,
        environment: envVar.environment,
        project: envVar.project || '',
        description: envVar.description || '',
      });
    } else {
      setEditingEnvVar(null);
      setFormData({
        name: '',
        value: '',
        environment: 'development',
        project: '',
        description: '',
      });
    }
    setFormError('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.value) {
      setFormError('Name and value are required');
      return;
    }

    // Validate variable name format
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(formData.name)) {
      setFormError('Variable name must be uppercase with underscores only');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        name: formData.name.toUpperCase(),
      };
      
      if (editingEnvVar) {
        await updateEnvVar(editingEnvVar.id, dataToSubmit);
      } else {
        await addEnvVar(dataToSubmit);
      }
      setModalVisible(false);
    } catch (err) {
      setFormError('Failed to save environment variable');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Environment Variable',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEnvVar(id),
        },
      ]
    );
  };

  const toggleProject = (project: string) => {
    setExpandedProjects((prev) => ({ ...prev, [project]: !prev[project] }));
  };

  const getEnvBadgeStyle = (env: string) => {
    switch (env) {
      case 'production':
        return { container: styles.badgeDestructive, text: styles.badgeDestructiveText };
      case 'staging':
        return {
          container: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
          text: { color: '#b45309' },
        };
      case 'all':
        return styles.badgePrimary;
      default:
        return { container: styles.badgePrimary, text: styles.badgePrimaryText };
    }
  };

  const renderEnvVarItem = (item: EnvironmentVariable) => {
    const badgeStyle = getEnvBadgeStyle(item.environment);
    
    return (
      <View key={item.id} style={[styles.card, { marginBottom: spacing[2] }]}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={[styles.row, styles.spaceBetween]}>
            <View style={styles.flex1}>
              <View style={[styles.row, { gap: spacing[2], flexWrap: 'wrap' }]}>
                <Text style={[styles.monoText, { fontWeight: '700' }]}>{item.name}</Text>
                <View style={[styles.badge, badgeStyle.container || badgeStyle]}>
                  <Text style={[styles.badgeText, badgeStyle.text || {}]}>{item.environment}</Text>
                </View>
              </View>
              {item.description && (
                <Text style={[styles.bodyText, { marginTop: 4 }]}>{item.description}</Text>
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

          {/* Value Row */}
          <View style={[styles.passwordContainer, { marginTop: spacing[2] }]}>
            <Text style={styles.passwordText} numberOfLines={1}>
              {showValues[item.id] ? item.value : '••••••••••••'}
            </Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowValues((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
            >
              <Ionicons
                name={showValues[item.id] ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleCopy(item.value, item.id)}
            >
              <Ionicons
                name={copiedField === item.id ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copiedField === item.id ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={styles.primaryButtonText}>Add Variable</Text>
        </TouchableOpacity>

        {/* Search */}
        <View style={[styles.searchContainer, { marginTop: spacing[4] }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search variables..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Environment Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing[3] }}
        >
          <View style={[styles.row, { gap: spacing[2] }]}>
            {ENVIRONMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.badge,
                  filterEnvironment === option.value ? styles.badgePrimary : styles.badgeNeutral,
                  { paddingVertical: spacing[1.5], paddingHorizontal: spacing[3] },
                ]}
                onPress={() => setFilterEnvironment(option.value)}
              >
                <Text
                  style={[
                    styles.badgeText,
                    filterEnvironment === option.value ? styles.badgePrimaryText : styles.badgeNeutralText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Env Var List */}
      {filteredEnvVars.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="code-slash-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyStateTitle}>No Environment Variables</Text>
          <Text style={styles.emptyStateDescription}>
            Add your first environment variable to securely store configuration
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openModal()}>
            <Ionicons name="add" size={20} color={colors.primaryForeground} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Add Variable</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEnvVars}
          renderItem={({ item }) => renderEnvVarItem(item)}
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
                {editingEnvVar ? 'Edit Variable' : 'Add Variable'}
              </Text>
              <Text style={styles.bodyText}>
                {editingEnvVar ? 'Update the details below' : 'Fill in the variable details'}
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
                <Text style={styles.label}>Variable Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DATABASE_URL"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.name}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text.toUpperCase() }))}
                  autoCapitalize="characters"
                />
              </View>

              <View>
                <Text style={styles.label}>Value *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Variable value..."
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.value}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, value: text }))}
                  multiline
                />
              </View>

              <View>
                <Text style={styles.label}>Environment *</Text>
                <View style={[styles.row, { gap: spacing[2], flexWrap: 'wrap' }]}>
                  {ENVIRONMENT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.badge,
                        formData.environment === option.value ? styles.badgePrimary : styles.badgeNeutral,
                        { paddingVertical: spacing[2], paddingHorizontal: spacing[3] },
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, environment: option.value }))}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          formData.environment === option.value
                            ? styles.badgePrimaryText
                            : styles.badgeNeutralText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={styles.label}>Project (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., my-app"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.project}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, project: text }))}
                />
              </View>

              <View>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="What is this variable for?"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={2}
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
                {isSubmitting ? 'Saving...' : editingEnvVar ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
