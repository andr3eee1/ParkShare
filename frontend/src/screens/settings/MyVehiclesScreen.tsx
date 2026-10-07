import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { AuthContext } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useAlert } from '../../context/AlertContext';

export const MyVehiclesScreen = () => {
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const { alert } = useAlert();

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await apiClient.get('/vehicles');
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPlate('');
    setIsDefault(false);
    setAddingVehicle(false);
    setEditingVehicleId(null);
  };

  const handleSaveVehicle = async () => {
    if (!name.trim() || !plate.trim()) {
      alert('Error', 'Please enter vehicle name and license plate.', undefined, 'warning');
      return;
    }
    setSubmitting(true);
    
    try {
      if (editingVehicleId) {
        await apiClient.put(`/vehicles/${editingVehicleId}`, { name, plate, isDefault });
      } else {
        await apiClient.post('/vehicles', { name, plate, isDefault });
      }
      
      resetForm();
      fetchVehicles();
      alert('Success', 'Vehicle saved successfully', undefined, 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save vehicle';
      alert('Error', errorMsg, undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const processDelete = async () => {
      try {
        await apiClient.delete(`/vehicles/${id}`);
        fetchVehicles();
      } catch (err) {
        console.error(err);
      }
    };

    alert('Delete', 'Are you sure you want to delete this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: processDelete }
    ], 'warning');
  };

  const handleEditVehicle = (v: any) => {
    setEditingVehicleId(v.id);
    setName(v.name);
    setPlate(v.plate);
    setIsDefault(v.isDefault);
    setAddingVehicle(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Vehicles</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator color={tokens.colors.primaryText} />
          ) : (
            vehicles.map((v, idx) => (
              <View key={idx} style={styles.cardItem}>
                <Ionicons name="car-outline" size={24} color={tokens.colors.primaryText} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.cardBrand}>{v.name}</Text>
                  <Text style={styles.cardExpiry}>{v.plate}</Text>
                </View>
                {v.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleEditVehicle(v)} style={styles.actionIcon}>
                    <Ionicons name="pencil-outline" size={20} color={tokens.colors.secondaryText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteVehicle(v.id)} style={styles.actionIcon}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {!addingVehicle && !editingVehicleId && (
            <TouchableOpacity style={styles.addCardButton} onPress={() => setAddingVehicle(true)}>
              <Ionicons name="add-circle-outline" size={20} color={tokens.colors.primaryText} />
              <Text style={styles.addCardText}>Add New Vehicle</Text>
            </TouchableOpacity>
          )}

          {(addingVehicle || editingVehicleId) && (
            <View style={styles.addCardForm}>
              <Text style={styles.formTitle}>{editingVehicleId ? 'Edit Vehicle' : 'New Vehicle'}</Text>
              
              <TextInput 
                style={styles.input} 
                placeholder="Vehicle Name (e.g. My Car)"
                value={name}
                onChangeText={setName}
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="License Plate (e.g. B-12-ABC)"
                value={plate}
                onChangeText={setPlate}
                autoCapitalize="characters"
              />

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setIsDefault(!isDefault)}
              >
                <Ionicons 
                  name={isDefault ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={isDefault ? tokens.colors.primaryText : tokens.colors.secondaryText} 
                />
                <Text style={styles.checkboxLabel}>Set as Default Vehicle</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#F3F4F6', marginRight: 8 }]} onPress={resetForm}>
                  <Text style={[styles.submitButtonText, { color: tokens.colors.primaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.submitButton, { marginLeft: 8 }]} onPress={handleSaveVehicle} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitButtonText}>Save Vehicle</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardBrand: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  cardExpiry: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
  },
  defaultBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  defaultText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addCardText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginLeft: 8,
  },
  addCardForm: {
    backgroundColor: tokens.colors.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  formTitle: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    color: tokens.colors.primaryText,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: tokens.typography.body,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.primaryText,
  },
  submitButton: {
    flex: 1,
    backgroundColor: tokens.colors.primaryText,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: tokens.typography.body,
    fontWeight: '600',
    color: tokens.colors.white,
  },
});