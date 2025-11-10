# Offer App API

A Common Offers Marketing Platform API built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication**: Secure registration and login for members, partners, and admins
- **Partner Management**: Partners can register, manage their profile, and create/manage offers
- **Offer Management**: Create, update, delete offers with expiry dates and analytics
- **Member Dashboard**: Browse, search, filter, save, and review offers
- **Admin Panel**: Manage users, approve/reject partners, monitor activity, and generate reports
- **Analytics**: Track views, clicks, and redemptions for offers
- **Notifications**: Real-time notifications for users
- **Role-Based Access Control**: Secure endpoints with proper authorization

## Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **bcrypt** for password hashing
- **ESM** module syntax

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

**Note:** You may see deprecation warnings during installation (e.g., `inflight`, `npmlog`, `rimraf`, etc.). These warnings come from transitive dependencies (dependencies of dependencies) used by packages like `bcrypt` for native compilation. They are **harmless** and do not affect the functionality of the application. These warnings will be resolved as package maintainers update their dependencies.

3. Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (supports both MONGO_URI and MONGODB_URI)
MONGO_URI=mongodb://localhost:27017/offer-app
# OR
# MONGODB_URI=mongodb://localhost:27017/offer-app

# For MongoDB Atlas, use:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# Admin Seeder Configuration (optional - defaults provided)
ADMIN_EMAIL=admin@offerapp.com
ADMIN_PASSWORD=Admin123!@#
```

4. Seed admin user (required for admin access):

```bash
npm run db:seed
```

This will create an admin user with:

- Email: `admin@offerapp.com` (or set `ADMIN_EMAIL` in .env)
- Password: `Admin@123` (or set `ADMIN_PASSWORD` in .env)

**Note:** Admin accounts cannot be registered through the API for security. They must be created using this seeder.

5. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Database Seeders

### Create Admin User

```bash
npm run db:seed
```

Creates an admin user. You can customize the email and password by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file.

### Clear All Collections

```bash
npm run db:clear
```

Removes all data from all collections but keeps the database structure intact. Useful for development/testing.

**⚠️ Warning:** This will delete all data including users, partners, offers, reviews, etc. Use with caution!

## API Endpoints

### Public Routes (No Authentication Required)

- `GET /api/offers` - Browse all active offers (with search, filter, pagination)
- `GET /api/offers/:id` - Get a single offer details
- `GET /api/offers/:id/reviews` - Get reviews for an offer
- `GET /api/offers/categories` - Get all available categories
- `POST /api/offers/:id/click` - Click on an offer (track analytics)

**Note:** Public routes work without authentication. If a user is logged in, they'll see additional information like whether offers are saved.

### Authentication

- `POST /api/auth/register` - Register a new user (member or partner)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

#### Registration Examples

**Register as Member:**
```json
POST /api/auth/register
{
  "email": "member@example.com",
  "password": "password123",
  "role": "member",
  "firstName": "John",
  "lastName": "Doe",
  "mobileNumber": "0771234567",
  "address": {
    "street": "123 Main Street",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00100"
  },
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

**Register as Partner:**
```json
POST /api/auth/register
{
  "email": "partner@example.com",
  "password": "password123",
  "role": "partner",
  "partnerName": "John Doe",
  "shopName": "ABC Shop",
  "location": {
    "street": "456 Business Road",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00200"
  },
  "category": "Restaurant",
  "contactInfo": {
    "mobileNumber": "0771234567",
    "website": "https://example.com"
  }
}
```

**Note:** 
- Address format follows Sri Lankan address pattern (25 districts)
- Mobile number must be valid Sri Lankan format (9 digits with optional +94 or 0 prefix)
- Postal code must be 5 digits
- All validations happen BEFORE user creation - if partner/member data is invalid, user won't be created

### Partner Routes (Protected - Requires Authentication)

- `GET /api/partners/profile` - Get partner profile
- `PUT /api/partners/profile` - Update partner profile
- `GET /api/partners/offers` - Get all partner's offers
- `POST /api/partners/offers` - Create a new offer
- `GET /api/partners/offers/:id` - Get a single partner offer
- `PUT /api/partners/offers/:id` - Update an offer
- `DELETE /api/partners/offers/:id` - Delete an offer
- `GET /api/partners/analytics` - Get partner analytics
- `GET /api/partners/reviews` - Get partner reviews
- `PUT /api/partners/reviews/:id/respond` - Respond to a review

### Member Routes (Protected - Requires Authentication)

**Member Benefits:** Logged-in members get access to:

- Save/unsave offers for later
- Create reviews and ratings
- Receive notifications from subscribed/liked shops
- Redeem offers

- `GET /api/members/offers/saved` - Get all saved offers
- `POST /api/members/offers/:id/save` - Save an offer
- `DELETE /api/members/offers/:id/save` - Remove saved offer
- `POST /api/members/offers/:id/redeem` - Redeem an offer
- `POST /api/members/offers/:id/review` - Create a review (requires login)
- `GET /api/members/notifications` - Get notifications
- `PUT /api/members/notifications/:id/read` - Mark notification as read

### Admin Routes (Protected)

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get a single user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/partners` - Get all partners
- `PUT /api/admin/partners/:id/approve` - Approve partner
- `PUT /api/admin/partners/:id/reject` - Reject partner
- `PUT /api/admin/partners/:id/premium` - Update partner premium status
- `GET /api/admin/offers` - Get all offers
- `DELETE /api/admin/offers/:id` - Delete offer
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/reports/monthly` - Generate monthly report

## Project Structure

```
api/
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication controllers
│   │   ├── partnerController.js  # Partner controllers
│   │   ├── memberController.js   # Member controllers
│   │   └── adminController.js    # Admin controllers
│   ├── middleware/
│   │   ├── authMiddleware.js     # Authentication & authorization
│   │   └── errorMiddleware.js    # Error handling
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Partner.js            # Partner model
│   │   ├── Member.js             # Member model
│   │   ├── Offer.js              # Offer model
│   │   ├── Review.js             # Review model
│   │   ├── Notification.js       # Notification model
│   │   └── SavedOffer.js         # SavedOffer model
│   ├── routes/
│   │   ├── authRoutes.js         # Auth routes
│   │   ├── partnerRoutes.js      # Partner routes
│   │   ├── memberRoutes.js       # Member routes
│   │   ├── adminRoutes.js        # Admin routes
│   │   └── index.js              # Route aggregator
│   ├── utils/
│   │   └── responseFormat.js     # Response formatting utilities
│   └── server.js                 # Express server setup
├── package.json
└── README.md
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Role-Based Access Control

- **Admin**: Full access to all endpoints
- **Partner**: Access to partner-specific endpoints (requires approval)
- **Member**: Access to member-specific endpoints

## Error Handling

All errors are returned in a consistent format:

### General Errors
```json
{
  "success": false,
  "message": "Error message"
}
```

### Validation Errors
Validation errors include field-specific information:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "partnerName",
      "message": "Partner name is required"
    },
    {
      "field": "location.street",
      "message": "Street address is required"
    },
    {
      "field": "contactInfo.mobileNumber",
      "message": "Please enter a valid Sri Lankan mobile number (9 digits with optional +94 or 0 prefix)"
    }
  ]
}
```

### Success Responses
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response Structure
- **success**: Boolean indicating if the request was successful
- **message**: General error or success message
- **errors**: Array of validation errors (only present for validation failures)
  - **field**: The field name that failed validation (supports nested fields like "location.street")
  - **message**: Specific error message for that field
- **data**: Response data (only present on success)

## License

ISC
