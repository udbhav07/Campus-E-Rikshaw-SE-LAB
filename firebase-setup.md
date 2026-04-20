# Firebase Authentication Setup Guide

Firebase Authentication is required to allow Passengers and Drivers to sign up and log in securely. Follow these steps to configure Firebase for this project.

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Enter a project name (e.g., `Campus-ERickshaw`).
4. Decide if you want Google Analytics (optional, you can disable it).
5. Click **"Create project"**.

## 2. Enable Authentication
1. In the left-hand menu of your Firebase project, click **"Build" > "Authentication"**.
2. Click **"Get started"**.
3. Go to the **"Sign-in method"** tab.
4. Enable **"Email/Password"**. (You can also enable Google sign-in later if you wish).
5. Save your changes.

## 3. Configure the Backend (Node.js)
The backend requires Firebase Admin SDK to verify the tokens sent by the client apps.
1. In the Firebase Console, go to **Project settings** (the gear icon on the top left).
2. Go to the **"Service accounts"** tab.
3. Click **"Generate new private key"**.
4. This will download a JSON file containing your credentials.
5. Open the downloaded file. You need three specific values from it to put into your backend's `.env` file (`backend/.env`):
   - `project_id` -> becomes `FIREBASE_PROJECT_ID`
   - `client_email` -> becomes `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> becomes `FIREBASE_PRIVATE_KEY`
   
**Note on Private Key Formatting:** Ensure the private key retains the `\n` characters if placed directly in the `.env` file as a string.

## 4. Configure the Frontends (React / Expo)
The frontends (Admin, Passenger, Driver) need the Firebase Client SDK configuration.
1. In **Project settings**, go to the **"General"** tab.
2. Scroll down to "Your apps".
3. Click the Web icon `</>` to register a web app (for the Admin & Passenger apps).
4. Register the app (e.g., `erickshaw-web`).
5. Copy the `firebaseConfig` object provided.
6. Create a `.env` file in the root of `admin-dashboard` and `passenger-app` with the copied variables (prefixed with `VITE_`):
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
7. For the **Driver App** (Expo), you can use the same web config, but place it in an `.env` file at the root of `driver-app` and prefix it with `EXPO_PUBLIC_`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   ...
   ```
