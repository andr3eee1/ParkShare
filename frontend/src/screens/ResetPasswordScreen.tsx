import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { GlassPanel } from '../components/GlassPanel';
import { BrandGradient } from '../components/Brand';
import { tokens } from '../theme/tokens';
import { useAlert } from '../context/AlertContext';
import { styles } from './ResetPasswordScreen.styles';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { alert } = useAlert();

  const routeParams = route.params || {};

  // Extract from route params or fallback to web window.location query string
  let initialEmail = routeParams.email || '';
  let initialCode = routeParams.code || '';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (!initialEmail && urlParams.get('email')) {
      initialEmail = urlParams.get('email') || '';
    }
    if (!initialCode && urlParams.get('code')) {
      initialCode = urlParams.get('code') || '';
    }
  }

  const [step, setStep] = useState<'request' | 'reset'>(initialCode ? 'reset' : 'request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (initialCode && step !== 'reset') {
      setStep('reset');
    }
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
    if (initialCode && !code) {
      setCode(initialCode);
    }
  }, [initialCode, initialEmail]);

  // Phase 1: Request Password Reset PIN
  const handleRequestPin = async () => {
    setError('');
    setInfo('');

    if (!email || !email.includes('@')) {
      setError('Te rugăm să introduci o adresă de email validă.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep('reset');
      setInfo(`Am trimis un cod de securitate de 6 cifre pe ${email}.`);
      alert(
        'Cod Trimis',
        `Am trimis un PIN de 6 cifre pe adresa ${email}. Verifică și folderul Spam dacă nu îl găsești.`,
        undefined,
        'info'
      );
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Nu s-a putut trimite codul.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Submit Reset with Code & New Password
  const handleResetPassword = async () => {
    setError('');
    setInfo('');

    if (!code || code.length !== 6) {
      setError('Introdu codul de securitate de 6 cifre primit pe email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Noua parolă trebuie să aibă minimum 6 caractere.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Parolele introduse nu coincid.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });

      alert(
        'Parolă Schimbată',
        'Parola ta a fost resetată cu succes! Te poți conecta acum cu noua parolă.',
        [
          {
            text: 'Conectare',
            onPress: () => navigation.navigate('Login'),
          },
        ],
        'success'
      );
      navigation.navigate('Login');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Codul este invalid sau a expirat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BrandGradient style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <View style={styles.logoBadge}>
                <Image source={require('../../assets/logo-mark.png')} style={styles.logoMark} resizeMode="contain" />
              </View>
              <Text style={styles.logo}>ParkShare</Text>
              <Text style={styles.subtitle}>Recuperare acces cont</Text>
            </View>

            <GlassPanel style={styles.card} borderRadius={24} intensity={40} overlayColor="rgba(255, 255, 255, 0.97)">
              <Text style={styles.stepTitle}>
                {step === 'request' ? 'Ai uitat parola?' : 'Setează o parolă nouă'}
              </Text>
              <Text style={styles.stepDesc}>
                {step === 'request'
                  ? 'Introdu adresa ta de email și îți vom trimite un cod de 6 cifre pentru resetare.'
                  : `Introdu codul primit pe ${email || 'email'} și alege o parolă nouă.`}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={18} color="#991B1B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {info ? (
                <View style={styles.successBox}>
                  <Ionicons name="information-circle" size={18} color="#065F46" />
                  <Text style={styles.successText}>{info}</Text>
                </View>
              ) : null}

              {step === 'request' ? (
                /* Phase 1: Email input */
                <View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Adresă de Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="nume@exemplu.ro"
                      placeholderTextColor={tokens.colors.slate}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleRequestPin}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={tokens.colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Trimite Cod Resetare</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Phase 2: Enter PIN & New Password */
                <View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Cod de Securitate (6 cifre)</Text>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="000000"
                      placeholderTextColor={tokens.colors.slate}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Parolă Nouă (min. 6 caractere)</Text>
                    <View style={{ position: 'relative', justifyContent: 'center' }}>
                      <TextInput
                        style={[styles.input, { paddingRight: 40 }]}
                        placeholder="••••••••"
                        placeholderTextColor={tokens.colors.slate}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        style={{ position: 'absolute', right: 12, padding: 4 }}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={tokens.colors.slate}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirmă Parola Nouă</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={tokens.colors.slate}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color={tokens.colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Salvează Parola Nouă</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleRequestPin}
                    disabled={resending || loading}
                  >
                    <Text style={styles.resendText}>Nu ai primit codul? Retrimite</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>← Înapoi la Conectare</Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
