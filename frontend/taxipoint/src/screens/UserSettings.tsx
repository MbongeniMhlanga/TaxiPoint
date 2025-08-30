import React, { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// User interface
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

// Props for UserSettings
interface UserSettingsProps {
  user: User;
  onUpdateUser: Dispatch<SetStateAction<User | null>>;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user, onUpdateUser }) => {
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const [darkMode, setDarkMode] = useState(user.darkMode ?? false);
  const [loading, setLoading] = useState(false);

  // Sync state with parent
  useEffect(() => {
    setNotifications(user.notifications ?? true);
    setDarkMode(user.darkMode ?? false);
  }, [user]);

 const handleSave = async () => {
  setLoading(true);
  try {
    // Send all fields expected by UserUpdateDTO
    const payload = {
      name: user.name,        // keep current value if not editable
      surname: user.surname,  // keep current value if not editable
      email: user.email,      // keep current value if not editable
      notifications,
      darkMode,
    };

    const response = await fetch(`https://taxipoint-backend.onrender.com/api/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update settings");
    }

    const updatedUser = await response.json();

    // Update parent state so the UI reflects saved values
    onUpdateUser({ ...updatedUser, token: user.token });

    toast.success("Settings saved successfully!");
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Settings update failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      <ToastContainer position="top-center" theme="dark" />
      <h2 className="text-2xl font-bold text-blue-400 mb-6">User Settings</h2>

      {/* Notifications toggle */}
      <div className="flex items-center justify-between w-full p-4 bg-gray-900 rounded-lg border border-gray-600 mb-4">
        <span className="text-gray-200">Enable Notifications</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
        />
      </div>

      {/* Dark mode toggle */}
      <div className="flex items-center justify-between w-full p-4 bg-gray-900 rounded-lg border border-gray-600 mb-4">
        <span className="text-gray-200">Dark Mode</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default UserSettings;
