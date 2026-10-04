import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Map } from '../components/Map';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_SPOTS = [
  { id: '1', name: 'Driveway (Verified)', type: 'private', price: 4, x: '25%', y: '30%', host: 'Elena M.', available: '09:00 - 18:00' },
  { id: '2', name: 'Street Meter 1204', type: 'municipal', price: 5, x: '60%', y: '45%', host: 'City of Bucharest', available: '24/7' },
  { id: '3', name: 'Apartment Complex B', type: 'private', price: 6, x: '75%', y: '20%', host: 'Andrei P.', available: '10:00 - 20:00' },
  { id: '4', name: 'Office Underground', type: 'private', price: 8, x: '40%', y: '70%', host: 'Corporate Hub', available: '18:00 - 08:00' },
];

export const ExploreScreen = () => {
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<any>(null);

  // Modal State
  const [vehiclePlate, setVehiclePlate] = useState('');
  
  // Real-time "Now" tracking
  const now = new Date();
  const currentMinutesRaw = now.getHours() * 60 + now.getMinutes();

  // Calculate minute bounds
  const getMinMaxMinutes = () => {
    if (!selectedSpot || selectedSpot.available === '24/7') return { min: 0, max: 1440 };
    
    const parts = selectedSpot.available.split('-');
    if (parts.length === 2) {
      const [minH, minM] = parts[0].trim().split(':').map(Number);
      const [maxH, maxM] = parts[1].trim().split(':').map(Number);
      
      let min = minH * 60 + minM;
      let max = maxH * 60 + maxM;
      
      if (max <= min) {
         max += 24 * 60; // Crosses midnight
      }
      return { min, max };
    }
    return { min: 0, max: 1440 };
  };

  const { min: openTime, max: closeTime } = getMinMaxMinutes();
  
  // The booking starts right now (or when the lot opens, if it's currently closed)
  const actualStartMinutes = Math.max(openTime, currentMinutesRaw);
  
  // Minimum departure is rounded up to the next 30-min interval + 30 mins minimum duration
  const sliderMin = (Math.ceil(actualStartMinutes / 30) * 30) + 30;
  const sliderMax = closeTime;

  const [departureMinutes, setDepartureMinutes] = useState(sliderMin + 60); // Default to roughly 1.5 hrs from now

  const formatMinutes = (m: number) => {
    const wrapped = m % 1440;
    const h = Math.floor(wrapped / 60).toString().padStart(2, '0');
    const mins = (wrapped % 60).toString().padStart(2, '0');
    return `${h}:${mins}`;
  };

  const formatDurationDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return h === 1 ? '1 hr' : `${h} hrs`;
    return `${m} mins`;
  };

  // Calculate total duration in minutes
  const totalDurationMinutes = Math.max(0, departureMinutes - actualStartMinutes);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  return (
    <View style={styles.container}>
      <Map ref={mapRef} spots={DUMMY_SPOTS} selectedSpot={selectedSpot} onSelectSpot={setSelectedSpot} />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {/* Top Header Panel */}
        <View style={styles.headerContainer} pointerEvents="box-none">
          <GlassPanel borderRadius={tokens.radii.topPanel} style={styles.headerPanel}>
            <View style={styles.headerTopRow}>
              <Text style={styles.wordmark}>ParkShare</Text>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color={tokens.colors.availabilityGreen} />
                <Text style={styles.locationText}>Pipera</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.passesShortcut}>Passes</Text>
                <View style={styles.avatar} />
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={tokens.colors.secondaryText} style={styles.searchIcon} />
              <TextInput 
                placeholder="Where are you going?" 
                placeholderTextColor={tokens.colors.secondaryText}
                style={styles.searchInput} 
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {['Available', 'Verified only', 'Private', 'Municipal', 'EV'].map((filter, i) => (
                <View key={i} style={[styles.filterChip, i === 0 && styles.filterChipActive]}>
                  <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{filter}</Text>
                </View>
              ))}
            </ScrollView>
          </GlassPanel>
        </View>

        {/* Map Controls */}
        <View style={[styles.mapControls, selectedSpot && { bottom: 200 }]} pointerEvents="box-none">
          <GlassPanel borderRadius={12} style={styles.controlGroup}>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <Ionicons name="add" size={24} color={tokens.colors.primaryText} />
            </TouchableOpacity>
            <View style={styles.controlDivider} />
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <Ionicons name="remove" size={24} color={tokens.colors.primaryText} />
            </TouchableOpacity>
          </GlassPanel>
          <GlassPanel borderRadius={12} style={styles.controlSingle}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="navigate" size={20} color={tokens.colors.primaryText} />
            </TouchableOpacity>
          </GlassPanel>
        </View>

        {/* Booking Sheet (Simplified) */}
        {selectedSpot && (
          <View style={styles.bookingSheetWrapper} pointerEvents="box-none">
            <GlassPanel borderRadius={tokens.radii.upperSheet} style={styles.bookingSheet}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotName}>{selectedSpot.name}</Text>
                  <Text style={styles.spotDetails}>
                    {selectedSpot.host} • {selectedSpot.type === 'private' ? 'Private space' : 'Municipal parking'}
                  </Text>
                  <Text style={styles.availableText}>Available: {selectedSpot.available}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setSelectedSpot(null)} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={24} color={tokens.colors.secondaryText} />
                  </TouchableOpacity>
                  <Text style={styles.spotPrice}>{selectedSpot.price} RON<Text style={styles.perHour}>/hr</Text></Text>
                </View>
              </View>

              {selectedSpot.type === 'private' ? (
                <TouchableOpacity style={styles.reserveButton} onPress={() => { 
                  setDepartureMinutes(sliderMin + 60); // Reset to 1 hr minimum
                  setModalVisible(true); 
                }}>
                  <Text style={styles.reserveButtonText}>Reserve space</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.municipalWarning}>
                  <Text style={styles.municipalWarningText}>Information only. Pay at the physical meter.</Text>
                </View>
              )}
            </GlassPanel>
          </View>
        )}
      </SafeAreaView>

      {/* Reservation Details Modal */}
      {selectedSpot && (
        <Modal visible={isModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassPanel borderRadius={16} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.spotName}>Instant Reservation</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={tokens.colors.primaryText} />
                </TouchableOpacity>
              </View>

              {/* Vehicle Input */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionLabel}>License Plate</Text>
                <TextInput
                  style={styles.plateInput}
                  placeholder="e.g. B 10 PRK"
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                  autoCapitalize="characters"
                  placeholderTextColor={tokens.colors.secondaryText}
                />
              </View>

              {/* Booking Time Range */}
              <View style={styles.modalSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View>
                    <Text style={styles.sectionLabel}>Starting</Text>
                    <Text style={[styles.arrivalSliderValue, { color: tokens.colors.availabilityGreen }]}>Right Now</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color={tokens.colors.secondaryText} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.sectionLabel}>Leaving By</Text>
                    <Text style={styles.arrivalSliderValue}>{formatMinutes(departureMinutes)}</Text>
                  </View>
                </View>

                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={sliderMin}
                  maximumValue={sliderMax}
                  step={30}
                  value={departureMinutes}
                  onValueChange={setDepartureMinutes}
                  minimumTrackTintColor={tokens.colors.primaryText}
                  maximumTrackTintColor="#D1D5DB"
                  thumbTintColor={tokens.colors.primaryText}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                  <Text style={styles.sliderLabel}>{formatMinutes(sliderMin)}</Text>
                  <Text style={styles.sliderLabel}>{formatMinutes(sliderMax)}</Text>
                </View>
              </View>

              {/* Receipt */}
              <View style={styles.receiptContainer}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Parking Hold ({formatDurationDisplay(totalDurationMinutes)} × {selectedSpot.price} RON/hr)</Text>
                  <Text style={styles.receiptValue}>{((totalDurationMinutes / 60) * selectedSpot.price).toFixed(2)} RON</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Security Deposit (Refundable)</Text>
                  <Text style={styles.receiptValue}>{selectedSpot.price * 5} RON</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total</Text>
                  <Text style={styles.receiptTotalValue}>{(((totalDurationMinutes / 60) * selectedSpot.price) + (selectedSpot.price * 5)).toFixed(2)} RON</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.reserveButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.reserveButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </GlassPanel>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paleMapBackground,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 16,
    left: 16,
    right: 16,
  },
  headerPanel: {
    padding: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wordmark: {
    fontFamily: tokens.typography.heading,
    fontSize: 20,
    fontWeight: '800',
    color: tokens.colors.primaryText,
    letterSpacing: -0.5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 157, 99, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radii.pill,
  },
  locationText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.availabilityGreen,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passesShortcut: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primaryText,
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.inputControl,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: tokens.colors.primaryText,
    borderColor: tokens.colors.primaryText,
  },
  filterText: {
    fontFamily: tokens.typography.body,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.colors.secondaryText,
  },
  filterTextActive: {
    color: tokens.colors.white,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 40,
    alignItems: 'center',
  },
  controlGroup: {
    marginBottom: 12,
  },
  controlSingle: {
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  bookingSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bookingSheet: {
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    padding: 24,
    paddingTop: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  spotName: {
    fontFamily: tokens.typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primaryText,
    marginBottom: 4,
  },
  spotDetails: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
    marginBottom: 4,
  },
  availableText: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.availabilityGreen,
  },
  closeButton: {
    marginBottom: 8,
  },
  spotPrice: {
    fontFamily: tokens.typography.heading,
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  },
  perHour: {
    fontSize: 14,
    fontWeight: '500',
    color: tokens.colors.secondaryText,
  },
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeControlBox: {
    flex: 1,
    backgroundColor: tokens.colors.white,
    padding: 12,
    borderRadius: tokens.radii.inputControl,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeLabel: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginBottom: 4,
  },
  timeValue: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontFamily: tokens.typography.body,
    fontSize: 16,
    fontWeight: '500',
    color: tokens.colors.primaryText,
  },
  costValue: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  },
  depositText: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.warningAmber,
    marginBottom: 20,
  },
  reserveButton: {
    backgroundColor: tokens.colors.primaryText,
    paddingVertical: 16,
    borderRadius: tokens.radii.inputControl,
    alignItems: 'center',
  },
  reserveButtonText: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  municipalWarning: {
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    padding: 16,
    borderRadius: tokens.radii.inputControl,
    alignItems: 'center',
  },
  municipalWarningText: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.municipalTeal,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.secondaryText,
    marginBottom: 12,
  },
  plateInput: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: tokens.radii.inputControl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    color: tokens.colors.primaryText,
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  timeChipActive: {
    backgroundColor: tokens.colors.primaryText,
    borderColor: tokens.colors.primaryText,
  },
  timeText: {
    fontFamily: tokens.typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  sliderLabel: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
  },
  arrivalSliderValue: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  },
  timeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: tokens.radii.inputControl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeSelectText: {
    fontFamily: tokens.typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  departureText: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.availabilityGreen,
  },
  durationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: tokens.radii.inputControl,
    padding: 8,
  },
  durBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.paleMapBackground,
    borderRadius: 8,
  },
  durationValue: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  },
  receiptContainer: {
    backgroundColor: tokens.colors.paleMapBackground,
    padding: 16,
    borderRadius: tokens.radii.inputControl,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    flex: 1,
    marginRight: 16,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.secondaryText,
  },
  receiptValue: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.primaryText,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 12,
  },
  receiptTotalLabel: {
    fontFamily: tokens.typography.heading,
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  },
  receiptTotalValue: {
    fontFamily: tokens.typography.heading,
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.primaryText,
  }
});
