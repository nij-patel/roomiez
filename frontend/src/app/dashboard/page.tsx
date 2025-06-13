"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/utils/firebaseConfig";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import { House, AuthUser } from "@/types";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  /** Fetch User's House via FastAPI */
  const fetchUserHouse = async (authUser: User) => {
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
        setHouse(data.data);
        console.log("House data:", data);
      } else {
        console.error("Error fetching house:", data.detail);
      }
    } catch (error) {
      console.error("Error fetching house:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Listen for User Login & Fetch House Data */
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFECAE] flex flex-col">
      <Navigation
        title={house ? house.house_name : "Roomiez Dashboard"}
        joinCode={house?.join_code}
        onLogout={handleLogout}
      />

{/* Main Content Section */}
<div className="w-screen min-h-screen bg-[#FFECAE] flex flex-col items-center p-6">
  {house ? (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {house.member_details?.map((roommate, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
          {/* Person Image for Each Roommate */}
          <div className="flex justify-center mb-4">
                  <Image 
                    src="/person.png" 
                    alt="Person Icon" 
                    width={160}
                    height={160}
                    className="w-24 h-24 md:w-40 md:h-40" 
                  />
          </div>

                <h2 className="text-xl font-semibold">
                  {roommate.firstName || "Unknown"}
                </h2>
                <p className="text-gray-600">
                  Balance: ${roommate.balance ?? 0}
                </p>

          {/* Chores List */}
          {roommate.chores && roommate.chores.length > 0 ? (
            <ul className="w-full mt-2 bg-yellow-200 p-4 rounded-lg shadow-inner border border-yellow-500 text-gray-800">
              {roommate.chores.map((chore, idx) => (
                <li key={idx} className="py-1 flex justify-between">
                  <span>{chore.chore_name}</span>
                        <span 
                          className={`text-sm px-2 py-1 rounded-md ${
                            chore.status === "Completed" 
                              ? "bg-green-500 text-white" 
                              : "bg-red-500 text-white"
                          }`}
                        >
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
          <p className="text-lg text-gray-600">
            You are not currently in a house. Join or create one.
          </p>
  )}
</div>
    </div>
  );
}
