import React, { useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Map } from '../components/Map';
import { useAlert } from '../context/AlertContext';

export const AddSpotScreen = () => {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();
  const { alert } = useAlert();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [latitude, setLatitude] = useState(44.4268);
  const [longitude, setLongitude] = useState(26.1025);
  const [loading, setLoading] = useState(false);
  const pinAnimation = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    if (!name || !price) {
      alert('Error', 'Please fill in all required fields.', undefined, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          latitude,
          longitude
        })
      });

      if (res.ok) {
        alert('Success', 'Spot created!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ], 'success');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create spot');
      }
    } catch (err: any) {
      alert('Error', err.message, undefined, 'error');
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

          <Text style={styles.label}>Location * (Pan and zoom to place pin)</Text>
          <View style={styles.mapContainer}>
            <Map 
              spots={[]}
              selectedSpot={null}
              onSelectSpot={() => {}}
              onMapMoveStart={() => {
                Animated.spring(pinAnimation, {
                  toValue: -20,
                  useNativeDriver: true,
                  speed: 20
                }).start();
              }}
              onMapMoveEnd={(coords) => {
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
                Animated.spring(pinAnimation, {
                  toValue: 0,
                  useNativeDriver: true,
                  bounciness: 20
                }).start();
              }}
            />
            {/* Center fixed pin with drop animation */}
            <Animated.View style={[styles.centerPin, { transform: [{ translateY: pinAnimation }], pointerEvents: 'none' }]}>
              <Ionicons name="location" size={40} color={tokens.colors.municipalTeal} style={{ marginTop: -20 }} />
              {/* Add a tiny shadow dot to show exactly where it's dropping */}
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', position: 'absolute', bottom: -5 }} />
            </Animated.View>
          </View>


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
  submitText: { color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 },
  mapContainer: { height: 250, borderRadius: 12, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', position: 'relative' },
  centerPin: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20, zIndex: 10, alignItems: 'center', justifyContent: 'center' }
});
