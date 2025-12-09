import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '../context/ThemeContext';
import { Search, Mic, MapPin, Navigation, Plus, X } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  role: string;
  token: string;
}

interface LandingProps {
  user: User;
  onLogout: () => void;
}

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

// New component to handle map navigation
const MapController = ({ selectedLocation }: { selectedLocation: { lat: number; lng: number } | null }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 16, {
        duration: 1.5,
      });
    }
  }, [selectedLocation, map]);

  return null;
};

// Component for the custom zoom controls
const ZoomControls = () => {
  const map = useMap();

  return (
    <div className="absolute top-24 right-4 z-[1000] flex flex-col space-y-2">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200"
      >
        <Plus size={20} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200"
      >
        <span className="text-xl font-bold leading-none">-</span>
      </button>
    </div>
  );
};

const Landing = ({ user }: LandingProps) => {
  const { theme } = useTheme();
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<TaxiRank[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Leaflet default icon fix
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  const taxiIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  const createIncidentDivIcon = (count: number) =>
    L.divIcon({
      html: `<div style="
        background: #ef4444; 
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        line-height: 30px;
        border: 2px solid white;
        font-size: 14px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">${count > 9 ? '9+' : count}</div>`,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });

  // --- Fetch Nearby Taxi Ranks ---
  const fetchNearbyTaxiRanks = async (lat: number, lng: number, radius: number = 5000) => {
    try {
      const res = await fetch(
        `https://taxipoint-backend.onrender.com/api/taxi-ranks/nearby?lat=${lat}&lng=${lng}&radius_m=${radius}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch nearby taxi ranks');
      const data = await res.json();
      setTaxiRanks(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to fetch nearby taxi ranks');
    }
  };

  // --- Fallback: All Taxi Ranks ---
  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch('https://taxipoint-backend.onrender.com/api/taxi-ranks?page=0&size=1000', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setTaxiRanks(data.content || []);
    } catch (err: any) {
      console.error(err);
      //toast.error('Failed to fetch taxi ranks');
    }
  };

  const searchTaxiRanks = async (query: string) => {
    if (!query.trim()) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchNearbyTaxiRanks(pos.coords.latitude, pos.coords.longitude),
          () => fetchTaxiRanks()
        );
      } else {
        fetchTaxiRanks();
      }
      return;
    }
    try {
      const res = await fetch(`https://taxipoint-backend.onrender.com/api/taxi-ranks/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        const errorText = await res.text(); // log the actual backend error
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setTaxiRanks(data);
      setFilteredSuggestions(data.slice(0, 5));
      setShowSuggestions(true);

    } catch (err: any) {
      console.error("Search API error:", err);
      toast.error("Failed to search taxi ranks");
      setShowSuggestions(false);
    }
  };

  const mapIncident = (incident: any): Incident => ({
    id: incident.id,
    description: incident.description,
    reporter: incident.reporter,
    createdAt: incident.createdAt,
    latitude: incident.latitude || 0,
    longitude: incident.longitude || 0,
    formattedAddress: incident.formattedAddress || 'Unknown',
  });

  const fetchIncidents = async () => {
    try {
      const res = await fetch('https://taxipoint-backend.onrender.com/api/incidents', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch incidents');
      }
      const data = await res.json();
      setIncidents(data.map(mapIncident));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to fetch incidents. Please try again later.');
    }
  };

  const submitIncident = async () => {
    if (!incidentDescription.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const tempIncident: Incident = {
      id: tempId,
      description: incidentDescription,
      reporter: user.name,
      latitude: -26.2044,
      longitude: 28.0473,
      createdAt: new Date().toISOString(),
      formattedAddress: 'Fetching location...',
    };

    setIncidents((prev) => [...prev, tempIncident]);
    setIncidentDescription('');
    setShowIncidentForm(false);

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('https://taxipoint-backend.onrender.com/api/incidents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              description: tempIncident.description,
              reporter: tempIncident.reporter,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          if (!res.ok) throw new Error('Failed to create incident');

          const savedIncident = await res.json();
          setIncidents((prev) =>
            prev.map((i) => (i.id === tempId ? mapIncident(savedIncident) : i))
          );
          toast.success('Incident reported successfully!');
        } catch (err: any) {
          console.error(err);
          setIncidents((prev) => prev.filter((i) => i.id !== tempId));
          toast.error('Failed to report incident');
        }
      },
      (err) => {
        console.error(err);
        toast.error('Could not get your location.');
      }
    );
  };

  const handleSuggestionClick = (rank: TaxiRank) => {
    setSearchQuery(rank.name);
    setIsSearchFocused(false);
    setShowSuggestions(false);

    console.log('Attempting to navigate to:', { lat: rank.latitude, lng: rank.longitude });
    // Navigate to the selected taxi rank location
    setSelectedLocation({
      lat: rank.latitude,
      lng: rank.longitude
    });
  };

  const handleSearchBlur = () => {
    // Delay to allow suggestion clicks to register
    setTimeout(() => {
      if (!searchQuery.trim()) {
        setIsSearchFocused(false);
      }
      setShowSuggestions(false);
    }, 200);
  };

  const handleVoiceSearch = () => {
    // Mock voice search functionality for modern UI demo
    if (!('webkitSpeechRecognition' in window)) {
      toast.info("Voice search is not supported in this browser.");
      return;
    }

    setIsListening(true);
    toast.info("Listening... Speak now.");

    // In a real app we'd use the Web Speech API here
    // For now we simulate it or just show the UI state
    setTimeout(() => {
      setIsListening(false);
      // Simulate receiving "Johannesburg"
      // setSearchQuery("Johannesburg");
    }, 3000);
  };

  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          toast.success("Zooming to your location");
          fetchNearbyTaxiRanks(pos.coords.latitude, pos.coords.longitude);
        },
        () => toast.error("Could not retrieve location")
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  // --- Group incidents by location ---
  const groupIncidentsByLocation = (incidents: Incident[]) => {
    const groups: Record<string, Incident[]> = {};
    const precision = 4;
    incidents.forEach((incident) => {
      const key = `${incident.latitude.toFixed(precision)}-${incident.longitude.toFixed(precision)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(incident);
    });
    return Object.values(groups).map((incidents) => ({
      latitude: incidents[0].latitude,
      longitude: incidents[0].longitude,
      incidents,
    }));
  };

  useEffect(() => {
    const ws = new WebSocket('wss://taxipoint-backend.onrender.com/ws/incidents');
    ws.onmessage = (event) => {
      const incident: Incident = mapIncident(JSON.parse(event.data));
      setIncidents((prev) => [...prev, incident]);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchNearbyTaxiRanks(pos.coords.latitude, pos.coords.longitude),
        () => fetchTaxiRanks()
      );
    } else {
      fetchTaxiRanks();
    }
    fetchIncidents();
  }, []);

  const renderHours = (hours: Record<string, string>) => (
    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
      {Object.entries(hours).map(([day, time]) => (
        <li key={day}><span className="font-medium">{day}:</span> {time}</li>
      ))}
    </ul>
  );



  return (
    <div className="relative w-full h-full overflow-hidden">
      <ToastContainer position="top-center" theme={theme === 'dark' ? 'dark' : 'light'} />

      {/* Full Screen Map */}
      <MapContainer
        center={[-26.2044, 28.0473]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CartoDB'
          url={theme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />

        {/* Map Controller for Navigation */}
        <MapController selectedLocation={selectedLocation} />

        {/* Custom Zoom Controls */}
        <ZoomControls />

        {/* Taxi Ranks */}
        {taxiRanks.map((rank) => (
          <Marker
            key={`taxi-${rank.id}`}
            position={[rank.latitude, rank.longitude]}
            icon={taxiIcon}
          >
            <Popup className="custom-popup">
              <div className="min-w-[250px] space-y-2">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Navigation size={16} className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{rank.name}</h3>
                    <p className="text-xs text-gray-500">{rank.district}</p>
                  </div>
                </div>

                {rank.description && <p className="text-sm text-gray-700 dark:text-gray-300">{rank.description}</p>}

                <div className="space-y-1 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin size={14} className="mt-1 flex-shrink-0 text-gray-400" />
                    <span>{rank.address}</span>
                  </p>
                </div>

                {rank.hours && (
                  <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                    <p className="font-semibold mb-1">Hours</p>
                    {renderHours(rank.hours)}
                  </div>
                )}

                <button
                  onClick={() => toast.info("Navigate feature coming soon!")}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                >
                  Navigate Here
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Groups */}
        {groupIncidentsByLocation(incidents).map((group, idx) => (
          <Marker
            key={`group-${idx}`}
            position={[group.latitude, group.longitude]}
            icon={createIncidentDivIcon(group.incidents.length)}
          >
            <Popup className="custom-popup">
              <div className="min-w-[200px]">
                <h3 className="font-bold text-red-600 mb-2 border-b pb-1">Reported Incidents ({group.incidents.length})</h3>
                {group.incidents.map((incident) => (
                  <div key={incident.id} className="mb-3 last:mb-0 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(incident.createdAt).toLocaleTimeString()} • {new Date(incident.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Modern Search Bar */}
      <div className={`absolute left-4 right-4 md:left-[50%] md:transform md:-translate-x-[50%] md:w-[600px] z-[1001] transition-all duration-300 ease-in-out ${isSearchFocused ? 'top-4' : 'top-6'}`}>
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all ${isSearchFocused ? 'ring-4 ring-blue-500/10' : ''}`}>
          <div className="relative flex items-center p-2">
            <div className="flex-shrink-0 pl-3 pr-2 text-gray-400">
              <Search size={20} />
            </div>

            <input
              type="text"
              placeholder="Search taxi ranks, districts..."
              value={searchQuery}
              onFocus={() => {
                setIsSearchFocused(true);
                if (searchQuery.trim()) setShowSuggestions(true);
              }}
              onBlur={handleSearchBlur}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchTimeout) clearTimeout(searchTimeout);
                const timeout = setTimeout(() => {
                  searchTaxiRanks(e.target.value);
                }, 300);
                setSearchTimeout(timeout);
              }}
              className="flex-1 bg-transparent p-2 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                  setShowSuggestions(false);
                  searchTaxiRanks('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            )}

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2"></div>

            <button
              onClick={handleVoiceSearch}
              className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`}
            >
              <Mic size={20} />
            </button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 max-h-80 overflow-y-auto w-full">
              {filteredSuggestions.map((rank) => (
                <button
                  key={rank.id}
                  onClick={() => handleSuggestionClick(rank)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-b-0 flex items-start gap-3"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{rank.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rank.address}</p>
                    {rank.distanceMeters && <p className="text-xs font-medium text-blue-600 mt-0.5">{(rank.distanceMeters / 1000).toFixed(1)} km away</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button: Near Me */}
      <div className="absolute bottom-28 right-4 z-[1000] flex flex-col gap-3">
        <button
          onClick={handleNearMe}
          className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          title="Go to my location"
        >
          <Navigation size={24} className="transform -rotate-45" />
        </button>

        <button
          onClick={() => setShowIncidentForm(!showIncidentForm)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-lg shadow-red-600/30 transition transform hover:scale-105"
          title="Report Incident"
        >
          <div className="relative">
            <Plus size={24} className={`transform transition-transform duration-300 ${showIncidentForm ? 'rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* Incident Reporting Form - Modern Bottom Sheet/Card */}
      {showIncidentForm && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-20 md:bottom-28 md:w-96 z-[1002]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Report an Incident
              </h2>
              <button
                onClick={() => setShowIncidentForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                <textarea
                  rows={3}
                  placeholder="What's happening? (e.g., Heavy traffic, Accident, Protest)"
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition resize-none"
                  required
                />
              </div>

              <button
                onClick={submitIncident}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all transform active:scale-95"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;