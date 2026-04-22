# 🔥 Firebase Authentication Setup Guide

This comprehensive guide will walk you through the process of setting up Firebase Authentication for the **Campus E-Rickshaw System**. This setup is critical for secure identity management for Passengers, Drivers, and Administrators.

---

## 🛠️ Step 1: Create Your Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and enter a name (e.g., `Campus-E-Rickshaw`).
3. Toggle Google Analytics as per your preference (recommended for tracking user engagement).
4. Click **"Create project"** and wait for the workspace to initialize.

---

## 🔐 Step 2: Enable Authentication Providers
1. In the left-hand sidebar, navigate to **Build > Authentication**.
2. Click **"Get started"**.
3. Select the **"Sign-in method"** tab.
4. Enable the **Email/Password** provider.
   - *Optional:* Enable **Google** sign-in for a more seamless passenger experience.
5. (Optional) Go to **Settings > User actions** and ensure "Enable create (sign up)" is toggled on.

---

## 🖥️ Step 3: Configure the Backend (Admin SDK)
The backend requires the **Firebase Admin SDK** to verify client tokens and manage user accounts securely.

### 🔑 Generate Service Account Credentials
1. Click the gear icon (**Project settings**) in the top-left menu.
2. Select the **"Service accounts"** tab.
3. Click the **"Generate new private key"** button at the bottom.
4. Securely save the downloaded `.json` file.

### 📝 Environment Configuration
Extract the following values from the JSON file and add them to your `backend/.env` file:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> [!IMPORTANT]
> **Private Key Formatting:** Ensure the `FIREBASE_PRIVATE_KEY` includes the `\n` characters for newlines. If you are using a Windows environment, be careful not to let the shell strip these characters.

---

## 🌐 Step 4: Configure Frontend Applications
All client applications (Passenger, Driver, and Admin) need the **Firebase Client SDK** to interact with the authentication service.

### 📦 Register Your Apps
1. In **Project settings > General**, scroll down to "Your apps".
2. Click the **Web (</>)** icon to register a new application.
3. Create separate registrations if desired (e.g., `web-passenger`, `web-driver`), but you can use a single configuration for all.
4. Copy the `firebaseConfig` object.

### 📂 Client-Side `.env` Setup
Create `.env` files in the respective directories using the prefixes required by their build tools (Vite or Expo).

#### **For Passenger & Admin (Vite)**
Path: `passenger-app/.env` & `admin-dashboard/.env`
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### **For Driver App (Expo)**
Path: `driver-app/.env`
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
... (and so on)
```

---

## 🧪 Step 5: Verification
To verify your setup:
1. Start the backend: `npm run dev` (inside `/backend`).
2. Attempt to sign up a new user via the Passenger app.
3. Check the **Firebase Console > Authentication > Users** tab to see if the new user appears.

---

> [!TIP]
> For production environments, never commit your `.env` files. Always use secret management tools or environment variables provided by your hosting platform (e.g., Vercel, Heroku, or AWS).

