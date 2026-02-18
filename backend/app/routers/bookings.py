from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud
from ..schemas import CreateBookingIn, BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])

DEMO_USER_ID = 1

@router.post("", response_model=BookingOut)
def create_booking(body: CreateBookingIn, db: Session = Depends(get_db)):
    try:
        crud.ensure_demo_user(db)
        booking = crud.create_booking(db, DEMO_USER_ID, body.showtime_id, body.seat_ids)
        db.commit()
        # reload with relationships for response
        booking_full = crud.get_booking(db, booking.id, DEMO_USER_ID)
        return _to_booking_out(booking_full)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/me", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    bookings = crud.list_bookings_for_user(db, DEMO_USER_ID)
    return [_to_booking_out(b) for b in bookings]

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    booking = crud.get_booking(db, booking_id, DEMO_USER_ID)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _to_booking_out(booking)

def _to_booking_out(b):
    movie = b.showtime.movie
    return {
        "id": b.id,
        "user_id": b.user_id,
        "showtime": {
            "id": b.showtime.id,
            "movie_id": b.showtime.movie_id,
            "screen_id": b.showtime.screen_id,
            "start_time": b.showtime.start_time,
            "end_time": b.showtime.end_time,
            "price": b.showtime.price,
            "screen": {
                "id": b.showtime.screen.id,
                "theater_id": b.showtime.screen.theater_id,
                "name": b.showtime.screen.name,
                "total_rows": b.showtime.screen.total_rows,
                "total_cols": b.showtime.screen.total_cols,
                "theater": {
                    "id": b.showtime.screen.theater.id if b.showtime.screen.theater else None,
                    "name": b.showtime.screen.theater.name if b.showtime.screen.theater else "",
                    "city": b.showtime.screen.theater.city if b.showtime.screen.theater else "",
                    "address": b.showtime.screen.theater.address if b.showtime.screen.theater else None,
                } if b.showtime.screen.theater else None
            }
        },
        "movie": {
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "duration_mins": movie.duration_mins,
            "language": movie.language,
            "genre": movie.genre,
            "poster_url": movie.poster_url,
            "release_date": movie.release_date,
        } if movie else None,
        "status": b.status.value if hasattr(b.status, "value") else str(b.status),
        "total_amount": b.total_amount,
        "created_at": b.created_at,
        "seats": [
            {"seat": {
                "id": s.seat.id,
                "screen_id": s.seat.screen_id,
                "seat_row": s.seat.seat_row,
                "seat_col": s.seat.seat_col,
                "seat_type": s.seat.seat_type,
            }}
            for s in b.seats
        ]
    }
