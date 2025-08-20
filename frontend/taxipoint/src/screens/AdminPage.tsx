import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
// Use inline SVGs for icons to avoid import issues
const MdEdit = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MdDelete = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const FaSpinner = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

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
  routesServed: string; // comma-separated
  hours: string; // JSON string
  phone: string;
  facilities: string; // JSON string
}

interface AdminPageProps {
  onLogout: () => void;
  user: { email: string; role?: string; token?: string };
}

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

  //const API_BASE = 'https://taxipoint-backend.onrender.com/api';
  const navigate = useNavigate();

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
      routesServed: rank.routesServed.join(", "),
      hours: JSON.stringify(rank.hours),
      phone: rank.phone,
      facilities: JSON.stringify(rank.facilities),
    });
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
        toast.error(
          `Failed to ${isEditing ? "update" : "add"} rank: ${res.status} ${errorText}`
        );
        setIsLoading(false);
        return;
      }

      toast.success(`Taxi rank ${isEditing ? "updated" : "added"} successfully!`);
      resetForm();
      fetchTaxiRanks(); // Re-fetch data to be sure
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
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
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

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login");
  };

  return (
  <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center font-sans text-gray-200">
  <ToastContainer position="top-center" theme="dark" />

  <div className="max-w-7xl w-full">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-4xl font-extrabold text-blue-400 drop-shadow-lg">Admin Dashboard</h1>
      <button
        onClick={handleLogoutClick}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition transform hover:scale-105"
      >
        Logout
      </button>
    </div>

    {/* Form */}
    <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl mb-8 w-full border border-gray-700">
      <h2 className="text-2xl font-semibold text-blue-400 mb-6">
        {isEditing ? "Edit Taxi Rank" : "Add New Taxi Rank"}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/** Inputs with futuristic focus glow */}
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          required
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="district"
          placeholder="District"
          value={form.district}
          onChange={handleChange}
          required
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={handleChange}
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="latitude"
          type="number"
          step="any"
          placeholder="Latitude"
          value={form.latitude}
          onChange={handleChange}
          required
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="longitude"
          type="number"
          step="any"
          placeholder="Longitude"
          value={form.longitude}
          onChange={handleChange}
          required
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="routesServed"
          placeholder="Routes Served (comma separated)"
          value={form.routesServed}
          onChange={handleChange}
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="hours"
          placeholder='Hours JSON, e.g., {"Mon-Fri":"6am-10pm"}'
          value={form.hours}
          onChange={handleChange}
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <input
          name="facilities"
          placeholder='Facilities JSON, e.g., {"wifi":true}'
          value={form.facilities}
          onChange={handleChange}
          className="p-3 border border-gray-600 rounded-lg bg-gray-900 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-200"
          disabled={isLoading}
        />
        <div className="flex gap-4 md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 py-3 text-white rounded-lg transition-transform transform hover:scale-105 ${
              isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-500 hover:to-blue-600"
            }`}
          >
            {isLoading ? <FaSpinner className="animate-spin inline-block mr-2" /> : null}
            {isEditing ? "Update Rank" : "Add Rank"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-transform transform hover:scale-105"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>

    {/* Table */}
    <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700 w-full">
      <h2 className="text-2xl font-semibold text-blue-400 mb-4">Existing Taxi Ranks</h2>
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">District</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Routes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {taxiRanks.map((rank) => (
              <tr key={rank.id} className="hover:bg-gray-700 transition-colors rounded-lg">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{rank.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{rank.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{rank.district}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{Array.isArray(rank.routesServed) ? rank.routesServed.join(", ") : ""}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(rank)} className="text-indigo-400 mx-2 hover:text-indigo-600 transition-colors">
                    <MdEdit size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setRankToDelete(rank.id);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-400 mx-2 hover:text-red-600 transition-colors"
                  >
                    <MdDelete size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {/* Delete Modal */}
  {showDeleteModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-sm transform scale-105 animate-fade-in">
        <h3 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h3>
        <p className="text-gray-200 mb-6">Are you sure you want to delete this taxi rank?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
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
