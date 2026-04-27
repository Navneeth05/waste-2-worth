# Waste2Worth API Postman Testing Guide

**Base URL:** `http://localhost:8000/api`
*(If testing the deployed version on Render, replace `http://localhost:8000` with your deployed URL)*

---

### Global Notes
Many endpoints require authentication headers to identify the user making the request. You will first need to **Register** and **Login** to get the `id` and `role` of the user.
- **`x-user-id`**: The numeric ID returned during login.
- **`x-user-role`**: The role returned during login (`hotel`, `ngo`, or `muni`).

---

## 1. Auth Module

### 1.1 Register
- **Endpoint**: `/auth/register`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
    "name": "Grand Hotel Check",
    "email": "hotelcheck@example.com",
    "password": "password123",
    "role": "hotel",
    "phone": "9876543210",
    "city": "Mumbai",
    "latitude": 19.0760,
    "longitude": 72.8777
}
```
*(Valid roles: `hotel`, `ngo`, `muni`)*

### 1.2 Login
- **Endpoint**: `/auth/login`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
    "email": "hotelcheck@example.com",
    "password": "password123"
}
```
*Note the returned `user.id`. You will need it for the `x-user-id` header in subsequent requests.*

### 1.3 Update Profile
- **Endpoint**: `/profile/update`
- **Method**: `POST`
- **Headers**:
  - `x-user-id`: *(Integer ID from Login)*
  - `x-user-role`: *(Role from Login)*
  - `Content-Type: application/json`
- **Body**:
```json
{
    "name": "Grand Hotel Updated",
    "email": "hotelcheck@example.com",
    "phone": "9876543210",
    "city": "Mumbai",
    "zone": "South Mumbai"
}
```

---

## 2. Hotel Module
**Required Headers for all Hotel endpoints:**
- `x-user-id`: `<hotel_user_id>`
- `x-user-role`: `hotel`

### 2.1 Classify Food Image
- **Endpoint**: `/hotel/classify`
- **Method**: `POST`
- **Headers**: Remove `Content-Type` if set (Postman auto-sets it for form-data).
- **Body**: Set type to **`form-data`**
  - Key: `file` (Change key type from Text to **File** by hovering over the key field)
  - Value: *(Select an image file from your computer)*

### 2.2 Upload Food Request
- **Endpoint**: `/hotel/upload`
- **Method**: `POST`
- **Body** (JSON):
```json
{
    "food_item": "Buffet Leftovers",
    "quantity": 12.5,
    "ai_label": "edible",
    "location": "Banquet Hall A",
    "notes": "Kept warm, vegetarian"
}
```
*(Note: `ai_label` must be exactly either `"edible"` or `"non-edible"`)*

### 2.3 Dashboard Data
- **Endpoint**: `/hotel/dashboard`
- **Method**: `GET`
- **Body**: *none*

### 2.4 Upload History
- **Endpoint**: `/hotel/history`
- **Method**: `GET`
- **Body**: *none*

### 2.5 Hygiene Score
- **Endpoint**: `/hotel/score`
- **Method**: `GET`
- **Body**: *none*

---

## 3. NGO Module
**Required Headers for all NGO endpoints:**
- `x-user-id`: `<ngo_user_id>`
- `x-user-role`: `ngo`

### 3.1 View Available Food
- **Endpoint**: `/ngo/available`
- **Method**: `GET`
- **Body**: *none*
*(Returns a list of 'edible' food items waiting to be claimed. Note an `upload_id` for the next request).*

### 3.2 Claim Food
- **Endpoint**: `/ngo/claim/{upload_id}` *(Replace {upload_id} in URL with a real ID)*
- **Method**: `POST`
- **Body**: *none*
*(Returns a `claim_id` which you need for confirming pickup).*

### 3.3 Confirm Pickup & Award Points
- **Endpoint**: `/ngo/pickup/{claim_id}/confirm` *(Replace {claim_id} in URL)*
- **Method**: `POST`
- **Body** (JSON):
```json
{
    "claim_id": <insert_claim_id_here>,
    "points_awarded": 5,
    "reason": "Excellent packing and on-time"
}
```
*(Valid `points_awarded` are between 1 and 20).*

### 3.4 Pickup History
- **Endpoint**: `/ngo/pickups`
- **Method**: `GET`
- **Body**: *none*

### 3.5 Dashboard Data
- **Endpoint**: `/ngo/dashboard`
- **Method**: `GET`
- **Body**: *none*

### 3.6 Notice Score
- **Endpoint**: `/ngo/score`
- **Method**: `GET`
- **Body**: *none*

---

## 4. Municipal Module
**Required Headers for all Muni endpoints:**
- `x-user-id`: `<muni_user_id>`
- `x-user-role`: `muni`

### 4.1 View Non-Edible Waste List
- **Endpoint**: `/muni/waste`
- **Method**: `GET`
- **Body**: *none*
*(Returns a list of 'non-edible' waste items waiting to be collected. Note an `upload_id` for the next request).*

### 4.2 Collect Waste
- **Endpoint**: `/muni/collect/{upload_id}` *(Replace {upload_id} in URL with real ID)*
- **Method**: `POST`
- **Body**: *none*

### 4.3 Dashboard Data
- **Endpoint**: `/muni/dashboard`
- **Method**: `GET`
- **Body**: *none*

---

## Quick Testing Flow
1. **Register & Login** as a **Hotel**. Update headers.
2. Hit **Upload Food Request** (set `ai_label: "edible"`). Note down the returned `upload_id`.
3. **Register & Login** as an **NGO**. Update headers.
4. Hit **Claim Food** using the `upload_id`. Note down the returned `claim_id`.
5. Hit **Confirm Pickup** using the `claim_id`.
6. Run **Hotel History** and **Dashboard** to verify points have been awarded.
7. Run similar flow for Municipal (`ai_label: "non-edible"` -> `/muni/waste` -> `collect`).
