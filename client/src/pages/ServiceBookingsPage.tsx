import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ServiceBooking, User, Service } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";

const ServiceBookingsPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const statusFilterOptions = [
    { value: "all", label: "All Bookings" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("view", "provider");
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

  const handleApprove = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to approve booking");

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "approved" } : b))
      );

      alert("Booking approved successfully!");
      setExpandedBooking(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(bookingId);
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) throw new Error("Failed to reject booking");

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "rejected" } : b))
      );

      alert("Booking rejected successfully!");
      setExpandedBooking(null);
      setRejectionReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (bookingId: string, providerNotes: string) => {
    try {
      setActionLoading(bookingId);
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ providerNotes }),
      });

      if (!response.ok) throw new Error("Failed to complete booking");

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "completed" } : b))
      );

      alert("Booking marked as completed!");
      setExpandedBooking(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete booking");
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
            <h1 className="text-3xl font-bold mb-2">Service Booking Requests</h1>
            <p className="text-gray-600">
              Manage bookings for your services
            </p>
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
                const buyer = booking.buyer as User;
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
                        setExpandedBooking(
                          isExpanded ? null : booking._id
                        )
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
                            {buyer?.fullName}
                          </p>
                          <p className="text-sm text-gray-600">{buyer?.email}</p>

                          {booking.status === "requested" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(booking._id);
                              }}
                              disabled={actionLoading === booking._id}
                              className="mt-3 inline-flex items-center justify-center bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking._id ? "Accepting..." : "Accept"}
                            </button>
                          )}
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

                        {booking.notes && (
                          <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                              Student's Notes
                            </p>
                            <p className="bg-white p-3 rounded border">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {booking.status === "requested" && (
                          <div className="space-y-4">
                            <button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking._id
                                ? "Accepting..."
                                : "Accept Booking"}
                            </button>

                            <div>
                              <textarea
                                value={rejectionReason}
                                onChange={(e) =>
                                  setRejectionReason(e.target.value)
                                }
                                placeholder="Reason for rejection (optional)"
                                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                                rows={2}
                              />
                              <button
                                onClick={() => handleReject(booking._id)}
                                disabled={actionLoading === booking._id}
                                className="w-full mt-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === booking._id
                                  ? "Rejecting..."
                                  : "Reject Booking"}
                              </button>
                            </div>
                          </div>
                        )}

                        {booking.status === "approved" && (
                          <div>
                            <textarea
                              placeholder="Add notes about the completed session (optional)"
                              className="w-full px-3 py-2 border rounded-lg text-sm resize-none mb-3"
                              rows={2}
                              id={`notes-${booking._id}`}
                            />
                            <button
                              onClick={() => {
                                const notes = (
                                  document.getElementById(
                                    `notes-${booking._id}`
                                  ) as HTMLTextAreaElement
                                ).value;
                                handleComplete(booking._id, notes);
                              }}
                              disabled={actionLoading === booking._id}
                              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === booking._id
                                ? "Completing..."
                                : "Mark as Completed"}
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
                No booking requests yet. Share your services to get started!
              </p>
            </div>
          )}
        </div>
    </div>
  );
};

export default ServiceBookingsPage;
