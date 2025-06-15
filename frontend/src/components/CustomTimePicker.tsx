"use client";

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface CustomTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomTimePicker({ value, onChange, placeholder = "Select time", className = "" }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value ? parseInt(value.split(':')[0]) : 12);
  const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const [selectedPeriod, setSelectedPeriod] = useState(value ? (parseInt(value.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

  const formatTime = (hour: number, minute: number, period: string) => {
    const hour24 = period === 'AM' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const displayTime = (hour: number, minute: number, period: string) => {
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeSelect = (hour: number, minute: number, period: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    onChange(formatTime(hour, minute, period));
    setIsOpen(false);
  };

  const currentDisplayTime = value ? 
    displayTime(
      selectedPeriod === 'AM' ? (selectedHour === 0 ? 12 : selectedHour) : (selectedHour > 12 ? selectedHour - 12 : selectedHour),
      selectedMinute,
      selectedPeriod
    ) : '';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 sm:p-3 border-2 border-[#F17141] rounded-md bg-[#FFECAE] text-gray-800 font-semibold flex items-center justify-between hover:bg-[#FFE082] transition-colors text-sm sm:text-base"
      >
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faClock} className="text-[#F17141]" />
          <span>{currentDisplayTime || placeholder}</span>
        </div>
        <FontAwesomeIcon 
          icon={isOpen ? faChevronUp : faChevronDown} 
          className="text-[#F17141] text-sm" 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#F17141] rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="grid grid-cols-3 divide-x-2 divide-[#F17141] h-64">
            {/* Hours */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-[#F17141] text-white text-center font-bold text-sm">
                Hour
              </div>
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeSelect(hour, selectedMinute, selectedPeriod)}
                  className={`w-full p-2 text-sm hover:bg-[#FFECAE] transition-colors ${
                    hour === (selectedPeriod === 'AM' ? (selectedHour === 0 ? 12 : selectedHour) : (selectedHour > 12 ? selectedHour - 12 : selectedHour))
                      ? 'bg-[#FFECAE] font-bold' 
                      : ''
                  }`}
                >
                  {hour}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-[#F17141] text-white text-center font-bold text-sm">
                Min
              </div>
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleTimeSelect(selectedHour, minute, selectedPeriod)}
                  className={`w-full p-2 text-sm hover:bg-[#FFECAE] transition-colors ${
                    minute === selectedMinute ? 'bg-[#FFECAE] font-bold' : ''
                  }`}
                >
                  {minute.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* AM/PM */}
            <div className="overflow-y-auto">
              <div className="p-2 bg-[#F17141] text-white text-center font-bold text-sm">
                Period
              </div>
              {['AM', 'PM'].map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeSelect(selectedHour, selectedMinute, period)}
                  className={`w-full p-2 text-sm hover:bg-[#FFECAE] transition-colors ${
                    period === selectedPeriod ? 'bg-[#FFECAE] font-bold' : ''
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
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