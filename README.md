<div align="center">
  
# Full-Stack Event Management Platform with AI-based Semantic Search

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*A comprehensive platform to simplify creating, managing, and discovering events, featuring an advanced AI-Powered Semantic Search.*

</div>

---

## 📑 Table of Contents
- [Overview](#-overview)
- [✨ Features](#-features)
- [🧠 AI-Powered Semantic Search](#-ai-powered-semantic-search)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 System Architecture](#-system-architecture)
- [🚀 Installation & Setup](#-installation--setup)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [📂 Folder Structure](#-folder-structure)
- [🖼 Screenshots](#-screenshots)
- [📖 Usage Guide](#-usage-guide)
- [🔮 Future Improvements](#-future-improvements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview
The **Event Management Dashboard** is a comprehensive platform to simplify creating, managing, and discovering events. It empowers organizers with powerful tools to create and manage their events, while offering users an intuitive browsing and registration experience. 

What sets this platform apart is its integrated **AI-Powered Semantic Event Search**. Rather than relying on simple, rigid keyword matching, the platform understands the meaning behind user queries, enabling users to find exactly what they're looking for using natural language.

## ✨ Features
- **💂‍♂️ Role-Based Access Control:** Distinct, secure views and permissions for 'Organizers' and 'Users'.
- **📅 Event Creation & Management:** Organizers can easily define event details, manage capacity, and track lifecycle states.
- **🎟️ User Registration:** Users can browse upcoming events and register securely with just a few clicks.
- **⚡ Real-Time Updates:** Live tracking of registration numbers ensures organizers and users see accurate availability instantly via WebSockets.
- **📱 Responsive Design:** Optimized UI providing a seamless experience across desktop, tablet, and mobile devices.

## 🧠 AI-Powered Semantic Search
The core innovation of this platform is its production-grade semantic search engine, designed to understand the context and intent of user queries. 

Unlike traditional search engines that rely on exact keyword matches, our system allows users to search using natural language (e.g., *"AI workshop for beginners this weekend"*). 


## 🛠 Tech Stack
| Category | Technology |
|---|---|
| **Frontend** | React / Next.js (TypeScript, Tailwind CSS) |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **Vector Store** | FAISS |
| **AI & Embeddings** | OpenAI API |
| **Authentication** | JWT (JSON Web Tokens) |
| **Real-time Engine** | WebSocket (via FastAPI Server) |

> Designed with AI-first architecture using embeddings and vector similarity search.

## 🏗 System Architecture
The application follows a modern decoupled architecture:

```mermaid
graph TD
    subgraph Client Layer
        SPA[Responsive Frontend SPA]
    end

    subgraph API Layer
        FastAPI[FastAPI Backend]
    end

    subgraph Data Layer
        DB[(PostgreSQL Database)]
    end

    subgraph AI & Search Layer
        OpenAI[OpenAI API]
        FAISS[(FAISS Vector Store)]
    end

    SPA <-->|REST APIs & WebSockets| FastAPI
    FastAPI <-->|Relational Data| DB
    FastAPI -->|Generate Embeddings| OpenAI
    FastAPI <-->|Vector Search| FAISS
```

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/patelayush3/event-management-dashboard.git
cd event-management-dashboard
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate  
# On Windows: 
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Environment Variables

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost/eventdb"
JWT_SECRET_KEY="your-super-secret-jwt-key"
OPENAI_API_KEY="sk-your-openai-api-key"
PORT=8000
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_WS_URL="ws://localhost:8000/ws"
```

## 📡 API Endpoints

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user/organizer | None |
| `POST` | `/api/auth/login` | Authenticate user and get token | None |
| `GET` | `/api/events` | List all upcoming events | None/User/Organizer |
| `GET` | `/api/events/search` | **Semantic search for events** | None/User/Organizer |
| `GET` | `/api/events/{id}` | Get specific event details | None/User/Organizer |
| `POST` | `/api/events` | Create a new event | Organizer |
| `PUT` | `/api/events/{id}` | Update an existing event | Organizer |
| `DELETE`| `/api/events/{id}` | Cancel/Delete an event | Organizer |
| `POST` | `/api/events/{id}/register`| Register for an event | User |
| `GET` | `/api/users/me/events` | List events user registered for| User |

## 📂 Folder Structure

```text
event-management-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   ├── core/         # Config and security
│   │   ├── models/       # Database schemas
│   │   ├── services/     # Business logic & AI Integration
│   │   └── main.py       # FastAPI application entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── .env.local
├── README.md
└── .gitignore
```

## 🖼 Screenshots

_Add screenshots of Organizer Dashboard, Event Creation, and Semantic Search results here._

## 📖 Usage Guide

### 👨‍💼 For Organizers
1. **Sign Up/Login** as an Organizer.
2. Navigate to your **Organizer Dashboard**.
3. Click **"Create Event"**. Provide a detailed description; the AI system will automatically generate rich embeddings for superior discovery.
4. Monitor live registration counts on your dashboard, pushed in real-time.

### 👤 For Users
1. **Sign Up/Login** as a User.
2. Navigate to the **Event Discovery Tab**.
3. **Use the AI Search Bar:** Instead of exact names, try typing naturally. E.g., *"Looking for networking events for tech founders in the evening"*.
4. Browse the semantically matched results and click **"Register"** to secure your spot.

## 🔮 Future Improvements
- **🤖 AI-Driven Event Recommendations:** Proactively suggest events to users based on their past registrations and expressed interests.
- **💬 Virtual Event Assistant (Chatbot):** An AI assistant to answer user questions about specific event details or logistics (e.g., parking, dress code) using Retrieval-Augmented Generation (RAG).
- **📊 Sentiment Analysis:** Analyze post-event feedback and reviews using natural language processing to provide actionable insights for organizers.


## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <b>Built by Ayush Patel</b>
</div>
