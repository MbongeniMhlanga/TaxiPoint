import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const Landing = ({ user }: LandingProps) => {
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

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
        background: red;
        color: white;
        font-weight: bold;
        text-align: center;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        line-height: 30px;
        border: 2px solid white;
        font-size: 14px;
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
      toast.error('Failed to fetch taxi ranks');
    }
  };

  const searchTaxiRanks = async (query: string) => {
    if (!query.trim()) {
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
      const data = await res.json();
      setTaxiRanks(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to search taxi ranks');
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
      const data = await res.json();
      setIncidents(data.map(mapIncident));
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to fetch incidents');
    }
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const ws = new WebSocket('wss:https://taxipoint-backend.onrender.com/ws/incidents');
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
    <ul className="list-disc list-inside">
      {Object.entries(hours).map(([day, time]) => (
        <li key={day}><b>{day}:</b> {time}</li>
      ))}
    </ul>
  );

  const renderFacilities = (facilities: Record<string, any>) => (
    <ul className="list-disc list-inside">
      {Object.entries(facilities).map(([name, value]) => (
        <li key={name}>{name}: {String(value)}</li>
      ))}
    </ul>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ToastContainer position="top-center" theme="dark" />

      {/* Full Screen Map */}
      <MapContainer
        center={[-26.2044, 28.0473]}
        zoom={14}
        style={{ height: '100vh', width: '100vw' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Taxi Ranks */}
        {taxiRanks.map((rank) => (
          <Marker
            key={`taxi-${rank.id}`}
            position={[rank.latitude, rank.longitude]}
            icon={taxiIcon}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">🚖 {rank.name}</h3>
                {rank.description && <p><b>Description:</b> {rank.description}</p>}
                <p><b>Address:</b> {rank.address}</p>
                <p><b>District:</b> {rank.district}</p>
                {rank.routesServed.length > 0 && <p><b>Routes:</b> {rank.routesServed.join(', ')}</p>}
                {rank.phone && <p><b>Phone:</b> {rank.phone}</p>}
                {rank.hours && <div><b>Hours:</b>{renderHours(rank.hours)}</div>}
                {rank.facilities && <div><b>Facilities:</b>{renderFacilities(rank.facilities)}</div>}
                {rank.distanceMeters !== undefined && (
                  <p><b>Distance:</b> {(rank.distanceMeters / 1000).toFixed(2)} km</p>
                )}
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
            <Popup>
              {group.incidents.map((incident) => (
                <div key={incident.id} className="mb-2">
                  🚨 <b>{incident.reporter}</b>: {incident.description}
                  <br />
                  📍 <b>Location:</b> {incident.formattedAddress}
                  <br />
                  <small>{new Date(incident.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Search Bar - Top Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/20">
          <input
            type="text"
            placeholder="Search taxi ranks by name, district, or routes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (searchTimeout) clearTimeout(searchTimeout);
              const timeout = setTimeout(() => {
                searchTaxiRanks(e.target.value);
              }, 300);
              setSearchTimeout(timeout);
            }}
            className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Zoom Controls - Right Side */}
      <div className="absolute top-20 right-4 z-[1000] flex flex-col space-y-2">
        <button className="bg-white/95 backdrop-blur-lg p-3 rounded-lg shadow-lg border border-white/20 hover:bg-white transition">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button className="bg-white/95 backdrop-blur-lg p-3 rounded-lg shadow-lg border border-white/20 hover:bg-white transition">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Report Incident Button - Bottom Right */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <button
          onClick={() => setShowIncidentForm(!showIncidentForm)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition transform hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Incident Reporting Form - Bottom Overlay */}
      {showIncidentForm && (
        <div className="absolute bottom-20 left-4 right-4 z-[1000]">
          <div className="bg-white/95 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-600">Report an Incident</h2>
              <button
                onClick={() => setShowIncidentForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={submitIncident} className="flex flex-col space-y-4">
              <input
                type="text"
                placeholder="Describe the incident..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                required
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Report Incident
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Welcome Message - Top Left */}
      <div className="absolute top-4 left-4 right-4 z-[999] pointer-events-none">
        <div className="bg-blue-500/90 backdrop-blur-lg rounded-lg px-4 py-2 text-white text-sm font-medium shadow-lg">
          Welcome to TaxiPoint, {user.name}!
        </div>
      </div>
    </div>
  );
};

export default Landing;