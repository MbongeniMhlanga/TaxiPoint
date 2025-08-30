import  { useState,  useEffect } from "react";
import type {Dispatch, SetStateAction} from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// This file is self-contained. Assuming User interface is defined somewhere and can be imported,
// we'll redefine it here to make the file runnable on its own.
// I've also added optional properties for notifications and darkMode to the User interface.
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

// Define the props that this component expects to receive.
interface UserSettingsProps {
  user: User;
  onUpdateUser: Dispatch<SetStateAction<User | null>>;
}

// The component function now accepts and uses the props we defined.
const UserSettings = ({ user, onUpdateUser }: UserSettingsProps) => {
  // Initialize state with the user's existing preferences from props, with a fallback.
  const [notifications, setNotifications] = useState(user.notifications ?? true);
  const [darkMode, setDarkMode] = useState(user.darkMode ?? false);

  // Synchronize state with props in case the user object changes from the parent.
  useEffect(() => {
    setNotifications(user.notifications ?? true);
    setDarkMode(user.darkMode ?? false);
  }, [user]);

  // Now the handleSave function uses the props to update the user's settings.
  const handleSave = () => {
    // Create a new user object with the updated settings.
    const updatedUser = {
      ...user,
      notifications,
      darkMode,
    };

    // Call the prop function to update the user state in the parent component.
    onUpdateUser(updatedUser);
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Notifications toggle */}
      <div className="flex items-center justify-between w-full max-w-md p-4 bg-white rounded-lg shadow mb-4">
        <span>Enable Notifications</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
        />
      </div>

      {/* Dark mode toggle */}
      <div className="flex items-center justify-between w-full max-w-md p-4 bg-white rounded-lg shadow mb-4">
        <span>Dark Mode</span>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Save Settings
      </button>

      {/* The ToastContainer is only needed once, so it's best placed in a top-level component like App.tsx */}
    </div>
  );
};

export default UserSettings;
