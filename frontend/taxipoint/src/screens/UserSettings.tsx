import { useState } from "react";
import type { Dispatch, SetStateAction, FC } from "react";
import { toast, ToastContainer } from "react-toastify";
import "../lib/popup/react-toastify.css";
import { API_BASE_URL } from "../config";
import { Settings } from "lucide-react";

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


      // ...
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
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
    <div className="h-full w-full overflow-y-auto">
      <ToastContainer position="top-center" theme="colored" />

      <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20 px-6">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <Settings size={38} />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">Settings</h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
              Customize how TaxiPoint behaves for your account.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 transition-colors duration-300">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">User Settings</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Update the preferences that shape your TaxiPoint experience.
                </p>
              </div>

              <div className="space-y-4">
                {/* Notifications toggle */}
                <div className="group flex items-center justify-between w-full p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300/60 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-gray-900">
                  <div>
                    <span className="block text-base font-semibold text-gray-900 dark:text-gray-100">
                      Enable Notifications
                    </span>
                    <span className="block mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Get alerts for updates and important activity.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={() => setNotifications(!notifications)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Theme</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Dark mode is handled globally from the main app controls.
                  </p>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={loading}
                className="mt-8 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"
              >
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
                <h4 className="text-2xl font-bold">Account Snapshot</h4>
                <p className="mt-2 text-blue-100">
                  These settings belong to your current TaxiPoint account.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <p className="text-sm text-blue-100">User</p>
                    <p className="text-lg font-semibold">{`${user.name} ${user.surname}`.trim()}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <p className="text-sm text-blue-100">Email</p>
                    <p className="text-lg font-semibold break-words">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What this affects</h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li>- Notification alerts for account activity.</li>
                  <li>- How quickly you hear about important TaxiPoint updates.</li>
                  <li>- Your preferences stay tied to this account after saving.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
