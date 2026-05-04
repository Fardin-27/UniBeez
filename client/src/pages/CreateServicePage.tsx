import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CreateServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { API_URL } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [slotStartTime, setSlotStartTime] = useState("11:00");
  const [slotEndTime, setSlotEndTime] = useState("12:00");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "tutoring",
    pricingModel: "hourly",
    price: "",
    sessionType: "online",
    meetingLink: "",
    meetingLocation: "",
    sessionDuration: "60",
    skillTags: "",
  });

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

  const daysOfWeek = [
    { value: 0, label: "Sunday", short: "Sun" },
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Limit to 5 images
    const newFiles = files.slice(0, 5 - images.length);
    setImages((prev) => [...prev, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDaySelection = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((day) => day !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  const timeToMinutes = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("=== CREATE SERVICE ATTEMPT ===");
    console.log("Form data:", formData);
    console.log("Images count:", images.length);

    // Validation
    if (!formData.title.trim()) {
      setError("Service title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Valid price is required");
      return;
    }
    if (formData.sessionType === "online" && !formData.meetingLink.trim()) {
      setError("Meeting link is required for online services");
      return;
    }
    if (
      formData.sessionType === "in-person" &&
      !formData.meetingLocation.trim()
    ) {
      setError("Meeting location is required for in-person services");
      return;
    }
    if (selectedDays.length === 0) {
      setError("Please select at least one available day");
      return;
    }
    if (timeToMinutes(slotStartTime) >= timeToMinutes(slotEndTime)) {
      setError("Time slot start time must be before end time");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("pricingModel", formData.pricingModel);
      data.append("price", formData.price);
      data.append("sessionType", formData.sessionType);
      data.append("meetingLink", formData.meetingLink);
      data.append("meetingLocation", formData.meetingLocation);
      data.append("sessionDuration", formData.sessionDuration);
      data.append("skillTags", formData.skillTags);

      // Add images
      images.forEach((image, index) => {
        console.log(`Adding image ${index}:`, image.name, image.size);
        data.append("images", image);
      });

      const url = `${API_URL}/api/services`;
      console.log("Creating service at URL:", url);
      console.log("API_URL value:", API_URL);
      
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: data,
      });

      console.log("Response received");
      console.log("Response status:", response.status, response.statusText);
      console.log("Response headers:", response.headers);

      const responseText = await response.text();
      console.log("Raw response:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        console.error("Error data:", errorData);
        const detailedMessage = Array.isArray(errorData?.errors) && errorData.errors.length > 0
          ? errorData.errors.join("\n")
          : errorData?.message;
        throw new Error(detailedMessage || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = JSON.parse(responseText);
      console.log("Service created successfully:", result);

      const serviceId = result.data?._id;

      if (!serviceId) {
        throw new Error("Service created but no service ID was returned");
      }

      const slotErrors: string[] = [];

      for (const dayOfWeek of selectedDays) {
        const slotResponse = await fetch(`${API_URL}/api/timeslots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            serviceId,
            dayOfWeek,
            startTime: slotStartTime,
            endTime: slotEndTime,
            isRecurring: true,
          }),
        });

        if (!slotResponse.ok) {
          let slotErrorMessage = `Failed for ${daysOfWeek[dayOfWeek].label}`;
          try {
            const slotErrorData = await slotResponse.json();
            slotErrorMessage =
              slotErrorData?.message ||
              `${slotErrorMessage}: ${slotResponse.status}`;
          } catch {
            slotErrorMessage = `${slotErrorMessage}: ${slotResponse.status}`;
          }
          slotErrors.push(slotErrorMessage);
        }
      }

      if (slotErrors.length > 0) {
        throw new Error(
          `Service created, but some time slots failed: ${slotErrors.join("; ")}`
        );
      }

      alert("Service and recurring time slots created successfully!");
      navigate("/my-services"); // Redirect to My Services page instead of the booking page
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error creating service";
      console.error("❌ Create service failed:", errorMsg);
      console.error("Stack trace:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-2">Create a New Service</h1>
            <p className="text-gray-600 mb-6">
              List your skill-based service and start accepting bookings
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Service Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Math Tutoring for Class 10"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your service in detail, including what you offer and what students can expect..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  rows={5}
                  required
                />
              </div>

              {/* Category and Pricing Model */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace(/_/g, " ").toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Session Type *
                  </label>
                  <select
                    name="sessionType"
                    value={formData.sessionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="online">Online Session</option>
                    <option value="in-person">In-Person Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Pricing Model *
                  </label>
                  <select
                    name="pricingModel"
                    value={formData.pricingModel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="hourly">Hourly Rate</option>
                    <option value="fixed">Fixed Price</option>
                  </select>
                </div>
              </div>

              {formData.sessionType === "online" ? (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meeting Link *
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    placeholder="e.g., https://meet.google.com/..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meeting Location *
                  </label>
                  <input
                    type="text"
                    name="meetingLocation"
                    value={formData.meetingLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., Campus Library, Room 204"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              {/* Price */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Price {formData.pricingModel === "hourly" ? "(per hour)" : ""} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">
                      ৳
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="500"
                      className="w-full pl-7 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Skill Tags */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Skill Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="skillTags"
                  value={formData.skillTags}
                  onChange={handleInputChange}
                  placeholder="e.g., Algebra, Geometry, Problem Solving"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Weekly Availability */}
              <div className="border rounded-lg p-4 bg-blue-50/40">
                <h3 className="text-base font-semibold mb-3">Weekly Availability *</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select days and one recurring slot, for example Mon + Wed at 11:00-12:00.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Available Days *</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => {
                      const isSelected = selectedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDaySelection(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={slotStartTime}
                      onChange={(e) => setSlotStartTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">End Time *</label>
                    <input
                      type="time"
                      value={slotEndTime}
                      onChange={(e) => setSlotEndTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Service Images (up to 5)
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={images.length >= 5}
                    className="hidden"
                    id="image-input"
                  />
                  <label
                    htmlFor="image-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </span>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-3">
                      Selected Images ({imagePreviews.length}/5)
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Service"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
};

export default CreateServicePage;
