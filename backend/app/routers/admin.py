from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import get_db
from ..models import Movie, Theater, Screen, Seat, Showtime
from ..crud import ensure_demo_user
import string

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    # Create demo user
    ensure_demo_user(db)

    # If already seeded (any movies exist), do nothing
    if db.execute(select(Movie)).scalars().first():
        return {"ok": True, "message": "Already seeded"}

    theater = Theater(name="Cityplex", city="Colombo", address="123 Main Rd")
    db.add(theater)
    db.flush()

    screen = Screen(theater_id=theater.id, name="Screen 1", total_rows=8, total_cols=10)
    db.add(screen)
    db.flush()

    # Seats A-H, 1-10
    rows = list(string.ascii_uppercase[:screen.total_rows])
    for r in rows:
        for c in range(1, screen.total_cols + 1):
            seat_type = "VIP" if r in ["A", "B"] else "REGULAR"
            db.add(Seat(screen_id=screen.id, seat_row=r, seat_col=c, seat_type=seat_type))
    db.flush()

    movie1 = Movie(
        title="The FastAPI Adventure",
        description="A demo movie about building APIs at lightning speed.",
        duration_mins=120,
        language="English",
        genre="Action/Tech",
        poster_url="https://via.placeholder.com/300x450?text=FastAPI+Adventure",
    )
    movie2 = Movie(
        title="React to the Future",
        description="A demo movie about UI that updates faster than your thoughts.",
        duration_mins=110,
        language="English",
        genre="Sci-Fi",
        poster_url="https://via.placeholder.com/300x450?text=React+to+the+Future",
    )
    db.add_all([movie1, movie2])
    db.flush()

    now = datetime.now()
    showtimes = []
    for i, movie in enumerate([movie1, movie2], start=0):
        for j in range(3):
            start = (now + timedelta(hours=2 + j*3)).replace(minute=0, second=0, microsecond=0)
            end = start + timedelta(minutes=movie.duration_mins)
            st = Showtime(
                movie_id=movie.id,
                screen_id=screen.id,
                start_time=start,
                end_time=end,
                price=12.00 + i*2
            )
            showtimes.append(st)

    db.add_all(showtimes)
    db.commit()
    return {"ok": True, "message": "Seeded demo data"}
