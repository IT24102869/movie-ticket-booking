from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class MovieIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    duration_mins: int = Field(default=90, ge=1)
    language: Optional[str] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    release_date: Optional[date] = None

class MovieOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration_mins: int
    language: Optional[str] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    release_date: Optional[date] = None

class TheaterOut(BaseModel):
    id: int
    name: str
    city: str
    address: Optional[str] = None

class ScreenOut(BaseModel):
    id: int
    theater_id: int
    name: str
    total_rows: int
    total_cols: int
    theater: Optional[TheaterOut] = None

class ShowtimeIn(BaseModel):
    movie_id: int
    screen_id: int
    start_time: datetime
    price: Decimal = Field(ge=0)

class ShowtimeOut(BaseModel):
    id: int
    movie_id: int
    screen_id: int
    start_time: datetime
    end_time: datetime
    price: Decimal
    screen: Optional[ScreenOut] = None

class SeatOut(BaseModel):
    id: int
    screen_id: int
    seat_row: str
    seat_col: int
    seat_type: str

class ShowtimeSeatOut(BaseModel):
    seat: SeatOut
    status: Literal["AVAILABLE", "LOCKED", "BOOKED"]
    locked_until: Optional[datetime] = None

class SeatMapOut(BaseModel):
    showtime_id: int
    screen: ScreenOut
    seats: List[ShowtimeSeatOut]
    price: Decimal
    start_time: datetime
    end_time: datetime
    movie: MovieOut

class LockSeatsIn(BaseModel):
    seat_ids: List[int] = Field(min_length=1)

class LockSeatsOut(BaseModel):
    showtime_id: int
    locked_seat_ids: List[int]
    lock_ttl_seconds: int

class CreateBookingIn(BaseModel):
    showtime_id: int
    seat_ids: List[int] = Field(min_length=1)

class BookingSeatOut(BaseModel):
    seat: SeatOut

class BookingOut(BaseModel):
    id: int
    user_id: int
    showtime: ShowtimeOut
    movie: MovieOut
    status: str
    total_amount: Decimal
    created_at: datetime
    seats: List[BookingSeatOut]
