<div align="center">
  
# Full-Stack Event Management Platform with AI-based Semantic Search

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*A comprehensive platform to simplify creating, managing, and discovering events, featuring an advanced AI-Powered Semantic Search.*

</div>

---

## 📑 Table of Contents
- [Overview](#-overview)
- [✨ Features](#-features)
- [🧠 AI-Powered Semantic Search](#-ai-powered-semantic-search)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Installation & Setup](#-installation--setup)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [📄 License](#-license)

---

## 🌟 Overview
The **Event Management Dashboard** is a full-stack platform to simplify creating, managing, and discovering events. It empowers organizers with tools to manage event lifecycles and registration capacities while offering users an intuitive browsing, registration, and attendee dashboard experience.

Features integrated **AI-Powered Semantic Event Search** using `sentence-transformers` vector embeddings (`all-MiniLM-L6-v2`), understanding natural language user queries (e.g. *"AI workshop for beginners on weekends"*).

## ✨ Features
- **💂‍♂️ Role-Based Access Control:** Distinct, secure permissions for 'Organizers' and 'Attendees'.
- **📅 Event Creation & Management:** Organizers can define event details, update events, track registration capacity, and delete events.
- **🎟️ User Registration:** Attendees can browse events, register securely, and view registered events on their dashboard.
- **⚡ Real-Time Updates:** Live WebSocket tracking of registration numbers ensures instant availability updates.
- **📱 Modern Glassmorphic Design:** Ultra-responsive React/Next.js UI with zero server/client date hydration mismatches.

---

## 🛠 Tech Stack
| Category | Technology |
|---|---|
| **Frontend** | React / Next.js (TypeScript, Tailwind CSS, Lucide Icons) |
| **Backend** | FastAPI (Python, Pydantic v2) |
| **Database** | SQLite / PostgreSQL (SQLAlchemy) |
| **Vector Store** | In-memory NumPy Vector Store & FAISS |
| **AI & Embeddings** | SentenceTransformers (`all-MiniLM-L6-v2`) |
| **Authentication** | JWT (JSON Web Tokens) & PBKDF2 Password Hashing |
| **Real-time Engine** | WebSockets (FastAPI Server) |

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/patelayush3/event-management-dashboard.git
cd event-management-dashboard
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="sqlite:///./eventdb.sqlite"
SECRET_KEY="super-secret-jwt-key-change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EMBEDDING_MODEL="all-MiniLM-L6-v2"
FAISS_INDEX_PATH="faiss_data/events.index"
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_WS_URL="ws://localhost:8000/ws"
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Role Required | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user/organizer | None | `201`, `400` |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT token | None | `200`, `401` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | User / Organizer | `200`, `401` |
| `GET` | `/api/events` | List all upcoming events | None | `200` |
| `GET` | `/api/events/my-registrations` | List events registered by attendee | User / Attendee | `200`, `401` |
| `GET` | `/api/events/my-events` | List events created by organizer | Organizer | `200`, `401`, `403` |
| `POST` | `/api/events/search` | **Semantic AI search for events** | None | `200` |
| `GET` | `/api/events/{event_id}` | Get details for a specific event | None | `200`, `404` |
| `POST` | `/api/events` | Create a new event & generate vector embedding | Organizer | `201`, `401`, `403`, `422` |
| `PUT` | `/api/events/{event_id}` | Update an event (capacity cannot be reduced below current registrations) | Organizer | `200`, `400`, `401`, `403`, `404` |
| `DELETE`| `/api/events/{event_id}` | Delete an event and remove vector embedding | Organizer | `200`, `401`, `403`, `404` |
| `POST` | `/api/events/{event_id}/register`| Register for an event | User / Attendee | `201`, `400`, `401`, `404` |
| `DELETE`| `/api/events/{event_id}/register`| Cancel event registration | User / Attendee | `200`, `401`, `404` |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
