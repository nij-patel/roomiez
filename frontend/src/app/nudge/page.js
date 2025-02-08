"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHome, faPiggyBank, faHandPointRight, 
  faSprayCanSparkles, faBasketShopping, 
  faCalendarDays, faHandPointRight as faPoke, 
  faUserCircle 
} from "@fortawesome/free-solid-svg-icons";

export default function NudgePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [houseMembers, setHouseMembers] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchHouseMembers(authUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  /** 🔹 Fetch House Members */
  const fetchHouseMembers = async (authUser) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/house/my-house", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setHouseMembers(data.member_details || []);
      } else {
        console.error("Error fetching members:", data.detail);
      }
    } catch (error) {
      console.error("Fetch Members Error:", error);
    }
  };

  /** 🔹 Nudge a Roommate */
  const handleNudge = async (roommateEmail) => {
    try {
      const response = await fetch("http://localhost:8000/nudge/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_email: roommateEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Nudge sent anonymously to ${roommateEmail}`);
      } else {
        console.error("Error sending nudge:", data.detail);
      }
    } catch (error) {
      console.error("Nudge Error:", error);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Roomiez Nudge</h1>
        {/* Navigation Buttons */}
        <div className="flex justify-center items-center gap-10 p-6">
          {/* Home Button */}
          <div className="relative group">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faHome} size="2x" />
            </button>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Home
            </span>
          </div>

          <div className="relative group">
          <button
            onClick={() => router.push("/expenses")}
            className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPiggyBank} size="2x" />
          </button>
          <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Finances
            </span>
          </div>

          <div className="relative group">
          <button
            onClick={() => router.push("/nudge")}
            className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faHandPointRight} size="2x" />
          </button>
          <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Nudge
            </span>
          </div>

          {/* Other Navigation Buttons */}
          <div className="relative group">
            <button
              onClick={() => router.push("/chores")}
              className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faSprayCanSparkles} size="2x" />
            </button>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Chores
            </span>
          </div>
          
          <div className="relative group">
            <button
              onClick={() => router.push("/grocery")}
              className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faBasketShopping} size="2x" />
            </button>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Groceries
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={() => router.push("/calendar")}
              className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCalendarDays} size="2x" />
            </button>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Calendar
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => router.push("/login")}
          className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200"
        >
          Logout
        </button>
      </nav>

      {/* Nudge Roommates Section */}
      <div className="w-full flex flex-col items-center p-6">
        <h1 className="text-4xl font-bold text-[#F17141] py-6">Nudge a Roommate</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {houseMembers.map((roommate, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center hover:shadow-xl transition-all cursor-pointer"
              onClick={() => handleNudge(roommate.email)}
            >
              <div className="relative group">
                <FontAwesomeIcon
                  icon={faUserCircle}
                  size="4x"
                  className="text-gray-400 group-hover:text-[#F17141] transition-all"
                />
                <FontAwesomeIcon
                  icon={faPoke}
                  size="2x"
                  className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#F17141]"
                />
              </div>
              <p className="text-lg font-semibold mt-4">{roommate.firstName || "Unknown"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 👆 Nudge PNG Below the Section 👆 */}
      <div className="flex justify-center mt-6">
        <img 
          src="/nudge.png" 
          alt="Nudge Illustration" 
          className="w-72 md:w-96 object-contain"
        />
      </div>
    </div>
  );
}
