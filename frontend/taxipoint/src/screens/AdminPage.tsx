import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";

// Interface for a single TaxiRank object, based on your backend model
interface TaxiRank {
    id: string;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    district: string;
    routesServed: string[];
    hours: { [key: string]: string };
    phone: string;
    facilities: { [key: string]: boolean };
}

// Interface for the form data, matching the TaxiRankDTO from your backend
interface TaxiRankForm {
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    district: string;
    routesServed: string; // Stored as a comma-separated string for simplicity
    hours: string; // Stored as a JSON string
    phone: string;
    facilities: string; // Stored as a JSON string
}

interface AdminPageProps {
    onLogout: () => void;
    user: { email: string; role?: string; token?: string };
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout, user }) => {
    const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRankId, setCurrentRankId] = useState<string | null>(null);
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
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Function to fetch all taxi ranks from the backend
    const fetchTaxiRanks = async () => {
        try {
            const res = await fetch("/api/taxi-ranks");
            if (!res.ok) throw new Error("Failed to fetch taxi ranks");
            
            const data = await res.json();
            setTaxiRanks(data.content);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchTaxiRanks();
    }, []);

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // Populate the form when editing a taxi rank
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
            routesServed: rank.routesServed ? rank.routesServed.join(", ") : "",
            hours: JSON.stringify(rank.hours),
            phone: rank.phone,
            facilities: JSON.stringify(rank.facilities),
        });
    };

    // Handle form submission for both creation and updating
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate and parse JSON strings
            const parsedHours = JSON.parse(form.hours);
            const parsedFacilities = JSON.parse(form.facilities);

            // Construct the payload for the backend
            const formattedForm = {
                ...form,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                routesServed: form.routesServed.split(",").map(route => route.trim()),
                hours: parsedHours,
                facilities: parsedFacilities,
            };

            // Check for user token before making the API call
            if (!user.token) {
                toast.error("Authentication token is missing. Please log in again.");
                setIsLoading(false);
                return;
            }

            const method = isEditing ? "PUT" : "POST";
            const url = isEditing ? `/api/taxi-ranks/${currentRankId}` : "/api/taxi-ranks";

            const res = await fetch(url, {
                method,
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify(formattedForm),
            });

            // Improved error handling based on status code
            if (!res.ok) {
                if (res.status === 409) {
                    toast.error("Error: A taxi rank with this name already exists.");
                } else {
                    const errorBody = await res.text();
                    toast.error(`Failed to ${isEditing ? "update" : "add"} rank. Status: ${res.status}. ${errorBody}`);
                }
                setIsLoading(false);
                return;
            }
            
            toast.success(`Taxi rank ${isEditing ? "updated" : "added"} successfully!`);
            resetForm();
            fetchTaxiRanks(); // Refresh the list
        } catch (error: any) {
            toast.error("Error: Please check if the Hours and Facilities fields are valid JSON strings.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Reset the form to its initial state
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

    const handleLogout = () => {
        onLogout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen p-8 bg-gray-100 flex flex-col items-center">
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            <div className="max-w-7xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">{isEditing ? "Edit Taxi Rank" : "Add New Taxi Rank"}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="address"
                            placeholder="Address"
                            value={form.address}
                            onChange={handleChange}
                            required
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="district"
                            placeholder="District"
                            value={form.district}
                            onChange={handleChange}
                            required
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone (optional)"
                            value={form.phone}
                            onChange={handleChange}
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <input
                            type="number"
                            name="latitude"
                            placeholder="Latitude (e.g., -26.2041)"
                            value={form.latitude}
                            onChange={handleChange}
                            step="any"
                            required
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <input
                            type="number"
                            name="longitude"
                            placeholder="Longitude (e.g., 28.0473)"
                            value={form.longitude}
                            onChange={handleChange}
                            step="any"
                            required
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={isLoading}
                        />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleChange}
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="routesServed"
                            placeholder="Routes Served (e.g., Soweto, Sandton)"
                            value={form.routesServed}
                            onChange={handleChange}
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="hours"
                            placeholder="Hours (JSON, e.g., {'Mon-Fri': '6am-10pm'})"
                            value={form.hours}
                            onChange={handleChange}
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
                            disabled={isLoading}
                        />
                        <input
                            type="text"
                            name="facilities"
                            placeholder="Facilities (JSON, e.g., {'toilets': true, 'wifi': false})"
                            value={form.facilities}
                            onChange={handleChange}
                            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 md:col-span-2"
                            disabled={isLoading}
                        />
                        <div className="flex gap-4 md:col-span-2">
                            <button
                                type="submit"
                                className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition disabled:bg-gray-400"
                                disabled={isLoading}
                            >
                                {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Rank" : "Add Rank")}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="w-full py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md transition"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Existing Taxi Ranks</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Routes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {taxiRanks.map((rank) => (
                                    <tr key={rank.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rank.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rank.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rank.district}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Array.isArray(rank.routesServed) ? rank.routesServed.join(", ") : ""}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(rank)}
                                                className="text-indigo-600 hover:text-indigo-900 mx-2"
                                            >
                                                <MdEdit size={20} />
                                            </button>
                                            {/* Note: Your backend doesn't have a DELETE API yet. This button is a placeholder. */}
                                            <button
                                                onClick={() => toast.info("Delete functionality coming soon!")}
                                                className="text-red-600 hover:text-red-900 mx-2"
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
        </div>
    );
};

export default AdminPage;
