import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { adminPost } from '../api/client';

export interface ComposeEmailModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  onSuccess?: () => void;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  visible,
  onClose,
  defaultRecipient = '',
  onSuccess,
}) => {
  const { token } = useContext(AuthContext);
  const { alert } = useAlert();

  const [to, setTo] = useState(defaultRecipient);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionText, setActionText] = useState('');
  const [showActionFields, setShowActionFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTo(defaultRecipient || '');
      setSubject('');
      setMessage('');
      setActionUrl('');
      setActionText('');
      setShowActionFields(false);
      setSubmitting(false);
    }
  }, [visible, defaultRecipient]);

  const handleSend = async () => {
    const trimmedTo = to.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTo || !trimmedTo.includes('@')) {
      alert('Invalid Email', 'Please provide a valid recipient email address.', undefined, 'error');
      return;
    }
    if (!trimmedSubject) {
      alert('Missing Subject', 'Please enter a subject line for the email.', undefined, 'error');
      return;
    }
    if (!trimmedMessage) {
      alert('Missing Message', 'Please write the message you would like to send.', undefined, 'error');
      return;
    }

    if (!token) {
      alert('Authentication Error', 'You must be signed in as an admin to send emails.', undefined, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await adminPost(token, '/admin/emails/send', {
        to: trimmedTo,
        subject: trimmedSubject,
        message: trimmedMessage,
        actionUrl: actionUrl.trim() || undefined,
        actionText: actionText.trim() || undefined,
      });

      alert('Email Sent', `Message successfully dispatched to ${trimmedTo}`, undefined, 'success');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      alert('Delivery Failed', error?.message || 'Could not send email.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={() => !submitting && onClose()} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={20} color={tokens.colors.emeraldDeep} />
              </View>
              <View>
                <Text style={styles.title}>Send Custom Email</Text>
                <Text style={styles.subtitle}>ParkShare branded communication</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => !submitting && onClose()}
              accessibilityLabel="Close"
              disabled={submitting}
            >
              <Ionicons name="close" size={18} color={tokens.colors.primaryText} />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Recipient Email</Text>
              <TextInput
                style={styles.input}
                value={to}
                onChangeText={setTo}
                placeholder="user@example.com"
                placeholderTextColor={tokens.colors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Subject Line</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Important notice regarding your ParkShare account"
                placeholderTextColor={tokens.colors.secondaryText}
                editable={!submitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Message Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message here... Paragraphs will be cleanly styled with ParkShare brand typography."
                placeholderTextColor={tokens.colors.secondaryText}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* Optional Call-to-action button */}
            <TouchableOpacity
              style={styles.actionToggle}
              onPress={() => setShowActionFields((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showActionFields ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={tokens.colors.emeraldDeep}
              />
              <Text style={styles.actionToggleText}>
                {showActionFields ? 'Hide action button' : 'Add action button (optional)'}
              </Text>
            </TouchableOpacity>

            {showActionFields && (
              <View style={styles.actionFieldsContainer}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Button Link URL</Text>
                  <TextInput
                    style={styles.input}
                    value={actionUrl}
                    onChangeText={setActionUrl}
                    placeholder="https://park-share.ro/platform"
                    placeholderTextColor={tokens.colors.secondaryText}
                    autoCapitalize="none"
                    editable={!submitting}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Button Text</Text>
                  <TextInput
                    style={styles.input}
                    value={actionText}
                    onChangeText={setActionText}
                    placeholder="View Details / Update Account"
                    placeholderTextColor={tokens.colors.secondaryText}
                    editable={!submitting}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendBtn, submitting && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={tokens.colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={16} color={tokens.colors.white} />
                  <Text style={styles.sendBtnText}>Send Email</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 38, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: tokens.colors.white,
    borderRadius: 22,
    padding: 22,
    ...tokens.shadows.soft,
    elevation: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'default' } as any) : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F5',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: tokens.colors.emeraldTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 18,
    color: tokens.colors.primaryText,
  },
  subtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  formScroll: {
    marginTop: 16,
    marginBottom: 8,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 12,
    color: tokens.colors.primaryText,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.primaryText,
    ...(Platform.OS === 'web' ? ({ cursor: 'text' } as any) : {}),
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  actionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  actionToggleText: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 13,
    color: tokens.colors.emeraldDeep,
  },
  actionFieldsContainer: {
    backgroundColor: '#F9FBFA',
    borderWidth: 1,
    borderColor: '#E1EFEA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F5',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  cancelBtnText: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 14,
    color: tokens.colors.secondaryText,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.emerald,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    fontFamily: tokens.typography.bodySemiBold,
    fontSize: 14,
    color: tokens.colors.white,
  },
});
