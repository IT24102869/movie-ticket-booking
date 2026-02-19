from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sqlfunc
from ..db import get_db
from .. import crud
from ..models import Rating, Movie
from ..schemas import RatingIn, RatingOut, RatingWithMovieOut, MovieStatsOut, RecommendationOut

router = APIRouter(prefix="/ratings", tags=["ratings"])

DEMO_USER_ID = 1


@router.post("", response_model=RatingOut)
def rate_movie(body: RatingIn, db: Session = Depends(get_db)):
    movie = crud.get_movie(db, body.movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    crud.ensure_demo_user(db)
    rating = crud.upsert_rating(db, DEMO_USER_ID, body.movie_id, body.score)
    return rating


@router.get("/me", response_model=list[RatingWithMovieOut])
def my_ratings(db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    ratings = crud.list_user_ratings(db, DEMO_USER_ID)
    results = []
    for r in ratings:
        movie = crud.get_movie(db, r.movie_id)
        if movie:
            results.append({
                "id": r.id,
                "user_id": r.user_id,
                "movie_id": r.movie_id,
                "score": r.score,
                "movie": movie,
            })
    return results


@router.get("/movie/{movie_id}", response_model=RatingOut)
def my_rating_for_movie(movie_id: int, db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    rating = crud.get_user_rating(db, DEMO_USER_ID, movie_id)
    if not rating:
        raise HTTPException(status_code=404, detail="No rating found")
    return rating


@router.get("/movie/{movie_id}/stats", response_model=MovieStatsOut)
def movie_stats(movie_id: int, db: Session = Depends(get_db)):
    row = db.execute(
        select(
            sqlfunc.avg(Rating.score).label("avg_score"),
            sqlfunc.count(Rating.id).label("count"),
        ).where(Rating.movie_id == movie_id)
    ).first()
    return {
        "movie_id": movie_id,
        "avg_score": float(row.avg_score) if row.avg_score else 0.0,
        "count": row.count or 0,
    }


@router.delete("/movie/{movie_id}")
def remove_rating(movie_id: int, db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    deleted = crud.delete_rating(db, DEMO_USER_ID, movie_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No rating found")
    return {"ok": True}


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(limit: int = Query(default=10, ge=1, le=50), db: Session = Depends(get_db)):
    crud.ensure_demo_user(db)
    from ..recommender import get_recommendations
    recs = get_recommendations(db, DEMO_USER_ID, limit)
    return recs
