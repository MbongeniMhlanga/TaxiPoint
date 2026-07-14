import { ThemedText } from '@/components/themed-text';
import CorrectionModal from '@/components/correction-modal';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { getErrorMessage } from '@/utils/errorMessage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

// The map module is lazy-loaded below so the screen can fall back safely if it fails.


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
  routeFares?: Record<string, number>;
  hours: Record<string, string>;
  phone: string;
  currency?: string;
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

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

interface ActiveRoute {
  destination: TaxiRank;
  coordinates: { latitude: number; longitude: number }[];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface GooglePlaceSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
}

export default function ExploreScreen() {
  const { user } = useAuth();
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

  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({ latitude: -26.2044, longitude: 28.0473 });
  const [mapReady, setMapReady] = useState(false);

  // 🔑 REFACTORED STATE: Master list (all ranks) and the currently displayed list
  const [allTaxiRanks, setAllTaxiRanks] = useState<TaxiRank[]>([]);
  const [displayedTaxiRanks, setDisplayedTaxiRanks] = useState<TaxiRank[]>([]);
  const [selectedRank, setSelectedRank] = useState<TaxiRank | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TaxiRank[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [mapModules, setMapModules] = useState<{
    MapView: any;
    Marker: any;
    Polyline?: any;
    providerGoogle?: any;
  } | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // 🎙️ Voice Search States
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [layoutReady, setLayoutReady] = useState(true);
  const [tracksView, setTracksView] = useState(true);

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

  const decodePolyline = (encoded: string) => {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates: { latitude: number; longitude: number }[] = [];

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLatitude = (result & 1) ? ~(result >> 1) : (result >> 1);
      latitude += deltaLatitude;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLongitude = (result & 1) ? ~(result >> 1) : (result >> 1);
      longitude += deltaLongitude;

      coordinates.push({
        latitude: latitude / 1e5,
        longitude: longitude / 1e5,
      });
    }

    return coordinates;
  };

  const formatDistance = (meters: number) => {
    if (!Number.isFinite(meters)) {
      return '0 m';
    }

    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }

    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds)) {
      return '0 min';
    }

    const totalMinutes = Math.max(1, Math.round(seconds / 60));
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  };

  const formatFare = (fare: number | undefined, currency?: string) => {
    if (typeof fare !== 'number' || !Number.isFinite(fare)) {
      return null;
    }

    if (!currency || currency.toUpperCase() === 'ZAR') {
      return `R${Math.round(fare)}`;
    }

    return `${currency.toUpperCase()} ${Math.round(fare)}`;
  };

  const getRouteFare = (rank: TaxiRank, route: string) => {
    const fares = rank.routeFares ?? {};
    const exactFare = fares[route];
    if (typeof exactFare === 'number') {
      return exactFare;
    }

    const matchedKey = Object.keys(fares).find((key) => {
      const normalizedKey = key.toLowerCase();
      const normalizedRoute = route.toLowerCase();
      return (
        normalizedKey === normalizedRoute ||
        normalizedKey.includes(normalizedRoute) ||
        normalizedRoute.includes(normalizedKey)
      );
    });

    return matchedKey ? fares[matchedKey] : undefined;
  };

  useEffect(() => {
    setSelectedDestination(null);
  }, [selectedRank?.id]);

  const parseGoogleDuration = (value: unknown) => {
    if (typeof value === 'string') {
      const seconds = Number.parseFloat(value.replace('s', ''));
      return Number.isFinite(seconds) ? seconds : 0;
    }

    return 0;
  };

  const buildRouteInstruction = (step: any) => {
    const instruction = step?.navigationInstruction?.instructions;
    if (typeof instruction === 'string' && instruction.trim().length > 0) {
      return instruction.trim();
    }

    const maneuver = String(step?.navigationInstruction?.maneuver ?? '')
      .replace(/_/g, ' ')
      .toLowerCase();

    if (!maneuver) {
      return 'Continue';
    }

    return maneuver.charAt(0).toUpperCase() + maneuver.slice(1);
  };

  const createAutocompleteSessionToken = () => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  };

  const placeAutocompleteSessionTokenRef = useRef(createAutocompleteSessionToken());
  const suppressAutocompleteRef = useRef(false);

  const getGoogleMapsApiKey = () =>
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    (Constants.expoConfig as any)?.extra?.googleMapsApiKey ||
    process.env.GOOGLE_MAPS_API_KEY ||
    null;

  const fetchGooglePlaceAutocomplete = async (query: string) => {
    const googleMapsApiKey = getGoogleMapsApiKey();
    if (!googleMapsApiKey || query.trim().length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    setPlacesLoading(true);
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleMapsApiKey,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.distanceMeters',
        },
        body: JSON.stringify({
          input: query,
          includeQueryPredictions: false,
          languageCode: 'en-US',
          regionCode: 'za',
          sessionToken: placeAutocompleteSessionTokenRef.current,
          locationBias: userLocation
            ? {
              circle: {
                center: {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                },
                radius: 50000,
              },
            }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Autocomplete request failed with status ${response.status}`);
      }

      const data = await response.json();
      const suggestions = (data?.suggestions ?? [])
        .map((suggestion: any) => suggestion?.placePrediction)
        .filter(Boolean)
        .map((prediction: any) => ({
          placeId: prediction.placeId,
          title: prediction.text?.text ?? prediction.structuredFormat?.mainText?.text ?? 'Suggested place',
          subtitle: prediction.structuredFormat?.secondaryText?.text ?? prediction.text?.text ?? '',
        }))
        .slice(0, 5);

      setPlaceSuggestions(suggestions);
    } catch (error) {
      console.error('Google autocomplete failed:', error);
      setPlaceSuggestions([]);
    } finally {
      setPlacesLoading(false);
    }
  };

  const selectGooglePlaceSuggestion = async (suggestion: GooglePlaceSuggestion) => {
    const googleMapsApiKey = getGoogleMapsApiKey();
    if (!googleMapsApiKey) {
      Alert.alert('Search Unavailable', 'Google Maps is not configured for place details right now.');
      return;
    }

    suppressAutocompleteRef.current = true;
    setSearchQuery(suggestion.title);
    setShowSearchResults(false);
    setPlaceSuggestions([]);

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${suggestion.placeId}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': googleMapsApiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
      });

      if (!response.ok) {
        throw new Error(`Place details request failed with status ${response.status}`);
      }

      const place = await response.json();
      const latitude = place?.location?.latitude;
      const longitude = place?.location?.longitude;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Place details did not include coordinates');
      }

      const routeTarget: TaxiRank = {
        id: place.id || suggestion.placeId,
        name: place.displayName?.text || suggestion.title,
        description: '',
        address: place.formattedAddress || suggestion.subtitle || suggestion.title,
        latitude,
        longitude,
        district: 'Google Place',
        routesServed: [],
        hours: {},
        phone: '',
        facilities: {},
      };

      setSelectedRank(routeTarget);
      suppressAutocompleteRef.current = true;
      placeAutocompleteSessionTokenRef.current = createAutocompleteSessionToken();

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          900
        );
      }
    } catch (error) {
      console.error('Place details load failed:', error);
      Alert.alert('Place Unavailable', 'We could not load that place right now.');
    }
  };

  const clearRoute = () => {
    setActiveRoute(null);
    setRouteError(null);
  };

  const showRouteInApp = async (destination: TaxiRank) => {
    if (!userLocation) {
      Alert.alert('Location Needed', 'Please enable location so TaxiPoint can calculate your route.');
      return;
    }

    setRouteLoading(true);
    setRouteError(null);

    try {
      const googleMapsApiKey =
        Constants.expoConfig?.extra?.googleMapsApiKey ||
        (Constants.expoConfig as any)?.extra?.googleMapsApiKey;

      if (!googleMapsApiKey) {
        throw new Error('Missing Google Maps API key in app configuration');
      }

      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleMapsApiKey,
          'X-Goog-FieldMask': [
            'routes.duration',
            'routes.distanceMeters',
            'routes.polyline.encodedPolyline',
            'routes.legs.steps.distanceMeters',
            'routes.legs.steps.duration',
            'routes.legs.steps.navigationInstruction.instructions',
            'routes.legs.steps.navigationInstruction.maneuver',
          ].join(','),
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude,
              },
            },
          },
          travelMode: 'DRIVE',
          polylineEncoding: 'ENCODED_POLYLINE',
          polylineQuality: 'OVERVIEW',
          languageCode: 'en-US',
          computeAlternativeRoutes: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Route request failed with status ${response.status}`);
      }

      const data = await response.json();
      const route = data?.routes?.[0];

      if (!route?.polyline?.encodedPolyline) {
        throw new Error('No route geometry returned');
      }

      const coordinates = decodePolyline(route.polyline.encodedPolyline);
      const steps = (route?.legs ?? []).flatMap((leg: any) =>
        (leg?.steps ?? []).map((step: any) => ({
          instruction: buildRouteInstruction(step),
          distance: step?.distanceMeters ?? 0,
          duration: parseGoogleDuration(step?.duration ?? step?.staticDuration),
        }))
      );

      setActiveRoute({
        destination,
        coordinates,
        distance: route?.distanceMeters ?? 0,
        duration: parseGoogleDuration(route?.duration),
        steps,
      });
      setSelectedRank(null);
      setShowSearchResults(false);
      setSearchQuery(destination.name);

      if (mapReady && mapRef.current && coordinates.length > 1) {
        setTimeout(() => {
          try {
            mapRef.current?.fitToCoordinates(coordinates, {
              edgePadding: { top: 120, right: 80, bottom: 280, left: 80 },
              animated: true,
            });
          } catch (fitError) {
            console.warn('Route fit error:', fitError);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Route load failed:', error);
      setRouteError('We could not load in-app directions right now.');
      Alert.alert('Route Unavailable', 'We could not load directions inside the app right now. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  };

  // ...existing code...

  // 🔑 REFACTORED: Sets both the master list and the displayed list initially
  const fetchTaxiRanks = async () => {
    try {
      console.log('Fetching taxi ranks...');
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`, {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });

      if (!res.ok) {
        const errorMessage = getErrorMessage(res.status, await res.text(), 'taxi-ranks');
        console.warn('Taxi ranks fetch failed:', res.status);
        Alert.alert('Taxi Ranks Unavailable', errorMessage);
        return;
      }

      const data = await res.json();
      // Handle both Page object and direct arrays
      const ranks = data.content || (Array.isArray(data) ? data : []);
      console.log(`Received ${ranks.length} taxi ranks`);

      setAllTaxiRanks(ranks);
      setDisplayedTaxiRanks(ranks);
    } catch (err) {
      console.error('Error fetching taxi ranks:', err);
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

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (suppressAutocompleteRef.current) {
        suppressAutocompleteRef.current = false;
        return;
      }

      const query = searchQuery.trim();
      void searchTaxiRanks(query);

      if (!query) {
        setPlaceSuggestions([]);
        setPlacesLoading(false);
        placeAutocompleteSessionTokenRef.current = createAutocompleteSessionToken();
        return;
      }

      void fetchGooglePlaceAutocomplete(query).then(() => {
        if (cancelled) {
          setPlaceSuggestions([]);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, userLocation]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, {
        headers: { 'Authorization': `Bearer ${user?.token || ''}` }
      });
      if (!res.ok) {
        throw new Error(getErrorMessage(res.status, await res.text(), 'incidents'));
      }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify({
          description: incidentDescription,
          reporter: user ? `${user.name || ''} ${user.surname || ''}`.trim() || 'Mobile User' : 'Mobile User',
          latitude: userLocation?.latitude || -26.2044,
          longitude: userLocation?.longitude || 28.0473,
        }),
      });

      if (!res.ok) {
        throw new Error(getErrorMessage(res.status, await res.text(), 'incidents'));
      }

      Alert.alert('Success', 'Incident reported successfully!');
      setIncidentDescription('');
      setShowIncidentForm(false);
      fetchIncidents();
    } catch (err) {
      console.error('Error submitting incident:', err);
      Alert.alert('Report Failed', err instanceof Error ? err.message : 'We could not submit the incident right now.');
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
      // Use the proper /ws endpoint
      try {
        const socketUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
        console.log('Connecting to WS:', socketUrl);
        const ws = new WebSocket(socketUrl);

        ws.onopen = () => console.log('WS Connection established');
        ws.onerror = (e) => console.log('WS error:', e);
        connections.push(ws);
      } catch (e) {
        console.warn('WS Init error:', e);
      }
    };

    connectWebSockets();

    return () => {
      connections.forEach(ws => ws.close());
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMapModule = async () => {
      try {
        if (Platform.OS === 'web') {
          setMapLoadError('Map view is not available on web.');
          setMapModules(null);
          return;
        }

        const maps = (await import('react-native-maps')) as any;
        const LoadedMapView = maps.default ?? maps.MapView;
        const LoadedMarker = maps.Marker;

        if (!LoadedMapView || !LoadedMarker) {
          throw new Error('react-native-maps did not expose the expected components');
        }

        if (isMounted) {
          setMapModules({
            MapView: LoadedMapView,
            Marker: LoadedMarker,
            Polyline: maps.Polyline,
            providerGoogle: maps.PROVIDER_GOOGLE,
          });
          setMapLoadError(null);
        }
      } catch (error) {
        console.error('Map module load failed:', error);
        if (isMounted) {
          setMapModules(null);
          setMapLoadError('Map view could not be initialized on this device.');
        }
      }
    };

    void loadMapModule();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure markers render fully then freeze them for performance/stability
  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksView(false);
    }, 3000);
    return () => clearTimeout(timer);
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
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 12, opacity: 0.6 }}>Loading Map...</ThemedText>
      </View>
    );
  }

  const MapViewComponent: any = mapModules?.MapView;
  const MarkerComponent: any = mapModules?.Marker;
  const PolylineComponent: any = mapModules?.Polyline;

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
            onChangeText={setSearchQuery}
          />
          {placesLoading ? (
            <ActivityIndicator size="small" color={iconColor} style={{ marginRight: 10 }} />
          ) : null}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilteredSuggestions([]);
                setPlaceSuggestions([]);
                setShowSearchResults(false);
                setDisplayedTaxiRanks(allTaxiRanks);
                placeAutocompleteSessionTokenRef.current = createAutocompleteSessionToken();
              }}
            >
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
        {showSearchResults && (placeSuggestions.length > 0 || filteredSuggestions.length > 0) && (
          <View style={[styles.suggestionsDropdown, { backgroundColor: secondaryBgColor, borderColor: borderColor, borderWidth: 1 }]}>
            {placeSuggestions.length > 0 && (
              <View style={{ marginBottom: filteredSuggestions.length > 0 ? 10 : 0 }}>
                <ThemedText style={[styles.suggestionsSectionTitle, { color: placeholderColor }]}>
                  Places
                </ThemedText>
                {placeSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.placeId}
                    onPress={() => {
                      void selectGooglePlaceSuggestion(suggestion);
                    }}
                    style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
                  >
                    <ThemedText style={{ color: textColor, fontWeight: '600' }}>{suggestion.title}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: textColor, opacity: 0.8 }}>{suggestion.subtitle}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {filteredSuggestions.length > 0 && (
              <View>
                <ThemedText style={[styles.suggestionsSectionTitle, { color: placeholderColor }]}>
                  Taxi Ranks
                </ThemedText>
              </View>
            )}

            {filteredSuggestions.map((rank) => (
              <TouchableOpacity
                key={rank.id}
                onPress={() => {
                  suppressAutocompleteRef.current = true;
                  setSearchQuery(rank.name);
                  setDisplayedTaxiRanks([rank]);
                  setSelectedRank(rank);
                  setShowSearchResults(false);
                  setPlaceSuggestions([]);
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
        {MapViewComponent && MarkerComponent ? (
          <MapViewComponent
            ref={mapRef}
            provider={Platform.OS === 'android' ? mapModules?.providerGoogle : undefined}
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
            {activeRoute && PolylineComponent && activeRoute.coordinates.length > 1 && (
              <PolylineComponent
                coordinates={activeRoute.coordinates}
                strokeWidth={5}
                strokeColor={primaryColor}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {mapReady && (
              <>
                {displayedTaxiRanks
                  .filter(rank => rank.latitude && rank.longitude)
                  .slice(0, 30)
                  .map((rank) => (
                    <MarkerComponent
                      key={`taxi-${rank.id}`}
                      tracksViewChanges={tracksView}
                      anchor={{ x: 0.5, y: 0.5 }}
                      opacity={1}
                      coordinate={{
                        latitude: parseFloat(rank.latitude.toString()),
                        longitude: parseFloat(rank.longitude.toString()),
                      }}
                      onPress={() => setSelectedRank(rank)}>
                      <View style={styles.webStyleMarkerCircle} />
                    </MarkerComponent>
                  ))}

                {/* Incident Markers */}
                {incidents
                  .filter(incident =>
                    typeof incident.latitude === 'number' &&
                    typeof incident.longitude === 'number' &&
                    !isNaN(incident.latitude) &&
                    !isNaN(incident.longitude)
                  )
                  .map((incident) => (
                    <MarkerComponent
                      key={`incident-${incident.id}`}
                      tracksViewChanges={tracksView}
                      anchor={{ x: 0.5, y: 0.5 }}
                      opacity={1}
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
                      <View style={styles.webStyleMarkerCircleRed} />
                    </MarkerComponent>
                  ))}

                {/* User Location Marker */}
                {userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number' && (
                  <MarkerComponent
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}>
                    <View style={[styles.markerBox, { backgroundColor: colors.success }]} />
                  </MarkerComponent>
                )}
              </>
            )}
          </MapViewComponent>
        ) : (
          <View style={[styles.mapFallback, { backgroundColor: secondaryBgColor, borderColor }]}>
            <Feather name="map" size={34} color={primaryColor} />
            <ThemedText type="defaultSemiBold" style={[styles.mapFallbackTitle, { color: textColor }]}>
              Map unavailable
            </ThemedText>
            <ThemedText style={[styles.mapFallbackText, { color: placeholderColor }]}>
              {mapLoadError ?? 'We could not load the map view on this device. You can still browse taxi ranks and incidents below.'}
            </ThemedText>
          </View>
        )}

        {/* Floating Action Buttons */}
        <View style={[styles.fabContainer, activeRoute ? styles.fabContainerLifted : null]}>
          <TouchableOpacity
            style={styles.modernFab}
            onPress={() => initializeData(true)}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.fabGradient}
            >
              {refreshing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name="rotate-cw" size={22} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {MapViewComponent && MarkerComponent ? (
            <TouchableOpacity
              style={styles.modernFab}
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
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.fabGradient}
              >
                <Feather name="crosshair" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.modernFabLarge}
            onPress={() => setShowIncidentForm(!showIncidentForm)}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.fabGradientLarge}
            >
              <Feather name="plus" size={30} color="#fff" style={{ transform: [{ rotate: showIncidentForm ? '45deg' : '0deg' }] }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {activeRoute && (
          <View style={[styles.routePanel, { backgroundColor: bgColor, borderColor }]}>
            <View style={styles.routePanelHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedText type="defaultSemiBold" style={[styles.routePanelTitle, { color: textColor }]}>
                  In-App Directions
                </ThemedText>
                <ThemedText style={[styles.routePanelSubtitle, { color: placeholderColor }]}>
                  {activeRoute.destination.name}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={clearRoute} style={[styles.routeCloseButton, { backgroundColor: secondaryBgColor }]}>
                <Feather name="x" size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.routeStatsRow}>
              <View style={[styles.routeStatChip, { backgroundColor: secondaryBgColor }]}>
                <Feather name="map-pin" size={14} color={primaryColor} />
                <ThemedText style={[styles.routeStatText, { color: textColor }]}>
                  {formatDistance(activeRoute.distance)}
                </ThemedText>
              </View>
              <View style={[styles.routeStatChip, { backgroundColor: secondaryBgColor }]}>
                <Feather name="clock" size={14} color={primaryColor} />
                <ThemedText style={[styles.routeStatText, { color: textColor }]}>
                  {formatDuration(activeRoute.duration)}
                </ThemedText>
              </View>
            </View>

            {routeError ? (
              <ThemedText style={[styles.routeErrorText, { color: colors.error }]}>
                {routeError}
              </ThemedText>
            ) : null}

            <ScrollView
              style={styles.routeStepsScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {activeRoute.steps.slice(0, 6).map((step, index) => (
                <View key={`${activeRoute.destination.id}-step-${index}`} style={styles.routeStepRow}>
                  <View style={[styles.routeStepIndex, { backgroundColor: primaryColor }]}>
                    <ThemedText style={styles.routeStepIndexText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.routeStepContent}>
                    <ThemedText style={[styles.routeStepText, { color: textColor }]}>
                      {step.instruction}
                    </ThemedText>
                    <ThemedText style={[styles.routeStepMeta, { color: placeholderColor }]}>
                      {formatDistance(step.distance)} • {formatDuration(step.duration)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Incident Form Modal */}
      <Modal
        visible={showIncidentForm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIncidentForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
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
                autoFocus={true}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedRank}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setSelectedRank(null);
          setShowCorrectionModal(false);
        }}
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
                    onPress={() => {
                      setSelectedRank(null);
                      setShowCorrectionModal(false);
                    }}
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
                      <ThemedText style={[styles.sectionHeader, { color: textColor }]}>Destinations Served</ThemedText>

                      {selectedDestination ? (
                        <View style={[styles.selectedRouteCard, { backgroundColor: secondaryBgColor, borderColor: borderColor }]}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.selectedRouteLabel, { color: primaryColor }]}>Selected Route</ThemedText>
                            <ThemedText style={[styles.selectedRouteTitle, { color: textColor }]}>{selectedDestination}</ThemedText>
                          </View>
                          {formatFare(getRouteFare(selectedRank, selectedDestination), selectedRank.currency) ? (
                            <View style={[styles.selectedFarePill, { backgroundColor: bgColor }]}>
                              <ThemedText style={[styles.selectedFareText, { color: primaryColor }]}>
                                {formatFare(getRouteFare(selectedRank, selectedDestination), selectedRank.currency)}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.routeListContainer}>
                        {selectedRank.routesServed.map((route, idx) => {
                          const routeFare = formatFare(getRouteFare(selectedRank, route), selectedRank.currency);
                          const isSelected = selectedDestination === route;

                          return (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => setSelectedDestination(route)}
                              style={[
                                styles.routeRow,
                                {
                                  backgroundColor: isSelected ? secondaryBgColor : bgColor,
                                  borderColor: isSelected ? primaryColor : borderColor,
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              <View style={styles.routeRowLeft}>
                                <View style={[styles.routeRowIcon, { backgroundColor: primaryColor + '15' }]}>
                                  <Feather name="map-pin" size={16} color={primaryColor} />
                                </View>
                                <ThemedText style={[styles.routeRowTitle, { color: textColor }]}>{route}</ThemedText>
                              </View>
                              <View style={styles.routeRowRight}>
                                {routeFare ? (
                                  <ThemedText style={[styles.routeRowFare, { color: primaryColor }]}>{routeFare}</ThemedText>
                                ) : null}
                                <Feather name="chevron-right" size={18} color={placeholderColor} />
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {selectedDestination ? (
                        <ThemedText style={[styles.routeCompareText, { color: placeholderColor }]}>
                          {formatFare(getRouteFare(selectedRank, selectedDestination), selectedRank.currency)
                            ? 'Tap another destination to compare fares.'
                            : 'No fare recorded at the moment.'}
                        </ThemedText>
                      ) : null}
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
                    style={[styles.secondaryActionButton, { borderColor: borderColor, backgroundColor: secondaryBgColor }]}
                    onPress={() => setShowCorrectionModal(true)}
                  >
                    <Feather name="alert-circle" size={18} color={primaryColor} style={{ marginRight: 8 }} />
                    <ThemedText style={[styles.secondaryActionText, { color: textColor }]}>Suggest a correction</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.navigateButton}
                    onPress={() => {
                      void showRouteInApp(selectedRank);
                    }}
                  >
                    <LinearGradient
                      colors={[primaryColor, '#9333EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.navigateButtonGradient}
                    >
                      {routeLoading ? (
                        <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                      ) : (
                        <Feather name="navigation" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      )}
                      <ThemedText style={styles.navigateButtonText}>
                        {routeLoading ? 'Loading Route...' : 'Show Route in App'}
                      </ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <CorrectionModal
        isVisible={showCorrectionModal && !!selectedRank}
        rank={selectedRank}
        user={user}
        onClose={() => setShowCorrectionModal(false)}
      />
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
  suggestionsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 2,
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
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  mapFallbackTitle: {
    marginTop: 14,
    fontSize: 18,
    textAlign: 'center',
  },
  mapFallbackText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  webStyleMarkerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webStyleMarkerCircleRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgMarkerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  modernFabLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGradientLarge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    bottom: 90,
    right: 20,
    zIndex: 2000,
  },
  fabContainerLifted: {
    bottom: 280,
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
  secondaryActionButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  routePanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    zIndex: 2100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  routePanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routePanelTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  routePanelSubtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  routeCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  routeStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  routeStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  routeErrorText: {
    fontSize: 13,
    marginBottom: 10,
  },
  routeStepsScroll: {
    maxHeight: 170,
  },
  routeStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  routeStepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  routeStepIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  routeStepContent: {
    flex: 1,
  },
  routeStepText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  routeStepMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  routesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  routeListContainer: {
    gap: 10,
    marginTop: 4,
  },
  selectedRouteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  selectedRouteLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedRouteTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedFarePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedFareText: {
    fontSize: 13,
    fontWeight: '800',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  routeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  routeRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  routeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  routeRowFare: {
    fontSize: 12,
    fontWeight: '800',
  },
  routeCompareText: {
    marginTop: 10,
    fontSize: 12,
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
  routeFareText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
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
