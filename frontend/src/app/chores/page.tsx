"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle, faHome, faPiggyBank, faHandPointRight, faSprayCanSparkles, faBasketShopping, faCalendarDays, faUser } from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/Navigation";
import CustomSelect from "@/components/CustomSelect";
import { Chore, HouseMember } from "@/types";
import { buildApiUrl, devError } from "@/utils/config";

export default function ChoreManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  const [houseMembers, setHouseMembers] = useState<HouseMember[]>([]);
  const [newChore, setNewChore] = useState<string>("");
  const [selectedRoommate, setSelectedRoommate] = useState<HouseMember | null>(null);

  // Create roommate options for the custom select
  const roommateOptions = houseMembers.map(member => ({
    value: member.email,
    label: `${member.firstName} (${member.email})`,
    icon: faUser
  }));

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
      const response = await fetch(buildApiUrl("/house/my-house"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setHouseMembers(data.data.member_details || []);
      } else {
        devError("Error fetching house data:", data.message);
      }
    } catch (error) {
      devError("Fetch House Data Error:", error);
    }
  };

  const fetchChores = async (authUser: User) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch(buildApiUrl("/chores/my-house"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setChores(data.chores || []);
      } else {
        devError("Error fetching chores:", data.data.message);
      }
    } catch (error) {
      devError("Fetch Chores Error:", error);
    }
  };

  const addChore = async () => {
    if (!newChore.trim() || !selectedRoommate || !user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(buildApiUrl("/chores/add"), {
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
        devError("Error adding chore:", data.data.message);
      }
    } catch (error) {
      devError("Add Chore Error:", error);
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      await fetch(buildApiUrl(`/chores/${choreId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchChores(user);
    } catch (error) {
      devError("Delete Chore Error:", error);
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

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      <Navigation
        title="Roomiez Chores"
        onLogout={handleLogout}
      />

      <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-[#F17141] py-6">Chore Management</h1>

      {/* Add Chore Form */}
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6 mb-6 mx-auto">
        <h2 className="text-2xl font-bold text-[#F17141] mb-4 text-center">Add New Chore</h2>

        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Chore Name
            </label>
            <input
              type="text"
              placeholder="Enter chore name"
              value={newChore}
              onChange={(e) => setNewChore(e.target.value)}
              className="w-full p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold hover:bg-[#FFE082] transition-colors text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Assign to Roommate
            </label>
            <CustomSelect
              options={roommateOptions}
              value={selectedRoommate?.email || ""}
              onChange={(selectedEmail) => {
                const member = houseMembers.find(m => m.email === selectedEmail) || null;
                setSelectedRoommate(member);
              }}
              placeholder="Select Roommate"
              icon={faUser}
            />
          </div>

          <button
            onClick={addChore}
            disabled={!newChore.trim() || !selectedRoommate}
            className="w-full py-2 sm:py-3 bg-[#F17141] text-white rounded-md hover:bg-[#E85A2B] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm sm:text-base transition-colors"
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
    </div>
  );
}
