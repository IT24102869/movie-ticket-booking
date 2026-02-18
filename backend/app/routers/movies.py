from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud
from ..schemas import MovieIn, MovieOut, ShowtimeOut

router = APIRouter(prefix="/movies", tags=["movies"])

@router.post("", response_model=MovieOut, status_code=201)
def create_movie(payload: MovieIn, db: Session = Depends(get_db)):
    return crud.create_movie(db, **payload.model_dump())

@router.get("", response_model=list[MovieOut])
def get_movies(db: Session = Depends(get_db)):
    return crud.list_movies(db)

@router.get("/{movie_id}", response_model=MovieOut)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = crud.get_movie(db, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.put("/{movie_id}", response_model=MovieOut)
def update_movie(movie_id: int, payload: MovieIn, db: Session = Depends(get_db)):
    movie = crud.update_movie(db, movie_id, **payload.model_dump())
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.delete("/{movie_id}", status_code=204)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_movie(db, movie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Movie not found")

@router.get("/{movie_id}/showtimes", response_model=list[ShowtimeOut])
def get_showtimes_for_movie(
    movie_id: int,
    date: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    try:
        day = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format (expected YYYY-MM-DD)")
    day_start = day
    day_end = day + timedelta(days=1)
    return crud.list_showtimes_for_movie(db, movie_id, day_start, day_end)
