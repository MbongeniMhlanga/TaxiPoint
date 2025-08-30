import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  token: string;
  notifications?: boolean;
  darkMode?: boolean;
}

interface UserSettingsProps {
  user: User;
  onUpdateUser: Dispatch<SetStateAction<User | null>>;
}

const UserSettings = ({ user, onUpdateUser }: UserSettingsProps) => {
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const [darkMode, setDarkMode] = useState(user.darkMode ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotifications(user.notifications ?? true);
    setDarkMode(user.darkMode ?? false);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Example API call to save settings
      const res = await fetch(`https://taxipoint-backend.onrender.com/api/users/${user.id}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ notifications, darkMode }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const updatedUser = { ...user, notifications, darkMode };
      onUpdateUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      <ToastContainer position="top-center" theme="dark" />
      <h2 className="text-2xl font-bold text-blue-400 mb-6">App Settings</h2>

      {/* Notifications */}
      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-600 mb-4">
        <span className="text-gray-200">Enable Notifications</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
        />
      </div>

      {/* Dark Mode */}
      <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-600 mb-4">
        <span className="text-gray-200">Dark Mode</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default UserSettings;
