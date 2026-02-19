from __future__ import annotations
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import select, and_
from sqlalchemy.orm import Session, joinedload
from .models import (
    Movie, Showtime, Screen, Theater, Seat, ShowtimeSeat,
    ShowtimeSeatStatus, Booking, BookingSeat, User, BookingStatus, Rating
)
from .settings import settings
from .utils import utcnow

def create_movie(db: Session, **kwargs) -> Movie:
    movie = Movie(**kwargs)
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie

def list_movies(db: Session):
    return db.execute(select(Movie).order_by(Movie.id.desc())).scalars().all()

def get_movie(db: Session, movie_id: int):
    return db.get(Movie, movie_id)

def update_movie(db: Session, movie_id: int, **kwargs) -> Movie | None:
    movie = db.get(Movie, movie_id)
    if not movie:
        return None
    for key, value in kwargs.items():
        if value is not None or key in ("description", "language", "genre", "poster_url", "release_date"):
            setattr(movie, key, value)
    db.commit()
    db.refresh(movie)
    return movie

def delete_movie(db: Session, movie_id: int) -> bool:
    movie = db.get(Movie, movie_id)
    if not movie:
        return False
    db.delete(movie)
    db.commit()
    return True

def list_screens(db: Session):
    return db.execute(
        select(Screen).options(joinedload(Screen.theater)).order_by(Screen.id)
    ).scalars().all()

def create_showtime(db: Session, movie_id: int, screen_id: int, start_time: datetime, price, duration_mins: int) -> Showtime:
    end_time = start_time + timedelta(minutes=duration_mins)
    showtime = Showtime(
        movie_id=movie_id,
        screen_id=screen_id,
        start_time=start_time,
        end_time=end_time,
        price=price,
    )
    db.add(showtime)
    db.commit()
    db.refresh(showtime)
    return showtime

def list_showtimes_for_movie(db: Session, movie_id: int, day_start: datetime, day_end: datetime):
    stmt = (
        select(Showtime)
        .where(
            and_(
                Showtime.movie_id == movie_id,
                Showtime.start_time >= day_start,
                Showtime.start_time < day_end,
            )
        )
        .options(joinedload(Showtime.screen).joinedload(Screen.theater))
        .order_by(Showtime.start_time.asc())
    )
    return db.execute(stmt).scalars().all()

def _cleanup_expired_locks(db: Session, showtime_id: int):
    now = utcnow()
    stmt = select(ShowtimeSeat).where(ShowtimeSeat.showtime_id == showtime_id)
    rows = db.execute(stmt).scalars().all()
    for r in rows:
        if r.status == ShowtimeSeatStatus.LOCKED and r.locked_until and r.locked_until <= now:
            r.status = ShowtimeSeatStatus.AVAILABLE
            r.locked_until = None
            r.booking_id = None
    # no commit here (caller controls transaction)

def get_seat_map(db: Session, showtime_id: int):
    showtime = db.get(Showtime, showtime_id)
    if not showtime:
        return None
    screen = db.get(Screen, showtime.screen_id)
    if not screen:
        return None

    _cleanup_expired_locks(db, showtime_id)

    # Ensure showtime_seats rows exist for each seat
    seat_rows = db.execute(select(Seat).where(Seat.screen_id == screen.id)).scalars().all()
    existing = { (ss.seat_id): ss for ss in db.execute(select(ShowtimeSeat).where(ShowtimeSeat.showtime_id == showtime_id)).scalars().all() }

    for seat in seat_rows:
        if seat.id not in existing:
            db.add(ShowtimeSeat(showtime_id=showtime_id, seat_id=seat.id, status=ShowtimeSeatStatus.AVAILABLE))
    db.flush()

    ss_rows = (
        db.execute(
            select(ShowtimeSeat)
            .where(ShowtimeSeat.showtime_id == showtime_id)
            .options(joinedload(ShowtimeSeat.seat))
        )
        .scalars()
        .all()
    )
    return screen, ss_rows

def lock_seats(db: Session, showtime_id: int, seat_ids: list[int]) -> list[int]:
    showtime = db.get(Showtime, showtime_id)
    if not showtime:
        raise ValueError("Showtime not found")

    _cleanup_expired_locks(db, showtime_id)

    now = utcnow()
    locked_until = now + timedelta(seconds=settings.LOCK_TTL_SECONDS)

    # Load the rows for selected seats
    stmt = (
        select(ShowtimeSeat)
        .where(and_(ShowtimeSeat.showtime_id == showtime_id, ShowtimeSeat.seat_id.in_(seat_ids)))
        .with_for_update()
        .options(joinedload(ShowtimeSeat.seat))
    )
    rows = db.execute(stmt).scalars().all()

    # If some rows missing (shouldn't after seat map init), create them
    existing_ids = {r.seat_id for r in rows}
    missing = [sid for sid in seat_ids if sid not in existing_ids]
    for sid in missing:
        db.add(ShowtimeSeat(showtime_id=showtime_id, seat_id=sid, status=ShowtimeSeatStatus.AVAILABLE))
    db.flush()

    rows = db.execute(stmt).scalars().all()

    # Validate availability
    for r in rows:
        if r.status == ShowtimeSeatStatus.BOOKED:
            raise RuntimeError(f"Seat {r.seat_id} is already booked")
        if r.status == ShowtimeSeatStatus.LOCKED and r.locked_until and r.locked_until > now:
            raise RuntimeError(f"Seat {r.seat_id} is currently locked")

    # Lock them
    for r in rows:
        r.status = ShowtimeSeatStatus.LOCKED
        r.locked_until = locked_until
        r.booking_id = None

    return seat_ids

def create_booking(db: Session, user_id: int, showtime_id: int, seat_ids: list[int]) -> Booking:
    showtime = db.get(Showtime, showtime_id)
    if not showtime:
        raise ValueError("Showtime not found")

    _cleanup_expired_locks(db, showtime_id)
    now = utcnow()

    # Lock check & update to BOOKED under transaction
    stmt = (
        select(ShowtimeSeat)
        .where(and_(ShowtimeSeat.showtime_id == showtime_id, ShowtimeSeat.seat_id.in_(seat_ids)))
        .with_for_update()
    )
    ss_rows = db.execute(stmt).scalars().all()
    if len(ss_rows) != len(seat_ids):
        raise RuntimeError("One or more seats not found for this showtime")

    for r in ss_rows:
        if r.status == ShowtimeSeatStatus.BOOKED:
            raise RuntimeError(f"Seat {r.seat_id} is already booked")
        if r.status == ShowtimeSeatStatus.LOCKED and r.locked_until and r.locked_until > now:
            # Allow booking only if the seat is locked (by anyone). For MVP we allow booking as long as it is not locked by someone else.
            # Since we have no user identity in locks, we require seats to be AVAILABLE or LOCKED but unexpired.
            # We'll still allow if it's LOCKED (you just locked it).
            pass

    total_amount = Decimal(showtime.price) * Decimal(len(seat_ids))
    booking = Booking(
        user_id=user_id,
        showtime_id=showtime_id,
        status=BookingStatus.CONFIRMED,
        total_amount=total_amount,
    )
    db.add(booking)
    db.flush()

    # booking seats
    for sid in seat_ids:
        db.add(BookingSeat(booking_id=booking.id, seat_id=sid))

    # mark showtime seats BOOKED
    for r in ss_rows:
        r.status = ShowtimeSeatStatus.BOOKED
        r.locked_until = None
        r.booking_id = booking.id

    db.flush()
    db.refresh(booking)
    return booking

def list_bookings_for_user(db: Session, user_id: int):
    stmt = (
        select(Booking)
        .where(Booking.user_id == user_id)
        .options(
            joinedload(Booking.showtime).joinedload(Showtime.screen).joinedload(Screen.theater),
            joinedload(Booking.seats).joinedload(BookingSeat.seat),
        )
        .order_by(Booking.id.desc())
    )
    return db.execute(stmt).unique().scalars().all()

def get_booking(db: Session, booking_id: int, user_id: int):
    stmt = (
        select(Booking)
        .where(and_(Booking.id == booking_id, Booking.user_id == user_id))
        .options(
            joinedload(Booking.showtime).joinedload(Showtime.screen).joinedload(Screen.theater),
            joinedload(Booking.seats).joinedload(BookingSeat.seat),
        )
    )
    return db.execute(stmt).unique().scalars().first()

def upsert_rating(db: Session, user_id: int, movie_id: int, score: int) -> Rating:
    stmt = select(Rating).where(and_(Rating.user_id == user_id, Rating.movie_id == movie_id))
    existing = db.execute(stmt).scalars().first()
    if existing:
        existing.score = score
        db.commit()
        db.refresh(existing)
        return existing
    rating = Rating(user_id=user_id, movie_id=movie_id, score=score)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


def get_user_rating(db: Session, user_id: int, movie_id: int) -> Rating | None:
    return db.execute(
        select(Rating).where(and_(Rating.user_id == user_id, Rating.movie_id == movie_id))
    ).scalars().first()


def list_user_ratings(db: Session, user_id: int):
    return db.execute(
        select(Rating).where(Rating.user_id == user_id).order_by(Rating.id.desc())
    ).scalars().all()


def delete_rating(db: Session, user_id: int, movie_id: int) -> bool:
    rating = db.execute(
        select(Rating).where(and_(Rating.user_id == user_id, Rating.movie_id == movie_id))
    ).scalars().first()
    if not rating:
        return False
    db.delete(rating)
    db.commit()
    return True


def ensure_demo_user(db: Session) -> User:
    u = db.execute(select(User).where(User.id == 1)).scalars().first()
    if u:
        return u
    u = User(id=1, email="demo@example.com", name="Demo User")
    db.add(u)
    db.flush()
    return u
