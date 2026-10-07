# ParkShare 🚗

**The Ultimate Peer-to-Peer Parking Network**

**ParkShare** is a disruptive peer-to-peer parking platform designed to solve urban traffic congestion by unlocking unused private parking spaces. Built around the "**Be the middle man**" hackathon theme, ParkShare connects spot owners, drivers, and an hourly enforcement fleet into one seamless ecosystem without owning a single piece of real estate.

---

## 🛠 Features & Codebase (Oct 2026)

ParkShare is a full-stack monorepo containing a React Native frontend application and a robust Node.js backend API. 

### 🌐 Frontend (React Native & Expo Web)
The frontend is built using **React Native (Expo)** with native Web support, focusing heavily on responsive design that adapts flawlessly to both mobile devices and desktop monitors.
- **Dynamic Layout Architecture:** The core `ExploreScreen` acts as a native bottom-sheet on mobile devices, but automatically fluid-shifts into a beautiful Google Maps-style side-by-side split pane when viewed on desktop web browsers.
- **Fluid Map Interactions:** Implemented an interactive Leaflet map injected via a local HTML template into `react-native-webview`. Handles complex React Native to Web DOM bridging for drag/zoom pointer events and dynamic marker updates.
- **Smart Search & Geocoding:** Features a lightning-fast location search bar that queries a remote geocoding API and locally caches **Search History** via `AsyncStorage`. Includes robust UI logic to seamlessly dismiss search suggestions and the OS keyboard upon tapping the map via invisible Pressable overlays.
- **Real-Time Booking Timer:** Users can initiate instant reservations for private and municipal spots. The app features a live, ticking timer and cost estimator that tracks exactly how long you've been parked and what your current cost is.
- **Vehicle Registry:** Securely save your vehicles and license plates. Users can quickly select an existing car or input a custom license plate right from the booking modal.
- **Passes & Wallet:** Features a simulated wallet system. Users can subscribe to the "Park Plus" membership for discounts or buy specific Municipal Passes to waive security deposits and reduce hourly rates.
- **Persistent Authentication State:** A global `AuthContext` manages the user session, wallet balances, and active passes across the app.

### ⚙️ Backend (Node.js & Express)
The backend is a high-performance **Node.js** API using **Express** and the **Prisma ORM**.
- **PostgreSQL Database:** Powered by a live Supabase PostgreSQL cluster, seamlessly managed via Prisma schemas.
- **Role-Based Architecture:** Natively supports `USER`, `PROVIDER`, and `ADMIN` roles.
- **Modular Routes:** Organized into specialized REST API endpoints:
  - `/auth`: Registration, login, and `/auth/me` sync.
  - `/spots`: Fetch available parking locations and statuses.
  - `/bookings`: Start and complete parking sessions, updating wallet balances.
  - `/vehicles`: Manage saved license plates.
  - `/wallet`: Simulate top-ups and deductions.
  - `/passes`: Manage Park Plus subscriptions and active passes.
- **Secure Authentication (JWT):** Inputs are strictly validated using **Zod**. Passwords are securely hashed and salted using **bcryptjs**. Stateless sessions are issued via signed **JSON Web Tokens (JWT)**.

---

## 💻 Tech Stack
*   **Frontend Mobile & Web:** React Native (Expo), React Navigation v6, React Native WebView, Leaflet.js
*   **Backend API:** Node.js, Express.js, TypeScript, Zod
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
5. Start the development server (runs on Port 3000 locally):
   ```bash
   npm run dev
   ```

### 2. Start the Frontend App
1. Open a separate terminal and navigate into the `frontend` folder.
2. Ensure you have a `.env` file pointing to your local backend API if testing locally (e.g. `EXPO_PUBLIC_API_URL=http://localhost:3000`).
3. Install dependencies: `npm install`
4. Launch the Expo bundler:
   ```bash
   npm start
   ```
5. Press `w` to open it in a local web browser, or scan the QR code with the Expo Go app on your phone!

---
*Developed by Team Clutch at the VNU Hackathon!*
