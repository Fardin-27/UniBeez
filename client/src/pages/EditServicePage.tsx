import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Service, TimeSlot } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";

const EditServicePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { API_URL } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingRecurringSlots, setExistingRecurringSlots] = useState<TimeSlot[]>([]);
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
    skillTags: "",
    isActive: true,
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

  useEffect(() => {
    const fetchServiceAndSlots = async () => {
      try {
        setLoading(true);
        const [serviceResponse, slotsResponse] = await Promise.all([
          fetch(`${API_URL}/api/services/${serviceId}`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/timeslots/provider/my?serviceId=${serviceId}`, {
            credentials: "include",
          }),
        ]);

        if (!serviceResponse.ok) throw new Error("Failed to load service");
        if (!slotsResponse.ok) throw new Error("Failed to load time slots");

        const serviceData = await serviceResponse.json();
        const slotsData = await slotsResponse.json();
        const service: Service = serviceData.data;
        const allSlots: TimeSlot[] = slotsData.data || [];
        const recurringSlots = allSlots.filter((slot) => slot.isRecurring);

        setFormData({
          title: service.title || "",
          description: service.description || "",
          category: service.category || "tutoring",
          pricingModel: service.pricingModel || "hourly",
          price: String(service.price ?? ""),
          sessionType: service.sessionType || "online",
          meetingLink: service.meetingLink || "",
          meetingLocation: service.meetingLocation || "",
          skillTags: (service.skillTags || []).join(", "),
          isActive: service.isActive,
        });

        setExistingRecurringSlots(recurringSlots);

        const days = Array.from(new Set(recurringSlots.map((slot) => slot.dayOfWeek))).sort(
          (a, b) => a - b
        );
        setSelectedDays(days);

        if (recurringSlots.length > 0) {
          setSlotStartTime(recurringSlots[0].startTime);
          setSlotEndTime(recurringSlots[0].endTime);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service");
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) fetchServiceAndSlots();
  }, [API_URL, serviceId]);

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) return setError("Service title is required");
    if (!formData.description.trim()) return setError("Description is required");
    if (!formData.price || Number(formData.price) <= 0) return setError("Valid price is required");
    if (formData.sessionType === "online" && !formData.meetingLink.trim()) {
      return setError("Meeting link is required for online services");
    }
    if (
      formData.sessionType === "in-person" &&
      !formData.meetingLocation.trim()
    ) {
      return setError("Meeting location is required for in-person services");
    }
    if (selectedDays.length === 0) return setError("Please select at least one available day");
    if (timeToMinutes(slotStartTime) >= timeToMinutes(slotEndTime)) {
      return setError("Start time must be before end time");
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          pricingModel: formData.pricingModel,
          price: Number(formData.price),
          sessionType: formData.sessionType,
          meetingLink: formData.meetingLink,
          meetingLocation: formData.meetingLocation,
          skillTags: formData.skillTags,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update service");
      }

      const existingByDay = new Map<number, TimeSlot>();
      existingRecurringSlots.forEach((slot) => {
        if (!existingByDay.has(slot.dayOfWeek)) {
          existingByDay.set(slot.dayOfWeek, slot);
        }
      });

      for (const dayOfWeek of selectedDays) {
        const existingSlot = existingByDay.get(dayOfWeek);

        if (existingSlot) {
          const updateSlotResponse = await fetch(`${API_URL}/api/timeslots/${existingSlot._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              dayOfWeek,
              startTime: slotStartTime,
              endTime: slotEndTime,
              isRecurring: true,
              isAvailable: true,
            }),
          });

          if (!updateSlotResponse.ok) {
            const data = await updateSlotResponse.json();
            throw new Error(data.message || "Failed to update a time slot");
          }
        } else {
          const createSlotResponse = await fetch(`${API_URL}/api/timeslots`, {
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

          if (!createSlotResponse.ok) {
            const data = await createSlotResponse.json();
            throw new Error(data.message || "Failed to create a time slot");
          }
        }
      }

      const selectedDaySet = new Set(selectedDays);
      const slotsToDelete = existingRecurringSlots.filter(
        (slot) => !selectedDaySet.has(slot.dayOfWeek)
      );

      for (const slot of slotsToDelete) {
        const deleteSlotResponse = await fetch(`${API_URL}/api/timeslots/${slot._id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!deleteSlotResponse.ok) {
          const data = await deleteSlotResponse.json();
          throw new Error(data.message || "Failed to remove unselected time slot");
        }
      }

      alert("Service updated successfully!");
      navigate("/my-services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

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
          <h1 className="text-3xl font-bold mb-2">Edit Service</h1>
          <p className="text-gray-600 mb-6">Update your service details</p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Service Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Session Type *</label>
                <select
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="online">Online Session</option>
                  <option value="in-person">In-Person Session</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Pricing Model *</label>
                <select
                  name="pricingModel"
                  value={formData.pricingModel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hourly">Hourly Rate</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
            </div>

            {formData.sessionType === "online" ? (
              <div>
                <label className="block text-sm font-semibold mb-2">Meeting Link *</label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold mb-2">Meeting Location *</label>
                <input
                  type="text"
                  name="meetingLocation"
                  value={formData.meetingLocation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Price {formData.pricingModel === "hourly" ? "(per hour)" : ""} *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Skill Tags (comma-separated)</label>
              <input
                type="text"
                name="skillTags"
                value={formData.skillTags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border rounded-lg p-4 bg-blue-50/40">
              <h3 className="text-base font-semibold mb-3">Weekly Availability *</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select days and one recurring time range for this service.
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-semibold">Service is active</label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
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

export default EditServicePage;
