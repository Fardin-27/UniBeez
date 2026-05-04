import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Service } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { getImageUrl } from "../utils/imageUrl";

const MyServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { API_URL } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMyServices();
  }, []);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/services/my/listings`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch services");

      const data = await response.json();
      setServices(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      setDeleteLoading(serviceId);
      const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete service");
      }

      setServices((prev) => prev.filter((s) => s._id !== serviceId));
      setExpandedService(null);
      alert("Service deleted successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error("Failed to update service");

      setServices((prev) =>
        prev.map((s) =>
          s._id === serviceId ? { ...s, isActive: !isActive } : s
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update service");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Services</h1>
              <p className="text-gray-600">
                Manage your skill-based services and bookings
              </p>
            </div>
            <button
              onClick={() => navigate("/services/create")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + Create New Service
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Service Image */}
                  <div className="relative h-40 bg-gray-100">
                    {service.images && service.images.length > 0 ? (
                      <img
                        src={getImageUrl(service.images[0])}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        service.isActive ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {service.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {service.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm border-y py-3">
                      <div>
                        <p className="text-gray-600">Bookings</p>
                        <p className="font-semibold">
                          {service.completedBookings}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rating</p>
                        <p className="font-semibold">
                          {service.averageRating ? service.averageRating.toFixed(1) : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4 bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600 capitalize">
                        {service.pricingModel} rate
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ৳{service.price}
                        {service.pricingModel === "hourly" ? "/hr" : ""}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          setExpandedService(
                            expandedService === service._id ? null : service._id
                          )
                        }
                        className="w-full bg-gray-100 text-gray-700 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
                      >
                        {expandedService === service._id ? "Hide" : "Show"} Details
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedService === service._id && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        <button
                          onClick={() => navigate(`/services/${service._id}/edit`)}
                          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors"
                        >
                          Edit Service
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/services/${service._id}/manage-slots`)
                          }
                          className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition-colors"
                        >
                          Manage Time Slots
                        </button>

                        <button
                          onClick={() =>
                            handleToggleStatus(service._id, service.isActive)
                          }
                          className={`w-full py-2 rounded font-medium transition-colors ${
                            service.isActive
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {service.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(service._id)}
                          disabled={deleteLoading === service._id}
                          className="w-full bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading === service._id
                            ? "Deleting..."
                            : "Delete Service"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">
                You haven't created any services yet.
              </p>
              <button
                onClick={() => navigate("/services/create")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create Your First Service
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default MyServicesPage;
