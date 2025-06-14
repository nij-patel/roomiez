"use client";

import React, { useState } from "react";
import { auth, db } from "@/utils/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelArtHouse from "../../components/PixelArtHouse";

export default function Signup() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user details in Firestore
            await setDoc(doc(db, "users", user.uid), {
                firstName: firstName,
                email: user.email,
                uid: user.uid,
                createdAt: new Date().toISOString(),
                balance: 0
            });

            // New users don't have a house yet, so redirect to landing page
            router.push("/landing");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFECAE] flex items-center justify-center px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 w-full max-w-6xl">
                
                {/* Pixel Art House Section */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="relative">
                        <div className="animate-float">
                            <PixelArtHouse />
                        </div>
                        
                        {/* Floating decorative elements */}
                        <div className="absolute -top-8 -left-8 w-16 h-16 bg-[#F17141]/20 rounded-full opacity-60 animate-float-slow"></div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#F17141]/30 rounded-full opacity-40 animate-float-delayed"></div>
                    </div>
                    
                    <div className="text-center mt-8 space-y-4">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#F17141] to-[#d95e2f] bg-clip-text text-transparent">
                            Roomiez
                        </h1>
                        <p className="text-xl text-[#F17141] font-medium max-w-md">
                            Your digital home for seamless roommate living
                        </p>
                    </div>
                </div>

                {/* Signup Form Section */}
                <div className="flex-1 max-w-lg w-full">
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl py-10 px-12 border border-[#F17141]/20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-[#F17141] mb-2">Sign Up for a New Account</h2>
                            <p className="text-gray-600">Create your home away from home</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-7">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17141] focus:border-transparent transition-all duration-200 bg-white/90"
                                    placeholder="Your first name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17141] focus:border-transparent transition-all duration-200 bg-white/90"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17141] focus:border-transparent transition-all duration-200 bg-white/90"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#F17141] to-[#d95e2f] text-white py-4 px-4 rounded-lg font-medium hover:from-[#d95e2f] hover:to-[#c54e28] focus:outline-none focus:ring-2 focus:ring-[#F17141] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-center"
                            >
                                {loading ? 'Creating Account...' : 'Create Your Home'}
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-[#F17141] hover:text-[#d95e2f] transition-colors duration-200">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(180deg); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(-180deg); }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 3.5s ease-in-out infinite 1s;
                }
                
                .pixelated {
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                }
            `}</style>
        </div>
    );
}
