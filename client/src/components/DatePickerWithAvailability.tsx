import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth } from "../context/AuthContext";

interface Props {
  serviceId: string;
  onDateSelect: (date: Date) => void;
}

const DatePickerWithAvailability: React.FC<Props> = ({ serviceId, onDateSelect }) => {
  const { API_URL } = useAuth();
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());
  const [specificDates, setSpecificDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/timeslots/${serviceId}`);
        const data = await response.json();
        if (data.success) {
          const days = new Set<number>();
          const specifics = new Set<string>();

          data.data.forEach((slot: any) => {
            if (slot.isRecurring) {
              days.add(slot.dayOfWeek);
            } else if (slot.specificDate) {
              specifics.add(new Date(slot.specificDate).toDateString());
            }
          });

          setAvailableDays(days);
          setSpecificDates(specifics);
        }
      } catch (error) {
        console.error("Failed to fetch available dates:", error);
      }
    };

    fetchAvailableDates();
  }, [serviceId, API_URL]);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const day = date.getDay();
      const dateStr = date.toDateString();
      const isAvailable = availableDays.has(day) || specificDates.has(dateStr);

      // Don't highlight past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return "";

      return isAvailable ? "highlight-available" : "";
    }
    return "";
  };

  return (
    <div className="calendar-container">
      <style>{`
        .calendar-container .react-calendar {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.5rem;
          font-family: inherit;
        }
        .highlight-available {
          /* Existing green highlight for available dates */
          background: #ecfdf5 !important;
          color: #059669 !important;
          font-weight: bold;
          border-radius: 8px;
        }
      `}</style>
      {/* Override default react-calendar weekend styling to not be red unless available */}
      <style>{`
        .calendar-container .react-calendar__month-view__days__day--weekend {
          color: #333; /* Neutral color, or inherit, to override default red */
        }
      `}</style>
      <Calendar
        onClickDay={onDateSelect}
        tileClassName={tileClassName}
        minDate={new Date()}
      />
    </div>
  );
};

export default DatePickerWithAvailability;