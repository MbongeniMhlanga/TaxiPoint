import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Clock3, HelpCircle, Mail, PhoneCall } from "lucide-react";
import "../lib/popup/react-toastify.css";

interface User {
  name: string;
  surname: string;
  email: string;
}

interface SupportProps {
  user?: User | null;
}

const Support: React.FC<SupportProps> = ({ user }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user ? `${user.name} ${user.surname}`.trim() : "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.surname, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Your message has been sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error("Failed to send message. Try again later.");
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
              <HelpCircle size={38} />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-4">Support</h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
              Having issues? Send us a message and our support team will reach out to you.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
          <div className="w-full bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Send a Message</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Use the form below to contact the TaxiPoint team.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
              <input
                type="text"
                placeholder="Your Name"
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <textarea
                placeholder="Your Message"
                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none transition-colors"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition shadow-md"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Options</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Choose the option that best matches your issue and we’ll route it quickly.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div className="group flex h-full items-start gap-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300/60 dark:hover:border-blue-500/40 hover:bg-white dark:hover:bg-gray-800">
                <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Email Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">We usually respond within one business day.</p>
                </div>
              </div>
              <div className="group flex h-full items-start gap-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300/60 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-gray-800">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Fastest Response</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Include your issue and the email tied to your account.</p>
                </div>
              </div>
              <div className="group flex h-full items-start gap-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-300/60 dark:hover:border-emerald-500/40 hover:bg-white dark:hover:bg-gray-800">
                <div className="w-11 h-11 rounded-xl bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Clock3 size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Working Hours</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">We monitor support requests during working hours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
