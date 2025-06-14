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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login");
    }
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <>
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center relative z-50">
        {/* Left side - Title */}
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate pr-2">{title}</h1>
          {joinCode && (
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
              Join Code: {joinCode}
            </h2>
          )}
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
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

        {/* Mobile/Tablet Navigation - Horizontal scroll on small screens, hamburger on mobile */}
        <div className="flex lg:hidden items-center">
          {/* Tablet horizontal nav (sm to lg) */}
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

          {/* Mobile hamburger menu (only on small screens) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden px-2 py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors ml-2"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="px-2 py-2 sm:px-3 sm:py-2 bg-[#FFECAE] text-[#F17141] font-bold rounded-md hover:bg-gray-200 transition-colors text-sm sm:text-base ml-2"
        >
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
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
          </div>
        </div>
      )}
    </>
  );
} 