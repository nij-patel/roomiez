"use client";

import { useState } from "react"; 
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faPiggyBank, faHandPointRight, faSprayCanSparkles, faBasketShopping, faCalendarDays, faTrash, faBroom } from "@fortawesome/free-solid-svg-icons";

export default function GroceryListPage() {
  const router = useRouter();

  // State: Grocery items list
  const [groceries, setGroceries] = useState([]);

  const [newItem, setNewItem] = useState("");

  // Function to add an item to the grocery list
  const addItem = () => {
    if (!newItem.trim()) return;

    setGroceries([...groceries, newItem]);
    setNewItem("");
  };

  // Function to remove an item from the grocery list
  const deleteItem = (index) => {
    setGroceries(groceries.filter((_, i) => i !== index));
  };

  // Function to clear the entire grocery list
  const clearList = () => {
    setGroceries([]);
  };

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      {/* Navigation Bar (Original Code) */}
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Roomiez Groceriez</h1>
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

      {/* Grocery List Section */}
      <div className="w-full flex flex-col items-center p-6">
        {/* Full-Width Heading */}
        

        {/* Add Grocery Item Form */}
        <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-[#F17141] mb-4 text-center">Add Items</h2>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter grocery item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={addItem}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Wooden Shelf Styled Grocery List */}
        <div className="w-full max-w-4xl bg-[#8B5A2B] text-white shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold text-[#FFECAE] mb-4 text-center">Grocery Shelf</h2>

          {groceries.length > 0 ? (
            <>
              <ul className="divide-y divide-gray-400">
                {groceries.map((item, index) => (
                  <li key={index} className="py-4 flex justify-between items-center bg-[#A67B5B] px-4 rounded-md shadow-md mb-2">
                    <span className="text-white text-lg font-semibold">{item}</span>
                    <button
                      onClick={() => deleteItem(index)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </li>
                ))}
              </ul>

              {/* Clear List Button */}
              <button
                onClick={clearList}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faBroom} /> Clear List
              </button>
            </>
          ) : (
            <p className="text-center text-[#FFECAE]">Your grocery shelf is empty.</p>
          )}
        </div>

        {/* 🍎 Fruit PNG Below the Shelf 🍎 */}
        <div className="flex justify-center mt-6">
          <img 
            src="/fruit.png" 
            alt="Fruit Illustration" 
            className="w-40 md:w-64 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
