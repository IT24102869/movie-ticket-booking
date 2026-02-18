# Movie Ticket Booking System

A full-stack **Movie Ticket Booking System** built with **React**, **FastAPI**, and **MySQL**. Browse movies, pick showtimes, select seats on an interactive seat map, and book tickets — all with real-time seat locking to prevent double bookings.

---

## Tech Stack

| Layer      | Technology                                                  |
|------------|-------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, React Router, TanStack Query, Axios |
| Backend    | FastAPI, SQLAlchemy 2.0, Pydantic v2                        |
| Database   | MySQL 8 (via Docker Compose)                                |
| Styling    | Custom CSS (dark theme)                                     |

---

## Features

- **Movies** — Browse, search, add, edit, and delete movies with poster upload
- **Showtimes** — Schedule showtimes per movie with screen & price selection
- **Interactive Seat Map** — Real-time seat grid with color-coded statuses (Available / Locked / Booked / Selected)
- **Seat Locking** — TTL-based lock mechanism prevents double booking; expired locks auto-release
- **Booking Confirmation** — Beautiful ticket card showing movie poster, date, time, seats, and price breakdown
- **My Bookings** — Rich booking cards with movie poster, details, and total price
- **Price Calculation** — Live `seats × price` calculation on seat selection
- **Poster Upload** — Upload movie posters (served as static files)
- **Seed Data** — One-click API to generate demo theaters, screens, movies, and showtimes
- **API Docs** — Auto-generated Swagger UI at `/docs`

> **Note:** Authentication is not included in this MVP. All bookings are created for a demo user (`user_id=1`).

---

## Project Structure

```
movie-ticket-booking-system/
├── README.md
│
├── backend/
│   ├── docker-compose.yml          # MySQL container
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variables template
│   │
│   └── app/
│       ├── main.py                 # FastAPI app, CORS, static files, routers
│       ├── db.py                   # SQLAlchemy engine & session
│       ├── models.py               # ORM models (Movie, Theater, Screen, Seat, Showtime, Booking, etc.)
│       ├── schemas.py              # Pydantic request/response schemas
│       ├── crud.py                 # Database operations (CRUD + seat locking logic)
│       ├── settings.py             # App settings (DB URL, lock TTL, etc.)
│       ├── utils.py                # Utility functions
│       │
│       └── routers/
│           ├── movies.py           # GET/POST/PUT/DELETE /movies
│           ├── showtimes.py        # POST /showtimes, GET seat map, POST lock-seats
│           ├── bookings.py         # POST /bookings, GET /bookings/me
│           ├── admin.py            # POST /admin/seed (demo data)
│           └── uploads.py          # POST /uploads (poster images)
│
├── frontend/
│   ├── index.html
│   ├── package.json                # Node dependencies
│   ├── tsconfig.json               # TypeScript config
│   ├── vite.config.ts              # Vite config
│   ├── .env.example                # Frontend env template
│   │
│   └── src/
│       ├── main.tsx                # App entry point
│       ├── styles.css              # Global styles (dark theme)
│       │
│       ├── api/
│       │   ├── client.ts           # Axios instance & poster URL helper
│       │   ├── types.ts            # TypeScript types (Movie, Booking, SeatMap, etc.)
│       │   ├── movies.ts           # Movie API (CRUD + showtimes)
│       │   ├── showtimes.ts        # Showtime API (create, screens, seat map, lock)
│       │   └── bookings.ts         # Booking API (create, list)
│       │
│       ├── pages/
│       │   ├── MoviesPage.tsx      # Movie grid with search
│       │   ├── MovieDetailsPage.tsx # Movie info + showtimes
│       │   ├── AddMoviePage.tsx    # Add new movie form
│       │   ├── EditMoviePage.tsx   # Edit/delete movie form
│       │   ├── Show.tsx            # Alternate showtime view
│       │   ├── ScheduleShowtimePage.tsx # Schedule a new showtime
│       │   ├── SeatSelectionPage.tsx    # Seat map + booking + ticket card
│       │   └── MyBookingsPage.tsx  # Booking history cards
│       │
│       └── routes/
│           └── App.tsx             # Router & navigation
```

---

## API Endpoints

### Movies
| Method   | Endpoint                          | Description              |
|----------|-----------------------------------|--------------------------|
| `GET`    | `/movies`                         | List all movies          |
| `POST`   | `/movies`                         | Create a new movie       |
| `GET`    | `/movies/{id}`                    | Get movie details        |
| `PUT`    | `/movies/{id}`                    | Update a movie           |
| `DELETE` | `/movies/{id}`                    | Delete a movie           |
| `GET`    | `/movies/{id}/showtimes?date=`    | Showtimes for a date     |

### Showtimes
| Method   | Endpoint                              | Description              |
|----------|---------------------------------------|--------------------------|
| `POST`   | `/showtimes`                          | Create a showtime        |
| `GET`    | `/showtimes/screens`                  | List all screens         |
| `GET`    | `/showtimes/{id}/seats`               | Seat map with movie info |
| `POST`   | `/showtimes/{id}/lock-seats`          | Lock selected seats      |

### Bookings
| Method   | Endpoint                  | Description              |
|----------|---------------------------|--------------------------|
| `POST`   | `/bookings`               | Create a booking         |
| `GET`    | `/bookings/me`            | My booking history       |
| `GET`    | `/bookings/{id}`          | Booking details          |

### Admin
| Method   | Endpoint          | Description              |
|----------|-------------------|--------------------------|
| `POST`   | `/admin/seed`     | Seed demo data           |

### Uploads
| Method   | Endpoint      | Description              |
|----------|---------------|--------------------------|
| `POST`   | `/uploads`    | Upload a poster image    |

---

## Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Docker** (for MySQL)

### 1. Start MySQL

```bash
cd backend
docker compose up -d
```

### 2. Run Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

- Backend: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

### 3. Seed Demo Data

```bash
curl -X POST http://localhost:8000/admin/seed
```

This creates sample theaters, screens, seats, movies (with posters), and showtimes.

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173

---

## Pages Overview

| Route                        | Page                  | Description                                              |
|------------------------------|-----------------------|----------------------------------------------------------|
| `/`                          | Movies                | Browse all movies in a card grid with search              |
| `/movies/add`                | Add Movie             | Form to add a new movie with poster upload                |
| `/movies/:id`                | Movie Details         | Movie info, showtimes by date, edit button                |
| `/movies/:id/edit`           | Edit Movie            | Edit movie fields, change poster, or delete the movie     |
| `/movies/:id/schedule`       | Schedule Showtime     | Pick screen, date/time, and price for a new showtime      |
| `/showtimes/:id/seats`       | Seat Selection        | Interactive seat map, price breakdown, booking + ticket   |
| `/bookings`                  | My Bookings           | Booking history cards with poster, details, and total     |

---

## How It Works

### Seat Locking Flow

```
1. User selects seats → clicks "Lock seats"
2. Backend sets status = LOCKED, locked_until = now + TTL (5 min)
3. Other users see those seats as locked (yellow)
4. If TTL expires before booking → seats auto-release to AVAILABLE
5. User clicks "Confirm booking" → seats marked BOOKED permanently
```

### Booking Flow

```
1. Browse movies → pick a showtime → select seats
2. See live price: (number of seats) × (price per seat) = total
3. Click "Confirm booking"
4. Beautiful ticket card appears with movie poster, date, time, seats, and total
5. Booking saved → viewable in "My Bookings"
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Default                                       | Description          |
|---------------------|-----------------------------------------------|----------------------|
| `DATABASE_URL`      | `mysql+pymysql://root:secret@localhost/movies` | MySQL connection URL |
| `FRONTEND_ORIGIN`   | `http://localhost:5173`                        | CORS allowed origin  |
| `LOCK_TTL_SECONDS`  | `300`                                          | Seat lock duration   |

### Frontend (`frontend/.env`)

| Variable         | Default                  | Description       |
|------------------|--------------------------|-------------------|
| `VITE_API_BASE`  | `http://localhost:8000`  | Backend API URL   |

---

## License

This project is open source and available for learning and development purposes.
