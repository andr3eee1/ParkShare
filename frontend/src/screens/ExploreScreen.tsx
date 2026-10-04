import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Keyboard, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Map, getAvailability } from '../components/Map';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createAllParkingSpots,
  DEFAULT_LOCATION,
  searchDemoLocations,
  DemoLocation,
  DemoParkingSpot,
} from '../data/demoLocations';

const DEFAULT_USER_LOCATION = { latitude: 44.4720, longitude: 26.1020 };

export const ExploreScreen = () => {
  const [selectedSpot, setSelectedSpot] = useState<DemoParkingSpot | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeLocation, setActiveLocation] = useState<DemoLocation | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<DemoLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation(DEFAULT_USER_LOCATION);
        return;
      }

      // Quick fetch first
      let lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) {
        const coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        setUserLocation(coords);
        if (!activeLocation) mapRef.current?.centerOnLocation(coords);
      }

      // High accuracy fetch
      let location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coords);
      if (!activeLocation) mapRef.current?.centerOnLocation(coords);
    })();
  }, []);

  const mapRef = useRef<any>(null);
  const parkingSpots = useMemo(() => {
    return createAllParkingSpots().filter(spot => {
      const avail = getAvailability(spot.available, spot.reservations || []);
      return avail.isAvailable;
    });
  }, []);
  const searchResults = searchDemoLocations(searchQuery);

  const handleLocationSelect = (location: DemoLocation) => {
    setActiveLocation(location);
    setSearchedLocation(location);
    mapRef.current?.centerOnLocation(location);
    setSearchQuery(location.name);
    setSearchFocused(false);
    setSelectedSpot(null);
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    const firstResult = searchResults[0];
    if (firstResult) {
      handleLocationSelect(firstResult);
    }
  };

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
  
  const isCurrentlyOccupied = (() => {
    if (!selectedSpot || !selectedSpot.reservations) return false;
    for (const res of selectedSpot.reservations) {
      const [rH, rM] = res.startTime.split(':').map(Number);
      const [eH, eM] = res.endTime.split(':').map(Number);
      const rStart = rH * 60 + rM;
      const rEnd = eH * 60 + eM;
      
      const isCrossMidnight = rEnd < rStart;
      let isActive = false;
      if (isCrossMidnight) {
        isActive = currentMinutesRaw >= rStart || currentMinutesRaw < rEnd;
      } else {
        isActive = currentMinutesRaw >= rStart && currentMinutesRaw < rEnd;
      }
      if (isActive) return true;
    }
    return false;
  })();
  
  // The booking starts right now (or when the lot opens, if it's currently closed)
  const actualStartMinutes = Math.max(openTime, currentMinutesRaw);
  
  // Start time is not rounded for the exact calculation, but departure slider is snapped to 5 mins
  const roundedStart = Math.ceil(actualStartMinutes / 5) * 5;
  const sliderMin = roundedStart + 30; // Minimum 30 min reservation
  const sliderMax = Math.floor(closeTime / 5) * 5;

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
      <Map
        ref={mapRef}
        spots={parkingSpots}
        selectedSpot={selectedSpot}
        onSelectSpot={setSelectedSpot}
        destination={searchedLocation ?? undefined}
        userLocation={userLocation || DEFAULT_USER_LOCATION}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
        {/* Top Header Panel */}
        <View pointerEvents="box-none" style={styles.headerContainer}>
          <GlassPanel borderRadius={tokens.radii.topPanel} style={styles.headerPanel}>
            <View style={styles.headerTopRow}>
              <Text style={styles.wordmark}>ParkShare</Text>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color={tokens.colors.availabilityGreen} />
                <Text style={styles.locationText}>{activeLocation ? activeLocation.shortName : 'My Location'}</Text>
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
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text === '') setSearchedLocation(null);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchedLocation(null); Keyboard.dismiss(); }}>
                  <Ionicons name="close-circle" size={20} color={tokens.colors.secondaryText} style={{ padding: 4 }} />
                </TouchableOpacity>
              )}
            </View>

            {searchFocused && searchQuery.trim().length > 0 && (
              <View style={styles.suggestionsContainer}>
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 5).map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      style={styles.suggestionRow}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <Ionicons name="location-outline" size={18} color={tokens.colors.availabilityGreen} />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionName}>{location.name}</Text>
                        <Text style={styles.suggestionSubtitle}>{location.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsRow}>
                    <Text style={styles.noResultsText}>No demo locations found</Text>
                  </View>
                )}
              </View>
            )}

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
        <View pointerEvents="box-none" style={[styles.mapControls, selectedSpot && { bottom: 300 }]}>
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
            <TouchableOpacity style={styles.controlButton} onPress={() => mapRef.current?.centerOnLocation(userLocation || DEFAULT_USER_LOCATION)}>
              <Ionicons name="navigate" size={20} color={tokens.colors.primaryText} />
            </TouchableOpacity>
          </GlassPanel>
        </View>

        {/* Booking Sheet (Simplified) */}
        {selectedSpot && (
          <View pointerEvents="box-none" style={styles.bookingSheetWrapper}>
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

              {(sliderMin > sliderMax || isCurrentlyOccupied) ? (
                <View style={styles.municipalWarning}>
                  <Text style={styles.municipalWarningText}>This spot is currently unavailable.</Text>
                </View>
              ) : selectedSpot.type === 'private' ? (
                <TouchableOpacity style={styles.reserveButton} onPress={() => { 
                  setDepartureMinutes(Math.min(sliderMin + 60, sliderMax)); 
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
                  step={5}
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
  suggestionsContainer: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.inputControl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  suggestionTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  suggestionName: {
    fontFamily: tokens.typography.bodyMedium,
    fontSize: 14,
    color: tokens.colors.primaryText,
  },
  suggestionSubtitle: {
    fontFamily: tokens.typography.body,
    fontSize: 12,
    color: tokens.colors.secondaryText,
    marginTop: 2,
  },
  noResultsRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  noResultsText: {
    fontFamily: tokens.typography.body,
    fontSize: 13,
    color: tokens.colors.secondaryText,
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
    marginBottom: 16,
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
