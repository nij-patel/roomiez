"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPlusCircle, faHome, faPiggyBank, faHandPointRight, faSprayCanSparkles, faBasketShopping, faCalendarDays } from "@fortawesome/free-solid-svg-icons";

export default function ChoreManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [chores, setChores] = useState([]); 
  const [houseMembers, setHouseMembers] = useState([]); 
  const [newChore, setNewChore] = useState("");
  const [selectedRoommate, setSelectedRoommate] = useState("");

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

  const fetchHouseData = async (authUser) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/house/my-house", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setHouseMembers(data.member_details || []);
      } else {
        console.error("Error fetching house data:", data.detail);
      }
    } catch (error) {
      console.error("Fetch House Data Error:", error);
    }
  };

  const fetchChores = async (authUser) => {
    try {
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/chores/my-house", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setChores(data.chores || []);
      } else {
        console.error("Error fetching chores:", data.detail);
      }
    } catch (error) {
      console.error("Fetch Chores Error:", error);
    }
  };

  const addChore = async () => {
    if (!newChore.trim() || !selectedRoommate) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/chores/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chore_name: newChore, user_email: selectedRoommate }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewChore(""); // Clear input
        await fetchChores(user); // 🔹 Fetch all chores again to refresh list
      } else {
        console.error("Error adding chore:", data.detail);
      }
    } catch (error) {
      console.error("Add Chore Error:", error);
    }
  };

  const deleteChore = async (choreId) => {
    try {
      const token = await user.getIdToken();
      await fetch(`http://localhost:8000/chores/delete/${choreId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchChores(user); // 🔹 Fetch all chores again after deletion
    } catch (error) {
      console.error("Delete Chore Error:", error);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col items-center">
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Roomiez Chores</h1>
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
      <h1 className="text-4xl font-bold text-[#F17141] py-6">Chore Management</h1>

      {/* Add Chore Form */}
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 text-center mb-4">Assign a Chore</h2>
        <div className="flex flex-col gap-4">
          <select value={selectedRoommate} onChange={(e) => setSelectedRoommate(e.target.value)} className="p-3 border border-gray-300 rounded-md">
            <option value="">Select a Roommate</option>
            {houseMembers.map((member, index) => (
              <option key={index} value={member.email}>
                {member.firstName} ({member.email})
              </option>
            ))}
          </select>
          <input type="text" placeholder="Enter chore name" value={newChore} onChange={(e) => setNewChore(e.target.value)} className="p-3 border border-gray-300 rounded-md"/>
          <button onClick={addChore} className="px-4 py-3 bg-[#F17141] text-white rounded-md flex items-center gap-2">
            <FontAwesomeIcon icon={faPlusCircle} /> Assign Chore
          </button>
        </div>
      </div>

      {/* Chore List Section */}
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-700 text-center mb-4">Household Chores</h2>

        {chores.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chores.map((chore, index) => (
              <li key={index} className="bg-[#FFF8E1] p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-gray-800">{chore.chore_name}</p>
                  <p className="text-gray-600 text-sm">Assigned to: <span className="font-bold">{chore.user_email}</span></p>
                </div>
                <button
                  onClick={() => deleteChore(chore.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">No chores assigned yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
