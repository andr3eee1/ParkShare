import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryText} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.logo}>ParkShare</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={20} color={tokens.colors.primaryText} />
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

          <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 48,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 24,
  },
  logo: {
    fontFamily: tokens.typography.heading,
    fontSize: 40,
    color: tokens.colors.primaryText,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 18,
    color: tokens.colors.secondaryText,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: tokens.typography.body,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  formGroup: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    marginBottom: 8,
    color: tokens.colors.primaryText,
  },
  input: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontFamily: tokens.typography.body,
    fontSize: 16,
  },
  button: {
    backgroundColor: tokens.colors.primaryText,
    padding: 16,
    borderRadius: 8,
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
    marginTop: 32,
  },
  footerText: {
    fontFamily: tokens.typography.body,
    color: tokens.colors.secondaryText,
  },
  footerLink: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  }
});
