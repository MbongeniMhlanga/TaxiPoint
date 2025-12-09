import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import ThemeToggle from "../../components/ThemeToggle";

interface RegisterForm {
    name: string;
    surname: string;
    email: string;
    password: string;
}

const Register: React.FC = () => {
    const [form, setForm] = useState<RegisterForm>({
        name: "",
        surname: "",
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("https://taxipoint-backend.onrender.com/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`Registration failed: ${errorBody}`);
            }

            // Registration is successful. Now redirect all users to the login page.
            toast.success("Registration successful! Please log in.");
            navigate("/login");

            setForm({ name: "", surname: "", email: "", password: "" });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-6 relative">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 animate-fadeIn transition-colors duration-300">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Register</h2>

                <div className="space-y-3 mb-6">
                    <button
                        disabled
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold shadow-none cursor-not-allowed opacity-60"
                    >
                        <FcGoogle size={22} /> Sign up with Google (Coming Soon)
                    </button>
                    <button
                        disabled
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#1877F2]/60 text-white/80 font-semibold shadow-none cursor-not-allowed"
                    >
                        <FaFacebook size={22} /> Sign up with Facebook (Coming Soon)
                    </button>
                </div>

                <div className="flex items-center mb-6">
                    <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                    <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">or</span>
                    <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="First Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        name="surname"
                        placeholder="Surname"
                        value={form.surname}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        disabled={isLoading}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition"
                        disabled={isLoading}
                    >
                        {isLoading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <button
                        onClick={() => navigate("/login")}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;