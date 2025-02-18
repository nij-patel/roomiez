"use client";

import { useEffect, useState } from "react";
import { auth } from "@/utils/firebaseConfig";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome, faPiggyBank, faHandPointRight,
  faSprayCanSparkles, faBasketShopping, faCalendarDays
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /** 🔹 Fetch User's House via FastAPI */
  const fetchUserHouse = async (authUser) => {
    try {
      const token = await authUser.getIdToken();

      const response = await fetch("http://localhost:8000/house/my-house", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setHouse(data);
      } else {
        console.error("Error fetching house:", data.detail);
      }
    } catch (error) {
      console.error("Error fetching house:", error);
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Listen for User Login & Fetch House Data */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchUserHouse(authUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFECAE] flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-[#F17141] text-[#FFECAE] py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">{house ? `${house.house_name}` : "Roomiez Dashboard"}</h1>
      {house?.join_code && (
      <h2 className="text-sm font-semibold text-gray-700 mt-1">
        Join Code: {house.join_code}
      </h2>
      )}


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

{/* Main Content Section */}
<div className="w-screen min-h-screen bg-[#FFECAE] flex flex-col items-center p-6">
  
  {house ? (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {house.member_details?.map((roommate, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">

          {/* Person Image for Each Roommate */}
          <div className="flex justify-center mb-4">
            <img src="/person.png" alt="Person Icon" className="w-24 h-24 md:w-40 md:h-40" />
          </div>

          <h2 className="text-xl font-semibold">{roommate.firstName || "Unknown"}</h2>
          <p className="text-gray-600">Balance: ${roommate.balance ?? 0}</p>

          {/* Chores List */}
          {roommate.chores && roommate.chores.length > 0 ? (
            <ul className="w-full mt-2 bg-yellow-200 p-4 rounded-lg shadow-inner border border-yellow-500 text-gray-800">
              {roommate.chores.map((chore, idx) => (
                <li key={idx} className="py-1 flex justify-between">
                  <span>{chore.chore_name}</span>
                  <span className={`text-sm px-2 py-1 rounded-md ${
                    chore.status === "Completed" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {chore.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="w-full h-24 bg-gray-100 p-4 mt-2 rounded-lg shadow-inner border border-gray-300 flex items-center justify-center">
              <span className="text-gray-500">No chores assigned</span>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p className="text-lg text-gray-600">You are not currently in a house. Join or create one.</p>
  )}
</div>

    </div>
  );
}
