# ♻️ WasteZero
**Smart Waste Pickup & Recycling Platform**

[![FOSS Hack 2026](https://img.shields.io/badge/FOSS%20Hack-2026-blueviolet)](https://foss-hack.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Bridging the gap between citizens, NGOs, and municipal bodies through real-time coordination and data-driven waste management.

---

## 🚀 The Vision
In many urban areas, waste stays on the streets because the "communication loop" is broken. **WasteZero** provides a unified digital ecosystem to ensure no waste is left uncollected. It transforms passive citizens into active volunteers and gives NGOs the tools they need to manage impact at scale.

## ✨ Key Features
- **📍 Smart Pickup Requests:** Volunteers can tag locations and schedule waste collections.
- **💬 Real-Time Coordination:** Instant chat powered by **Socket.io** for NGOs and volunteers.
- **📢 NGO Opportunity Hub:** A marketplace for cleanup drives and recycling campaigns.
- **📊 Admin Insights:** Comprehensive dashboard with analytics on waste trends and participation.
- **🔐 Role-Based Access:** Dedicated interfaces for Volunteers, NGOs, and Administrators.

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Real-time:** Socket.io
- **Database:** MongoDB Atlas
- **Auth:** JWT & Bcrypt
- **Deployment:** Vercel (Frontend) & Render (Backend)

---

## 🏗️ Project Structure
```text
wastezero/
├── client/          # React + Tailwind CSS
├── server/          # Node.js + Express + Socket.io
└── README.md
🛠️ Installation & Setup
Clone the repo:

Bash
git clone [https://github.com/YOUR_USERNAME/wastezero.git](https://github.com/YOUR_USERNAME/wastezero.git)
Install Dependencies:

Bash
# For Server
cd server && npm install
# For Client
cd client && npm install
Environment Variables:
Create a .env file in the server directory with:
MONGO_URI, JWT_SECRET, PORT
```
---


# 🤝  Contributing


This is an Open Source project. We welcome contributions to help make our cities cleaner!

Fork the Project

Create your Feature Branch

Commit your Changes

Open a Pull Request




Built for FOSS Hack 2026 by Pradeep Reddy Settipalle
