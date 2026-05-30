import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import '../../lib/popup/react-toastify.css';
import { API_BASE_URL } from "../../config";
import { Eye, EyeOff, UserCog, LockKeyhole, Mail, User } from 'lucide-react';

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
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const updatedData = await safeFetch(`${API_BASE_URL}/api/users/${user.id}`, {
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
      await safeFetch(`${API_BASE_URL}/api/users/${user.id}/password`, {
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

    if (passwordFieldsTouched && !passwordSectionValid) {
      toast.error('Please fix the password fields before updating.');
      return;
    }

    // Only update profile if there are changes
    if (name !== user.name || surname !== user.surname || email !== user.email) {
      await handleProfileUpdate();
    }

    // Only update password if any fields are filled
    if (oldPassword || newPassword || confirmPassword) {
      await handlePasswordUpdate();
    }
  };

  const passwordChecks = {
    length: newPassword.length >= 6,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const passwordStrengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordIsStrong = passwordStrengthScore >= 3;
  const passwordFieldsTouched = Boolean(oldPassword || newPassword || confirmPassword);
  const passwordsMatch = !passwordFieldsTouched || newPassword === confirmPassword;
  const passwordSectionValid =
    !passwordFieldsTouched ||
    (Boolean(oldPassword) && Boolean(newPassword) && Boolean(confirmPassword) && passwordsMatch && passwordIsStrong);

  return (
    <div className="h-full w-full overflow-y-auto">
      <ToastContainer position="top-center" theme="colored" />

      <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20 px-6">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
              <UserCog size={38} />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">Profile</h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
              Keep your account details and password up to date.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Update Your Profile</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Manage your personal details and keep your account secure.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <User size={16} />
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <User size={16} />
                        Surname
                      </label>
                      <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="Surname"
                        className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <LockKeyhole size={18} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Old Password (required for change)"
                          className="w-full p-3 pr-12 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                          aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}
                        >
                          {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="w-full p-3 pr-12 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {newPassword.length > 0 && !passwordIsStrong && (
                          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                            Weak password: use at least 6 characters with uppercase, lowercase, and a number.
                          </p>
                        )}
                        {newPassword.length > 0 && passwordIsStrong && (
                          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                            Strong password.
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm New Password"
                          className="w-full p-3 pr-12 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {confirmPassword.length > 0 && (
                          <p
                            className={`mt-2 text-sm ${
                              passwordsMatch
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {passwordsMatch ? 'Passwords match.' : 'New password and confirmation do not match.'}
                          </p>
                        )}
                      </div>
                      {passwordFieldsTouched && !passwordSectionValid && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Please complete the password fields correctly before updating.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !passwordSectionValid}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
                  <h4 className="text-xl font-bold">Profile Overview</h4>
                  <p className="mt-2 text-blue-100">
                    Your account details are used across TaxiPoint to personalize your experience.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                      <p className="text-sm text-blue-100">Current Name</p>
                      <p className="text-lg font-semibold">
                        {[name, surname].filter(Boolean).join(' ') || 'Not set'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                      <p className="text-sm text-blue-100">Current Email</p>
                      <p className="text-lg font-semibold break-words">{email || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tips</h4>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <li>- Use an email address you can access easily.</li>
                    <li>- Leave the password fields empty if you only want to update your details.</li>
                    <li>- Use your old password when changing to a new one.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
