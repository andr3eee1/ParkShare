import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://pana.com.ro:8745/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // TODO: Save token to SecureStore/AsyncStorage
      // console.log(data.token);
      
      // Navigate to main app
      navigation.replace('MainApp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>ParkShare</Text>
          <Text style={styles.subtitle}>Welcome back</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={20} color={tokens.colors.primaryText} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={tokens.colors.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={tokens.colors.secondaryText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
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
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
