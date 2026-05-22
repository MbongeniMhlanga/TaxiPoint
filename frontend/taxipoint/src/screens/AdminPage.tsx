import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Map, Users, AlertTriangle, LogOut, Edit3, Trash2, Plus, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import ThemeToggle from "../components/ThemeToggle"; // Assuming we want theme toggle here too
import { API_BASE_URL } from "../config";

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
  routeFares?: Record<string, number>;
  hours: Record<string, string>;
  phone: string;
  currency?: string;
  facilities: Record<string, any>;
}

interface CorrectionSubmission {
  id: string;
  rankId?: string | null;
  rankNameSnapshot?: string | null;
  correctionType: string;
  description: string;
  details?: Record<string, any> | null;
  status: string;
  confirmationsCount: number;
  rejectionsCount: number;
  autoApproved: boolean;
  submittedByUserId?: number | null;
  submittedByEmail?: string | null;
  submittedByName?: string | null;
  reviewedByEmail?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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

interface RouteFareDraft {
  route: string;
  fare: string;
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
  const [routeFareMap, setRouteFareMap] = useState<Record<string, number>>({});
  const [routeFareDraft, setRouteFareDraft] = useState<RouteFareDraft>({ route: "", fare: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [currentRankId, setCurrentRankId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rankToDelete, setRankToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [pendingCorrections, setPendingCorrections] = useState<CorrectionSubmission[]>([]);
  const [reviewNotesDrafts, setReviewNotesDrafts] = useState<Record<string, string>>({});

  // Statistics state
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeIncidents, setActiveIncidents] = useState<number>(0);
  const [userStats, setUserStats] = useState<{ users: number; admins: number; total: number }>({ users: 0, admins: 0, total: 0 });



  // navigate is removed as it was unused


  // Fetch all taxi ranks
  const fetchTaxiRanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000&includeInactive=true`);
      if (!res.ok) throw new Error("Failed to fetch taxi ranks");
      const data = await res.json();
      setTaxiRanks(data.content || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchPendingCorrections = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/pending`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch correction submissions");
      }

      const data = await res.json();
      setPendingCorrections(data || []);
    } catch (err: any) {
      console.error('Failed to fetch pending corrections:', err);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      // Fetch total users
      const usersRes = await fetch(`${API_BASE_URL}/api/stats/users/count`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (usersRes.ok) {
        const count = await usersRes.json();
        setTotalUsers(count);
      }

      // Fetch active incidents
      const incidentsRes = await fetch(`${API_BASE_URL}/api/stats/incidents/active`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (incidentsRes.ok) {
        const count = await incidentsRes.json();
        setActiveIncidents(count);
      }

      // Fetch user statistics
      const statsRes = await fetch(`${API_BASE_URL}/api/stats/users/distribution`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setUserStats(stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  useEffect(() => {
    fetchTaxiRanks();
    fetchStatistics();
    fetchPendingCorrections();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const routeOptions = Array.from(
    new Set(
      form.routesServed
        .split(",")
        .map((route) => route.trim())
        .filter(Boolean)
    )
  );

  const saveRouteFareDraft = () => {
    const route = routeFareDraft.route.trim();
    const fareValue = routeFareDraft.fare.trim();

    if (!route) {
      toast.error("Please select a destination or route.");
      return;
    }

    if (!fareValue) {
      toast.error("Please enter a fare amount.");
      return;
    }

    if (routeOptions.length > 0 && !routeOptions.includes(route)) {
      toast.error("Please choose a route from the routes you already entered.");
      return;
    }

    const amount = Number(fareValue);
    if (!Number.isFinite(amount)) {
      toast.error("Please enter a valid fare amount.");
      return;
    }

    setRouteFareMap((prev) => ({
      ...prev,
      [route]: amount,
    }));
    setRouteFareDraft({ route: "", fare: "" });
    toast.success(`Fare saved for ${route}.`);
  };

  const editRouteFare = (route: string) => {
    const fare = routeFareMap[route];
    setRouteFareDraft({
      route,
      fare: String(fare),
    });
  };

  const removeRouteFare = (route: string) => {
    setRouteFareMap((prev) => {
      const next = { ...prev };
      delete next[route];
      return next;
    });

    setRouteFareDraft((prev) =>
      prev.route === route ? { route: "", fare: "" } : prev
    );
  };

  const formatCorrectionType = (type: string) => {
    const labels: Record<string, string> = {
      WRONG_ROUTE_NUMBER: 'Wrong route number',
      MISSING_ROUTE: 'Missing route',
      WRONG_FARE: 'Wrong fare',
      RANK_CLOSED: 'Rank closed',
      MISSING_RANK: 'Missing rank',
      ROUTE_CHANGE: 'Route change',
      OTHER: 'Other',
    };
    return labels[type] ?? type;
  };

  const formatCorrectionStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const reviewCorrection = async (submissionId: string, decision: 'APPROVE' | 'REJECT') => {
    if (!user.token) {
      toast.error("Authentication token missing. Log in again.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          decision,
          reviewNotes: reviewNotesDrafts[submissionId] || "",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to review correction");
      }

      toast.success(`Correction ${decision.toLowerCase()}d successfully.`);
      setReviewNotesDrafts((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
      fetchPendingCorrections();
      fetchTaxiRanks();
    } catch (err: any) {
      toast.error(err.message || "Failed to review correction.");
    }
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
    setRouteFareMap(rank.routeFares ? { ...rank.routeFares } : {});
    setRouteFareDraft({ route: "", fare: "" });
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
    setRouteFareMap({});
    setRouteFareDraft({ route: "", fare: "" });
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
        routesServed: form.routesServed
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
        routeFares: Object.fromEntries(
          Object.entries(routeFareMap).filter(([, fare]) => Number.isFinite(fare))
        ),
        hours: JSON.parse(form.hours),
        facilities: JSON.parse(form.facilities),
        phone: form.phone,
      };

      const url = isEditing
        ? `${API_BASE_URL}/api/taxi-ranks/${currentRankId}`
        : `${API_BASE_URL}/api/taxi-ranks`;

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
      toast.error(err instanceof Error ? err.message : "Error: Check JSON fields for hours or facilities.");
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
      const res = await fetch(`${API_BASE_URL}/api/taxi-ranks/${rankToDelete}`, {
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

            {/* Users Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalUsers.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                  <Users size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-400">
                <span>Registered users</span>
              </div>
            </div>

            {/* Incidents Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Incidents</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeIncidents}</h3>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                  <AlertTriangle size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-red-500">
                <span>Unresolved</span>
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
                        { name: 'Users', value: userStats.users },
                        { name: 'Admins', value: userStats.admins },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Users', value: userStats.users },
                        { name: 'Admins', value: userStats.admins },
                      ].map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0088FE]"></div>Users ({userStats.users})</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00C49F]"></div>Admins ({userStats.admins})</div>
              </div>
            </div>
          </div>

          {/* Correction Review Queue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Correction Review Queue</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review commuter submissions before they go live.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                {pendingCorrections.length} pending
              </span>
            </div>

            {pendingCorrections.length > 0 ? (
              <div className="space-y-4">
                {pendingCorrections.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                            {formatCorrectionType(submission.correctionType)}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                            {formatCorrectionStatus(submission.status)}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {submission.rankNameSnapshot || 'Unknown rank'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted by {submission.submittedByName || submission.submittedByEmail || 'Unknown user'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold">
                          {submission.confirmationsCount} confirmations
                        </span>
                        <span className="px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold">
                          {submission.rejectionsCount} rejections
                        </span>
                        {submission.autoApproved ? (
                          <span className="px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-semibold">
                            Auto-approved
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {submission.details && Object.keys(submission.details).length > 0 ? (
                      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Details
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(submission.details).slice(0, 4).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs"
                            >
                              {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <textarea
                      value={reviewNotesDrafts[submission.id] || ''}
                      onChange={(e) => setReviewNotesDrafts((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                      placeholder="Review notes (optional)"
                      className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[90px]"
                    />

                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => reviewCorrection(submission.id, 'APPROVE')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition"
                      >
                        <CheckCircle2 size={18} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewCorrection(submission.id, 'REJECT')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
                No correction submissions are waiting for review right now.
              </div>
            )}
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
                          <div className="space-y-1">
                            <div>{Array.isArray(rank.routesServed) ? rank.routesServed.join(", ") : ""}</div>
                            {rank.routeFares && Object.keys(rank.routeFares).length > 0 ? (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {Object.entries(rank.routeFares)
                                  .slice(0, 3)
                                  .map(([route, fare]) => `${route}: R${Math.round(Number(fare))}`)
                                  .join(" • ")}
                              </div>
                            ) : null}
                          </div>
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
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Route Fares</label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Optional. Add one route at a time.</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Pick a route from the dropdown, enter its fare, then add or update it. This keeps fares tied to the route you already entered above.
                  </p>
                  {routeOptions.length === 0 ? (
                    <div className="mb-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      Enter routes first, then choose one from the dropdown below.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-center">
                        <select
                          value={routeFareDraft.route}
                          onChange={(e) => setRouteFareDraft((prev) => ({ ...prev, route: e.target.value }))}
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        >
                          <option value="">Select destination / route</option>
                          {routeOptions.map((route) => (
                            <option key={route} value={route}>
                              {route}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={routeFareDraft.fare}
                          onChange={(e) => setRouteFareDraft((prev) => ({ ...prev, fare: e.target.value }))}
                          placeholder="Fare"
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={saveRouteFareDraft}
                          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition md:justify-self-start"
                        >
                          {routeFareMap[routeFareDraft.route] !== undefined ? "Update Fare" : "Add Fare"}
                        </button>
                      </div>

                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Saved fares</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{Object.keys(routeFareMap).length} saved</span>
                        </div>
                        {Object.keys(routeFareMap).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(routeFareMap).map(([route, fare]) => (
                              <div
                                key={route}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{route}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">R{Math.round(Number(fare))}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editRouteFare(route)}
                                    className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeRouteFare(route)}
                                    className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No fares added yet. Add one route and fare at a time.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
