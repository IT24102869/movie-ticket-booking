# Movie Ticket Booking System (React + FastAPI + MySQL)

This is a full working starter template for a **Movie Ticket Booking System**:
- Frontend: **React (Vite + TypeScript)**
- Backend: **FastAPI**
- Database: **MySQL** (via Docker Compose)

It includes:
- Movies list + details + showtimes
- Seat map per showtime (AVAILABLE / LOCKED / BOOKED)
- Seat locking (TTL) to prevent double booking
- Booking creation and booking history (simple demo user)
- Seed endpoint to generate demo data quickly

> Authentication is **not included** in this MVP. Bookings are created for a demo user (`user_id=1`).

---

## Quick start (Docker)

### 1) Start MySQL
```bash
cd backend
docker compose up -d
```

### 2) Run backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### 3) Seed demo data
```bash
curl -X POST http://localhost:8000/admin/seed
```

### 4) Run frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Notes

### Seat locking
When you pick seats, the frontend calls:
- `POST /showtimes/{showtime_id}/lock-seats`

The backend stores lock state in `showtime_seats` with a `locked_until` timestamp.  
Expired locks are treated as AVAILABLE.

### Confirming booking
- `POST /bookings` creates a booking and marks seats BOOKED.

---

## Project structure

```
movie-ticket-booking-system/
  backend/
  frontend/
```
