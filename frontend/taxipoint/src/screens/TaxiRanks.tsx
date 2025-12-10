import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation, X, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { toast } from 'react-toastify';

interface User {
    id: number;
    email: string;
    name: string;
    surname: string;
    role: string;
    token: string;
}

interface TaxiRanksProps {
    user: User;
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

const TaxiRanks: React.FC<TaxiRanksProps> = ({ user }) => {
    const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
    const [selectedRank, setSelectedRank] = useState<TaxiRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTaxiRanks();
    }, []);

    const fetchTaxiRanks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const data = await res.json();
            setTaxiRanks(data.content || []);
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to fetch taxi ranks');
        } finally {
            setLoading(false);
        }
    };

    const filteredRanks = taxiRanks.filter(rank =>
        rank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHours = (hours: Record<string, string>) => {
        if (!hours || Object.keys(hours).length === 0) return <p className="text-sm text-gray-500">Not available</p>;
        return Object.entries(hours).map(([day, time]) => (
            <div key={day} className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{day}:</span>
                <span className="text-gray-600 dark:text-gray-400">{time}</span>
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading taxi ranks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Taxi Ranks Directory</h1>
                    <p className="text-gray-600 dark:text-gray-400">Browse all available taxi ranks and their information</p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <input
                        type="text"
                        placeholder="Search by name, district, or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </motion.div>

                {/* Taxi Ranks Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredRanks.map((rank, index) => (
                        <motion.div
                            key={rank.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => setSelectedRank(rank)}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{rank.name}</h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{rank.district}</p>
                                </div>
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                    <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="mt-1 flex-shrink-0 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{rank.address}</p>
                                </div>
                                {rank.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="flex-shrink-0 text-gray-400" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{rank.phone}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline">
                                    View Details →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {filteredRanks.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No taxi ranks found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedRank && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedRank(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
                                <button
                                    onClick={() => setSelectedRank(null)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-1">{selectedRank.name}</h2>
                                        <p className="text-blue-100">{selectedRank.district}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Description */}
                                {selectedRank.description && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">About</h3>
                                        <p className="text-gray-600 dark:text-gray-300">{selectedRank.description}</p>
                                    </div>
                                )}

                                {/* Address */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Location</h3>
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                                        <MapPin size={20} className="mt-1 flex-shrink-0" />
                                        <p>{selectedRank.address}</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                {selectedRank.phone && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Contact</h3>
                                        <a
                                            href={`tel:${selectedRank.phone}`}
                                            className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition group"
                                        >
                                            <div className="bg-green-600 p-2 rounded-lg text-white group-hover:scale-110 transition">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Call Now</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRank.phone}</p>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {/* Hours */}
                                {selectedRank.hours && Object.keys(selectedRank.hours).length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Clock size={20} />
                                            Operating Hours
                                        </h3>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2">
                                            {renderHours(selectedRank.hours)}
                                        </div>
                                    </div>
                                )}

                                {/* Routes */}
                                {selectedRank.routesServed && selectedRank.routesServed.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Routes Served</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRank.routesServed.map((route, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                                                >
                                                    {route}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Navigate Button */}
                                <button
                                    onClick={() => {
                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedRank.latitude},${selectedRank.longitude}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                                >
                                    <Navigation size={20} />
                                    Get Directions
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaxiRanks;
