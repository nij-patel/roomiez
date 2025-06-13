'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faPiggyBank,
  faHandPointRight,
  faSprayCanSparkles,
  faBasketShopping,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { NavItem } from "@/types";

interface NavigationProps {
  title: string;
  joinCode?: string;
  onLogout?: () => void;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    icon: faHome,
    path: "/dashboard",
    tooltip: "Home",
  },
  {
    label: "Finances",
    icon: faPiggyBank,
    path: "/expenses",
    tooltip: "Finances",
  },
  {
    label: "Nudge",
    icon: faHandPointRight,
    path: "/nudge",
    tooltip: "Nudge",
  },
  {
    label: "Chores",
    icon: faSprayCanSparkles,
    path: "/chores",
    tooltip: "Chores",
  },
  {
    label: "Groceries",
    icon: faBasketShopping,
    path: "/grocery",
    tooltip: "Groceries",
  },
  {
    label: "Calendar",
    icon: faCalendarDays,
    path: "/calendar",
    tooltip: "Calendar",
  },
];

export default function Navigation({ title, joinCode, onLogout }: NavigationProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login");
    }
  };

  return (
    <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center relative z-50">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {joinCode && (
          <h2 className="text-sm font-semibold text-gray-700 mt-1">
            Join Code: {joinCode}
          </h2>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center items-center gap-10 p-6">
        {navItems.map((item) => (
          <div key={item.path} className="relative group">
            <button
              onClick={() => router.push(item.path)}
              className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={item.icon} size="2x" />
            </button>
            <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {item.tooltip}
            </span>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200"
      >
        Logout
      </button>
    </nav>
  );
} 