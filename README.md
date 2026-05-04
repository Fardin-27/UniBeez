# UniSphere – A Campus Community Marketplace and Service Platform

**Course:** CSE471 – System Analysis & Design (Spring 2025)

## Overview

UniSphere is a comprehensive campus community platform where university students can buy/sell products, offer and book skill-based services, communicate through real-time messaging, and participate in a trust-driven reputation system. An admin dashboard provides full platform oversight including dispute resolution, user management, and activity monitoring.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 5 + Tailwind CSS 3
- **Backend:** Node.js + Express 5 (ES Modules)
- **Database:** MongoDB Atlas (Mongoose 8 ODM)
- **Authentication:** JWT with httpOnly cookies (7-day expiry)
- **Password Hashing:** `crypto.pbkdf2Sync` (salt:hash format)
- **File Uploads:** Multer (local disk storage)

## User Roles

| Role             | Capabilities                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| Buyer (default)  | Browse products & services, cart, checkout, book services, message, review    |
| Seller           | All buyer features + create/manage products, fulfill orders                  |
| Service Provider | All buyer features + create/manage services, manage availability, bookings   |
| Admin            | Full system access: user management, disputes, flagged content, activity logs |

## Functional Modules

### Module 1 – Product & Transaction Management
- Product CRUD with 9 categories, new/used condition, image uploads
- Shopping cart with quantity management
- Order lifecycle: pending → confirmed → delivered (or cancelled)
- Payment methods: Cash on Delivery, bKash, Nagad, CampusPay

### Module 2 – Skill-Based Service & Booking
- Service listings with 8 categories, hourly/fixed pricing
- Availability slot management (date + time ranges)
- Booking workflow: requested → approved → completed (or cancelled)

### Module 3 – Feedback, Monitoring & Admin Panel
- Product and service reviews (1-5 stars + comments)
- Reputation scoring based on completed transactions
- Dispute submission and resolution system
- Real-time notifications (30s polling)
- In-app messaging between users
- Admin analytics dashboard with user/content management
- Activity logging for all significant platform actions

## Data Models (12)

| Model            | Purpose                                      |
| ---------------- | -------------------------------------------- |
| User             | Accounts with roles, reputation, restrictions |
| Product          | Marketplace listings with categories/flags    |
| Cart             | Per-user shopping cart with items              |
| Order            | Purchase records with status tracking          |
| Service          | Skill-based service offerings                  |
| AvailabilitySlot | Provider time slot management                  |
| Booking          | Service booking records                        |
| Review           | Product & service ratings/comments             |
| Message          | Direct messaging between users                 |
| Notification     | System notifications (9 types)                 |
| Dispute          | User-submitted disputes with admin resolution  |
| ActivityLog      | Platform-wide action logging (14 action types) |

## Project Structure

```
backend/
  ├── config/          # Multer configuration
  ├── controllers/     # 11 route handlers (MVC pattern)
  ├── lib/             # MongoDB connection
  ├── middleware/       # Auth (JWT + roles) & error handling
  ├── models/          # 12 Mongoose schemas
  ├── routes/          # 12 Express route groups
  └── index.js         # Entry point

client/
  └── src/
      ├── components/  # 8 reusable UI components
      ├── context/     # Auth, Cart, Notification providers
      ├── layouts/     # MainLayout (Navbar + Outlet + Footer)
      ├── pages/       # 30+ route pages
      ├── types/       # 16 TypeScript interfaces
      └── App.tsx      # Router configuration (30+ routes)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/unisphere
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:3000`.

## API Endpoints

### Authentication
| Method | Endpoint              | Description        | Auth     |
| ------ | --------------------- | ------------------ | -------- |
| POST   | /api/auth/register    | Register user      | Public   |
| POST   | /api/auth/login       | Login              | Public   |
| GET    | /api/auth/profile     | Current user       | Required |
| POST   | /api/auth/logout      | Logout             | Required |

### Products & Cart
| Method | Endpoint              | Description            | Auth     |
| ------ | --------------------- | ---------------------- | -------- |
| GET    | /api/products         | Browse products        | Public   |
| POST   | /api/products         | Create product         | Seller   |
| GET    | /api/cart             | Get cart               | Required |
| POST   | /api/cart/add         | Add to cart            | Required |

### Orders
| Method | Endpoint              | Description            | Auth     |
| ------ | --------------------- | ---------------------- | -------- |
| POST   | /api/orders           | Place order            | Required |
| GET    | /api/orders           | My orders              | Required |
| PATCH  | /api/orders/:id/status| Update order status    | Required |

### Services & Bookings
| Method | Endpoint                    | Description              | Auth      |
| ------ | --------------------------- | ------------------------ | --------- |
| GET    | /api/services               | Browse services          | Public    |
| POST   | /api/services               | Create service           | Provider  |
| POST   | /api/bookings               | Book a service           | Required  |
| GET    | /api/services/:id/slots     | Available time slots     | Public    |

### Communication
| Method | Endpoint              | Description            | Auth     |
| ------ | --------------------- | ---------------------- | -------- |
| GET    | /api/messages         | Conversations          | Required |
| POST   | /api/messages         | Send message           | Required |
| GET    | /api/notifications    | Get notifications      | Required |

### Reviews & Disputes
| Method | Endpoint              | Description            | Auth     |
| ------ | --------------------- | ---------------------- | -------- |
| POST   | /api/reviews          | Submit review          | Required |
| POST   | /api/disputes         | Submit dispute         | Required |

### Admin
| Method | Endpoint              | Description            | Auth  |
| ------ | --------------------- | ---------------------- | ----- |
| GET    | /api/admin/users      | Manage users           | Admin |
| GET    | /api/admin/analytics  | Platform analytics     | Admin |
| GET    | /api/admin/disputes   | All disputes           | Admin |
| GET    | /api/admin/activity   | Activity logs          | Admin |