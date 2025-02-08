"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faPiggyBank, faHandPointRight, faSprayCanSparkles, faBasketShopping, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { auth } from "@/utils/firebaseConfig"; // Ensure correct Firebase import
import "firebase/auth";

export default function CalendarPage() {
  const router = useRouter();

  const [userBalance, setUserBalance] = useState(null);
  const [people, setPeople] = useState([
    { name: "Nij", balance: 43, chore: "Dishes" },
    { name: "Lucas", balance: -43, chore: "Garbage" },
    { name: "Ganesh", balance: 178, chore: "Bathrooms" },
    { name: "Johnny", balance: -73, chore: "Sweeping" }
  ]);

  // State for form input
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [month, setMonth] = useState("");

  // Add new balance
  const addBalance = () => {
    if (name && balance && month) {
      // Find the person in the people list
      const updatedPeople = people.map(person => {
        if (person.name === name) {
          // If the person already exists, update their balance
          return { ...person, balance: person.balance + parseFloat(balance) };
        }
        return person; // Return unchanged person if it's not the one
      });

      // If the person doesn't exist in the list, add them as a new person
      if (!updatedPeople.some(person => person.name === name)) {
        updatedPeople.push({ name, balance: parseFloat(balance), chore: "Unassigned", month });
      }

      // Update the state with the new list
      setPeople(updatedPeople);

      // Clear input fields
      setName("");
      setBalance("");
      setMonth("");
    }
  };

  // Fetch User Balance from Backend
  useEffect(() => {
    const fetchBalance = async () => {
      const user = auth.currentUser; // Ensure Firebase Auth is accessed correctly
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("http://localhost:8000/user/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();
          if (response.ok) {
            setUserBalance(data.balance);
          } else {
            console.error("Error fetching balance:", data.detail);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col relative">
      {/* Page Background Decorations */}
      <div className="fixed bottom-0 w-full h-[calc(100vh-8rem)] flex justify-between pointer-events-none">
        {/* Left Column */}
        <div className="min-w-[6rem] md:min-w-[8rem] h-full ml-[-190px]">
          <img
            src="/column.png"
            alt="Left Column"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right Column */}
        <div className="min-w-[6rem] md:min-w-[8rem] h-full mr-[-190px]">
          <img
            src="/column.png"
            alt="Right Column"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Roomiez Finances</h1>
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

      {/* Balance Form and Table Section */}
      <div className="max-w-4xl mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg relative z-10">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Manage Monthly Balances</h2>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Add a New Balance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border border-gray-300 rounded-lg" />
            <input type="number" placeholder="Balance" value={balance} onChange={(e) => setBalance(e.target.value)} className="p-2 border border-gray-300 rounded-lg" />
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="p-2 border border-gray-300 rounded-lg" />
          </div>
          <button onClick={addBalance} className="mt-4 w-full sm:w-auto py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Add Balance
          </button>
        </div>

        {/* Balance Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Balance</th>
                <th className="py-2 px-4 border-b">Chore</th>
                <th className="py-2 px-4 border-b">Month</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{person.name}</td>
                  <td className="py-2 px-4">{person.balance}</td>
                  <td className="py-2 px-4">{person.chore}</td>
                  <td className="py-2 px-4">{person.month}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

