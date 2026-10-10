import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { BrandGradient } from './Brand';

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paleMapBackground },
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 48,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 20,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: tokens.colors.panelSurface,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
    ...tokens.shadows.soft,
  },
  backButtonOnGradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerGradient: {
    borderRadius: tokens.radii.upperSheet,
    overflow: 'hidden',
    padding: 18,
    ...tokens.shadows.soft,
  },
  headerSheen: {
    position: 'absolute',
    right: -50,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: tokens.colors.municipalTeal,
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  eyebrowOnGradient: { color: 'rgba(255, 255, 255, 0.85)' },
  screenTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 30,
    marginTop: 3,
  },
  titleOnGradient: { color: tokens.colors.white },
  subtitle: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 3,
  },
  subtitleOnGradient: { color: 'rgba(255, 255, 255, 0.85)' },
});
