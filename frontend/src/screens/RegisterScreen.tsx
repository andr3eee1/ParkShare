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

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError('');
    try {
      const res = await apiClient.post('/auth/register', data);
      await login(res.data.user, res.data.token);
    } catch (err: any) {
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (Array.isArray(errorData)) {
          setError(errorData.map((e: any) => e.message).join(', '));
        } else {
          setError(errorData);
        }
      } else {
        setError(err.message || 'Registration failed');
      }
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={22} color={tokens.colors.white} />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <View style={styles.logoBadge}>
                <Image source={require('../../assets/logo-mark.png')} style={styles.logoMark} resizeMode="contain" />
              </View>
              <Text style={styles.logo}>ParkShare</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            <GlassPanel style={styles.card} borderRadius={24} intensity={40} overlayColor="rgba(255, 255, 255, 0.97)">
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={20} color="#991B1B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <FormInput
                    control={control}
                    name="firstName"
                    label="First name"
                    placeholder="Jane"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <FormInput
                    control={control}
                    name="lastName"
                    label="Last name"
                    placeholder="Doe"
                  />
                </View>
              </View>

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
                placeholder="Min 6 characters"
                secureTextEntry
                onSubmitEditing={handleSubmit(onSubmit)}
                returnKeyType="go"
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} activeOpacity={0.9}>
                {isSubmitting ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign in</Text>
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
    paddingTop: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: tokens.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...tokens.shadows.soft,
  },
  logoMark: {
    width: 54,
    height: 54,
  },
  logo: {
    fontFamily: tokens.typography.headingBold,
    fontSize: 36,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
