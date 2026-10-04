import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

export const PersonalInformationScreen = () => {
  const navigation = useNavigation();
  const { user, token, updateUser } = useContext(AuthContext);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingAvatar(true);
    setError('');
    
    try {
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('avatar', { uri, name: filename, type } as any);

      const res = await fetch('http://pana.com.ro:8745/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setAvatarUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      setError('First and last name are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('http://pana.com.ro:8745/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName, avatarUrl })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (Array.isArray(data.error)) {
           throw new Error(data.error.map((e: any) => e.message).join(', '));
        }
        throw new Error(data.error || 'Failed to update profile');
      }

      await updateUser(data.user);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={20} color={tokens.colors.primaryText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#047857" />
              <Text style={styles.successText}>Profile updated successfully!</Text>
            </View>
          ) : null}


          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: tokens.colors.primaryText, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16 }}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontFamily: tokens.typography.heading, fontSize: 36, color: tokens.colors.white }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={pickImage} 
              disabled={uploadingAvatar}
              style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            >
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={tokens.colors.primaryText} />
              ) : (
                <Text style={{ fontFamily: tokens.typography.body, fontWeight: '600', color: tokens.colors.primaryText }}>Change Photo</Text>
              )}
            </TouchableOpacity>
          </View>


          <View style={styles.formGroup}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              placeholderTextColor={tokens.colors.secondaryText}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor={tokens.colors.secondaryText}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.helperText}>Email address cannot be changed currently.</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={tokens.colors.white} />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    color: tokens.colors.primaryText,
  },
  content: {
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  successText: {
    fontFamily: tokens.typography.body,
    color: '#047857',
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
    color: tokens.colors.primaryText,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: tokens.colors.secondaryText,
  },
  helperText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginTop: 6,
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
});
