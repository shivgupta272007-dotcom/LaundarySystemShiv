# 🧺 LaundryFlow — Mini Laundry Order Management System

A lightweight, full-stack laundry order management system built for dry cleaning stores. Create orders, track statuses, calculate billing, and view business insights — all from a clean, modern dashboard.

![Dashboard](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Optional-yellow) ![Status](https://img.shields.io/badge/Status-Working-brightgreen)

---

## 📋 Table of Contents

- [Features Implemented](#-features-implemented)
- [Tech Stack](#-tech-stack)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [AI Usage Report](#-ai-usage-report)
- [Tradeoffs & Future Improvements](#-tradeoffs--future-improvements)

---

## ✅ Features Implemented

### Core Features
| Feature | Status | Description |
|---------|--------|-------------|
| **Create Order** | ✅ | Customer name, phone, garments with auto-pricing, unique Order ID (LD-XXXXX) |
| **Order Status** | ✅ | RECEIVED → PROCESSING → READY → DELIVERED flow |
| **View Orders** | ✅ | List all orders with filters (status, customer, phone, garment type) |
| **Dashboard** | ✅ | Total orders, revenue, status breakdown, recent orders |

### Bonus Features
| Feature | Status | Description |
|---------|--------|-------------|
| **Frontend UI** | ✅ | Full single-page app with dark theme, responsive design |
| **Authentication** | ✅ | JWT-based user registration and login |
| **Database (MongoDB)** | ✅ | MongoDB support with automatic in-memory fallback |
| **Search by Garment** | ✅ | Filter orders by garment type (e.g., "Shirt", "Saree") |
| **Estimated Delivery** | ✅ | Auto-calculated based on garment complexity (24h standard, 48h heavy) |
| **Price Configuration** | ✅ | 22 garment types with configurable pricing |

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express 5
- **Database**: MongoDB (via Mongoose) — *auto-falls back to in-memory storage*
- **Auth**: JWT + bcrypt
- **Frontend**: Vanilla HTML/CSS/JS (no framework, served by Express)
- **Styling**: Custom CSS with dark mode, responsive design

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB (optional — system works without it, using in-memory storage)

### Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd laundry-order-system

# 2. Install dependencies
npm install

# 3. Configure environment (optional — defaults work out of the box)
cp .env.example .env
# Edit .env if you want to change ports or connect to MongoDB

# 4. Start the server
npm start

# Server runs at http://localhost:5000
```

### With MongoDB (optional)

```bash
# Make sure MongoDB is running, then update .env:
MONGODB_URI=mongodb://localhost:27017/laundry_orders

# Start the server — it will auto-detect and use MongoDB
npm start
```

> **Note**: If MongoDB is not available, the system seamlessly falls back to in-memory storage. All features work identically in both modes.

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List all orders (with filters) |
| `GET` | `/api/orders/:orderId` | Get a single order |
| `PATCH` | `/api/orders/:orderId/status` | Update order status |
| `DELETE` | `/api/orders/:orderId` | Delete an order |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Get dashboard statistics |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT token |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prices` | Get garment price list |
| `GET` | `/api/health` | Health check |

### Example: Create Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Raj Sharma",
    "phoneNumber": "9876543210",
    "garments": [
      { "garmentType": "Shirt", "quantity": 3 },
      { "garmentType": "Pants", "quantity": 2 }
    ],
    "notes": "Stain on collar"
  }'
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "orderId": "LD-00001",
    "customerName": "Raj Sharma",
    "phoneNumber": "9876543210",
    "garments": [
      { "garmentType": "Shirt", "quantity": 3, "pricePerItem": 40, "subtotal": 120 },
      { "garmentType": "Pants", "quantity": 2, "pricePerItem": 50, "subtotal": 100 }
    ],
    "totalAmount": 220,
    "status": "RECEIVED",
    "estimatedDelivery": "2026-04-16T16:26:46.586Z"
  }
}
```

### Example: Update Status

```bash
curl -X PATCH http://localhost:5000/api/orders/LD-00001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PROCESSING"}'
```

### Example: Filter Orders

```bash
# By status
curl "http://localhost:5000/api/orders?status=RECEIVED"

# By customer name
curl "http://localhost:5000/api/orders?customer=Raj"

# By garment type
curl "http://localhost:5000/api/orders?garmentType=Shirt"
```

### Postman Collection

A Postman collection file is included at `postman_collection.json` — import it into Postman to test all endpoints.

---

## 🤖 AI Usage Report

### Tools Used
- **Gemini (Antigravity Coding Agent)** — Primary tool for scaffolding, code generation, and iteration

### How AI Was Leveraged

#### 1. Project Scaffolding
**Prompt approach**: Provided the entire assignment specification and asked for a full-stack implementation.

AI generated:
- Project structure (server/models/routes/middleware/config)
- Express server with MongoDB + in-memory fallback
- Complete REST API with CRUD operations
- Full frontend SPA with dashboard, forms, and tables

#### 2. Where AI Helped Most
- **Boilerplate reduction**: Mongoose models, Express routes, JWT auth middleware — all scaffolded instantly
- **Design system**: Complete CSS with dark mode, status badges, responsive layout
- **Dual storage**: The MongoDB + in-memory fallback pattern was generated correctly on first attempt
- **Garment pricing**: AI generated a realistic price list for 22 Indian garment types

#### 3. What AI Got Wrong & What I Fixed

| Issue | Fix |
|-------|-----|
| **Express 5 wildcard route** | AI used `app.get('*', ...)` which fails in Express 5. Fixed to `app.get('/{*splat}', ...)` |
| **MongoDB connection hanging** | No timeout configured — server would hang forever if MongoDB was unavailable. Added `serverSelectionTimeoutMS: 3000` |
| **In-memory module** | Initially used `require('crypto')` for UUID which is a Node.js built-in with different API. Switched to custom ID generation |

#### 4. Sample Prompts Used
- *"Build a Mini Laundry Order Management System with Express, MongoDB, and a frontend..."* (full spec)
- *"Fix Express 5 path-to-regexp error for wildcard route"*
- *"Add connection timeout to prevent server hanging when MongoDB is unavailable"*

---

## ⚖️ Tradeoffs & Future Improvements

### What I Skipped
- **Deployment**: Not deployed to a cloud service (would use Render/Railway for quick deploy)
- **Input validation library**: Used manual validation instead of Joi/Zod for simplicity
- **Unit tests**: Prioritized working features over test coverage
- **Pagination UI**: Backend supports pagination, frontend loads all orders

### What I'd Improve With More Time
1. **Add Joi/Zod validation** for request body schemas
2. **WebSocket updates** for real-time dashboard refresh
3. **Customer history** — look up past orders by phone number
4. **Receipt generation** — print-ready PDF receipts
5. **Deploy to Render** with MongoDB Atlas
6. **Add unit tests** with Jest and Supertest
7. **Role-based access control** — staff vs admin permissions
8. **Order history/audit trail** — track status change timestamps

---

## 📁 Project Structure

```
laundry-order-system/
├── server.js                    # Entry point
├── .env                         # Environment variables
├── package.json
├── postman_collection.json      # API test collection
├── server/
│   ├── config/
│   │   ├── db.js                # MongoDB connection + fallback
│   │   └── garments.js          # Pricing & delivery configuration
│   ├── middleware/
│   │   └── auth.js              # JWT auth middleware
│   ├── models/
│   │   ├── Order.js             # Order mongoose model
│   │   └── User.js              # User mongoose model
│   ├── routes/
│   │   ├── orders.js            # Order CRUD routes
│   │   ├── dashboard.js         # Dashboard statistics
│   │   └── auth.js              # Auth routes
│   └── store/
│       └── inMemory.js          # In-memory storage fallback
└── public/
    ├── index.html               # SPA entry point
    ├── css/
    │   └── style.css            # Design system
    └── js/
        └── app.js               # Client-side logic
```

---

## 📜 License

ISC
