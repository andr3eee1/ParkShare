import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';

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
            <Ionicons name="trash-outline" size={28} color="#EF4444" />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Parking Spots</Text>
      </View>
      
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    padding: 16,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 24,
    color: tokens.colors.primaryText,
  },
  spotCard: {
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  spotImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  spotDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotName: {
    flex: 1,
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginRight: 8,
  },
  deleteButton: {
    padding: 2,
    marginLeft: 4,
  },
  spotPrice: {
    fontFamily: tokens.typography.body,
    color: tokens.colors.secondaryText,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: tokens.typography.body,
    color: '#6B7280',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: tokens.colors.municipalTeal,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3,
  }
});
