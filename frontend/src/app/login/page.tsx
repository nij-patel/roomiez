"use client";

import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "@/utils/firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PixelArtHouse from "../../components/PixelArtHouse";
import { buildApiUrl, devError } from "@/utils/config";
import { useFont } from "@/contexts/FontContext";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { resetFont } = useFont();

  useEffect(() => {
    // Reset font to pixel when login page loads
    resetFont();
  }, [resetFont]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is already in a house
      const token = await user.getIdToken();
      const response = await fetch(buildApiUrl("/house/my-house"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // User has a house, redirect to dashboard
        router.push("/dashboard");
      } else {
        // User doesn't have a house, redirect to landing page
        router.push("/landing");
      }
    } catch (err: any) {
      devError("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user is already in a house
      const token = await user.getIdToken();
      const response = await fetch(buildApiUrl("/house/my-house"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // User has a house, redirect to dashboard
        router.push("/dashboard");
      } else {
        // User doesn't have a house, redirect to landing page
        router.push("/landing");
      }
    } catch (err: any) {
      devError("Google Sign-In error:", err);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/operation-not-allowed') {
        setError("Google sign-in is not enabled. Please contact support.");
      } else if (err.code === 'auth/invalid-api-key') {
        setError("Invalid API key. Please contact support.");
      } else if (err.code === 'auth/app-not-authorized') {
        setError("This app is not authorized to use Firebase Authentication.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
      } else {
        setError(err.message || "An error occurred during Google sign-in. Please try again.");
      }
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

        {/* Login Form Section */}
        <div className="flex-1 max-w-lg w-full">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl py-10 px-12 border border-[#F17141]/20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#F17141] mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Enter your home away from home</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-7">
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
                {loading ? 'Signing In...' : 'Enter Your Home'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-4 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F17141] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-600">
                New to Roomiez?{' '}
                <Link href="/signup" className="font-medium text-[#F17141] hover:text-[#d95e2f] transition-colors duration-200">
                  Create your account
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
