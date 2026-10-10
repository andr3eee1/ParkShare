import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { useAlert } from '../../context/AlertContext';
import { GlassPanel } from '../../components/GlassPanel';
import { Screen, ScreenHeader } from '../../components/Screen';

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

const styles = StyleSheet.create({
  emptyText: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, marginBottom: 12 },
  cardItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: tokens.colors.emeraldTint,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 14,
    width: 38,
  },
  cardName: { fontFamily: tokens.typography.bodySemiBold, fontSize: 15, color: tokens.colors.primaryText },
  cardPlate: { fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, marginTop: 2 },
  defaultBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  defaultText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 11, color: '#0284C7' },
  actionButtons: { flexDirection: 'row' },
  actionIcon: { padding: 8, marginLeft: 2 },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.panelSurface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addCardText: { fontFamily: tokens.typography.bodySemiBold, fontSize: 15, color: tokens.colors.primaryText, marginLeft: 8 },
  addCardForm: { padding: 18, marginTop: 4 },
  formTitle: { fontFamily: tokens.typography.headingMedium, fontSize: 16, color: tokens.colors.primaryText, marginBottom: 16 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    color: tokens.colors.primaryText,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  checkboxLabel: { marginLeft: 8, fontFamily: tokens.typography.body, fontSize: 14, color: tokens.colors.primaryText },
  submitButton: { flex: 1, backgroundColor: tokens.colors.emerald, padding: 13, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#EEF2F5' },
  submitButtonText: { fontFamily: tokens.typography.bodySemiBold, color: tokens.colors.white, fontSize: 14 },
});
