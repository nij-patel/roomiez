"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faDollarSign, 
  faBasketShopping, 
  faCalendarDays, 
  faSprayCanSparkles, 
  faHandPointRight,
  faHome,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import PixelArtHouse from "../components/PixelArtHouse";
import { useState, useEffect, useMemo } from "react";
import { useFont } from "@/contexts/FontContext";

export default function LandingPage() {
  // Font reset functionality
  const { resetFont } = useFont();

  // Typing animation state
  const words = useMemo(() => ["chores", "shared spaces", "groceries", "expenses", "roommate life"], []);
  const [currentWord, setCurrentWord] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  // Reset font to pixel when main page loads
  useEffect(() => {
    resetFont();
  }, [resetFont]);

  useEffect(() => {
    const targetWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (charIndex < targetWord.length) {
          setCurrentWord(targetWord.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setCurrentWord(targetWord.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((currentWordIndex + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100); // Faster deletion than typing

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentWordIndex, words]);

  const features = [
    {
      icon: faDollarSign,
      title: "Expense Tracking",
      description: "Split bills and track shared expenses with automatic balance calculations"
    },
    {
      icon: faBasketShopping,
      title: "Shared Grocery List",
      description: "Collaborate on grocery shopping with a real-time shared list"
    },
    {
      icon: faCalendarDays,
      title: "Location Reservations",
      description: "Reserve shared spaces like the kitchen to avoid conflicts"
    },
    {
      icon: faSprayCanSparkles,
      title: "Chore Management",
      description: "Assign and track household chores to keep things organized"
    },
    {
      icon: faHandPointRight,
      title: "Anonymous Nudging",
      description: "Send friendly reminders to roommates without the awkwardness"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFECAE]">
      {/* Header */}
      <header className="w-full py-4 sm:py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FontAwesomeIcon icon={faHome} className="text-2xl sm:text-3xl text-[#F17141]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F17141] drop-shadow-lg">Roomiez</h1>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 sm:px-6 sm:py-3 bg-[#F17141] text-white font-semibold rounded-lg hover:bg-[#E85D2B] transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Start</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 drop-shadow-lg leading-tight">
              Simplifying the 
              <span className="text-[#F17141] inline-block animate-bounce-in drop-shadow-lg"> Roommate Experience</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 leading-relaxed drop-shadow-md">
              Manage your house&apos;s{" "}
              <span className="typing-container">
                <span className="typing-text drop-shadow-md">{currentWord}</span>
                <span className="typing-cursor">&nbsp;</span>
              </span>
              <br />
              seamlessly with Roomiez.
            </p>
            
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#F17141] text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-[#E85D2B] transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>Sign Up (It&apos;s Free!)</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-sm sm:text-base" />
            </Link>
          </div>

          {/* Right side - Animated house */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="transform hover:scale-105 transition-transform duration-300 scale-75 sm:scale-90 lg:scale-100">
              <PixelArtHouse />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-8 sm:mb-12 lg:mb-16 drop-shadow-lg">
          Everything You Need to Not Hate Your Roomies
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-[#F17141]"
            >
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#F17141] rounded-full mb-4 sm:mb-6 mx-auto">
                <FontAwesomeIcon icon={feature.icon} className="text-lg sm:text-2xl text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center drop-shadow-md">
                {feature.title}
              </h4>
              <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16 text-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl border-2 border-[#F17141]">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6 drop-shadow-lg">
            Ready to Transform Your Living Experience?
          </h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Sign up for free today!
          </p>
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 sm:space-x-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-[#F17141] text-white text-lg sm:text-xl font-bold rounded-xl hover:bg-[#E85D2B] transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span>Get Started Today</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-base sm:text-lg" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 sm:py-8 px-4 sm:px-8 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <FontAwesomeIcon icon={faHome} className="text-xl sm:text-2xl text-[#F17141]" />
            <span className="text-lg sm:text-xl font-bold text-[#F17141]">Roomiez</span>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Helping roommates not hate each other since 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
