import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface User {
  email: string;
  name: string;
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

const Landing = ({ user, onLogout }: LandingProps) => {
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentDescription, setIncidentDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // --- Fetch Taxi Ranks ---
  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch('/api/taxi-ranks?page=0&size=1000', {
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
      fetchTaxiRanks();
      return;
    }
    try {
      const res = await fetch(`/api/taxi-ranks/search?query=${encodeURIComponent(query)}`, {
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
      const res = await fetch('/api/incidents', {
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

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/incidents', {
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
    const ws = new WebSocket('ws://localhost:8080/ws/incidents');
    ws.onmessage = (event) => {
      const incident: Incident = mapIncident(JSON.parse(event.data));
      setIncidents((prev) => [...prev, incident]);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    fetchTaxiRanks();
    fetchIncidents();
  }, []);

  const handleLogout = () => onLogout();

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
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <ToastContainer position="top-center" theme="dark" />
      <div className="w-full max-w-6xl bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Welcome, {user.name}!</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition"
          >
            Logout
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
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
            className="w-full p-3 rounded-lg bg-gray-900 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Map */}
        <div className="overflow-hidden rounded-xl border border-white/20 shadow-lg mb-6">
          <MapContainer
            center={[-26.2044, 28.0473]}
            zoom={14}
            style={{ height: '500px', width: '100%' }}
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
        </div>

        {/* Incident Reporting Form */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Report an Incident</h2>
          <form onSubmit={submitIncident} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Describe the incident..."
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-900 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Landing;
