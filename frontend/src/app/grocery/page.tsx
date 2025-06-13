"use client";

import React, { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faBroom, faPlus } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

interface GroceryItem {
  grocery_id: string;
  item_name: string;
  house_id: string;
  added_by: string;
  completed: boolean;
  added_at: Date;
}

export default function GroceryListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await fetchGroceries(authUser);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  /** Fetch all groceries for the house */
  const fetchGroceries = async (authUser: User) => {
    try {
      console.log("🔍 Starting fetchGroceries for user:", authUser.email);
      const token = await authUser.getIdToken();
      console.log("🔑 Got Firebase token, length:", token?.length);
      
      const response = await fetch("http://localhost:8000/grocery/my-house", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("📡 Response status:", response.status, response.statusText);
      const data = await response.json();
      console.log("📦 Response data:", data);
      
      if (response.ok) {
        setGroceries(data.groceries || []);
      } else {
        console.error("Error fetching groceries:", data.message);
        setError(data.message || "Failed to fetch groceries");
      }
    } catch (error) {
      console.error("❌ Error fetching groceries:", error);
      setError("Failed to fetch groceries");
    }
  };

  /** Add a new grocery item */
  const addItem = async () => {
    if (!newItem.trim() || !user) return;
    
    setIsAdding(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/grocery/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item: newItem.trim(),
          user_email: user.email
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Added "${newItem}" to grocery list!`);
        setNewItem("");
        await fetchGroceries(user); // Refresh the list
      } else {
        setError(data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item");
    } finally {
      setIsAdding(false);
    }
  };

  /** Delete a specific grocery item */
  const deleteItem = async (groceryId: string, itemName: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/grocery/${groceryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Removed "${itemName}" from grocery list!`);
        await fetchGroceries(user); // Refresh the list
      } else {
        setError(data.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item");
    }
  };

  /** Clear all groceries */
  const clearList = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/grocery/all-groceries", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Cleared entire grocery list!");
        await fetchGroceries(user); // Refresh the list
      } else {
        setError(data.message || "Failed to clear list");
      }
    } catch (error) {
      console.error("Error clearing list:", error);
      setError("Failed to clear list");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col relative overflow-x-hidden">
      {/* Page Background Decorations */}
      <div className="fixed bottom-0 left-0 w-full pointer-events-none -z-1">
        <div className="flex justify-between items-end h-[80vh]">
          <div className="min-w-[6rem] md:min-w-[8rem] -ml-32 md:-ml-48 h-full flex items-end">
            <Image
              src="/column.png"
              alt="Left Column"
              width={128}
              height={600}
              className="w-full h-[600px] object-cover"
            />
          </div>
          <div className="min-w-[6rem] md:min-w-[8rem] -mr-32 md:-mr-48 h-full flex items-end">
            <Image
              src="/column.png"
              alt="Right Column"
              width={128}
              height={600}
              className="w-full h-[600px] object-cover"
            />
          </div>
        </div>
      </div>

      <Navigation
        title="Roomiez Groceriez"
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 mt-6 space-y-6 relative z-30">

        {/* Message Display */}
        {(message || error) && (
          <div className={`p-4 rounded-lg ${
            error 
              ? "bg-red-100 text-red-800 border border-red-300" 
              : "bg-green-100 text-green-800 border border-green-300"
          }`}>
            {error || message}
            <button
              onClick={() => {setMessage(""); setError("");}}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add Grocery Item Form */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#F17141] mb-6 text-center">Add Items</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter grocery item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F17141] focus:border-[#F17141] bg-white shadow-sm transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              disabled={isAdding}
            />
            <button
              onClick={addItem}
              disabled={!newItem.trim() || isAdding}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
            >
              <FontAwesomeIcon icon={faPlus} />
              {isAdding ? "Adding..." : "Add Item"}
            </button>
          </div>
        </div>

        {/* Wooden Shelf Styled Grocery List */}
        <div className="bg-[#8B5A2B] text-white shadow-lg rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#FFECAE] mb-6 text-center">Grocery Shelf</h2>

          {groceries.length > 0 ? (
            <>
              <ul className="space-y-3">
                {groceries.map((item) => (
                  <li key={item.grocery_id} className="bg-[#A67B5B] px-6 py-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-white text-lg font-semibold">{item.item_name}</span>
                        <p className="text-[#FFECAE] text-sm mt-1">
                          Added by {item.added_by} • {
                            (() => {
                              try {
                                const date = new Date(item.added_at);
                                return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Recently added';
                              } catch {
                                return 'Recently added';
                              }
                            })()
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => deleteItem(item.grocery_id, item.item_name)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors duration-200"
                      >
                        <FontAwesomeIcon icon={faTrash} /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Clear List Button */}
              <button
                onClick={clearList}
                className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faBroom} /> Clear Entire List
              </button>
            </>
          ) : (
            <p className="text-center text-[#FFECAE] text-lg">Your grocery shelf is empty. Add some items above!</p>
          )}
        </div>

        {/* 🍎 Fruit PNG Below the Shelf 🍎 */}
        <div className="flex justify-center">
          <Image 
            src="/fruit.png" 
            alt="Fruit Illustration" 
            width={256}
            height={256}
            className="w-40 md:w-64 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
