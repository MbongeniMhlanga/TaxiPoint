import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Map, Users, AlertTriangle, LogOut, Edit3, Trash2, Plus, Search, Filter } from 'lucide-react';
import ThemeToggle from "../components/ThemeToggle"; // Assuming we want theme toggle here too

// --- Icons ---
// Using Lucide icons imported above instead of inline SVGs for consistency

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

interface TaxiRankForm {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  routesServed: string;
  hours: string;
  phone: string;
  facilities: string;
}

interface AdminPageProps {
  onLogout: () => void;
  user: { email: string; role?: string; token?: string; name?: string };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminPage: React.FC<AdminPageProps> = ({ onLogout, user }) => {
  const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
  const [form, setForm] = useState<TaxiRankForm>({
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    district: "",
    routesServed: "",
    hours: "{}",
    phone: "",
    facilities: "{}",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentRankId, setCurrentRankId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rankToDelete, setRankToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);



  // navigate is removed as it was unused


  // Fetch all taxi ranks
  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch("https://taxipoint-backend.onrender.com/api/taxi-ranks?page=0&size=1000");
      if (!res.ok) throw new Error("Failed to fetch taxi ranks");
      const data = await res.json();
      setTaxiRanks(data.content || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchTaxiRanks();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (rank: TaxiRank) => {
    setIsEditing(true);
    setCurrentRankId(rank.id);
    setForm({
      name: rank.name,
      description: rank.description,
      address: rank.address,
      latitude: rank.latitude,
      longitude: rank.longitude,
      district: rank.district,
      routesServed: Array.isArray(rank.routesServed) ? rank.routesServed.join(", ") : "",
      hours: JSON.stringify(rank.hours),
      phone: rank.phone,
      facilities: JSON.stringify(rank.facilities),
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentRankId(null);
    setForm({
      name: "",
      description: "",
      address: "",
      latitude: 0,
      longitude: 0,
      district: "",
      routesServed: "",
      hours: "{}",
      phone: "",
      facilities: "{}",
    });
    setShowFormModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user.token) {
        toast.error("Authentication token missing. Log in again.");
        setIsLoading(false);
        return;
      }

      if (isEditing && !currentRankId) {
        toast.error("Failed to get taxi rank ID for update.");
        setIsLoading(false);
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        district: form.district,
        routesServed: form.routesServed.split(",").map((r) => r.trim()),
        hours: JSON.parse(form.hours),
        facilities: JSON.parse(form.facilities),
        phone: form.phone,
      };

      const url = isEditing
        ? `https://taxipoint-backend.onrender.com/api/taxi-ranks/${currentRankId}`
        : "https://taxipoint-backend.onrender.com/api/taxi-ranks";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast.error(`Failed to ${isEditing ? "update" : "add"} rank: ${res.status} ${errorText}`);
        setIsLoading(false);
        return;
      }

      toast.success(`Taxi rank ${isEditing ? "updated" : "added"} successfully!`);
      resetForm();
      fetchTaxiRanks();
    } catch (err: any) {
      console.error(err);
      toast.error("Error: Check Hours and Facilities JSON fields.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rankToDelete || !user.token) {
      toast.error("Authentication token or rank ID missing.");
      return;
    }
    setIsLoading(true);
    setShowDeleteModal(false);

    try {
      const res = await fetch(`https://taxipoint-backend.onrender.com/api/taxi-ranks/${rankToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      setTaxiRanks((prev) => prev.filter((rank) => rank.id !== rankToDelete));
      toast.success("Taxi rank deleted successfully!");
    } catch (err: any) {
      toast.error(`Failed to delete rank: ${err.message}`);
    } finally {
      setIsLoading(false);
      setRankToDelete(null);
    }
  };

  // --- Statistics Logic ---
  const totalRanks = taxiRanks.length;
  const districtData = taxiRanks.reduce((acc: any, rank) => {
    const district = rank.district || "Unknown";
    acc[district] = (acc[district] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(districtData).map((key) => ({
    name: key,
    count: districtData[key],
  }));

  const filteredRanks = taxiRanks.filter(rank =>
    rank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rank.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200 transition-colors duration-300">
      <ToastContainer position="top-center" theme="colored" />

      {/* Sidebar (Desktop) / Header (Mobile) could go here, but for now using a simple layout */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <header className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-blue-600 dark:text-blue-400" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">System Operational</span>
            </div>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

          {/* Stats Cards (Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Ranks Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Taxi Ranks</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalRanks}</h3>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <Map size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-500">
                <span>+2.5%</span>
                <span className="text-gray-400 ml-2">from last month</span>
              </div>
            </div>

            {/* Districts Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Districts</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{Object.keys(districtData).length}</h3>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <Filter size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-400">
                <span>Coverage across city</span>
              </div>
            </div>

            {/* Users Card (Placeholder) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">1,240</h3>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-500">
                <span>+12 New</span>
                <span className="text-gray-400 ml-2">today</span>
              </div>
            </div>

            {/* Incidents Card (Placeholder) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Incidents</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">3</h3>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                  <AlertTriangle size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-red-500">
                <span>High Priority</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranks Distribution Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Taxi Ranks per District</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Small Interactive - User Roles (Mock) */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 w-full text-left">User Distribution</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Commuters', value: 800 },
                        { name: 'Drivers', value: 300 },
                        { name: 'Admins', value: 140 },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Commuters', value: 800 },
                        { name: 'Drivers', value: 300 },
                        { name: 'Admins', value: 140 },
                      ].map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0088FE]"></div>Commuters</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00C49F]"></div>Drivers</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#FFBB28]"></div>Admins</div>
              </div>
            </div>
          </div>

          {/* Management Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rank Management</h2>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search ranks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
              <button
                onClick={() => { resetForm(); setShowFormModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 text-sm font-semibold"
              >
                <Plus size={18} /> Add Rank
              </button>
            </div>
          </div>

          {/* Modern Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">District</th>
                    <th className="px-6 py-4">Routes</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredRanks.length > 0 ? (
                    filteredRanks.map((rank) => (
                      <tr key={rank.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{rank.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{rank.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium">
                            {rank.district}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {Array.isArray(rank.routesServed) ? rank.routesServed.join(", ") : ""}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(rank)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => { setRankToDelete(rank.id); setShowDeleteModal(true); }}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No taxi ranks found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Form Modal (Add/Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn border border-gray-100 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? "Edit Taxi Rank" : "Add New Rank"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
                  <input name="district" value={form.district} onChange={handleChange} required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input name="address" value={form.address} onChange={handleChange} required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                  <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                  <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} required className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Routes (comma sep)</label>
                  <input name="routesServed" value={form.routesServed} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours (JSON)</label>
                  <input name="hours" value={form.hours} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facilities (JSON)</label>
                  <input name="facilities" value={form.facilities} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs font-mono" />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button type="button" onClick={resetForm} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition">
                  {isLoading ? "Processing..." : (isEditing ? "Save Changes" : "Create Rank")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700 animate-scaleIn">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Confirm Deletion</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center text-sm">Are you sure you want to delete this taxi rank? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-600/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;