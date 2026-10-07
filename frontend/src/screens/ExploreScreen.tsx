import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Keyboard, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, Modal, useWindowDimensions, Pressable, Clipboard, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { tokens } from '../theme/tokens';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { apiClient } from '../api/client';
import { GlassPanel } from '../components/GlassPanel';
import { Map, getAvailability } from '../components/Map';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePasses } from '../context/PassContext';
import { toBucharestDBTime, fromBucharestDBTime } from '../utils/timezone';
import {
  DEFAULT_LOCATION,
  searchDemoLocations,
  DemoLocation,
  DemoParkingSpot,
} from '../data/demoLocations';

const DEFAULT_USER_LOCATION = { latitude: 44.4720, longitude: 26.1020 };

const WheelPicker = ({ items, selectedValue, onValueChange, disabledItems = [], itemHeight = 40 }: { items: string[], selectedValue: string, onValueChange: (val: string) => void, disabledItems?: string[], itemHeight?: number }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const itemsKey = items.join(',');

  // Latest props for the native wheel listener (which is attached only once).
  const latest = useRef({ items, selectedValue, onValueChange, disabledItems });
  latest.current = { items, selectedValue, onValueChange, disabledItems };

  // Keep the scroll position in sync with the selected value, but only when it
  // actually differs (so scrolling by hand never triggers a second scroll).
  useEffect(() => {
    const index = items.indexOf(selectedValue);
    const animated = mountedRef.current;
    mountedRef.current = true;
    if (index < 0) return;
    const target = index * itemHeight;
    if (Math.abs(offsetRef.current - target) < 1) return;
    targetRef.current = target;
    scrollViewRef.current?.scrollTo({ y: target, animated });
    offsetRef.current = target;
    setTimeout(() => { if (targetRef.current === target) targetRef.current = null; }, 400);
  }, [itemsKey, selectedValue, itemHeight]);

  // Web: a mouse-wheel notch is ~100px (2+ items). Take over the wheel event and
  // move exactly one item per notch instead.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node: HTMLElement | undefined = (scrollViewRef.current as any)?.getScrollableNode?.();
    if (!node) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) < 30) return; // let trackpads accumulate a bit
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const { items: its, selectedValue: sel, onValueChange: change, disabledItems: dis } = latest.current;
      let i = its.indexOf(sel) + dir;
      while (i >= 0 && i < its.length && dis.includes(its[i])) i += dir;
      if (i >= 0 && i < its.length) change(its[i]);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <View style={{ height: itemHeight * 3, width: 70, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', top: itemHeight, left: 0, right: 0, height: itemHeight, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, zIndex: -1 }} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (targetRef.current !== null) {
            // Programmatic scroll in progress: ignore until it arrives.
            if (Math.abs(y - targetRef.current) < 1) {
              targetRef.current = null;
              offsetRef.current = y;
            }
            return;
          }
          offsetRef.current = y;
          const index = Math.round(y / itemHeight);
          if (items[index] && items[index] !== selectedValue) {
            onValueChange(items[index]);
          }
        }}
      >
        <View style={{ height: itemHeight }} />
        {items.map((item, i) => {
          const isSelected = selectedValue === item;
          const isDisabled = disabledItems.includes(item);
          return (
            <TouchableOpacity key={i} activeOpacity={0.7} disabled={isDisabled} onPress={() => onValueChange(item)}>
              <View style={{ height: itemHeight, justifyContent: 'center', alignItems: 'center', opacity: isDisabled ? 0.25 : 1 }}>
                <Text style={{ fontSize: isSelected ? 18 : 14, fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? tokens.colors.primaryText : tokens.colors.secondaryText }}>
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: itemHeight }} />
      </ScrollView>
    </View>
  );
};

export const ExploreScreen = () => {
  const navigation = useNavigation<any>();
  const { user, token } = useContext(AuthContext);
  const { getPassForSpot, isParkPlusActive } = usePasses();
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDetailsVisible, setDetailsVisible] = useState(false);
  const [isPhotoZoomed, setPhotoZoomed] = useState(false);
  const [activeLocation, setActiveLocation] = useState<DemoLocation | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<DemoLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchActiveReservation = async () => {
        if (!token) {
          setActiveReservation(null);
          return;
        }
        try {
          const res = await apiClient.get('/bookings/me');
          if (res.data.bookings) {
            const now = new Date();
            const active = res.data.bookings.find((b: any) => 
              b.status === 'ACTIVE' && fromBucharestDBTime(new Date(b.endTime)) > now
            );
            setActiveReservation(active || null);
            if (active && active.spot) {
              setTimeout(() => {
                mapRef.current?.centerOnLocation({ latitude: active.spot.latitude, longitude: active.spot.longitude });
              }, 500);
            }
          }
        } catch (err) {
          console.error('Failed to fetch reservations:', err);
        }
      };
      fetchActiveReservation();
    }, [token])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchSpots = async () => {
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/spots`);
          const data = await res.json();
          if (res.ok) setSpots(data.spots);
        } catch (err) {
          console.error('Failed to fetch spots:', err);
        }
      };
      fetchSpots();
    }, [])
  );

  const visibleSpots = useMemo(() => {
    const now = new Date();
    return spots.map(spot => {
      let activeRes = null;
      if (spot.reservations && spot.reservations.length > 0) {
        activeRes = spot.reservations.find((r: any) => fromBucharestDBTime(new Date(r.endTime)) > now);
      }
      
      if (activeRes) {
        // If it's booked by someone else, hide it
        if (!user || activeRes.userId !== user.id) {
          return null;
        }
        // If it's booked by me, mark it
        return { ...spot, bookedByMe: true };
      }
      return spot;
    }).filter(Boolean);
  }, [spots, user]);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['All']);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<'price' | 'time' | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  const [tempHour, setTempHour] = useState('12');
  const [tempMinute, setTempMinute] = useState('00');
  const [isFiltersVisible, setFiltersVisible] = useState(false);
  const hasActiveFilters = maxPrice !== null || timeLimit !== null || !activeFilters.includes('All');

  const filtersScrollRef = useRef<ScrollView>(null);
  const filterLayouts = useRef<{ [key: string]: { x: number, width: number } }>({});
  const { width: windowWidth } = useWindowDimensions();
  const scrollWidthRef = useRef(windowWidth);

  // Keep the screen clear: collapse the filters whenever a parking spot is
  // opened or closed.
  useEffect(() => {
    setFiltersVisible(false);
    setActiveDropdown(null);
  }, [selectedSpot]);

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

  useEffect(() => {
    if (activeDropdown === 'time') {
      const now = new Date();
      let curH = now.getHours();
      let curM = now.getMinutes();
      let minM_calc = Math.ceil(curM / 5) * 5;
      if (minM_calc >= 60) {
        minM_calc = 0;
        curH = (curH + 1) % 24;
      }
      
      const hourItems = [];
      let h = curH;
      while (true) {
        hourItems.push(h.toString().padStart(2, '0'));
        if (h === 6) break;
        h = (h + 1) % 24;
      }
      
      let currentSetHour = tempHour;
      if (!hourItems.includes(currentSetHour)) {
        currentSetHour = hourItems[0];
        setTempHour(currentSetHour);
      }
      
      let minM = 0;
      if (parseInt(currentSetHour) === curH) {
        minM = minM_calc;
      }
      
      const minuteItems = [];
      if (currentSetHour === '06') {
        minuteItems.push('00');
      } else {
        for (let i = minM; i <= 55; i += 5) {
          minuteItems.push(i.toString().padStart(2, '0'));
        }
        if (minuteItems.length === 0) minuteItems.push('00');
      }
      
      if (!minuteItems.includes(tempMinute)) {
        setTempMinute(minuteItems[0]);
      }
    }
  }, [activeDropdown, tempHour, tempMinute]);

  const mapRef = useRef<any>(null);
  const parkingSpots = useMemo(() => {
    const backendSpots = visibleSpots.map((s: any) => ({
      ...s,
      type: 'private',
      host: s.owner ? `${s.owner.firstName} ${s.owner.lastName}` : 'ParkShare User',
      distance: 'Live location',
      available: 'Available Now',
      reservations: [],
      address: s.description ? s.description : `GPS: ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}`,
      evCharging: false,
    }));
    
    const allSpots = [...backendSpots];

    return allSpots.filter((spot: any) => {
      // First, always filter out currently active spots if the request implied availability? 
      // The prompt didn't say "don't filter unavailable", just "remove the verified only and available [buttons]".
      // I'll keep the base availability check (unless the user meant to see ALL spots including unavailable ones).
      const avail = getAvailability(spot.available, spot.reservations || []);
      if (!avail.isAvailable) return false;

      // Filter by max price
      if (maxPrice !== null && spot.price > maxPrice) return false;

      // Filter by time limit
      if (timeLimit) {
        let limitMins = 0;
        if (timeLimit.includes(':')) {
          const [h, m] = timeLimit.split(':').map(Number);
          limitMins = (h || 0) * 60 + (m || 0);
        } else {
          limitMins = parseInt(timeLimit.replace(/[^0-9]/g, '')) * 60;
        }

        if (!isNaN(limitMins)) {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          if (limitMins < currentMins) limitMins += 1440;

          if (spot.available !== '24/7') {
            const parts = spot.available.split('-');
            if (parts.length === 2) {
              const [minH, minM] = parts[0].trim().split(':').map(Number);
              const [maxH, maxM] = parts[1].trim().split(':').map(Number);
              let closeMins = maxH * 60 + maxM;
              let openMins = minH * 60 + minM;
              if (closeMins <= openMins) closeMins += 1440;
              
              if (limitMins > closeMins) return false;
            }
          }
        }
      }

      // If 'All' is active, bypass other tag filters
      if (activeFilters.includes('All')) return true;

      // Otherwise, check specific filters
      let passes = true;
      if (activeFilters.includes('Private') && spot.type !== 'private') passes = false;
      if (activeFilters.includes('Municipal') && spot.type !== 'municipal') passes = false;
      if (activeFilters.includes('EV') && !spot.evCharging) passes = false;
      
      return passes;
    });
  }, [activeFilters, maxPrice, timeLimit, visibleSpots]);
  const [searchResults, setSearchResults] = useState<DemoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const localResults = searchDemoLocations(searchQuery);
    
    if (searchQuery.trim().length < 3) {
      setSearchResults(localResults);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const prefixes = ['', 'Strada ', 'Calea ', 'Bulevardul ', 'Intrarea '];
        const fetchPromises = prefixes.map(prefix => 
          fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(prefix + searchQuery + ' Bucharest')}&limit=4`).then(r => r.json())
        );
        const responses = await Promise.all(fetchPromises);
        const features = responses.flatMap(data => data.features || []);
        
        const apiResults: DemoLocation[] = features.map((item: any) => ({
          id: (item.properties.osm_id || Math.random()).toString(),
          name: item.properties.name || item.properties.street || item.properties.locality || 'Unknown',
          shortName: item.properties.name || item.properties.street || 'Unknown',
          subtitle: [item.properties.locality, item.properties.district].filter(Boolean).join(', ') || item.properties.city || 'Bucharest',
          latitude: item.geometry.coordinates[1],
          longitude: item.geometry.coordinates[0],
          aliases: []
        }));

        const combined = [...localResults];
        apiResults.forEach(apiRes => {
          if (!combined.find(c => c.name.toLowerCase() === apiRes.name.toLowerCase())) {
            combined.push(apiRes);
          }
        });
        setSearchResults(combined.slice(0, 8));
      } catch (err) {
        console.warn("Geocoding failed", err);
        setSearchResults(localResults);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | 'custom'>('custom');

  useEffect(() => {
    if (token) {
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.vehicles && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
          const defaultVehicle = data.vehicles.find((v: any) => v.isDefault);
          if (defaultVehicle) {
            setVehiclePlate(defaultVehicle.plate);
            setSelectedVehicleId(defaultVehicle.id);
          } else {
            setVehiclePlate(data.vehicles[0].plate);
            setSelectedVehicleId(data.vehicles[0].id);
          }
        }
      })
      .catch(console.error);
    }
  }, [token]);
  
  // Real-time "Now" tracking
  const now = new Date();
  const currentMinutesRaw = now.getHours() * 60 + now.getMinutes();

  // Calculate minute bounds
  const getMinMaxMinutes = () => {
    if (!selectedSpot || selectedSpot.available === '24/7') return { min: 0, max: 1800 };
    
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
  const appliedPass = getPassForSpot(selectedSpot);
  const parkPlusTimeDeductionMinutes = isParkPlusActive && totalDurationMinutes > 120 ? 15 : 0;
  const billableDurationMinutes = Math.max(0, totalDurationMinutes - parkPlusTimeDeductionMinutes);
  const baseParkingCost = (totalDurationMinutes / 60) * (selectedSpot?.price || 0);
  const timeDeductionValue = (parkPlusTimeDeductionMinutes / 60) * (selectedSpot?.price || 0);
  const billableParkingCost = (billableDurationMinutes / 60) * (selectedSpot?.price || 0);
  const parkPlusDiscount = isParkPlusActive ? billableParkingCost * 0.15 : 0;
  const parkingCost = billableParkingCost - parkPlusDiscount;
  const { activePasses } = usePasses();
  const hasAnyPass = activePasses.length > 0;
  const securityDeposit = hasAnyPass ? 0 : (selectedSpot?.price || 0) * 5;

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const renderMap = () => (
    <>
      <Map
        ref={mapRef}
        spots={parkingSpots}
        selectedSpot={selectedSpot}
        onSelectSpot={setSelectedSpot}
        onMapClick={(coords) => {
          setFiltersVisible(false);
          setActiveDropdown(null);
        }}
        destination={searchedLocation ?? undefined}
        userLocation={userLocation || DEFAULT_USER_LOCATION}
      />
    </>
  );

  const renderSearchPanel = () => {
    if (selectedSpot) return null;
    return (
    <>
      <View style={[styles.headerContainer, { pointerEvents: 'box-none' as any }]}>
          <GlassPanel borderRadius={tokens.radii.topPanel} style={styles.headerPanel}>
            <View style={styles.headerTopRow}>
              <Text style={styles.wordmark}>ParkShare</Text>
              <View style={[styles.locationBadge, { flexShrink: 1, marginHorizontal: 8 }]}>
                <Ionicons name="location" size={14} color={tokens.colors.availabilityGreen} style={{ flexShrink: 0 }} />
                <Text style={[styles.locationText, { flexShrink: 1 }]} numberOfLines={1}>{activeLocation ? activeLocation.shortName : 'My Location'}</Text>
              </View>
              <View style={styles.headerRight}>
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ fontFamily: tokens.typography.heading, fontSize: 14, color: tokens.colors.white }}>
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Text>
                  )}
                </View>
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
              <View style={{ width: 1, height: 24, backgroundColor: '#E5E7EB', marginHorizontal: 6 }} />
              <TouchableOpacity
                accessibilityLabel="Toggle filters"
                onPress={() => {
                  setFiltersVisible(v => !v);
                  setActiveDropdown(null);
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name={isFiltersVisible ? 'filter' : 'filter-outline'} size={20} color={isFiltersVisible ? tokens.colors.primaryText : tokens.colors.secondaryText} />
                {hasActiveFilters && (
                  <View style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.availabilityGreen }} />
                )}
              </TouchableOpacity>
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
                        <Text style={styles.suggestionName} numberOfLines={1}>{location.name}</Text>
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>{location.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsRow}>
                    {isSearching ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={tokens.colors.primaryText} style={{ marginRight: 8 }} />
                        <Text style={styles.noResultsText}>Searching...</Text>
                      </View>
                    ) : (
                      <Text style={styles.noResultsText}>No locations found</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {isFiltersVisible && (
            <>
            <View style={{ marginBottom: 8 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true} 
                persistentScrollbar={true} 
                indicatorStyle="black" 
                style={styles.filtersScroll} 
                contentContainerStyle={{ paddingBottom: 16 }}
                ref={filtersScrollRef}
                onLayout={(e) => { scrollWidthRef.current = e.nativeEvent.layout.width; }}
              >
                {['All', 'Price Limit', 'Time Limit', 'Private', 'Municipal', 'EV'].map((filter, i) => {
                  let isActive = false;
                  if (filter === 'Price Limit') isActive = maxPrice !== null;
                  else if (filter === 'Time Limit') isActive = timeLimit !== null;
                  else isActive = activeFilters.includes(filter);

                  let displayText = filter;
                  if (filter === 'Price Limit' && maxPrice !== null) displayText = `Max: ${maxPrice} RON/h`;
                  if (filter === 'Time Limit' && timeLimit !== null) displayText = `Until: ${timeLimit}`;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        filterLayouts.current[filter] = { x, width };
                      }}
                      onPress={() => {
                        const layout = filterLayouts.current[filter];
                        if (layout && filtersScrollRef.current) {
                          let scrollX = layout.x + layout.width / 2 - scrollWidthRef.current / 2;
                          if (scrollX < 0) scrollX = 0;
                          filtersScrollRef.current.scrollTo({ x: scrollX, y: 0, animated: true });
                        }

                        if (filter === 'Price Limit') {
                          if (maxPrice !== null) {
                            setMaxPrice(null);
                          } else {
                            if (activeDropdown === 'price') setActiveDropdown(null);
                            else { setTempPrice(''); setActiveDropdown('price'); }
                          }
                          return;
                        }
                        if (filter === 'Time Limit') {
                          if (timeLimit !== null) {
                            setTimeLimit(null);
                          } else {
                            if (activeDropdown === 'time') setActiveDropdown(null);
                            else { setActiveDropdown('time'); }
                          }
                          return;
                        }

                        setActiveFilters(prev => {
                          if (filter === 'All') {
                            setMaxPrice(null);
                            setTimeLimit(null);
                            return ['All'];
                          }
                          let next = prev.includes(filter) 
                            ? prev.filter(f => f !== filter) 
                            : [...prev.filter(f => f !== 'All'), filter];
                          
                          if (filter === 'Municipal') {
                            next = next.filter(f => f !== 'Private');
                          } else if (filter === 'Private') {
                            next = next.filter(f => f !== 'Municipal');
                          }
                          
                          return next.length === 0 ? ['All'] : next;
                        });
                      }}
                    >
                      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{displayText}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            {activeDropdown === 'price' && (() => {
              const applyPrice = () => {
                const val = parseFloat(tempPrice);
                if (!isNaN(val) && val > 0) setMaxPrice(val);
                setActiveDropdown(null);
              };
              return (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: tokens.typography.body, fontSize: 13, fontWeight: '600', color: tokens.colors.primaryText, marginBottom: 6, marginLeft: 4 }}>
                    Maximum price per hour
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 40, backgroundColor: tokens.colors.paleMapBackground, marginRight: 8, paddingHorizontal: 12, borderRadius: 20, overflow: 'hidden', minWidth: 0 }}>
                      <TextInput
                        style={[styles.searchInput, { flex: 1, height: 40, fontSize: 14, minWidth: 0, marginRight: 4 }]}
                        placeholder="e.g. 10"
                        placeholderTextColor={tokens.colors.secondaryText}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        value={tempPrice}
                        onChangeText={(text) => {
                          // Digits only, plus a single decimal point (comma accepted as point).
                          let clean = text.replace(',', '.').replace(/[^0-9.]/g, '');
                          const dot = clean.indexOf('.');
                          if (dot !== -1) clean = clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '');
                          setTempPrice(clean);
                        }}
                        onSubmitEditing={applyPrice}
                        returnKeyType="done"
                        autoFocus
                      />
                      <Text style={{ fontFamily: tokens.typography.body, fontSize: 13, color: tokens.colors.secondaryText, flexShrink: 0 }} numberOfLines={1}>RON/hr</Text>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: tokens.colors.primaryText, paddingHorizontal: 16, height: 40, borderRadius: 20, justifyContent: 'center', flexShrink: 0 }} onPress={applyPrice}>
                      <Text style={{ color: tokens.colors.white, fontWeight: 'bold' }}>Set</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
            {activeDropdown === 'time' && (() => {
              const now = new Date();
              let curH = now.getHours();
              let curM = now.getMinutes();
              let minM_calc = Math.ceil(curM / 5) * 5;
              if (minM_calc >= 60) {
                minM_calc = 0;
                curH = (curH + 1) % 24;
              }

              const hourItems = [];
              let h = curH;
              while (true) {
                hourItems.push(h.toString().padStart(2, '0'));
                if (h === 6) break;
                h = (h + 1) % 24;
              }

              let minM = 0;
              if (parseInt(tempHour) === curH) {
                minM = minM_calc;
              }
              // The minute list never changes, so switching hours never moves the wheel.
              const minuteItems: string[] = [];
              for (let i = 0; i <= 55; i += 5) minuteItems.push(i.toString().padStart(2, '0'));
              const validMinutesFor = (hour: string) => {
                if (hour === '06') return ['00'];
                const lo = parseInt(hour) === curH ? minM_calc : 0;
                return minuteItems.filter(m => parseInt(m) >= lo);
              };
              const disabledMinutes = minuteItems.filter(m => !validMinutesFor(tempHour).includes(m));
              const clampMinute = (hour: string, minute: string) => {
                const valid = validMinutesFor(hour);
                return valid.includes(minute) ? minute : valid[0];
              };

              return (
                <View style={{ marginTop: 8, backgroundColor: tokens.colors.paleMapBackground, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: tokens.typography.body, fontSize: 16, color: tokens.colors.primaryText, marginBottom: 12, textAlign: 'center', fontWeight: '600' }}>
                    Until: {tempHour}:{tempMinute}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 160 }}>
                    <WheelPicker
                      items={hourItems}
                      selectedValue={tempHour}
                      onValueChange={(h) => {
                        setTempHour(h);
                        const m = clampMinute(h, tempMinute);
                        if (m !== tempMinute) setTempMinute(m);
                      }}
                    />
                    <Text style={{ fontSize: 24, fontWeight: 'bold', marginHorizontal: 8 }}>:</Text>
                    <WheelPicker
                      items={minuteItems}
                      disabledItems={disabledMinutes}
                      selectedValue={tempMinute}
                      onValueChange={(m) => setTempMinute(clampMinute(tempHour, m))}
                    />
                  </View>
                  
                  <TouchableOpacity style={{ backgroundColor: tokens.colors.primaryText, paddingVertical: 10, paddingHorizontal: 32, borderRadius: 20, alignItems: 'center', marginTop: 12 }} onPress={() => {
                    setTimeLimit(`${tempHour}:${tempMinute}`);
                    setActiveDropdown(null);
                  }}>
                    <Text style={{ color: tokens.colors.white, fontWeight: 'bold' }}>Set Time Limit</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
            </>
            )}
          </GlassPanel>
        </View>
    </>
    );
  };

  const renderMapControls = () => (
    <>
      {/* Map Controls */}
        <View style={[styles.mapControls, !isDesktop && selectedSpot && { bottom: 300 }, { pointerEvents: 'box-none' as any }]}>
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
    </>
  );

  const renderBookingSheet = () => (
    <>
      {/* Booking Sheet (Simplified) */}
        {selectedSpot && (
          <View style={[isDesktop ? { marginTop: 16 } : styles.bookingSheetWrapper, { pointerEvents: 'box-none' as any }]}>
            <GlassPanel borderRadius={tokens.radii.upperSheet} style={isDesktop ? [styles.bookingSheet, { marginBottom: 0, marginHorizontal: 0 }] : styles.bookingSheet}>
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotName}>{selectedSpot.name}</Text>
                  <Text style={styles.spotDetails}>
                    {selectedSpot.host} • {selectedSpot.type === 'private' ? 'Private space' : 'Municipal parking'}
                    {selectedSpot.evCharging ? ' • EV Charging' : ''}
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

              <TouchableOpacity 
                style={[styles.reserveButton, { marginTop: 12, backgroundColor: tokens.colors.white, borderWidth: 1, borderColor: '#E5E7EB' }]} 
                onPress={() => setDetailsVisible(true)}
              >
                <Text style={[styles.reserveButtonText, { color: tokens.colors.primaryText }]}>See Details</Text>
              </TouchableOpacity>
            </GlassPanel>
          </View>
        )}
    </>
  );

  const renderModal = () => (
    <>
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
                <Text style={styles.sectionLabel}>{vehicles.length > 0 ? 'Select Vehicle' : 'License Plate'}</Text>
                {vehicles.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {vehicles.map((v) => (
                      <TouchableOpacity 
                        key={v.id} 
                        style={[styles.vehicleChip, selectedVehicleId === v.id && styles.vehicleChipSelected]}
                        onPress={() => {
                          setSelectedVehicleId(v.id);
                          setVehiclePlate(v.plate);
                        }}
                      >
                        <Ionicons name="car" size={16} color={selectedVehicleId === v.id ? tokens.colors.white : tokens.colors.primaryText} style={{ marginRight: 6 }} />
                        <Text style={[styles.vehicleChipText, selectedVehicleId === v.id && styles.vehicleChipTextSelected]}>
                          {v.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      style={[styles.vehicleChip, selectedVehicleId === 'custom' && styles.vehicleChipSelected]}
                      onPress={() => setSelectedVehicleId('custom')}
                    >
                      <Ionicons name="pencil" size={16} color={selectedVehicleId === 'custom' ? tokens.colors.white : tokens.colors.primaryText} style={{ marginRight: 6 }} />
                      <Text style={[styles.vehicleChipText, selectedVehicleId === 'custom' && styles.vehicleChipTextSelected]}>
                        Custom
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}

                {selectedVehicleId === 'custom' && (
                  <TextInput
                    style={styles.plateInput}
                    placeholder="e.g. B 10 PRK"
                    value={vehiclePlate}
                    onChangeText={setVehiclePlate}
                    autoCapitalize="characters"
                    placeholderTextColor={tokens.colors.secondaryText}
                  />
                )}
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
                  <Text style={styles.receiptLabel}>Parking ({formatDurationDisplay(totalDurationMinutes)} × {selectedSpot.price} RON/hr)</Text>
                  <Text style={styles.receiptValue}>{baseParkingCost.toFixed(2)} RON</Text>
                </View>
                {parkPlusTimeDeductionMinutes > 0 && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Park Plus time benefit (15 min)</Text>
                    <Text style={styles.discountValue}>-{timeDeductionValue.toFixed(2)} RON</Text>
                  </View>
                )}
                {isParkPlusActive && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Park Plus discount (15%)</Text>
                    <Text style={styles.discountValue}>-{parkPlusDiscount.toFixed(2)} RON</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Security Deposit (Refundable)</Text>
                  <Text style={[styles.receiptValue, hasAnyPass && styles.waivedValue]}>{hasAnyPass ? 'WAIVED' : `${securityDeposit} RON`}</Text>
                </View>
                {appliedPass && (
                  <Text style={styles.passAppliedText}>{appliedPass.name} applied · GPS check-in enabled</Text>
                )}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total</Text>
                  <Text style={styles.receiptTotalValue}>{(parkingCost + securityDeposit).toFixed(2)} RON</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.reserveButton} onPress={() => {
                setModalVisible(false);
                (navigation as any).navigate('PaymentCheckout', {
                  amount: parkingCost + securityDeposit,
                  title: `Book ${selectedSpot.name}`,
                  actionType: 'BOOKING',
                  targetId: selectedSpot.id,
                  startTime: (() => {
                    const d = new Date();
                    d.setHours(Math.floor(actualStartMinutes / 60), actualStartMinutes % 60, 0, 0);
                    return toBucharestDBTime(d).toISOString();
                  })(),
                  endTime: (() => {
                    const startD = new Date();
                    startD.setHours(Math.floor(actualStartMinutes / 60), actualStartMinutes % 60, 0, 0);
                    const d = new Date();
                    d.setHours(Math.floor(departureMinutes / 60), departureMinutes % 60, 0, 0);
                    if (d <= startD) {
                      d.setDate(d.getDate() + 1);
                    }
                    return toBucharestDBTime(d).toISOString();
                  })()
                });
              }}>
                <Text style={styles.reserveButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </GlassPanel>
          </View>
        </Modal>
      )}

      {/* Details Modal */}
      {selectedSpot && (
        <Modal visible={isDetailsVisible} transparent={true} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setDetailsVisible(false)}>
            <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
              <GlassPanel borderRadius={16} style={styles.modalContent}>
                <View style={[styles.modalHeader, { borderBottomWidth: 0, paddingBottom: 8 }]}>
                  <Text style={styles.spotName}>Space Details</Text>
                </View>

                <View style={[styles.modalSection, { borderTopWidth: 0 }]}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => setPhotoZoomed(true)}>
                    <View style={{ width: '100%', height: 160, backgroundColor: '#E5E7EB', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                      <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                      <Text style={{ marginTop: 8, color: '#6B7280', fontFamily: tokens.typography.body }}>Photo Placeholder</Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.sectionLabel}>Address</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
                    <Text style={[styles.spotDetails, { color: tokens.colors.primaryText, flex: 1, marginRight: 8 }]} selectable={true}>
                      {selectedSpot.address}
                    </Text>
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => {
                      try {
                        Clipboard.setString(selectedSpot.address);
                      } catch (e) {
                        console.warn("Clipboard not available");
                      }
                    }}>
                      <Ionicons name="copy-outline" size={20} color={tokens.colors.primaryText} />
                    </TouchableOpacity>
                  </View>

                  {selectedSpot.type === 'private' && selectedSpot.spotNumber && (
                    <>
                      <Text style={styles.sectionLabel}>Spot Number</Text>
                      <Text style={[styles.spotDetails, { color: tokens.colors.primaryText, marginBottom: 16 }]} selectable={true}>
                        {selectedSpot.spotNumber}
                      </Text>
                    </>
                  )}
                </View>
              </GlassPanel>
            </Pressable>
          </Pressable>

          {isPhotoZoomed && (
            <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }]} onPress={() => setPhotoZoomed(false)}>
              <Ionicons name="image-outline" size={120} color="#9CA3AF" />
              <Text style={{ marginTop: 24, color: '#9CA3AF', fontFamily: tokens.typography.body, fontSize: 18 }}>Photo Placeholder</Text>
            </Pressable>
          )}
        </Modal>
      )}
    </>
  );


  const handleEndReservation = async () => {
    if (!activeReservation) return;
    try {
      await apiClient.put(`/bookings/${activeReservation.id}/status`, { status: 'COMPLETED' });
      setActiveReservation(null);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/spots`);
      const data = await res.json();
      if (res.ok) setSpots(data.spots);
    } catch (err) {
      console.error('Failed to end reservation', err);
    }
  };

  const renderActiveReservation = () => {
    if (!activeReservation) return null;
    
    // time calculation
    const end = fromBucharestDBTime(new Date(activeReservation.endTime));
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    
    return (
      <View style={styles.activeReservationContainer}>
        <GlassPanel style={styles.activeReservationPanel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time" size={24} color={tokens.colors.municipalTeal} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: tokens.typography.heading, fontSize: 18, color: tokens.colors.primaryText }}>Active Parking</Text>
            </View>
            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#059669', fontFamily: tokens.typography.body, fontWeight: '600' }}>{diffMins} min left</Text>
            </View>
          </View>
          <Text style={{ fontFamily: tokens.typography.body, fontSize: 16, color: tokens.colors.secondaryText, marginBottom: 16 }}>
            You have an active reservation at {activeReservation.spot?.name || 'a spot'}.
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: tokens.colors.accentAction, padding: 16, borderRadius: 12, alignItems: 'center' }}
            onPress={handleEndReservation}
          >
            <Text style={{ color: tokens.colors.white, fontFamily: tokens.typography.heading, fontSize: 16 }}>End Reservation Early</Text>
          </TouchableOpacity>
        </GlassPanel>
      </View>
    );
  };

  return (
    <>
      {isDesktop ? (
        <View style={[styles.container, { flexDirection: 'row' }]}>
          <View style={{ width: 420, height: '100%', backgroundColor: tokens.colors.paleMapBackground, zIndex: 10, boxShadow: '4px 0px 12px rgba(0,0,0,0.1)', padding: 16 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {renderActiveReservation()}
                {renderSearchPanel()}
                {renderBookingSheet()}
              </ScrollView>
            </SafeAreaView>
          </View>
          <View style={{ flex: 1, position: 'relative' }}>
            {renderMap()}
            {renderMapControls()}
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {renderMap()}
          <SafeAreaView style={[styles.safeArea, { pointerEvents: 'box-none' as any }]}>
            {renderActiveReservation()}
            {renderSearchPanel()}
            {renderMapControls()}
            {renderBookingSheet()}
          </SafeAreaView>
        </View>
      )}
      {renderModal()}
    </>
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
  activeReservationContainer: {
    margin: 16,
    zIndex: 100,
    pointerEvents: 'box-none' as any,
  },
  activeReservationPanel: {
    padding: 20,
    backgroundColor: tokens.colors.white,
    borderColor: tokens.colors.municipalTeal,
    borderWidth: 2,
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
    flexShrink: 0,
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
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.primaryText,
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
    minWidth: 0,
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
    minWidth: 0,
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
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
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
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  vehicleChipSelected: {
    backgroundColor: tokens.colors.primaryText,
  },
  vehicleChipText: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    color: tokens.colors.primaryText,
  },
  vehicleChipTextSelected: {
    color: tokens.colors.white,
    fontWeight: '600',
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
  discountValue: {
    fontFamily: tokens.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.availabilityGreen,
  },
  waivedValue: {
    color: tokens.colors.availabilityGreen,
  },
  passAppliedText: {
    fontFamily: tokens.typography.body,
    fontSize: 11,
    color: tokens.colors.availabilityGreen,
    marginTop: 2,
    marginBottom: 4,
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
