import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const textColor = isDark ? '#fff' : '#000';
  const bgColor = isDark ? '#000' : '#fff';
  const secondaryBgColor = isDark ? '#1a1a1a' : '#f5f5f5';
  const borderColor = Colors[isDark ? 'dark' : 'light'].tint;

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({ latitude: -26.2044, longitude: 28.0473 });
  const [showMap, setShowMap] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  
  // 🔑 REFACTORED STATE: Master list (all ranks) and the currently displayed list
  const [allTaxiRanks, setAllTaxiRanks] = useState<TaxiRank[]>([]); 
  const [displayedTaxiRanks, setDisplayedTaxiRanks] = useState<TaxiRank[]>([]); 
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TaxiRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);

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

  // Get user's current location (No change)
  const getUserLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
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
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } catch (err) {
      console.error('Geolocation error:', err);
      setUserLocation({ latitude: -26.2044, longitude: 28.0473 });
    }
  };

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

  // 🔑 REFACTORED: Updates only the displayed list based on search results
  const searchTaxiRanks = async (query: string) => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      setShowSearchResults(false);
      setDisplayedTaxiRanks(allTaxiRanks); // Show all ranks when search is empty
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/taxi-ranks/search?query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      setDisplayedTaxiRanks(data); // Update displayed list with search results
      setFilteredSuggestions(data.slice(0, 5));
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Failed to search taxi ranks');
    }
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

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await getUserLocation();
      // Only fetch the initial, full list here
      await Promise.all([fetchTaxiRanks(), fetchIncidents()]); 
      setLoading(false);
    };

    initializeData();

    // WebSocket connection for incidents
    try {
      const ws = new WebSocket('wss://taxipoint-backend.onrender.com/ws/incidents');
      ws.onmessage = (event) => {
        const incident = JSON.parse(event.data);
        setIncidents((prev) => [...prev, incident]);
      };
      return () => ws.close();
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  }, []);

  const RankCard = ({ rank }: { rank: TaxiRank }) => (
    <TouchableOpacity
      style={[styles.rankCard, { backgroundColor: secondaryBgColor }]}
      onPress={() => {
        Alert.alert(rank.name, `${rank.address}\n\nPhone: ${rank.phone || 'N/A'}`);
      }}>
      <View style={styles.rankHeader}>
        <ThemedText style={[styles.rankName, { color: textColor }]}>{rank.name}</ThemedText>
        <ThemedText style={styles.rankDistrict}>{rank.district}</ThemedText>
      </View>

      {rank.description && (
        <ThemedText style={[styles.rankDescription, { color: textColor }]}>
          {rank.description}
        </ThemedText>
      )}

      <ThemedText style={[styles.rankAddress, { color: textColor }]}>
        📍 {rank.address}
      </ThemedText>

      {rank.distanceMeters && (
        <ThemedText style={[styles.rankDistance, { color: borderColor }]}>
          {(rank.distanceMeters / 1000).toFixed(1)} km away
        </ThemedText>
      )}
    </TouchableOpacity>
  );

  const IncidentCard = ({ incident }: { incident: Incident }) => (
    <View style={[styles.incidentCard, { backgroundColor: isDark ? '#4a1f1f' : '#ffe6e6' }]}>
      <ThemedText style={[styles.incidentDescription, { color: textColor }]}>
        {incident.description}
      </ThemedText>
      <ThemedText style={styles.incidentMeta}>
        📍 {incident.formattedAddress}
      </ThemedText>
      <ThemedText style={styles.incidentTime}>
        {new Date(incident.createdAt).toLocaleTimeString()}
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={borderColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'left', 'right']}>
      {/* Map View */}
      {showMap && userLocation && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onMapReady={() => setMapReady(true)}
            showsUserLocation={true}
            showsMyLocationButton={false}>
            {/* Taxi Rank Markers: NOW using displayedTaxiRanks */}
            {displayedTaxiRanks.map((rank) => (
              <Marker
                key={`taxi-${rank.id}`}
                coordinate={{
                  latitude: rank.latitude,
                  longitude: rank.longitude,
                }}
                onPress={() => {
                  Alert.alert(
                    rank.name,
                    `${rank.address}\n\nPhone: ${rank.phone || 'N/A'}\n\nDistrict: ${rank.district}`
                  );
                }}>
                <View style={[styles.markerBox, { backgroundColor: '#3B82F6' }]}>
                  <ThemedText style={styles.markerText}>🚕</ThemedText>
                </View>
              </Marker>
            ))}

            {/* Incident Markers */}
            {incidents.map((incident) => (
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
                <View style={[styles.markerBox, { backgroundColor: '#EF4444' }]}>
                  <ThemedText style={styles.markerText}>⚠️</ThemedText>
                </View>
              </Marker>
            ))}

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}>
                <View style={[styles.markerBox, { backgroundColor: '#10B981' }]}>
                  <ThemedText style={styles.markerText}>📍</ThemedText>
                </View>
              </Marker>
            )}
          </MapView>

          {/* Floating Action Buttons on Map */}
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: borderColor, marginBottom: 12 }]}
              onPress={() => setShowMap(false)}>
              <ThemedText style={styles.fabText}>📋</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fab, { backgroundColor: '#ef4444' }]}
              onPress={() => setShowIncidentForm(true)}>
              <ThemedText style={styles.fabText}>+</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List View */}
      {!showMap && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: secondaryBgColor,
                    borderColor: borderColor,
                  },
                ]}>
                <ThemedText style={styles.searchIcon}>🔍</ThemedText>
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Search taxi ranks..."
                  placeholderTextColor={isDark ? '#888' : '#ccc'}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    // Call search function on change
                    searchTaxiRanks(text); 
                  }}
                />
              </View>
            </View>

            {/* Search Results */}
            {showSearchResults && filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  Search Results
                </ThemedText>
                {/* Use filteredSuggestions (subset of results for quick access) */}
                {filteredSuggestions.map((rank) => (
                  <RankCard key={rank.id} rank={rank} />
                ))}
              </View>
            )}

            {/* Taxi Ranks Section */}
            {!showSearchResults && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    🚕 Nearby Taxi Ranks
                  </ThemedText>
                </View>
                {/* Use displayedTaxiRanks, which is currently allTaxiRanks */}
                {displayedTaxiRanks.length > 0 ? (
                  displayedTaxiRanks.slice(0, 10).map((rank) => <RankCard key={rank.id} rank={rank} />)
                ) : (
                  <ThemedText style={[styles.emptyText, { color: textColor }]}>
                    No taxi ranks found
                  </ThemedText>
                )}
              </>
            )}

            {/* Incidents Section */}
            {!showSearchResults && incidents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                    ⚠️ Reported Incidents ({incidents.length})
                  </ThemedText>
                </View>
                {incidents.slice(0, 5).map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </>
            )}

            <View style={styles.spacer} />
          </ScrollView>

          {/* Floating Action Buttons on List View */}
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: borderColor, marginBottom: 12 }]}
              onPress={() => setShowMap(true)}>
              <ThemedText style={styles.fabText}>🗺️</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fab, { backgroundColor: '#ef4444' }]}
              onPress={() => setShowIncidentForm(true)}>
              <ThemedText style={styles.fabText}>+</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

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
                Report an Incident
              </ThemedText>
              <TouchableOpacity onPress={() => setShowIncidentForm(false)}>
                <ThemedText style={[styles.closeButton, { color: textColor }]}>✕</ThemedText>
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
              placeholderTextColor={isDark ? '#888' : '#ccc'}
              multiline={true}
              numberOfLines={4}
              value={incidentDescription}
              onChangeText={setIncidentDescription}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: borderColor, opacity: submittingIncident ? 0.6 : 1 }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  incidentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
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
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});