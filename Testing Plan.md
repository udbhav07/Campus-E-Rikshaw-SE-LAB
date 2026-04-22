# Testing Strategy for Campus E-Rickshaw System

This document outlines the test cases for unit, integration, and system testing across the Passenger, Driver, and Admin web applications, as well as the backend services.

## 1. Unit Testing
Unit tests focus on individual components, functions, and hooks in isolation.

### A. Passenger Web App
- **Login Component**:
    - Verify successful login with valid Firebase credentials.
    - Verify error message display for invalid credentials.
- **Map Component**:
    - Verify map markers update correctly when `pickup` or `dropoff` state changes.
    - Verify "selecting mode" correctly toggles between pickup and destination.
- **Ride Request Logic**:
    - Verify `requestRide` function validates that both pickup and dropoff are selected.
    - Verify `searchLocation` returns correct results from Nominatim API.
- **Rating Component**:
    - Verify star rating selection updates the internal state.
    - Verify feedback submission sends correct data to the API.

### B. Driver Web App
- **Status Toggle**:
    - Verify toggling "Go Online" updates the driver's availability in the backend.
    - Verify UI changes state based on `isOnline` status.
- **Ride Notification**:
    - Verify the incoming ride modal displays correct pickup/dropoff information.
    - Verify "Accept" and "Decline" buttons trigger the correct socket events.
- **Ride Execution Flow**:
    - Verify state transitions: `ACCEPTED` -> `ARRIVED` -> `ONGOING` -> `COMPLETED`.
    - Verify coordinate updates are sent to the backend during an active ride.

### C. Admin Web App
- **Driver Management**:
    - Verify the driver list correctly renders data fetched from the API.
    - Verify "Approve/Reject" buttons call the correct admin API endpoints.
- **Analytics Component**:
    - Verify charts/metrics correctly reflect the data provided by the analytics service.
- **Real-time Map**:
    - Verify active drivers and rides are rendered accurately on the dashboard map.

### D. Backend (Core Logic)
- **Auth Middleware**:
    - Verify JWT/Firebase token validation for protected routes.
- **Ride Controller**:
    - Verify `createRide` correctly saves ride data to MongoDB.
    - Verify distance calculation logic (if any) for ride pricing or filtering.
- **User Controller**:
    - Verify profile updates correctly modify user documents.

---

## 2. Integration Testing
Integration tests focus on the interaction between different modules, such as API-client communication and Socket.io events.

### A. Passenger <-> Backend
- **Ride Request Flow**: Verify that calling `POST /api/rides/request` creates a ride in the DB and returns the ride object.
- **History Fetching**: Verify the passenger app correctly retrieves and displays past rides for the authenticated user.

### B. Driver <-> Backend
- **Location Updates**: Verify that the driver app sending location updates via sockets correctly updates the `Driver` document in MongoDB.
- **Status Sync**: Verify that changing status in the app is reflected in the backend state immediately.

### C. Real-time Communication (Socket.io)
- **Ride Matching**: Verify that when a passenger requests a ride, the socket event `REQUEST_RIDE` is broadcast to drivers within the 2km radius.
- **Status Propagation**: Verify that when a driver accepts a ride, the passenger receives the `RIDE_STATUS_UPDATED` event with the `ASSIGNED` status.
- **Cancellation Sync**: Verify that if a passenger cancels, the assigned driver (if any) receives a notification to stop.

---

## 3. System Testing (End-to-End)
System tests verify the complete user journeys from start to finish.

### Flow 1: Successful Ride Completion
1. **Passenger**: Logs in, selects pickup/dropoff on campus, and clicks "Request".
2. **System**: Broadcasts request to available drivers.
3. **Driver**: Receives notification, clicks "Accept".
4. **Passenger**: Sees "Driver En Route" with driver details.
5. **Driver**: Clicks "Arrived", then "Start Ride".
6. **Driver**: Drives to destination and clicks "Complete Ride".
7. **Passenger**: Receives rating prompt, submits 5 stars and "Great ride!".
8. **Admin**: Sees the completed ride in the analytics and history.

### Flow 2: Driver Rejection & Re-routing
1. **Passenger**: Requests a ride.
2. **Driver A**: Receives request and clicks "Decline".
3. **System**: Ensures the request is still available for Driver B or remains in the queue.
4. **Driver B**: Accepts the ride.
5. **Passenger**: Successfully matched with Driver B.

### Flow 3: Ride Cancellation
1. **Passenger**: Requests a ride.
2. **Passenger**: Clicks "Cancel Request" before any driver accepts.
3. **System**: Marks ride as `CANCELLED` and stops broadcasting.

---

## 4. Performance & Security Testing (Optional but Recommended)
- **Concurrency**: Simulate 50 simultaneous ride requests to check backend stability.
- **Unauthorized Access**: Attempt to access `/api/admin` routes with a passenger account (should return 403).
- **Socket Disconnection**: Verify that if a driver goes offline unexpectedly, they are removed from the active drivers list in the backend.

## Verification Plan

### Automated Tests
- **Frontend**: Use **Jest** and **React Testing Library** for Unit Tests. Use **Cypress** or **Playwright** for System (E2E) Tests.
- **Backend**: Use **Supertest** for API Integration tests.

### Manual Verification
- Perform "Flow 1" using two browser windows (one for Passenger, one for Driver).
- Check MongoDB Compass to verify data persistence during the flow.
