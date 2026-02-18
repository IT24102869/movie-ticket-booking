from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import Rating, Movie

MIN_RATINGS_FOR_SVD = 5


def get_recommendations(db: Session, user_id: int, limit: int = 10) -> list[dict]:
    all_ratings = db.execute(select(Rating)).scalars().all()

    if len(all_ratings) < MIN_RATINGS_FOR_SVD:
        return _popularity_fallback(db, user_id, limit)

    user_ids = sorted({r.user_id for r in all_ratings})
    movie_ids = sorted({r.movie_id for r in all_ratings})

    if user_id not in user_ids:
        return _genre_popularity_fallback(db, user_id, limit)

    user_idx = {uid: i for i, uid in enumerate(user_ids)}
    movie_idx = {mid: i for i, mid in enumerate(movie_ids)}

    try:
        import numpy as np
    except ImportError:
        return _popularity_fallback(db, user_id, limit)

    n_users = len(user_ids)
    n_movies = len(movie_ids)
    matrix = np.zeros((n_users, n_movies))

    for r in all_ratings:
        matrix[user_idx[r.user_id], movie_idx[r.movie_id]] = r.score

    row_means = np.where(
        (matrix > 0).sum(axis=1, keepdims=True) > 0,
        matrix.sum(axis=1, keepdims=True) / np.maximum((matrix > 0).sum(axis=1, keepdims=True), 1),
        0,
    )
    centered = matrix.copy()
    centered[matrix > 0] -= np.broadcast_to(row_means, matrix.shape)[matrix > 0]

    k = min(10, min(n_users, n_movies) - 1)
    if k < 1:
        return _popularity_fallback(db, user_id, limit)

    U, sigma, Vt = np.linalg.svd(centered, full_matrices=False)
    U_k = U[:, :k]
    sigma_k = np.diag(sigma[:k])
    Vt_k = Vt[:k, :]

    predicted = U_k @ sigma_k @ Vt_k + row_means

    ui = user_idx[user_id]
    user_rated_movie_ids = {r.movie_id for r in all_ratings if r.user_id == user_id}

    candidates = []
    for mid, mi in movie_idx.items():
        if mid not in user_rated_movie_ids:
            candidates.append((mid, float(predicted[ui, mi])))

    candidates.sort(key=lambda x: x[1], reverse=True)
    top = candidates[:limit]

    movies_map = {m.id: m for m in db.execute(select(Movie)).scalars().all()}
    results = []
    for mid, score in top:
        movie = movies_map.get(mid)
        if not movie:
            continue
        results.append({
            "movie": movie,
            "predicted_score": round(max(1.0, min(5.0, score)), 2),
        })
    return results


def _popularity_fallback(db: Session, user_id: int, limit: int) -> list[dict]:
    from sqlalchemy import func as sqlfunc

    user_rated = {r.movie_id for r in db.execute(
        select(Rating.movie_id).where(Rating.user_id == user_id)
    ).scalars().all()}

    rows = db.execute(
        select(Rating.movie_id, sqlfunc.avg(Rating.score).label("avg"), sqlfunc.count().label("cnt"))
        .group_by(Rating.movie_id)
        .order_by(sqlfunc.avg(Rating.score).desc(), sqlfunc.count().desc())
    ).all()

    movies_map = {m.id: m for m in db.execute(select(Movie)).scalars().all()}
    results = []
    for row in rows:
        if row.movie_id in user_rated:
            continue
        movie = movies_map.get(row.movie_id)
        if movie:
            results.append({"movie": movie, "predicted_score": round(float(row.avg), 2)})
        if len(results) >= limit:
            break

    if len(results) < limit:
        for movie in db.execute(select(Movie).order_by(Movie.id.desc())).scalars().all():
            if movie.id not in user_rated and not any(r["movie"].id == movie.id for r in results):
                results.append({"movie": movie, "predicted_score": 3.0})
            if len(results) >= limit:
                break

    return results


def _genre_popularity_fallback(db: Session, user_id: int, limit: int) -> list[dict]:
    return _popularity_fallback(db, user_id, limit)
