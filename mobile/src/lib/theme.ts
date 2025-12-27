import { StyleSheet } from 'react-native';

/**
 * SecureVault Design System for React Native
 * Based on the web app design-system.md
 * 
 * Design Philosophy:
 * - Boxy/Industrial: Zero border radius for a sharp, modern look
 * - High Contrast: Dark green primary color for strong visual hierarchy
 * - Uppercase Labels: All labels and buttons use uppercase text
 */

// Color palette
export const colors = {
  // Light mode
  light: {
    primary: '#0d1f14',           // Dark forest green - main actions (hsl 142 40% 10%)
    primaryForeground: '#fafafa', // White text on primary
    background: '#ffffff',        // Pure white background
    foreground: '#0a0a0a',        // Near-black text
    card: '#ffffff',              // White cards
    cardForeground: '#0a0a0a',
    muted: '#f4f4f5',             // Light gray for backgrounds
    mutedForeground: '#71717a',   // Gray text
    border: '#e4e4e7',            // Light gray borders
    input: '#e4e4e7',
    destructive: '#ef4444',       // Red for delete/danger
    destructiveForeground: '#fafafa',
  },
  // Dark mode
  dark: {
    primary: '#22c55e',           // Bright green for visibility (hsl 142 70% 50%)
    primaryForeground: '#0a0a0a',
    background: '#0a0a0a',        // Near-black background
    foreground: '#fafafa',
    card: '#121212',              // Slightly lighter cards
    cardForeground: '#fafafa',
    muted: '#262626',             // Dark gray backgrounds
    mutedForeground: '#a1a1aa',
    border: '#27272a',
    input: '#27272a',
    destructive: '#ef4444',
    destructiveForeground: '#fafafa',
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'monospace',
  },
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
  },
  letterSpacing: {
    normal: 0,
    wide: 1,
    wider: 2,
  },
};

// Spacing
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
};

// Create theme-aware styles
export const createThemedStyles = (isDark: boolean) => {
  const theme = isDark ? colors.dark : colors.light;

  return StyleSheet.create({
    // Containers
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing[4],
    },

    // Cards
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: spacing[3],
    },
    cardContent: {
      padding: spacing[4],
    },

    // Typography
    heading1: {
      fontSize: typography.sizes['2xl'],
      fontWeight: '700',
      color: theme.foreground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },
    heading2: {
      fontSize: typography.sizes.lg,
      fontWeight: '700',
      color: theme.foreground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },
    label: {
      fontSize: typography.sizes.xs,
      fontWeight: '700',
      color: theme.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wider,
      marginBottom: spacing[1.5],
    },
    bodyText: {
      fontSize: typography.sizes.sm,
      color: theme.mutedForeground,
    },
    monoText: {
      fontFamily: typography.fontFamily.mono,
      fontSize: typography.sizes.sm,
      color: theme.foreground,
    },

    // Buttons
    primaryButton: {
      backgroundColor: theme.primary,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: '700',
      color: theme.primaryForeground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },
    secondaryButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.input,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: '700',
      color: theme.foreground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },
    iconButton: {
      padding: spacing[2],
    },
    destructiveButton: {
      backgroundColor: theme.destructive,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    destructiveButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: '700',
      color: theme.destructiveForeground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },

    // Inputs
    input: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.input,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      fontSize: typography.sizes.base,
      color: theme.foreground,
    },
    inputFocused: {
      borderColor: theme.primary,
    },
    inputError: {
      borderColor: theme.destructive,
    },
    textArea: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.input,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing[4],
      fontSize: typography.sizes.base,
      color: theme.foreground,
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.input,
      paddingHorizontal: spacing[4],
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing[2.5],
      paddingLeft: spacing[2],
      fontSize: typography.sizes.base,
      color: theme.foreground,
    },
    searchIcon: {
      color: theme.mutedForeground,
    },

    // Badges
    badge: {
      paddingVertical: spacing[0.5],
      paddingHorizontal: spacing[2],
      borderWidth: 1,
    },
    badgeText: {
      fontSize: typography.sizes.xs,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wider,
    },
    badgePrimary: {
      backgroundColor: `${theme.primary}20`,
      borderColor: theme.primary,
    },
    badgePrimaryText: {
      color: theme.primary,
    },
    badgeNeutral: {
      backgroundColor: theme.muted,
      borderColor: theme.border,
    },
    badgeNeutralText: {
      color: theme.mutedForeground,
    },
    badgeDestructive: {
      backgroundColor: `${theme.destructive}20`,
      borderColor: theme.destructive,
    },
    badgeDestructiveText: {
      color: theme.destructive,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4],
    },
    modalContent: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      width: '100%',
      maxWidth: 400,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing[6],
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalBody: {
      padding: spacing[6],
    },
    modalFooter: {
      flexDirection: 'row',
      gap: spacing[3],
      padding: spacing[6],
      paddingTop: 0,
    },

    // Error/Alert
    errorContainer: {
      padding: spacing[4],
      backgroundColor: `${theme.destructive}20`,
      borderWidth: 2,
      borderColor: theme.destructive,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    errorText: {
      fontSize: typography.sizes.sm,
      color: theme.destructive,
      flex: 1,
    },
    successContainer: {
      padding: spacing[4],
      backgroundColor: `${theme.primary}20`,
      borderWidth: 2,
      borderColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    successText: {
      fontSize: typography.sizes.sm,
      color: theme.primary,
      flex: 1,
    },

    // Empty state
    emptyState: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing[12],
      alignItems: 'center',
    },
    emptyStateIcon: {
      backgroundColor: theme.muted,
      padding: spacing[4],
      marginBottom: spacing[4],
    },
    emptyStateTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: '700',
      color: theme.foreground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
      marginBottom: spacing[2],
    },
    emptyStateDescription: {
      fontSize: typography.sizes.sm,
      color: theme.mutedForeground,
      textAlign: 'center',
      marginBottom: spacing[6],
      maxWidth: 280,
    },

    // Password display
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.muted,
      borderWidth: 2,
      borderColor: theme.border,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    passwordText: {
      flex: 1,
      fontFamily: typography.fontFamily.mono,
      fontSize: typography.sizes.sm,
      color: theme.foreground,
    },

    // TOTP display
    totpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.primary}10`,
      borderWidth: 2,
      borderColor: theme.primary,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      gap: spacing[2],
    },
    totpCode: {
      fontFamily: typography.fontFamily.mono,
      fontSize: typography.sizes.lg,
      fontWeight: '700',
      color: theme.primary,
    },
    totpProgress: {
      width: 32,
      height: 4,
      backgroundColor: `${theme.primary}30`,
    },
    totpProgressFill: {
      height: '100%',
      backgroundColor: theme.primary,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: theme.border,
    },

    // Row
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spaceBetween: {
      justifyContent: 'space-between',
    },

    // Flex
    flex1: {
      flex: 1,
    },

    // Tab bar
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.muted,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabItem: {
      flex: 1,
      paddingVertical: spacing[2.5],
      alignItems: 'center',
    },
    tabItemActive: {
      backgroundColor: theme.primary,
    },
    tabItemText: {
      fontSize: typography.sizes.sm,
      fontWeight: '700',
      color: theme.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
    },
    tabItemTextActive: {
      color: theme.primaryForeground,
    },
  });
};

// Helper function to get colors
export const getThemeColors = (isDark: boolean) => {
  return isDark ? colors.dark : colors.light;
};
