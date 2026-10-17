import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { styles } from './VerifyEmailScreen.styles';

export const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateUser } = useContext(AuthContext) as any;
  const { alert } = useAlert();

  const routeParams = route.params || {};

  // Extract email & code from route params or fallback to web window.location query string
  let initialEmail = routeParams.email || user?.email || '';
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

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Auto-verify if email and code (6 chars) were provided in URL
  useEffect(() => {
    if (initialEmail && initialCode && initialCode.length === 6 && !verified && !autoVerifying) {
      executeVerification(initialEmail, initialCode);
    }
  }, []);

  const executeVerification = async (targetEmail: string, targetCode: string) => {
    setError('');
    setInfo('');
    setLoading(true);
    setAutoVerifying(true);

    try {
      const res = await apiClient.post('/auth/verify-email', {
        email: targetEmail.trim().toLowerCase(),
        code: targetCode.trim(),
      });

      setVerified(true);
      if (user) {
        if (res.data.user) {
          await updateUser(res.data.user);
        } else {
          await updateUser({ ...user, emailVerified: true });
        }
      }

      setInfo('Adresa de email a fost confirmată cu succes!');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Codul de verificare este invalid sau a expirat.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleManualVerify = () => {
    if (!email || !email.includes('@')) {
      setError('Te rugăm să introduci o adresă de email validă.');
      return;
    }
    if (!code || code.length !== 6) {
      setError('Codul de verificare trebuie să aibă exact 6 cifre.');
      return;
    }
    executeVerification(email, code);
  };

  const handleResend = async () => {
    if (!email || !email.includes('@')) {
      setError('Introdu adresa de email pentru a retrimite codul.');
      return;
    }

    setResending(true);
    setError('');
    setInfo('');

    try {
      await apiClient.post('/auth/resend-verification', {
        email: email.trim().toLowerCase(),
      });
      setInfo(`Am trimis un cod nou de verificare pe adresa ${email}.`);
      alert('Cod Trimis', `Am expediat un nou cod de 6 cifre pe ${email}.`, undefined, 'info');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Nu s-a putut retrimite codul.');
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    if (user) {
      navigation.navigate('MainApp');
    } else {
      navigation.navigate('Login');
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
              <Text style={styles.subtitle}>Verificare Securitate Cont</Text>
            </View>

            <GlassPanel style={styles.card} borderRadius={24} intensity={40} overlayColor="rgba(255, 255, 255, 0.97)">
              {verified ? (
                /* Verified Success State */
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <View style={styles.statusIconContainer}>
                    <View style={styles.iconCircleSuccess}>
                      <Ionicons name="checkmark-circle" size={44} color={tokens.colors.emerald} />
                    </View>
                  </View>

                  <Text style={styles.stepTitle}>Email Confirmat!</Text>
                  <Text style={styles.stepDesc}>
                    Adresa <Text style={{ fontWeight: '700', color: tokens.colors.primaryText }}>{email}</Text> a fost
                    confirmată cu succes. Contul tău este acum complet activat și securizat.
                  </Text>

                  <TouchableOpacity
                    style={[styles.button, { width: '100%', marginTop: 12 }]}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.buttonText}>
                      {user ? 'Continuă în Aplicație' : 'Conectează-te la Cont'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Verification Form State */
                <View>
                  <Text style={styles.stepTitle}>Confirmă adresa de email</Text>
                  <Text style={styles.stepDesc}>
                    Introdu codul de 6 cifre primit pe email pentru a-ți activa definitiv contul ParkShare.
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

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Cod de Confirmare (6 cifre)</Text>
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

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleManualVerify}
                    disabled={loading || autoVerifying}
                    activeOpacity={0.9}
                  >
                    {loading || autoVerifying ? (
                      <ActivityIndicator color={tokens.colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Confirmă Email-ul</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResend}
                    disabled={resending || loading || autoVerifying}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color={tokens.colors.emerald} />
                    ) : (
                      <Text style={styles.resendText}>Nu ai primit codul? Retrimite</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate(user ? 'MainApp' : 'Login')}>
                      <Text style={styles.footerLink}>
                        {user ? '← Înapoi la Aplicație' : '← Înapoi la Conectare'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </GlassPanel>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
