import { useState } from "react";
import type { Dispatch, SetStateAction, FC } from "react";
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

const UserSettings: FC<UserSettingsProps> = ({ user, onUpdateUser }) => {
  // Initialize state with the user's existing preferences.
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const [darkMode] = useState(user.darkMode ?? false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Build the payload for the backend
      const payload = {
        notifications,
        darkMode,
      };

      // Call your backend API to update user settings
      const response = await fetch(`/api/users/${user.id}`, {
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

      // Instead of using the response from the backend, we optimistically update
      // the parent state with the current local state.
      const updatedUser = {
        ...user,
        notifications,
        darkMode,
      };

      onUpdateUser(updatedUser);

      toast.success("Settings saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Settings update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <ToastContainer position="top-center" theme="colored" />
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">User Settings</h2>

      {/* Notifications toggle */}
      <div className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 mb-4 transition-colors">
        <span className="text-gray-900 dark:text-gray-200">Enable Notifications</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
          className="w-5 h-5 text-blue-600"
        />
      </div>

      {/* Dark mode toggle - Removed as it's now handled globally by the ThemeToggle component */}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default UserSettings;
