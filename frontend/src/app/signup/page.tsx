"use client";

import { useState } from "react";
import { auth, db } from "@/utils/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouseCircleCheck } from "@fortawesome/free-solid-svg-icons"; // Import the specific icon

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                firstName: name,
                email: user.email,
                createdAt: new Date().toISOString(),
                balance: 0
            });

            router.push("/landing"); // Redirect to dashboard
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#FFECAE]">
            {/* Animated Form Container */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md p-10 bg-white shadow-xl rounded-lg"
            >
                {/* Headline Animation */}
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-4xl font-extrabold text-[#F17141] text-center mb-2"
                >
                    Create an Account
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-gray-600 text-center text-lg mb-6"
                >
                    Sign up to join us!
                </motion.p>

                {error && <p className="text-red-500 text-center text-sm mt-3">{error}</p>}

                {/* Animated Form */}
                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    onSubmit={handleSignup}
                    className="space-y-6" 
                >
                    <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
            <input
              type="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="first name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#F17141]"
            />
          </div>
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#F17141]"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-[#F17141]"
                        />
                    </div>

                    {/* Sign Up Button with FontAwesome Icon */}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 bg-[#F17141] text-white text-lg font-bold rounded-lg shadow-md hover:bg-[#d95e2f] transition-all flex items-center justify-center gap-3"
                    >
                        <FontAwesomeIcon icon={faHouseCircleCheck} className="text-xl" />
                        Sign Up
                    </motion.button>
                </motion.form>

                {/* Login Link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-gray-700 text-center mt-6 text-lg"
                >
                    Already have an account?{" "}
                    <button
                        onClick={() => router.push("/login")}
                        className="text-[#F17141] font-bold hover:underline"
                    >
                        Log In
                    </button>
                </motion.p>
            </motion.div>
        </div>
    );
}
