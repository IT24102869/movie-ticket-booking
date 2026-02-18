from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud
from ..schemas import ShowtimeIn, ShowtimeOut, ScreenOut, SeatMapOut, LockSeatsIn, LockSeatsOut
from ..settings import settings

router = APIRouter(prefix="/showtimes", tags=["showtimes"])

@router.post("", response_model=ShowtimeOut, status_code=201)
def create_showtime(payload: ShowtimeIn, db: Session = Depends(get_db)):
    movie = crud.get_movie(db, payload.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    showtime = crud.create_showtime(
        db,
        movie_id=payload.movie_id,
        screen_id=payload.screen_id,
        start_time=payload.start_time,
        price=payload.price,
        duration_mins=movie.duration_mins,
    )
    return showtime

@router.get("/screens", response_model=list[ScreenOut])
def get_screens(db: Session = Depends(get_db)):
    return crud.list_screens(db)

@router.get("/{showtime_id}/seats", response_model=SeatMapOut)
def get_seats(showtime_id: int, db: Session = Depends(get_db)):
    result = crud.get_seat_map(db, showtime_id)
    if not result:
        raise HTTPException(status_code=404, detail="Showtime not found")
    screen, ss_rows = result
    db.commit()  # commit cleanup/init changes

    from ..models import Showtime as ShowtimeModel
    showtime = db.query(ShowtimeModel).filter(ShowtimeModel.id == showtime_id).first()
    movie = showtime.movie

    return {
        "showtime_id": showtime_id,
        "price": showtime.price,
        "start_time": showtime.start_time,
        "end_time": showtime.end_time,
        "movie": {
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "duration_mins": movie.duration_mins,
            "language": movie.language,
            "genre": movie.genre,
            "poster_url": movie.poster_url,
            "release_date": movie.release_date,
        },
        "screen": {
            "id": screen.id,
            "theater_id": screen.theater_id,
            "name": screen.name,
            "total_rows": screen.total_rows,
            "total_cols": screen.total_cols,
            "theater": {
                "id": screen.theater.id if screen.theater else None,
                "name": screen.theater.name if screen.theater else "",
                "city": screen.theater.city if screen.theater else "",
                "address": screen.theater.address if screen.theater else None,
            } if screen.theater else None
        },
        "seats": [
            {
                "seat": {
                    "id": r.seat.id,
                    "screen_id": r.seat.screen_id,
                    "seat_row": r.seat.seat_row,
                    "seat_col": r.seat.seat_col,
                    "seat_type": r.seat.seat_type,
                },
                "status": r.status.value,
                "locked_until": r.locked_until,
            }
            for r in ss_rows
        ],
    }

@router.post("/{showtime_id}/lock-seats", response_model=LockSeatsOut)
def lock_seats(showtime_id: int, body: LockSeatsIn, db: Session = Depends(get_db)):
    try:
        locked = crud.lock_seats(db, showtime_id, body.seat_ids)
        db.commit()
        return {
            "showtime_id": showtime_id,
            "locked_seat_ids": locked,
            "lock_ttl_seconds": settings.LOCK_TTL_SECONDS
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(e))
