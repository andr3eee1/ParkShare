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
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  showBack = true,
  onBack,
  right,
  style,
}) => {
  const navigation = useNavigation<any>();
  const handleBack = onBack ?? (() => navigation.goBack());

  return (
    <View style={[styles.header, style]}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={21} color={tokens.colors.primaryText} />
        </TouchableOpacity>
      )}
      <View style={styles.headerCopy}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.screenTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
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
  headerCopy: { flex: 1 },
  eyebrow: {
    color: tokens.colors.municipalTeal,
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  screenTitle: {
    color: tokens.colors.primaryText,
    fontFamily: tokens.typography.headingBold,
    fontSize: 30,
    marginTop: 3,
  },
  subtitle: {
    color: tokens.colors.secondaryText,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    marginTop: 3,
  },
});
