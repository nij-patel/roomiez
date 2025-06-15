"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "../../utils/firebaseConfig";
import PixelArtNudge from "../../components/PixelArtNudge";
import Navigation from "../../components/Navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserSecret, faUserCircle, faHandPointRight } from "@fortawesome/free-solid-svg-icons";
import { buildApiUrl, devLog, devError } from "@/utils/config";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function NudgePage() {
  const [user, loading, error] = useAuthState(auth);
  const [roommates, setRoommates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRoommates = async () => {
      if (!user) return;

      try {
        // Use the backend API to get house members
        const token = await user.getIdToken();
        const response = await fetch(buildApiUrl("/house/my-house"), {
          headers: { 
            Authorization: `Bearer ${token}` 
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch house data: ${response.status}`);
        }

        const data = await response.json();
        devLog("House API response:", data);
        
        if (data.data && data.data.member_details) {
          // Filter out current user and map to our User interface
          const roommates = data.data.member_details
            .filter((member: any) => member.email !== user.email)
            .map((member: any) => ({
              id: member.uid,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email
            }));
          
          devLog("Found roommates:", roommates);
          setRoommates(roommates);
        } else {
          devLog("No member details in response");
        }
      } catch (error) {
        devError("Error fetching roommates:", error);
      }
    };

    fetchRoommates();
  }, [user]);

  const handleNudgeRoommate = async (roommateId: string, roommateName: string) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/nudge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          recipientId: roommateId
        })
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: `Nudge sent successfully to ${roommateName}!` });
      } else {
        const errorData = await response.json();
        setFeedback({ type: 'error', message: errorData.error || 'Failed to send nudge' });
      }
    } catch (error) {
      devError("Error sending nudge:", error);
      setFeedback({ type: 'error', message: 'Failed to send nudge' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      devError("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFECAE] flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFECAE] flex items-center justify-center">
        <div className="text-xl text-gray-600">Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFECAE]">
      <Navigation
        title="Roomiez Nudge"
        onLogout={handleLogout}
      />
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Anonymous Nudge
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Send a friendly anonymous reminder to your roommates about chores or responsibilities
          </p>
          
          {/* Pixel Art Animation */}
          <div className="flex justify-center my-8">
            <PixelArtNudge />
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#F17141]">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <FontAwesomeIcon icon={faUserSecret} className="mr-2 text-[#F17141]" />
            How It Works
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Click on a roommate below to send them an anonymous email reminder about pending chores. 
            They&apos;ll never know it was you - just a friendly nudge to get things done!
          </p>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`p-4 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Roommate Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Select a Roommate to Nudge
          </h2>

          {roommates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {roommates.map((roommate) => (
                <div
                  key={roommate.email}
                  onClick={() => handleNudgeRoommate(roommate.id, `${roommate.firstName} ${roommate.lastName}`)}
                  className={`bg-white p-6 rounded-xl shadow-lg flex flex-col items-center hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#F17141] group ${
                    isLoading ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faUserCircle}
                      size="4x"
                      className="text-gray-400 group-hover:text-[#F17141] transition-colors duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FontAwesomeIcon
                        icon={faHandPointRight}
                        size="2x"
                        className="text-[#F17141] animate-pulse"
                      />
                    </div>
                  </div>
                  <p className="text-lg font-semibold mt-4 text-gray-800">
                    {roommate.firstName} {roommate.lastName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                  </p>
                  <div className="mt-3 px-4 py-2 bg-[#F17141] text-white rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Send Nudge
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <FontAwesomeIcon icon={faUserCircle} size="4x" className="text-gray-300 mb-4" />
              <p className="text-xl text-gray-600">
                No roommates found. Create or join a house first!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
