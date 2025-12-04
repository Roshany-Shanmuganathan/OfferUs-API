# Partner Management System

Complete partner management system with approval, rejection, banning, and deletion functionality.

## Features

✅ **Registration**: Partners start with `pending` status  
✅ **Approval**: Admin can approve partner registrations  
✅ **Rejection**: Admin can reject partner registrations with reason  
✅ **Banning**: Admin can ban approved partners (disables all offers)  
✅ **Unbanning**: Admin can unban partners (reactivates non-expired offers)  
✅ **Deletion Protection**: Approved partners cannot be deleted  
✅ **Automatic Offer Management**: Offers are disabled/enabled when banning/unbanning  

## Partner Status Flow

```
pending → approved → banned
   ↓         ↓         ↓
rejected   (can ban)  (can unban)
```

## API Endpoints

### 1. Approve Partner
```http
PATCH /api/partners/:id/approve
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Partner approved successfully",
  "data": {
    "partner": {
      "id": "...",
      "email": "partner@example.com",
      "partnerName": "John Doe",
      "shopName": "John's Shop",
      "status": "approved",
      "verifiedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### 2. Reject Partner
```http
PATCH /api/partners/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Incomplete documentation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner rejected successfully",
  "data": {
    "partner": {
      "_id": "...",
      "status": "rejected",
      "reason": "Incomplete documentation"
    }
  }
}
```

### 3. Ban Partner
```http
PATCH /api/partners/:id/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Violation of terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Partner banned successfully",
  "data": {
    "partner": {
      "id": "...",
      "email": "partner@example.com",
      "partnerName": "John Doe",
      "shopName": "John's Shop",
      "status": "banned",
      "bannedAt": "2024-01-15T10:00:00.000Z",
      "banReason": "Violation of terms and conditions",
      "offersDisabled": 5
    }
  }
}
```

**What happens:**
- Partner status changes to `banned`
- All active offers are automatically disabled (`isActive: false`)
- Partner receives a notification
- Partner cannot access partner routes (middleware blocks)

### 4. Unban Partner
```http
PATCH /api/partners/:id/unban
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Partner unbanned successfully",
  "data": {
    "partner": {
      "id": "...",
      "email": "partner@example.com",
      "partnerName": "John Doe",
      "shopName": "John's Shop",
      "status": "approved",
      "previousBanReason": "Violation of terms and conditions",
      "offersReactivated": 3
    }
  }
}
```

**What happens:**
- Partner status changes back to `approved`
- All non-expired offers are automatically reactivated (`isActive: true`)
- Expired offers remain disabled
- Partner receives a notification
- Partner can access partner routes again

### 5. Delete Partner
```http
DELETE /api/partners/:id
Authorization: Bearer <admin_token>
```

**Response (if not approved):**
```json
{
  "success": true,
  "message": "Partner deleted successfully",
  "data": {
    "deletedPartner": {
      "id": "...",
      "email": "partner@example.com",
      "partnerName": "John Doe",
      "shopName": "John's Shop",
      "status": "pending"
    },
    "relatedDataDeleted": {
      "offers": 0,
      "reviews": 0,
      "savedOffers": 0
    }
  }
}
```

**Error (if approved):**
```json
{
  "success": false,
  "message": "Cannot delete approved partners. Use ban instead if you need to restrict access.",
  "statusCode": 403
}
```

**What happens:**
- Only pending/rejected partners can be deleted
- Approved partners cannot be deleted (use ban instead)
- Related offers, reviews, and saved offers are cascade deleted
- Partner record is permanently removed

## Database Schema

### Partner Model
```javascript
{
  userId: ObjectId,           // Reference to User
  partnerName: String,
  shopName: String,
  location: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    coordinates: { lat, lng }
  },
  category: String,
  contactInfo: {
    mobileNumber: String,
    website: String
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "banned", "suspended"],
    default: "pending"
  },
  reason: String,             // Rejection reason
  banReason: String,          // Ban reason
  bannedAt: Date,            // When banned
  verifiedAt: Date,          // When approved
  isPremium: Boolean,
  registrationDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Offer Model
```javascript
{
  partner: ObjectId,          // Reference to Partner
  title: String,
  description: String,
  discount: Number,
  originalPrice: Number,
  discountedPrice: Number,
  category: String,
  expiryDate: Date,
  isActive: Boolean,          // Automatically set to false when partner is banned
  analytics: {
    views: Number,
    clicks: Number,
    redemptions: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Business Rules

### 1. Registration Flow
- New partners start with `status: "pending"`
- Partners cannot access partner routes until approved
- Partners can update their profile (resets rejected status to pending)

### 2. Approval
- Only admin can approve partners
- Once approved, `verifiedAt` is set
- Partner receives notification
- Partner can now access partner routes

### 3. Rejection
- Only admin can reject partners
- Reason is optional but recommended
- Partner receives notification with reason
- Partner can update profile to reset status to pending

### 4. Banning
- Only approved partners can be banned
- Cannot ban pending/rejected partners
- All active offers are automatically disabled
- Partner receives notification
- Partner cannot access partner routes

### 5. Unbanning
- Only banned partners can be unbanned
- Status returns to `approved`
- Non-expired offers are reactivated
- Expired offers remain disabled
- Partner receives notification

### 6. Deletion
- **Cannot delete approved partners** (use ban instead)
- Can delete pending/rejected partners
- Cascade deletes related offers, reviews, saved offers
- Permanent action (cannot be undone)

## Middleware Protection

The `verifyPartnerApproved` middleware checks:
1. User is a partner
2. Partner profile exists
3. Partner is not banned
4. Partner is approved

Banned partners are blocked from accessing partner routes.

## Notifications

Partners receive notifications for:
- ✅ Approval
- ❌ Rejection (with reason)
- 🚫 Banning (with reason, mentions offers disabled)
- ✅ Unbanning (mentions offers reactivated)

## Error Handling

All endpoints include proper error handling:
- 404: Partner not found
- 400: Invalid operation (e.g., already banned, not approved)
- 403: Permission denied (e.g., cannot delete approved partner)
- 500: Server error

## Usage Examples

### Approve a Partner
```bash
curl -X PATCH http://localhost:5000/api/partners/507f1f77bcf86cd799439011/approve \
  -H "Authorization: Bearer <admin_token>"
```

### Ban a Partner
```bash
curl -X PATCH http://localhost:5000/api/partners/507f1f77bcf86cd799439011/ban \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Repeated violations"}'
```

### Unban a Partner
```bash
curl -X PATCH http://localhost:5000/api/partners/507f1f77bcf86cd799439011/unban \
  -H "Authorization: Bearer <admin_token>"
```

### Delete a Pending Partner
```bash
curl -X DELETE http://localhost:5000/api/partners/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <admin_token>"
```

## Testing Checklist

- [ ] Partner registration creates pending status
- [ ] Admin can approve partner
- [ ] Admin can reject partner with reason
- [ ] Approved partner can access partner routes
- [ ] Admin can ban approved partner
- [ ] Banning disables all partner's offers
- [ ] Banned partner cannot access partner routes
- [ ] Admin can unban partner
- [ ] Unbanning reactivates non-expired offers
- [ ] Cannot delete approved partner
- [ ] Can delete pending/rejected partner
- [ ] Notifications are sent for all actions

## Security Considerations

1. **Admin Only**: All management endpoints require admin role
2. **Status Validation**: Operations check current status before proceeding
3. **Cascade Protection**: Approved partners cannot be deleted
4. **Offer Protection**: Offers are automatically managed when banning/unbanning
5. **Audit Trail**: All actions are logged with timestamps

## Future Enhancements

- Temporary bans with automatic unban date
- Ban history tracking
- Soft delete for approved partners (archive instead of delete)
- Bulk operations (ban/unban multiple partners)
- Partner appeal system for bans

