# API Demo Documentation

Complete API documentation with sample Sri Lankan data for all endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints)
3. [Public Routes](#public-routes)
4. [Member Routes](#member-routes)
5. [Partner Routes](#partner-routes)
6. [Admin Routes](#admin-routes)

---

## Authentication

### Register as Member

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "email": "kamal.perera@example.com",
  "password": "password123",
  "role": "member",
  "firstName": "Kamal",
  "lastName": "Perera",
  "mobileNumber": "0771234567",
  "address": {
    "street": "123 Galle Road",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00300"
  },
  "dateOfBirth": "1990-05-15",
  "gender": "male"
}
```

---

### Register as Partner

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "email": "nimal@lankafoods.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Nimal Fernando",
  "shopName": "Lanka Foods Restaurant",
  "location": {
    "street": "456 Kandy Road",
    "city": "Kandy",
    "district": "Kandy",
    "postalCode": "20000"
  },
  "category": "Restaurant",
  "contactInfo": {
    "mobileNumber": "0812345678",
    "website": "https://lankafoods.com"
  }
}
```

**Note:** Partner accounts require admin approval before they can login.

---

### Login

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "email": "kamal.perera@example.com",
  "password": "password123"
}
```

---

### Get Current User

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Filtering, Searching & Pagination Endpoints

This section documents all endpoints that support filtering, searching, and pagination capabilities.

---

### 1. Browse All Offers

**GET** `/api/offers`

**Description:** Browse all active offers with optional filtering by category, city, and search keywords. Supports pagination.

**Query Parameters:**

- `category` (optional, filter): Filter by category. Exact match, case-sensitive. Available values: Restaurant, Retail, Travel, Beauty & Spa, Fitness, Electronics, Fashion, Health, Education, Entertainment, Automotive.
- `city` (optional, filter): Filter by city. Case-insensitive partial match. Example: Colombo, Kandy, Galle.
- `search` (optional, search): Search in title and description fields. Case-insensitive regex matching.
- `page` (optional, pagination): Page number. Default: 1. Only active when `limit` is used.
- `limit` (optional, pagination): Items per page. Default: 10. Only active when `page` is used.

**Available Categories:**
- Restaurant
- Retail
- Travel
- Beauty & Spa
- Fitness
- Electronics
- Fashion
- Health
- Education
- Entertainment
- Automotive

**Examples Without Pagination:**

Get all active offers:
```
GET /api/offers
```

Filter by category only:
```
GET /api/offers?category=Restaurant
GET /api/offers?category=Electronics
GET /api/offers?category=Fitness
GET /api/offers?category=Travel
GET /api/offers?category=Beauty%20%26%20Spa
```

Filter by city only:
```
GET /api/offers?city=Colombo
GET /api/offers?city=Kandy
GET /api/offers?city=Galle
```

Search by keywords only:
```
GET /api/offers?search=rice
GET /api/offers?search=discount
GET /api/offers?search=rice%20curry
GET /api/offers?search=laptop
```

Combine filters (without pagination):
```
GET /api/offers?category=Restaurant&city=Colombo
GET /api/offers?category=Electronics&search=laptop
GET /api/offers?city=Kandy&search=spa
GET /api/offers?category=Beauty%20%26%20Spa&city=Kandy&search=facial
GET /api/offers?category=Restaurant&search=rice%20curry
```

**Examples With Pagination:**

Get paginated results:
```
GET /api/offers?page=1&limit=10
GET /api/offers?page=2&limit=10
GET /api/offers?page=1&limit=20
GET /api/offers?page=3&limit=5
```

Filter by category with pagination:
```
GET /api/offers?category=Restaurant&page=1&limit=10
GET /api/offers?category=Electronics&page=1&limit=5
GET /api/offers?category=Travel&page=2&limit=10
```

Filter by city with pagination:
```
GET /api/offers?city=Colombo&page=1&limit=10
GET /api/offers?city=Kandy&page=1&limit=15
GET /api/offers?city=Galle&page=2&limit=10
```

Search with pagination:
```
GET /api/offers?search=rice&page=1&limit=10
GET /api/offers?search=discount&page=1&limit=5
GET /api/offers?search=laptop&page=2&limit=10
```

Combine all filters with pagination:
```
GET /api/offers?category=Restaurant&city=Colombo&page=1&limit=10
GET /api/offers?category=Electronics&search=laptop&page=1&limit=10
GET /api/offers?city=Kandy&search=spa&page=1&limit=15
GET /api/offers?category=Beauty%20%26%20Spa&city=Kandy&search=facial&page=1&limit=10
GET /api/offers?category=Restaurant&city=Colombo&search=rice&page=1&limit=20
GET /api/offers?category=Fashion&search=summer&page=2&limit=5
```

**Notes:**
- Only returns active offers that haven't expired
- Sorted by creation date (newest first)
- Category filter is case-sensitive and exact match
- City filter is case-insensitive and partial match
- Search is case-insensitive and matches title/description
- View counts are auto-incremented on each request
- If authenticated as member, includes `isSaved` flag per offer

---

### 2. Get Notifications

**GET** `/api/notifications`

**Description:** Get all notifications for the authenticated user. Supports pagination.

**Access:** Private (Member, Partner, Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `page` (optional, pagination): Page number. Default: 1.
- `limit` (optional, pagination): Items per page. Default: 10.

**Examples Without Pagination:**

Get all notifications:
```
GET /api/notifications
```

**Examples With Pagination:**

Get paginated notifications:
```
GET /api/notifications?page=1&limit=10
GET /api/notifications?page=2&limit=10
GET /api/notifications?page=1&limit=20
GET /api/notifications?page=3&limit=5
```

**Notes:**
- Returns notifications for the authenticated user only
- Sorted by creation date (newest first)
- Includes unread count in response
- Response includes pagination metadata

---

### 3. Get All Users (Admin)

**GET** `/api/admin/users`

**Description:** Get all users in the system with optional filtering by role. Supports pagination.

**Access:** Private (Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `role` (optional, filter): Filter by user role. Available values: admin, partner, member. Exact match, case-sensitive.
- `page` (optional, pagination): Page number. Default: 1.
- `limit` (optional, pagination): Items per page. Default: 10.

**Examples Without Pagination:**

Get all users:
```
GET /api/admin/users
```

Filter by role only:
```
GET /api/admin/users?role=member
GET /api/admin/users?role=partner
GET /api/admin/users?role=admin
```

**Examples With Pagination:**

Get paginated users:
```
GET /api/admin/users?page=1&limit=10
GET /api/admin/users?page=2&limit=10
GET /api/admin/users?page=1&limit=20
```

Filter by role with pagination:
```
GET /api/admin/users?role=member&page=1&limit=10
GET /api/admin/users?role=partner&page=1&limit=15
GET /api/admin/users?role=admin&page=1&limit=5
```

**Notes:**
- Returns all users (passwords excluded)
- Sorted by creation date (newest first)
- Role filter is case-sensitive and exact match
- Response includes pagination metadata

---

### 4. Get All Partners (Admin)

**GET** `/api/admin/partners`

**Description:** Get all partners with optional filtering by status. Supports pagination.

**Access:** Private (Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `status` (optional, filter): Filter by partner status. Available values: pending, approved, rejected. Exact match, case-sensitive.
- `page` (optional, pagination): Page number. Default: 1.
- `limit` (optional, pagination): Items per page. Default: 10.

**Examples Without Pagination:**

Get all partners:
```
GET /api/admin/partners
```

Filter by status only:
```
GET /api/admin/partners?status=pending
GET /api/admin/partners?status=approved
GET /api/admin/partners?status=rejected
```

**Examples With Pagination:**

Get paginated partners:
```
GET /api/admin/partners?page=1&limit=10
GET /api/admin/partners?page=2&limit=10
GET /api/admin/partners?page=1&limit=20
```

Filter by status with pagination:
```
GET /api/admin/partners?status=pending&page=1&limit=10
GET /api/admin/partners?status=approved&page=1&limit=15
GET /api/admin/partners?status=rejected&page=2&limit=10
```

**Notes:**
- Returns all partners with user information
- Sorted by creation date (newest first)
- Status filter is case-sensitive and exact match
- Response includes pagination metadata

---

### 5. Get All Offers (Admin)

**GET** `/api/admin/offers`

**Description:** Get all offers in the system with optional filtering by active status. Supports pagination.

**Access:** Private (Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `isActive` (optional, filter): Filter by active status. Available values: true, false. String values "true" or "false".
- `page` (optional, pagination): Page number. Default: 1.
- `limit` (optional, pagination): Items per page. Default: 10.

**Examples Without Pagination:**

Get all offers:
```
GET /api/admin/offers
```

Filter by active status only:
```
GET /api/admin/offers?isActive=true
GET /api/admin/offers?isActive=false
```

**Examples With Pagination:**

Get paginated offers:
```
GET /api/admin/offers?page=1&limit=10
GET /api/admin/offers?page=2&limit=10
GET /api/admin/offers?page=1&limit=20
```

Filter by active status with pagination:
```
GET /api/admin/offers?isActive=true&page=1&limit=10
GET /api/admin/offers?isActive=false&page=1&limit=15
GET /api/admin/offers?isActive=true&page=2&limit=10
```

**Notes:**
- Returns all offers including expired and inactive ones
- Sorted by creation date (newest first)
- isActive filter accepts string "true" or "false"
- Response includes pagination metadata

---

### 6. Get Platform Analytics (Admin)

**GET** `/api/admin/analytics`

**Description:** Get platform analytics with optional date range filtering. No pagination.

**Access:** Private (Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `startDate` (optional, filter): Start date for analytics range. ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ).
- `endDate` (optional, filter): End date for analytics range. ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ).

**Examples:**

Get all analytics:
```
GET /api/admin/analytics
```

Filter by date range:
```
GET /api/admin/analytics?startDate=2024-01-01
GET /api/admin/analytics?endDate=2024-12-31
GET /api/admin/analytics?startDate=2024-01-01&endDate=2024-12-31
GET /api/admin/analytics?startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.000Z
```

**Notes:**
- Returns comprehensive platform statistics
- Date filters are based on creation date
- No pagination support (returns aggregated data)
- Includes user, partner, offer, and review statistics

---

### 7. Generate Monthly Report (Admin)

**GET** `/api/admin/reports/monthly`

**Description:** Generate monthly report with optional year and month filtering. No pagination.

**Access:** Private (Admin)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `year` (optional, filter): Year for report. Default: current year. Numeric value (e.g., 2024).
- `month` (optional, filter): Month for report. Default: current month. Numeric value (1-12).

**Examples:**

Get current month report:
```
GET /api/admin/reports/monthly
```

Filter by year only:
```
GET /api/admin/reports/monthly?year=2024
```

Filter by month only:
```
GET /api/admin/reports/monthly?month=1
```

Filter by year and month:
```
GET /api/admin/reports/monthly?year=2024&month=1
GET /api/admin/reports/monthly?year=2024&month=12
GET /api/admin/reports/monthly?year=2023&month=6
```

**Notes:**
- Returns monthly statistics for the specified period
- Month filter uses 1-based indexing (1 = January, 12 = December)
- Defaults to current year and month if not specified
- No pagination support (returns aggregated report data)

---

## Public Routes

### Get Categories

**GET** `/api/offers/categories`

**Description:** Get all available offer categories. No filtering or pagination needed.

**Query Parameters:** None

**Examples:**

```
GET /api/offers/categories
```

---

### Get Single Offer

**GET** `/api/offers/:id`

**Example:**

```
GET /api/offers/64f1a2b3c4d5e6f7g8h9i0j5
```

---

### Get Offer Reviews

**GET** `/api/offers/:id/reviews`

**Description:** Get all reviews for a specific offer. No filtering or pagination needed.

**Query Parameters:** None

**Example:**

```
GET /api/offers/64f1a2b3c4d5e6f7g8h9i0j5/reviews
```

---

### Click on Offer

**POST** `/api/offers/:id/click`

**Example:**

```
POST /api/offers/64f1a2b3c4d5e6f7g8h9i0j5/click
```

---

## Member Routes

### Save an Offer

**POST** `/api/members/offers/:id/save`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
POST /api/members/offers/64f1a2b3c4d5e6f7g8h9i0j5/save
```

---

### Get Saved Offers

**GET** `/api/members/offers/saved`

**Description:** Get all saved offers for the authenticated member. Only returns active, non-expired offers.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:** None (currently no filtering or pagination support)

**Examples:**

```
GET /api/members/offers/saved
```

**Notes:**
- Returns only active offers that haven't expired
- Sorted by save date (newest first)
- Includes partner information for each offer

---

### Remove Saved Offer

**DELETE** `/api/members/offers/:id/save`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
DELETE /api/members/offers/64f1a2b3c4d5e6f7g8h9i0j5/save
```

---

### Redeem Offer

**POST** `/api/members/offers/:id/redeem`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
POST /api/members/offers/64f1a2b3c4d5e6f7g8h9i0j5/redeem
```

---

### Create Review

**POST** `/api/members/offers/:id/review`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Excellent food and great service! The rice and curry was authentic and delicious. Highly recommended!"
}
```

**Example:**

```
POST /api/members/offers/64f1a2b3c4d5e6f7g8h9i0j5/review
```

---

### Get Notifications

**GET** `/api/members/notifications`

**Description:** Get all notifications for the authenticated member. Supports pagination. (Also available at `/api/notifications`)

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `page` (optional, pagination): Page number. Default: 1.
- `limit` (optional, pagination): Items per page. Default: 10.

**Examples Without Pagination:**

Get all notifications:
```
GET /api/members/notifications
```

**Examples With Pagination:**

Get paginated notifications:
```
GET /api/members/notifications?page=1&limit=10
GET /api/members/notifications?page=2&limit=10
GET /api/members/notifications?page=1&limit=20
```

---

### Mark Notification as Read

**PUT** `/api/members/notifications/:id/read`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
PUT /api/members/notifications/64f1a2b3c4d5e6f7g8h9i0j9/read
```

---

## Partner Routes

### Get Partner Profile

**GET** `/api/partners/profile`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Update Partner Profile

**PUT** `/api/partners/profile`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "shopName": "Lanka Foods & Catering",
  "location": {
    "street": "789 Peradeniya Road",
    "city": "Kandy",
    "district": "Kandy",
    "postalCode": "20400"
  },
  "contactInfo": {
    "mobileNumber": "0819876543",
    "website": "https://lankafoods.lk"
  }
}
```

**Note:** Status changes to "pending" after profile update for admin review.

---

### Create Offer

**POST** `/api/partners/offers`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "title": "15% Off on Hoppers & String Hoppers",
  "description": "Enjoy 15% discount on our famous hoppers and string hoppers. Available for breakfast and dinner. Valid for dine-in only.",
  "discount": 15,
  "originalPrice": 300,
  "discountedPrice": 255,
  "category": "Restaurant",
  "expiryDate": "2024-02-20T23:59:59.000Z",
  "imageUrl": "https://example.com/images/hoppers.jpg",
  "termsAndConditions": "Valid only on weekends. Cannot be combined with other offers. Dine-in only."
}
```

---

### Get Partner Offers

**GET** `/api/partners/offers` or **GET** `/api/offers/partner/my-offers`

**Description:** Get all offers created by the authenticated partner. Returns all offers (active and inactive).

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:** None (currently no filtering or pagination support)

**Examples:**

```
GET /api/partners/offers
GET /api/offers/partner/my-offers
```

**Notes:**
- Returns all offers created by the partner (both active and inactive)
- Includes expired offers
- Sorted by creation date (newest first)
- Requires partner to be approved

---

### Get Single Partner Offer

**GET** `/api/partners/offers/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
GET /api/partners/offers/64f1a2b3c4d5e6f7g8h9i0j5
```

---

### Update Offer

**PUT** `/api/partners/offers/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "title": "25% Off on All Rice & Curry",
  "discount": 25,
  "discountedPrice": 375,
  "expiryDate": "2024-03-15T23:59:59.000Z"
}
```

**Example:**

```
PUT /api/partners/offers/64f1a2b3c4d5e6f7g8h9i0j5
```

---

### Delete Offer

**DELETE** `/api/partners/offers/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
DELETE /api/partners/offers/64f1a2b3c4d5e6f7g8h9i0j5
```

---

### Get Partner Analytics

**GET** `/api/partners/analytics`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Get Partner Reviews

**GET** `/api/partners/reviews`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Respond to Review

**PUT** `/api/partners/reviews/:id/respond`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "response": "Thank you for your feedback! We appreciate your business and hope to serve you again soon."
}
```

**Example:**

```
PUT /api/partners/reviews/64f1a2b3c4d5e6f7g8h9i0j6/respond
```

---

## Admin Routes

> **Note:** For detailed filtering, searching, and pagination information, see the [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) section above.

### Get All Users

**GET** `/api/admin/users`

**Description:** Get all users with optional filtering by role and pagination. See section 3 in [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) for complete documentation.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `role` (optional, filter): Filter by role (admin, partner, member)
- `page` (optional, pagination): Page number (default: 1)
- `limit` (optional, pagination): Items per page (default: 10)

---

### Get Single User

**GET** `/api/admin/users/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
GET /api/admin/users/64f1a2b3c4d5e6f7g8h9i0j1
```

---

### Update User

**PUT** `/api/admin/users/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "isActive": false
}
```

**Example:**

```
PUT /api/admin/users/64f1a2b3c4d5e6f7g8h9i0j1
```

---

### Delete User

**DELETE** `/api/admin/users/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
DELETE /api/admin/users/64f1a2b3c4d5e6f7g8h9i0j1
```

---

### Get All Partners

**GET** `/api/admin/partners`

**Description:** Get all partners with optional filtering by status and pagination. See section 4 in [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) for complete documentation.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `status` (optional, filter): Filter by status (pending, approved, rejected)
- `page` (optional, pagination): Page number (default: 1)
- `limit` (optional, pagination): Items per page (default: 10)

---

### Approve Partner

**PUT** `/api/admin/partners/:id/approve`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
PUT /api/admin/partners/64f1a2b3c4d5e6f7g8h9i0j4/approve
```

---

### Reject Partner

**PUT** `/api/admin/partners/:id/reject`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "reason": "Incomplete business registration documents"
}
```

**Example:**

```
PUT /api/admin/partners/64f1a2b3c4d5e6f7g8h9i0j4/reject
```

---

### Update Partner Premium Status

**PUT** `/api/admin/partners/:id/premium`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "isPremium": true
}
```

**Example:**

```
PUT /api/admin/partners/64f1a2b3c4d5e6f7g8h9i0j4/premium
```

---

### Get All Offers

**GET** `/api/admin/offers`

**Description:** Get all offers with optional filtering by active status and pagination. See section 5 in [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) for complete documentation.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `isActive` (optional, filter): Filter by active status (true/false)
- `page` (optional, pagination): Page number (default: 1)
- `limit` (optional, pagination): Items per page (default: 10)

---

### Delete Offer (Admin)

**DELETE** `/api/admin/offers/:id`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example:**

```
DELETE /api/admin/offers/64f1a2b3c4d5e6f7g8h9i0j5
```

---

### Get Platform Analytics

**GET** `/api/admin/analytics`

**Description:** Get platform analytics with optional date range filtering. See section 6 in [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) for complete documentation.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `startDate` (optional, filter): Start date for analytics range. ISO 8601 format.
- `endDate` (optional, filter): End date for analytics range. ISO 8601 format.

---

### Generate Monthly Report

**GET** `/api/admin/reports/monthly`

**Description:** Generate monthly report with optional year and month filtering. See section 7 in [Filtering, Searching & Pagination Endpoints](#filtering-searching--pagination-endpoints) for complete documentation.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `year` (optional, filter): Year for report. Default: current year. Numeric value (e.g., 2024).
- `month` (optional, filter): Month for report. Default: current month. Numeric value (1-12).

---

## Sample Data for Testing

### Sample Members

#### 1. Kamal Perera

```json
{
  "email": "kamal.perera@example.com",
  "password": "password123",
  "role": "member",
  "firstName": "Kamal",
  "lastName": "Perera",
  "mobileNumber": "0771234567",
  "address": {
    "street": "123 Galle Road",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00300"
  },
  "dateOfBirth": "1990-05-15",
  "gender": "male"
}
```

#### 2. Sithara Jayawardena

```json
{
  "email": "sithara.j@example.com",
  "password": "password123",
  "role": "member",
  "firstName": "Sithara",
  "lastName": "Jayawardena",
  "mobileNumber": "0712345678",
  "address": {
    "street": "456 Kandy Road",
    "city": "Kandy",
    "district": "Kandy",
    "postalCode": "20000"
  },
  "dateOfBirth": "1992-08-20",
  "gender": "female"
}
```

#### 3. Dilshan Wickramasinghe

```json
{
  "email": "dilshan.w@example.com",
  "password": "password123",
  "role": "member",
  "firstName": "Dilshan",
  "lastName": "Wickramasinghe",
  "mobileNumber": "0765432109",
  "address": {
    "street": "789 Galle Road",
    "city": "Galle",
    "district": "Galle",
    "postalCode": "80000"
  },
  "dateOfBirth": "1988-12-10",
  "gender": "male"
}
```

---

### Sample Partners

#### 1. Lanka Foods Restaurant

```json
{
  "email": "nimal@lankafoods.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Nimal Fernando",
  "shopName": "Lanka Foods Restaurant",
  "location": {
    "street": "456 Kandy Road",
    "city": "Kandy",
    "district": "Kandy",
    "postalCode": "20000"
  },
  "category": "Restaurant",
  "contactInfo": {
    "mobileNumber": "0812345678",
    "website": "https://lankafoods.com"
  }
}
```

#### 2. Colombo Spice Mart

```json
{
  "email": "priya@colombospice.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Priya Wijesinghe",
  "shopName": "Colombo Spice Mart",
  "location": {
    "street": "123 Galle Road",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00300"
  },
  "category": "Retail",
  "contactInfo": {
    "mobileNumber": "0112345678",
    "website": "https://colombospice.com"
  }
}
```

#### 3. Galle Beach Resort

```json
{
  "email": "ruwan@gallebeach.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Ruwan Silva",
  "shopName": "Galle Beach Resort",
  "location": {
    "street": "789 Beach Road",
    "city": "Galle",
    "district": "Galle",
    "postalCode": "80000"
  },
  "category": "Travel",
  "contactInfo": {
    "mobileNumber": "0912345678",
    "website": "https://gallebeach.com"
  }
}
```

#### 4. Kandy Beauty Salon

```json
{
  "email": "chamari@kandybeauty.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Chamari Perera",
  "shopName": "Kandy Beauty Salon",
  "location": {
    "street": "321 Temple Street",
    "city": "Kandy",
    "district": "Kandy",
    "postalCode": "20000"
  },
  "category": "Beauty & Spa",
  "contactInfo": {
    "mobileNumber": "0819876543",
    "website": "https://kandybeauty.com"
  }
}
```

#### 5. Colombo Fitness Center

```json
{
  "email": "sanjaya@colombofitness.com",
  "password": "partner123",
  "role": "partner",
  "partnerName": "Sanjaya Bandara",
  "shopName": "Colombo Fitness Center",
  "location": {
    "street": "555 Union Place",
    "city": "Colombo",
    "district": "Colombo",
    "postalCode": "00200"
  },
  "category": "Fitness",
  "contactInfo": {
    "mobileNumber": "0119876543",
    "website": "https://colombofitness.com"
  }
}
```

---

### Sample Offers

#### 1. Restaurant Offer - Rice & Curry

```json
{
  "title": "20% Off on All Rice & Curry",
  "description": "Get 20% discount on our delicious traditional Sri Lankan rice and curry meals. Valid for dine-in and takeaway.",
  "discount": 20,
  "originalPrice": 500,
  "discountedPrice": 400,
  "category": "Restaurant",
  "expiryDate": "2024-02-15T23:59:59.000Z",
  "imageUrl": "https://example.com/images/rice-curry.jpg",
  "termsAndConditions": "Valid only on weekdays. Cannot be combined with other offers."
}
```

#### 2. Restaurant Offer - Hoppers

```json
{
  "title": "15% Off on Hoppers & String Hoppers",
  "description": "Enjoy 15% discount on our famous hoppers and string hoppers. Available for breakfast and dinner. Valid for dine-in only.",
  "discount": 15,
  "originalPrice": 300,
  "discountedPrice": 255,
  "category": "Restaurant",
  "expiryDate": "2024-02-20T23:59:59.000Z",
  "imageUrl": "https://example.com/images/hoppers.jpg",
  "termsAndConditions": "Valid only on weekends. Cannot be combined with other offers. Dine-in only."
}
```

#### 3. Retail Offer - Spices

```json
{
  "title": "30% Off on All Spices",
  "description": "Get 30% discount on premium Sri Lankan spices including cinnamon, cardamom, and cloves. Perfect for your kitchen!",
  "discount": 30,
  "originalPrice": 1000,
  "discountedPrice": 700,
  "category": "Retail",
  "expiryDate": "2024-03-01T23:59:59.000Z",
  "imageUrl": "https://example.com/images/spices.jpg",
  "termsAndConditions": "Minimum purchase of Rs. 500. Valid on all spice products."
}
```

#### 4. Travel Offer - Weekend Stay

```json
{
  "title": "25% Off on Weekend Stay",
  "description": "Enjoy a relaxing weekend getaway with 25% discount on room bookings. Includes breakfast and beach access.",
  "discount": 25,
  "originalPrice": 15000,
  "discountedPrice": 11250,
  "category": "Travel",
  "expiryDate": "2024-04-30T23:59:59.000Z",
  "imageUrl": "https://example.com/images/beach-resort.jpg",
  "termsAndConditions": "Valid for Friday-Sunday bookings only. Subject to availability. Cannot be combined with other offers."
}
```

#### 5. Beauty & Spa Offer - Facial Treatment

```json
{
  "title": "20% Off on Facial Treatments",
  "description": "Pamper yourself with our premium facial treatments. Get 20% off on all facial packages.",
  "discount": 20,
  "originalPrice": 2500,
  "discountedPrice": 2000,
  "category": "Beauty & Spa",
  "expiryDate": "2024-03-15T23:59:59.000Z",
  "imageUrl": "https://example.com/images/facial.jpg",
  "termsAndConditions": "Advance booking required. Valid Monday to Friday. Cannot be combined with other offers."
}
```

#### 6. Fitness Offer - Gym Membership

```json
{
  "title": "15% Off on Monthly Gym Membership",
  "description": "Start your fitness journey with 15% discount on monthly gym membership. Includes access to all facilities and classes.",
  "discount": 15,
  "originalPrice": 5000,
  "discountedPrice": 4250,
  "category": "Fitness",
  "expiryDate": "2024-03-31T23:59:59.000Z",
  "imageUrl": "https://example.com/images/gym.jpg",
  "termsAndConditions": "Valid for new members only. Minimum 3-month commitment required."
}
```

---

## Sri Lankan Districts

The following districts are valid for address fields:

- Colombo
- Gampaha
- Kalutara
- Kandy
- Matale
- Nuwara Eliya
- Galle
- Matara
- Hambantota
- Jaffna
- Kilinochchi
- Mannar
- Vavuniya
- Mullaitivu
- Batticaloa
- Ampara
- Trincomalee
- Kurunegala
- Puttalam
- Anuradhapura
- Polonnaruwa
- Badulla
- Moneragala
- Ratnapura
- Kegalle

---

## Mobile Number Format

Sri Lankan mobile numbers should be in one of these formats:

- `0771234567` (10 digits starting with 0)
- `+94771234567` (with country code +94)
- `771234567` (9 digits without prefix)

Common prefixes:

- `077`, `078`, `071`, `070` - Dialog, Mobitel
- `076`, `075`, `074`, `072` - Etisalat, Airtel
- `011`, `033`, `034`, `036`, `037`, `038`, `041`, `047`, `081`, `091` - Landline numbers

---

## Postal Code Format

Postal codes must be exactly 5 digits:

- `00300` (Colombo)
- `20000` (Kandy)
- `80000` (Galle)
- `00100` (Colombo Fort)
- `00400` (Colombo 4)

---

## Authentication Token

After successful login or registration, you'll receive a JWT token. Include this token in the Authorization header for protected routes:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Quick Start Testing Flow

1. **Create Admin User:**

   ```bash
   npm run db:seed
   ```

2. **Register a Partner:**

   ```
   POST /api/auth/register
   # Use sample partner data from above
   ```

3. **Login as Admin and Approve Partner:**

   ```
   POST /api/auth/login
   # Login as admin
   PUT /api/admin/partners/:id/approve
   # Approve the partner
   ```

4. **Partner Creates Offer:**

   ```
   POST /api/auth/login
   # Login as approved partner
   POST /api/partners/offers
   # Create an offer
   ```

5. **Register a Member:**

   ```
   POST /api/auth/register
   # Use sample member data from above
   ```

6. **Member Browses Offers (Public):**

   ```
   GET /api/offers
   # No login required
   ```

7. **Member Saves Offer:**

   ```
   POST /api/auth/login
   # Login as member
   POST /api/members/offers/:id/save
   # Save an offer
   ```

8. **Member Creates Review:**
   ```
   POST /api/members/offers/:id/review
   # Create a review
   ```

---

## Notes

1. All dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
2. Prices are in Sri Lankan Rupees (LKR)
3. All timestamps are in UTC
4. Partner accounts require admin approval before they can login
5. Offers are publicly viewable, but saving and reviewing requires member login
6. Admin accounts cannot be registered through the API - use the seeder: `npm run db:seed`
7. All protected routes require JWT token in Authorization header
8. Query parameters are optional unless specified
9. Request bodies are required for POST and PUT requests (where applicable)

---

**End of API Demo Documentation**
