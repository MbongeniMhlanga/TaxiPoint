import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

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

    const handleGoogleSignUp = () => {
        toast.info("Google sign-up coming soon!");
    };

    const handleFacebookSignUp = () => {
        toast.info("Facebook sign-up coming soon!");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md border border-white/20 animate-fadeIn">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Register</h2>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={handleGoogleSignUp}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white text-gray-800 font-semibold shadow-md hover:bg-gray-100 transition"
                    >
                        <FcGoogle size={22} /> Sign up with Google
                    </button>
                    <button
                        onClick={handleFacebookSignUp}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
                    >
                        <FaFacebook size={22} /> Sign up with Facebook
                    </button>
                </div>

                <div className="flex items-center mb-6">
                    <hr className="flex-1 border-gray-500" />
                    <span className="px-3 text-gray-400 text-sm">or</span>
                    <hr className="flex-1 border-gray-500" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        placeholder="First Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        name="surname"
                        placeholder="Surname"
                        value={form.surname}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={isLoading}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md transition"
                        disabled={isLoading}
                    >
                        {isLoading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-300">
                    Already have an account?{" "}
                    <button
                        onClick={() => navigate("/login")}
                        className="text-blue-400 hover:underline"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;
