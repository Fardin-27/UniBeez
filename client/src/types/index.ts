// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  _id: string;
  recipient: string;
  sender?: { _id: string; fullName: string; avatar?: string } | null;
  type:
    | "message"
    | "booking_request"
    | "booking_approved"
    | "booking_rejected"
    | "booking_completed"
    | "booking_cancelled"
    | "order_placed"
    | "order_status"
    | "product_flagged"
    | "product_unflagged";
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  entityId?: string;
  entityType?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: "buyer" | "seller" | "admin";
  studentId?: string;
  department?: string;
  university?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  reputationScore: number;
  totalCompletedTransactions: number;
  isActive: boolean;
  isRestricted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  productCondition: "new" | "used";
  quantity: number;
  images: string[];
  category: string;
  seller: User | string;
  isAvailable: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  _id: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  product: string | Product;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  buyer: User | string;
  seller: User | string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  paymentMethod: string;
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── ActivityLog ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  _id: string;
  user: User | string;
  action: string;
  description: string;
  relatedId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface Service {
  _id: string;
  provider: User | string;
  title: string;
  description: string;
  category:
    | "tutoring"
    | "technical_assistance"
    | "creative_design"
    | "campus_support"
    | "fitness"
    | "music"
    | "language"
    | "writing"
    | "coding"
    | "photography"
    | "other";
  pricingModel: "hourly" | "fixed";
  price: number;
  sessionType: "online" | "in-person";
  meetingLink?: string;
  meetingLocation?: string;
  sessionDuration: number; // in minutes
  skillTags: string[];
  images: string[];
  ratingCount: number;
  averageRating: number;
  isActive: boolean;
  completedBookings: number;
  responseTime: number;
  createdAt: string;
  updatedAt: string;
}

// ─── TimeSlot ────────────────────────────────────────────────────────────────

export interface TimeSlot {
  _id: string;
  service: string | Service;
  provider: string | User;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isRecurring: boolean;
  specificDate?: string;
  isAvailable: boolean;
  bookedSlots?: Array<{
    startTime: string;
    endTime: string;
    bookingId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ─── ServiceBooking ──────────────────────────────────────────────────────────

export interface ServiceBooking {
  _id: string;
  service: Service | string;
  provider: User | string;
  buyer: User | string;
  bookingDate: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  status: "requested" | "approved" | "rejected" | "completed" | "cancelled";
  totalPrice: number;
  notes?: string;
  providerNotes?: string;
  rating: number;
  review?: string;
  meetingLink?: string;
  meetingLocation?: string;
  sessionType: "online" | "in-person";
  completedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
