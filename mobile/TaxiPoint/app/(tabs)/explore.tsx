import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
type SpeechErrorEvent = any;
type SpeechResultsEvent = any;
// 🛡️ Safely stub Voice for Expo Go compatibility
const Voice: any = null;

interface TaxiRank {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  routesServed: string[];
  hours: Record<string, string>;
  phone: string;
  facilities: Record<string, any>;
  distanceMeters?: number;
}

interface Incident {
  id: string;
  description: string;
  reporter: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  formattedAddress: string;
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  // Use theme-aware colors
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];

  const textColor = colors.text;
  const bgColor = colors.background;
  const iconColor = colors.icon;
  const placeholderColor = colors.textSecondary;
  const secondaryBgColor = colors.secondaryBackground;

  // Explicitly separate border and primary colors
  const borderColor = colors.border;
  const primaryColor = colors.tint;

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({ latitude: -26.2044, longitude: 28.0473 });
  const [mapReady, setMapReady] = useState(false);

  // 🔑 REFACTORED STATE: Master list (all ranks) and the currently displayed list
  const [allTaxiRanks, setAllTaxiRanks] = useState<TaxiRank[]>([]);
  const [displayedTaxiRanks, setDisplayedTaxiRanks] = useState<TaxiRank[]>([]);
  const [selectedRank, setSelectedRank] = useState<TaxiRank | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TaxiRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);

  // 🎙️ Voice Search States
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceResults, setVoiceResults] = useState<string[]>([]);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);

  // Request location permissions (No change)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'TaxiPoint Location Permission',
            message: 'TaxiPoint needs access to your location to show nearby taxi ranks',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting location permission:', err);
        return false;
      }
    }
    return true; // iOS permissions handled via app.json
  };

  // Helper function for Levenshtein distance (Fuzzy Search)
  const levenshteinDistance = (a: string, b: string) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // ...existing code...

  // 🔑 REFACTORED: Sets both the master list and the displayed list initially
  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`);
      const data = await res.json();
      const ranks = data.content || [];
      setAllTaxiRanks(ranks);
      setDisplayedTaxiRanks(ranks); // Display all ranks by default
    } catch (err) {
      console.error('Error fetching taxi ranks:', err);
      Alert.alert('Error', 'Failed to fetch taxi ranks');
    }
  };

  // 🔑 REFACTORED: Intelligent Client-Side Search
  const searchTaxiRanks = async (query: string) => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      setShowSearchResults(false);
      setDisplayedTaxiRanks(allTaxiRanks);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // 1. Exact/Substring Match
    let matches = allTaxiRanks.filter(rank =>
      rank.name.toLowerCase().includes(lowerQuery) ||
      rank.district.toLowerCase().includes(lowerQuery) ||
      rank.address.toLowerCase().includes(lowerQuery) ||
      (rank.routesServed && rank.routesServed.some(route => route.toLowerCase().includes(lowerQuery)))
    );

    // 2. Fuzzy Match (if few results)
    if (matches.length < 3) {
      const fuzzyMatches = allTaxiRanks.filter(rank => {
        // Don't include if already matched
        if (matches.find(m => m.id === rank.id)) return false;

        const distName = levenshteinDistance(lowerQuery, rank.name.toLowerCase());
        const distDistrict = levenshteinDistance(lowerQuery, rank.district.toLowerCase());

        // Threshold: Allow 2 typos for short words, 3 for longer
        const threshold = lowerQuery.length > 4 ? 3 : 2;
        return distName <= threshold || distDistrict <= threshold;
      });
      matches = [...matches, ...fuzzyMatches];
    }

    setDisplayedTaxiRanks(matches);
    setFilteredSuggestions(matches.slice(0, 5));
    setShowSearchResults(true);
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`);
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  const submitIncident = async () => {
    if (!incidentDescription.trim()) {
      Alert.alert('Error', 'Please describe the incident');
      return;
    }

    setSubmittingIncident(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: incidentDescription,
          reporter: 'Mobile User',
          latitude: userLocation?.latitude || -26.2044,
          longitude: userLocation?.longitude || 28.0473,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit incident');

      Alert.alert('Success', 'Incident reported successfully!');
      setIncidentDescription('');
      setShowIncidentForm(false);
      fetchIncidents();
    } catch (err) {
      console.error('Error submitting incident:', err);
      Alert.alert('Error', 'Failed to report incident');
    } finally {
      setSubmittingIncident(false);
    }
  };

  // Get user's current location
  const getUserLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      if (mapRef.current && mapReady) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      }
    } catch (err) {
      console.error('Expo Location error:', err);
      setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
    }
  };

  const initializeData = async (isRefresh = false) => {
    // 5-second safety timeout for loading state
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 5000);

    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      await getUserLocation();
      // Only fetch the initial, full list here
      await Promise.all([
        fetchTaxiRanks().catch(e => console.error('Ranks fetch error:', e)),
        fetchIncidents().catch(e => console.error('Incidents fetch error:', e))
      ]);
    } catch (error) {
      console.error('Data initialization error:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initializeData();

    // Real-time WebSockets
    const connections: WebSocket[] = [];

    const connectWebSockets = () => {
      // 1. Incidents Socket
      try {
        const incidentWs = new WebSocket('wss://taxipoint-backend.onrender.com/ws/incidents');
        incidentWs.onmessage = (event) => {
          const incident = JSON.parse(event.data);
          setIncidents((prev) => {
            const exists = prev.find(i => i.id === incident.id);
            if (exists) return prev.map(i => i.id === incident.id ? incident : i);
            return [incident, ...prev];
          });
        };
        connections.push(incidentWs);
      } catch (e) { console.error('WS Incidents error:', e); }

      // 2. Taxi Ranks Socket
      try {
        const rankWs = new WebSocket('wss://taxipoint-backend.onrender.com/ws/ranks');
        rankWs.onmessage = (event) => {
          const rank = JSON.parse(event.data);
          setAllTaxiRanks((prev) => {
            const exists = prev.find(r => r.id === rank.id);
            if (exists) return prev.map(r => r.id === rank.id ? rank : r);
            return [...prev, rank];
          });
          // Also update displayed list if not searching
          setDisplayedTaxiRanks(prev => {
            const exists = prev.find(r => r.id === rank.id);
            if (exists) return prev.map(r => r.id === rank.id ? rank : r);
            return [...prev, rank];
          });
        };
        connections.push(rankWs);
      } catch (e) { console.error('WS Ranks error:', e); }
    };

    connectWebSockets();

    return () => {
      connections.forEach(ws => ws.close());
    };
  }, []);

  // NEW: Animate map once ready and user location is available
  useEffect(() => {
    if (mapReady && userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [mapReady, userLocation]);

  // 🎙️ Voice Search Effect
  useEffect(() => {
    if (!Voice) {
      setVoiceAvailable(false);
      return;
    }

    setVoiceAvailable(true);

    Voice.onSpeechStart = () => setIsVoiceListening(true);
    Voice.onSpeechEnd = () => setIsVoiceListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Speech Error:', e);
      setIsVoiceListening(false);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setSearchQuery(text);
        searchTaxiRanks(text);
      }
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setSearchQuery(text);
        searchTaxiRanks(text);
      }
    };

    return () => {
      if (Voice && typeof Voice.destroy === 'function') {
        try {
          Voice.destroy().then(() => {
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          }).catch((err: any) => console.error('Voice destroy error:', err));
        } catch (e) {
          console.log('Voice cleanup skipped');
        }
      }
    };
  }, []);

  const startVoiceSearch = async () => {
    if (!voiceAvailable || !Voice || typeof Voice.start !== 'function') {
      Alert.alert('Voice Search', 'Voice search is not supported on this device or platform.');
      return;
    }
    try {
      setSearchQuery('');
      setIsVoiceListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Start Voice Error:', e);
      setIsVoiceListening(false);
    }
  };

  const stopVoiceSearch = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
      setIsVoiceListening(false);
    } catch (e) {
      console.error('Stop Voice Error:', e);
    }
  };

  const cancelVoiceSearch = async () => {
    try {
      if (Voice && typeof Voice.cancel === 'function') {
        await Voice.cancel();
      }
      setIsVoiceListening(false);
      setSearchQuery('');
      searchTaxiRanks('');
    } catch (e) {
      console.error('Cancel Voice Error:', e);
    }
  };

  const RankCard = ({ rank }: { rank: TaxiRank }) => (
    <TouchableOpacity
      style={[styles.rankCard, { backgroundColor: secondaryBgColor }]}
      onPress={() => setSelectedRank(rank)}>
      <View style={styles.rankHeader}>
        <ThemedText type="defaultSemiBold" style={styles.rankName}>{rank.name}</ThemedText>
        <ThemedText style={[styles.rankDistrict, { color: iconColor }]}>{rank.district}</ThemedText>
      </View>

      {rank.description && (
        <ThemedText style={styles.rankDescription} numberOfLines={2}>{rank.description}</ThemedText>
      )}

      {rank.routesServed && rank.routesServed.length > 0 && (
        <View style={styles.cardRoutesContainer}>
          <Feather name="truck" size={14} color={primaryColor} />
          <ThemedText style={[styles.cardRoutesText, { color: primaryColor }]}>
            {rank.routesServed.slice(0, 3).join(', ')}{rank.routesServed.length > 3 ? '...' : ''}
          </ThemedText>
        </View>
      )}

      <ThemedText style={styles.rankAddress}>📍 {rank.address}</ThemedText>

      {rank.distanceMeters && (
        <ThemedText style={[styles.rankDistance, { color: primaryColor }]}>
          {(rank.distanceMeters / 1000).toFixed(1)} km away
        </ThemedText>
      )}
    </TouchableOpacity>
  );

  const IncidentCard = ({ incident }: { incident: Incident }) => (
    <View style={[styles.incidentCard, { backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: colors.error }]}>
      <ThemedText style={styles.incidentDescription}>{incident.description}</ThemedText>
      <ThemedText style={[styles.incidentMeta, { color: iconColor }]}>📍 {incident.formattedAddress}</ThemedText>
      <ThemedText style={styles.incidentTime}>{new Date(incident.createdAt).toLocaleTimeString()}</ThemedText>
    </View>
  );

  if (loading || !layoutReady) {
    return (
      <View
        style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}
        onLayout={() => setLayoutReady(true)}
      >
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>Loading Map...</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      {/* Floating Search Bar */}
      <View style={styles.floatingSearchBarContainer}>
        <View style={styles.liveIndicatorContainer}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <ThemedText style={[styles.liveText, { color: textColor }]}>Live</ThemedText>
        </View>
        <View style={[styles.searchBar, { backgroundColor: secondaryBgColor, borderColor: borderColor }]}>
          <Feather name="search" size={20} color={iconColor} style={{ marginRight: 12 }} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Where to?"
            placeholderTextColor={placeholderColor}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchTaxiRanks(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); searchTaxiRanks(''); }}>
              <Feather name="x" size={18} color={placeholderColor} style={{ marginRight: 12 }} />
            </TouchableOpacity>
          )}
          {voiceAvailable && (
            <>
              <View style={styles.voiceSeparator} />
              {isVoiceListening ? (
                <TouchableOpacity onPress={cancelVoiceSearch} style={styles.voiceButtonActive}>
                  <View style={[styles.pulseCircle, { backgroundColor: colors.error }]} />
                  <Feather name="mic-off" size={20} color={colors.error} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={startVoiceSearch}>
                  <Feather name="mic" size={20} color={iconColor} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        {/* Suggestions Dropdown */}
        {showSearchResults && filteredSuggestions.length > 0 && (
          <View style={[styles.suggestionsDropdown, { backgroundColor: secondaryBgColor, borderColor: borderColor, borderWidth: 1 }]}>
            {filteredSuggestions.map((rank) => (
              <TouchableOpacity
                key={rank.id}
                onPress={() => {
                  setSearchQuery(rank.name);
                  setDisplayedTaxiRanks([rank]);
                  setSelectedRank(rank);
                  setShowSearchResults(false);
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: rank.latitude,
                      longitude: rank.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 1000);
                  }
                }}
                style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
              >
                <ThemedText style={{ color: textColor, fontWeight: '600' }}>{rank.name}</ThemedText>
                <ThemedText style={{ fontSize: 12, color: textColor, opacity: 0.8 }}>{rank.address}</ThemedText>
                {rank.routesServed && rank.routesServed.length > 0 && (
                  <ThemedText style={{ fontSize: 11, color: primaryColor, marginTop: 2 }}>
                    🚌 {rank.routesServed.slice(0, 3).join(', ')}{rank.routesServed.length > 3 ? '...' : ''}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: userLocation?.latitude || -26.2044,
            longitude: userLocation?.longitude || 28.0473,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={true}
          moveOnMarkerPress={false}
          showsMyLocationButton={false}>
          {mapReady && (
            <>
              {displayedTaxiRanks
                .filter(rank => typeof rank.latitude === 'number' && typeof rank.longitude === 'number' && !isNaN(rank.latitude))
                .slice(0, 50)
                .map((rank) => (
                  <Marker
                    key={`taxi-${rank.id}`}
                    tracksViewChanges={false}
                    coordinate={{
                      latitude: rank.latitude,
                      longitude: rank.longitude,
                    }}
                    onPress={() => setSelectedRank(rank)}>
                    <View style={[styles.markerBox, { backgroundColor: '#3B82F6' }]}>
                      <Feather name="map-pin" size={24} color="#FFFFFF" />
                    </View>
                  </Marker>
                ))}

              {/* Incident Markers */}
              {incidents
                .filter(incident => typeof incident.latitude === 'number' && typeof incident.longitude === 'number' && !isNaN(incident.latitude))
                .map((incident) => (
                  <Marker
                    key={`incident-${incident.id}`}
                    coordinate={{
                      latitude: incident.latitude,
                      longitude: incident.longitude,
                    }}
                    onPress={() => {
                      Alert.alert(
                        'Reported Incident',
                        `${incident.description}\n\nLocation: ${incident.formattedAddress}`
                      );
                    }}>
                    <View style={[styles.markerBox, { backgroundColor: colors.error }]}>
                      <Feather name="alert-triangle" size={24} color="#FFFFFF" />
                    </View>
                  </Marker>
                ))}

              {/* User Location Marker */}
              {userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number' && (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}>
                  <View style={[styles.markerBox, { backgroundColor: colors.success }]}>
                    <Feather name="user" size={24} color="#FFFFFF" />
                  </View>
                </Marker>
              )}
            </>
          )}
        </MapView>


        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: primaryColor, marginBottom: refreshing ? 0 : 12 }]}
            onPress={() => initializeData(true)}>
            {refreshing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name="rotate-cw" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: primaryColor, marginBottom: 12 }]}
            onPress={() => {
              if (userLocation && mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 1000);
              }
            }}>
            <Feather name="crosshair" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.error, flexDirection: 'row', width: 'auto', paddingHorizontal: 16 }]}
            onPress={() => setShowIncidentForm(true)}>
            <Feather name="alert-triangle" size={20} color="#fff" />
            <ThemedText style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>Report</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incident Form Modal */}
      <Modal
        visible={showIncidentForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIncidentForm(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: bgColor },
            ]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Report a Safety Concern
              </ThemedText>
              <TouchableOpacity onPress={() => setShowIncidentForm(false)}>
                <Feather name="x" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.incidentInput,
                {
                  color: textColor,
                  backgroundColor: secondaryBgColor,
                  borderColor: borderColor,
                },
              ]}
              placeholder="Describe the incident..."
              placeholderTextColor={placeholderColor}
              multiline={true}
              numberOfLines={4}
              value={incidentDescription}
              onChangeText={setIncidentDescription}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: primaryColor, opacity: submittingIncident ? 0.6 : 1 }]}
              onPress={submitIncident}
              disabled={submittingIncident}>
              {submittingIncident ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  Submit Report
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedRank}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRank(null)}
      >
        <View style={styles.rankModalOverlay}>
          <View style={[styles.rankModalContent, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            {selectedRank && (
              <>
                <LinearGradient
                  colors={[primaryColor, '#9333EA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.rankModalHeader}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedRank(null)}
                    style={styles.closeRankModalButton}
                  >
                    <Feather name="x" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.rankModalHeaderContent}>
                    <View style={styles.largeIconBg}>
                      <Feather name="map-pin" size={28} color={primaryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.rankModalTitleWhite}>{selectedRank.name}</ThemedText>
                      <ThemedText style={styles.rankModalSubtitleWhite}>{selectedRank.district}</ThemedText>
                    </View>
                  </View>
                </LinearGradient>

                <ScrollView style={styles.rankModalBody} contentContainerStyle={{ paddingBottom: 40 }}>
                  {selectedRank.description ? (
                    <View style={styles.section}>
                      <ThemedText style={[styles.sectionHeader, { color: textColor }]}>About</ThemedText>
                      <ThemedText style={[styles.sectionText, { color: placeholderColor }]}>{selectedRank.description}</ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.section}>
                    <ThemedText style={[styles.sectionHeader, { color: textColor }]}>Location</ThemedText>
                    <View style={styles.infoRow}>
                      <Feather name="map-pin" size={20} color={placeholderColor} />
                      <ThemedText style={[styles.sectionText, { color: placeholderColor, flex: 1 }]}>{selectedRank.address}</ThemedText>
                    </View>
                  </View>

                  {selectedRank.routesServed && selectedRank.routesServed.length > 0 && (
                    <View style={styles.section}>
                      <ThemedText style={[styles.sectionHeader, { color: textColor }]}>Routes Served</ThemedText>
                      <View style={styles.routesContainer}>
                        {selectedRank.routesServed.map((route, idx) => (
                          <View key={idx} style={[styles.routeBadge, { backgroundColor: primaryColor + '20', borderColor: primaryColor }]}>
                            <Feather name="truck" size={12} color={primaryColor} />
                            <ThemedText style={[styles.routeBadgeText, { color: primaryColor }]}>{route}</ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedRank.phone ? (
                    <View style={styles.section}>
                      <ThemedText style={[styles.sectionHeader, { color: textColor }]}>Contact</ThemedText>
                      <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4', borderColor: isDark ? '#14532D' : '#BBF7D0' }]}
                        onPress={() => Linking.openURL(`tel:${selectedRank.phone}`)}
                      >
                        <View style={styles.phoneIconBg}>
                          <Feather name="phone" size={20} color="#FFFFFF" />
                        </View>
                        <View>
                          <ThemedText style={{ color: placeholderColor, fontSize: 12 }}>Call Now</ThemedText>
                          <ThemedText style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{selectedRank.phone}</ThemedText>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:0,0?q=${selectedRank.latitude},${selectedRank.longitude}(${selectedRank.name})`,
                        android: `geo:0,0?q=${selectedRank.latitude},${selectedRank.longitude}(${selectedRank.name})`,
                        default: `https://www.google.com/maps/search/?api=1&query=${selectedRank.latitude},${selectedRank.longitude}`
                      });
                      Linking.openURL(url!);
                    }}
                  >
                    <LinearGradient
                      colors={[primaryColor, '#9333EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.navigateButtonGradient}
                    >
                      <Feather name="navigation" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <ThemedText style={styles.navigateButtonText}>Get Directions</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  floatingSearchBarContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsDropdown: {
    borderRadius: 12,
    marginTop: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f0f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30, // Uber-style pill shape
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    fontWeight: '500',
  },
  voiceSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  rankCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankHeader: {
    marginBottom: 8,
  },
  rankName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rankDistrict: {
    fontSize: 12,
    opacity: 0.6,
  },
  rankDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  rankAddress: {
    fontSize: 13,
    marginBottom: 8,
  },
  rankDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardRoutesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardRoutesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  incidentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  incidentDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  incidentMeta: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  incidentTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
    opacity: 0.6,
  },
  spacer: {
    height: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    minWidth: 56,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  incidentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callout: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 200,
  },
  rankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rankModalContent: {
    height: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  rankModalHeader: {
    padding: 24,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  closeRankModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    zIndex: 10,
  },
  rankModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  largeIconBg: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12
  },
  rankModalTitleWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  rankModalSubtitleWhite: {
    fontSize: 16,
    color: '#DBEAFE'
  },
  rankModalBody: {
    padding: 24,
    gap: 20,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12
  },
  phoneIconBg: {
    backgroundColor: '#16A34A',
    padding: 8,
    borderRadius: 8
  },
  navigateButton: {
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navigateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  routeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  voiceButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  }
});

