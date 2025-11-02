# Cash Collection Management for Delivery Partners

## Overview
This system allows administrators to track and manage cash collections from all delivery partners. All cash data is sourced directly from `CashCollection` records, ensuring accuracy.

## API Endpoint

### Get All Delivery Personnel with Cash Details
**Endpoint:** `GET /api/v1/superadmin/cash/delivery-personnel`

### Query Parameters:
- `status` (optional): Filter by personnel status (`active`, `inactive`, `on_duty`, `off_duty`, `suspended`, or `all`)
- `zoneId` (optional): Filter by zone ID
- `search` (optional): Search by name, email, phone, or employee ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

### Example Request:
```bash
GET /api/v1/superadmin/cash/delivery-personnel?status=active&page=1&limit=10
```

### Response Structure:
```json
{
  "success": true,
  "data": [
    {
      "_id": "personnel_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+9779812345678",
      "employeeId": "EMP001",
      "zone": {
        "_id": "zone_id",
        "name": "Kathmandu Central",
        "deliveryCharge": 50
      },
      "status": "active",
      "vehicleType": "motorcycle",
      "vehicleNumber": "BA 01 PA 1234",
      "totalDeliveries": 150,
      "totalEarnings": 7500,
      
      // Cash Collection Details (from CashCollection records)
      "cashInHand": 2500,              // Pending cash collections
      "totalCashCollected": 15000,    // All-time total
      "totalCashSubmitted": 12500,    // Submitted + Reconciled
      "pendingCashSubmission": 2500,  // Same as cashInHand
      
      // Detailed Breakdown
      "pendingCollectionsCount": 5,
      "submittedCollectionsCount": 20,
      "reconciledCollectionsCount": 100,
      "pendingCollectionsAmount": 2500,
      "submittedCollectionsAmount": 2000,
      "reconciledCollectionsAmount": 10500,
      
      // Today's Stats
      "todayCollectionsCount": 3,
      "todayCollectionsAmount": 1200,
      
      // Recent Pending Collections (last 10)
      "recentPendingCollections": [
        {
          "order": {
            "orderNumber": "ORD-123456"
          },
          "amount": 500,
          "collectedAt": "2024-01-15T10:30:00Z",
          "notes": "Auto-recorded on delivery"
        }
      ]
    }
  ],
  "summary": {
    "totalPersonnel": 50,
    "totalPendingCash": 50000,
    "totalSubmittedCash": 20000,
    "totalReconciledCash": 150000,
    "totalPendingCount": 250,
    "totalSubmittedCount": 100,
    "totalReconciledCount": 500,
    "totalCashInSystem": 220000
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## How to Manage Cash Collections

### 1. View All Delivery Personnel Cash Status
Use the endpoint above to see:
- How much cash each delivery partner has collected
- How much is pending submission
- How much has been submitted for reconciliation
- How much has been reconciled

### 2. Track Individual Cash Collections
Each personnel record includes:
- `pendingCollectionsCount`: Number of pending collections
- `pendingCollectionsAmount`: Total amount pending
- `recentPendingCollections`: Last 10 pending collections with order details

### 3. Monitor Today's Activity
- `todayCollectionsCount`: Collections made today
- `todayCollectionsAmount`: Total amount collected today

### 4. Overall System Summary
The response includes a summary of:
- Total pending cash across all personnel
- Total submitted cash waiting for reconciliation
- Total reconciled cash
- Total cash in the system

## Related Endpoints

### Get Pending Submissions (Ready for Reconciliation)
`GET /api/v1/superadmin/cash/pending`

### Reconcile Cash Submission
`POST /api/v1/superadmin/cash/reconcile/:collectionId`

### Bulk Reconcile
`POST /api/v1/superadmin/cash/reconcile/bulk`

### Get Cash Report
`GET /api/v1/superadmin/cash/report`

## Important Notes

1. **Source of Truth**: All cash amounts are calculated directly from `CashCollection` records, not from `DeliveryPersonnel` fields, ensuring accuracy.

2. **Cash In Hand**: This represents the sum of all pending cash collections for that personnel.

3. **Filtering**: You can filter by:
   - Personnel status (active, inactive, etc.)
   - Zone assignment
   - Search by name, email, phone, or employee ID

4. **Pagination**: Use `page` and `limit` parameters to paginate through results.

## Usage Example (cURL)

```bash
# Get all active delivery personnel with cash details
curl -X GET "http://localhost:5000/api/v1/superadmin/cash/delivery-personnel?status=active&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search for specific personnel
curl -X GET "http://localhost:5000/api/v1/superadmin/cash/delivery-personnel?search=John" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by zone
curl -X GET "http://localhost:5000/api/v1/superadmin/cash/delivery-personnel?zoneId=ZONE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

To create a frontend component for this:
1. Create a new component or add to existing `PersonnelManagement.jsx`
2. Call the endpoint: `GET /api/v1/superadmin/cash/delivery-personnel`
3. Display the data in a table with columns for:
   - Personnel Name
   - Zone
   - Cash In Hand
   - Pending Collections
   - Submitted Amount
   - Reconciled Amount
   - Total Collected
4. Add filters for status, zone, and search
5. Add pagination controls
