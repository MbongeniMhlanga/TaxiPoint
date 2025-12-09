import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Support: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
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
      setMessage("");
    } catch (err) {
      toast.error("Failed to send message. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
      <ToastContainer position="top-center" theme="colored" />
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">Support</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Having issues? Fill out the form below and our support team will reach out to you.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <textarea
            placeholder="Your Message"
            className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none transition-colors"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition shadow-md"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Support;
