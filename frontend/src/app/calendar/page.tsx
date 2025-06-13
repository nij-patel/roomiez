"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/Navigation";
import { auth } from "@/utils/firebaseConfig";

// Type for calendar events
interface CalendarEvent {
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  space: string;
}

// Type for space colors mapping
interface SpaceColors {
  [key: string]: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [eventStartTime, setEventStartTime] = useState<string>("");
  const [eventEndTime, setEventEndTime] = useState<string>("");
  const [reservedSpace, setReservedSpace] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);

  // Color coding based on space
  const spaceColors: SpaceColors = {
    "Living Room": "bg-blue-300",
    Kitchen: "bg-green-300",
    Shower: "bg-yellow-300",
    "No space reserved": "bg-gray-200",
  };

  // Function to handle adding/updating an event
  const handleSaveEvent = (): void => {
    if (!eventName || !eventStartTime || !eventEndTime) {
      alert("Please enter event name, start time, and end time!");
      return;
    }

    if (editingEvent !== null) {
      // Update existing event
      const updatedEvents = events.map((event, index) =>
        index === editingEvent
          ? {
              date: date.toDateString(),
              startTime: eventStartTime,
              endTime: eventEndTime,
              name: eventName,
              space: reservedSpace || "No space reserved",
            }
          : event
      );
      setEvents(updatedEvents);
      setEditingEvent(null);
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        date: date.toDateString(),
        startTime: eventStartTime,
        endTime: eventEndTime,
        name: eventName,
        space: reservedSpace || "No space reserved",
      };
      setEvents([...events, newEvent]);
    }

    setShowForm(false);
    setEventName("");
    setEventStartTime("");
    setEventEndTime("");
    setReservedSpace("");
  };

  // Function to edit an event
  const handleEditEvent = (index: number): void => {
    const event = events[index];
    setEventName(event.name);
    setEventStartTime(event.startTime);
    setEventEndTime(event.endTime);
    setReservedSpace(event.space !== "No space reserved" ? event.space : "");
    setEditingEvent(index);
    setShowForm(true);
  };

  // Function to delete an event
  const handleDeleteEvent = (index: number): void => {
    setEvents(events.filter((_, i) => i !== index));
  };

  // Handle calendar date change with proper typing
  const handleDateChange = (value: any): void => {
    if (value instanceof Date) {
      setDate(value);
    } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof Date) {
      setDate(value[0]);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get today's events
  const today = new Date().toDateString();
  const todaysEvents = events.filter((event) => event.date === today);

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      <Navigation
        title="Roomiez Calendar"
        onLogout={handleLogout}
      />

      {/* Main Calendar Section */}
      <div className="flex flex-grow">
        <div className="flex flex-col w-2/3 p-6">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Roommate Calendar</h2>

          {/* React Calendar Component */}
          <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <Calendar onChange={handleDateChange} value={date} className="w-full" />
          </div>

          <p className="mt-4 text-lg font-semibold">Selected Date: {date.toDateString()}</p>

          {/* Add Event Button */}
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Event
          </button>

          {/* Event Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-xl font-semibold mb-4">
                  {editingEvent !== null ? "Edit Event" : "Add New Event"}
                </h3>

                <div className="space-y-4">
              <input
                type="text"
                placeholder="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
              />

              <input
                type="time"
                    placeholder="Start Time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
              />

              <input
                type="time"
                    placeholder="End Time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
              />

              <select
                value={reservedSpace}
                onChange={(e) => setReservedSpace(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">No space reserved</option>
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Shower">Shower</option>
              </select>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveEvent}
                      className="flex-1 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                {editingEvent !== null ? "Update Event" : "Save Event"}
              </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingEvent(null);
                        setEventName("");
                        setEventStartTime("");
                        setEventEndTime("");
                        setReservedSpace("");
                      }}
                      className="flex-1 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events for Selected Date */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">
              Events for {date.toDateString()}
            </h3>

            {events
              .filter((event) => event.date === date.toDateString())
              .map((event, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md shadow-md mb-2 ${
                    spaceColors[event.space] || "bg-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{event.name}</p>
                      <p className="text-sm text-gray-600">
                        {event.startTime} - {event.endTime}
                      </p>
                      <p>Reserved: {event.space}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditEvent(events.indexOf(event))}
                        className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(events.indexOf(event))}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {events.filter((event) => event.date === date.toDateString()).length === 0 && (
              <p className="text-gray-500">No events for this date.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Today's Events */}
        <div className="w-1/3 bg-gray-100 p-6">
          <h3 className="text-2xl font-semibold mb-4">Today&apos;s Schedule</h3>

          {todaysEvents.length > 0 ? (
            <div className="space-y-4">
              {todaysEvents.map((event, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md shadow-md ${
                    spaceColors[event.space] || "bg-gray-200"
                  }`}
                >
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-sm text-gray-600">
                    {event.startTime} - {event.endTime}
                  </p>
                  <p>Reserved: {event.space}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No events scheduled for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
