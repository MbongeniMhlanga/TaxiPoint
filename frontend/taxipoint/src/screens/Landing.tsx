import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Interface Definitions ---
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

// --- Landing Component ---
const Landing = ({ user, onLogout }: LandingProps) => {
    const handleLogout = () => {
        onLogout();
    };

    // Fix for default Leaflet icon not showing up
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const taxiIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });

    const taxiRanks = [
        { id: 1, name: "Noord Taxi Rank", position: [-26.1989942, 28.0479535] },
        { id: 2, name: "Wanderers Taxi Rank", position: [-26.1980234, 28.0448442] },
        { id: 3, name: "Enkomeni Taxi Rank", position: [-26.199147, 28.0581365] },
    ];

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
                        style={{ height: "500px", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {taxiRanks.map((rank) => (
                            <Marker key={rank.id} position={rank.position as L.LatLngTuple} icon={taxiIcon}>
                                <Popup>🚖 <b>{rank.name}</b></Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default Landing;
