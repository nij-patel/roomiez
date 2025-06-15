'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faPiggyBank,
  faHandPointRight,
  faSprayCanSparkles,
  faBasketShopping,
  faCalendarDays,
  faBars,
  faTimes,
  faPenFancy,
} from "@fortawesome/free-solid-svg-icons";
import { NavItem } from "@/types";
import { useFont } from "@/contexts/FontContext";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isPoppins, toggleFont, resetFont } = useFont();

  const handleLogout = () => {
    resetFont(); // Reset font to pixel when logging out
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login");
    }
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center relative z-50">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate pr-2">{title}</h1>
          {joinCode && (
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
              Join Code: {joinCode}
            </h2>
          )}
        </div>

        <div className="hidden lg:flex justify-center items-center gap-4 xl:gap-6 2xl:gap-10 px-4">
          {navItems.map((item) => (
            <div key={item.path} className="relative group">
              <button
                onClick={() => handleNavClick(item.path)}
                className="px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 flex items-center gap-2 transition-colors"
              >
                <FontAwesomeIcon icon={item.icon} size="2x" />
              </button>
              <span className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.tooltip}
              </span>
            </div>
          ))}
        </div>

        <div className="flex lg:hidden items-center">
          <div className="hidden sm:flex lg:hidden overflow-x-auto gap-2 px-2 max-w-[300px] md:max-w-[400px]">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className="flex-shrink-0 px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors"
                title={item.tooltip}
              >
                <FontAwesomeIcon icon={item.icon} size="lg" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors ml-2"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 ml-2">
          <span className="hidden lg:inline text-[#FFECAE] text-sm font-medium">Font:</span>
          <button
            onClick={toggleFont}
            className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FFECAE] focus:ring-offset-2 focus:ring-offset-[#F17141] ${
              isPoppins ? 'bg-blue-500' : 'bg-orange-400'
            }`}
            title={isPoppins ? "Switch to Pixel Font" : "Switch to Readable Font"}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                isPoppins ? 'translate-x-9' : 'translate-x-1'
              }`}
            >
              <FontAwesomeIcon 
                icon={faPenFancy} 
                className={`absolute inset-0 h-3 w-3 m-auto transition-colors duration-300 ${
                  isPoppins ? 'text-blue-500' : 'text-orange-400'
                }`} 
              />
            </span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="px-2 py-2 sm:px-3 sm:py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors text-sm sm:text-base ml-2"
        >
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </nav>
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-[#F17141] w-screen border-t border-[#E85D2B] relative z-40">
          <div className="grid grid-cols-3 gap-2 p-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className="flex flex-col items-center gap-1 px-3 py-3 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors"
              >
                <FontAwesomeIcon icon={item.icon} size="lg" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
            <div className="flex flex-col items-center gap-2 px-3 py-3 bg-[#FFECAE] rounded-md">
              <button
                onClick={toggleFont}
                className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors duration-300 ${
                  isPoppins ? 'bg-blue-500' : 'bg-orange-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                    isPoppins ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={faPenFancy} 
                    className={`absolute inset-0 h-2 w-2 m-auto transition-colors duration-300 ${
                      isPoppins ? 'text-blue-500' : 'text-orange-400'
                    }`} 
                  />
                </span>
              </button>
              <span className="text-xs text-[#F17141] font-bold">Font</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 