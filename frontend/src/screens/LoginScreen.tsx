import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      const res = await apiClient.post('/auth/login', { email: data.email, password: data.password });
      await login(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
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

              <FormInput
                control={control}
                name="email"
                label="Email address"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                control={control}
                name="password"
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                onSubmitEditing={handleSubmit(onSubmit)}
                returnKeyType="go"
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} activeOpacity={0.9}>
                {isSubmitting ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Create one</Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.emeraldDeep,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...tokens.shadows.soft,
  },
  logoMark: {
    width: 60,
    height: 60,
  },
  logo: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 40,
    color: tokens.colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  card: {
    padding: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: tokens.typography.body,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: tokens.colors.emerald,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.heading,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: tokens.typography.body,
    color: tokens.colors.secondaryText,
  },
  footerLink: {
    fontFamily: tokens.typography.bodySemiBold,
    color: tokens.colors.emerald,
  }
});
