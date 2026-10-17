import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { tokens } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormInput } from '../components/FormInput';
import { GlassPanel } from '../components/GlassPanel';
import { BrandGradient } from '../components/Brand';
import { styles } from './LoginScreen.styles';

const loginSchema = z.object({
  email: z.string().email('Te rugăm să introduci o adresă de email validă'),
  password: z.string().min(1, 'Parola este obligatorie'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  // 2FA login state
  const [is2FA, setIs2FA] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      const res = await apiClient.post('/auth/login', {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (res.data.require2FA) {
        setPendingEmail(data.email.trim().toLowerCase());
        setIs2FA(true);
        setTwoFaCode('');
        return;
      }

      await login(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Conectarea a eșuat');
    }
  };

  const handleVerify2FALogin = async () => {
    if (!twoFaCode || twoFaCode.length !== 6) {
      setError('Introdu codul de securitate de 6 cifre primit pe email.');
      return;
    }

    setTwoFaLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login-2fa', {
        email: pendingEmail,
        code: twoFaCode.trim(),
      });

      await login(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Codul 2FA este invalid sau a expirat.');
    } finally {
      setTwoFaLoading(false);
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
              <Text style={styles.subtitle}>Park smarter. Share more.</Text>
            </View>

            <GlassPanel style={styles.card} borderRadius={24} intensity={40} overlayColor="rgba(255, 255, 255, 0.97)">
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={20} color="#991B1B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {!is2FA ? (
                <>
                  <FormInput
                    control={control}
                    name="email"
                    label="Adresă de Email"
                    placeholder="nume@exemplu.ro"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <FormInput
                    control={control}
                    name="password"
                    label="Parolă"
                    placeholder="••••••••"
                    secureTextEntry
                    onSubmitEditing={handleSubmit(onSubmit)}
                    returnKeyType="go"
                  />

                  {/* Forgot Password link */}
                  <View style={styles.forgotPasswordRow}>
                    <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
                      <Text style={styles.forgotPasswordText}>Ai uitat parola?</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    activeOpacity={0.9}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={tokens.colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Conectare</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                /* 2FA Challenge Box */
                <View style={styles.otpBox}>
                  <Text style={styles.otpTitle}>Autentificare în Doi Pași (2FA)</Text>
                  <Text style={styles.otpDesc}>
                    Am trimis un cod de verificare de 6 cifre pe adresa <Text style={{ fontWeight: '700', color: tokens.colors.primaryText }}>{pendingEmail}</Text>. Introdu-l mai jos pentru conectare:
                  </Text>

                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor={tokens.colors.slate}
                    value={twoFaCode}
                    onChangeText={setTwoFaCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleVerify2FALogin}
                    disabled={twoFaLoading}
                    activeOpacity={0.9}
                  >
                    {twoFaLoading ? (
                      <ActivityIndicator color={tokens.colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Verifică & Conectare</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setIs2FA(false);
                      setTwoFaCode('');
                      setError('');
                    }}
                  >
                    <Text style={styles.cancelBtnText}>← Înapoi la introducere parolă</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Nu ai un cont încă? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Înregistrează-te</Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
