# ParkShare 🚗

**The Ultimate Peer-to-Peer Parking Network**

**ParkShare** is a disruptive peer-to-peer parking platform designed to solve urban traffic congestion by unlocking unused private parking spaces. Built around the "**Be the middle man**" hackathon theme, ParkShare connects spot owners, drivers, and an hourly enforcement fleet into one seamless ecosystem without owning a single piece of real estate.

## 🎯 The Problem & Our Solution
Drivers waste hours circling for parking, while private residential spots sit empty from 09:00 to 18:00. ParkShare acts as an "Airbnb for parking," allowing owners to rent their spots while they are away. 

## 🔗 The "Middle Man" Ecosystem
We don't own the parking spots and we don't own the enforcement vehicles. We provide the digital infrastructure that connects them all:
*   **Drivers ↔️ Spot Owners:** Seamless matching for empty spots with a 20% platform commission on every transaction.
*   **Platform ↔️ Enforcement:** An operational layer connecting user reports with local authorities, towing services, and our verified on-shift agents.

## ✨ Core Features
*   **Unified Municipal & Private Map:** A single interactive map displaying both city-owned parking and private residential spots.
*   **Flexible Time Slots:** Book individual spots for specific intervals, or secure safe overnight parking.
*   **Neighborhood Profit Sharing:** Aggregate spots per neighborhood or apartment complex, distributing the pooled revenue among participating neighbors.
*   **Dynamic Pricing & Subscriptions:** Real-time price adjustments based on area demand, alongside monthly subscription passes for daily commuters.

## 🛑 Anti-Squatting & Trust Enforcement
To ensure spot owners never return home to an occupied driveway, we implemented a robust, software-first enforcement system:
*   **Smart Escrow Deposits:** Drivers authorize a security deposit hold on their card when booking. The deposit is instantly refunded only upon a successful GPS and photo-verified check-out.
*   **Dedicated Enforcement Fleet (Hourly Agents):** To eliminate the risk of report farming or "win-trading" fraud, our verification agents are paid an **hourly wage**, not per report. When an owner flags an occupied spot, an on-shift agent is dispatched to snap a photo of the license plate and confirm the violation.
*   **Automated Towing & Banning:** Once an agent verifies the illegal parker, the platform automatically dispatches a partnered towing service or local police. The offending user is permanently banned, and their forfeited deposit covers the operational costs.
*   **Property Validation (KYP - Know Your Property):** Spots are verified via documentation. Additionally, B2B dashboards allow Homeowner Associations (HOAs) to automatically invalidate listings when an apartment is sold or tenants change, ensuring zero conflicts.

## 💻 Tech Stack
*   **Frontend (Mobile):** **React Native (Expo)**. Chosen for lightning-fast cross-platform prototyping, seamless map integration, and easy demo distribution to hackathon judges via Expo Go.
*   **Backend:** **Node.js** architecture, containerized with **Docker**, and deployed on a **Proxmox** virtual server environment for scalable, flexible hosting.

## 🚀 Go-to-Market Strategy
Instead of a scattered city-wide launch, the initial rollout targets high-density business districts (e.g., Pipera-Floreasca). By onboarding localized homeowner associations, we guarantee that the first drivers opening the app see immediate availability—multiple green pins—in critical areas.

## 🎁 Bonus: Hardware as a Service (Future Scope)
As a premium upgrade for property managers who want 100% physical security, we plan a B2B integration with third-party smart Bluetooth (BLE) barriers.
*   **Zero Manufacturing:** We don't build the hardware. We partner with existing manufacturers and use their API/SDK.
*   **Seamless App Control:** The barrier lowers automatically via Bluetooth when the authorized driver arrives, ensuring the spot is completely protected without manual oversight.

---
*Developed by Team Clutch at the VNU Hackathon!*