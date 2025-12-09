import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface UserProfileProps {
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
    token: string;
  };
  onUpdateUser: (updatedUser: any) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [email, setEmail] = useState(user.email);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  // Keep local state synced with parent user updates
  useEffect(() => {
    setName(user.name);
    setSurname(user.surname);
    setEmail(user.email);
  }, [user]);

  const safeFetch = async (url: string, options: RequestInit) => {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updatedData = await safeFetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, surname, email }),
      });

      toast.success('Profile updated successfully!');

      // Update parent state
      onUpdateUser({ ...updatedData, token: user.token });
      // Update localStorage so changes persist after refresh
      localStorage.setItem("user", JSON.stringify({ ...updatedData, token: user.token }));


      // Update local state immediately so UI matches DB
      setName(updatedData.name);
      setSurname(updatedData.surname);
      setEmail(updatedData.email);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      await safeFetch(`/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only update profile if there are changes
    if (name !== user.name || surname !== user.surname || email !== user.email) {
      await handleProfileUpdate();
    }

    // Only update password if any fields are filled
    if (oldPassword || newPassword || confirmPassword) {
      await handlePasswordUpdate();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <ToastContainer position="top-center" theme="colored" />
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Update Your Profile</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          placeholder="Surname"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <hr className="border-gray-200 dark:border-gray-600 my-2" />

        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Old Password (required for change)"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
