import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TimeSlot, Service } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";

const ManageTimeSlotsPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { API_URL } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState("0");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isRecurring, setIsRecurring] = useState(true);
  const [specificDate, setSpecificDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    fetchData();
  }, [serviceId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch service details
      const serviceResponse = await fetch(`${API_URL}/api/services/${serviceId}`, {
        credentials: "include",
      });
      if (!serviceResponse.ok) throw new Error("Failed to fetch service");
      const serviceData = await serviceResponse.json();
      setService(serviceData.data);

      // Fetch time slots
      const slotsResponse = await fetch(`${API_URL}/api/timeslots/provider/my?serviceId=${serviceId}`, {
        credentials: "include",
      });
      if (!slotsResponse.ok) throw new Error("Failed to fetch time slots");
      const slotsData = await slotsResponse.json();
      setTimeSlots(slotsData.data);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      alert("Start time must be before end time");
      return;
    }

    if (!isRecurring && !specificDate) {
      alert("Please select a specific date for non-recurring slots");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/api/timeslots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          isRecurring,
          specificDate: !isRecurring ? specificDate : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create time slot");
      }

      const newSlot = await response.json();
      setTimeSlots((prev) => [...prev, newSlot.data]);

      // Reset form
      setStartTime("09:00");
      setEndTime("10:00");
      setIsRecurring(true);
      setSpecificDate("");
      setDayOfWeek("0");

      alert("Time slot created successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create time slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    try {
      setDeleteLoading(slotId);

      const response = await fetch(`${API_URL}/api/timeslots/${slotId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete time slot");

      setTimeSlots((prev) => prev.filter((s) => s._id !== slotId));
      alert("Time slot deleted successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete time slot");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleAvailability = async (slotId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/timeslots/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });

      if (!response.ok) throw new Error("Failed to update time slot");

      setTimeSlots((prev) =>
        prev.map((s) =>
          s._id === slotId ? { ...s, isAvailable: !isAvailable } : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update time slot");
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Group time slots by day of week
  const slotsByDay = days.reduce(
    (acc, day, index) => {
      acc[index] = timeSlots.filter((slot) => slot.dayOfWeek === index);
      return acc;
    },
    {} as Record<number, TimeSlot[]>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold mb-2">Manage Time Slots</h1>
            <p className="text-gray-600">
              Service: <span className="font-semibold">{service?.title}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add New Time Slot Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-bold mb-6">Add New Time Slot</h2>

                <form onSubmit={handleAddTimeSlot} className="space-y-4">
                  {/* Day of Week */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Day of Week *
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {days.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recurring */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="recurring" className="text-sm font-semibold">
                      Recurring Weekly
                    </label>
                  </div>

                  {/* Specific Date (for non-recurring) */}
                  {!isRecurring && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add Time Slot"}
                  </button>
                </form>
              </div>
            </div>

            {/* Existing Time Slots */}
            <div className="lg:col-span-2">
              {timeSlots.length > 0 ? (
                <div className="space-y-4">
                  {days.map((day, dayIndex) => (
                    <div key={dayIndex}>
                      {slotsByDay[dayIndex].length > 0 && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                          {/* Day Header */}
                          <div className="bg-blue-100 px-6 py-3 border-b">
                            <h3 className="font-bold text-lg">{day}</h3>
                          </div>

                          {/* Slots for this day */}
                          <div className="divide-y">
                            {slotsByDay[dayIndex].map((slot) => (
                              <div
                                key={slot._id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <p className="font-semibold">
                                      {slot.startTime} - {slot.endTime}
                                    </p>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        slot.isAvailable
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {slot.isAvailable ? "Available" : "Unavailable"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {slot.isRecurring
                                      ? "Recurring Weekly"
                                      : `One-time: ${new Date(
                                          slot.specificDate || ""
                                        ).toLocaleDateString()}`}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleToggleAvailability(
                                        slot._id,
                                        slot.isAvailable
                                      )
                                    }
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                      slot.isAvailable
                                        ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                        : "bg-green-500 text-white hover:bg-green-600"
                                    }`}
                                  >
                                    {slot.isAvailable ? "Disable" : "Enable"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTimeSlot(slot._id)}
                                    disabled={deleteLoading === slot._id}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                  >
                                    {deleteLoading === slot._id ? "..." : "Delete"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <p className="text-gray-600 text-lg mb-4">
                    No time slots created yet.
                  </p>
                  <p className="text-gray-500">
                    Add your first time slot using the form on the left.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ManageTimeSlotsPage;
