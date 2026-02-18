from __future__ import annotations

from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Numeric,
    UniqueConstraint, func
)
from sqlalchemy.orm import relationship, Mapped
from .db import Base
import enum

class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class ShowtimeSeatStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LOCKED = "LOCKED"
    BOOKED = "BOOKED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    bookings = relationship("Booking", back_populates="user")
    ratings = relationship("Rating", back_populates="user")

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_mins = Column(Integer, nullable=False, default=90)
    language = Column(String(100), nullable=True)
    genre = Column(String(100), nullable=True)
    poster_url = Column(String(500), nullable=True)
    release_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    showtimes = relationship("Showtime", back_populates="movie")
    ratings = relationship("Rating", back_populates="movie")

class Theater(Base):
    __tablename__ = "theaters"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(String(500), nullable=True)

    screens = relationship("Screen", back_populates="theater")

class Screen(Base):
    __tablename__ = "screens"
    id = Column(Integer, primary_key=True)
    theater_id = Column(Integer, ForeignKey("theaters.id"), nullable=False)
    name = Column(String(100), nullable=False)
    total_rows = Column(Integer, nullable=False, default=10)
    total_cols = Column(Integer, nullable=False, default=12)

    theater = relationship("Theater", back_populates="screens")
    seats = relationship("Seat", back_populates="screen", cascade="all, delete-orphan")
    showtimes = relationship("Showtime", back_populates="screen")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True)
    screen_id = Column(Integer, ForeignKey("screens.id"), nullable=False)
    seat_row = Column(String(5), nullable=False)  # e.g., A
    seat_col = Column(Integer, nullable=False)    # e.g., 1
    seat_type = Column(String(20), nullable=False, default="REGULAR")

    screen = relationship("Screen", back_populates="seats")

    __table_args__ = (
        UniqueConstraint("screen_id", "seat_row", "seat_col", name="uq_screen_seat"),
    )

class Showtime(Base):
    __tablename__ = "showtimes"
    id = Column(Integer, primary_key=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    screen_id = Column(Integer, ForeignKey("screens.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    price = Column(Numeric(10, 2), nullable=False, default=10.00)

    movie = relationship("Movie", back_populates="showtimes")
    screen = relationship("Screen", back_populates="showtimes")
    booking = relationship("Booking", back_populates="showtime")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    showtime_id = Column(Integer, ForeignKey("showtimes.id"), nullable=False)
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.CONFIRMED)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="bookings")
    showtime = relationship("Showtime", back_populates="booking")
    seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")

class BookingSeat(Base):
    __tablename__ = "booking_seats"
    booking_id = Column(Integer, ForeignKey("bookings.id"), primary_key=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), primary_key=True)

    booking = relationship("Booking", back_populates="seats")
    seat = relationship("Seat")

class ShowtimeSeat(Base):
    __tablename__ = "showtime_seats"
    showtime_id = Column(Integer, ForeignKey("showtimes.id"), primary_key=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), primary_key=True)
    status = Column(Enum(ShowtimeSeatStatus), nullable=False, default=ShowtimeSeatStatus.AVAILABLE)
    locked_until = Column(DateTime, nullable=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)

    seat = relationship("Seat")
