"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface Option {
  value: string;
  label: string;
  icon?: any; // FontAwesome icon
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: any; // FontAwesome icon for the select button
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option", 
  className = "",
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold flex items-center justify-between hover:bg-[#FFE082] transition-colors text-sm sm:text-base"
      >
        <div className="flex items-center gap-2">
          {icon && <FontAwesomeIcon icon={icon} className="text-[#F17141]" />}
          {selectedOption?.icon && <FontAwesomeIcon icon={selectedOption.icon} className="text-[#F17141]" />}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown} 
          className="text-[#F17141] text-sm" 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#F17141] rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full p-2 sm:p-3 text-left rounded-md transition-colors flex items-center gap-2 text-sm sm:text-base ${
                  option.value === value 
                    ? 'bg-[#F17141] text-white font-bold' 
                    : 'hover:bg-[#FFECAE] text-gray-800'
                }`}
              >
                {option.icon && (
                  <FontAwesomeIcon 
                    icon={option.icon} 
                    className={option.value === value ? 'text-white' : 'text-[#F17141]'} 
                  />
                )}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 