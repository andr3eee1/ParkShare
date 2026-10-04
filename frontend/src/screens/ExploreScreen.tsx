import React, { useState, useRef } from 'react';
import { Keyboard, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { Map } from '../components/Map';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createAllParkingSpots,
  DEFAULT_LOCATION,
  searchDemoLocations,
  DemoLocation,
  DemoParkingSpot,
} from '../data/demoLocations';

export const ExploreScreen = () => {
  const [selectedSpot, setSelectedSpot] = useState<DemoParkingSpot | null>(null);
  const [activeLocation, setActiveLocation] = useState(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const mapRef = useRef<any>(null);
  const parkingSpots = createAllParkingSpots();
  const searchResults = searchDemoLocations(searchQuery);

  const handleLocationSelect = (location: DemoLocation) => {
    setActiveLocation(location);
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
        destination={activeLocation}
      />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        {/* Top Header Panel */}
        <View style={styles.headerContainer} pointerEvents="box-none">
          <GlassPanel borderRadius={tokens.radii.topPanel} style={styles.headerPanel}>
            <View style={styles.headerTopRow}>
              <Text style={styles.wordmark}>ParkShare</Text>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color={tokens.colors.availabilityGreen} />
                <Text style={styles.locationText}>{activeLocation.shortName}</Text>
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
                onChangeText={(query) => {
                  setSearchQuery(query);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
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
        <View style={[styles.mapControls, selectedSpot && { bottom: 380 }]} pointerEvents="box-none">
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

        {/* Booking Sheet */}
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
                    {selectedSpot.host} • {selectedSpot.type === 'private' ? 'Private space' : 'Municipal parking'} • {selectedSpot.distance}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={() => setSelectedSpot(null)} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={24} color={tokens.colors.secondaryText} />
                  </TouchableOpacity>
                  <Text style={styles.spotPrice}>{selectedSpot.price} RON<Text style={styles.perHour}>/hr</Text></Text>
                </View>
              </View>

              <View style={styles.timeControls}>
                <View style={styles.timeControlBox}>
                  <Text style={styles.timeLabel}>Arrival</Text>
                  <Text style={styles.timeValue}>09:00</Text>
                </View>
                <View style={styles.timeControlBox}>
                  <Text style={styles.timeLabel}>Departure</Text>
                  <Text style={styles.timeValue}>18:00</Text>
                </View>
                <View style={styles.timeControlBox}>
                  <Text style={styles.timeLabel}>Vehicle</Text>
                  <Text style={styles.timeValue}>B 10 PRK</Text>
                </View>
              </View>

              {selectedSpot.type === 'private' ? (
                <>
                  <View style={styles.costSummary}>
                    <Text style={styles.costLabel}>Total (9 hours)</Text>
                    <Text style={styles.costValue}>{selectedSpot.price * 9} RON</Text>
                  </View>
                  <Text style={styles.depositText}>* Requires {selectedSpot.price * 5} RON refundable security hold</Text>

                  <TouchableOpacity style={styles.reserveButton} onPress={() => {}}>
                    <Text style={styles.reserveButtonText}>Reserve space</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.municipalWarning}>
                  <Text style={styles.municipalWarningText}>Information only. Pay at the physical meter.</Text>
                </View>
              )}
            </GlassPanel>
          </View>
        )}
      </SafeAreaView>
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
  }
});
