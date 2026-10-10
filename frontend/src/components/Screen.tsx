import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { BrandGradient } from './Brand';
import { styles } from './Screen.styles';

/**
 * Shared screen scaffold so every pushed screen shares the same look:
 * pale background, centered max-width content column, iOS/Android keyboard
 * handling, and a consistent top safe-area inset.
 */
interface ScreenProps {
  children: React.ReactNode;
  /** Wrap the scroll content in a KeyboardAvoidingView (use for forms). */
  keyboardAvoiding?: boolean;
  /** Content column max width. Use a larger value for dashboard-style pages. */
  maxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  keyboardAvoiding = false,
  maxWidth = 640,
  contentStyle,
  style,
}) => {
  const body = (
    <ScrollView
      contentContainerStyle={[styles.content, { maxWidth }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
};

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Hide the back button (e.g. tab roots). Defaults to showing it. */
  showBack?: boolean;
  /** Custom back handler. Defaults to navigation.goBack(). */
  onBack?: () => void;
  /** Optional element rendered on the right side of the header row. */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `gradient` (default) is the branded green header card; `plain` is the neutral row. */
  variant?: 'gradient' | 'plain';
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  showBack = true,
  onBack,
  right,
  style,
  variant = 'gradient',
}) => {
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());
  const onGradient = variant === 'gradient';

  const body = (
    <>
      {showBack && (
        <TouchableOpacity
          style={[styles.backButton, onGradient && styles.backButtonOnGradient]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color={onGradient ? tokens.colors.white : tokens.colors.primaryText}
          />
        </TouchableOpacity>
      )}
      <View style={styles.headerCopy}>
        {!!eyebrow && <Text style={[styles.eyebrow, onGradient && styles.eyebrowOnGradient]}>{eyebrow}</Text>}
        <Text style={[styles.screenTitle, onGradient && styles.titleOnGradient]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, onGradient && styles.subtitleOnGradient]}>{subtitle}</Text>}
      </View>
      {right}
    </>
  );

  if (!onGradient) {
    return <View style={[styles.header, style]}>{body}</View>;
  }

  return (
    <BrandGradient style={[styles.header, styles.headerGradient, style]}>
      <View pointerEvents="none" style={styles.headerSheen} />
      {body}
    </BrandGradient>
  );
};
