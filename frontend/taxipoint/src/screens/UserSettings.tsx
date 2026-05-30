import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction, FC, ReactNode } from "react";
import { toast, ToastContainer } from "react-toastify";
import "../lib/popup/react-toastify.css";
import { API_BASE_URL } from "../config";
import { Bell, MapPin, Moon, RefreshCw, Settings, ShieldAlert, Volume2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// User interface
export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  token: string;
  notifications?: boolean;
  soundAlerts?: boolean;
  autoRefresh?: boolean;
  locationSharing?: boolean;
  darkMode?: boolean;
  locationPromptSeen?: boolean;
}

// Props for UserSettings
interface UserSettingsProps {
  user: User;
  onUpdateUser: Dispatch<SetStateAction<User | null>>;
}

const UserSettings: FC<UserSettingsProps> = ({ user, onUpdateUser }) => {
  const { theme, setTheme } = useTheme();

  // Initialize state with the user's existing preferences.
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const [soundAlerts, setSoundAlerts] = useState(user.soundAlerts ?? true);
  const [autoRefresh, setAutoRefresh] = useState(user.autoRefresh ?? true);
  const [locationSharing, setLocationSharing] = useState(user.locationSharing ?? false);
  const [darkMode, setDarkMode] = useState(user.darkMode ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotifications(user.notifications ?? true);
    setSoundAlerts(user.soundAlerts ?? true);
    setAutoRefresh(user.autoRefresh ?? true);
    setLocationSharing(user.locationSharing ?? false);
    setDarkMode(user.darkMode ?? false);
  }, [user]);

  const persistUserSettings = (nextUserSettings: Partial<User>) => {
    const updatedUser = {
      ...user,
      ...nextUserSettings,
      locationPromptSeen: true,
    };

    onUpdateUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return updatedUser;
  };

  const saveSettings = async (
    overrides: Partial<{
      notifications: boolean;
      soundAlerts: boolean;
      autoRefresh: boolean;
      locationSharing: boolean;
      darkMode: boolean;
    }> = {},
    options: { quiet?: boolean } = {}
  ) => {
    const nextNotifications = overrides.notifications ?? notifications;
    const nextSoundAlerts = overrides.soundAlerts ?? soundAlerts;
    const nextAutoRefresh = overrides.autoRefresh ?? autoRefresh;
    const nextLocationSharing = overrides.locationSharing ?? locationSharing;
    const nextDarkMode = overrides.darkMode ?? darkMode;

    persistUserSettings({
      notifications: nextNotifications,
      soundAlerts: nextSoundAlerts,
      autoRefresh: nextAutoRefresh,
      locationSharing: nextLocationSharing,
      darkMode: nextDarkMode,
    });

    setLoading(true);
    try {
      const payload = {
        notifications: nextNotifications,
        soundAlerts: nextSoundAlerts,
        autoRefresh: nextAutoRefresh,
        locationSharing: nextLocationSharing,
        darkMode: nextDarkMode,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to update settings";

        if (errorText.trim()) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorText;
          } catch {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      if (!options.quiet) {
        toast.success("Settings saved successfully!");
      }

      return true;
    } catch (err: any) {
      console.error(err);
      if (!options.quiet) {
        toast.error(err.message || "Settings update failed");
        throw err;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch {
      // Error toast is already shown inside saveSettings.
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

              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Alerts and Updates</h4>
                  </div>
                  <div className="space-y-4">
                    <SettingToggle
                      icon={<Bell size={18} />}
                      title="Enable Notifications"
                      description="Get alerts for updates and important activity."
                      checked={notifications}
                      onChange={() => setNotifications((value) => !value)}
                    />
                    <SettingToggle
                      icon={<Volume2 size={18} />}
                      title="Sound Alerts"
                      description="Play a sound when a new alert or update comes in."
                      checked={soundAlerts}
                      onChange={() => setSoundAlerts((value) => !value)}
                    />
                    <SettingToggle
                      icon={<RefreshCw size={18} />}
                      title="Auto Refresh"
                      description="Refresh live ranks and incidents automatically."
                      checked={autoRefresh}
                      onChange={() => setAutoRefresh((value) => !value)}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy and Location</h4>
                  </div>
                  <div className="space-y-4">
                    <SettingToggle
                      icon={<MapPin size={18} />}
                      title="Share Location"
                      description="Use your current area to improve local results and map focus."
                      checked={locationSharing}
                      onChange={async () => {
                        const nextValue = !locationSharing;
                        setLocationSharing(nextValue);
                        try {
                          await saveSettings({ locationSharing: nextValue }, { quiet: true });
                        } catch {
                          // Keep the locally saved setting even if the backend sync fails.
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Moon size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h4>
                  </div>
                    <SettingToggle
                      icon={<Moon size={18} />}
                      title="Dark Mode"
                      description={`Currently ${theme === "dark" ? "enabled" : "disabled"} for this app.`}
                      checked={darkMode}
                      onChange={() => {
                        const nextValue = !darkMode;
                        setDarkMode(nextValue);
                        setTheme(nextValue ? "dark" : "light");
                      }}
                    />
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
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                    <p className="text-sm text-blue-100">Theme</p>
                    <p className="text-lg font-semibold capitalize">{theme}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What this affects</h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <li>- Notification alerts for account activity.</li>
                  <li>- Sound feedback for important app events.</li>
                  <li>- Live data refreshes and location-aware experience.</li>
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

interface SettingToggleProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const SettingToggle: FC<SettingToggleProps> = ({ icon, title, description, checked, onChange }) => {
  return (
    <div className="group flex items-center justify-between gap-4 w-full p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300/60 dark:hover:border-blue-500/40">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <span className="block text-base font-semibold text-gray-900 dark:text-gray-100">{title}</span>
          <span className="block mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</span>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="relative w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
      </label>
    </div>
  );
};
