import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const AddSpotScreen = () => {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !price || !latitude || !longitude) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://pana.com.ro:8745/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        })
      });

      if (res.ok) {
        Alert.alert('Success', 'Spot created!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create spot');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Parking Spot</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.label}>Spot Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Driveway on Main St." />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline value={description} onChangeText={setDescription} placeholder="Instructions for drivers..." />

          <Text style={styles.label}>Price (RON / hr) *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} placeholder="5.00" />

          <Text style={styles.label}>Latitude *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={latitude} onChangeText={setLatitude} placeholder="44.4325" />

          <Text style={styles.label}>Longitude *</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={longitude} onChangeText={setLongitude} placeholder="26.1039" />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitText}>Create Spot</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontFamily: tokens.typography.heading, fontSize: 18, color: tokens.colors.primaryText },
  form: { padding: 24 },
  label: { fontFamily: tokens.typography.heading, fontSize: 14, color: tokens.colors.primaryText, marginBottom: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontFamily: tokens.typography.body,
  },
  submitButton: {
    backgroundColor: tokens.colors.primaryText,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 }
});
