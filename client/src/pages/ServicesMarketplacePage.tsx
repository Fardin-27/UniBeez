// Module 2: Skill-Based Service & Booking — developed by Member 3
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Service } from "../types";
import ServiceCard from "../components/ServiceCard";
import LoadingSpinner from "../components/LoadingSpinner";

const ServicesMarketplacePage: React.FC = () => {
  const { API_URL, user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("newest");

  const categories = [
    "tutoring",
    "technical_assistance",
    "creative_design",
    "campus_support",
    "fitness",
    "music",
    "language",
    "writing",
    "coding",
    "photography",
  ];

  useEffect(() => {
    fetchServices();
  }, [currentPage, searchQuery, selectedCategory, priceRange, sortBy, user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", "12");
      params.append("sort", sortBy);

      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (priceRange.min) params.append("minPrice", priceRange.min);
      if (priceRange.max) params.append("maxPrice", priceRange.max);

      const endpoint = `${API_URL}/api/services?${params}`;

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch services");

      const data = await response.json();
      const allServices: Service[] = data.data || [];
      const visibleServices = user
        ? allServices.filter((service) => {
            const providerId =
              typeof service.provider === "string"
                ? service.provider
                : service.provider?._id;
            return providerId !== user._id;
          })
        : allServices;

      setServices(visibleServices);
      setTotalPages(data.pagination?.pages || 1);
      setTotalServices(visibleServices.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleFilterChange();
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-white to-indigo-50/50">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-brand-600 to-violet-700 text-white py-14 shadow-inner">
          <div className="max-w-full px-4">
            <h1 className="text-5xl font-black mb-3 tracking-tighter">
              Services
            </h1>
            <p className="text-indigo-100 text-xl font-medium opacity-90">
              Discover and book skill-based services from students
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-full px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-sm p-6 h-fit">
              <h2 className="text-xl font-bold mb-6">Filters</h2>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Search Services
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">
                  Category
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={selectedCategory === ""}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={(e) => {
                          setSelectedCategory(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm capitalize">{cat.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">
                  Price Range (৳)
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, min: e.target.value });
                      handleFilterChange();
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, max: e.target.value });
                      handleFilterChange();
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Services Grid */}
            <div className="lg:col-span-3">
              {/* Results Info */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {services.length > 0 ? (currentPage - 1) * 12 + 1 : 0}-
                  {Math.min(currentPage * 12, totalServices)} of {totalServices}{" "}
                  services
                </p>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : services.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <ServiceCard key={service._id} service={service} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-500 text-white"
                                : "border hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <p className="text-gray-500 text-lg">
                    No services found. Try adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default ServicesMarketplacePage;
