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
import { styles } from './LoginScreen.styles';

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
