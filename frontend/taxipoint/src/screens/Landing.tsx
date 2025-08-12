import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface User {
  email: string;
  role?: string;
}

interface LandingProps {
  user: User;
  onLogout: () => void;
}

// Fix default icon issue in Leaflet when using React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const taxiRanks = [
  { id: 1, name: 'Noord Taxi Rank', position: [ -26.198994210900764, 28.047953539238694] },
  { id: 2, name: 'Wanderes Taxi Rank', position: [-26.19802346982102, 28.044844241410118] },
  { id: 3, name: 'Enkomeni Taxi Rank', position: [-26.199147086918053, 28.05813659392256] },
];

const Landing = ({ user, onLogout }: LandingProps) => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={onLogout}>Logout</button>

      <MapContainer
        center={[-26.2044, 28.0473]}
        zoom={12}
        style={{ height: '500px', width: '100%', marginTop: 20 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {taxiRanks.map((rank) => (
          <Marker key={rank.id} position={rank.position}>
            <Popup>{rank.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Landing;
