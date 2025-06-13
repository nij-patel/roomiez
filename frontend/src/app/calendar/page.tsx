"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/Navigation";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

// Type for calendar events (matching backend Reservation type)
interface CalendarEvent {
  reservation_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  person_email: string;
  person_firstname?: string;
  person_id: string;
  house_id: string;
  created_at: Date;
}

// Type for space colors mapping
interface SpaceColors {
  [key: string]: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [eventStartTime, setEventStartTime] = useState<string>("");
  const [eventEndTime, setEventEndTime] = useState<string>("");
  const [reservedSpace, setReservedSpace] = useState<string>("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Color coding based on space
  const spaceColors: SpaceColors = {
    "Living Room": "bg-blue-300",
    Kitchen: "bg-green-300",
    Shower: "bg-yellow-300",
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        fetchReservations(authUser);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch reservations from backend
  const fetchReservations = async (authUser: User) => {
    try {
      setLoading(true);
      const token = await authUser.getIdToken();
      const response = await fetch("http://localhost:8000/calendar/my-house", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(data.reservations || []);
      } else {
        console.error("Error fetching reservations:", data.message);
        alert("Failed to load reservations: " + data.message);
      }
    } catch (error) {
      console.error("Fetch reservations error:", error);
      alert("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new reservation
  const createReservation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/calendar/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time: eventStartTime,
          end_time: eventEndTime,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          location: reservedSpace,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Reservation created successfully!");
        await fetchReservations(user); // Refresh the list
        resetForm();
      } else {
        alert("Failed to create reservation: " + data.message);
      }
    } catch (error) {
      console.error("Create reservation error:", error);
      alert("Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a reservation
  const deleteReservation = async (reservationId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this reservation?")) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/calendar/${reservationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert("Reservation deleted successfully!");
        await fetchReservations(user); // Refresh the list
      } else {
        alert("Failed to delete reservation: " + data.message);
      }
    } catch (error) {
      console.error("Delete reservation error:", error);
      alert("Failed to delete reservation");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle adding/updating an event
  const handleSaveEvent = (): void => {
    if (!eventStartTime || !eventEndTime || !reservedSpace) {
      alert("Please enter start time, end time, and select a location!");
      return;
    }

    if (eventStartTime >= eventEndTime) {
      alert("End time must be after start time!");
      return;
    }

    createReservation();
  };

  // Function to reset form
  const resetForm = () => {
    setShowForm(false);
    setEventName("");
    setEventStartTime("");
    setEventEndTime("");
    setReservedSpace("");
    setEditingEvent(null);
  };

  // Function to edit an event (for future implementation)
  const handleEditEvent = (reservationId: string): void => {
    // Note: Backend doesn't have update endpoint yet, so we'll show an alert
    alert("Edit functionality coming soon! For now, please delete and create a new reservation.");
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
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = events.filter((event) => event.date === today);

  // Get events for selected date
  const selectedDateStr = date.toISOString().split('T')[0];
  const selectedDateEvents = events.filter((event) => event.date === selectedDateStr);

  return (
    <div className="min-h-screen w-screen bg-[#FFECAE] flex flex-col">
      <Navigation
        title="Roomiez Calendar"
        onLogout={handleLogout}
      />

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Loading...</p>
          </div>
        </div>
      )}

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
            disabled={loading}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Add Reservation
          </button>

          {/* Event Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-xl font-semibold mb-4">
                  Add New Reservation
                </h3>

                <div className="space-y-4">
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
                    <option value="">Select a location</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Shower">Shower</option>
                  </select>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveEvent}
                      disabled={loading}
                      className="flex-1 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      Save Reservation
                    </button>
                    <button
                      onClick={resetForm}
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
              Reservations for {date.toDateString()}
            </h3>

            {selectedDateEvents.map((event) => (
              <div
                key={event.reservation_id}
                className={`p-4 rounded-md shadow-md mb-2 ${
                  spaceColors[event.location] || "bg-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{event.location} Reservation</p>
                    <p className="text-sm text-gray-600">
                      {event.start_time} - {event.end_time}
                    </p>
                    <p className="text-sm">
                      Reserved by: {event.person_firstname || event.person_email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(event.reservation_id)}
                      className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => deleteReservation(event.reservation_id)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={loading || event.person_id !== user?.uid}
                      title={event.person_id !== user?.uid ? "You can only delete your own reservations" : "Delete reservation"}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {selectedDateEvents.length === 0 && (
              <p className="text-gray-500">No reservations for this date.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Today's Events */}
        <div className="w-1/3 bg-gray-100 p-6">
          <h3 className="text-2xl font-semibold mb-4">Today&apos;s Schedule</h3>

          {todaysEvents.length > 0 ? (
            <div className="space-y-4">
              {todaysEvents.map((event) => (
                <div
                  key={event.reservation_id}
                  className={`p-4 rounded-md shadow-md ${
                    spaceColors[event.location] || "bg-gray-200"
                  }`}
                >
                  <p className="font-semibold">{event.location}</p>
                  <p className="text-sm text-gray-600">
                    {event.start_time} - {event.end_time}
                  </p>
                  <p className="text-sm">
                    {event.person_firstname || event.person_email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reservations scheduled for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
