# Movie Ticket Booking System — CV Project Summary

## Tech Stack
**Collaborative Filtering ML Engine (SVD), MySQL, FastAPI, React.js, Node.js (Full-Stack)**

## Project Description

**Movie Ticket Booking System** is a comprehensive full-stack web application for browsing movies, scheduling showtimes, selecting seats interactively, and booking tickets with personalized movie recommendations powered by machine learning.

### Key Accomplishments

• **Designed and implemented a full-stack application** with a dynamic React.js frontend, RESTful FastAPI backend, and MySQL database for persistent storage of movies, showtimes, bookings, and user ratings.

• **Built a real-time interactive seat selection system** with TTL-based seat locking mechanism (5-minute expiry) to prevent concurrent booking conflicts; auto-releases expired locks for optimal seat availability.

• **Implemented Singular Value Decomposition (SVD) collaborative filtering** recommendation engine that analyzes user rating patterns to deliver personalized movie suggestions with cold-start fallback using genre similarity and global popularity rankings.

• **Developed RESTful API architecture** with FastAPI routers for modular endpoints (movies, showtimes, bookings, ratings, admin utilities) and automatic Swagger documentation at `/docs`.

• **Engineered secure file uploads** with poster image hosting as static files; integrated file management across frontend and backend for seamless media delivery.

• **Implemented admin seeding functionality** to generate demo data (theaters, screens, seats, showtimes, 9+ fake users with ratings) for rapid testing and ML model training datasets.

• **Structured data models** using SQLAlchemy ORM with Theater, Screen, Seat, Showtime, Booking, Movie, and Rating entities; designed database schema for efficient querying and referential integrity.

• **Integrated frontend state management** with React Router for multi-page navigation, TanStack Query for server-state caching, and Axios for HTTP communication; TypeScript types ensure type safety across the stack.

• **Configured CORS and environment-based settings** (database URL, lock TTL, API origins) for secure cross-origin requests and flexible deployment configurations.

---

## Tech Stack Breakdown

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, React Router, TanStack Query, Axios, Custom CSS (Dark Theme) |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn |
| **Database** | MySQL 8 (Docker Compose) |
| **ML/Algorithms** | SVD Matrix Factorization, Collaborative Filtering |
| **DevOps** | Docker, Environment Variables, CORS |

---

## Features & Functionality

### 🎬 Movie Management
- Browse, search, create, update, and delete movies
- Movie poster uploads and static file serving
- Movie detail pages with showtimes filtered by date

### 🪑 Interactive Seat Selection
- Real-time seat grid with color-coded statuses (Available, Locked, Booked, Selected)
- TTL-based seat locking: prevents double booking with automatic lock expiry after 5 minutes
- Live price calculation: `(number of seats) × (price per seat) = total cost`

### 🎫 Booking & Ticket Management
- Secure booking confirmation with beautiful ticket cards
- Displays movie poster, showtime, selected seats, and price breakdown
- Booking history with all user reservations and total pricing

### ⭐ ML-Powered Recommendations
- **SVD Collaborative Filtering:** Analyzes user rating matrix to predict movie scores
- **Personalized "For You" page:** Ranked recommendations based on predicted preferences
- **Cold-start handling:** Uses genre similarity + global popularity when insufficient ratings exist
- 1-5 star rating system with average scores displayed on movie cards

### 🔧 Admin & Utilities
- Seed API: Generate demo data (theaters, screens, movies, showtimes, users, ratings)
- Auto-generated Swagger UI documentation
- Environment-based configuration management

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/movies` | List all movies |
| `POST` | `/movies` | Create new movie |
| `GET` | `/movies/{id}/showtimes?date=` | Get showtimes for a date |
| `POST` | `/showtimes/{id}/lock-seats` | Lock selected seats (TTL mechanism) |
| `POST` | `/bookings` | Create booking |
| `GET` | `/bookings/me` | Retrieve user booking history |
| `POST` | `/ratings` | Rate a movie (1-5 stars, upsert) |
| `GET` | `/ratings/recommendations?limit=` | Get personalized ML recommendations |
| `POST` | `/admin/seed` | Seed demo data for testing |

---

## Learning & Technical Highlights

✅ **Full-Stack Development:** Proficiency across React frontend, FastAPI backend, and database design  
✅ **Machine Learning Integration:** Hands-on experience with collaborative filtering algorithms (SVD)  
✅ **Real-Time Concurrency Handling:** Designed and implemented seat locking with TTL expiry logic  
✅ **RESTful API Design:** Modular, maintainable FastAPI routers with Pydantic validation  
✅ **Type Safety:** TypeScript across frontend; Pydantic v2 schemas for backend validation  
✅ **Database Design:** Normalized MySQL schema with SQLAlchemy ORM for complex entity relationships  
✅ **Docker & DevOps:** Containerized MySQL with Docker Compose for reproducible environments  

---

## Project Links

- **Repository:** https://github.com/IT24102869/movie-ticket-booking
- **Frontend:** React 18 with Vite (runs on `http://localhost:5173`)
- **Backend:** FastAPI with Uvicorn (runs on `http://localhost:8000`)
- **API Docs:** Swagger UI at `/docs` endpoint
