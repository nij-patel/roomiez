"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebaseConfig";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [joinCode, setJoinCode] = useState(""); // Stores join code input
  const [showJoinInput, setShowJoinInput] = useState(false); // Controls visibility of input box
  const [message, setMessage] = useState(""); // Feedback message for API calls
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);

        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data()); 
        } else {
          console.error("User document not found in Firestore.");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  /** Function to Create a House **/
  const handleCreateHouse = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/house/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ house_name: "My New House" }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`House created! Join Code: ${data.join_code}`);
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Create House Error:", error);
      setMessage("Error creating house. Please try again.");
    }
  };

  /** Function to Join a House **/
  const handleJoinHouse = async () => {
    if (!joinCode) {
      setMessage("Please enter a join code.");
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/house/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ join_code: joinCode }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Successfully joined the house!");
        // router.push("/dashboard"); // Redirect after success
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Join House Error:", error);
      setMessage("Error joining house. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFECAE] p-8">
      {/* Animated Welcome Message */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-4xl font-bold text-[#000000] text-center mb-6"
      >
        Welcome, {userData ? userData.firstName : "User"}!
      </motion.h1>

      {/* Logout Button */}
      <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="absolute top-5 left-5 px-6 py-3 bg-[#F17141] text-white rounded-md hover:bg-[#d95e2f] transition-all"
  onClick={async () => {
    try {
      await auth.signOut();  // ✅ Sign out the user
      router.push("/login"); // ✅ Redirect to login page
    } catch (error) {
      console.error("Logout Error:", error);
    }
  }}
>
  Logout
</motion.button>


      {/* Animated Buttons Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-col space-y-4 w-full max-w-md text-center"
      >
        {/* Create House Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-[#F17141] text-white rounded-md hover:bg-[#d95e2f] transition-all"
          onClick={handleCreateHouse}
        >
          + Create a House
        </motion.button>

        {/* Join House Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-[#F17141] text-white rounded-md hover:bg-[#d95e2f] transition-all"
          onClick={() => setShowJoinInput(!showJoinInput)}
        >
          + Join an Existing House
        </motion.button>

        {/* Join House Input Box (Appears on Button Click) */}
        {showJoinInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-3"
          >
            <input
              type="text"
              placeholder="Enter Join Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="p-2 border border-gray-400 rounded-md w-60 text-center"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-[#F17141] text-white rounded-md hover:bg-[#d95e2f] transition-all"
              onClick={handleJoinHouse}
            >
              Join House
            </motion.button>
          </motion.div>
        )}

        {/* House Image Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer flex justify-center"
          onClick={() => router.push("/dashboard")}
        >
          <img
            src="/house.png"
            alt="House Icon"
            width={200}
            height={200}
            className="no-box-outline"
          />
        </motion.div>

        {/* Message Feedback */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-lg font-semibold text-[#F17141]"
          >
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
