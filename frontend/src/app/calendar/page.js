"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faPiggyBank,
  faHandPointRight,
  faSprayCanSparkles,
  faBasketShopping,
  faCalendarDays,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [reservedSpace, setReservedSpace] = useState("");
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);

  // Color coding based on space
  const spaceColors = {
    "Living Room": "bg-blue-300",
    Kitchen: "bg-green-300",
    Shower: "bg-yellow-300",
    "No space reserved": "bg-gray-200",
  };

  // Function to handle adding/updating an event
  const handleSaveEvent = () => {
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
      const newEvent = {
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
  const handleEditEvent = (index) => {
    const event = events[index];
    setEventName(event.name);
    setEventStartTime(event.startTime);
    setEventEndTime(event.endTime);
    setReservedSpace(event.space !== "No space reserved" ? event.space : "");
    setEditingEvent(index);
    setShowForm(true);
  };

  // Function to delete an event
  const handleDeleteEvent = (index) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  // Get today's events
  const today = new Date().toDateString();
  const todaysEvents = events.filter((event) => event.date === today);

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-[#F17141] w-screen text-[#FFECAE] py-4 px-6 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Roomiez Calendar</h1>
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

      {/* Main Calendar Section */}
      <div className="flex flex-grow">
        <div className="flex flex-col w-2/3 p-6">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Roommate Calendar</h2>

          {/* React Calendar Component */}
          <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <Calendar onChange={setDate} value={date} className="w-full" />
          </div>

          <p className="mt-4 text-lg font-semibold">Selected Date: {date.toDateString()}</p>

          {/* Add Event Button */}
          <button
            className="mt-4 px-6 py-3 bg-[#F17141] text-white rounded-md hover:bg-purple-700"
            onClick={() => setShowForm(true)}
          >
            {editingEvent !== null ? "Edit Event" : "+ Add Event"}
          </button>

          {/* Event Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-4 w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-3">{editingEvent !== null ? "Edit Event" : "Add Event"}</h3>

              <input
                type="text"
                placeholder="Event Name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3"
                required
              />

              <input
                type="time"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3"
                required
              />

              <input
                type="time"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3"
                required
              />

              <select
                value={reservedSpace}
                onChange={(e) => setReservedSpace(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3"
              >
                <option value="">No space reserved</option>
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Shower">Shower</option>
              </select>

              <button className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700" onClick={handleSaveEvent}>
                {editingEvent !== null ? "Update Event" : "Save Event"}
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Today's Events */}
        <div className="w-1/3 bg-gray-100 p-6">
          <h3 className="text-2xl font-semibold mb-4">Today's Schedule</h3>

          {todaysEvents.length > 0 ? (
            <div className="space-y-3">
              {todaysEvents.map((event, index) => (
                <div key={index} className={`p-4 rounded-md shadow-md ${spaceColors[event.space] || "bg-gray-200"}`}>
                  <p className="font-semibold">{event.name}</p>
                  <p>
                    {event.startTime} - {event.endTime}
                  </p>
                  <p>Reserved: {event.space}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No events scheduled for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
