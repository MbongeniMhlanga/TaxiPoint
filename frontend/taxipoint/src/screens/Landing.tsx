import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const Landing = ({ user, onLogout }: LandingProps) => {
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);

  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch('/api/taxi-ranks?page=0&size=1000', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch taxi ranks');
      const data = await res.json();
      setTaxiRanks(data.content || []);
    } catch (err: any) {
      console.error(err);
      alert('Error fetching taxi ranks: ' + err.message);
    }
  };

  useEffect(() => {
    fetchTaxiRanks();
  }, []);

  const handleLogout = () => onLogout();

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

  // Helper to render hours nicely
  const renderHours = (hours: Record<string, string>) => (
    <ul className="list-disc list-inside">
      {Object.entries(hours).map(([day, time]) => (
        <li key={day}><b>{day}:</b> {time}</li>
      ))}
    </ul>
  );

  // Helper to render facilities nicely
  const renderFacilities = (facilities: Record<string, any>) => (
    <ul className="list-disc list-inside">
      {Object.entries(facilities).map(([name, value]) => (
        <li key={name}>{name}: {String(value)}</li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-5xl p-6 border border-white/20 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Welcome, {user.name}!</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition"
          >
            Logout
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/20 shadow-lg animate-slideUp">
          <MapContainer
            center={[-26.2044, 28.0473]}
            zoom={14}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {taxiRanks.map((rank) => (
              <Marker
                key={rank.id}
                position={[rank.latitude, rank.longitude]}
                icon={taxiIcon}
              >
                <Popup>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">🚖 {rank.name}</h3>
                    {rank.description && <p><b>Description:</b> {rank.description}</p>}
                    <p><b>Address:</b> {rank.address}</p>
                    <p><b>District:</b> {rank.district}</p>
                    {rank.routesServed.length > 0 && (
                      <p><b>Routes:</b> {rank.routesServed.join(', ')}</p>
                    )}
                    {rank.phone && <p><b>Phone:</b> {rank.phone}</p>}
                    {rank.hours && (
                      <div>
                        <b>Hours:</b>
                        {renderHours(rank.hours)}
                      </div>
                    )}
                    {rank.facilities && (
                      <div>
                        <b>Facilities:</b>
                        {renderFacilities(rank.facilities)}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Landing;
