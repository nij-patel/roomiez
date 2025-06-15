"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faMapMarkerAlt, faHome, faUtensils, faShower } from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/Navigation";
import CustomTimePicker from "@/components/CustomTimePicker";
import CustomSelect from "@/components/CustomSelect";
import { auth } from "@/utils/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { buildApiUrl, devError } from "@/utils/config";

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Color coding based on space
  const spaceColors: SpaceColors = {
    "Living Room": "bg-blue-300",
    Kitchen: "bg-green-300",
    Shower: "bg-yellow-300",
  };

  // Location options for the custom select
  const locationOptions = [
    { value: "Living Room", label: "Living Room", icon: faHome },
    { value: "Kitchen", label: "Kitchen", icon: faUtensils },
    { value: "Shower", label: "Shower", icon: faShower },
  ];

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000); // Auto-hide after 5 seconds
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
      const response = await fetch(buildApiUrl("/calendar/my-house"), {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(data.reservations || []);
      } else {
        devError("Error fetching reservations:", data.message);
        showNotification('error', "Failed to load reservations: " + data.message);
      }
    } catch (error) {
      devError("Fetch reservations error:", error);
      showNotification('error', "Failed to load reservations");
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
      const response = await fetch(buildApiUrl("/calendar/create"), {
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
        showNotification('success', "Reservation created successfully!");
        await fetchReservations(user); // Refresh the list
        resetForm();
      } else {
        showNotification('error', "Failed to create reservation: " + data.message);
      }
    } catch (error) {
      devError("Create reservation error:", error);
      showNotification('error', "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a reservation
  const deleteReservation = async (reservationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(buildApiUrl(`/calendar/${reservationId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', "Reservation deleted successfully!");
        await fetchReservations(user); // Refresh the list
        setShowDeleteConfirm(null); // Close confirmation
      } else {
        showNotification('error', "Failed to delete reservation: " + data.message);
      }
    } catch (error) {
      devError("Delete reservation error:", error);
      showNotification('error', "Failed to delete reservation");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle adding/updating an event
  const handleSaveEvent = (): void => {
    if (!eventStartTime || !eventEndTime || !reservedSpace) {
      showNotification('warning', "Please enter start time, end time, and select a location!");
      return;
    }

    if (eventStartTime >= eventEndTime) {
      showNotification('warning', "End time must be after start time!");
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
    // Note: Backend doesn't have update endpoint yet, so we'll show a notification
    showNotification('warning', "Edit functionality coming soon! For now, please delete and create a new reservation.");
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

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-black'
        }`}>
          <div className="flex justify-between items-start">
            <p className="text-sm sm:text-base">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-lg font-bold opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this reservation? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => deleteReservation(showDeleteConfirm)}
                className="flex-1 py-2 sm:py-3 bg-red-500 text-white rounded-md hover:bg-red-600 text-center text-sm sm:text-base"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 sm:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-center text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Section */}
      <div className="flex flex-col lg:flex-row flex-grow">
        <div className="flex flex-col w-full lg:w-2/3 p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Roommate Calendar</h2>

          {/* React Calendar Component */}
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md w-full">
            <Calendar 
              onChange={handleDateChange} 
              value={date} 
              className="w-full calendar-mobile" 
            />
          </div>

          <p className="mt-4 text-base sm:text-lg font-semibold">Selected Date: {date.toDateString()}</p>

          {/* Add Event Button */}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base"
          >
            Add Reservation
          </button>

          {/* Event Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Add New Reservation
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <CustomTimePicker
                      value={eventStartTime}
                      onChange={setEventStartTime}
                      placeholder="Select start time"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <CustomTimePicker
                      value={eventEndTime}
                      onChange={setEventEndTime}
                      placeholder="Select end time"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <CustomSelect
                      options={locationOptions}
                      value={reservedSpace}
                      onChange={setReservedSpace}
                      placeholder="Select a location"
                      icon={faMapMarkerAlt}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={handleSaveEvent}
                      disabled={loading}
                      className="flex-1 py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-center text-sm sm:text-base"
                    >
                      Save
                    </button>
                    <button
                      onClick={resetForm}
                      className="flex-1 py-2 sm:py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-center text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events for Selected Date */}
          <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              Reservations for {date.toDateString()}
            </h3>

            {selectedDateEvents.map((event) => (
              <div
                key={event.reservation_id}
                className={`p-3 sm:p-4 rounded-md shadow-md mb-2 ${
                  spaceColors[event.location] || "bg-gray-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">{event.location} Reservation</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {event.start_time} - {event.end_time}
                    </p>
                    <p className="text-xs sm:text-sm">
                      Reserved by: {event.person_firstname || event.person_email}
                    </p>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button
                      onClick={() => handleEditEvent(event.reservation_id)}
                      className="p-1.5 sm:p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(event.reservation_id)}
                      className="p-1.5 sm:p-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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
              <p className="text-gray-500 text-sm sm:text-base">No reservations for this date.</p>
            )}
          </div>
        </div>

        {/* Right Sidebar - Today's Events */}
        <div className="w-full lg:w-1/3 bg-gray-100 p-4 sm:p-6 order-first lg:order-last">
          <h3 className="text-xl sm:text-2xl font-semibold mb-4">Today&apos;s Schedule</h3>

          {todaysEvents.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {todaysEvents.map((event) => (
                <div
                  key={event.reservation_id}
                  className={`p-3 sm:p-4 rounded-md shadow-md ${
                    spaceColors[event.location] || "bg-gray-200"
                  }`}
                >
                  <p className="font-semibold text-sm sm:text-base">{event.location}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {event.start_time} - {event.end_time}
                  </p>
                  <p className="text-xs sm:text-sm">
                    {event.person_firstname || event.person_email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">No reservations scheduled for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
