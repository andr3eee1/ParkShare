import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import * as ImagePicker from 'expo-image-picker';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';

export const PersonalInformationScreen = () => {
  const { user, updateUser } = useContext(AuthContext);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('avatar', blob, filename);
      } else {
        formData.append('avatar', { uri, name: filename, type } as any);
      }

      const res = await apiClient.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAvatarUrl(res.data.url);

      // Auto-save the new avatar URL to the profile
      const profileRes = await apiClient.put('/auth/profile', { firstName, lastName, avatarUrl: res.data.url });
      await updateUser(profileRes.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
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
      const res = await apiClient.put('/auth/profile', { firstName, lastName, avatarUrl });
      await updateUser(res.data.user);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (Array.isArray(errorData)) {
          setError(errorData.map((e: any) => e.message).join(', '));
        } else {
          setError(errorData);
        }
      } else {
        setError(err.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboardAvoiding>
      <ScreenHeader title="Personal Information" subtitle="Your name, photo, and contact" />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning" size={20} color="#991B1B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color="#047857" />
          <Text style={styles.successText}>Profile updated successfully!</Text>
        </View>
      ) : null}

      <View style={styles.avatarBlock}>
        <View style={styles.avatarCircle}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={pickImage} disabled={uploadingAvatar} style={styles.changePhotoButton}>
          {uploadingAvatar ? (
            <ActivityIndicator size="small" color={tokens.colors.primaryText} />
          ) : (
            <Text style={styles.changePhotoText}>Change Photo</Text>
          )}
        </TouchableOpacity>
      </View>

      <GlassPanel style={styles.card} borderRadius={18} intensity={40} overlayColor={tokens.colors.panelSurface}>
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

        <View style={[styles.formGroup, styles.lastGroup]}>
          <Text style={styles.label}>Email address</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={user?.email || ''} editable={false} />
          <Text style={styles.helperText}>Email address cannot be changed currently.</Text>
        </View>
      </GlassPanel>

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: tokens.typography.body, color: '#991B1B', marginLeft: 8, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: { fontFamily: tokens.typography.body, color: '#047857', marginLeft: 8, flex: 1 },
  avatarBlock: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tokens.colors.primaryText,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
    ...tokens.shadows.soft,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontFamily: tokens.typography.heading, fontSize: 34, color: tokens.colors.white },
  changePhotoButton: {
    backgroundColor: tokens.colors.panelSurface,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: tokens.radii.pill,
    ...tokens.shadows.soft,
  },
  changePhotoText: { fontFamily: tokens.typography.bodySemiBold, color: tokens.colors.primaryText, fontSize: 13 },
  card: { padding: 18 },
  formGroup: { marginBottom: 18 },
  lastGroup: { marginBottom: 0 },
  label: { fontFamily: tokens.typography.bodySemiBold, fontSize: 13, marginBottom: 8, color: tokens.colors.primaryText },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: tokens.colors.primaryText,
  },
  disabledInput: { backgroundColor: '#F3F4F6', color: tokens.colors.secondaryText },
  helperText: { fontFamily: tokens.typography.body, fontSize: 12, color: tokens.colors.secondaryText, marginTop: 6 },
  button: {
    backgroundColor: tokens.colors.primaryText,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 },
});
