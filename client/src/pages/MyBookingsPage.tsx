// Module 2: Skill-Based Service & Booking — developed by Member 3
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ServiceBooking, Service, User } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";

const MyBookingsPage: React.FC = () => {
  const { API_URL, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const statusFilterOptions = [
    { value: "all", label: "All Bookings" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (user && (user.role === "seller" || user.role === "admin")) {
      navigate("/service-bookings", { replace: true });
      return;
    }
    fetchBookings();
  }, [statusFilter, user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("view", "buyer");
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`${API_URL}/api/bookings?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setBookings(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      setActionLoading(bookingId);
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) throw new Error("Failed to cancel booking");

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b))
      );

      alert("Booking cancelled successfully!");
      setExpandedBooking(null);
      setCancelReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRateService = async (bookingId: string) => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setActionLoading(bookingId);
      const service = bookings.find((b) => b._id === bookingId)?.service as Service;

      const response = await fetch(`${API_URL}/api/services/${service._id}/rating`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, review }),
      });

      if (!response.ok) throw new Error("Failed to rate service");

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, rating, review } : b
        )
      );

      alert("Service rated successfully!");
      setRating(0);
      setReview("");
      setExpandedBooking(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rate service");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (
    status: "requested" | "approved" | "rejected" | "completed" | "cancelled"
  ) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-gray-600">Track and manage your service bookings</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Status Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
          </div>

          {/* Bookings List */}
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const service = booking.service as Service;
                const provider = booking.provider as User;
                const isExpanded = expandedBooking === booking._id;

                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() =>
                        setExpandedBooking(isExpanded ? null : booking._id)
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {service?.title || "Service"}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-gray-600">
                            <span>📅 {formatDate(booking.bookingDate)}</span>
                            <span>🕐 {booking.startTime} - {booking.endTime}</span>
                            <span>💰 ৳{booking.totalPrice}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold mb-1">
                            {provider?.fullName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {provider?.department}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-6">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Session Type
                            </p>
                            <p className="font-semibold capitalize">
                              {booking.sessionType}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Total Price
                            </p>
                            <p className="font-semibold">৳{booking.totalPrice}</p>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                              Your Notes
                            </p>
                            <p className="bg-white p-3 rounded border">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {booking.providerNotes && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                              Provider's Notes
                            </p>
                            <p className="bg-white p-3 rounded border">
                              {booking.providerNotes}
                            </p>
                          </div>
                        )}

                        {booking.sessionType === "online" && booking.meetingLink && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                              Meeting Link
                            </p>
                            <a
                              href={booking.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {booking.meetingLink}
                            </a>
                          </div>
                        )}

                        {booking.sessionType === "in-person" &&
                          booking.meetingLocation && (
                            <div className="mb-6">
                              <p className="text-sm text-gray-600 mb-1">
                                Meeting Location
                              </p>
                              <p className="font-semibold">
                                {booking.meetingLocation}
                              </p>
                            </div>
                          )}

                        {/* Status-specific Actions */}
                        {booking.status === "completed" && booking.rating === 0 && (
                          <div className="space-y-4 border-t pt-6">
                            <h4 className="font-semibold">Rate this service</h4>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className={`text-3xl transition-transform hover:scale-110 ${
                                    star <= rating ? "text-yellow-400" : "text-gray-300"
                                  }`}
                                >
                                  ⭐
                                </button>
                              ))}
                            </div>

                            <textarea
                              value={review}
                              onChange={(e) => setReview(e.target.value)}
                              placeholder="Share your experience (optional)"
                              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                              rows={3}
                            />

                            <button
                              onClick={() => handleRateService(booking._id)}
                              disabled={actionLoading === booking._id || rating === 0}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking._id
                                ? "Submitting..."
                                : "Submit Rating"}
                            </button>
                          </div>
                        )}

                        {booking.rating > 0 && (
                          <div className="border-t pt-6 bg-green-50 rounded p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Your Rating:</span>
                              <span className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={
                                      star <= booking.rating
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                    }
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </span>
                            </div>
                            {booking.review && (
                              <p className="text-sm text-gray-700">
                                "{booking.review}"
                              </p>
                            )}
                          </div>
                        )}

                        {(booking.status === "requested" ||
                          booking.status === "approved") && (
                          <div className="border-t pt-6">
                            <textarea
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Reason for cancellation (optional)"
                              className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-3"
                              rows={2}
                            />
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking._id
                                ? "Cancelling..."
                                : "Cancel Booking"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">
                No bookings yet. Start exploring services in our marketplace!
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
