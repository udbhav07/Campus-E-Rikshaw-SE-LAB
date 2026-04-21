# 🛺 Campus E-Rickshaw Ride Booking System

A comprehensive, end-to-end ride-booking platform tailored for campus electric rickshaws. This system streamlines the commute experience for students and staff while providing drivers with an efficient way to manage rides and earnings.

## 🚀 Overview

The **Campus E-Rickshaw System** is built with a modern microservices-style architecture, featuring a robust real-time backend and multiple specialized frontend applications. It delivers a premium, Uber-level experience with cinematic dark-themed UIs and high-performance real-time tracking.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Socket.IO, Firebase Admin |
| **Frontend (Web)** | React 18+, Vite, TailwindCSS (for some modules), Lucide Icons |
| **Mobile (Driver)** | React Native, Expo |
| **Authentication** | Firebase Auth (Google & Email/Password) |
| **Maps & Routing** | Leaflet, OpenStreetMap, OSRM (Open Source Routing Machine) |

## 📦 Project Structure

```bash
├── admin-dashboard    # Centralized control panel for campus administrators
├── backend            # Real-time API server (Logic, DB, WebSockets)
├── driver-app         # Mobile application for rickshaw drivers (Expo)
├── driver-web-app     # Web-based terminal for rickshaw drivers
└── passenger-app      # Web application for students/staff to book rides
```

## ✨ Key Features

### 👤 Passenger Experience
- **Cinematic UI**: Premium dark-themed login with glassmorphic elements.
- **Fast Booking**: One-tap ride requests with proximity-based driver matching.
- **Live Tracking**: Real-time visualization of the rickshaw's location on the map.
- **Affordable Travel**: Transparent pricing tailored for campus needs.

### 🆔 Driver Capabilities
- **Terminal Interface**: A futuristic "Driver Terminal" for managing ride flow.
- **Online/Offline Toggle**: Flexibility to go online and receive requests at any time.
- **Smart Navigation**: Integrated OSRM routing for both pickup and destination.
- **Earnings Tracker**: Monitor performance and ride history.

### 🛡️ Admin Control
- **User Management**: Monitor and manage passenger/driver accounts.
- **Ride Audits**: View full history of campus ride activities.
- **System Health**: Overview of real-time active rides and driver availability.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Firebase Project (for Auth and Admin SDK)

### Step 1: Clone the Repository
```bash
git clone https://github.com/udbhav07/Campus-E-Rikshaw-SE-LAB.git
cd Campus-E-Rikshaw-SE-LAB
```

### Step 2: Backend Setup
```bash
cd backend
npm install
# Create .env with MONGODB_URI, FIREBASE_CONFIG, etc.
npm run dev
```

### Step 3: Frontend Setup (Passenger/Driver Web/Admin)
Repeat for each directory (`passenger-app`, `driver-web-app`, `admin-dashboard`):
```bash
cd <directory-name>
npm install
npm run dev
```

### Step 4: Driver Mobile App
```bash
cd driver-app
npm install
npx expo start
```

## 🎨 UI/UX Design

The project prioritizes "Rich Aesthetics" as mandated by our modern design philosophy:
- **Dark Mode First**: Cinematic layouts with deep gradients and neon accents.
- **Glassmorphism**: Translucent panels with high-quality backdrop blurs.
- **Responsive Layouts**: Seamless transitions between desktop and mobile views.
- **Micro-interactions**: Subtle animations and pulsing indicators for real-time states.

---
*Developed as part of the SE Lab Project.*
