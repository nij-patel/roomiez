"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle, faHome, faPiggyBank, faHandPointRight, faSprayCanSparkles, faBasketShopping, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/Navigation";
import { Chore, HouseMember } from "@/types";

export default function ChoreManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [houseMembers, setHouseMembers] = useState<HouseMember[]>([]);
  const [newChore, setNewChore] = useState<string>("");
  const [selectedRoommate, setSelectedRoommate] = useState<HouseMember | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchHouseData(authUser);
        await fetchChores(authUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchHouseData = async (authUser: User) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/house/my-house", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setHouseMembers(data.data.member_details || []);
      } else {
        console.error("Error fetching house data:", data.message);
      }
    } catch (error) {
      console.error("Fetch House Data Error:", error);
    }
  };

  const fetchChores = async (authUser: User) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/chores/my-house", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Data:", data);
        setChores(data.chores || []);
      } else {
        console.error("Error fetching chores:", data.data.message);
      }
    } catch (error) {
      console.error("Fetch Chores Error:", error);
    }
  };

  const addChore = async () => {
    if (!newChore.trim() || !selectedRoommate || !user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/chores/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chore_name: newChore, user_email: selectedRoommate.email, username: selectedRoommate.firstName }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewChore("");
        setSelectedRoommate(null);
        await fetchChores(user);
      } else {
        console.error("Error adding chore:", data.data.message);
      }
    } catch (error) {
      console.error("Add Chore Error:", error);
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch(`http://localhost:8000/chores/${choreId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchChores(user);
    } catch (error) {
      console.error("Delete Chore Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col items-center">
      <Navigation
        title="Roomiez Chores"
        onLogout={handleLogout}
      />

      <h1 className="text-4xl font-bold text-[#F17141] py-6">Chore Management</h1>

      {/* Add Chore Form */}
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#F17141] mb-4 text-center">Add New Chore</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter chore name"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
          />

          <select
            value={selectedRoommate?.email || ""}
            onChange={(e) => {
              const selectedEmail = e.target.value;
              const member = houseMembers.find(m => m.email === selectedEmail) || null;
              setSelectedRoommate(member);
            }}
            className="w-full p-3 border border-gray-300 rounded-md"
          >
            <option value="">Select Roommate</option>
            {houseMembers.map((member, index) => (
              <option key={index} value={member.email}>
                {member.firstName} ({member.email})
              </option>
            ))}
          </select>

          <button
            onClick={addChore}
            disabled={!newChore.trim() || !selectedRoommate}
            className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Add Chore
          </button>
        </div>
      </div>

      {/* Chores List */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F17141] mb-4 text-center">Current Chores</h2>

        {chores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chores.map((chore, index) => (
              <div key={index} className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-lg font-semibold text-gray-800">{chore.chore_name}</p>
                  <button
                    onClick={() => chore.chore_id && deleteChore(chore.chore_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Assigned to: <span className="font-bold">
                    {houseMembers.find(member => member.email === chore.user_email)?.firstName || chore.user_email}
                  </span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center">No chores assigned yet.</p>
        )}
      </div>
    </div>
  );
}
