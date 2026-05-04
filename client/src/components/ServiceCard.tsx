import React from "react";
import { useNavigate } from "react-router-dom";
import { Service, User } from "../types";
import { getImageUrl } from "../utils/imageUrl";
import { useAuth } from "../context/AuthContext";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const provider = service.provider as User;
  const handleOpenService = () => {
    navigate(`/services/${service._id}`);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-card border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
      onClick={handleOpenService}
    >
      {/* Service Image */}
      <div className="relative h-52 bg-slate-50 overflow-hidden">
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

        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-indigo-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
          {service.category.replace(/_/g, " ")}
        </div>

        {/* Rating Badge */}
        {service.averageRating > 0 && (
          <div className="absolute top-4 right-4 bg-amber-400/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
            ⭐ {service.averageRating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="font-extrabold text-xl mb-2 text-slate-900 line-clamp-2 leading-tight">
          {service.title}
        </h3>

        {/* Provider Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b">
          {provider?.avatar ? (
            <img
              src={getImageUrl(provider.avatar)}
              alt={provider?.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold flex items-center justify-center">
              {(provider?.fullName?.charAt(0) || "U").toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {provider?.fullName}
            </p>
            <p className="text-xs text-gray-500">{provider?.department}</p>
          </div>
        </div>

        {/* Skills and Duration */}
        {service.skillTags && service.skillTags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {service.skillTags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {service.skillTags.length > 3 && (
                <span className="text-gray-500 text-xs">
                  +{service.skillTags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Duration and Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            ⏱️ {Math.floor(service.sessionDuration / 60)}h {service.sessionDuration % 60}m
          </span>
          <span className="text-sm text-gray-600">
            {service.completedBookings} bookings
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
          <div>
            <p className="text-xs text-gray-600 capitalize">
              {service.pricingModel} rate
            </p>
            <p className="text-lg font-bold text-blue-600">
              ৳{service.price}
              {service.pricingModel === "hourly" ? "/hr" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenService();
            }}
            disabled={isAdmin}
            className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAdmin ? 'Admin View' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
