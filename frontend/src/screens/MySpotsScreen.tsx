import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { BrandGradient } from '../components/Brand';
import { styles } from './MySpotsScreen.styles';

export const MySpotsScreen = () => {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const res = await apiClient.get('/spots/me');
      setSpots(res.data.spots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpot = (id: string) => {
    const executeDelete = async () => {
      try {
        await apiClient.delete(`/spots/${id}`);
        setSpots((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        console.error(err);
        if (Platform.OS === 'web') {
          window.alert('Failed to delete spot');
        } else {
          Alert.alert('Error', 'Failed to delete spot');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this parking spot?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Spot', 'Are you sure you want to delete this parking spot?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  const renderSpot = ({ item }: { item: any }) => (
    <View style={styles.spotCard}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.spotImage} />
      ) : (
        <View style={[styles.spotImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="car-outline" size={40} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.spotDetails}>
        <View style={styles.spotHeader}>
          <Text style={styles.spotName} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity 
            onPress={() => handleDeleteSpot(item.id)} 
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={28} color={tokens.colors.danger} />
          </TouchableOpacity>
        </View>
        <Text style={styles.spotPrice}>{item.price.toFixed(2)} RON / hr</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.isAvailable ? 'Active' : 'Hidden'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrandGradient style={styles.header}>
        <View pointerEvents="none" style={styles.headerSheen} />
        <Text style={styles.headerTitle}>My Parking Spots</Text>
      </BrandGradient>
      
      {loading ? (
        <ActivityIndicator color={tokens.colors.primaryText} style={{ marginTop: 40 }} />
      ) : spots.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>You haven't added any spots yet.</Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          renderItem={renderSpot}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddSpot')}
      >
        <Ionicons name="add" size={32} color={tokens.colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
