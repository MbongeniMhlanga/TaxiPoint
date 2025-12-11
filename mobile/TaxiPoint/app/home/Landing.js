import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Animated, Easing, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Voice from '@react-native-voice/voice';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { API_BASE_URL, WS_BASE_URL }  from "../../config";

const { width, height } = Dimensions.get('window');

const FloatingMarker = ({ coordinate, children }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Marker coordinate={coordinate}><Animated.View style={{ transform: [{ translateY: floatAnim }] }}>{children}</Animated.View></Marker>;
};

const Landing = ({ user }) => {
  const [taxiRanks, setTaxiRanks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [region, setRegion] = useState({ latitude: -26.2044, longitude: 28.0473, latitudeDelta: 0.05, longitudeDelta: 0.05 });

  const wsRef = useRef(null);

  const mapRef = useRef();

  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`, { headers: { Authorization: `Bearer ${user.token}` } });
      const data = await res.json();
      setTaxiRanks(data.content || []);
    } catch (err) { console.error(err); Toast.show({ type: 'error', text1: 'Failed to fetch taxi ranks' }); }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/incidents`, { headers: { Authorization: `Bearer ${user.token}` } });
      const data = await res.json();
      setIncidents(data);
    } catch (err) { console.error(err); }
  };

  const searchTaxiRanks = async (query) => {
    if (!query.trim()) { setFilteredSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks/search?query=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${user.token}` } });
      const data = await res.json();
      setFilteredSuggestions(data.slice(0, 5));
      setShowSuggestions(true);
    } catch (err) { console.error(err); Toast.show({ type: 'error', text1: 'Failed to search taxi ranks' }); }
  };

  const startVoiceSearch = async () => {
    Voice.onSpeechResults = (e) => { const text = e.value[0]; setSearchQuery(text); searchTaxiRanks(text); setIsListening(false); };
    Voice.onSpeechError = (e) => { console.error(e); Toast.show({ type: 'error', text1: 'Voice search failed' }); setIsListening(false); };
    try { setIsListening(true); await Voice.start('en-US'); } catch (err) { console.error(err); setIsListening(false); }
  };

  const submitIncident = async () => {
    if (!incidentDescription.trim()) return;
    const tempIncident = { id: `temp-${Date.now()}`, description: incidentDescription, reporter: user.name, latitude: region.latitude, longitude: region.longitude, createdAt: new Date().toISOString(), formattedAddress: 'Fetching location...' };
    setIncidents((prev) => [...prev, tempIncident]);
    setIncidentDescription(''); setShowIncidentForm(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ description: tempIncident.description, reporter: tempIncident.reporter, latitude: pos.coords.latitude, longitude: pos.coords.longitude }) });
          if (!res.ok) throw new Error('Failed to create incident');
          const savedIncident = await res.json();
          setIncidents((prev) => prev.map((i) => (i.id === tempIncident.id ? savedIncident : i)));
          Toast.show({ type: 'success', text1: 'Incident reported!' });
        } catch (err) { console.error(err); setIncidents((prev) => prev.filter((i) => i.id !== tempIncident.id)); Toast.show({ type: 'error', text1: 'Failed to report incident' }); }
      },
      () => Toast.show({ type: 'error', text1: 'Could not get your location' })
    );
  };

  const groupedIncidents = () => {
    const groups = {};
    incidents.forEach((inc) => {
      const key = `${inc.latitude.toFixed(4)}-${inc.longitude.toFixed(4)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(inc);
    });
    return Object.values(groups);
  };

  useEffect(() => {
    fetchTaxiRanks();
    fetchIncidents();

    // WebSocket setup for real-time incidents
    wsRef.current = new WebSocket(`${WS_BASE_URL}/incidents`);
    wsRef.current.onmessage = (msg) => {
      const newIncident = JSON.parse(msg.data);
      setIncidents((prev) => [...prev, newIncident]);
    };
    wsRef.current.onerror = (err) => console.error(err);
    return () => { wsRef.current.close(); };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={region}>
        {taxiRanks.map((rank) => (
          <FloatingMarker key={rank.id} coordinate={{ latitude: rank.latitude, longitude: rank.longitude }}>
            <View style={styles.taxiMarker}><Ionicons name="car" size={28} color="white" /></View>
          </FloatingMarker>
        ))}
        {groupedIncidents().map((group, idx) => (
          <Marker key={`group-${idx}`} coordinate={{ latitude: group[0].latitude, longitude: group[0].longitude }}>
            <View style={styles.incidentMarker}><Text style={styles.incidentCount}>{group.length > 9 ? '9+' : group.length}</Text></View>
          </Marker>
        ))}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput value={searchQuery} onChangeText={(text) => { setSearchQuery(text); searchTaxiRanks(text); }} placeholder="Search taxi ranks, districts..." style={styles.searchInput} />
        <TouchableOpacity onPress={startVoiceSearch} style={styles.voiceButton}><Ionicons name="mic" size={24} color={isListening ? 'red' : 'gray'} /></TouchableOpacity>
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          <FlatList data={filteredSuggestions} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItem} onPress={() => { setSearchQuery(item.name); setShowSuggestions(false); setRegion({ ...region, latitude: item.latitude, longitude: item.longitude }); }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>{item.address}</Text>
            </TouchableOpacity>
          )} />
        </View>
      )}

      {/* Floating Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.nearMeButton} onPress={() => navigator.geolocation.getCurrentPosition((pos) => setRegion({ ...region, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))}>
          <MaterialIcons name="navigation" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportButton} onPress={() => setShowIncidentForm(true)}><Ionicons name="add" size={28} color="white" /></TouchableOpacity>
      </View>

      <Modal isVisible={showIncidentForm} onBackdropPress={() => setShowIncidentForm(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report an Incident</Text>
          <TextInput value={incidentDescription} onChangeText={setIncidentDescription} placeholder="Describe the incident..." multiline style={styles.modalInput} />
          <TouchableOpacity onPress={submitIncident} style={styles.modalButton}><Text style={styles.modalButtonText}>Submit</Text></TouchableOpacity>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  taxiMarker: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white', shadowColor: '#3B82F6', shadowOpacity: 0.5, shadowOffset: { width: 0, height: 10 }, shadowRadius: 10 },
  incidentMarker: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  incidentCount: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  searchContainer: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
  searchInput: { flex: 1, height: 45 },
  voiceButton: { marginLeft: 10 },
  suggestionBox: { position: 'absolute', top: 100, left: 20, right: 20, backgroundColor: 'white', borderRadius: 15, maxHeight: 200, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  fabContainer: { position: 'absolute', bottom: 40, right: 20, flexDirection: 'column', gap: 15 },
  nearMeButton: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 30, marginBottom: 15 },
  reportButton: { backgroundColor: '#EF4444', padding: 16, borderRadius: 30 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 15 },
  modalInput: { height: 80, borderColor: '#ddd', borderWidth: 1, borderRadius: 15, padding: 10, marginBottom: 15, textAlignVertical: 'top' },
  modalButton: { backgroundColor: '#EF4444', padding: 15, borderRadius: 15, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' },
});

export default Landing;
