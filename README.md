# ParkShare 🚗

**The Ultimate Peer-to-Peer Parking Network**

**ParkShare** is a disruptive peer-to-peer parking platform designed to solve urban traffic congestion by unlocking unused private parking spaces. Built around the "**Be the middle man**" hackathon theme, ParkShare connects spot owners, drivers, and an hourly enforcement fleet into one seamless ecosystem without owning a single piece of real estate.

---

## 🛠 Current State of the Codebase (Oct 2026)

ParkShare is actively being developed as a full-stack monorepo containing both the React Native frontend application and a robust Node.js backend API. The current development focus has been on establishing the core infrastructure, responsive mapping UI, and a secure authentication flow.

### 🌐 Frontend (React Native & Expo Web)
The frontend is built using **React Native (Expo)** with native Web support, focusing heavily on responsive design that adapts flawlessly to both mobile devices and desktop monitors.
- **Dynamic Layout Architecture:** The core `ExploreScreen` acts as a native bottom-sheet on mobile devices, but automatically fluid-shifts into a beautiful Google Maps-style side-by-side split pane when viewed on desktop web browsers.
- **Leaflet Map Integration:** Implemented an interactive Leaflet map injected via a local HTML template into `react-native-webview`. Handles complex React Native to Web DOM bridging for drag/zoom pointer events and dynamic marker updates.
- **Persistent Authentication State:** A global `AuthContext` powered by `@react-native-async-storage/async-storage` manages the user session across the app.
- **Reactive Navigation:** Uses `@react-navigation/native-stack`. The app is completely locked behind the Auth Stack (`LoginScreen` / `RegisterScreen`) and automatically mounts the `MainApp` Tab Navigator upon successful login.
- **Account Dashboard:** A fully responsive Settings tab featuring dynamic user profiles (name, email, role), safe-area padded sub-setting screens, and a functioning secure logout flow.

### ⚙️ Backend (Node.js & Express)
The backend is a high-performance **Node.js** API using **Express** and the **Prisma ORM**, configured to run on a custom port (`8745`) for production server deployment.
- **PostgreSQL Database:** Powered by a live Supabase PostgreSQL cluster, seamlessly managed via Prisma schemas.
- **Role-Based Architecture:** The `User` database model natively supports `USER`, `PROVIDER`, and `ADMIN` roles.
- **Secure Authentication (JWT):** The API features fully functional `/auth/register` and `/auth/login` endpoints.
  - Inputs are strictly validated using **Zod**.
  - Passwords are securely hashed and salted using **bcryptjs**.
  - Stateless sessions are issued via signed **JSON Web Tokens (JWT)**.

---

## 💻 Tech Stack
*   **Frontend Mobile & Web:** React Native (Expo), React Navigation v6, React Native WebView, Leaflet.js
*   **Backend API:** Node.js, Express.js, Zod
*   **Database & ORM:** PostgreSQL (Supabase), Prisma ORM v5
*   **Security:** bcryptjs, jsonwebtoken, AsyncStorage

---

## 🚀 How to Run Locally

### 1. Start the Backend API
1. Navigate into the `backend` folder.
2. Duplicate `backend/.env.example` and rename it to `.env`. Add your Supabase `DATABASE_URL` connection string and a random string for `JWT_SECRET`.
3. Install dependencies: `npm install`
4. Generate the Prisma Client and sync the database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Start the development server (runs on Port 3000 locally, 8745 in production):
   ```bash
   npm run dev
   ```

### 2. Start the Frontend App
1. Open a separate terminal and navigate into the `frontend` folder.
2. Install dependencies: `npm install`
3. Launch the Expo bundler:
   ```bash
   npm start
   ```
4. Press `w` to open it in a local web browser, or scan the QR code with the Expo Go app on your phone!

---
*Developed by Team Clutch at the VNU Hackathon!*
