import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Service, User, TimeSlot } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { getImageUrl } from "../utils/imageUrl";
import DatePickerWithAvailability from "../components/DatePickerWithAvailability";

const ServiceDetailsPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { API_URL, user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hasAlreadyBooked, setHasAlreadyBooked] = useState(false);
  const [bookingCheckDone, setBookingCheckDone] = useState(true);
  const [messageText, setMessageText] = useState("");
  const isAdmin = user?.role === "admin";
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const bookingCheckRequestRef = useRef(0);

  const provider = service?.provider as User;

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (serviceId && user && selectedDate) {
      checkExistingBooking(selectedDate);
      return;
    }

    setHasAlreadyBooked(false);
    setBookingCheckDone(true);
  }, [serviceId, user, selectedDate]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch service");

      const data = await response.json();
      setService(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading service");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      setTimeSlots([]);
      const response = await fetch(
        `${API_URL}/api/timeslots/${serviceId}?date=${selectedDate}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch time slots");

      const data = await response.json();
      setTimeSlots(data.data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
    }
  };

  const checkExistingBooking = async (bookingDate: string) => {
    const requestId = bookingCheckRequestRef.current + 1;
    bookingCheckRequestRef.current = requestId;

    try {
      setBookingCheckDone(false);
      setHasAlreadyBooked(false);

      const params = new URLSearchParams();
      params.append("view", "buyer");
      params.append("serviceId", serviceId || "");
      params.append("bookingDate", bookingDate);
      params.append("limit", "100");

      const response = await fetch(`${API_URL}/api/bookings?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const existingBookings = data?.data || [];
      if (bookingCheckRequestRef.current !== requestId) return;

      setHasAlreadyBooked(
        existingBookings.some(
          (booking: { bookingDate?: string }) =>
            getDateKey(booking.bookingDate) === bookingDate
        )
      );
    } catch {
      if (bookingCheckRequestRef.current !== requestId) return;
      setHasAlreadyBooked(false);
    } finally {
      if (bookingCheckRequestRef.current !== requestId) return;
      setBookingCheckDone(true);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    if (hasAlreadyBooked) {
      alert("You already booked this service for this date. Please choose another available date.");
      return;
    }

    try {
      setIsBooking(true);

      const [startTime, endTime] = selectedTime.split("-");

      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId,
          bookingDate: selectedDate,
          startTime,
          endTime,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Booking failed");
      }

      setBookingSuccess(true);
      setHasAlreadyBooked(true);
      setTimeout(() => {
        navigate("/my-bookings");
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  const handleSendMessage = async () => {
    const providerId = provider?._id;

    if (!providerId || !service?._id) {
      alert("Provider details are not available yet");
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!messageText.trim()) {
      alert("Please write a message first");
      return;
    }

    try {
      setIsSendingMessage(true);

      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: providerId,
          contextType: "service",
          serviceId: service._id,
          message: messageText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      setMessageText("");
      navigate("/messages");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Service not found</p>
      </div>
    );
  }

  const durationHours = Math.floor(service.sessionDuration / 60);
  const durationMinutes = service.sessionDuration % 60;
  const isSelectedDateBooked = Boolean(selectedDate && hasAlreadyBooked);
  const isCheckingBookingDate = Boolean(selectedDate && !bookingCheckDone);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-full px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Details */}
            <div className="lg:col-span-2">
              {/* Images */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                {service.images && service.images.length > 0 ? (
                  <img
                    src={getImageUrl(service.images[0])}
                    alt={service.title}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              {/* Title and Basic Info */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                        {service.category.replace(/_/g, " ")}
                      </span>
                      {service.averageRating > 0 && (
                        <span className="flex items-center gap-1">
                          ⭐ {service.averageRating.toFixed(1)} (
                          {service.ratingCount} ratings)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="flex items-center gap-4 pb-6 border-b">
                  {provider?.avatar ? (
                    <img
                      src={getImageUrl(provider.avatar)}
                      alt={provider?.fullName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xl font-bold flex items-center justify-center">
                      {(provider?.fullName?.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {provider?.fullName}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {provider?.department} • {provider?.university}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        ⭐ {provider?.reputationScore || 0} reputation
                      </span>
                      <span className="text-gray-600">
                        {service.completedBookings} bookings completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">About this service</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {service.description}
                  </p>

                  {service.skillTags && service.skillTags.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Skills Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.skillTags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <p className="text-gray-600 text-sm">Session Duration</p>
                    <p className="font-semibold text-lg">
                      {durationHours}h {durationMinutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Pricing Model</p>
                    <p className="font-semibold text-lg capitalize">
                      {service.pricingModel}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Session Type</p>
                    <p className="font-semibold text-lg capitalize">
                      {service.sessionType === "in-person"
                        ? "In-Person"
                        : "Online"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">
                      {service.sessionType === "in-person"
                        ? "Meeting Location"
                        : "Meeting Link"}
                    </p>
                    {service.sessionType === "in-person" ? (
                      <p className="font-semibold text-sm text-gray-700">
                        {service.meetingLocation || "To be shared by provider"}
                      </p>
                    ) : (
                      <a
                        href={service.meetingLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sm text-blue-600 hover:underline break-all"
                      >
                        {service.meetingLink || "To be shared by provider"}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                {bookingSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-700 font-semibold">
                      ✓ Booking request sent successfully!
                    </p>
                    <p className="text-green-600 text-sm mt-2">
                      Redirecting to your bookings...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Price Summary */}
                    <div className="mb-6 pb-6 border-b">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Rate</span>
                        <span className="font-semibold">
                          ৳{service.price} {service.pricingModel === "hourly" ? "/hr" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Taxes & fees</span>
                        <span>Calculated at checkout</span>
                      </div>
                    </div>

                    <form onSubmit={handleBooking} className="space-y-4">
                      {isSelectedDateBooked && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                          You already booked this service for this date. Please choose another available date.
                        </div>
                      )}

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Select Date *
                        </label>
                        <DatePickerWithAvailability
                          serviceId={serviceId!}
                          onDateSelect={(date) => {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setSelectedTime("");
                            setSelectedDate(`${y}-${m}-${d}`);
                          }}
                        />
                        {selectedDate && (
                          <p className="mt-2 text-sm text-blue-600 font-medium">
                            Selected: {new Date(selectedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Time */}
                      {selectedDate && timeSlots.length > 0 ? (
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Select Time *
                          </label>
                          <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Choose a time slot</option>
                            {timeSlots.map((slot, index) => (
                              <option
                                key={index}
                                value={`${slot.startTime}-${slot.endTime}`}
                              >
                                {slot.startTime} - {slot.endTime}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : selectedDate ? (
                        <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
                          No available slots for this date
                        </div>
                      ) : null}

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any specific requirements or questions..."
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Book Button */}
                      <button
                        type="submit"
                        disabled={isBooking || isSelectedDateBooked || isCheckingBookingDate || isAdmin}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCheckingBookingDate
                          ? "Checking..."
                          : isAdmin
                          ? "Admins cannot book services"
                          : isSelectedDateBooked
                          ? "Date Already Booked"
                          : isBooking
                            ? "Booking..."
                            : "Send Booking Request"}
                      </button>
                    </form>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      The provider will review and respond to your request
                    </p>
                  </>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Send Message</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Ask a quick question before booking.
                  </p>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write a message to the provider..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      isSendingMessage ||
                      !messageText.trim() ||
                      !provider?._id ||
                      provider?._id === user?._id
                    }
                    className="w-full mt-3 bg-slate-800 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {provider?._id === user?._id
                      ? "This is your service"
                      : isSendingMessage
                        ? "Sending..."
                        : "Send Message"}
                  </button>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const getDateKey = (value?: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default ServiceDetailsPage;
