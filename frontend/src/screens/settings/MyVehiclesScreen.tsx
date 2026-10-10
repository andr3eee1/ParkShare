import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';
import { styles } from './MyVehiclesScreen.styles';

export const MyVehiclesScreen = () => {
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
    <Screen keyboardAvoiding>
      <ScreenHeader title="My Vehicles" subtitle="License plates and defaults" />

      {loading ? (
        <ActivityIndicator color={tokens.colors.emerald} style={{ marginTop: 12 }} />
      ) : vehicles.length === 0 ? (
        <Text style={styles.emptyText}>No vehicles added yet.</Text>
      ) : (
        vehicles.map((v, idx) => (
          <GlassPanel key={idx} style={styles.cardItem} borderRadius={16} intensity={40} overlayColor={tokens.colors.panelSurface}>
            <View style={styles.cardIcon}>
              <Ionicons name="car-outline" size={20} color={tokens.colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{v.name}</Text>
              <Text style={styles.cardPlate}>{v.plate}</Text>
            </View>
            {v.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleEditVehicle(v)} style={styles.actionIcon}>
                <Ionicons name="pencil-outline" size={19} color={tokens.colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteVehicle(v.id)} style={styles.actionIcon}>
                <Ionicons name="trash-outline" size={19} color={tokens.colors.danger} />
              </TouchableOpacity>
            </View>
          </GlassPanel>
        ))
      )}

      {!addingVehicle && !editingVehicleId && (
        <TouchableOpacity style={styles.addCardButton} onPress={() => setAddingVehicle(true)} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={20} color={tokens.colors.primaryText} />
          <Text style={styles.addCardText}>Add New Vehicle</Text>
        </TouchableOpacity>
      )}

      {(addingVehicle || editingVehicleId) && (
        <GlassPanel style={styles.addCardForm} borderRadius={18} intensity={40} overlayColor={tokens.colors.panelSurface}>
          <Text style={styles.formTitle}>{editingVehicleId ? 'Edit Vehicle' : 'New Vehicle'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Vehicle Name (e.g. My Car)"
            placeholderTextColor={tokens.colors.secondaryText}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="License Plate (e.g. B-12-ABC)"
            placeholderTextColor={tokens.colors.secondaryText}
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setIsDefault(!isDefault)}>
            <Ionicons
              name={isDefault ? 'checkbox' : 'square-outline'}
              size={22}
              color={isDefault ? tokens.colors.emerald : tokens.colors.secondaryText}
            />
            <Text style={styles.checkboxLabel}>Set as Default Vehicle</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity style={[styles.submitButton, styles.cancelButton]} onPress={resetForm}>
              <Text style={[styles.submitButtonText, { color: tokens.colors.primaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitButton, { marginLeft: 8 }]} onPress={handleSaveVehicle} disabled={submitting}>
              {submitting ? <ActivityIndicator color={tokens.colors.white} /> : <Text style={styles.submitButtonText}>Save Vehicle</Text>}
            </TouchableOpacity>
          </View>
        </GlassPanel>
      )}
    </Screen>
  );
};
