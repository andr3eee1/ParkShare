# ParkShare 🚗

**The Ultimate Peer-to-Peer Parking Network**

**ParkShare** is a disruptive peer-to-peer parking platform designed to solve urban traffic congestion by unlocking unused private parking spaces[cite: 1]. Built around the "**Be the middle man**" hackathon theme, ParkShare connects spot owners, drivers, hardware providers, and a gig-worker community into one seamless ecosystem.

## 🎯 The Problem & Our Solution
Drivers waste hours circling for parking, while private residential spots sit empty from 09:00 to 18:00[cite: 1]. ParkShare acts as an "Airbnb for parking," allowing owners to rent their spots while they are away[cite: 1]. 

## 🔗 The "Middle Man" Ecosystem
We don't own the parking spots, the hardware, or the enforcement vehicles. We provide the digital infrastructure that connects them all:
*   **Drivers ↔️ Spot Owners:** Seamless matching for empty spots with a 20% platform commission on every transaction[cite: 1].
*   **Hardware Providers ↔️ Property Managers:** A B2B integration bringing smart Bluetooth barriers to residential associations without us having to manufacture the hardware[cite: 2].
*   **Community ↔️ Enforcement:** A gig-economy layer connecting user reports with local authorities and towing services.

## ✨ Core Features
*   **Unified Municipal & Private Map:** A single interactive map displaying both city-owned parking and private residential spots.
*   **Flexible Time Slots:** Book individual spots for specific intervals, or secure safe overnight parking.
*   **Neighborhood Profit Sharing:** Aggregate spots per neighborhood or apartment complex, distributing the pooled revenue among participating neighbors.
*   **Dynamic Pricing & Subscriptions:** Real-time price adjustments based on area demand, alongside monthly subscription passes for daily commuters.
*   **Hardware as a Service (HaaS):** Integration with third-party smart barriers (e.g., Parklio) operated via Bluetooth (BLE) directly from the app[cite: 2]. The barrier lowers automatically upon arrival, ensuring the spot is never occupied by unauthorized vehicles[cite: 2].
*   **Community Enforcement & Trust:**
    *   **Overstay Fees:** Automated strict penalties for exceeding the booked timeframe.
    *   **Reputation System:** Rating mechanics for both owners and drivers based on spot availability and time discipline.
    *   **Gig-Worker Verification:** A dedicated app flow for verified users to check occupied spot reports. If a driver illegally parks in a reserved spot, gig workers dispatch local police or a towing vehicle, and the offending user is instantly banned from the platform.

## 💻 Tech Stack
*   **Frontend (Mobile):** **React Native (Expo)**. Chosen for lightning-fast cross-platform prototyping, seamless `react-native-maps` integration, and easy demo distribution to hackathon judges via Expo Go.
*   **Backend:** **Node.js** architecture, containerized with **Docker**, and deployed on a **Proxmox** virtual server environment for scalable, flexible hosting[cite: 1].
*   **Hardware API:** Partnering with manufacturers for SDK/API access to trigger BLE barriers[cite: 2].

## 🚀 Go-to-Market Strategy
Instead of a scattered city-wide launch, the initial rollout targets high-density business districts (e.g., Pipera-Floreasca)[cite: 1]. By onboarding localized homeowner associations, we guarantee that the first drivers opening the app see immediate availability—multiple green pins—in critical areas[cite: 1].

---
*Developed by Team Clutch for the VNU Hackathon.*[cite: 1]
